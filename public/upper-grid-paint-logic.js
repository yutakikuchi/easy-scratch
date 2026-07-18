export const upperGridPaintConfig = {
  columns: 9,
  rows: 8,
  start: { column: 0, row: 7 },
  goal: { column: 6, row: 1 },
  targetValues: { x: 2, y: 2, n: 3 },
  targetProgram: ["right", "paint-blue", "up", "paint-yellow"],
  targets: [
    { column: 2, row: 7, color: "blue" },
    { column: 2, row: 5, color: "yellow" },
    { column: 4, row: 5, color: "blue" },
    { column: 4, row: 3, color: "yellow" },
    { column: 6, row: 3, color: "blue" },
    { column: 6, row: 1, color: "yellow" }
  ],
  obstacles: [
    { column: 1, row: 5 },
    { column: 3, row: 7 },
    { column: 3, row: 4 },
    { column: 5, row: 6 },
    { column: 5, row: 2 },
    { column: 7, row: 4 },
    { column: 7, row: 2 }
  ]
};

const clampInteger = (value, minimum, maximum) => {
  const number = Math.round(Number(value));
  return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : minimum));
};

export function normalizeUpperGridPaintValues(values = {}) {
  return {
    x: clampInteger(values.x, 1, 4),
    y: clampInteger(values.y, 1, 4),
    n: clampInteger(values.n, 1, 4)
  };
}

export function expandUpperGridPaintProgram(program, repeatCount) {
  const repeats = clampInteger(repeatCount, 1, 4);
  return Array.from({ length: repeats }, () => program).flat();
}

function cellKey(column, row) {
  return `${column}:${row}`;
}

export function createUpperGridPaintState(program, values) {
  const normalized = normalizeUpperGridPaintValues(values);
  const expanded = expandUpperGridPaintProgram(program, normalized.n);
  const blocked = new Set(upperGridPaintConfig.obstacles.map(({ column, row }) => cellKey(column, row)));
  const position = { ...upperGridPaintConfig.start };
  const route = [{ ...position, command: "start" }];
  const painted = [];
  let outcome = "running";

  const move = (columnDelta, rowDelta, command) => {
    const steps = command === "right" || command === "left" ? normalized.x : normalized.y;
    for (let step = 0; step < steps; step += 1) {
      const next = { column: position.column + columnDelta, row: position.row + rowDelta };
      const outside = next.column < 0 || next.column >= upperGridPaintConfig.columns || next.row < 0 || next.row >= upperGridPaintConfig.rows;
      if (outside) {
        outcome = "outside";
        return false;
      }
      if (blocked.has(cellKey(next.column, next.row))) {
        outcome = "obstacle";
        return false;
      }
      Object.assign(position, next);
      route.push({ ...position, command });
    }
    return true;
  };

  for (const command of expanded) {
    if (outcome !== "running") break;
    if (command === "right" && !move(1, 0, command)) break;
    if (command === "left" && !move(-1, 0, command)) break;
    if (command === "up" && !move(0, -1, command)) break;
    if (command === "down" && !move(0, 1, command)) break;
    if (command === "paint-blue" || command === "paint-yellow") {
      painted.push({ ...position, color: command === "paint-blue" ? "blue" : "yellow" });
      route.push({ ...position, command });
    }
  }

  if (outcome === "running") outcome = "complete";
  return { values: normalized, expanded, route, painted, position, outcome };
}

export function isUpperGridPaintCorrect(program, values) {
  const result = createUpperGridPaintState(program, values);
  if (result.outcome !== "complete") return false;
  if (result.position.column !== upperGridPaintConfig.goal.column || result.position.row !== upperGridPaintConfig.goal.row) return false;
  if (result.painted.length !== upperGridPaintConfig.targets.length) return false;
  return result.painted.every((paint, index) => {
    const target = upperGridPaintConfig.targets[index];
    return paint.column === target.column && paint.row === target.row && paint.color === target.color;
  });
}

export function createUpperGridPaintTargetState() {
  return createUpperGridPaintState(upperGridPaintConfig.targetProgram, upperGridPaintConfig.targetValues);
}
