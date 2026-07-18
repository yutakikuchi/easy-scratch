import {
  createUpperGridPaintState,
  createUpperGridPaintTargetState,
  isUpperGridPaintCorrect,
  normalizeUpperGridPaintValues,
  upperGridPaintConfig
} from "./upper-grid-paint-logic.js?v=20260718a";

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const actions = [
  { id: "right", icon: "→", label: "右へ xマス", hint: "xの数だけ進む" },
  { id: "up", icon: "↑", label: "上へ yマス", hint: "yの数だけ進む" },
  { id: "paint-blue", icon: "■", label: "青でぬる", hint: "今のマスを青にする" },
  { id: "paint-yellow", icon: "■", label: "黄でぬる", hint: "今のマスを黄にする" },
  { id: "left", icon: "←", label: "左へ xマス", hint: "使うか考える" },
  { id: "down", icon: "↓", label: "下へ yマス", hint: "使うか考える" }
];

const actionById = new Map(actions.map((action) => [action.id, action]));

function escapeText(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function setupCanvas(root) {
  const canvas = root.querySelector("[data-grid-lab-canvas]");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * density);
  canvas.height = Math.round(rect.height * density);
  const context = canvas.getContext("2d");
  context.scale(density, density);
  context.lineCap = "round";
  context.lineJoin = "round";
  return { canvas, context, width: rect.width, height: rect.height };
}

function boardLayout(width, height) {
  const padding = Math.max(20, Math.min(width, height) * 0.065);
  const cell = Math.min((width - padding * 2) / upperGridPaintConfig.columns, (height - padding * 2) / upperGridPaintConfig.rows);
  const boardWidth = cell * upperGridPaintConfig.columns;
  const boardHeight = cell * upperGridPaintConfig.rows;
  return { cell, left: (width - boardWidth) / 2, top: (height - boardHeight) / 2, boardWidth, boardHeight };
}

function cellCenter(layout, point) {
  return { x: layout.left + (point.column + 0.5) * layout.cell, y: layout.top + (point.row + 0.5) * layout.cell };
}

function drawRoute(context, layout, route, color, dash, width, count = route.length) {
  if (route.length < 2 || count < 2) return;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  const start = cellCenter(layout, route[0]);
  context.moveTo(start.x, start.y);
  route.slice(1, count).forEach((point) => {
    const next = cellCenter(layout, point);
    context.lineTo(next.x, next.y);
  });
  context.stroke();
  context.restore();
}

function drawRobot(context, layout, point) {
  const center = cellCenter(layout, point);
  const size = layout.cell * 0.74;
  context.save();
  context.fillStyle = "#fff";
  context.strokeStyle = "#1d78c9";
  context.lineWidth = Math.max(2, layout.cell * 0.05);
  context.beginPath();
  context.arc(center.x, center.y, size * 0.38, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = "#0d2a63";
  context.fillRect(center.x - size * 0.23, center.y - size * 0.15, size * 0.46, size * 0.25);
  context.fillStyle = "#66e8ff";
  context.beginPath();
  context.arc(center.x - size * 0.1, center.y - size * 0.03, size * 0.035, 0, Math.PI * 2);
  context.arc(center.x + size * 0.1, center.y - size * 0.03, size * 0.035, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawBoard(root, result, progress = 1) {
  const setup = setupCanvas(root);
  if (!setup) return;
  const { context, width, height } = setup;
  const layout = boardLayout(width, height);
  const target = createUpperGridPaintTargetState();
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#f8fcff";
  context.fillRect(0, 0, width, height);

  for (let row = 0; row < upperGridPaintConfig.rows; row += 1) {
    for (let column = 0; column < upperGridPaintConfig.columns; column += 1) {
      const x = layout.left + column * layout.cell;
      const y = layout.top + row * layout.cell;
      context.fillStyle = (column + row) % 2 ? "#f2f9fd" : "#fff";
      context.fillRect(x, y, layout.cell, layout.cell);
      context.strokeStyle = "#90c9e9";
      context.lineWidth = 1.5;
      context.strokeRect(x, y, layout.cell, layout.cell);
    }
  }

  upperGridPaintConfig.targets.forEach((targetCell) => {
    const x = layout.left + targetCell.column * layout.cell;
    const y = layout.top + targetCell.row * layout.cell;
    context.fillStyle = targetCell.color === "blue" ? "rgba(57,181,224,.22)" : "rgba(255,205,48,.28)";
    context.fillRect(x + 3, y + 3, layout.cell - 6, layout.cell - 6);
  });

  upperGridPaintConfig.obstacles.forEach(({ column, row }) => {
    const x = layout.left + column * layout.cell;
    const y = layout.top + row * layout.cell;
    context.fillStyle = "#6e7f94";
    context.fillRect(x + 4, y + 4, layout.cell - 8, layout.cell - 8);
    context.fillStyle = "#fff";
    context.font = `900 ${Math.max(15, layout.cell * 0.42)}px sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("×", x + layout.cell / 2, y + layout.cell / 2);
  });

  drawRoute(context, layout, target.route, "rgba(13,42,99,.48)", [9, 9], Math.max(7, layout.cell * 0.13));
  drawRoute(context, layout, target.route, "#fff", [9, 9], Math.max(4, layout.cell * 0.075));

  const visibleRouteCount = Math.max(1, Math.ceil(result.route.length * progress));
  if (result.route.length > 1) {
    drawRoute(context, layout, result.route, "rgba(255,255,255,.95)", [], Math.max(9, layout.cell * 0.16), visibleRouteCount);
    drawRoute(context, layout, result.route, "#ef4058", [], Math.max(5, layout.cell * 0.09), visibleRouteCount);
  }

  const visiblePaintCount = Math.ceil(result.painted.length * progress);
  result.painted.slice(0, visiblePaintCount).forEach(({ column, row, color }) => {
    const x = layout.left + column * layout.cell;
    const y = layout.top + row * layout.cell;
    context.fillStyle = color === "blue" ? "#39b5e0" : "#ffcd30";
    context.fillRect(x + 7, y + 7, layout.cell - 14, layout.cell - 14);
  });

  const goal = cellCenter(layout, upperGridPaintConfig.goal);
  context.font = `${Math.max(22, layout.cell * 0.54)}px sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "bottom";
  context.fillText("🏁", goal.x, goal.y - layout.cell * 0.15);
  const robotPoint = result.route[Math.min(result.route.length - 1, visibleRouteCount - 1)] ?? upperGridPaintConfig.start;
  drawRobot(context, layout, robotPoint);
}

export function initUpperGridPaintLesson({ root, onSuccess }) {
  const state = { active: false, running: false, looping: false, token: 0, values: { x: 1, y: 1, n: 1 }, program: [] };

  function showFeedback(title, detail, kind = "") {
    const feedback = root.querySelector("[data-grid-lab-feedback]");
    if (!feedback) return;
    feedback.className = `upper-grid-lab-feedback ${kind}`.trim();
    feedback.innerHTML = `<strong>${escapeText(title)}</strong><span>${escapeText(detail)}</span>`;
  }

  function updateProgram() {
    const list = root.querySelector("[data-grid-lab-program]");
    if (!list) return;
    list.innerHTML = state.program.length
      ? state.program.map((id, index) => {
          const action = actionById.get(id);
          return `<button type="button" data-grid-lab-remove="${index}" aria-label="${escapeText(action.label)}を消す"><span>${index + 1}</span><strong>${escapeText(action.label)}</strong><em>タップで消す</em></button>`;
        }).join("")
      : "<p>左のカードをタップして、短いルールを作ろう</p>";
    const canRun = state.program.length > 0;
    root.querySelectorAll("[data-grid-lab-run]").forEach((button) => { button.disabled = !canRun; });
    drawBoard(root, createUpperGridPaintState(state.program, state.values));
  }

  function updateValues() {
    state.values = normalizeUpperGridPaintValues(state.values);
    for (const key of ["x", "y", "n"]) {
      const input = root.querySelector(`[data-grid-lab-input="${key}"]`);
      if (input) input.value = state.values[key];
      const output = root.querySelector(`[data-grid-lab-value="${key}"]`);
      if (output) output.textContent = state.values[key];
    }
    updateProgram();
  }

  function render(lesson) {
    state.active = true;
    state.running = false;
    state.looping = false;
    state.token += 1;
    state.values = { x: 1, y: 1, n: 1 };
    state.program = [];
    root.className = "picture-experience upper-grid-lab-screen";
    root.innerHTML = `
      <header class="upper-picture-header">
        <button class="picture-back-button" type="button" data-picture-action="hub">もどる</button>
        <div class="upper-picture-title"><small>4〜6年生</small><h1>${escapeText(lesson.title)}</h1></div>
        <div class="upper-picture-goal"><span>きょうのゴール</span><strong>x・y・nと短いルールで、6つのマスを順番にぬろう</strong></div>
        <img src="./assets/robot-mascot.png" alt="案内ロボット">
      </header>
      <section class="learning-focus" aria-label="この単元で学ぶこと">
        <details open><summary>ここから学ぶこと</summary><div class="learning-focus-panel">
          <div class="learning-focus-item"><span aria-hidden="true">🧭</span><strong>座標の差を変数にする</strong><p>xとyを変えると、1枚の移動カードで進むマス数が変わります。</p></div>
          <div class="learning-focus-item"><span aria-hidden="true">🧩</span><strong>短いルールを作る</strong><p>移動と色ぬりの順番を考え、4枚のまとまりを作ります。</p></div>
          <div class="learning-focus-item"><span aria-hidden="true">🔁</span><strong>少なく試してから増やす</strong><p>まずn=1で確かめ、正しければnを増やして6マスをぬります。</p></div>
        </div></details>
      </section>
      <main class="upper-grid-lab-main">
        <section class="upper-grid-lab-builder">
          <div class="upper-step-heading"><span>1</span><div><h2>変数とルールを作る</h2><p>最初の数字は正解ではありません</p></div></div>
          <div class="upper-grid-lab-values">
            ${["x", "y", "n"].map((key) => `<label><strong>${key}</strong><button type="button" data-grid-lab-adjust="${key}" data-delta="-1">−</button><input type="number" min="1" max="4" value="1" data-grid-lab-input="${key}"><button type="button" data-grid-lab-adjust="${key}" data-delta="1">＋</button><small>${key === "x" ? "よこのマス数" : key === "y" ? "たてのマス数" : "まとまりを使う回数"}</small></label>`).join("")}
          </div>
          <div class="upper-grid-lab-palette">
            ${actions.map((action) => `<button type="button" data-grid-lab-add="${action.id}" class="is-${action.id}"><span>${action.icon}</span><strong>${escapeText(action.label)}</strong><small>${escapeText(action.hint)}</small></button>`).join("")}
          </div>
        </section>
        <section class="upper-grid-lab-stage-panel">
          <div class="upper-step-heading"><span>2</span><div><h2>動きを小さく確かめる</h2><p>白い目標線と赤い今の線を見くらべよう</p></div></div>
          <div class="upper-grid-lab-stage"><canvas data-grid-lab-canvas aria-label="マス色ぬりの目標と今の動き"></canvas><div class="upper-path-legend"><span><i class="upper-goal-line"></i>目標</span><span><i class="upper-current-line"></i>今の動き</span></div></div>
        </section>
        <section class="upper-grid-lab-program-panel">
          <div><h2>くりかえすルール</h2><p>カードはタップすると消せます。まずn=1で試し、正しければ回数を増やそう。</p></div>
          <div class="upper-grid-lab-program" data-grid-lab-program></div>
          <div class="upper-grid-lab-run-buttons"><button type="button" data-grid-lab-run="once" disabled>実行する</button><button type="button" data-grid-lab-run="repeat" disabled>繰り返し実行する<small>止めるまで</small></button></div>
          <div class="upper-grid-lab-feedback" data-grid-lab-feedback aria-live="polite"><strong>まずは短いルールを作ろう</strong><span>x・y・nも自分で変えて試せます。</span></div>
        </section>
      </main>`;
    window.requestAnimationFrame(updateProgram);
  }

  async function runOnce() {
    if (state.running || state.program.length === 0) return false;
    const token = ++state.token;
    state.running = true;
    root.classList.add("is-running");
    const result = createUpperGridPaintState(state.program, state.values);
    showFeedback("実行しています", `x=${state.values.x}、y=${state.values.y}、n=${state.values.n}で確かめています。`);
    const duration = Math.max(700, result.route.length * 130);
    const started = performance.now();
    await new Promise((resolve) => {
      const frame = (now) => {
        if (token !== state.token) return resolve();
        const progress = Math.min(1, (now - started) / duration);
        drawBoard(root, result, progress);
        if (progress < 1) window.requestAnimationFrame(frame); else resolve();
      };
      window.requestAnimationFrame(frame);
    });
    if (token !== state.token) return false;
    state.running = false;
    root.classList.remove("is-running");
    if (isUpperGridPaintCorrect(state.program, state.values)) {
      showFeedback("正解！6つのマスを順番にぬれました", "短いルールをn=3回使い、同じ動きを仕組みにできました。", "is-success");
      onSuccess({ repeating: state.looping });
      return true;
    }
    if (result.outcome === "obstacle") showFeedback("しょうがいぶつに当たりました", "x・yの数や、カードの順番を直してみよう。", "is-question");
    else if (result.outcome === "outside") showFeedback("マスの外へ出ました", "動く数と、くりかえす回数を見直そう。", "is-question");
    else showFeedback("目標どおりにぬれたかな？", "白い点線、ぬった色、最後の旗を見て直そう。", "is-question");
    return true;
  }

  async function runRepeatedly() {
    if (state.looping) {
      state.looping = false;
      state.token += 1;
      state.running = false;
      root.classList.remove("is-running");
      showFeedback("繰り返しを止めました", "数字やルールを直して、また試せます。");
      return;
    }
    state.looping = true;
    const button = root.querySelector('[data-grid-lab-run="repeat"]');
    if (button) button.innerHTML = "止める<small>繰り返しを終了</small>";
    while (state.looping) {
      const complete = await runOnce();
      if (!complete || !state.looping || isUpperGridPaintCorrect(state.program, state.values)) break;
      await wait(320);
    }
    state.looping = false;
    if (button) button.innerHTML = "繰り返し実行する<small>止めるまで</small>";
  }

  root.addEventListener("click", (event) => {
    if (!state.active) return;
    const add = event.target.closest("[data-grid-lab-add]");
    if (add && !state.running && state.program.length < 6) {
      state.program.push(add.dataset.gridLabAdd);
      updateProgram();
      return;
    }
    const remove = event.target.closest("[data-grid-lab-remove]");
    if (remove && !state.running) {
      state.program.splice(Number(remove.dataset.gridLabRemove), 1);
      updateProgram();
      return;
    }
    const adjust = event.target.closest("[data-grid-lab-adjust]");
    if (adjust && !state.running) {
      const key = adjust.dataset.gridLabAdjust;
      state.values[key] += Number(adjust.dataset.delta);
      updateValues();
      return;
    }
    const run = event.target.closest("[data-grid-lab-run]");
    if (run?.dataset.gridLabRun === "once") runOnce();
    if (run?.dataset.gridLabRun === "repeat") runRepeatedly();
  });

  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-grid-lab-input]");
    if (!input || !state.active || state.running) return;
    state.values[input.dataset.gridLabInput] = input.value;
    updateValues();
  });
  window.addEventListener("resize", () => { if (state.active) window.requestAnimationFrame(updateProgram); });
  document.addEventListener("easy-scratch-languagechange", () => { if (state.active) window.requestAnimationFrame(updateProgram); });
  return { render, deactivate: () => { state.active = false; state.looping = false; state.token += 1; } };
}
