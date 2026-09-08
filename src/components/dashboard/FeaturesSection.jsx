import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { FEATURE_STYLES } from "@/lib/featureStyles";

/**
 * Product highlights section (`#features`). Extracted verbatim from App.jsx;
 * self-contained (only consumes i18n + FEATURE_STYLES).
 */
export default function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section id="features" className="scroll-mt-20 pt-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-emerald-400 inline-flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" /> {t("features.title")}
        </h2>
        <p className="text-xs text-slate-400">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {t("features.items", { returnObjects: true }).map((item, i) => {
          const s = FEATURE_STYLES[i % FEATURE_STYLES.length];
          return (
            <div key={i} className={`bg-slate-900/60 border border-slate-800 ${s.hover} transition-all rounded-2xl p-5 space-y-3 group`}>
              <div className={`w-10 h-10 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center ${s.text} group-hover:scale-110 transition-transform`}>
                {s.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-200">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
