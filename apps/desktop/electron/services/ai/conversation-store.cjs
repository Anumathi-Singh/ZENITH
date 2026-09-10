const fs = require("node:fs/promises");
const path = require("node:path");

class AIConversationStore {
  constructor(filePath) { this.filePath = filePath; }
  async list() {
    try { const parsed = JSON.parse(await fs.readFile(this.filePath, "utf8")); return Array.isArray(parsed) ? parsed.slice(-50) : []; }
    catch (error) { if (error?.code === "ENOENT" || error instanceof SyntaxError) return []; throw error; }
  }
  async append(summary) {
    const conversations = await this.list();
    conversations.push({ id: summary.id, createdAt: summary.createdAt, completedAt: summary.completedAt || null, request: String(summary.request || "").slice(0, 2000), status: summary.status, summary: String(summary.summary || "").slice(0, 4000), files: (summary.files || []).slice(0, 30) });
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(conversations.slice(-50), null, 2), "utf8");
    await fs.rename(temporary, this.filePath);
  }
}
module.exports = { AIConversationStore };
