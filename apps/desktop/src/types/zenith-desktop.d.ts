export interface ZenithDirectoryEntry { name: string; path: string; type: "file" | "folder"; }
export interface ZenithTerminalProfile { id: string; label: string; shell: string; }
export interface ZenithTerminalSession { id: string; cwd: string; profileId: string; profileLabel: string; shell: string; }
export type ZenithBackendResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };
export type ZenithGitChangeKind = "modified" | "added" | "deleted" | "renamed" | "copied" | "untracked" | "conflicted";
export interface ZenithGitChange { path: string; oldPath?: string; kind: ZenithGitChangeKind; staged: boolean; indexStatus: string; workingTreeStatus: string; }
export interface ZenithGitBranch { name: string | null; detached: boolean; upstream: string | null; ahead: number; behind: number; oid: string | null; }
export interface ZenithGitStatus { repositoryRoot: string; branch: ZenithGitBranch; staged: ZenithGitChange[]; unstaged: ZenithGitChange[]; untracked: ZenithGitChange[]; conflicts: ZenithGitChange[]; clean: boolean; }
export interface ZenithGitStatusResponse { available: boolean; version: string | null; isRepository: boolean; status: ZenithGitStatus | null; }
export interface ZenithGitRemote { name: string; fetchUrl: string; pushUrl: string; }
export interface ZenithGitCommit { hash: string; shortHash: string; author: string; email: string; date: string; subject: string; parents: string[]; }
export type ZenithAuthProvider = "github" | "google" | "microsoft" | "zenith";
export interface ZenithAuthUser { id: number; login: string; name: string | null; avatarUrl: string | null; profileUrl: string; }
export interface ZenithAuthSession { provider: "github"; authenticated: true; user: ZenithAuthUser; }
export interface ZenithProviderStatus { available: boolean; configured: boolean; authenticated: boolean; secureStorageAvailable?: boolean; }
export interface ZenithAuthState {
  session: ZenithAuthSession | null;
  pending: { provider: "github"; userCode: string; verificationUri: string; expiresAt: number } | null;
  providers: Record<ZenithAuthProvider, ZenithProviderStatus>;
  error: { code: string; message: string } | null;
}
export interface ZenithGitHubRepository {
  id: number; owner: string; name: string; fullName: string; url: string; cloneUrl: string; sshUrl: string;
  defaultBranch: string | null; private: boolean; fork: boolean; archived: boolean; description: string | null; visibility: string;
}
export interface ZenithGitHubWorkspaceRepository { owner: string; repo: string; fullName: string; url: string; remoteName: string; cloneUrl: string; metadata: ZenithGitHubRepository | null; }
export interface ZenithGitHubCloneResult { path: string; name: string; repositoryUrl: string; }
export interface ZenithGitHubPublishResult { stage: "created" | "remote-added" | "complete"; repository: ZenithGitHubRepository; remoteAdded: boolean; pushed: boolean; error: { code: string; message: string } | null; }
export interface ZenithGitHubProgress { operation: "clone" | "publish"; stage: string; message: string; }
export interface ZenithGitApi {
  getVersion: () => Promise<ZenithBackendResult<{ available: boolean; version: string | null }>>;
  getStatus: () => Promise<ZenithBackendResult<ZenithGitStatusResponse>>;
  stage: (paths: string[]) => Promise<ZenithBackendResult<void>>;
  unstage: (paths: string[]) => Promise<ZenithBackendResult<void>>;
  stageAll: () => Promise<ZenithBackendResult<void>>;
  unstageAll: () => Promise<ZenithBackendResult<void>>;
  commit: (message: string) => Promise<ZenithBackendResult<{ shortHash: string | null; message: string }>>;
  fetch: () => Promise<ZenithBackendResult<void>>;
  pull: () => Promise<ZenithBackendResult<void>>;
  push: () => Promise<ZenithBackendResult<void>>;
  listBranches: () => Promise<ZenithBackendResult<Array<{ name: string; current: boolean }>>>;
  checkoutBranch: (name: string) => Promise<ZenithBackendResult<void>>;
  createBranch: (name: string) => Promise<ZenithBackendResult<void>>;
  getRemotes: () => Promise<ZenithBackendResult<ZenithGitRemote[]>>;
  getHistory: (limit?: number, skip?: number) => Promise<ZenithBackendResult<ZenithGitCommit[]>>;
  init: () => Promise<ZenithBackendResult<{ repositoryRoot: string }>>;
  onStatusChanged: (listener: () => void) => () => void;
}
export interface ZenithAuthApi {
  getState: () => Promise<ZenithBackendResult<ZenithAuthState>>;
  startGitHubSignIn: () => Promise<ZenithBackendResult<ZenithAuthState>>;
  cancelGitHubSignIn: () => Promise<ZenithBackendResult<ZenithAuthState>>;
  signOut: (provider: ZenithAuthProvider) => Promise<ZenithBackendResult<ZenithAuthState>>;
  onChanged: (listener: (state: ZenithAuthState) => void) => () => void;
}
export interface ZenithGitHubApi {
  getCurrentUser: () => Promise<ZenithBackendResult<ZenithAuthUser>>;
  getRepositoryFromCurrentWorkspace: () => Promise<ZenithBackendResult<ZenithGitHubWorkspaceRepository | null>>;
  listRepositories: (options?: { page?: number; perPage?: number }) => Promise<ZenithBackendResult<ZenithGitHubRepository[]>>;
  selectCloneDestination: () => Promise<ZenithBackendResult<{ path: string; name: string } | null>>;
  cloneRepository: (options: { repositoryUrl: string; destinationParent: string }) => Promise<ZenithBackendResult<ZenithGitHubCloneResult>>;
  cancelClone: () => Promise<ZenithBackendResult<boolean>>;
  openClonedWorkspace: (path: string) => Promise<ZenithBackendResult<{ path: string; name: string }>>;
  createRepository: (options: { name: string; description?: string; private?: boolean }) => Promise<ZenithBackendResult<ZenithGitHubRepository>>;
  publishCurrentWorkspace: (options: { name: string; description?: string; private?: boolean; confirmed: boolean }) => Promise<ZenithBackendResult<ZenithGitHubPublishResult>>;
  openExternal: (url: string) => Promise<ZenithBackendResult<void>>;
  onProgress: (listener: (progress: ZenithGitHubProgress) => void) => () => void;
}
export interface ZenithDesktopApi {
  selectFolder: () => Promise<{ path: string; name: string } | null>;
  readDirectory: (directoryPath: string) => Promise<ZenithDirectoryEntry[]>;
  closeWorkspace: () => Promise<void>;
  readFile: (filePath: string) => Promise<string>;
  writeFile: (filePath: string, content: string) => Promise<void>;
  revealPath: (filePath: string) => Promise<void>;
  copyText: (text: string) => Promise<void>;
  getTerminalProfiles: () => Promise<ZenithTerminalProfile[]>;
  createTerminal: (profileId?: string) => Promise<ZenithTerminalSession>;
  terminalInput: (id: string, data: string) => Promise<void>;
  terminalResize: (id: string, cols: number, rows: number) => Promise<void>;
  killTerminal: (id: string) => Promise<void>;
  git: ZenithGitApi;
  auth: ZenithAuthApi;
  github: ZenithGitHubApi;
  minimizeWindow: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  onTerminalData: (listener: (payload: { id: string; data: string }) => void) => () => void;
  onTerminalExit: (listener: (payload: { id: string; exitCode: number; signal?: number }) => void) => () => void;
}
declare global { interface Window { zenithDesktop?: ZenithDesktopApi; } }
export {};



