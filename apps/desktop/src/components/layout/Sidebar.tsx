const items = [
  {
    icon: "⌂",
    name: "Home"
  },
  {
    icon: "▢",
    name: "Explorer"
  },
  {
    icon: "✦",
    name: "Nova"
  },
  {
    icon: "⑂",
    name: "Git"
  },
  {
    icon: "⚙",
    name: "Settings"
  }
];


export default function Sidebar() {


  return (

    <aside
      className="
      h-full
      w-16
      rounded-3xl
      bg-white/70
      backdrop-blur-xl
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      flex
      flex-col
      items-center
      py-4
      gap-4
      "
    >


      {
        items.map((item,index)=>(

          <button
            key={item.name}
            title={item.name}
            className={`
            w-10
            h-10
            rounded-2xl
            flex
            items-center
            justify-center
            text-lg
            transition-all
            ${
              index === 0
              ?
              "bg-gradient-to-br from-purple-300 to-pink-300 text-white shadow-md"
              :
              "text-gray-400 hover:bg-purple-50 hover:text-purple-500"
            }
            `}
          >

            {item.icon}

          </button>

        ))
      }


    </aside>

  );

}