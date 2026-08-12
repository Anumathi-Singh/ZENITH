import Breadcrumb from "./Breadcrumb";
import EditorTabs from "./EditorTabs";
import MonacoEditor from "./MonacoEditor";

export default function Editor() {
  return <section className="editor-panel"><EditorTabs /><Breadcrumb /><div className="editor-content"><MonacoEditor /></div></section>;
}
