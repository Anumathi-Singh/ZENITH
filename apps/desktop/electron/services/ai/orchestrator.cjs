const crypto = require("node:crypto");
const { EventEmitter } = require("node:events");
const { parseStructured, validateCode, validateDocs, validatePlan, validateReview, validateTests } = require("./structured-output.cjs");
const { prompts, schemas } = require("./prompts.cjs");

const validators = { planner: validatePlan, coder: validateCode, reviewer: validateReview, tester: validateTests, docs: validateDocs };
const ACTIVE = new Set(["gathering_context", "planning", "coding", "reviewing", "awaiting_approval", "applying", "testing", "documenting"]);
function orchestrationError(message, code = "AI_ORCHESTRATION_ERROR") { return Object.assign(new Error(message), { code }); }
function publicProposal(proposal) { return { id: proposal.id, operation: proposal.operation, path: proposal.path, relativePath: proposal.relativePath, reason: proposal.reason, originalHash: proposal.originalHash, diff: proposal.diff }; }

class AIOrchestrator extends EventEmitter {
  constructor(options) {
    super(); Object.assign(this, options); this.runs = new Map();
  }
  emitEvent(run, type, payload = {}) {
    const event = { runId: run.id, type, at: new Date().toISOString(), ...payload };
    run.events.push(event); if (run.events.length > 250) run.events.shift(); this.emit("event", event);
  }
  transition(run, status, agent, message) {
    run.status = status; run.agent = agent || null; run.message = message || "";
    this.emitEvent(run, "run.status", { status, agent: run.agent, message: run.message });
  }
  snapshot(run) {
    return { id: run.id, status: run.status, agent: run.agent, message: run.message, createdAt: run.createdAt, completedAt: run.completedAt || null, request: run.input.message, proposals: (run.proposals || []).map(publicProposal), commands: run.commands || [], validation: run.validation || [], summary: run.summary || "", error: run.error || null, usage: run.usage };
  }
  getRun(runId) { const run = this.runs.get(runId); if (!run) throw orchestrationError("The AI run was not found.", "AI_RUN_NOT_FOUND"); return run; }
  async completeStructured(run, agent, input) {
    const credentials = await this.config.credentials(); const provider = this.registry.get(credentials.providerId);
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (run.controller.signal.aborted) throw orchestrationError("The AI run was cancelled.", "AI_CANCELLED");
      let queued = ""; let timer = null;
      const flush = () => { if (!queued) return; this.emitEvent(run, "agent.message.delta", { agent, delta: queued }); queued = ""; timer = null; };
      try {
        const result = await provider.complete({ apiKey: credentials.apiKey, model: credentials.model, system: prompts[agent], input: `${input}${attempt ? "\nThe prior response was invalid. Return only a value matching the required schema." : ""}`, schema: schemas[agent], schemaName: `zenith_${agent}_result`, maxOutputTokens: agent === "coder" ? 8000 : 3000, signal: run.controller.signal, onDelta: (delta) => { queued += delta; if (!timer) timer = setTimeout(flush, 50); } });
        if (timer) clearTimeout(timer); flush();
        if (result.usage) run.usage.push({ agent, ...result.usage });
        const value = parseStructured(result.text, validators[agent]);
        this.emitEvent(run, "agent.message", { agent, message: value.summary || `${agent} completed.` });
        return value;
      } catch (error) {
        if (timer) clearTimeout(timer); flush(); lastError = error;
        if (error?.code !== "AI_INVALID_STRUCTURED_OUTPUT" || attempt === 1) throw error;
      }
    }
    throw lastError;
  }
  startRun(input = {}) {
    const message = String(input.message || "").trim();
    if (!message || message.length > 12_000) throw orchestrationError("Enter an AI request up to 12,000 characters.", "AI_INVALID_REQUEST");
    this.workspace.requireRoot();
    const run = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "gathering_context", agent: null, message: "Gathering targeted workspace context…", input: { ...input, message }, controller: new AbortController(), events: [], proposals: [], commands: [], validation: [], usage: [], approval: null, summary: "", error: null };
    this.runs.set(run.id, run); this.emitEvent(run, "run.created", { request: message });
    void this.execute(run).catch((error) => this.fail(run, error));
    return this.snapshot(run);
  }
  async execute(run) {
    this.transition(run, "gathering_context", null, "Gathering targeted workspace context…");
    let context = await this.tools.gatherInitial(run.input, run.controller.signal);
    this.transition(run, "planning", "planner", "Planner is analyzing the request…");
    const plan = await this.completeStructured(run, "planner", JSON.stringify(context));
    context = await this.tools.augment(context, plan, run.controller.signal);
    this.transition(run, "coding", "coder", "Coder is preparing an edit proposal…");
    let code = await this.completeStructured(run, "coder", JSON.stringify({ request: run.input.message, plan, context }));
    let proposals = await this.edits.prepare(code.edits);
    for (let reviewAttempt = 0; reviewAttempt < 2; reviewAttempt += 1) {
      this.transition(run, "reviewing", "reviewer", `Reviewer is checking the proposal${reviewAttempt ? " again" : ""}…`);
      const review = await this.completeStructured(run, "reviewer", JSON.stringify({ request: run.input.message, plan, proposals: proposals.map(publicProposal) }));
      if (review.approved) break;
      if (reviewAttempt === 1) throw orchestrationError("The proposal did not pass review after one revision.", "AI_REVIEW_LIMIT");
      this.transition(run, "coding", "coder", "Coder is revising the proposal…");
      code = await this.completeStructured(run, "coder", JSON.stringify({ request: run.input.message, plan, context, reviewIssues: review.issues, previousProposal: proposals.map(publicProposal) }));
      proposals = await this.edits.prepare(code.edits);
    }
    run.proposals = proposals; run.commands = await this.validation.discover();
    this.transition(run, "awaiting_approval", null, "Review the proposed edits before anything is written.");
    this.emitEvent(run, "edits.proposed", { proposals: proposals.map(publicProposal), commands: run.commands });
    const approval = await new Promise((resolve, reject) => { run.approval = { resolve, reject }; });
    run.approval = null;
    this.transition(run, "applying", null, "Applying approved edits…");
    const applied = await this.edits.apply(proposals, { dirtyPaths: approval.dirtyPaths }); run.appliedPaths = applied.appliedPaths;
    this.emitEvent(run, "edits.applied", { paths: applied.appliedPaths });
    this.transition(run, "testing", "tester", "Tester is selecting approved validation checks…");
    const testPlan = await this.completeStructured(run, "tester", JSON.stringify({ request: run.input.message, availableCommands: run.commands, changedFiles: proposals.map((item) => item.relativePath) }));
    run.validation = await this.validation.execute(testPlan.commandIds, { approvedCommandIds: approval.approvedCommandIds, signal: run.controller.signal, onOutput: (output) => this.emitEvent(run, "validation.output", { output: String(output).slice(-4000) }) });
    this.emitEvent(run, "validation.completed", { results: run.validation });
    this.transition(run, "documenting", "docs", "Docs is checking documentation impact…");
    const docs = await this.completeStructured(run, "docs", JSON.stringify({ request: run.input.message, changedFiles: proposals.map((item) => item.relativePath), validation: run.validation }));
    const passed = run.validation.every((result) => result.passed);
    run.summary = `${code.summary} ${run.validation.length ? `${run.validation.filter((item) => item.passed).length}/${run.validation.length} approved checks passed.` : "No approved validation script was selected."} ${docs.summary}`.trim();
    run.status = passed ? "completed" : "failed"; run.completedAt = new Date().toISOString(); run.agent = null; run.message = passed ? "AI run completed." : "AI run completed with failing checks.";
    this.emitEvent(run, "run.completed", { status: run.status, summary: run.summary, validation: run.validation, appliedPaths: run.appliedPaths });
    await this.conversations.append({ id: run.id, createdAt: run.createdAt, completedAt: run.completedAt, request: run.input.message, status: run.status, summary: run.summary, files: proposals.map((item) => item.relativePath) });
  }
  approve(runId, options = {}) {
    const run = this.getRun(runId); if (run.status !== "awaiting_approval" || !run.approval) throw orchestrationError("This AI run is not waiting for approval.", "AI_INVALID_STATE");
    const available = new Set(run.commands.map((command) => command.id));
    const approvedCommandIds = (Array.isArray(options.approvedCommandIds) ? options.approvedCommandIds : []).filter((id) => available.has(id));
    run.approval.resolve({ dirtyPaths: Array.isArray(options.dirtyPaths) ? options.dirtyPaths : [], approvedCommandIds });
    return this.snapshot(run);
  }
  reject(runId) { const run = this.getRun(runId); if (run.status !== "awaiting_approval") throw orchestrationError("This AI run is not waiting for approval.", "AI_INVALID_STATE"); return this.cancel(runId, "The proposed edits were rejected."); }
  cancel(runId, message = "The AI run was stopped.") {
    const run = this.getRun(runId); if (!ACTIVE.has(run.status)) return this.snapshot(run);
    run.controller.abort(); run.approval?.reject(orchestrationError(message, "AI_CANCELLED")); run.approval = null; run.status = "cancelled"; run.completedAt = new Date().toISOString(); run.agent = null; run.message = message;
    this.emitEvent(run, "run.cancelled", { message }); return this.snapshot(run);
  }
  cancelAll(message) { for (const run of this.runs.values()) if (ACTIVE.has(run.status)) this.cancel(run.id, message); }
  async fail(run, error) {
    if (run.status === "cancelled") return;
    run.status = error?.code === "AI_CANCELLED" ? "cancelled" : "failed"; run.completedAt = new Date().toISOString(); run.agent = null; run.error = { code: error?.code || "AI_ORCHESTRATION_ERROR", message: error instanceof Error ? error.message : String(error) }; run.message = run.error.message;
    this.emitEvent(run, run.status === "cancelled" ? "run.cancelled" : "run.failed", { error: run.error });
    await this.conversations.append({ id: run.id, createdAt: run.createdAt, completedAt: run.completedAt, request: run.input.message, status: run.status, summary: run.error.message, files: (run.proposals || []).map((item) => item.relativePath) }).catch(() => {});
  }
  listConversations() { return this.conversations.list(); }
  dispose() { this.cancelAll("Zenith is closing."); this.removeAllListeners(); }
}

module.exports = { ACTIVE, AIOrchestrator, orchestrationError, publicProposal };
