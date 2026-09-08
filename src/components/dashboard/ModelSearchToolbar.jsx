import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";

/**
 * Search input + column-visibility dropdown for the diagnostics table.
 * Fully controlled: all state (query, column map, menu open) lives in the
 * parent — no internal mirroring state (avoids sync regressions).
 */
export default function ModelSearchToolbar({
  searchQuery,
  onSearchChange,
  columns,
  onToggleColumn,
  open,
  onOpenChange,
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={t("models.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:border-cyan-500 outline-none transition-colors"
        />
      </div>

      {/* 欄位顯示/隱藏選單 */}
      <div className="relative shrink-0">
        <button
          onClick={() => onOpenChange(!open)}
          className="w-full md:w-auto flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 text-sm font-medium text-slate-300"
        >
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>{t("models.columnCustomize")}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-1">
            <div className="text-xs font-bold text-slate-400 px-2 pb-2 border-b border-slate-800">
              {t("models.columnToggleTitle")}
            </div>
            {Object.keys(columns).map((col) => (
              <label
                key={col}
                className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-slate-800/80 rounded-lg cursor-pointer text-xs text-slate-300"
              >
                <input
                  type="checkbox"
                  checked={columns[col]}
                  onChange={() => onToggleColumn(col)}
                  className="accent-cyan-500 rounded"
                />
                <span>
                  {t(`models.tableHeaders.${col}`)}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
