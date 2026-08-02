import { X } from "lucide-react";
import { useEditorStore } from "./editorStore";

export default function EditorTabs() {

  const {
    tabs,
    activeTab,
    setActiveTab,
    closeTab,
  } = useEditorStore();


  return (
    <div
      className="
        h-14
        border-b
        border-purple-100
        bg-white
        flex
        items-center
        gap-2
        px-4
        overflow-x-auto
      "
    >

      {tabs.map((tab) => (

        <div
          key={tab.id}

          className={`
            flex
            items-center
            gap-2
            px-4
            py-2
            rounded-xl
            cursor-pointer
            transition-all

            ${
              activeTab === tab.id
                ? "bg-violet-100 text-violet-700"
                : "hover:bg-purple-50 text-gray-500"
            }
          `}

          onClick={() => setActiveTab(tab.id)}
        >

          <span className="flex items-center gap-2">

            {tab.isDirty && (
              <span className="text-violet-500">
                ●
              </span>
            )}

            {tab.name}

          </span>



          <button
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}

            className="
              hover:text-red-500
              transition
            "
          >

            <X size={14}/>

          </button>


        </div>

      ))}

    </div>
  );
}