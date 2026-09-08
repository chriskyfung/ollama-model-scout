import { useTranslation } from "react-i18next";

/**
 * Multi-dimension smart filter button rows (type / capabilities / family /
 * quantization / test status). Fully controlled via props; extracted
 * verbatim from App.jsx. Class strings are kept as literals (NOT built
 * dynamically) so Tailwind's JIT scanner can see them.
 */
export default function FilterButtonBar({
  filters,
  setFilters,
  toggleFilter,
  availableCapabilities,
  availableFamilies,
  availableQuantizations,
}) {
  const { t } = useTranslation();
  const pillBase =
    "px-3 py-1 rounded-lg border transition-all bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700";
  return (
    <div className="flex flex-col space-y-3 pt-3 border-t border-slate-800/60 text-xs">
      {/* 1. 類型 (Type) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
          {t("models.filters.type")}
        </span>
        {["all", "local", "remote"].map((type) => (
          <button
            key={type}
            onClick={() => setFilters((p) => ({ ...p, type }))}
            className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
              filters.type === type
                ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-950"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            {t("models.filters.types." + type)}
          </button>
        ))}
      </div>

      {/* 2. 能力 (Capabilities) */}
      {availableCapabilities.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
            {t("models.filters.caps")}
          </span>
          {availableCapabilities.map((c) => (
            <button
              key={c}
              onClick={() => toggleFilter("capabilities", c)}
              className={
                filters.capabilities.includes(c)
                  ? "px-3 py-1 rounded-lg border transition-all bg-indigo-500/20 border-indigo-500 text-indigo-300"
                  : pillBase
              }
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* 3. 家族 (Family) */}
      {availableFamilies.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
            {t("models.filters.family")}
          </span>
          {availableFamilies.map((f) => (
            <button
              key={f}
              onClick={() => toggleFilter("families", f)}
              className={
                filters.families.includes(f)
                  ? "px-3 py-1 rounded-lg border transition-all bg-teal-500/20 border-teal-500 text-teal-300"
                  : pillBase
              }
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* 4. 量化 (Quantization - 全部大寫) */}
      {availableQuantizations.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
            {t("models.filters.quant")}
          </span>
          {availableQuantizations.map((q) => (
            <button
              key={q}
              onClick={() => toggleFilter("quantizations", q)}
              className={
                filters.quantizations.includes(q)
                  ? "px-3 py-1 rounded-lg border transition-all bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : pillBase
              }
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 5. 測試狀態 (Test Status) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-500 font-bold uppercase w-16 shrink-0">
          {t("models.filters.status")}
        </span>
        {[
          { id: "all", label: t("models.filters.statuses.all") },
          { id: "success", label: t("models.filters.statuses.success") },
          { id: "error", label: t("models.filters.statuses.error") },
          { id: "untested", label: t("models.filters.statuses.untested") },
        ].map((st) => (
          <button
            key={st.id}
            onClick={() =>
              setFilters((p) => ({ ...p, testStatus: st.id }))
            }
            className={`px-3 py-1 rounded-lg font-semibold transition-all border ${
              filters.testStatus === st.id
                ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-sm shadow-indigo-950"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>
    </div>
  );
}
