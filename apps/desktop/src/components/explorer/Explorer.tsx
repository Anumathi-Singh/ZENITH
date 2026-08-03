import FileTree from "./FileTree";
import SidebarSection from "./SidebarSection";
import { fileTree } from "./treeData";

export default function Explorer() {
  return (
    <section
      className="
        rounded-3xl
        bg-white
        border
        border-purple-100
        p-5
        overflow-auto
      "
    >
      <h2 className="text-lg font-bold mb-5">
        EXPLORER
      </h2>

      <SidebarSection
        title="🌙 LUNARIS PROJECT"
        defaultOpen
      >
        <FileTree nodes={fileTree} />
      </SidebarSection>
    </section>
  );
}