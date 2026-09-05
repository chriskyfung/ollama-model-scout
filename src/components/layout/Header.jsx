import { SquareActivity, Zap, Settings, ChevronDown } from "lucide-react";
import GithubIcon from "@/components/ui/GithubIcon";
import { APP_VERSION, GITHUB_REPO } from "@/lib/constants";

/**
 * Sticky top app bar: logo + connection status dot, anchor nav, GitHub link
 * and the "Server & Hardware" toggle that reveals the settings panel.
 *
 * Props:
 *   - apiStatus:      { state, isFallback, message }
 *   - showApiSettings: boolean
 *   - onToggleApiSettings: () => void
 *   - onNavigate: (sectionId: string) => void
 */
export default function Header({
  apiStatus,
  showApiSettings,
  onToggleApiSettings,
  onNavigate,
}) {
  const navItems = [
    { id: "models", label: "模型陣列" },
    { id: "overclock", label: "戰略推算艙", icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
    { id: "features", label: "核心特點" },
    { id: "faq", label: "常見問題" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo 與狀態指示燈 */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30">
            <SquareActivity className="w-5 h-5 text-cyan-400" />
            <span
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-slate-950 ${
                apiStatus.state === "success"
                  ? "bg-emerald-400 animate-pulse"
                  : apiStatus.isFallback
                    ? "bg-amber-400"
                    : "bg-rose-500"
              }`}
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-lg md:text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Ollama Model Scout
            </span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-400 rounded-md">
              {APP_VERSION}
            </span>
          </div>
        </div>

        {/* 錨點導覽選單 (Nav Menu) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-1.5 hover:text-white hover:bg-slate-800/80 rounded-lg transition-all ${
                item.icon ? "flex items-center gap-1.5" : ""
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* 右側工具按鈕區 */}
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href={GITHUB_REPO}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all group"
            title="GitHub 專案原始碼"
          >
            <GithubIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <button
            onClick={onToggleApiSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 hover:border-cyan-500/50 rounded-xl text-xs font-medium text-cyan-300 transition-all shadow-sm shadow-cyan-950"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="hidden sm:inline">伺服器與硬體</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                showApiSettings ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
    </header>
  );
}