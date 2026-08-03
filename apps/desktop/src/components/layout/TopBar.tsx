import ThemeToggle from "../theme/ThemeToggle";


export default function TopBar() {

  return (

    <header
      className="
      h-16
      shrink-0
      rounded-3xl
      bg-white/70
      backdrop-blur-xl
      border
      border-purple-100
      shadow-[0_10px_30px_rgba(120,90,180,0.08)]
      px-6
      flex
      items-center
      justify-between
      "
    >


      {/* Left Section */}
      <div
        className="
        flex
        items-center
        gap-4
        "
      >

        {/* Logo */}
        <div
          className="
          w-10
          h-10
          rounded-2xl
          bg-gradient-to-br
          from-purple-300
          to-pink-300
          flex
          items-center
          justify-center
          text-white
          text-xl
          "
        >
          ✦
        </div>


        <div>

          <h1
            className="
            font-semibold
            text-gray-900
            leading-none
            "
          >
            Zenith
          </h1>


          <p
            className="
            text-xs
            text-gray-400
            mt-1
            "
          >
            Reach Your Peak
          </p>

        </div>



        {/* Project */}
        <div
          className="
          ml-6
          px-4
          py-2
          rounded-xl
          hover:bg-purple-50
          cursor-pointer
          text-sm
          text-gray-700
          "
        >
          🌙 Lunaris Project
          <span className="ml-2">
            ⌄
          </span>
        </div>


      </div>



      {/* Search */}
      <div
        className="
        w-[380px]
        h-10
        rounded-2xl
        bg-purple-50
        flex
        items-center
        px-5
        text-sm
        text-gray-400
        "
      >

        🔍
        <span className="ml-3">
          Search files, commands or ask Nova...
        </span>

      </div>



      {/* Right */}
<div
  className="
    flex
    items-center
    gap-4
    text-gray-500
  "
>
  <ThemeToggle />

  <button
    className="
      hover:text-purple-600
      transition
    "
  >
    Git
  </button>

  <button
    className="
      hover:text-purple-600
      transition
    "
  >
    Settings
  </button>

  <div
    className="
      w-10
      h-10
      rounded-full
      bg-gradient-to-br
      from-pink-300
      to-purple-300
    "
  />
</div>

    </header>

  );
}