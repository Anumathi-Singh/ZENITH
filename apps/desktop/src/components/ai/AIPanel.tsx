import {
  Brain,
  Code2,
  Search,
  FlaskConical,
  FileText,
  Sparkles,
  Send
} from "lucide-react";


const agents = [
  {
    name: "Planner",
    desc: "Analyzing requirements...",
    icon: Brain,
    color: "text-purple-500",
    bg: "bg-purple-100"
  },
  {
    name: "Coder",
    desc: "Ready to code ✨",
    icon: Code2,
    color: "text-green-500",
    bg: "bg-green-100"
  },
  {
    name: "Reviewer",
    desc: "Waiting for changes",
    icon: Search,
    color: "text-blue-500",
    bg: "bg-blue-100"
  },
  {
    name: "Tester",
    desc: "Ready for testing",
    icon: FlaskConical,
    color: "text-orange-500",
    bg: "bg-orange-100"
  },
  {
    name: "Docs",
    desc: "Ready to document",
    icon: FileText,
    color: "text-pink-500",
    bg: "bg-pink-100"
  }
];


export default function AIPanel() {

  return (

    <div
      className="
      rounded-3xl
      bg-[#FFFEFF]
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      p-5
      flex
      flex-col
      overflow-hidden
      h-full
      "
    >

      {/* Header */}

      <div
        className="
        flex
        items-center
        gap-2
        font-semibold
        mb-5
        "
      >
        <Sparkles
          size={18}
          className="text-purple-400"
        />

        <span>
          Nova
        </span>

      </div>



      {/* Greeting */}

      <div
        className="
        rounded-2xl
        bg-purple-50
        p-4
        text-sm
        text-gray-600
        mb-5
        "
      >

        <div className="mb-2">
          👋 Hi there!
        </div>


        How can I help you build
        something amazing today?

      </div>




      <p
        className="
        text-xs
        text-gray-400
        mb-3
        "
      >
        AI TEAM
      </p>



      {/* AI Agents */}

      <div
        className="
        space-y-3
        overflow-y-auto
        flex-1
        pr-1
        "
      >

        {
          agents.map((agent)=>{

            const Icon = agent.icon;


            return (

              <div
                key={agent.name}
                className="
                rounded-2xl
                border
                border-purple-100
                p-3
                flex
                items-center
                gap-3
                hover:bg-purple-50
                transition
                cursor-pointer
                "
              >

                <div
                  className={`
                  w-10
                  h-10
                  rounded-xl
                  ${agent.bg}
                  flex
                  items-center
                  justify-center
                  `}
                >

                  <Icon
                    size={18}
                    className={agent.color}
                  />

                </div>



                <div>

                  <div
                    className="
                    text-sm
                    font-medium
                    text-gray-700
                    "
                  >
                    {agent.name}
                  </div>


                  <div
                    className="
                    text-xs
                    text-gray-400
                    "
                  >
                    {agent.desc}
                  </div>


                </div>


              </div>

            )

          })
        }


      </div>



      {/* Chat Input */}

      <div
        className="
        pt-5
        "
      >

        <div
          className="
          rounded-2xl
          bg-purple-50
          px-4
          py-3
          flex
          items-center
          justify-between
          text-sm
          text-gray-400
          "
        >

          <span>
            Ask Nova anything...
          </span>


          <button
            className="
            w-8
            h-8
            rounded-full
            bg-purple-300
            text-white
            flex
            items-center
            justify-center
            hover:bg-purple-400
            transition
            "
          >

            <Send size={15}/>

          </button>


        </div>


      </div>


    </div>

  )
}