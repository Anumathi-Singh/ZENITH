import type { FileTab } from "../editor/editorStore";

export const files: FileTab[] = [
  {
    id: "app",
    name: "App.tsx",
    language: "typescript",
    content: `export default function App() {
  return <h1>Hello Zenith 🚀</h1>;
}`,
  },
  {
    id: "main",
    name: "main.tsx",
    language: "typescript",
    content: `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(<App />);
`,
  },
  {
    id: "readme",
    name: "README.md",
    language: "markdown",
    content: `# Zenith

The AI-first IDE.

Built with ❤️ by Team Zenith.
`,
  },
];