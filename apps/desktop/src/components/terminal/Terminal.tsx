export default function Terminal({
  height
}:{
  height:number
}){

  return (

    <div
      className="
      shrink-0
      rounded-3xl
      bg-[#17162B]
      border
      border-purple-200/20
      shadow-[0_10px_30px_rgba(120,90,180,0.15)]
      overflow-hidden
      flex
      flex-col
      "
      style={{
 height:`${height}px`
}}
    >


      {/* Terminal Header */}
      <div
        className="
        h-12
        px-5
        flex
        items-center
        border-b
        border-white/10
        text-white
        text-sm
        "
      >

        <div
          className="
          flex
          items-center
          justify-between
          w-full
          "
        >

          <div
            className="
            flex
            items-center
            gap-2
            "
          >
            <span>✨</span>
            <span>Terminal</span>
          </div>


          <div
            className="
            flex
            items-center
            gap-4
            text-white/50
            "
          >
            <span className="cursor-pointer hover:text-white">
              ＋
            </span>

            <span className="cursor-pointer hover:text-white">
              ⌄
            </span>

            <span className="cursor-pointer hover:text-white">
              □
            </span>

            <span className="cursor-pointer hover:text-white">
              ×
            </span>

          </div>


        </div>

      </div>



      {/* Terminal Body */}
      <div
        className="
        flex-1
        p-5
        font-mono
        text-sm
        text-purple-200
        "
      >

        <p>
          zenith@luna ~ $
          <span className="animate-pulse">
            ▋
          </span>
        </p>


      </div>


    </div>

  );
}