import {
  Home,
  Folder,
  Bot,
  GitBranch,
  Settings
} from "lucide-react";


const items = [
  {
    icon: Home,
    label: "Home"
  },
  {
    icon: Folder,
    label: "Explorer"
  },
  {
    icon: Bot,
    label: "Nova"
  },
  {
    icon: GitBranch,
    label: "Git"
  },
];


export default function Sidebar() {

  return (
    <aside
      className="
      w-16
      rounded-3xl
      bg-[#FFFEFF]
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      flex
      flex-col
      items-center
      py-5
      gap-5
      "
    >

      {
        items.map((item)=>{

          const Icon = item.icon;

          return(
            <button
              key={item.label}
              title={item.label}
              className="
              w-10
              h-10
              rounded-2xl
              flex
              items-center
              justify-center
              text-gray-400
              hover:bg-purple-100
              hover:text-purple-500
              transition
              "
            >
              <Icon size={20}/>
            </button>
          )

        })
      }


      <div className="flex-1"/>


      <button
        className="
w-10
h-10
rounded-2xl
flex
items-center
justify-center
bg-purple-100
text-purple-500
"
      >
        <Settings size={20}/>
      </button>


    </aside>
  )
}