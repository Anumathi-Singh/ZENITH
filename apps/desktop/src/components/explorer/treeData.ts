export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileNode[];
}


export const fileTree: FileNode[] = [
  {
    id: "src",
    name: "src",
    type: "folder",

    children: [
      {
        id: "app",
        name: "App.tsx",
        type: "file",
        language: "typescript",
        content: `export default function App() {
  return <h1>Hello Zenith 🚀</h1>;
}`,
      },

      {
        id: "main",
        name: "main.tsx",
        type: "file",
        language: "typescript",
        content: `import React from "react";

function main(){
  console.log("Zenith");
}
`,
      },

      {
        id: "components",
        name: "components",
        type: "folder",

        children: [
          {
            id: "editor",
            name: "editor",
            type: "folder",

            children: [
              {
                id: "monaco",
                name: "MonacoEditor.tsx",
                type: "file",
                language: "typescript",
                content: `export default function MonacoEditor(){
  return <div>Editor</div>
}`,
              },
            ],
          },
        ],
      },
    ],
  },


  {
    id: "readme",
    name: "README.md",
    type: "file",
    language: "markdown",
    content: `# Zenith

AI First IDE 🚀`,
  },
];