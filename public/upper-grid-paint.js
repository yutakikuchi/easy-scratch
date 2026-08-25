import {
  createUpperGridPaintState,
  createUpperGridPaintTargetState,
  findUpperGridPaintMismatch,
  isUpperGridPaintCorrect,
  isUpperGridPaintPrefixCorrect,
  normalizeUpperGridPaintCalls,
  upperGridPaintConfig
} from "./upper-grid-paint-logic.js?v=20260825d";

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
    context.fillStyle = "#0d2a63";
    context.font = `900 ${Math.max(11, layout.cell * 0.22)}px sans-serif`;
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText(`${targetCell.callIndex + 1}`, x + 7, y + 5);
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
  const freshCalls = () => upperGridPaintConfig.initialCalls.map((call) => ({ ...call }));
  const state = { active: false, running: false, token: 0, calls: freshCalls(), program: [], lastResult: null, hasUnrunChanges: false };

  function idleResult() {
    return {
      route: [{ ...upperGridPaintConfig.start, command: "start", callIndex: -1 }],
      painted: []
    };
  }

  function drawStoredResult() {
    const stage = root.querySelector(".upper-grid-lab-stage");
    const status = root.querySelector("[data-grid-lab-stage-status]");
    stage?.classList.toggle("has-result", Boolean(state.lastResult));
    stage?.classList.toggle("has-unrun-changes", Boolean(state.lastResult && state.hasUnrunChanges));
    if (status) {
      if (!state.lastResult) status.textContent = "まだ実行していません。「試す」を押すと赤い線が出ます";
      else if (state.hasUnrunChanges) status.textContent = "赤い線は前回の実行結果です。追加したルールや数値は、次に「試す」を押すと反映されます";
      else status.textContent = "赤い線は、最後に実行した結果です";
    }
    drawBoard(root, state.lastResult ?? idleResult());
  }

  function showFeedback(title, detail, kind = "") {
    const feedback = root.querySelector("[data-grid-lab-feedback]");
    if (!feedback) return;
    feedback.className = `upper-grid-lab-feedback ${kind}`.trim();
    feedback.innerHTML = `<strong>${escapeText(title)}</strong><span>${escapeText(detail)}</span>`;
  }

  function updateProgram({ markEdited = false } = {}) {
    const list = root.querySelector("[data-grid-lab-program]");
    if (!list) return;
    if (markEdited && state.lastResult) state.hasUnrunChanges = true;
    list.innerHTML = state.program.length
      ? state.program.map((id, index) => {
          const action = actionById.get(id);
          return `<button type="button" data-grid-lab-remove="${index}" aria-label="${escapeText(action.label)}を消す"><span>${index + 1}</span><strong>${escapeText(action.label)}</strong><em>タップで消す</em></button>`;
        }).join("")
      : "<p>左のカードをタップして、再利用するルールを1つ作ろう</p>";
    const count = root.querySelector("[data-grid-lab-rule-count]");
    if (count) count.textContent = `${state.program.length} / 6`;
    const canRun = state.program.length > 0;
    root.querySelectorAll("[data-grid-lab-run]").forEach((button) => { button.disabled = !canRun; });
    drawStoredResult();
  }

  function updateCalls() {
    state.calls = normalizeUpperGridPaintCalls(state.calls);
    state.calls.forEach((call, callIndex) => {
      for (const key of ["x", "y"]) {
        const input = root.querySelector(`[data-grid-lab-call-input="${callIndex}"][data-key="${key}"]`);
        if (input) input.value = call[key];
      }
    });
    updateProgram({ markEdited: true });
  }

  function render(lesson) {
    state.active = true;
    state.running = false;
    state.token += 1;
    state.calls = freshCalls();
    state.program = [];
    state.lastResult = null;
    state.hasUnrunChanges = false;
    root.className = "picture-experience upper-grid-lab-screen";
    root.innerHTML = `
      <header class="upper-picture-header">
        <button class="picture-back-button" type="button" data-picture-action="hub">もどる</button>
        <div class="upper-picture-title"><small>4〜6年生</small><h1>${escapeText(lesson.title)}</h1></div>
        <div class="upper-picture-goal"><span>きょうのゴール</span><strong>1つのルールへ毎回ちがうx・yを渡し、3つの形をぬろう</strong></div>
        <img src="./assets/robot-mascot.png" alt="案内ロボット">
      </header>
      <section class="learning-focus" aria-label="この単元で学ぶこと">
        <details open><summary>ここから学ぶこと</summary><div class="learning-focus-panel">
          <div class="learning-focus-item"><span aria-hidden="true">📦</span><strong>値を受け取るルールを作る</strong><p>移動する数を固定せず、ルール(x, y)が値を受け取る形にします。</p></div>
          <div class="learning-focus-item"><span aria-hidden="true">♻️</span><strong>同じルールを再利用する</strong><p>6枚をコピーせず、呼び出すたびにx・yだけを変えて3つの形を作ります。</p></div>
          <div class="learning-focus-item"><span aria-hidden="true">🔎</span><strong>呼び出しごとに確かめる</strong><p>まず1回目だけを試し、その後に3組の値をまとめて実行します。</p></div>
        </div></details>
      </section>
      <main class="upper-grid-lab-main">
        <section class="upper-grid-lab-builder">
          <div class="upper-step-heading"><span>1</span><div><h2>変数を使うルールを1つ作る</h2><p>x・yの値は、ルールを使うときに渡します</p></div></div>
          <div class="upper-grid-lab-function-note">
            <strong>再利用するルール（x, y）</strong>
            <p><code>x</code>は横、<code>y</code>は縦に動くマス数。ここでは数字を決めず、x・yを使う6枚を組み立てます。</p>
          </div>
          <div class="upper-grid-lab-palette">
            ${actions.map((action) => `<button type="button" data-grid-lab-add="${action.id}" class="is-${action.id}"><span>${action.icon}</span><strong>${escapeText(action.label)}</strong><small>${escapeText(action.hint)}</small></button>`).join("")}
          </div>
        </section>
        <section class="upper-grid-lab-stage-panel">
          <div class="upper-step-heading"><span>2</span><div><h2>3つの呼び出しを見くらべる</h2><p>白い線の①②③は、同じルールを別の値で使う区切りです</p></div></div>
          <div class="upper-grid-lab-stage"><canvas data-grid-lab-canvas aria-label="マス色ぬりの目標と実行結果"></canvas><div class="upper-path-legend"><span><i class="upper-goal-line"></i>目標</span><span><i class="upper-current-line"></i>実行結果</span></div><p class="upper-grid-lab-stage-status" data-grid-lab-stage-status>まだ実行していません。「試す」を押すと赤い線が出ます</p></div>
        </section>
        <section class="upper-grid-lab-program-panel">
          <div class="upper-grid-lab-program-heading"><div><span class="upper-step-number">3</span><div><h2>同じルールへ3組の値を渡す</h2><p>6枚は1つだけ。呼び出すたびにx・yを変えて再利用します。</p></div></div><strong data-grid-lab-rule-count>0 / 6</strong></div>
          <div class="upper-grid-lab-rule-area"><strong>再利用するルール（x, y）</strong><div class="upper-grid-lab-program" data-grid-lab-program></div></div>
          <div class="upper-grid-lab-calls" aria-label="ルールを再利用する3回の呼び出し">
            ${state.calls.map((call, callIndex) => `<section class="upper-grid-lab-call"><strong><span>${callIndex + 1}</span>回目：ルール（x, y）</strong><div>${["x", "y"].map((key) => `<label><b>${key}</b><button type="button" data-grid-lab-call-adjust="${callIndex}" data-key="${key}" data-delta="-1" aria-label="${callIndex + 1}回目の${key}を1減らす">−</button><input type="number" min="1" max="4" value="${call[key]}" data-grid-lab-call-input="${callIndex}" data-key="${key}" aria-label="${callIndex + 1}回目の${key}"><button type="button" data-grid-lab-call-adjust="${callIndex}" data-key="${key}" data-delta="1" aria-label="${callIndex + 1}回目の${key}を1増やす">＋</button></label>`).join("")}</div><small>白い線の${callIndex + 1}に合う値を渡そう</small></section>`).join("")}
          </div>
          <div class="upper-grid-lab-run-buttons"><button type="button" data-grid-lab-run="first" disabled>① 1回目だけ試す</button><button type="button" data-grid-lab-run="all" disabled>② 3回をまとめて実行<small>同じ6枚を3回再利用</small></button></div>
          <div class="upper-grid-lab-feedback" data-grid-lab-feedback aria-live="polite"><strong>まずは再利用するルールを作ろう</strong><span>次に、①②③へ別々のx・yを渡します。</span></div>
        </section>
      </main>`;
    window.requestAnimationFrame(updateProgram);
  }

  async function runCalls(callCount) {
    if (state.running || state.program.length === 0) return false;
    const token = ++state.token;
    state.running = true;
    root.classList.add("is-running");
    const selectedCalls = state.calls.slice(0, callCount);
    const result = createUpperGridPaintState(state.program, selectedCalls);
    state.lastResult = result;
    state.hasUnrunChanges = false;
    root.querySelector(".upper-grid-lab-stage")?.classList.add("has-result");
    root.querySelector(".upper-grid-lab-stage")?.classList.remove("has-unrun-changes");
    const stageStatus = root.querySelector("[data-grid-lab-stage-status]");
    if (stageStatus) stageStatus.textContent = "赤い実行結果を描いています";
    const callText = selectedCalls.map((call, index) => `${index + 1}回目(x=${call.x}, y=${call.y})`).join("、");
    showFeedback("同じルールを呼び出しています", callText);
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
    if (stageStatus) stageStatus.textContent = "赤い線は、最後に実行した結果です";
    if (callCount === 1 && isUpperGridPaintPrefixCorrect(state.program, state.calls, 1)) {
      showFeedback("1回目の呼び出しは正解！", "同じ6枚はそのままに、2回目と3回目へ別のx・yを渡そう。", "is-success");
      return true;
    }
    if (callCount === upperGridPaintConfig.targetCalls.length && isUpperGridPaintCorrect(state.program, state.calls)) {
      showFeedback("正解！1つのルールを3回再利用できました", "同じ6枚へ毎回ちがうx・yを渡して、3つの形を作れました。", "is-success");
      onSuccess({ repeating: false });
      return true;
    }
    const mismatch = callCount === 1 ? 0 : findUpperGridPaintMismatch(state.program, state.calls);
    if (result.outcome === "obstacle") showFeedback("しょうがいぶつに当たりました", `${Math.max(1, mismatch + 1)}回目のx・yか、6枚の順番を見直そう。`, "is-question");
    else if (result.outcome === "outside") showFeedback("マスの外へ出ました", `${Math.max(1, mismatch + 1)}回目に渡すx・yを小さくして確かめよう。`, "is-question");
    else showFeedback(`${Math.max(1, mismatch + 1)}回目を見直そう`, "白い線の番号と、青・黄のマスを見てx・yを直そう。", "is-question");
    return true;
  }

  root.addEventListener("click", (event) => {
    if (!state.active) return;
    const add = event.target.closest("[data-grid-lab-add]");
    if (add && !state.running && state.program.length < 6) {
      state.program.push(add.dataset.gridLabAdd);
      updateProgram({ markEdited: true });
      return;
    }
    const remove = event.target.closest("[data-grid-lab-remove]");
    if (remove && !state.running) {
      state.program.splice(Number(remove.dataset.gridLabRemove), 1);
      updateProgram({ markEdited: true });
      return;
    }
    const adjust = event.target.closest("[data-grid-lab-call-adjust]");
    if (adjust && !state.running) {
      const callIndex = Number(adjust.dataset.gridLabCallAdjust);
      const key = adjust.dataset.key;
      state.calls[callIndex][key] += Number(adjust.dataset.delta);
      updateCalls();
      return;
    }
    const run = event.target.closest("[data-grid-lab-run]");
    if (run?.dataset.gridLabRun === "first") runCalls(1);
    if (run?.dataset.gridLabRun === "all") runCalls(upperGridPaintConfig.targetCalls.length);
  });

  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-grid-lab-call-input]");
    if (!input || !state.active || state.running) return;
    const callIndex = Number(input.dataset.gridLabCallInput);
    state.calls[callIndex][input.dataset.key] = input.value;
    updateCalls();
  });
  window.addEventListener("resize", () => { if (state.active) window.requestAnimationFrame(updateProgram); });
  document.addEventListener("easy-scratch-languagechange", () => { if (state.active) window.requestAnimationFrame(updateProgram); });
  return { render, deactivate: () => { state.active = false; state.token += 1; } };
}
