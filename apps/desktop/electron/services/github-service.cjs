const fs = require("node:fs/promises");
const path = require("node:path");

function serviceError(message, code = "GITHUB_OPERATION_FAILED") {
  return Object.assign(new Error(message), { code });
}

function parseGitHubRemote(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  let owner;
  let repository;
  const scpMatch = /^git@github\.com:([^/\s]+)\/([^/\s]+?)\/?$/i.exec(trimmed);
  if (scpMatch) {
    owner = scpMatch[1];
    repository = scpMatch[2];
  } else {
    let url;
    try { url = new URL(trimmed); } catch { return null; }
    if (!(["https:", "ssh:"].includes(url.protocol)) || url.hostname.toLowerCase() !== "github.com" || url.password || (url.protocol === "https:" && url.username)) return null;
    const segments = url.pathname.replace(/^\/+|\/+$/g, "").split("/");
    if (segments.length !== 2) return null;
    [owner, repository] = segments;
  }
  repository = repository.replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(owner) || !/^[A-Za-z0-9_.-]+$/.test(repository)) return null;
  return { owner, repo: repository, fullName: `${owner}/${repository}`, url: `https://github.com/${owner}/${repository}` };
}

function validateCloneUrl(value) {
  if (typeof value !== "string" || !value.trim() || /[\0\r\n]/.test(value)) throw serviceError("Enter a valid repository URL.", "INVALID_REPOSITORY_URL");
  const trimmed = value.trim();
  if (/^[\w.-]+@[\w.-]+:[^\s]+$/.test(trimmed)) return trimmed;
  let url;
  try { url = new URL(trimmed); } catch { throw serviceError("Use a valid HTTPS or SSH Git repository URL.", "INVALID_REPOSITORY_URL"); }
  if (!(["https:", "ssh:"].includes(url.protocol)) || url.password || (url.protocol === "https:" && url.username) || !url.hostname) throw serviceError("Use a credential-free HTTPS or SSH Git repository URL.", "INVALID_REPOSITORY_URL");
  return url.toString();
}

function repositoryNameFromUrl(value) {
  const withoutQuery = value.split(/[?#]/, 1)[0].replace(/[\\/]+$/, "");
  const name = withoutQuery.slice(Math.max(withoutQuery.lastIndexOf("/"), withoutQuery.lastIndexOf(":")) + 1).replace(/\.git$/i, "");
  if (!/^[A-Za-z0-9_.-]+$/.test(name) || name === "." || name === "..") throw serviceError("The repository URL does not contain a valid project name.", "INVALID_REPOSITORY_URL");
  return name;
}

function validateRepositoryName(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name || name.length > 100 || name === "." || name === ".." || !/^[A-Za-z0-9._-]+$/.test(name)) {
    throw serviceError("Repository names may contain letters, numbers, dots, hyphens, and underscores.", "INVALID_REPOSITORY_NAME");
  }
  return name;
}

function validateGitHubWebUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw serviceError("GitHub returned an invalid repository URL.", "INVALID_GITHUB_URL"); }
  if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password) throw serviceError("Zenith refused to open an untrusted URL.", "INVALID_GITHUB_URL");
  return url.toString();
}

class GitHubService {
  constructor(options) {
    this.auth = options.auth;
    this.api = options.api;
    this.git = options.git;
    this.workspace = options.workspace;
    this.credentialEnvironment = options.credentialEnvironment;
    this.onProgress = options.onProgress || (() => {});
    this.authorizedCloneParents = new Set();
    this.completedClones = new Set();
    this.cloneController = null;
  }

  requireToken() {
    const token = this.auth.getGitHubToken();
    if (!token) throw serviceError("Connect GitHub to continue.", "GITHUB_AUTH_REQUIRED");
    return token;
  }

  async getAuthenticatedUser() {
    return this.api.getCurrentUser(this.requireToken());
  }

  async listUserRepositories(options) {
    return this.api.listRepositories(this.requireToken(), options || {});
  }

  async getRepositoryFromCurrentWorkspace() {
    let remotes;
    try { remotes = await this.git.remotes(); } catch (error) {
      if (["NOT_GIT_REPOSITORY", "NO_WORKSPACE"].includes(error?.code)) return null;
      throw error;
    }
    const matches = remotes.map((remote) => ({ remote, parsed: parseGitHubRemote(remote.fetchUrl) })).filter((item) => item.parsed);
    if (!matches.length) return null;
    const selected = matches.find((item) => item.remote.name === "origin") || matches[0];
    const token = this.auth.getGitHubToken();
    if (!token) return { ...selected.parsed, remoteName: selected.remote.name, cloneUrl: selected.remote.fetchUrl, metadata: null };
    const metadata = await this.api.getRepository(token, selected.parsed.owner, selected.parsed.repo);
    return { ...selected.parsed, remoteName: selected.remote.name, cloneUrl: selected.remote.fetchUrl, metadata };
  }

  async createRepository(options) {
    const name = validateRepositoryName(options?.name);
    const description = typeof options?.description === "string" ? options.description.trim().slice(0, 350) : "";
    return this.api.createRepository(this.requireToken(), { name, description, private: Boolean(options?.private) });
  }

  async authorizeCloneParent(candidate) {
    const resolved = await fs.realpath(path.resolve(candidate));
    const info = await fs.stat(resolved);
    if (!info.isDirectory()) throw serviceError("Choose a destination folder.", "INVALID_CLONE_DESTINATION");
    this.authorizedCloneParents.add(resolved);
    return { path: resolved, name: path.basename(resolved) };
  }

  async cloneRepository(options) {
    if (this.cloneController) throw serviceError("A repository clone is already in progress.", "CLONE_IN_PROGRESS");
    const repositoryUrl = validateCloneUrl(options?.repositoryUrl);
    const parent = await fs.realpath(path.resolve(String(options?.destinationParent || "")));
    if (!this.authorizedCloneParents.has(parent)) throw serviceError("Choose the clone destination through Zenith first.", "CLONE_DESTINATION_NOT_AUTHORIZED");
    const destination = path.join(parent, repositoryNameFromUrl(repositoryUrl));
    try {
      await fs.access(destination);
      throw serviceError("A file or folder with this repository name already exists in the destination.", "CLONE_DESTINATION_EXISTS");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const controller = new AbortController();
    this.cloneController = controller;
    this.onProgress({ operation: "clone", stage: "cloning", message: "Cloning repository…" });
    try {
      const githubRemote = parseGitHubRemote(repositoryUrl);
      const token = githubRemote && repositoryUrl.startsWith("https:") ? this.auth.getGitHubToken() : null;
      const env = token ? await this.credentialEnvironment.forToken(token) : {};
      await this.git.cloneRepository(repositoryUrl, destination, { signal: controller.signal, env, onProgress: (message) => this.onProgress({ operation: "clone", stage: "cloning", message }) });
      const realDestination = await fs.realpath(destination);
      this.completedClones.add(realDestination);
      this.authorizedCloneParents.delete(parent);
      this.onProgress({ operation: "clone", stage: "complete", message: "Repository cloned." });
      return { path: realDestination, name: path.basename(realDestination), repositoryUrl };
    } finally {
      this.cloneController = null;
    }
  }

  cancelClone() {
    if (!this.cloneController) return false;
    this.cloneController.abort();
    return true;
  }

  async openClonedWorkspace(candidate) {
    const resolved = await fs.realpath(path.resolve(candidate));
    if (!this.completedClones.has(resolved)) throw serviceError("Only a repository cloned by this Zenith session can be opened here.", "CLONE_PATH_NOT_AUTHORIZED");
    const workspace = await this.workspace.open(resolved);
    this.completedClones.delete(resolved);
    return workspace;
  }

  async publishCurrentWorkspace(options) {
    if (!options?.confirmed) throw serviceError("Confirm repository creation before publishing.", "PUBLISH_CONFIRMATION_REQUIRED");
    const statusResponse = await this.git.status();
    if (!statusResponse.isRepository || !statusResponse.status) throw serviceError("The open workspace is not a Git repository.", "NOT_GIT_REPOSITORY");
    if (!statusResponse.status.branch.oid || !statusResponse.status.branch.name || statusResponse.status.branch.detached) {
      throw serviceError("Create at least one commit on a named branch before publishing.", "PUBLISH_BRANCH_REQUIRED");
    }
    const remotes = await this.git.remotes();
    if (remotes.some((remote) => remote.name === "origin")) throw serviceError("This repository already has an origin remote. Zenith will not overwrite it.", "ORIGIN_ALREADY_EXISTS");

    const token = this.requireToken();
    this.onProgress({ operation: "publish", stage: "creating", message: "Creating GitHub repository…" });
    const repository = await this.api.createRepository(token, {
      name: validateRepositoryName(options.name),
      description: typeof options.description === "string" ? options.description.trim().slice(0, 350) : "",
      private: Boolean(options.private),
    });
    const result = { stage: "created", repository, remoteAdded: false, pushed: false, error: null };
    try {
      this.onProgress({ operation: "publish", stage: "remote", message: "Adding origin remote…" });
      await this.git.addRemote("origin", repository.cloneUrl);
      result.stage = "remote-added";
      result.remoteAdded = true;
    } catch (error) {
      result.error = { code: error?.code || "GIT_REMOTE_FAILED", message: `Repository created, but Zenith could not add origin: ${error instanceof Error ? error.message : "Git failed."}` };
      return result;
    }
    try {
      this.onProgress({ operation: "publish", stage: "pushing", message: "Pushing the initial branch…" });
      const env = await this.credentialEnvironment.forToken(token);
      await this.git.pushUpstream("origin", statusResponse.status.branch.name, { env });
      result.stage = "complete";
      result.pushed = true;
      this.onProgress({ operation: "publish", stage: "complete", message: "Repository published." });
      return result;
    } catch (error) {
      result.error = { code: error?.code || "GIT_PUSH_FAILED", message: `Repository created and origin added, but the initial push failed: ${error instanceof Error ? error.message : "Git failed."}` };
      return result;
    }
  }

  validateExternalUrl(value) {
    return validateGitHubWebUrl(value);
  }
}

module.exports = { GitHubService, parseGitHubRemote, repositoryNameFromUrl, validateCloneUrl, validateGitHubWebUrl, validateRepositoryName };
