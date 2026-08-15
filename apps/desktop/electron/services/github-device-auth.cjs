const { setTimeout: delay } = require("node:timers/promises");

const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";

function timedSignal(signal, timeoutMs = 15_000) {
  if (typeof AbortSignal.any === "function" && typeof AbortSignal.timeout === "function") return AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  return signal;
}

function authError(message, code = "GITHUB_AUTH_FAILED") {
  return Object.assign(new Error(message), { code });
}

function assertGitHubVerificationUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw authError("GitHub returned an invalid verification URL.", "GITHUB_AUTH_RESPONSE_INVALID"); }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || !url.pathname.startsWith("/login/device")) {
    throw authError("GitHub returned an untrusted verification URL.", "GITHUB_AUTH_RESPONSE_INVALID");
  }
  return url.toString();
}

async function readJson(response, fallbackMessage) {
  let body;
  try { body = await response.json(); } catch { throw authError(fallbackMessage, "GITHUB_AUTH_RESPONSE_INVALID"); }
  if (!response.ok) throw authError(typeof body?.error_description === "string" ? body.error_description : fallbackMessage, "GITHUB_AUTH_NETWORK_ERROR");
  return body;
}

class GitHubDeviceAuth {
  constructor(options = {}) {
    this.clientId = String(options.clientId || "").trim();
    this.fetch = options.fetch || globalThis.fetch;
    this.openExternal = options.openExternal;
    this.active = null;
    this.scopes = options.scopes || ["repo"];
  }

  isConfigured() {
    return Boolean(this.clientId);
  }

  async requestDeviceCode(signal) {
    let response;
    try {
      response = await this.fetch(DEVICE_CODE_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Zenith-Desktop" },
        body: new URLSearchParams({ client_id: this.clientId, scope: this.scopes.join(" ") }),
        signal: timedSignal(signal),
      });
    } catch (error) {
      if (signal.aborted) throw authError("GitHub sign-in was cancelled.", "GITHUB_AUTH_CANCELLED");
      throw authError("Zenith could not contact GitHub to start sign-in.", "GITHUB_AUTH_NETWORK_ERROR");
    }
    const body = await readJson(response, "GitHub could not start the sign-in flow.");
    if (typeof body.device_code !== "string" || typeof body.user_code !== "string" || typeof body.verification_uri !== "string") {
      throw authError("GitHub returned an incomplete sign-in response.", "GITHUB_AUTH_RESPONSE_INVALID");
    }
    return {
      deviceCode: body.device_code,
      userCode: body.user_code,
      verificationUri: assertGitHubVerificationUrl(body.verification_uri),
      expiresIn: Math.min(Math.max(Number(body.expires_in) || 900, 60), 1800),
      interval: Math.min(Math.max(Number(body.interval) || 5, 5), 30),
    };
  }

  async pollForToken(flow, signal) {
    const deadline = Date.now() + flow.expiresIn * 1000;
    let intervalSeconds = flow.interval;
    while (Date.now() < deadline) {
      try { await delay(intervalSeconds * 1000, undefined, { signal }); } catch { throw authError("GitHub sign-in was cancelled.", "GITHUB_AUTH_CANCELLED"); }
      let response;
      try {
        response = await this.fetch(ACCESS_TOKEN_URL, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Zenith-Desktop" },
          body: new URLSearchParams({ client_id: this.clientId, device_code: flow.deviceCode, grant_type: "urn:ietf:params:oauth:grant-type:device_code" }),
          signal: timedSignal(signal),
        });
      } catch {
        if (signal.aborted) throw authError("GitHub sign-in was cancelled.", "GITHUB_AUTH_CANCELLED");
        throw authError("Zenith lost contact with GitHub during sign-in.", "GITHUB_AUTH_NETWORK_ERROR");
      }
      const body = await readJson(response, "GitHub could not complete sign-in.");
      if (typeof body.access_token === "string" && body.access_token) {
        return { accessToken: body.access_token, tokenType: body.token_type || "bearer", scope: body.scope || "" };
      }
      if (body.error === "authorization_pending") continue;
      if (body.error === "slow_down") { intervalSeconds = Math.min(intervalSeconds + 5, 30); continue; }
      if (body.error === "access_denied") throw authError("GitHub authorization was denied.", "GITHUB_AUTH_DENIED");
      if (body.error === "expired_token") throw authError("The GitHub sign-in code expired. Start sign-in again.", "GITHUB_AUTH_TIMEOUT");
      throw authError(typeof body.error_description === "string" ? body.error_description : "GitHub could not complete sign-in.");
    }
    throw authError("GitHub sign-in timed out. Start sign-in again.", "GITHUB_AUTH_TIMEOUT");
  }

  async begin() {
    if (!this.isConfigured()) throw authError("GitHub authentication is not configured. Set GITHUB_CLIENT_ID first.", "GITHUB_AUTH_NOT_CONFIGURED");
    if (this.active) throw authError("GitHub authentication is already in progress.", "GITHUB_AUTH_IN_PROGRESS");
    if (typeof this.fetch !== "function" || typeof this.openExternal !== "function") throw authError("GitHub authentication is unavailable in this build.", "GITHUB_AUTH_UNAVAILABLE");

    const controller = new AbortController();
    this.active = { controller };
    try {
      const flow = await this.requestDeviceCode(controller.signal);
      await this.openExternal(flow.verificationUri);
      const completion = this.pollForToken(flow, controller.signal).finally(() => {
        if (this.active?.controller === controller) this.active = null;
      });
      this.active.completion = completion;
      return {
        challenge: { userCode: flow.userCode, verificationUri: flow.verificationUri, expiresAt: Date.now() + flow.expiresIn * 1000 },
        completion,
      };
    } catch (error) {
      if (this.active?.controller === controller) this.active = null;
      throw error;
    }
  }

  cancel() {
    if (!this.active) return false;
    this.active.controller.abort();
    this.active = null;
    return true;
  }
}

module.exports = { GitHubDeviceAuth, assertGitHubVerificationUrl, authError };
