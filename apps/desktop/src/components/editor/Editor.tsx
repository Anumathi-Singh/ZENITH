import Breadcrumb from "./Breadcrumb";
import EditorTabs from "./EditorTabs";
import MonacoEditor from "./MonacoEditor";

export default function Editor() {
  return (
    <section
      className="editor-panel h-full w-full rounded-3xl bg-white border border-purple-100 shadow-[0_10px_30px_rgba(120,90,180,0.08)] overflow-hidden flex flex-col min-h-0"
    >
      <EditorTabs />
      <Breadcrumb />
      <div className="flex-1 min-h-0">
        <MonacoEditor />
      </div>
    </section>
  );
}
