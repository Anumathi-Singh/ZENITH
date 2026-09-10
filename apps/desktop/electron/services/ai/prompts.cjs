const arrayOfStrings = { type: "array", maxItems: 20, items: { type: "string" } };
const schemas = {
  planner: { type: "object", additionalProperties: false, required: ["summary", "steps", "relevantFiles", "searchTerms"], properties: { summary: { type: "string" }, steps: { ...arrayOfStrings, maxItems: 12 }, relevantFiles: arrayOfStrings, searchTerms: { ...arrayOfStrings, maxItems: 12 } } },
  coder: { type: "object", additionalProperties: false, required: ["summary", "edits"], properties: { summary: { type: "string" }, edits: { type: "array", maxItems: 20, items: { type: "object", additionalProperties: false, required: ["operation", "path", "content", "reason"], properties: { operation: { type: "string", enum: ["modify", "create"] }, path: { type: "string" }, content: { type: "string" }, reason: { type: "string" } } } } } },
  reviewer: { type: "object", additionalProperties: false, required: ["approved", "summary", "issues"], properties: { approved: { type: "boolean" }, summary: { type: "string" }, issues: arrayOfStrings } },
  tester: { type: "object", additionalProperties: false, required: ["commandIds", "summary"], properties: { commandIds: { ...arrayOfStrings, maxItems: 10 }, summary: { type: "string" } } },
  docs: { type: "object", additionalProperties: false, required: ["needed", "summary"], properties: { needed: { type: "boolean" }, summary: { type: "string" } } },
};
const prompts = {
  planner: "You are Zenith Planner. Produce a concise implementation plan. Request only targeted workspace files and search terms. Never request secrets, the whole workspace, arbitrary shell commands, or hidden reasoning.",
  coder: "You are Zenith Coder. Return complete proposed file contents only for necessary create/modify edits. Paths must be relative to the workspace. Do not write files, run commands, expose hidden reasoning, or modify unrelated architecture.",
  reviewer: "You are Zenith Reviewer. Review the proposed edit bundle for correctness, security, scope, and regressions. Return a decision and concise actionable issues. Do not expose hidden reasoning.",
  tester: "You are Zenith Tester. Choose only command IDs supplied by Zenith. Never invent commands. Prefer the smallest relevant checks. Do not expose hidden reasoning.",
  docs: "You are Zenith Docs. State whether documentation is needed and give a concise documentation summary. Do not propose unapproved writes or expose hidden reasoning.",
};
module.exports = { prompts, schemas };
