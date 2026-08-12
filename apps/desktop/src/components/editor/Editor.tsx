import Breadcrumb from "./Breadcrumb";
import EditorTabs from "./EditorTabs";
import MonacoEditor from "./MonacoEditor";
import SettingsView from "../settings/SettingsView";
import { useUiStore } from "../ui/uiStore";

export default function Editor() {
  const settingsOpen = useUiStore((state) => state.settingsOpen);
  if (settingsOpen) return <section className="editor-panel"><SettingsView /></section>;
  return <section className="editor-panel"><EditorTabs /><Breadcrumb /><div className="editor-content"><MonacoEditor /></div></section>;
}
