import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleBatchTests } from "../batchTest";

const t = (key, opts) => {
  if (key === "logs.startTest") return `start:${opts.count}`;
  return key;
};

describe("scheduleBatchTests", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("short-circuits with onNoRemote and no timers for empty list", () => {
    const onNoRemote = vi.fn();
    const ids = scheduleBatchTests([], { onNoRemote, onResult: vi.fn(), onLog: vi.fn(), t });
    expect(ids).toEqual([]);
    expect(onNoRemote).toHaveBeenCalledWith("logs.noRemoteModels");
    vi.advanceTimersByTime(10000);
  });

  it("schedules staggered tests and fires callbacks in order", () => {
    const onResult = vi.fn();
    const onLog = vi.fn();
    const onComplete = vi.fn();
    const onStart = vi.fn();

    // Force successes so results are deterministic.
    vi.spyOn(Math, "random").mockReturnValue(0.9);

    scheduleBatchTests([{ name: "a" }, { name: "b" }], {
      onResult, onLog, onComplete, onStart, t,
    });

    expect(onStart).toHaveBeenCalledWith("start:2");
    expect(onResult).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);
    expect(onResult).toHaveBeenNthCalledWith(1, "a", { status: "ok", msg: "logs.testOk" });
    expect(onLog).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(500);
    expect(onResult).toHaveBeenCalledTimes(2);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("logs.testDone");
    vi.restoreAllMocks();
  });
});
