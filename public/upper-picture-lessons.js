import {
  clampLessonValue,
  createKickPath,
  createPatternArtRoute,
  createRescueCoordinateGrid,
  createRescueRoute,
  expandRescueProgram,
  isPatternCorrect,
  isRescueCorrect,
  kickInitialForce,
  kickTargetForce,
  mapRescuePoint,
  patternSideCount,
  patternTarget,
  rescueInitialValues,
  rescueTargetProgram,
  rescueTargetRule,
  rescueTargetValues
} from "./upper-picture-lesson-logic.js?v=20260718l";
import {
  applyKickProgram,
  kickCorrectionActions,
  kickOutcomeLabels,
} from "./upper-free-kick-program.js?v=20260717s";

const directionLabels = {
  right: "右へ",
  up: "上へ",
  left: "左へ",
  down: "下へ"
};

const lessonGoals = {
  rescue: "5つの移動ルールを3回くりかえし、1〜6を順番に取ろう",
  keyframe: "x・yの力を変えて、壁をこえるフリーキックを再現しよう",
  pattern: "二重のくりかえしで、六角形の花をかこう"
};

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canvasSetup(root) {
  const canvas = root.querySelector("[data-upper-canvas]");
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

function canvasBounds(root) {
  const canvas = root.querySelector("[data-upper-canvas]");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return { width: rect.width, height: rect.height };
}

function drawRescueGrid(context, width, height) {
  const grid = createRescueCoordinateGrid(width, height);
  context.save();
  [...grid.columns, ...grid.rows].forEach((line) => {
    const isColumn = grid.columns.includes(line);
    context.strokeStyle = line.major ? "rgba(13, 42, 99, .32)" : "rgba(255, 255, 255, .72)";
    context.lineWidth = line.major ? 2 : 1;
    context.beginPath();
    context.moveTo(isColumn ? line.position : 0, isColumn ? 0 : line.position);
    context.lineTo(isColumn ? line.position : width, isColumn ? height : line.position);
    context.stroke();
  });

  context.strokeStyle = "rgba(13, 42, 99, .78)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, grid.origin.y);
  context.lineTo(width - 12, grid.origin.y);
  context.moveTo(grid.origin.x, height);
  context.lineTo(grid.origin.x, 12);
  context.stroke();

  context.fillStyle = "rgba(13, 42, 99, .9)";
  context.strokeStyle = "rgba(255, 255, 255, .92)";
  context.lineWidth = 4;
  context.font = "900 13px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  grid.columns.filter((line) => line.value >= 0 && line.value % grid.labelEvery === 0).forEach((line) => {
    const y = Math.min(height - 20, grid.origin.y + 9);
    context.strokeText(String(line.value), line.position, y);
    context.fillText(String(line.value), line.position, y);
  });
  context.textAlign = "left";
  context.textBaseline = "middle";
  grid.rows.filter((line) => line.value !== 0 && line.value % grid.labelEvery === 0).forEach((line) => {
    const x = Math.min(width - 30, grid.origin.x + 9);
    context.strokeText(String(line.value), x, line.position);
    context.fillText(String(line.value), x, line.position);
  });

  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = "900 18px sans-serif";
  context.strokeText("x →", width - 12, grid.origin.y - 8);
  context.fillText("x →", width - 12, grid.origin.y - 8);
  context.textAlign = "left";
  context.textBaseline = "top";
  context.strokeText("y ↑", grid.origin.x + 8, 12);
  context.fillText("y ↑", grid.origin.x + 8, 12);

  context.beginPath();
  context.arc(grid.origin.x, grid.origin.y, 6, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPath(context, points, color, dash, width) {
  if (points.length < 2) return;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.stroke();
  context.restore();
}

function upperHeader(lesson, goal) {
  return `
    <header class="upper-picture-header">
      <button class="picture-back-button" type="button" data-picture-action="hub">もどる</button>
      <div class="upper-picture-title"><small>4〜6年生</small><h1>${escapeText(lesson.title)}</h1></div>
      <div class="upper-picture-goal"><span>きょうのゴール</span><strong>${escapeText(goal)}</strong></div>
      <img src="./assets/robot-mascot.png" alt="案内ロボット">
    </header>
  `;
}

function upperLearningFocus(lessonId) {
  const copyByLesson = {
    rescue: [
      ["📍", "座標の差を読む", "次の番号までのx・yの差を読み、移動ルールに変えます。"],
      ["🧩", "5枚を1つのまとまりにする", "右・上・左・下を組み合わせ、同じ形の移動を作ります。"],
      ["🔁", "まとまりをくりかえす", "作った5枚のルールを3回使い、1〜6を順番に集めます。"]
    ],
    keyframe: [
      ["⚽", "結果から原因を考える", "シュート結果を見て、よこの力と上の力のどちらを直すか考えます。"],
      ["🔧", "自動修正ルールを作る", "手前に落ちた、壁に当たったなどの結果から次の修正を選びます。"],
      ["🏁", "軌道を再現する", "白い目標線に近づくように、力の値を少しずつ調整します。"]
    ],
    pattern: [
      ["📐", "変数で形を変える", "x・θ・nの数字を変え、線の長さ・角度・回数を調整します。"],
      ["⬡", "小さなルールで六角形を作る", "前へ進む、右へ曲がるを6回使って1つの形を作ります。"],
      ["🔁", "二重のくりかえしを使う", "できた六角形をさらにくりかえして、花の模様にします。"]
    ]
  };
  const items = copyByLesson[lessonId] ?? copyByLesson.rescue;
  return `
    <section class="learning-focus" aria-label="この単元で学ぶこと">
      <details open>
        <summary>ここから学ぶこと</summary>
        <div class="learning-focus-panel">
          ${items.map(([icon, title, text]) => `<div class="learning-focus-item"><span aria-hidden="true">${icon}</span><strong>${escapeText(title)}</strong><p>${escapeText(text)}</p></div>`).join("")}
        </div>
      </details>
    </section>
  `;
}

function stageLegend() {
  return `
    <div class="upper-path-legend" aria-label="線の見方">
      <span><i class="upper-goal-line"></i>目標</span>
      <span><i class="upper-current-line"></i>今の動き</span>
    </div>
  `;
}

function feedbackMarkup(title, detail) {
  return `<div class="upper-run-feedback" data-upper-feedback aria-live="polite"><strong>${title}</strong><span>${detail}</span></div>`;
}

export function initUpperPictureLessons({ root, onSuccess }) {
  const state = {
    lesson: null,
    kind: null,
    running: false,
    looping: false,
    runToken: 0,
    hasRun: false,
    rescue: {
      values: { ...rescueInitialValues },
      program: [],
      repeatCount: 1
    },
    keyframe: { force: { ...kickInitialForce }, program: [], history: [], pendingOutcome: null },
    pattern: { distance: 60, angle: 60, count: 1 }
  };

  function reset(lesson) {
    state.lesson = lesson;
    state.kind = lesson.id;
    state.running = false;
    state.looping = false;
    state.runToken += 1;
    state.hasRun = false;
    state.rescue = { values: { ...rescueInitialValues }, program: [], repeatCount: 1 };
    state.keyframe = { force: { ...kickInitialForce }, program: [], history: [], pendingOutcome: null };
    state.pattern = { distance: 60, angle: 60, count: 1 };
  }

  function render(lesson) {
    reset(lesson);
    if (lesson.id === "rescue") renderRescue();
    else if (lesson.id === "keyframe") renderKeyframe();
    else renderPattern();
  }

  function runControls(action, label, disabled = false) {
    return `
      <section class="picture-run-controls">
        <button class="upper-primary-button" type="button" data-upper-action="${action}" ${disabled ? "disabled" : ""}>${label}</button>
        <button class="picture-repeat-button" type="button" data-upper-action="repeat-run" ${disabled ? "disabled" : ""}>
          <strong>繰り返し実行する</strong><small>止めるまで</small>
        </button>
      </section>
    `;
  }

  function renderRescue() {
    root.className = "picture-experience upper-picture-screen upper-rescue-screen";
    root.innerHTML = `
      ${upperHeader(state.lesson, lessonGoals.rescue)}
      ${upperLearningFocus("rescue")}
      <main class="upper-picture-main">
        <section class="upper-parameter-panel" aria-labelledby="upperRescueRuleTitle">
          <div class="upper-step-heading"><span>1</span><div><h2 id="upperRescueRuleTitle">座標から移動ルールを考える</h2><p>5枚のまとまりを作り、同じルールを3回使います</p></div></div>
          <div class="upper-direction-list">
            ${Object.entries(directionLabels).map(([key, label]) => `
              <div class="upper-direction-row upper-direction-${key}">
                <strong>${label}</strong>
                <div class="upper-number-control">
                  <button type="button" data-upper-adjust="rescue" data-key="${key}" data-delta="-10" aria-label="${label}の数を10減らす">−</button>
                  <input type="number" min="20" max="200" step="10" value="${state.rescue.values[key]}" data-upper-input="rescue" data-key="${key}" aria-label="${label}動く数">
                  <button type="button" data-upper-adjust="rescue" data-key="${key}" data-delta="10" aria-label="${label}の数を10増やす">＋</button>
                </div>
                <button class="upper-add-command" type="button" data-upper-action="add-rescue" data-key="${key}">追加</button>
              </div>
            `).join("")}
          </div>
          <p class="upper-parameter-hint">さいしょの数は正解ではありません。座標の差を読み、5枚の順番・4方向の数・くりかえす回数をすべて考えよう。</p>
        </section>
        <section class="upper-stage-panel" aria-labelledby="upperRescueStageTitle">
          <div class="upper-step-heading"><span>2</span><div><h2 id="upperRescueStageTitle">座標平面で1〜6を集める</h2><p>1マス20。5つの移動を3回くりかえして確かめます</p></div></div>
          <div class="upper-stage upper-stage-coordinate">
            <canvas data-upper-canvas aria-label="座標レスキューの目標線と今の動き"></canvas>
            ${stageLegend()}
            <div class="upper-coordinate-scale" aria-label="座標は1マス20">1マス = 20</div>
            <div class="upper-stage-sprite" data-upper-sprite><img src="./assets/robot-mascot.png" alt="動くロボット"></div>
          </div>
        </section>
        <section class="upper-program-panel">
          <div class="upper-program-title"><div><h2>くりかえすルール</h2><p>5枚をひとまとまりにして、×3で6個の番号を集めます</p><small class="upper-tap-delete-note">いらないルールは、カードをタップすると消せます</small></div><div><button type="button" data-upper-action="clear-rescue">ぜんぶ消す</button></div></div>
          <div class="upper-program-row">
            <div class="upper-rescue-rule">
              <div class="upper-program-list" data-upper-program-list></div>
              <div class="upper-rescue-repeat" aria-label="ルールを使う回数">
                <strong>この5枚を</strong>
                <button type="button" data-upper-action="rescue-repeat" data-count="1">×1</button>
                <button type="button" data-upper-action="rescue-repeat" data-count="2">×2</button>
                <button type="button" data-upper-action="rescue-repeat" data-count="3">×3</button>
              </div>
            </div>
            ${runControls("run-rescue", "実行する", true)}
          </div>
          ${feedbackMarkup("5枚のルールを作って×3にしよう", "正解でなくても実行できます。赤い線と座標を見て、順番・数・回数を直そう。")}
        </section>
      </main>
    `;
    renderRescueProgram();
  }

  function renderRescueProgram() {
    const list = root.querySelector("[data-upper-program-list]");
    const runButton = root.querySelector('[data-upper-action="run-rescue"]');
    const repeatButton = root.querySelector('[data-upper-action="repeat-run"]');
    if (!list || !runButton || !repeatButton) return;
    list.innerHTML = state.rescue.program.length
      ? state.rescue.program.map((command, index) => `
          <button class="upper-program-command" type="button" data-upper-action="remove-rescue" data-index="${index}" aria-label="${index + 1}番目の${directionLabels[command.direction]}${command.value}を外す">
            <span>${index + 1}</span><strong>${directionLabels[command.direction]} ${command.value}</strong><em>タップで消す</em>
          </button>
        `).join("")
      : `<p>左の「追加」を押して、ルールを作ろう</p>`;
    root.querySelectorAll('[data-upper-action="rescue-repeat"]').forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.count) === state.rescue.repeatCount);
    });
    runButton.disabled = state.running || state.looping || state.rescue.program.length === 0;
    repeatButton.disabled = !state.looping && (state.running || state.rescue.program.length === 0);
    state.hasRun = false;
    window.requestAnimationFrame(drawRescue);
  }

  function rescuePoint(point, width, height) {
    return mapRescuePoint(point, width, height);
  }

  function drawRescue() {
    if (state.kind !== "rescue") return;
    const setup = canvasSetup(root);
    if (!setup) return;
    const { context, width, height } = setup;
    context.clearRect(0, 0, width, height);
    drawRescueGrid(context, width, height);
    const targetRoute = createRescueRoute(rescueTargetProgram, rescueTargetValues);
    const currentProgram = expandRescueProgram(state.rescue.program, state.rescue.repeatCount);
    const currentRoute = createRescueRoute(currentProgram, state.rescue.values);
    const target = targetRoute.map((point) => rescuePoint(point, width, height));
    const current = currentRoute.map((point) => rescuePoint(point, width, height));
    if (current.length > 1) {
      drawPath(context, current, "rgba(255,255,255,.95)", [], 13);
      drawPath(context, current, "#ee4057", [], 8);
    }
    drawPath(context, target, "rgba(13, 42, 99, .55)", [12, 12], 11);
    drawPath(context, target, "#fff", [12, 12], 6);
    [3, 5, 8, 10, 13, 15].forEach((routeIndex, beaconIndex) => {
      const point = target[routeIndex];
      context.fillStyle = "#fff";
      context.strokeStyle = "#2589db";
      context.lineWidth = 5;
      context.beginPath();
      context.arc(point.x, point.y, 18, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#0d2a63";
      context.font = "900 16px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(beaconIndex + 1), point.x, point.y);
    });
    const start = target[0];
    context.fillStyle = "#0d2a63";
    context.font = "900 14px sans-serif";
    context.fillText(window.easyScratchI18n?.t("スタート") ?? "スタート", start.x + 8, start.y + 42);
    const finish = target.at(-1);
    const poleX = finish.x + 24;
    const flagTop = Math.max(24, finish.y - 78);
    context.strokeStyle = "#0d2a63";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(poleX, finish.y + 18);
    context.lineTo(poleX, flagTop);
    context.stroke();
    context.fillStyle = "#ff566f";
    context.beginPath();
    context.moveTo(poleX, flagTop);
    context.lineTo(poleX + 44, flagTop + 14);
    context.lineTo(poleX, flagTop + 28);
    context.closePath();
    context.fill();
    const goalX = Math.min(width - 70, finish.x - 26);
    const goalY = Math.max(28, flagTop - 4);
    context.fillStyle = "#ffcf33";
    context.fillRect(goalX - 48, goalY - 19, 96, 38);
    context.strokeStyle = "#0d2a63";
    context.lineWidth = 3;
    context.strokeRect(goalX - 48, goalY - 19, 96, 38);
    context.fillStyle = "#0d2a63";
    context.font = "900 17px sans-serif";
    context.fillText(window.easyScratchI18n?.t("ゴール") ?? "ゴール", goalX, goalY);
    const spritePoint = state.hasRun ? current.at(-1) : current[0];
    setSprite(spritePoint);
  }

  function renderKeyframe() {
    root.className = "picture-experience upper-picture-screen upper-keyframe-screen";
    root.innerHTML = `
      ${upperHeader(state.lesson, lessonGoals.keyframe)}
      ${upperLearningFocus("keyframe")}
      <main class="upper-picture-main">
        <section class="upper-parameter-panel" aria-labelledby="upperKeyframeRuleTitle">
          <div class="upper-step-heading"><span>1</span><div><h2 id="upperKeyframeRuleTitle">結果を見て、自分で直す</h2><p>最初は1回シュートすることだけできます</p></div></div>
          <div class="upper-kick-force" aria-label="次のシュートの力">
            <div><span>よこの力</span><strong>x = <b data-kick-force="x">${state.keyframe.force.x}</b></strong><small>飛ぶきょり</small></div>
            <div><span>うえの力</span><strong>y = <b data-kick-force="y">${state.keyframe.force.y}</b></strong><small>ボールの高さ</small></div>
          </div>
          <div class="upper-kick-correction" data-kick-correction></div>
        </section>
        <section class="upper-stage-panel" aria-labelledby="upperKeyframeStageTitle">
          <div class="upper-step-heading"><span>2</span><div><h2 id="upperKeyframeStageTitle">フリーキックの軌道を再現する</h2><p>白いお手本のように、壁をこえてゴールへ落とそう</p></div></div>
          <div class="upper-stage upper-stage-park upper-soccer-stage">
            <div class="upper-soccer-field-lines" aria-hidden="true"></div>
            <canvas data-upper-canvas aria-label="サッカーボールの目標軌道と今の軌道"></canvas>
            ${stageLegend()}
            <div class="upper-soccer-kicker"><span>キック！</span><img src="./assets/robot-mascot.png" alt="ボールを蹴るロボット"></div>
            <div class="upper-free-kick-wall" aria-label="ゴールを守る4人の壁"><strong>かべ</strong>${[1, 2, 3, 4].map(() => "<span></span>").join("")}</div>
            <div class="upper-soccer-goal" aria-label="サッカーゴール"><strong>ゴール</strong></div>
            ${[0, 1, 2].map((index) => `<div class="upper-frame-ghost upper-ball-ghost" data-upper-ghost="${index}" aria-hidden="true">⚽</div>`).join("")}
            <div class="upper-stage-sprite upper-soccer-ball" data-upper-sprite role="img" aria-label="動くサッカーボール">⚽</div>
          </div>
        </section>
        <section class="upper-program-panel upper-timeline-panel">
          <div class="upper-program-title"><div><h2>できた自動修正ルール</h2><p>自分で試した直し方だけが、ここに保存されます</p><small class="upper-tap-delete-note">いらないルールは、カードをタップすると消せます</small></div><div><button type="button" data-upper-action="reset-keyframe">最初からやりなおす</button></div></div>
          <div class="upper-kick-program" data-kick-program></div>
          <div class="upper-kick-history" data-kick-history></div>
          ${runControls("run-keyframe", "1回シュート")}
          ${feedbackMarkup("まずは1回シュートしよう", "結果を見るまでは、修正カードは使えません。")}
        </section>
      </main>
    `;
    renderKeyframeProgram();
    window.requestAnimationFrame(drawKeyframe);
  }

  function renderKeyframeProgram() {
    ["x", "y"].forEach((key) => {
      const value = root.querySelector(`[data-kick-force="${key}"]`);
      if (value) value.textContent = state.keyframe.force[key];
    });
    const program = root.querySelector("[data-kick-program]");
    if (program) {
      program.innerHTML = state.keyframe.program.length
        ? state.keyframe.program.map((rule, index) => {
          const action = kickCorrectionActions.find((candidate) => candidate.id === rule.actionId);
          return `<button type="button" data-upper-action="remove-kick-rule" data-index="${index}" aria-label="${kickOutcomeLabels[rule.outcome]}のルールを外す"><span>${index + 1}</span><strong>もし ${kickOutcomeLabels[rule.outcome]}</strong><b>→</b><em>${action?.label ?? "何もしない"}</em><small>タップで消す</small></button>`;
        }).join("")
        : "<p>まだルールはありません。まずシュートして、結果を見よう。</p>";
    }

    const correction = root.querySelector("[data-kick-correction]");
    if (correction) {
      const outcome = state.keyframe.pendingOutcome;
      const actions = outcome === "goal"
        ? kickCorrectionActions.filter((action) => action.stop)
        : kickCorrectionActions.filter((action) => !action.stop);
      correction.innerHTML = outcome
        ? `<h3>「${kickOutcomeLabels[outcome]}」をどう直す？</h3><p>自分で1つ選ぶと、次の力と自動修正ルールになります。</p><div>${actions.map((action) => `<button type="button" data-upper-action="apply-kick-correction" data-action-id="${action.id}">${action.label}</button>`).join("")}</div>`
        : state.keyframe.history.length
          ? "<h3>次のシュートを試そう</h3><p>保存したルールは、あとで自動実行できます。</p>"
          : "<h3>できることは、まだシュートだけ</h3><p>スタートはロボットの足元に固定。結果が出ると、自分で考える修正カードが開きます。</p>";
    }

    const history = root.querySelector("[data-kick-history]");
    if (history) {
      history.innerHTML = state.keyframe.history.length
        ? `<strong>試した記録</strong><div>${state.keyframe.history.map((attempt, index) => `<span><b>${index + 1}回目</b> x=${attempt.force.x}・y=${attempt.force.y}<em>${kickOutcomeLabels[attempt.outcome]}</em></span>`).join("")}</div>`
        : "";
    }
    const repeat = root.querySelector('[data-upper-action="repeat-run"]');
    if (repeat && !state.looping) repeat.disabled = state.running || state.keyframe.history.length === 0;
    const run = root.querySelector('[data-upper-action="run-keyframe"]');
    if (run) run.disabled = state.running || state.looping || Boolean(state.keyframe.pendingOutcome);
    updateRepeatButton();
  }

  function keyframePoint(point, width, height) {
    const startRatio = width < 420 ? 0.2 : 0.12;
    const travelRatio = 0.84 - startRatio;
    return {
      x: width * startRatio + point.x * width * travelRatio / 240,
      y: height * 0.72 + point.y * height * 0.5 / 100,
      rotation: point.rotation,
      time: point.time,
      offset: point.offset
    };
  }

  function drawKeyframe() {
    if (state.kind !== "keyframe") return;
    const setup = canvasSetup(root);
    if (!setup) return;
    const { context, width, height } = setup;
    context.clearRect(0, 0, width, height);
    const targetPath = createKickPath(kickTargetForce).map((point) => keyframePoint(point, width, height));
    const currentPath = createKickPath(state.keyframe.force).map((point) => keyframePoint(point, width, height));
    state.keyframe.history.forEach((attempt) => {
      const triedPath = createKickPath(attempt.force).map((point) => keyframePoint(point, width, height));
      drawPath(context, triedPath, "rgba(238, 64, 87, .24)", [], 5);
    });
    drawPath(context, currentPath, "rgba(255,255,255,.95)", [], 13);
    drawPath(context, currentPath, "#ee4057", [], 8);
    drawPath(context, targetPath, "rgba(13, 42, 99, .55)", [12, 12], 11);
    drawPath(context, targetPath, "#fff", [12, 12], 6);
    [targetPath[0], targetPath[Math.floor(targetPath.length / 2)], targetPath.at(-1)].forEach((point, index) => {
      const ghost = root.querySelector(`[data-upper-ghost="${index}"]`);
      if (ghost) {
        ghost.style.left = `${point.x}px`;
        ghost.style.top = `${point.y}px`;
        ghost.style.transform = `translate(-50%, -50%) rotate(${point.rotation}deg)`;
      }
    });
    setSprite(state.hasRun ? currentPath.at(-1) : currentPath[0]);
  }

  function renderPattern() {
    root.className = "picture-experience upper-picture-screen upper-pattern-screen";
    root.innerHTML = `
      ${upperHeader(state.lesson, lessonGoals.pattern)}
      ${upperLearningFocus("pattern")}
      <main class="upper-picture-main">
        <section class="upper-parameter-panel" aria-labelledby="upperPatternRuleTitle">
          <div class="upper-step-heading"><span>1</span><div><h2 id="upperPatternRuleTitle">六角形を何回かくか決める</h2><p>x・θで六角形を作り、nでかく回数を変えます</p></div></div>
          <div class="upper-pattern-fields">
            ${[
              ["distance", "前へ x", "x は線の長さ", 20, 120, 10],
              ["angle", "右へ θ", "θ は曲がる角度", 30, 120, 10],
              ["count", "くりかえす n", "n は六角形をかく回数", 1, 6, 1]
            ].map(([key, label, hint, min, max, step]) => `
              <label><strong>${label}</strong><div class="upper-number-control">
                <button type="button" data-upper-adjust="pattern" data-key="${key}" data-delta="-${step}" aria-label="${label}を${step}減らす">−</button>
                <input type="number" min="${min}" max="${max}" step="${step}" value="${state.pattern[key]}" data-upper-input="pattern" data-key="${key}" aria-label="${label}の数">
                <button type="button" data-upper-adjust="pattern" data-key="${key}" data-delta="${step}" aria-label="${label}を${step}増やす">＋</button>
              </div><small>${hint}</small></label>
            `).join("")}
          </div>
          <div class="upper-pattern-equation" data-pattern-equation>
            <strong><span data-pattern-equation-angle>${state.pattern.angle}°</span> × <span data-pattern-equation-count>${patternSideCount}辺</span> = <span data-pattern-equation-total>${state.pattern.angle * patternSideCount}°</span></strong>
            <span data-pattern-equation-status>一周の360°と見くらべよう</span>
          </div>
          <p class="upper-parameter-hint">ここは1つの共有ルールです。xは大きさ、θは六角形の曲がり方、nは同じ六角形をかく回数です。n=1なら1個だけかきます。</p>
        </section>
        <section class="upper-stage-panel" aria-labelledby="upperPatternStageTitle">
          <div class="upper-step-heading"><span>2</span><div><h2 id="upperPatternStageTitle">六角形の花をたしかめる</h2><p>白い目標と、ロボットがかく赤い線を見くらべよう</p></div></div>
          <div class="upper-stage upper-pattern-stage">
            <canvas data-upper-canvas aria-label="六角形の花の目標線と今の形"></canvas>
            ${stageLegend()}
            <div class="upper-stage-sprite upper-pen-sprite" data-upper-sprite><img src="./assets/robot-mascot.png" alt="線をかくロボット"></div>
          </div>
        </section>
        <section class="upper-program-panel">
          <div class="upper-program-title"><div><h2>二重のくりかえしルール</h2><p>六角形を1個作り、できた六角形をn回かきます</p></div><div><button type="button" data-upper-action="sample-pattern">ヒント</button><button type="button" data-upper-action="reset-pattern">やりなおす</button></div></div>
          <div class="upper-pattern-rule">
            <div class="upper-pattern-inner-rule"><small>内側のくりかえし</small><strong>前へ x → 右へ θ</strong><span><i data-pattern-summary="distance">x = ${state.pattern.distance}</i>・<i data-pattern-summary="angle">θ = ${state.pattern.angle}°</i>・6辺</span></div>
            <b>→</b>
            <div class="upper-pattern-outer-rule"><small>外側のくりかえし</small><strong>できた六角形 → 右へ60°</strong><span><i data-pattern-summary="count">n = ${state.pattern.count}回</i> かく</span></div>
            ${runControls("run-pattern", "かく")}
          </div>
          ${feedbackMarkup("n=1から「かく」を押そう", "nを増やすと、同じ六角形を向きを変えながら何度もかきます。")}
        </section>
      </main>
    `;
    updatePatternSummary();
  }

  function patternMapper(width, height) {
    const target = createPatternArtRoute(patternTarget);
    const movingPoints = target.filter((point, index) => index === 0 || point.draws);
    const xs = movingPoints.map((point) => point.x);
    const ys = movingPoints.map((point) => point.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const rangeX = Math.max(1, Math.max(...xs) - Math.min(...xs));
    const rangeY = Math.max(1, Math.max(...ys) - Math.min(...ys));
    const scale = Math.min((width - 130) / (rangeX * 1.35), (height - 100) / (rangeY * 1.35));
    return (point) => ({
      ...point,
      x: width / 2 + (point.x - centerX) * scale,
      y: height / 2 + (point.y - centerY) * scale,
      rotation: point.rotation,
      offset: point.offset
    });
  }

  function partialPatternPath(route, progress) {
    if (route.length < 2 || progress <= 0) return route.slice(0, 1);
    const result = [route[0]];
    for (let index = 1; index < route.length; index += 1) {
      const from = route[index - 1];
      const to = route[index];
      if (!to.draws) continue;
      if (progress >= to.offset) {
        result.push(to);
        continue;
      }
      if (progress <= from.offset) break;
      const ratio = (progress - from.offset) / (to.offset - from.offset);
      result.push({
        x: from.x + (to.x - from.x) * ratio,
        y: from.y + (to.y - from.y) * ratio
      });
      break;
    }
    return result;
  }

  function drawPattern(progress, manageSprite = true) {
    if (state.kind !== "pattern") return;
    const visibleProgress = Number.isFinite(progress) && progress >= 0 && progress <= 1
      ? progress
      : state.hasRun ? 1 : 0;
    const setup = canvasSetup(root);
    if (!setup) return;
    const { context, width, height } = setup;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "#d9ebf8";
    context.lineWidth = 1;
    for (let x = 20; x < width; x += 40) {
      context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke();
    }
    for (let y = 20; y < height; y += 40) {
      context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke();
    }
    const map = patternMapper(width, height);
    const targetRoute = createPatternArtRoute(patternTarget).map(map);
    const currentRoute = createPatternArtRoute(state.pattern).map(map);
    const target = targetRoute.filter((point, index) => index === 0 || point.draws);
    const visibleCurrent = partialPatternPath(currentRoute, visibleProgress);
    drawPath(context, visibleCurrent, "rgba(255,255,255,.95)", [], 13);
    drawPath(context, visibleCurrent, "#ee4057", [], 8);
    drawPath(context, target, "rgba(13, 42, 99, .55)", [12, 12], 11);
    drawPath(context, target, "#fff", [12, 12], 6);
    if (manageSprite) setSprite(state.hasRun ? currentRoute.at(-1) : currentRoute[0]);
  }

  async function animatePatternDrawing(route, duration, token) {
    const sprite = root.querySelector("[data-upper-sprite]");
    if (!sprite || route.length < 2) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());
    const animation = sprite.animate(route.map((point) => ({
      transform: spriteTransform(point),
      offset: point.offset
    })), { duration, easing: "linear", fill: "forwards" });
    const startedAt = performance.now();
    let completed = true;
    await new Promise((resolve) => {
      const drawFrame = (now) => {
        if (token !== state.runToken) {
          completed = false;
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        drawPattern(progress, false);
        if (progress < 1) window.requestAnimationFrame(drawFrame);
        else resolve();
      };
      window.requestAnimationFrame(drawFrame);
    });
    await animation.finished.catch(() => {});
    animation.cancel();
    if (completed) setSprite(route.at(-1));
  }

  function spriteTransform(point) {
    return `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) rotate(${point.rotation || 0}deg)`;
  }

  function setSprite(point) {
    const sprite = root.querySelector("[data-upper-sprite]");
    if (!sprite || !point) return;
    sprite.style.left = "0";
    sprite.style.top = "0";
    sprite.style.transform = spriteTransform(point);
  }

  async function animateSprite(points, duration) {
    const sprite = root.querySelector("[data-upper-sprite]");
    if (!sprite || points.length < 2) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());
    const safeDuration = Number.isFinite(duration) ? duration : 1200;
    const animation = sprite.animate(points.map((point) => ({
      transform: spriteTransform(point),
      offset: point.offset
    })), { duration: safeDuration, easing: "linear", fill: "forwards" });
    await animation.finished.catch(() => {});
    animation.cancel();
    setSprite(points.at(-1));
  }

  function setBusy(running) {
    state.running = running;
    const locked = running || state.looping;
    root.classList.toggle("is-running", locked);
    root.querySelectorAll("button, input").forEach((control) => {
      if (control.matches('[data-picture-action="hub"]')) return;
      if (control.matches('[data-upper-action="repeat-run"]')) {
        const missingProgram = state.kind === "rescue"
          ? state.rescue.program.length === 0
          : state.kind === "keyframe" && state.keyframe.history.length === 0;
        control.disabled = state.looping ? false : running || missingProgram;
        return;
      }
      control.disabled = locked || control.dataset.upperAlwaysDisabled === "true";
    });
    if (!locked && state.kind === "rescue") {
      const runButton = root.querySelector('[data-upper-action="run-rescue"]');
      if (runButton) runButton.disabled = state.rescue.program.length === 0;
    }
    updateRepeatButton();
  }

  function updateRepeatButton() {
    const button = root.querySelector('[data-upper-action="repeat-run"]');
    if (!button) return;
    button.classList.toggle("is-stopping", state.looping);
    button.innerHTML = state.looping
      ? "<strong>止める</strong><small>繰り返しを終了</small>"
      : state.kind === "keyframe"
        ? "<strong>試した記録を再生</strong><small>最大10回</small>"
        : "<strong>繰り返し実行する</strong><small>止めるまで</small>";
  }

  function showFeedback(title, detail, kind = "") {
    const feedback = root.querySelector("[data-upper-feedback]");
    if (!feedback) return;
    feedback.className = `upper-run-feedback ${kind}`.trim();
    feedback.innerHTML = `<strong>${escapeText(title)}</strong><span>${escapeText(detail)}</span>`;
  }

  async function runRescue() {
    if (state.running || state.rescue.program.length === 0) return false;
    const token = ++state.runToken;
    state.hasRun = false;
    drawRescue();
    const bounds = canvasBounds(root);
    if (!bounds) return;
    const expandedProgram = expandRescueProgram(state.rescue.program, state.rescue.repeatCount);
    const route = createRescueRoute(expandedProgram, state.rescue.values)
      .map((point) => rescuePoint(point, bounds.width, bounds.height));
    setBusy(true);
    showFeedback("実行しています", `${state.rescue.program.length}枚のまとまりを ${state.rescue.repeatCount}回くりかえしています。`);
    await animateSprite(route, Math.max(900, (route.length - 1) * 420));
    if (token !== state.runToken) return false;
    state.hasRun = true;
    setBusy(false);
    const correct = isRescueCorrect(state.rescue.program, state.rescue.values, state.rescue.repeatCount);
    if (correct) {
      showFeedback("正解！くりかえしで1〜6を取れました", "5枚の移動ルールを3回使って、15回の移動を短い仕組みにできました。", "is-success");
      onSuccess({ repeating: state.looping });
    } else {
      showFeedback("1〜6を順番に取れたかな？", "白い点線と赤い線、座標の差を見て、5枚の順番・数・回数を直そう。", "is-question");
    }
    renderRescueProgram();
    state.hasRun = true;
    setSprite(route.at(-1));
    return true;
  }

  async function runKeyframe() {
    if (state.running) return false;
    const token = ++state.runToken;
    const shotForce = { ...state.keyframe.force };
    state.hasRun = false;
    drawKeyframe();
    const bounds = canvasBounds(root);
    if (!bounds) return;
    const path = createKickPath(shotForce, 40)
      .map((point) => keyframePoint(point, bounds.width, bounds.height));
    setBusy(true);
    showFeedback("シュートしています", `よこの力 x=${shotForce.x}、うえの力 y=${shotForce.y} で飛んでいます。`);
    try {
      await animateSprite(path, Math.max(800, path.at(-1).time / 2 * 1700));
    } finally {
      if (token === state.runToken) setBusy(false);
    }
    if (token !== state.runToken) return false;
    state.hasRun = true;
    const result = applyKickProgram(shotForce, state.keyframe.program);
    state.keyframe.history.push({ force: shotForce, outcome: result.outcome });
    const wasLooping = state.looping;
    if (result.outcome === "goal") {
      state.looping = false;
      state.keyframe.pendingOutcome = null;
      state.keyframe.program = state.keyframe.program.filter((rule) => rule.outcome !== "goal");
      state.keyframe.program.push({ outcome: "goal", actionId: "stop" });
      showFeedback("ゴール！", "ゴールしたら止めるルールも自動で完成しました。", "is-success");
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
      onSuccess({ repeating: wasLooping, title: "ゴール！" });
      return false;
    }
    state.keyframe.pendingOutcome = result.outcome;

    if (!state.looping) {
      showFeedback(kickOutcomeLabels[result.outcome], "xとyのどちらを、増やすか減らすか、自分で選ぼう。", "is-question");
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
      return true;
    }

    if (!result.action) {
      state.looping = false;
      setBusy(false);
      showFeedback(`${kickOutcomeLabels[result.outcome]}のルールがないよ`, "ここで自動実行を止めました。結果に合う直し方を考えよう。", "is-question");
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
      return false;
    }
    state.keyframe.force = result.nextForce;
    state.keyframe.pendingOutcome = null;
    showFeedback(`${kickOutcomeLabels[result.outcome]} → ${result.action.label}`, `次は x=${result.nextForce.x}、y=${result.nextForce.y} で試します。`);
    renderKeyframeProgram();
    window.requestAnimationFrame(drawKeyframe);
    return true;
  }

  function chooseKickCorrection(actionId) {
    const outcome = state.keyframe.pendingOutcome;
    const action = kickCorrectionActions.find((candidate) => candidate.id === actionId);
    if (!outcome || !action || (outcome === "goal") !== Boolean(action.stop)) return;
    const rule = { outcome, actionId: action.id };
    state.keyframe.program = state.keyframe.program.filter((candidate) => candidate.outcome !== outcome);
    state.keyframe.program.push(rule);
    state.keyframe.pendingOutcome = null;

    if (action.stop) {
      showFeedback("完成！ゴールしたら止めるルールができました", "自分で考えた修正を、最初から自動実行して確かめられます。", "is-success");
      renderKeyframeProgram();
      onSuccess({ repeating: false });
      return;
    }

    const result = applyKickProgram(state.keyframe.force, [rule]);
    state.keyframe.force = result.nextForce;
    state.hasRun = false;
    showFeedback(`「${kickOutcomeLabels[outcome]} → ${action.label}」を保存`, `次は x=${result.nextForce.x}、y=${result.nextForce.y} でシュートしよう。`);
    renderKeyframeProgram();
    window.requestAnimationFrame(drawKeyframe);
  }

  async function runPattern() {
    if (state.running) return false;
    const token = ++state.runToken;
    state.hasRun = false;
    drawPattern();
    const bounds = canvasBounds(root);
    if (!bounds) return;
    const map = patternMapper(bounds.width, bounds.height);
    const route = createPatternArtRoute(state.pattern).map(map);
    setBusy(true);
    showFeedback("六角形をくりかえしてかいています", `六角形を1個作り、向きを変えながら${state.pattern.count}回かいています。`);
    await animatePatternDrawing(route, Math.max(1200, state.pattern.count * patternSideCount * 105), token);
    if (token !== state.runToken) return false;
    state.hasRun = true;
    setBusy(false);
    drawPattern();
    if (isPatternCorrect(state.pattern)) {
      showFeedback("正解！六角形の花ができました", `「前へ${state.pattern.distance} → 右へ60°」で六角形を作り、その六角形をn=6回かきました。`, "is-success");
      onSuccess({ repeating: state.looping });
    } else if (state.pattern.angle === patternTarget.angle) {
      showFeedback(`六角形を${state.pattern.count}個かけました`, `nを6にすると、向きを変えながら六角形を6個かいて花になります。`, "is-question");
    } else {
      showFeedback("1つの六角形が閉じているかな？", `いまは ${state.pattern.angle}° × 6辺 = ${state.pattern.angle * patternSideCount}°。一周の360°と比べよう。`, "is-question");
    }
    return true;
  }

  function drawCurrentLesson() {
    if (state.kind === "rescue") drawRescue();
    else if (state.kind === "keyframe") drawKeyframe();
    else drawPattern();
  }

  async function replayKeyframeHistory() {
    if (state.looping) return stopRepeating();
    if (state.running || state.keyframe.history.length === 0) return;
    const records = state.keyframe.history.slice(-10);
    const originalForce = { ...state.keyframe.force };
    state.looping = true;
    setBusy(false);
    let played = 0;
    try {
      for (const [index, attempt] of records.entries()) {
        if (!state.looping) break;
        const token = ++state.runToken;
        const bounds = canvasBounds(root);
        if (!bounds) break;
        state.keyframe.force = { ...attempt.force };
        state.hasRun = false;
        drawKeyframe();
        const path = createKickPath(attempt.force, 40)
          .map((point) => keyframePoint(point, bounds.width, bounds.height));
        setBusy(true);
        showFeedback(`記録 ${index + 1} / ${records.length}`, `x=${attempt.force.x}、y=${attempt.force.y}：${kickOutcomeLabels[attempt.outcome]}`);
        await animateSprite(path, Math.max(800, path.at(-1).time / 2 * 1700));
        if (token !== state.runToken) break;
        played += 1;
        state.hasRun = true;
        setBusy(false);
        setSprite(path.at(-1));
        await wait(320);
      }
    } finally {
      const stopped = !state.looping;
      state.looping = false;
      state.running = false;
      state.keyframe.force = originalForce;
      state.hasRun = false;
      setBusy(false);
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
      if (!stopped && played === records.length) {
        showFeedback("試した記録を再生しました", `${played}回分のシュートを順番に確かめました。`);
      }
    }
  }

  async function runRepeatedly() {
    if (state.kind === "keyframe") return replayKeyframeHistory();
    if (state.looping) return stopRepeating();
    const missingProgram = state.kind === "rescue" && state.rescue.program.length === 0;
    if (state.running || missingProgram) return;
    state.looping = true;
    setBusy(false);
    let completedRuns = 0;
    while (state.looping) {
      const completed = state.kind === "rescue"
        ? await runRescue()
        : await runPattern();
      completedRuns += 1;
      if (!completed || !state.looping) break;
      await wait(320);
      if (!state.looping) break;
      state.hasRun = false;
      window.requestAnimationFrame(drawCurrentLesson);
    }
    if (state.looping) {
      state.looping = false;
      setBusy(false);
    }
  }

  function stopRepeating() {
    if (!state.looping) return;
    state.looping = false;
    state.runToken += 1;
    state.running = false;
    root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    setBusy(false);
    state.hasRun = false;
    window.requestAnimationFrame(drawCurrentLesson);
    showFeedback("繰り返しを止めました", "数やルールを直して、また何度でも試せます。");
  }

  function handleAdjust(button) {
    const scope = button.dataset.upperAdjust;
    const key = button.dataset.key;
    const delta = Number(button.dataset.delta);
    if (scope === "rescue") {
      state.rescue.values[key] = clampLessonValue(state.rescue.values[key] + delta, 20, 200, rescueTargetValues[key]);
      const input = root.querySelector(`[data-upper-input="rescue"][data-key="${key}"]`);
      if (input) input.value = state.rescue.values[key];
      renderRescueProgram();
    } else if (scope === "keyframe") {
      const bounds = key === "x" ? [20, 200] : [40, 240];
      state.keyframe.force[key] = clampLessonValue(state.keyframe.force[key] + delta, bounds[0], bounds[1], kickInitialForce[key]);
      renderKeyframe();
    } else {
      const bounds = { distance: [20, 120], angle: [30, 120], count: [1, 6] };
      state.pattern[key] = clampLessonValue(state.pattern[key] + delta, bounds[key][0], bounds[key][1], patternTarget[key]);
      const input = root.querySelector(`[data-upper-input="pattern"][data-key="${key}"]`);
      if (input) input.value = state.pattern[key];
      updatePatternSummary();
    }
  }

  function updatePatternSummary() {
    ["distance", "angle", "count"].forEach((key) => {
      const summary = root.querySelector(`[data-pattern-summary="${key}"]`);
      if (!summary) return;
      summary.textContent = key === "distance" ? `x = ${state.pattern[key]}` : key === "angle" ? `θ = ${state.pattern[key]}°` : `n = ${state.pattern[key]}回`;
    });
    const angle = root.querySelector("[data-pattern-equation-angle]");
    const count = root.querySelector("[data-pattern-equation-count]");
    const total = root.querySelector("[data-pattern-equation-total]");
    const status = root.querySelector("[data-pattern-equation-status]");
    const turnTotal = state.pattern.angle * patternSideCount;
    if (angle) angle.textContent = `${state.pattern.angle}°`;
    if (count) count.textContent = `${patternSideCount}辺`;
    if (total) total.textContent = `${turnTotal}°`;
    if (status) {
      if (turnTotal === 360 && state.pattern.count === patternTarget.count) status.textContent = "六角形を6個かく設定です。花が完成します！";
      else if (turnTotal === 360) status.textContent = `六角形を${state.pattern.count}個かきます。花まで あと ${patternTarget.count - state.pattern.count}個です。`;
      else if (turnTotal < 360) status.textContent = `一周まで あと ${360 - turnTotal}° です。`;
      else status.textContent = `一周を ${turnTotal - 360}° こえています。`;
    }
    state.hasRun = false;
    window.requestAnimationFrame(() => drawPattern());
  }

  function handleInput(input) {
    const scope = input.dataset.upperInput;
    const key = input.dataset.key;
    if (scope === "rescue") {
      state.rescue.values[key] = clampLessonValue(input.value, 20, 200, rescueTargetValues[key]);
      input.value = state.rescue.values[key];
      renderRescueProgram();
    } else if (scope === "keyframe") {
      const bounds = key === "x" ? [20, 200] : [40, 240];
      state.keyframe.force[key] = clampLessonValue(input.value, bounds[0], bounds[1], kickInitialForce[key]);
      input.value = state.keyframe.force[key];
      state.hasRun = false;
      window.requestAnimationFrame(drawKeyframe);
    } else {
      const bounds = { distance: [20, 120], angle: [30, 120], count: [1, 6] };
      state.pattern[key] = clampLessonValue(input.value, bounds[key][0], bounds[key][1], patternTarget[key]);
      if (key === "count") state.pattern[key] = Math.round(state.pattern[key]);
      input.value = state.pattern[key];
      updatePatternSummary();
    }
  }

  function handleClick(event) {
    const adjust = event.target.closest("[data-upper-adjust]");
    if (adjust) return handleAdjust(adjust);
    const button = event.target.closest("[data-upper-action]");
    if (!button) return;
    const action = button.dataset.upperAction;
    if (action === "repeat-run") return runRepeatedly();
    if (state.running || state.looping) return;
    if (action === "add-rescue" && state.rescue.program.length < rescueTargetRule.length) {
      const direction = button.dataset.key;
      state.rescue.program.push({ direction, value: state.rescue.values[direction] });
      return renderRescueProgram();
    }
    if (action === "remove-rescue") {
      state.rescue.program.splice(Number(button.dataset.index), 1);
      return renderRescueProgram();
    }
    if (action === "rescue-repeat") {
      state.rescue.repeatCount = clampLessonValue(button.dataset.count, 1, 3, 1);
      return renderRescueProgram();
    }
    if (action === "clear-rescue") {
      state.rescue.program = [];
      state.rescue.repeatCount = 1;
      return renderRescueProgram();
    }
    if (action === "run-rescue") return runRescue();
    if (action === "apply-kick-correction") return chooseKickCorrection(button.dataset.actionId);
    if (action === "remove-kick-rule") {
      state.keyframe.program.splice(Number(button.dataset.index), 1);
      return renderKeyframeProgram();
    }
    if (action === "reset-keyframe") {
      state.keyframe = { force: { ...kickInitialForce }, program: [], history: [], pendingOutcome: null };
      return renderKeyframe();
    }
    if (action === "run-keyframe") return runKeyframe();
    if (action === "sample-pattern") {
      showFeedback("ヒント：六角形は6辺", "θは360÷6で考えよう。六角形ができたら、nを増やして同じ形を何回かくか決めよう。", "is-question");
      return;
    }
    if (action === "reset-pattern") {
      state.pattern = { distance: 60, angle: 60, count: 1 };
      return renderPattern();
    }
    if (action === "run-pattern") return runPattern();
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("input", (event) => {
    const input = event.target.closest("[data-upper-input]");
    if (input) handleInput(input);
  });
  window.addEventListener("resize", () => {
    if (state.kind === "rescue") window.requestAnimationFrame(drawRescue);
    if (state.kind === "keyframe") window.requestAnimationFrame(drawKeyframe);
    if (state.kind === "pattern") window.requestAnimationFrame(() => drawPattern());
  });
  document.addEventListener("easy-scratch-languagechange", () => {
    if (state.kind === "rescue") window.requestAnimationFrame(drawRescue);
    if (state.kind === "keyframe") window.requestAnimationFrame(drawKeyframe);
    if (state.kind === "pattern") window.requestAnimationFrame(() => drawPattern());
  });

  return { render };
}
