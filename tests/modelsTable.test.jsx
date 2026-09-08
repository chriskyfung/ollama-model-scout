import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ModelsTable from "@/components/dashboard/ModelsTable";

// All non-essential columns hidden so the visible column count is deterministic.
const PARTIAL_COLUMNS = {
  name: true,
  family: true,
  parameterSize: false,
  quantization: false,
  contextLength: false,
  size: false,
  status: false,
  capabilities: false,
  modifiedAt: false,
};

describe("ModelsTable", () => {
  it("empty-state colSpan matches visible column count", () => {
    const { getByRole } = render(
      <ModelsTable
        models={[]}
        columns={PARTIAL_COLUMNS}
        testResults={{}}
        totalLocalSize={0}
        sortTable={() => {}}
        onSelect={() => {}}
        onViewLogs={() => {}}
        onBatchTest={() => {}}
      />,
    );

    const cell = getByRole("cell");
    expect(cell).toHaveAttribute("colspan", "2");
  });
});