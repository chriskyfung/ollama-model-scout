import { SquareActivity, ExternalLink, Zap, BookOpen, ShieldCheck } from "lucide-react";
import GithubIcon from "@/components/ui/GithubIcon";

/**
 * Production-grade 4-column footer.
 *
 * Hardcoded link URLs are kept here as internal defaults (not i18n keys),
 * while the visible labels are i18n candidates for the next phase.
 *
 * Props:
 *   - githubRepo: string URL to the project repo
 *   - onNavigate: (sectionId: string) => void  — smooth-scroll helper
 */
export default function Footer({ githubRepo, onNavigate }) {
  const links = [
    { label: "Ollama 官方網站", href: "https://ollama.com/" },
    { label: "Hugging Face GGUF 模型庫", href: "https://huggingface.co/models" },
    { label: "LMSYS Chatbot Arena 競技場", href: "https://lmarena.ai/" },
    { label: "Ollama GitHub 官方專案", href: "https://github.com/ollama/ollama" },
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-xs mt-12 relative z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
              <SquareActivity className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              Ollama Model Scout
            </span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            專為大語言模型玩家設計的遠端 Ollama 管理儀表板與物理超頻推估系統。
          </p>
          <div className="flex items-center gap-3">
            <a
              href={githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Column 2: Core features */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" /> 核心功能
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={() => onNavigate("overclock")}
                className="hover:text-cyan-300 transition-colors"
              >
                • VRAM / RAM 溢流實時預算
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("models")}
                className="hover:text-cyan-300 transition-colors"
              >
                • 智慧多維度過濾與動態排序
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("models")}
                className="hover:text-cyan-300 transition-colors"
              >
                • 雲端 API 批次連線診斷
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("overclock")}
                className="hover:text-cyan-300 transition-colors"
              >
                • Context 黃金推論區圖表
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-400" /> 實用社群資源
          </h4>
          <ul className="space-y-2 text-slate-400">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  • {l.label} <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Disclaimer */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> 免責聲明與隱私
          </h4>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            本工具提供的 Tokens/sec 及 VRAM 估算為依據通用 GQA 與 KV Cache
            理論模型之數值預測，實際推論速度將因 GPU
            架構與系統匯流排頻寬有所差異。
          </p>
          <div className="text-[11px] text-slate-500">
            100% Client-side. No user data is transmitted to external servers.
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-slate-900 bg-slate-950 py-4 text-center text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>© 2026 Ollama Model Scout. Open-source under MIT License.</div>
          <div className="text-slate-400 flex items-center gap-1">
            Crafted with{" "}
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> for
            Local AI Enthusiasts.
          </div>
        </div>
      </div>
    </footer>
  );
}
