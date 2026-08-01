import TopBar from "./components/layout/TopBar";
import Workspace from "./components/layout/Workspace";
import Terminal from "./components/terminal/Terminal";
import StatusBar from "./components/layout/StatusBar";

export default function App() {
  return (
    <div className="h-screen bg-[#F8F6FC] p-4 flex flex-col gap-4">
      <TopBar />

      <Workspace />

      <Terminal />

      <StatusBar />
    </div>
  );
}