const { OpenAIProvider } = require("./openai-provider.cjs");

class ProviderRegistry {
  constructor(providers = [new OpenAIProvider()]) {
    this.providers = new Map(providers.map((provider) => [provider.metadata().id, provider]));
  }
  list() { return [...this.providers.values()].map((provider) => provider.metadata()); }
  get(id) {
    const provider = this.providers.get(id);
    if (!provider) throw Object.assign(new Error("The selected AI provider is not supported."), { code: "AI_PROVIDER_UNSUPPORTED" });
    return provider;
  }
}

module.exports = { ProviderRegistry };
