/**
 * Batch connectivity-test scheduling for remote models (pure scheduling,
 * no React state ownership — callbacks are injected).
 *
 * Extracted from App.jsx's handleBatchTest. The caller (useModelTesting)
 * owns testResults/testLogs state and receives updates via callbacks, which
 * keeps this unit-testable with vitest fake timers.
 */

/**
 * Schedule a simulated connectivity test per remote model.
 * Mirrors the original behavior exactly: 500ms stagger, ~25% simulated
 * failure rate (Math.random() > 0.25 → ok).
 *
 * @param {Array} remoteModels
 * @param {object} handlers
 * @param {(name: string, result: {status: string, msg: string}) => void} handlers.onResult
 * @param {(log: {time: string, model: string, status: string, message: string}) => void} handlers.onLog
 * @param {() => void} [handlers.onComplete] called with the LAST model's timer
 * @param {(msg: string) => void} [handlers.onNoRemote]
 * @param {(msg: string) => void} [handlers.onStart]
 * @param {(msg: string) => void} t translation function
 * @returns {number[]} timeout ids (so the owner can clearTimeout on unmount)
 */
export const scheduleBatchTests = (remoteModels, handlers) => {
  const { onResult, onLog, onComplete, onNoRemote, onStart, t } = handlers;

  if (remoteModels.length === 0) {
    onNoRemote(t("logs.noRemoteModels"));
    return [];
  }

  onStart(t("logs.startTest", { count: remoteModels.length }));

  return remoteModels.map((m, idx) =>
    setTimeout(() => {
      const success = Math.random() > 0.25;
      const msg = success ? t("logs.testOk") : t("logs.testFail");
      const status = success ? "ok" : "error";

      onResult(m.name, { status, msg });

      // 寫入即時日誌
      onLog({
        time: new Date().toISOString(),
        model: m.name,
        status: status,
        message: msg,
      });

      if (idx === remoteModels.length - 1) {
        onComplete(t("logs.testDone"));
      }
    }, (idx + 1) * 500),
  );
};
