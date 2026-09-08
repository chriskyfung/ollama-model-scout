import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ModelsTable from "@/components/dashboard/ModelsTable";

const ALL_COLUMNS = {
  name: true,
  family: true,
  parameterSize: true,
  quantization: true,
  contextLength: true,
  size: true,
  status: true,
  capabilities: true,
  modifiedAt: true,
};

// Derived by keeping only `name` and `family` visible for a deterministic count.
const PARTIAL_COLUMNS = Object.fromEntries(
  Object.keys(ALL_COLUMNS).map((key) => [key, key === "name" || key === "family"]),
);

// Shared no-op/default props for an empty-state render.
const renderEmptyTable = (columns) =>
  render(
    <ModelsTable
      models={[]}
      columns={columns}
      testResults={{}}
      totalLocalSize={0}
      sortTable={() => {}}
      onSelect={() => {}}
      onViewLogs={() => {}}
      onBatchTest={() => {}}
    />,
  );

describe("ModelsTable", () => {
  it("empty-state colSpan matches visible column count when some columns are hidden", () => {
    const { getByRole } = renderEmptyTable(PARTIAL_COLUMNS);

    const cell = getByRole("cell");
    expect(cell).toHaveAttribute("colspan", "2");
  });

  it("empty-state colSpan matches count when all columns are visible", () => {
    const { getByRole } = renderEmptyTable(ALL_COLUMNS);

    const cell = getByRole("cell");
    expect(cell).toHaveAttribute("colspan", "9");
  });
});