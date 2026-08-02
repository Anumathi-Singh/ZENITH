import { useEditorStore } from "../editor/editorStore";

export default function StatusBar() {

  const {
    tabs,
    activeTab,
  } = useEditorStore();


  const currentTab = tabs.find(
    (tab) => tab.id === activeTab
  );


  return (
    <div
      className="
        h-10
        rounded-3xl
        bg-white
        shadow-lg
        flex
        items-center
        justify-between
        px-5
        text-sm
      "
    >

      <span>
        🌸 Ready
      </span>


      <span className="text-gray-500">

        {
          currentTab
            ?
            currentTab.isDirty
              ? `${currentTab.name} ● Unsaved`
              : `${currentTab.name} ✓ Saved`
            :
            "No file open"
        }

      </span>


    </div>
  );
}