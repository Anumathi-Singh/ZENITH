import { GitFork, GitBranch, GitPullRequest, FolderGit2, Plus } from "lucide-react";
import { useUiStore } from "../ui/uiStore";
import { useWorkspaceStore } from "../explorer/workspaceStore";

export default function GitPanel() {
  const { openDialog } = useUiStore();
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  return <section className="zenith-side-panel"><header className="panel-header"><div><p className="eyebrow">WORKSPACE</p><h2>Source Control</h2></div><button className="panel-header-action" title="Source control actions" onClick={() => openDialog("repository", "initialize")}><Plus size={16} /></button></header><div className="git-branch"><GitBranch size={15} /><span>{rootPath ? "Repository status unavailable" : "No workspace open"}</span></div><div className="git-empty-state"><FolderGit2 size={28} /><strong>{rootPath ? "Git is not connected" : "Open a project to use source control"}</strong><p>{rootPath ? "Zenith will show changes, branches, and commits when the local Git service is connected." : "Select a real project folder first, then connect Git when you are ready."}</p><button className="secondary-action" onClick={() => openDialog("repository", "clone")}><GitFork size={14} />Clone repository</button><button className="secondary-action" onClick={() => openDialog("repository", "initialize")}><GitPullRequest size={14} />Initialize repository</button><button className="secondary-action" onClick={() => openDialog("github")}><GitFork size={14} />Connect GitHub</button></div></section>;
}

