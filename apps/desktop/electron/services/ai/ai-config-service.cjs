const fs = require("node:fs/promises");
const path = require("node:path");

const DEFAULTS = { providerId: "openai", model: "gpt-5-mini" };
function configError(message, code = "AI_CONFIG_ERROR") { return Object.assign(new Error(message), { code }); }
function validModel(value) { return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value); }

class AIConfigService {
  constructor(options) {
    this.filePath = options.filePath;
    this.keyStore = options.keyStore;
    this.registry = options.registry;
  }
  async readMetadata() {
    try {
      const parsed = JSON.parse(await fs.readFile(this.filePath, "utf8"));
      return { providerId: parsed.providerId || DEFAULTS.providerId, model: validModel(parsed.model) ? parsed.model : DEFAULTS.model };
    } catch (error) {
      if (error?.code === "ENOENT" || error instanceof SyntaxError) return { ...DEFAULTS };
      throw configError("Zenith could not read the AI provider settings.");
    }
  }
  async getSettings() {
    const metadata = await this.readMetadata();
    let configured = false;
    try { configured = Boolean(await this.keyStore.load()); }
    catch (error) { if (error?.code !== "SECURE_STORAGE_UNAVAILABLE") throw error; }
    return { ...metadata, configured, secureStorageAvailable: this.keyStore.isAvailable() };
  }
  async saveProviderConfig(input = {}) {
    const providerId = String(input.providerId || DEFAULTS.providerId);
    this.registry.get(providerId);
    const model = String(input.model || DEFAULTS.model).trim();
    if (!validModel(model)) throw configError("Enter a valid model name.", "AI_INVALID_MODEL");
    if (input.apiKey !== undefined) {
      const key = String(input.apiKey).trim();
      if (key.length < 12 || key.length > 512) throw configError("Enter a valid API key.", "AI_INVALID_CREDENTIAL");
      await this.keyStore.save(key);
    }
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, JSON.stringify({ providerId, model }, null, 2), "utf8");
    await fs.rename(temporary, this.filePath);
    return this.getSettings();
  }
  async credentials() {
    const settings = await this.readMetadata();
    const apiKey = await this.keyStore.load();
    if (!apiKey) throw configError("Configure an OpenAI API key in Settings before starting an AI run.", "AI_PROVIDER_NOT_CONFIGURED");
    return { ...settings, apiKey };
  }
  async testProvider(input = {}) {
    const stored = await this.credentials().catch(() => null);
    const providerId = String(input.providerId || stored?.providerId || DEFAULTS.providerId);
    const model = String(input.model || stored?.model || DEFAULTS.model);
    if (!validModel(model)) throw configError("Enter a valid model name.", "AI_INVALID_MODEL");
    const apiKey = String(input.apiKey || stored?.apiKey || "").trim();
    return this.registry.get(providerId).testConnection({ apiKey, model, signal: input.signal });
  }
  async removeProviderConfig() { await this.keyStore.clear(); return this.getSettings(); }
}

module.exports = { AIConfigService, DEFAULTS, validModel };
