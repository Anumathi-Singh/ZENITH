const fs = require("node:fs/promises");
const path = require("node:path");
const { runProcess } = require("../process-runner.cjs");

const SCRIPT_NAME = /^(build|check|lint|test|typecheck)(:[a-z0-9:_-]+)?$/i;
const DANGEROUS = /(?:^|[\s;&|])(rm|rmdir|del|erase|format|shutdown|reg|regedit|curl|wget|invoke-webrequest|powershell|pwsh|git\s+(?:reset|clean|push)|npm\s+publish|pnpm\s+publish|yarn\s+publish)(?:\s|$)/i;
function validationError(message, code = "AI_VALIDATION_ERROR") { return Object.assign(new Error(message), { code }); }

class AIValidationService {
  constructor(workspace, options = {}) { this.workspace = workspace; this.runner = options.runner || runProcess; }
  async discover() {
    const root = this.workspace.requireRoot(); let manifest;
    try { manifest = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")); }
    catch (error) { if (error?.code === "ENOENT") return []; throw validationError("Zenith could not read package.json for validation."); }
    return Object.entries(manifest.scripts || {}).filter(([name, command]) => SCRIPT_NAME.test(name) && typeof command === "string" && command.length <= 2000 && !DANGEROUS.test(command)).slice(0, 20).map(([name]) => ({ id: `npm-script:${name}`, label: `npm run ${name}`, executable: process.platform === "win32" ? "npm.cmd" : "npm", args: ["run", name] }));
  }
  async execute(commandIds, options = {}) {
    const available = new Map((await this.discover()).map((command) => [command.id, command]));
    const approved = new Set(Array.isArray(options.approvedCommandIds) ? options.approvedCommandIds : []);
    const unique = [...new Set(Array.isArray(commandIds) ? commandIds : [])].slice(0, 10); const results = [];
    for (const id of unique) {
      const command = available.get(id);
      if (!command) throw validationError("The AI requested a command that is not in the safe package-script allowlist.", "AI_COMMAND_REJECTED");
      if (!approved.has(id)) throw validationError("A validation command was not approved.", "AI_COMMAND_NOT_APPROVED");
      const result = await this.runner(command.executable, command.args, { cwd: this.workspace.requireRoot(), timeoutMs: 120_000, maxOutputBytes: 2 * 1024 * 1024, signal: options.signal, onStdout: options.onOutput, onStderr: options.onOutput });
      results.push({ id, label: command.label, exitCode: result.exitCode, stdout: result.stdout.slice(-16_000), stderr: result.stderr.slice(-16_000), passed: result.exitCode === 0 });
    }
    return results;
  }
}
module.exports = { AIValidationService, DANGEROUS, SCRIPT_NAME, validationError };
