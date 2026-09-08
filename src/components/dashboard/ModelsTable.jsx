import { useTranslation } from "react-i18next";
import { Cloud, HardDrive, Terminal, Zap } from "lucide-react";
import { formatBytes, formatParameterSize } from "@/lib/format";
import { isRemoteModel } from "@/lib/models";

/**
 * Diagnostics-matrix table + footer stats. Fully controlled; extracted
 * verbatim from App.jsx (remote predicate now via lib/models.isRemoteModel).
 */
export default function ModelsTable({
  models,
  columns,
  selectedModel,
  onSelect,
  sortTable,
  testResults,
  totalLocalSize,
  hasLogs,
  onViewLogs,
  isTesting,
  onBatchTest,
}) {
  const { t } = useTranslation();

  // Number of currently visible columns; used for the empty-state colSpan.
  const visibleColCount = Object.values(columns).filter(Boolean).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative z-10">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none">
            <tr>
              {columns.name && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("name")}
                >
                  {t("models.tableHeaders.name")}
                </th>
              )}
              {columns.family && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("family")}
                >
                  {t("models.tableHeaders.family")}
                </th>
              )}
              {columns.parameterSize && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("parameter_size")}
                >
                  {t("models.tableHeaders.parameterSize")}
                </th>
              )}
              {columns.quantization && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("quantization_level")}
                >
                  {t("models.tableHeaders.quantization")}
                </th>
              )}
              {columns.contextLength && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("context_length")}
                >
                  {t("models.tableHeaders.contextLength")}
                </th>
              )}
              {columns.size && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("size")}
                >
                  {t("models.tableHeaders.size")}
                </th>
              )}
              {columns.status && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("status")}
                >
                  {t("models.tableHeaders.status")}
                </th>
              )}
              {columns.capabilities && (
                <th className="p-4">{t("models.tableHeaders.capabilities")}</th>
              )}
              {columns.modifiedAt && (
                <th
                  className="p-4 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => sortTable("modified_at")}
                >
                  {t("models.tableHeaders.modifiedAt")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {models.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColCount}
                  className="p-8 text-center text-slate-500"
                >
                  {t("models.emptyState")}
                </td>
              </tr>
            ) : (
              models.map((m) => {
                const isRemote = isRemoteModel(m);
                const quantUpper = m.details?.quantization_level
                  ? m.details.quantization_level.toUpperCase()
                  : "-";

                return (
                  <tr
                    key={m.name}
                    onClick={() => onSelect(m)}
                    className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                      selectedModel?.name === m.name
                        ? "bg-cyan-950/40 border-l-4 border-l-cyan-400"
                        : ""
                    }`}
                  >
                    {columns.name && (
                      <td className="p-4 font-semibold text-slate-200 flex items-center gap-2">
                        {m.name}
                        {isRemote && (
                          <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] rounded">
                            {t("models.cloudBadge")}
                          </span>
                        )}
                      </td>
                    )}
                    {columns.family && (
                      <td className="p-4 text-slate-400">
                        {m.details?.family || "-"}
                      </td>
                    )}
                    {columns.parameterSize && (
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-slate-800 rounded-md text-xs font-mono text-slate-300">
                          {formatParameterSize(
                            m.details?.parameter_size,
                          )}
                        </span>
                      </td>
                    )}
                    {columns.quantization && (
                      <td className="p-4 font-mono text-slate-300">
                        <span className="px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
                          {quantUpper}
                        </span>
                      </td>
                    )}
                    {columns.contextLength && (
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {(
                          m.details?.context_length || 0
                        ).toLocaleString()}
                      </td>
                    )}
                    {columns.size && (
                      <td className="p-4 font-mono text-xs">
                        {isRemote ? (
                          <span className="inline-flex items-center gap-1.5 text-indigo-400 bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-800/40">
                            <Cloud className="w-3.5 h-3.5" /> {t("models.cloudApiBadge")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-800/40">
                            <HardDrive className="w-3.5 h-3.5" />{" "}
                            {formatBytes(m.size)}
                          </span>
                        )}
                      </td>
                    )}
                    {columns.status && (
                      <td className="p-4 font-mono text-xs">
                        {testResults[m.name] ? (
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] border ${
                              testResults[m.name].status === "ok"
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            }`}
                          >
                            {testResults[m.name].msg}
                          </span>
                        ) : (
                          <span className="text-slate-600">{t("models.statusDash")}</span>
                        )}
                      </td>
                    )}
                    {columns.capabilities && (
                      <td className="p-4">
                        <div className="flex gap-1 flex-wrap">
                          {(m.capabilities || []).map((cap) => (
                            <span
                              key={cap}
                              className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300"
                            >
                              {cap}
                            </span>
                          ))}
                        </div>
                      </td>
                    )}
                    {columns.modifiedAt && (
                      <td className="p-4 text-xs text-slate-500 font-mono">
                        {m.modified_at
                          ? new Date(m.modified_at).toLocaleDateString()
                          : t("models.statusDash")}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 表格 Footer 統計列 */}
      <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            {t("models.footer.count")}{" "}
            <strong className="text-white">
              {models.length}
            </strong>{" "}
            {t("models.footer.countUnit")}
          </span>
          <span className="h-3 w-px bg-slate-800"></span>
          <span>
            {t("models.footer.localUsed")}{" "}
            <strong className="text-emerald-400 font-mono">
              {formatBytes(totalLocalSize)}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasLogs && (
            <button
              onClick={onViewLogs}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition-colors text-xs font-semibold"
            >
              <Terminal className="w-3.5 h-3.5" /> {t("models.footer.viewLogs")}
            </button>
          )}
          <button
            onClick={onBatchTest}
            disabled={isTesting}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 rounded-xl transition-colors text-xs font-semibold disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" />
            {isTesting ? t("models.footer.batchTesting") : t("models.footer.batchTest")}
          </button>
        </div>
      </div>
    </div>
  );
}
