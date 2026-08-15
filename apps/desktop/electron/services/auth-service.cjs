const { EventEmitter } = require("node:events");

class AuthService extends EventEmitter {
  constructor(options) {
    super();
    this.tokenStore = options.tokenStore;
    this.githubAuth = options.githubAuth;
    this.githubApi = options.githubApi;
    this.credentials = null;
    this.session = null;
    this.pending = null;
    this.error = null;
    this.flowGeneration = 0;
    this.initialized = false;
  }

  providerState() {
    return {
      github: {
        available: true,
        configured: this.githubAuth.isConfigured(),
        authenticated: Boolean(this.session),
        secureStorageAvailable: this.tokenStore.isAvailable(),
      },
      google: { available: false, configured: false, authenticated: false },
      microsoft: { available: false, configured: false, authenticated: false },
      zenith: { available: false, configured: false, authenticated: false },
    };
  }

  getState() {
    return {
      session: this.session,
      pending: this.pending,
      providers: this.providerState(),
      error: this.error,
    };
  }

  emitChanged() {
    this.emit("changed", this.getState());
  }

  async initialize() {
    if (this.initialized) return this.getState();
    this.initialized = true;
    if (!this.tokenStore.isAvailable()) return this.getState();
    let saved;
    try {
      saved = await this.tokenStore.load();
    } catch (error) {
      if (error?.code === "SECURE_STORAGE_CORRUPT") {
        try { await this.tokenStore.clear(); } catch { /* the state remains safely signed out */ }
        this.error = { code: error.code, message: "The saved GitHub session was invalid and has been cleared." };
      }
      return this.getState();
    }
    if (!saved) return this.getState();
    try {
      const user = await this.githubApi.getCurrentUser(saved.accessToken);
      this.credentials = saved;
      this.session = { provider: "github", authenticated: true, user };
    } catch (error) {
      this.credentials = null;
      this.session = null;
      if (error?.code === "GITHUB_UNAUTHORIZED") {
        try { await this.tokenStore.clear(); } catch { /* invalid token remains unusable in memory */ }
        this.error = { code: error.code, message: "Your saved GitHub session is no longer valid. Sign in again." };
      } else {
        this.error = { code: error?.code || "GITHUB_SESSION_UNAVAILABLE", message: "Zenith could not validate the saved GitHub session while offline. Local features remain available." };
      }
    }
    return this.getState();
  }

  getGitHubToken() {
    return this.credentials?.accessToken || null;
  }

  async signInGitHub() {
    if (!this.tokenStore.isAvailable()) {
      throw Object.assign(new Error("Secure credential storage is unavailable, so Zenith will not start GitHub sign-in."), { code: "SECURE_STORAGE_UNAVAILABLE" });
    }
    if (this.pending) throw Object.assign(new Error("GitHub authentication is already in progress."), { code: "GITHUB_AUTH_IN_PROGRESS" });
    this.error = null;
    const generation = ++this.flowGeneration;
    const { challenge, completion } = await this.githubAuth.begin();
    this.pending = { provider: "github", ...challenge };
    this.emitChanged();
    void completion.then(async (credentials) => {
      if (generation !== this.flowGeneration) return;
      const user = await this.githubApi.getCurrentUser(credentials.accessToken);
      await this.tokenStore.save(credentials);
      if (generation !== this.flowGeneration) return;
      this.credentials = credentials;
      this.session = { provider: "github", authenticated: true, user };
      this.pending = null;
      this.error = null;
      this.emitChanged();
    }).catch((error) => {
      if (generation !== this.flowGeneration) return;
      this.credentials = null;
      this.session = null;
      this.pending = null;
      this.error = { code: error?.code || "GITHUB_AUTH_FAILED", message: error instanceof Error ? error.message : "GitHub sign-in failed." };
      this.emitChanged();
    });
    return this.getState();
  }

  cancelGitHubSignIn() {
    if (!this.pending) return this.getState();
    this.flowGeneration += 1;
    this.githubAuth.cancel();
    this.pending = null;
    this.error = null;
    this.emitChanged();
    return this.getState();
  }

  async signOut(provider) {
    if (provider !== "github") throw Object.assign(new Error("This account provider is not available."), { code: "PROVIDER_UNAVAILABLE" });
    this.flowGeneration += 1;
    this.githubAuth.cancel();
    this.pending = null;
    this.credentials = null;
    this.session = null;
    this.error = null;
    await this.tokenStore.clear();
    this.emitChanged();
    return this.getState();
  }

  async invalidateGitHubSession(message = "Your GitHub session is no longer valid. Sign in again.") {
    this.flowGeneration += 1;
    this.githubAuth.cancel();
    this.pending = null;
    this.credentials = null;
    this.session = null;
    this.error = { code: "GITHUB_UNAUTHORIZED", message };
    try { await this.tokenStore.clear(); } catch { /* the credential is already removed from memory */ }
    this.emitChanged();
    return this.getState();
  }

  dispose() {
    this.flowGeneration += 1;
    this.githubAuth.cancel();
    this.removeAllListeners();
  }
}

module.exports = { AuthService };
