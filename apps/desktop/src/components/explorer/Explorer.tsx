import { ChevronDown } from "lucide-react";

import FileTree from "./FileTree";
import { fileTree } from "./treeData";


export default function Explorer(){

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



      <div

        className="
        flex
        items-center
        gap-2
        mb-4
        text-sm
        "

      >

        <ChevronDown size={16}/>

        🌙 LUNARIS PROJECT

      </div>



      <FileTree
        nodes={fileTree}
      />


    </section>

  );
}