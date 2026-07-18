export const gridPaintStart = Object.freeze({ col: 1, row: 4 });
export const gridPaintTargets = Object.freeze([
  Object.freeze({ col: 3, row: 4 }),
  Object.freeze({ col: 3, row: 2 }),
  Object.freeze({ col: 6, row: 2 })
]);
export const gridPaintObstacles = Object.freeze([
  Object.freeze({ col: 4, row: 4 }),
  Object.freeze({ col: 4, row: 3 }),
  Object.freeze({ col: 5, row: 3 })
]);

const directionSteps = {
  "cell-right": { col: 1, row: 0 },
  "cell-up": { col: 0, row: -1 },
  "cell-left": { col: -1, row: 0 }
};

export function createGridPaintState(program) {
  let col = gridPaintStart.col;
  let row = gridPaintStart.row;
  const route = [{ col, row, action: null, paints: false }];
  const painted = [];

  program.forEach((action) => {
    const step = directionSteps[action];
    if (step) {
      const nextCol = Math.max(0, Math.min(7, col + step.col));
      const nextRow = Math.max(0, Math.min(4, row + step.row));
      const blocked = gridPaintObstacles.some((obstacle) => obstacle.col === nextCol && obstacle.row === nextRow);
      if (!blocked) {
        col = nextCol;
        row = nextRow;
      }
    }
    const paints = action === "paint-cell";
    if (paints) painted.push({ col, row });
    route.push({ col, row, action, paints });
  });
  return { route, painted };
}

export function getGridPaintLayout(width, height) {
  const cell = Math.max(24, Math.min((width - 12) / 8, (height - 12) / 5));
  const boardWidth = cell * 8;
  const boardHeight = cell * 5;
  return {
    cell,
    left: (width - boardWidth) / 2,
    top: (height - boardHeight) / 2,
    width: boardWidth,
    height: boardHeight
  };
}

export function createGridPaintRoute(program, width, height) {
  const layout = getGridPaintLayout(width, height);
  const state = createGridPaintState(program);
  return state.route.map((point, index) => ({
    ...point,
    x: (point.col - gridPaintStart.col) * layout.cell,
    y: (point.row - gridPaintStart.row) * layout.cell,
    offset: state.route.length <= 1 ? 0 : index / (state.route.length - 1)
  }));
}

function cellCenter(layout, point) {
  return {
    x: layout.left + (point.col + 0.5) * layout.cell,
    y: layout.top + (point.row + 0.5) * layout.cell
  };
}

export function drawGridPaintBoard(context, width, height, program, sample, progress = 0) {
  const layout = getGridPaintLayout(width, height);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f7fcff";
  context.fillRect(0, 0, width, height);

  gridPaintTargets.forEach((target, index) => {
    context.fillStyle = ["#fff0a8", "#dff6ff", "#ffe1ec"][index];
    context.fillRect(layout.left + target.col * layout.cell + 3, layout.top + target.row * layout.cell + 3, layout.cell - 6, layout.cell - 6);
  });

  gridPaintObstacles.forEach((obstacle) => {
    const x = layout.left + obstacle.col * layout.cell + 5;
    const y = layout.top + obstacle.row * layout.cell + 5;
    context.fillStyle = "#6e7f91";
    context.fillRect(x, y, layout.cell - 10, layout.cell - 10);
    context.fillStyle = "#fff";
    context.font = `900 ${layout.cell * 0.42}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("×", x + (layout.cell - 10) / 2, y + (layout.cell - 10) / 2);
  });

  context.strokeStyle = "#89bfe0";
  context.lineWidth = 2;
  for (let col = 0; col <= 8; col += 1) {
    const x = layout.left + col * layout.cell;
    context.beginPath(); context.moveTo(x, layout.top); context.lineTo(x, layout.top + layout.height); context.stroke();
  }
  for (let row = 0; row <= 5; row += 1) {
    const y = layout.top + row * layout.cell;
    context.beginPath(); context.moveTo(layout.left, y); context.lineTo(layout.left + layout.width, y); context.stroke();
  }

  const targetRoute = createGridPaintState(sample).route;
  context.save();
  context.strokeStyle = "rgba(13, 42, 99, .55)";
  context.lineWidth = 9;
  context.setLineDash([10, 10]);
  context.beginPath();
  targetRoute.forEach((point, index) => {
    const center = cellCenter(layout, point);
    if (index === 0) context.moveTo(center.x, center.y);
    else context.lineTo(center.x, center.y);
  });
  context.stroke();
  context.strokeStyle = "#fff";
  context.lineWidth = 5;
  context.stroke();
  context.restore();

  const currentRoute = createGridPaintState(program).route;
  if (currentRoute.length > 1) {
    context.strokeStyle = "#ee4057";
    context.lineWidth = 6;
    context.beginPath();
    currentRoute.forEach((point, index) => {
      const center = cellCenter(layout, point);
      if (index === 0) context.moveTo(center.x, center.y);
      else context.lineTo(center.x, center.y);
    });
    context.stroke();
  }

  const visibleActions = Math.floor(Math.max(0, Math.min(1, progress)) * program.length + 0.001);
  const currentState = createGridPaintState(program.slice(0, visibleActions));
  currentState.painted.forEach((point, index) => {
    context.fillStyle = ["#ffcf33", "#35b7e8", "#ff6f91"][index % 3];
    context.fillRect(layout.left + point.col * layout.cell + 6, layout.top + point.row * layout.cell + 6, layout.cell - 12, layout.cell - 12);
  });

  const start = cellCenter(layout, gridPaintStart);
  const goal = cellCenter(layout, gridPaintTargets.at(-1));
  context.save();
  context.fillStyle = "#ffcf33";
  context.strokeStyle = "#0d2a63";
  context.lineWidth = Math.max(2, layout.cell * 0.035);
  context.fillRect(goal.x + layout.cell * 0.06, goal.y - layout.cell * 0.42, layout.cell * 0.46, layout.cell * 0.28);
  context.strokeRect(goal.x + layout.cell * 0.06, goal.y - layout.cell * 0.42, layout.cell * 0.46, layout.cell * 0.28);
  context.fillStyle = "#0d2a63";
  context.font = `900 ${Math.max(12, layout.cell * 0.16)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(window.easyScratchI18n?.t("ゴール") ?? "ゴール", goal.x + layout.cell * 0.29, goal.y - layout.cell * 0.28);
  context.font = `${Math.max(22, layout.cell * 0.36)}px sans-serif`;
  context.fillText("🏁", goal.x, goal.y - layout.cell * 0.34);
  context.restore();

  context.fillStyle = "#0d2a63";
  context.font = `900 ${Math.max(12, layout.cell * 0.2)}px sans-serif`;
  context.textAlign = "center";
  context.fillText(window.easyScratchI18n?.t("スタート") ?? "スタート", start.x, start.y + layout.cell * 0.38);
  return { layout, start };
}
