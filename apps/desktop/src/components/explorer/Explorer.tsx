import {
  Folder,
  FileCode2,
  ChevronDown
} from "lucide-react";


export default function Explorer() {

  return (
    <div
      className="
      rounded-3xl
      bg-[#FFFEFF]
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      p-5
      "
    >

      <h2 className="text-sm font-semibold text-gray-700 mb-5">
        EXPLORER
      </h2>


      <div className="flex items-center gap-2 text-sm font-medium mb-3">
        <ChevronDown size={15}/>
        🌙 LUNARIS PROJECT
      </div>


      <div className="ml-5 space-y-3 text-sm text-gray-500">

        <div className="flex items-center gap-2">
          <Folder size={16}/>
          src
        </div>


        <div className="ml-5 flex items-center gap-2">
          <Folder size={16}/>
          components
        </div>


        <div className="
          flex
          items-center
          gap-2
          px-3
          py-2
          rounded-xl
          bg-purple-100
          text-purple-600
        ">
          <FileCode2 size={16}/>
          App.tsx
        </div>


        <div className="flex items-center gap-2">
          <FileCode2 size={16}/>
          main.tsx
        </div>


      </div>

    </div>
  )
}