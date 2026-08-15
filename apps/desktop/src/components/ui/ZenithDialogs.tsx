import { useState } from "react";
import { BookOpen, Cloud, FolderOpen, GitFork, KeyRound, LifeBuoy, Mail, ShieldAlert } from "lucide-react";
import Dialog from "./Dialog";
import { notify, useUiStore } from "./uiStore";
import zenithMark from "../../assets/logo/zenith-mark-transparent.png";
import { unwrapBackendResult, useAuthStore } from "../auth/authStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useGitStore } from "../panels/gitStore";
import { useGitHubStore } from "../panels/githubStore";
import type { RepositoryMode } from "./uiStore";
import type { ZenithGitHubCloneResult, ZenithGitHubPublishResult } from "../../types/zenith-desktop";

function messageFor(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function GitHubConnectionDialog() {
  const { closeDialog } = useUiStore();
  const { session, pending, providers, loading, error, startGitHubSignIn, cancelGitHubSignIn, signOut } = useAuthStore();
  const github = providers.github;
  const user = session?.user;
  const copyCode = () => {
    if (!pending) return;
    void window.zenithDesktop?.copyText(pending.userCode);
    notify("GitHub device code copied.", "success");
  };
  return <Dialog title={user ? "GitHub Account" : "Connect GitHub"} subtitle={user ? "Your secure GitHub connection" : "Authenticate in your system browser"} onClose={closeDialog} size="small"><div className="service-dialog">
    <div className="service-icon github-icon"><GitFork size={24} /></div>
    {user ? <><div className="connected-account-card">{user.avatarUrl && <img src={user.avatarUrl} alt="" />}<span><strong>{user.name || user.login}</strong><small>@{user.login}</small></span></div><button className="primary-dialog-action" disabled={loading} onClick={() => void signOut("github")}>Disconnect GitHub</button><small className="honest-note">Disconnecting removes Zenith’s encrypted credential only. Local repositories are unchanged.</small></>
      : pending ? <><p>GitHub opened in your browser. Enter this one-time code:</p><button className="device-code" onClick={copyCode} title="Copy code">{pending.userCode}</button><button className="primary-dialog-action" onClick={() => void window.zenithDesktop?.github.openExternal(pending.verificationUri)}>Open GitHub Again</button><button className="secondary-action" onClick={() => void cancelGitHubSignIn()}>Cancel Sign In</button><small className="honest-note">This code expires at {new Date(pending.expiresAt).toLocaleTimeString()}.</small></>
        : <><p>Connect GitHub to load your identity, repository metadata, clone private repositories, and publish projects. Zenith remains fully usable offline.</p><button className="primary-dialog-action" disabled={loading || !github.configured || !github.secureStorageAvailable} onClick={() => void startGitHubSignIn()}><GitFork size={16} />{loading ? "Starting GitHub…" : "Continue with GitHub"}</button>{!github.configured && <small className="honest-note"><ShieldAlert size={13} />Add GITHUB_CLIENT_ID to apps/desktop/.env and enable Device Flow for the Zenith OAuth app.</small>}{github.configured && !github.secureStorageAvailable && <small className="honest-note"><ShieldAlert size={13} />Secure OS credential storage is unavailable, so sign-in is disabled.</small>}{error && <p className="dialog-error" role="alert">{error.message}</p>}</>}
  </div></Dialog>;
}

function AuthDialog({ mode }: { mode: "signin" | "signup" | "forgot" }) {
  const { closeDialog, openDialog } = useUiStore();
  const title = mode === "forgot" ? "Recover your Zenith account" : mode === "signup" ? "Create a Zenith account" : "Sign in to Zenith";
  if (mode === "signin") return <Dialog title={title} subtitle="Choose a configured account provider or continue offline" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon"><KeyRound size={22} /></div><button className="primary-dialog-action" onClick={() => openDialog("github")}><GitFork size={16} />Continue with GitHub</button><p>Zenith’s dedicated account service is not configured yet. No email or password will be stored locally.</p><button className="secondary-action" onClick={closeDialog}>Continue Offline</button><div className="dialog-links"><button onClick={() => openDialog("auth", "signup")}>Create Zenith Account</button><button onClick={() => openDialog("auth", "forgot")}>Forgot password?</button></div></div></Dialog>;
  return <Dialog title={title} subtitle="Zenith account service is not configured yet" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon"><KeyRound size={22} /></div><p>A real Zenith authentication server does not exist in this phase, so this screen will not accept or persist credentials.</p><button className="primary-dialog-action" disabled>{mode === "forgot" ? "Recovery Unavailable" : "Account Creation Unavailable"}</button><div className="dialog-links"><button onClick={() => openDialog("auth", "signin")}>Back to sign in</button></div></div></Dialog>;
}

function RepositoryDialog({ mode }: { mode: RepositoryMode }) {
  const { closeDialog, openDialog } = useUiStore();
  const { rootName, openFolder, openClonedFolder } = useWorkspaceStore();
  const initialize = useGitStore((state) => state.initialize);
  const refreshGit = useGitStore((state) => state.refresh);
  const progress = useGitHubStore((state) => state.progress);
  const session = useAuthStore((state) => state.session);
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [destination, setDestination] = useState("");
  const [repositoryName, setRepositoryName] = useState(() => rootName.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "zenith-project");
  const [description, setDescription] = useState("");
  const [privateRepository, setPrivateRepository] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneResult, setCloneResult] = useState<ZenithGitHubCloneResult | null>(null);
  const [publishResult, setPublishResult] = useState<ZenithGitHubPublishResult | null>(null);

  const chooseDestination = async () => {
    const api = window.zenithDesktop?.github;
    if (!api) return;
    try {
      const selected = unwrapBackendResult(await api.selectCloneDestination());
      if (selected) setDestination(selected.path);
    } catch (cause) { setError(messageFor(cause, "Could not choose a clone destination.")); }
  };
  const clone = async () => {
    const api = window.zenithDesktop?.github;
    if (!api) return;
    setBusy(true); setError(null); setCloneResult(null);
    try {
      const result = unwrapBackendResult(await api.cloneRepository({ repositoryUrl, destinationParent: destination }));
      setCloneResult(result); notify("Repository cloned.", "success");
    } catch (cause) { const message = messageFor(cause, "Repository clone failed."); setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  };
  const publish = async () => {
    const api = window.zenithDesktop?.github;
    if (!api) return;
    setBusy(true); setError(null); setPublishResult(null);
    try {
      const result = unwrapBackendResult(await api.publishCurrentWorkspace({ name: repositoryName, description, private: privateRepository, confirmed }));
      setPublishResult(result);
      if (result.pushed) { notify("Repository published to GitHub.", "success"); await refreshGit(); }
      else if (result.error) { setError(result.error.message); notify(result.error.message, "warning"); }
    } catch (cause) { const message = messageFor(cause, "Could not publish this repository."); setError(message); notify(message, "error"); }
    finally { setBusy(false); }
  };

  if (mode === "open") return <Dialog title="Open Repository" subtitle="Select an existing local repository" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon"><FolderOpen size={22} /></div><p>Choose a local folder. Zenith will open it in the existing Explorer and detect Git automatically.</p><button className="primary-dialog-action" onClick={() => { void openFolder(); closeDialog(); }}>Open Folder</button></div></Dialog>;
  if (mode === "initialize") return <Dialog title="Initialize Repository" subtitle="Create a Git repository in the open workspace" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon"><GitFork size={22} /></div><p>This runs Git init only in the currently open workspace.</p><button className="primary-dialog-action" onClick={() => { void initialize(); closeDialog(); }}>Initialize Repository</button></div></Dialog>;
  if (mode === "publish") return <Dialog title="Publish Repository" subtitle="Create a new GitHub repository and push the current branch" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon github-icon"><GitFork size={22} /></div>{!session ? <><p>Connect GitHub to publish this local repository.</p><button className="primary-dialog-action" onClick={() => openDialog("github")}>Connect GitHub</button></> : <><label>Repository Name<input value={repositoryName} onChange={(event) => setRepositoryName(event.target.value)} /></label><label>Description<input value={description} maxLength={350} onChange={(event) => setDescription(event.target.value)} placeholder="Optional" /></label><label className="dialog-checkbox"><input type="checkbox" checked={privateRepository} onChange={(event) => setPrivateRepository(event.target.checked)} />Private repository</label><label className="dialog-checkbox"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Create this GitHub repository and add origin</label><button className="primary-dialog-action" disabled={busy || !repositoryName.trim() || !confirmed} onClick={() => void publish()}>{busy ? progress?.message || "Publishing…" : "Create and Publish"}</button>{publishResult && <div className="operation-result"><strong>{publishResult.pushed ? "Published" : "Partially published"}</strong><small>{publishResult.repository.fullName}</small><button onClick={() => void window.zenithDesktop?.github.openExternal(publishResult.repository.url)}>Open on GitHub</button></div>}{error && <p className="dialog-error" role="alert">{error}</p>}<small className="honest-note">Zenith never overwrites an existing origin and never force-pushes.</small></>}</div></Dialog>;
  return <Dialog title="Clone Repository" subtitle="Clone with native Git into a folder you choose" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon"><Cloud size={22} /></div><label>Repository URL<input value={repositoryUrl} onChange={(event) => setRepositoryUrl(event.target.value)} placeholder="https://github.com/owner/repository.git" /></label><label>Destination<div className="dialog-input-action"><input value={destination} readOnly placeholder="Choose a parent folder" /><button onClick={() => void chooseDestination()}>Choose</button></div></label><button className="primary-dialog-action" disabled={busy || !repositoryUrl.trim() || !destination} onClick={() => void clone()}>{busy ? progress?.message || "Cloning…" : "Clone Repository"}</button>{busy && <button className="secondary-action" onClick={() => void window.zenithDesktop?.github.cancelClone()}>Cancel Clone</button>}{cloneResult && <div className="operation-result"><strong>Repository cloned</strong><small>{cloneResult.path}</small><button onClick={() => { void openClonedFolder(cloneResult.path); closeDialog(); }}>Open in Zenith</button></div>}{error && <p className="dialog-error" role="alert">{error}</p>}<small className="honest-note">Private HTTPS clones use the connected GitHub credential only for the running Git process; it is never written into the remote URL.</small></div></Dialog>;
}

export default function ZenithDialogs() {
  const { dialog, closeDialog, openDialog } = useUiStore();
  if (!dialog) return null;
  if (dialog.name === "auth") return <AuthDialog mode={dialog.mode === "forgot" ? "forgot" : dialog.mode === "signup" ? "signup" : "signin"} />;
  if (dialog.name === "github") return <GitHubConnectionDialog />;
  if (dialog.name === "repository") return <RepositoryDialog mode={(dialog.mode as RepositoryMode) ?? "clone"} />;
  if (dialog.name === "shortcuts") return <Dialog title="Keyboard Shortcuts" subtitle="Core local commands available in Zenith" onClose={closeDialog}><div className="shortcut-list"><p><span>Command Palette</span><kbd>Ctrl K</kbd></p><p><span>Save active file</span><kbd>Ctrl S</kbd></p><p><span>Open Settings</span><kbd>Ctrl ,</kbd></p><p><span>Toggle Explorer</span><kbd>Ctrl Shift E</kbd></p><p><span>Toggle terminal</span><kbd>Ctrl `</kbd></p></div></Dialog>;
  if (dialog.name === "help") return <Dialog title="Zenith Help" subtitle="A calm workspace for building on your computer" onClose={closeDialog}><div className="help-grid"><button onClick={() => openDialog("shortcuts")}><KeyRound size={18} /><span><strong>Keyboard shortcuts</strong><small>Browse the available local commands.</small></span></button><button onClick={() => openDialog("about")}><BookOpen size={18} /><span><strong>About Zenith</strong><small>Product and desktop information.</small></span></button><button disabled><LifeBuoy size={18} /><span><strong>Get support</strong><small>Support will be available with online services.</small></span></button></div></Dialog>;
  return <Dialog title="About Zenith" subtitle="Code · Create · Elevate" onClose={closeDialog} size="small"><div className="service-dialog"><div className="service-icon zenith-about-mark"><Mail aria-hidden="true" /><img src={zenithMark} alt="Zenith" /></div><p>Zenith is a local-first desktop development workspace with files, tabs, Monaco editing, terminal sessions, local Git, and an optional secure GitHub connection.</p><small className="honest-note"><ShieldAlert size={13} />Online account features remain optional.</small></div></Dialog>;
}
