import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { scheduleBatchTests } from "@/lib/batchTest";
import { isRemoteModel } from "@/lib/models";

/**
 * Connectivity-testing hook: batch test runner + test results + live logs.
 *
 * Extracted from App.jsx's handleBatchTest. The simulated 500ms-staggered
 * scheduling lives in lib/batchTest (pure, injectable); this hook only wires
 * it to React state. One genuine robustness fix over the original: pending
 * timeouts are cleared on unmount so late timers can't setState on a
 * dead component (visible behavior is unchanged).
 *
 * `handleBatchTest(remoteModels)` takes the current filtered list as an
 * argument (passed by the caller at click time), which keeps this hook free
 * of a circular dependency on the filtering hook.
 */
export function useModelTesting() {
  const { t } = useTranslation();
  const [testResults, setTestResults] = useState({});
  const [testLogs, setTestLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const pendingTimers = useRef([]);

  // Clear any still-pending simulated test timers on unmount.
  useEffect(() => {
    return () => {
      pendingTimers.current.forEach(clearTimeout);
      pendingTimers.current = [];
    };
  }, []);

  const pushLog = (message, model = "System", status = "info") => {
    setTestLogs((prev) => [
      ...prev,
      { time: new Date().toISOString(), model, status, message },
    ]);
  };

  const handleBatchTest = (filteredModels) => {
    setIsTesting(true);
    setShowLogs(true);
    const remoteModels = filteredModels.filter(isRemoteModel);

    const ids = scheduleBatchTests(remoteModels, {
      t,
      onNoRemote: (msg) => {
        setIsTesting(false);
        pushLog(msg);
      },
      onStart: (msg) => pushLog(msg),
      onResult: (name, result) =>
        setTestResults((prev) => ({ ...prev, [name]: result })),
      onLog: (log) => setTestLogs((prev) => [...prev, log]),
      onComplete: (msg) => {
        setIsTesting(false);
        pushLog(msg);
      },
    });
    pendingTimers.current.push(...ids);
  };

  return {
    testResults,
    testLogs,
    showLogs,
    setShowLogs,
    isTesting,
    handleBatchTest,
  };
}
