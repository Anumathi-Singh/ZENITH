import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
} from "lucide-react";

import { useEditorStore } from "../editor/editorStore";
import type { FileTab } from "../editor/editorStore";

import type { FileNode } from "./treeData";


interface Props {
  nodes: FileNode[];
}


export default function FileTree({ nodes }: Props) {

  const openTab = useEditorStore(
    (state) => state.openTab
  );


  return (
    <div className="space-y-1">

      {nodes.map((node)=>(
        <TreeNode
          key={node.id}
          node={node}
          openTab={openTab}
        />
      ))}

    </div>
  );
}



function TreeNode({
  node,
  openTab,
}:{
  node: FileNode;
  openTab:(file:FileTab)=>void;
}) {


  const [open,setOpen] = useState(false);



  if(node.type==="folder"){

    return (
      <div>

        <button
          onClick={()=>setOpen(!open)}
          className="
          w-full
          flex
          items-center
          gap-2
          px-2
          py-1.5
          rounded-lg
          hover:bg-purple-50
          text-sm
          "
        >

          {
            open
            ?
            <ChevronDown size={15}/>
            :
            <ChevronRight size={15}/>
          }


          <Folder
            size={15}
            className="text-violet-500"
          />

          {node.name}

        </button>



        {
          open && node.children &&
          (
            <div className="ml-5">

              <FileTree
                nodes={node.children}
              />

            </div>
          )
        }


      </div>
    );
  }




  return (

    <button

      onClick={()=>openTab({

        id:node.id,

        name:node.name,

        language:
          node.language ?? "plaintext",

        content:
          node.content ?? "",

      })}


      className="
      w-full
      flex
      items-center
      gap-2
      px-2
      py-1.5
      rounded-lg
      hover:bg-purple-50
      text-sm
      "
    >

      <FileText
        size={15}
        className="text-purple-500"
      />

      {node.name}

    </button>

  );
}