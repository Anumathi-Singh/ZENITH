const API_ROOT = "https://api.github.com";

function githubError(message, code = "GITHUB_API_ERROR", details) {
  return Object.assign(new Error(message), { code, details });
}

function normalizeUser(user) {
  return {
    id: Number(user.id),
    login: String(user.login || ""),
    name: typeof user.name === "string" && user.name.trim() ? user.name : null,
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
    profileUrl: typeof user.html_url === "string" ? user.html_url : `https://github.com/${encodeURIComponent(String(user.login || ""))}`,
  };
}

function normalizeRepository(repository) {
  return {
    id: Number(repository.id),
    owner: String(repository.owner?.login || ""),
    name: String(repository.name || ""),
    fullName: String(repository.full_name || ""),
    url: String(repository.html_url || ""),
    cloneUrl: String(repository.clone_url || ""),
    sshUrl: String(repository.ssh_url || ""),
    defaultBranch: typeof repository.default_branch === "string" ? repository.default_branch : null,
    private: Boolean(repository.private),
    fork: Boolean(repository.fork),
    archived: Boolean(repository.archived),
    description: typeof repository.description === "string" ? repository.description : null,
    visibility: typeof repository.visibility === "string" ? repository.visibility : (repository.private ? "private" : "public"),
  };
}

class GitHubApiClient {
  constructor(options = {}) {
    this.fetch = options.fetch || globalThis.fetch;
  }

  async request(pathname, token, options = {}) {
    if (typeof token !== "string" || !token) throw githubError("Connect GitHub to continue.", "GITHUB_AUTH_REQUIRED");
    let response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      response = await this.fetch(`${API_ROOT}${pathname}`, {
        method: options.method || "GET",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Zenith-Desktop",
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } catch {
      throw githubError("Zenith could not reach GitHub. Check your connection and try again.", "GITHUB_NETWORK_ERROR");
    } finally {
      clearTimeout(timeout);
    }
    let body = null;
    if (response.status !== 204) {
      try { body = await response.json(); } catch { body = null; }
    }
    if (response.ok) return { body, headers: response.headers };

    const apiMessage = typeof body?.message === "string" ? body.message : "GitHub rejected the request.";
    if (response.status === 401) throw githubError("Your GitHub session is no longer valid. Sign in again.", "GITHUB_UNAUTHORIZED");
    if (response.status === 404) throw githubError("The GitHub repository or resource was not found.", "GITHUB_NOT_FOUND");
    if (response.status === 403) {
      const remaining = response.headers?.get?.("x-ratelimit-remaining");
      const resetValue = Number(response.headers?.get?.("x-ratelimit-reset"));
      if (remaining === "0") {
        const resetAt = Number.isFinite(resetValue) ? new Date(resetValue * 1000).toISOString() : null;
        throw githubError(resetAt ? `GitHub rate limit reached. Try again after ${resetAt}.` : "GitHub rate limit reached. Try again later.", "GITHUB_RATE_LIMITED", { resetAt });
      }
      throw githubError(apiMessage === "Resource not accessible by integration" ? "The connected GitHub account does not have permission for this action." : apiMessage, "GITHUB_FORBIDDEN");
    }
    if (response.status === 422) throw githubError(apiMessage, "GITHUB_VALIDATION_FAILED");
    throw githubError(apiMessage, "GITHUB_API_ERROR");
  }

  async getCurrentUser(token) {
    return normalizeUser((await this.request("/user", token)).body);
  }

  async getRepository(token, owner, repository) {
    const result = await this.request(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`, token);
    return normalizeRepository(result.body);
  }

  async listRepositories(token, options = {}) {
    const page = Math.min(Math.max(Number(options.page) || 1, 1), 1000);
    const perPage = Math.min(Math.max(Number(options.perPage) || 30, 1), 100);
    const query = new URLSearchParams({ affiliation: "owner,collaborator,organization_member", sort: "updated", direction: "desc", page: String(page), per_page: String(perPage) });
    const result = await this.request(`/user/repos?${query}`, token);
    return Array.isArray(result.body) ? result.body.map(normalizeRepository) : [];
  }

  async createRepository(token, options) {
    const result = await this.request("/user/repos", token, { method: "POST", body: { name: options.name, description: options.description || "", private: Boolean(options.private) } });
    return normalizeRepository(result.body);
  }
}

module.exports = { GitHubApiClient, githubError, normalizeRepository, normalizeUser };
