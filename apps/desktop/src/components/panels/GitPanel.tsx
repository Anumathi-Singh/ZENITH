import { useEffect } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Check, ChevronDown, ChevronRight, CircleAlert, Copy, ExternalLink, GitBranch, GitFork, LogOut, Minus, Plus, RefreshCw } from "lucide-react";
import type { ZenithGitChange } from "../../types/zenith-desktop";
import { useWorkspaceStore } from "../explorer/workspaceStore";
import { useGitStore } from "./gitStore";
import { useAuthStore } from "../auth/authStore";
import { useGitHubStore } from "./githubStore";
import { notify, useUiStore } from "../ui/uiStore";

function ChangeRow({ change, action, actionLabel, actionIcon }: { change: ZenithGitChange; action: () => void; actionLabel: string; actionIcon: "stage" | "unstage" }) {
  const segments = change.path.split("/");
  const name = segments.pop() ?? change.path;
  const parent = segments.join("/");
  return <div className="git-change-row"><span className={`git-change-kind ${change.kind}`}>{change.kind === "untracked" ? "U" : change.kind === "conflicted" ? "!" : change.kind[0].toUpperCase()}</span><span><strong>{name}</strong>{parent && <small>{parent}</small>}</span><button title={actionLabel} aria-label={`${actionLabel} ${change.path}`} onClick={action}>{actionIcon === "stage" ? <Plus size={14} /> : <Minus size={14} />}</button></div>;
}

function ChangeGroup({ title, changes, actionLabel, actionIcon, action, allAction, allLabel }: { title: string; changes: ZenithGitChange[]; actionLabel: string; actionIcon: "stage" | "unstage"; action: (path: string) => Promise<void>; allAction: () => Promise<void>; allLabel: string }) {
  if (!changes.length) return null;
  return <section className="git-change-group"><header><span><ChevronDown size={13} />{title}<small>{changes.length}</small></span><button title={allLabel} aria-label={allLabel} onClick={() => void allAction()}>{actionIcon === "stage" ? <Plus size={14} /> : <Minus size={14} />}</button></header>{changes.map((change) => <ChangeRow key={`${title}:${change.path}:${change.kind}`} change={change} action={() => void action(change.path)} actionLabel={actionLabel} actionIcon={actionIcon} />)}</section>;
}

export default function GitPanel() {
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const { available, version, isRepository, status, loading, operation, error, commitMessage, setCommitMessage, refresh, initialize, stage, unstage, stageAll, unstageAll, commit, fetch, pull, push } = useGitStore();
  const { session, signOut } = useAuthStore();
  const { repository: githubRepository, loading: githubLoading, error: githubError, refreshRepository, clear: clearGitHub } = useGitHubStore();
  const openDialog = useUiStore((state) => state.openDialog);

  useEffect(() => {
    if (rootPath && isRepository) void refreshRepository();
    else clearGitHub();
  }, [clearGitHub, isRepository, refreshRepository, rootPath, session?.user.id, status?.repositoryRoot]);

  const workingChanges = status ? [...status.conflicts, ...status.unstaged, ...status.untracked] : [];
  const branchLabel = status?.branch.detached ? `Detached at ${status.branch.oid?.slice(0, 7) ?? "HEAD"}` : status?.branch.name ?? "No commits yet";

  return <section className="zenith-side-panel git-panel"><header className="panel-header"><div><p className="eyebrow">WORKSPACE</p><h2>Source Control</h2></div><button className="panel-header-action" title="Refresh source control" aria-label="Refresh source control" disabled={!rootPath || loading} onClick={() => void refresh()}><RefreshCw className={loading ? "spin" : ""} size={16} /></button></header>
    {!rootPath ? <div className="git-empty-state"><GitBranch size={28} /><strong>Open a project to use source control</strong><p>Select a real project folder first.</p></div>
      : available === false ? <div className="git-empty-state"><CircleAlert size={28} /><strong>Git is unavailable</strong><p>Install Git and make sure it is available on PATH.</p></div>
      : !isRepository ? <><div className="git-branch"><GitBranch size={15} /><span>Not a Git repository</span></div><div className="git-empty-state"><GitBranch size={28} /><strong>Initialize this workspace</strong><p>Create a local Git repository in {rootPath}.</p><button className="secondary-action" disabled={Boolean(operation)} onClick={() => void initialize()}><Plus size={14} />Initialize Repository</button>{version && <small>Git {version}</small>}</div></>
      : status && <><div className="git-branch"><GitBranch size={15} /><span>{branchLabel}</span>{status.branch.ahead > 0 && <small>↑{status.branch.ahead}</small>}{status.branch.behind > 0 && <small>↓{status.branch.behind}</small>}</div>
        <div className="git-commit-box"><textarea aria-label="Commit message" placeholder="Commit message" value={commitMessage} onChange={(event) => setCommitMessage(event.target.value)} /><button disabled={!status.staged.length || !commitMessage.trim() || Boolean(operation)} onClick={() => void commit()}><Check size={14} />{operation === "committing" ? "Committing…" : "Commit"}</button></div>
        {status.clean ? <div className="git-clean"><Check size={22} /><strong>No changes</strong><span>Your working tree is clean.</span></div> : <><ChangeGroup title="Staged Changes" changes={status.staged} actionLabel="Unstage" actionIcon="unstage" action={unstage} allAction={unstageAll} allLabel="Unstage all changes" /><ChangeGroup title="Changes" changes={workingChanges} actionLabel="Stage" actionIcon="stage" action={stage} allAction={stageAll} allLabel="Stage all changes" /></>}
        <div className="git-remote-actions"><button disabled={Boolean(operation)} onClick={() => void fetch()}><RefreshCw size={13} />Fetch</button><button disabled={Boolean(operation)} onClick={() => void pull()}><ArrowDownToLine size={13} />Pull</button><button disabled={Boolean(operation)} onClick={() => void push()}><ArrowUpFromLine size={13} />Push</button></div>
        {status.branch.upstream && <p className="git-upstream"><ChevronRight size={12} />{status.branch.upstream}</p>}
      </>}
    {operation && operation !== "committing" && <p className="git-operation" role="status">Git is {operation}…</p>}
    <section className="github-connection"><header><span><GitFork size={15} />GitHub</span><small>{session ? `@${session.user.login}` : "Not Connected"}</small></header>{session ? <><div className="github-account-row">{session.user.avatarUrl && <img src={session.user.avatarUrl} alt="" />}<span><strong>{session.user.name || session.user.login}</strong><small>@{session.user.login}</small></span></div>{githubLoading ? <p>Loading repository metadata…</p> : githubRepository ? <><div className="github-repository-row"><strong>{githubRepository.fullName}</strong><small>{githubRepository.metadata ? `${githubRepository.metadata.visibility}${githubRepository.metadata.archived ? " · archived" : ""}` : githubRepository.remoteName}</small></div><div className="github-actions"><button onClick={() => void window.zenithDesktop?.github.openExternal(githubRepository.url)}><ExternalLink size={13} />Open</button><button onClick={() => { void window.zenithDesktop?.copyText(githubRepository.cloneUrl); notify("Remote URL copied.", "success"); }}><Copy size={13} />Copy URL</button></div></> : isRepository ? <button className="secondary-action" onClick={() => openDialog("repository", "publish")}><ArrowUpFromLine size={13} />Publish Repository</button> : null}<div className="github-actions"><button onClick={() => openDialog("repository", "clone")}><ArrowDownToLine size={13} />Clone</button><button onClick={() => void signOut("github")}><LogOut size={13} />Sign Out</button></div></> : <><p>Connect GitHub for repository metadata, private clone, and publish.</p><button className="secondary-action" onClick={() => openDialog("github")}><GitFork size={13} />Connect GitHub</button><button className="github-clone-offline" onClick={() => openDialog("repository", "clone")}><ArrowDownToLine size={13} />Clone a public repository</button></>}{githubError && <p className="git-error" role="alert"><CircleAlert size={13} />{githubError}</p>}</section>
    {error && <p className="git-error" role="alert"><CircleAlert size={13} />{error}</p>}
  </section>;
}
