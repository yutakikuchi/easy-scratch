export const upperGridPaintConfig = {
  columns: 17,
  rows: 8,
  start: { column: 0, row: 5 },
  goal: { column: 16, row: 5 },
  initialCalls: [
    { x: 1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 1 }
  ],
  targetCalls: [
    { x: 2, y: 2 },
    { x: 3, y: 1 },
    { x: 3, y: 3 }
  ],
  targetProgram: ["right", "up", "paint-blue", "right", "down", "paint-yellow"],
  targets: [
    { column: 2, row: 3, color: "blue", callIndex: 0 },
    { column: 4, row: 5, color: "yellow", callIndex: 0 },
    { column: 7, row: 4, color: "blue", callIndex: 1 },
    { column: 10, row: 5, color: "yellow", callIndex: 1 },
    { column: 13, row: 2, color: "blue", callIndex: 2 },
    { column: 16, row: 5, color: "yellow", callIndex: 2 }
  ],
  obstacles: [
    { column: 3, row: 5 },
    { column: 8, row: 5 },
    { column: 14, row: 5 },
    { column: 2, row: 2 },
    { column: 7, row: 3 },
    { column: 13, row: 1 },
    { column: 4, row: 6 },
    { column: 10, row: 6 },
    { column: 16, row: 6 }
  ]
};

const clampInteger = (value, minimum, maximum) => {
  const number = Math.round(Number(value));
  return Math.min(maximum, Math.max(minimum, Number.isFinite(number) ? number : minimum));
};

export function normalizeUpperGridPaintCalls(calls = []) {
  return calls.map((call = {}) => ({
    x: clampInteger(call.x, 1, 4),
    y: clampInteger(call.y, 1, 4)
  }));
}

export function expandUpperGridPaintProgram(program, calls) {
  return normalizeUpperGridPaintCalls(calls).flatMap((values, callIndex) => (
    program.map((command, commandIndex) => ({ command, commandIndex, callIndex, values: { ...values } }))
  ));
}

function cellKey(column, row) {
  return `${column}:${row}`;
}

export function createUpperGridPaintState(program, calls) {
  const normalizedCalls = normalizeUpperGridPaintCalls(calls);
  const expanded = expandUpperGridPaintProgram(program, normalizedCalls);
  const blocked = new Set(upperGridPaintConfig.obstacles.map(({ column, row }) => cellKey(column, row)));
  const position = { ...upperGridPaintConfig.start };
  const route = [{ ...position, command: "start", callIndex: -1 }];
  const painted = [];
  let outcome = "running";
  let collision = null;

  const move = (columnDelta, rowDelta, command, values, callIndex, commandIndex) => {
    const steps = command === "right" || command === "left" ? values.x : values.y;
    for (let step = 0; step < steps; step += 1) {
      const next = { column: position.column + columnDelta, row: position.row + rowDelta };
      const outside = next.column < 0 || next.column >= upperGridPaintConfig.columns || next.row < 0 || next.row >= upperGridPaintConfig.rows;
      if (outside) {
        outcome = "outside";
        return false;
      }
      if (blocked.has(cellKey(next.column, next.row))) {
        outcome = "obstacle";
        collision = { ...next, command, commandIndex, callIndex };
        return false;
      }
      Object.assign(position, next);
      route.push({ ...position, command, callIndex });
    }
    return true;
  };

  for (const { command, commandIndex, callIndex, values } of expanded) {
    if (outcome !== "running") break;
    if (command === "right" && !move(1, 0, command, values, callIndex, commandIndex)) break;
    if (command === "left" && !move(-1, 0, command, values, callIndex, commandIndex)) break;
    if (command === "up" && !move(0, -1, command, values, callIndex, commandIndex)) break;
    if (command === "down" && !move(0, 1, command, values, callIndex, commandIndex)) break;
    if (command === "paint-blue" || command === "paint-yellow") {
      const color = command === "paint-blue" ? "blue" : "yellow";
      painted.push({ ...position, color, callIndex });
      route.push({ ...position, command, callIndex });
    }
  }

  if (outcome === "running") outcome = "complete";
  return { calls: normalizedCalls, expanded, route, painted, position, outcome, collision };
}

function samePaint(actual, target) {
  return actual?.column === target?.column
    && actual?.row === target?.row
    && actual?.color === target?.color
    && actual?.callIndex === target?.callIndex;
}

export function isUpperGridPaintPrefixCorrect(program, calls, callCount) {
  const count = clampInteger(callCount, 1, upperGridPaintConfig.targetCalls.length);
  const result = createUpperGridPaintState(program, calls.slice(0, count));
  const target = createUpperGridPaintState(upperGridPaintConfig.targetProgram, upperGridPaintConfig.targetCalls.slice(0, count));
  return result.outcome === "complete"
    && result.position.column === target.position.column
    && result.position.row === target.position.row
    && result.painted.length === target.painted.length
    && result.painted.every((paint, index) => samePaint(paint, target.painted[index]));
}

export function isUpperGridPaintCorrect(program, calls) {
  return calls.length === upperGridPaintConfig.targetCalls.length
    && isUpperGridPaintPrefixCorrect(program, calls, upperGridPaintConfig.targetCalls.length);
}

export function findUpperGridPaintMismatch(program, calls) {
  for (let index = 0; index < upperGridPaintConfig.targetCalls.length; index += 1) {
    if (!isUpperGridPaintPrefixCorrect(program, calls, index + 1)) return index;
  }
  return -1;
}

export function createUpperGridPaintTargetState() {
  return createUpperGridPaintState(upperGridPaintConfig.targetProgram, upperGridPaintConfig.targetCalls);
}
