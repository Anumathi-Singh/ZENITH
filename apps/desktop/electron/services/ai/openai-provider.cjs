const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

function providerError(message, code = "AI_PROVIDER_ERROR") {
  return Object.assign(new Error(message), { code });
}

function responseText(payload) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  return (payload?.output || []).flatMap((item) => item?.content || []).filter((part) => part?.type === "output_text").map((part) => part.text || "").join("");
}

async function readSse(response, options = {}) {
  if (!response.body) throw providerError("The AI provider returned an empty response.", "AI_PROVIDER_RESPONSE_ERROR");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let completed = null;
  const consume = (block) => {
    const data = block.split(/\r?\n/).filter((line) => line.startsWith("data:"));
    for (const line of data) {
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      let event;
      try { event = JSON.parse(raw); } catch { continue; }
      if (event.type === "response.output_text.delta" && typeof event.delta === "string") {
        text += event.delta;
        options.onDelta?.(event.delta);
      } else if (event.type === "response.completed") completed = event.response || null;
      else if (event.type === "error") throw providerError(event.message || "The AI provider reported an error.", "AI_PROVIDER_RESPONSE_ERROR");
    }
  };
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || "";
    for (const block of blocks) consume(block);
    if (done) break;
  }
  if (buffer.trim()) consume(buffer);
  return { text: text || responseText(completed), usage: completed?.usage || null, responseId: completed?.id || null };
}

class OpenAIProvider {
  constructor(options = {}) {
    this.fetch = options.fetch || globalThis.fetch;
    this.endpoint = OPENAI_RESPONSES_URL;
  }

  metadata() {
    return { id: "openai", name: "OpenAI", supportsStreaming: true, supportsStructuredOutput: true, defaultModel: "gpt-5-mini" };
  }

  async request(apiKey, body, options = {}) {
    if (typeof apiKey !== "string" || apiKey.length < 12) throw providerError("Configure a valid OpenAI API key in Settings.", "AI_PROVIDER_NOT_CONFIGURED");
    let response;
    try {
      response = await this.fetch(this.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: options.signal,
      });
    } catch (error) {
      if (error?.name === "AbortError") throw providerError("The AI request was cancelled.", "AI_CANCELLED");
      throw providerError("Zenith could not reach the AI provider. Check your connection and try again.", "AI_PROVIDER_NETWORK_ERROR");
    }
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw providerError("The OpenAI API key was rejected.", "AI_INVALID_CREDENTIAL");
      if (response.status === 429) throw providerError("The OpenAI rate limit or usage limit was reached.", "AI_RATE_LIMITED");
      throw providerError(`The AI provider request failed (${response.status}).`, "AI_PROVIDER_RESPONSE_ERROR");
    }
    return response;
  }

  async complete(options) {
    const body = {
      model: options.model,
      input: [{ role: "system", content: options.system }, { role: "user", content: options.input }],
      max_output_tokens: Math.min(Math.max(options.maxOutputTokens || 3000, 128), 8000),
      stream: true,
    };
    if (options.schema) body.text = { format: { type: "json_schema", name: options.schemaName || "zenith_result", strict: true, schema: options.schema } };
    return readSse(await this.request(options.apiKey, body, options), { onDelta: options.onDelta });
  }

  async testConnection(options) {
    const response = await this.request(options.apiKey, {
      model: options.model,
      input: "Reply with OK.",
      max_output_tokens: 16,
    }, options);
    const payload = await response.json();
    return { connected: true, model: options.model, responseId: payload.id || null };
  }
}

module.exports = { OPENAI_RESPONSES_URL, OpenAIProvider, providerError, readSse, responseText };
