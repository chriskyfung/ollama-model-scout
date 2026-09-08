import { SquareActivity, ExternalLink, Zap, BookOpen, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const links = [
    { label: t("footer.columns.links.ollama"), href: "https://ollama.com/" },
    { label: t("footer.columns.links.huggingface"), href: "https://huggingface.co/models" },
    { label: t("footer.columns.links.lmarena"), href: "https://lmarena.ai/" },
    { label: t("footer.columns.links.ollamaGithub"), href: "https://github.com/ollama/ollama" },
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
            {t("footer.tagline")}
          </p>
          <div className="flex items-center gap-3">
            <a
              href={githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>{t("nav.github")}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Column 2: Core features */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" /> {t("footer.columns.features")}
          </h4>
          <ul className="space-y-2 text-slate-400">
            <li>
              <button
                onClick={() => onNavigate("overclock")}
                className="hover:text-cyan-300 transition-colors"
              >
                {t("footer.columns.featuresList.vramBudget")}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("models")}
                className="hover:text-cyan-300 transition-colors"
              >
                {t("footer.columns.featuresList.smartFilter")}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("models")}
                className="hover:text-cyan-300 transition-colors"
              >
                {t("footer.columns.featuresList.batchDiag")}
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate("overclock")}
                className="hover:text-cyan-300 transition-colors"
              >
                {t("footer.columns.featuresList.sweetSpot")}
              </button>
            </li>
          </ul>
        </div>

        {/* Column 3: Resources */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-400" /> {t("footer.columns.resources")}
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
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> {t("footer.columns.disclaimer")}
          </h4>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            {t("footer.columns.disclaimerText")}
          </p>
          <div className="text-[11px] text-slate-500">
            {t("footer.clientSide")}
          </div>
        </div>
      </div>

      {/* Bottom copyright */}
      <div className="border-t border-slate-900 bg-slate-950 py-4 text-center text-slate-500 text-[11px]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div>{t("footer.copyright")}</div>
          <div className="text-slate-400 flex items-center gap-1">
            {t("footer.sloganCrafted")}{" "}
            <Zap className="w-3 h-3 text-amber-400 fill-amber-400" /> {t("footer.sloganEnthusiasts")}
          </div>
        </div>
      </div>
    </footer>
  );
}
