import { HelpCircle, ChevronUp, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

/**
 * FAQ accordion.
 *
 * Items are read from the locale JSON (`faq.items` — an array of
 * { id, q, a } objects) with `returnObjects: true`, matching the pattern
 * used for `features.items` in App.jsx. The `id` field provides stable DOM
 * identifiers (faq-panel-<id> / aria-controls) across locales; the `openIndex`
 * state is positional and managed by the parent (`App` via `onToggle`).
 */
export default function FaqSection({
  openIndex,
  onToggle,
}) {
  const { t } = useTranslation();
  // Guard against a malformed/missing locale entry so the section still
  // renders (just without items) instead of crashing.
  const items = t("faq.items", { returnObjects: true });
  const faqItems = Array.isArray(items) ? items : [];
  return (
    <section id="faq" className="scroll-mt-20 pt-6">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-400 inline-flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-teal-400" /> {t("faq.title")}
        </h2>
        <p className="text-xs text-slate-400">
          {t("faq.subtitle")}
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {faqItems.map((item, index) => {
          const isOpen = openIndex === index;
          // Defensive: locale entries carry a stable `id`, but guard against
          // undefined/empty ids to avoid duplicate or invalid DOM identifiers.
          const itemId = item.id || `faq-${index}`;
          return (
            <div
              key={itemId}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button
                id={`faq-header-${itemId}`}
                onClick={() => onToggle(isOpen ? null : index)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${itemId}`}
                className="w-full p-4 text-left flex justify-between items-center gap-4 hover:bg-slate-800/40 transition-colors"
              >
                <span className="text-sm font-bold text-slate-200">
                  {item.q}
                </span>
                {isOpen ? (
                  <ChevronUp
                    className="w-4 h-4 text-cyan-400 shrink-0"
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronDown
                    className="w-4 h-4 text-slate-500 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
              {isOpen && (
                <div
                  id={`faq-panel-${itemId}`}
                  role="region"
                  aria-labelledby={`faq-header-${itemId}`}
                  className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in"
                >
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
