export default function TopBar() {
  return (
    <header className="h-16 rounded-3xl bg-white border border-purple-100 shadow-[0_10px_30px_rgba(120,90,180,0.08)] px-6 flex items-center justify-between">

      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center text-white text-lg font-bold">
          🐇
        </div>

        <div>
          <h1 className="font-semibold text-gray-800">Zenith</h1>
          <p className="text-xs text-gray-400">
            Reach Your Peak
          </p>
        </div>
      </div>

      {/* Center */}
      <div className="w-[420px]">
        <input
          type="text"
          placeholder="Search files, commands or ask Nova..."
          className="w-full rounded-2xl bg-purple-50 px-5 py-3 outline-none border border-transparent focus:border-violet-300 transition"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">

        <button className="text-gray-500 hover:text-violet-500 transition">
          Git
        </button>

        <button className="text-gray-500 hover:text-violet-500 transition">
          Settings
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-300 to-violet-300"></div>

      </div>

    </header>
  );
}