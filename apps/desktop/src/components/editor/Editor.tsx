import {
  FileCode2,
  X
} from "lucide-react";


export default function Editor() {

  return (
    <div
      className="
      rounded-3xl
      bg-[#FFFEFF]
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      overflow-hidden
      flex
      flex-col
      "
    >

      {/* Tabs */}

      <div
        className="
        h-12
        border-b
        border-purple-100
        flex
        items-center
        gap-2
        px-4
        "
      >

        <div
          className="
          h-full
          px-4
          flex
          items-center
          gap-2
          bg-purple-50
          text-purple-600
          border-b-2
          border-purple-400
          "
        >

          <FileCode2 size={15}/>
          App.tsx

          <X size={14}/>

        </div>


        <div
          className="
          px-4
          text-sm
          text-gray-400
          "
        >
          main.tsx
        </div>


        <div
          className="
          px-4
          text-sm
          text-gray-400
          "
        >
          README.md
        </div>


      </div>


      {/* Code Area */}

      <div
        className="
        flex-1
        p-6
        font-mono
        text-sm
        "
      >

        <div className="text-gray-400">
          1
        </div>


        <div>
          <span className="text-pink-400">
            import
          </span>{" "}
          React from
          <span className="text-green-400">
            "react"
          </span>
        </div>


        <br/>


        <div>
          <span className="text-purple-500">
            function
          </span>{" "}
          App()
          {" {"}
        </div>


        <div className="ml-6">

          return (

        </div>


        <div className="ml-12 text-blue-400">

          &lt;Zenith /&gt;

        </div>


        <div className="ml-6">

          )

        </div>


        <div>
          {"}"}
        </div>


      </div>


    </div>
  )
}