import {
  clampLessonValue,
  createKickPath,
  createPatternRoute,
  createRescueCoordinateGrid,
  createRescueRoute,
  isPatternCorrect,
  isRescueCorrect,
  kickInitialForce,
  kickTargetForce,
  mapRescuePoint,
  patternTarget,
  rescueInitialValues,
  rescueTargetProgram,
  rescueTargetValues
} from "./upper-picture-lesson-logic.js?v=20260717o";
import {
  applyKickProgram,
  kickCorrectionActions,
  kickOutcomeLabels,
} from "./upper-free-kick-program.js?v=20260717o";

const directionLabels = {
  right: "右へ",
  up: "上へ",
  left: "左へ",
  down: "下へ"
};

const lessonGoals = {
  rescue: "1・2・3の番号を順番に通って、ゴールへ行こう",
  keyframe: "x・yの力を変えて、壁をこえるフリーキックを再現しよう",
  pattern: "1つのルールを6回使って、正六角形をかこう"
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
      <button class="picture-back-button" type="button" data-picture-action="hub">レッスンを選ぶ</button>
      <div class="upper-picture-title"><small>4〜6年生</small><h1>${escapeText(lesson.title)}</h1></div>
      <div class="upper-picture-goal"><span>きょうのゴール</span><strong>${escapeText(goal)}</strong></div>
      <img src="./assets/robot-mascot.png" alt="案内ロボット">
    </header>
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
      program: []
    },
    keyframe: { force: { ...kickInitialForce }, program: [], history: [], pendingOutcome: null },
    pattern: { distance: 60, angle: 50, count: 5 }
  };

  function reset(lesson) {
    state.lesson = lesson;
    state.kind = lesson.id;
    state.running = false;
    state.looping = false;
    state.runToken += 1;
    state.hasRun = false;
    state.rescue = { values: { ...rescueInitialValues }, program: [] };
    state.keyframe = { force: { ...kickInitialForce }, program: [], history: [], pendingOutcome: null };
    state.pattern = { distance: 60, angle: 50, count: 5 };
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
      <main class="upper-picture-main">
        <section class="upper-parameter-panel" aria-labelledby="upperRescueRuleTitle">
          <div class="upper-step-heading"><span>1</span><div><h2 id="upperRescueRuleTitle">数を入れてルールを作る</h2><p>数を決めて追加すると、1枚のカードになります</p></div></div>
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
          <p class="upper-parameter-hint">さいしょの数は正解ではありません。マス目を数えて直そう。</p>
        </section>
        <section class="upper-stage-panel" aria-labelledby="upperRescueStageTitle">
          <div class="upper-step-heading"><span>2</span><div><h2 id="upperRescueStageTitle">座標で動きをたしかめる</h2><p>1マス20。白い点線と赤い線を見くらべよう</p></div></div>
          <div class="upper-stage upper-stage-park">
            <img class="upper-stage-background" src="./assets/picture-lessons/upper-park-stage.png" alt="公園のコース">
            <canvas data-upper-canvas aria-label="座標レスキューの目標線と今の動き"></canvas>
            ${stageLegend()}
            <div class="upper-coordinate-scale" aria-label="座標は1マス20">1マス = 20</div>
            <div class="upper-stage-sprite" data-upper-sprite><img src="./assets/robot-mascot.png" alt="動くロボット"></div>
          </div>
        </section>
        <section class="upper-program-panel">
          <div class="upper-program-title"><div><h2>できたルール</h2><p>カードは左から順番に実行します</p></div><div><button type="button" data-upper-action="sample-rescue">じゅんばんのヒント</button><button type="button" data-upper-action="clear-rescue">ぜんぶ消す</button></div></div>
          <div class="upper-program-row">
            <div class="upper-program-list" data-upper-program-list></div>
            ${runControls("run-rescue", "実行する", true)}
          </div>
          ${feedbackMarkup("数と順番を何度でもためせます", "正解でなくても実行して、座標と線を見ながら直せます。")}
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
            <span>${index + 1}</span><strong>${directionLabels[command.direction]} ${command.value}</strong>
          </button>
        `).join("")
      : `<p>左の「追加」を押して、ルールを作ろう</p>`;
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
    const currentRoute = createRescueRoute(state.rescue.program, state.rescue.values);
    const target = targetRoute.map((point) => rescuePoint(point, width, height));
    const current = currentRoute.map((point) => rescuePoint(point, width, height));
    if (current.length > 1) {
      drawPath(context, current, "rgba(255,255,255,.95)", [], 13);
      drawPath(context, current, "#ee4057", [], 8);
    }
    drawPath(context, target, "rgba(13, 42, 99, .55)", [12, 12], 11);
    drawPath(context, target, "#fff", [12, 12], 6);
    [2, 4, 6].forEach((routeIndex, beaconIndex) => {
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
    const finish = target.at(-1);
    context.fillStyle = "#ffcf33";
    context.font = "900 16px sans-serif";
    context.fillText("ゴール", finish.x - 3, finish.y - 32);
    const spritePoint = state.hasRun ? current.at(-1) : current[0];
    setSprite(spritePoint);
  }

  function renderKeyframe() {
    root.className = "picture-experience upper-picture-screen upper-keyframe-screen";
    root.innerHTML = `
      ${upperHeader(state.lesson, lessonGoals.keyframe)}
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
            <div class="upper-soccer-goal" aria-label="サッカーゴール"><strong>GOAL</strong></div>
            ${[0, 1, 2].map((index) => `<div class="upper-frame-ghost upper-ball-ghost" data-upper-ghost="${index}" aria-hidden="true">⚽</div>`).join("")}
            <div class="upper-stage-sprite upper-soccer-ball" data-upper-sprite role="img" aria-label="動くサッカーボール">⚽</div>
          </div>
        </section>
        <section class="upper-program-panel upper-timeline-panel">
          <div class="upper-program-title"><div><h2>できた自動修正ルール</h2><p>自分で試した直し方だけが、ここに保存されます</p></div><div><button type="button" data-upper-action="reset-keyframe">最初からやりなおす</button></div></div>
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
          return `<button type="button" data-upper-action="remove-kick-rule" data-index="${index}" aria-label="${kickOutcomeLabels[rule.outcome]}のルールを外す"><span>${index + 1}</span><strong>もし ${kickOutcomeLabels[rule.outcome]}</strong><b>→</b><em>${action?.label ?? "何もしない"}</em></button>`;
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
    if (repeat && !state.looping) repeat.disabled = state.running || state.keyframe.program.length === 0;
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
      <main class="upper-picture-main">
        <section class="upper-parameter-panel" aria-labelledby="upperPatternRuleTitle">
          <div class="upper-step-heading"><span>1</span><div><h2 id="upperPatternRuleTitle">変数に数を入れる</h2><p>数がルールの中身になります</p></div></div>
          <div class="upper-pattern-fields">
            ${[
              ["distance", "前へ x", "x は線の長さ", 20, 120, 10],
              ["angle", "右へ θ", "θ は曲がる角度", 30, 120, 10],
              ["count", "くりかえす n", "n はルールを使う回数", 3, 10, 1]
            ].map(([key, label, hint, min, max, step]) => `
              <label><strong>${label}</strong><div class="upper-number-control">
                <button type="button" data-upper-adjust="pattern" data-key="${key}" data-delta="-${step}" aria-label="${label}を${step}減らす">−</button>
                <input type="number" min="${min}" max="${max}" step="${step}" value="${state.pattern[key]}" data-upper-input="pattern" data-key="${key}" aria-label="${label}の数">
                <button type="button" data-upper-adjust="pattern" data-key="${key}" data-delta="${step}" aria-label="${label}を${step}増やす">＋</button>
              </div><small>${hint}</small></label>
            `).join("")}
          </div>
          <p class="upper-parameter-hint">ここは1つの共有ルールです。数を変えると、くりかえし全体が変わります。</p>
        </section>
        <section class="upper-stage-panel" aria-labelledby="upperPatternStageTitle">
          <div class="upper-step-heading"><span>2</span><div><h2 id="upperPatternStageTitle">形をたしかめる</h2><p>白い目標と赤い今の形を見くらべよう</p></div></div>
          <div class="upper-stage upper-pattern-stage">
            <canvas data-upper-canvas aria-label="正六角形の目標線と今の形"></canvas>
            ${stageLegend()}
            <div class="upper-stage-sprite upper-pen-sprite" data-upper-sprite><img src="./assets/robot-mascot.png" alt="線をかくロボット"></div>
          </div>
        </section>
        <section class="upper-program-panel">
          <div class="upper-program-title"><div><h2>何度も使えるルール</h2><p>「前へ x → 右へ θ」を n 回使います</p></div><div><button type="button" data-upper-action="sample-pattern">みほん</button><button type="button" data-upper-action="reset-pattern">やりなおす</button></div></div>
          <div class="upper-pattern-rule">
            <div><strong>前へ x</strong><span data-pattern-summary="distance">x = ${state.pattern.distance}</span></div>
            <b>→</b>
            <div><strong>右へ θ</strong><span data-pattern-summary="angle">θ = ${state.pattern.angle}°</span></div>
            <b>×</b>
            <div><strong>n 回使う</strong><span data-pattern-summary="count">n = ${state.pattern.count}回</span></div>
            ${runControls("run-pattern", "かく")}
          </div>
          ${feedbackMarkup("どんな形でも実行できます", "x・θ・nを変えて、赤い線がどう変わるか試せます。")}
        </section>
      </main>
    `;
    window.requestAnimationFrame(drawPattern);
  }

  function patternMapper(width, height) {
    const target = createPatternRoute(patternTarget);
    const movingPoints = target.filter((point) => point.draws || point.iteration === 0);
    const xs = movingPoints.map((point) => point.x);
    const ys = movingPoints.map((point) => point.y);
    const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
    const scale = Math.min((width - 120) / 260, (height - 90) / 220);
    return (point) => ({
      x: width / 2 + (point.x - centerX) * scale,
      y: height / 2 + (point.y - centerY) * scale,
      rotation: point.rotation,
      offset: point.offset
    });
  }

  function drawPattern() {
    if (state.kind !== "pattern") return;
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
    const target = createPatternRoute(patternTarget).map(map);
    const current = createPatternRoute(state.pattern).map(map);
    drawPath(context, current, "rgba(255,255,255,.95)", [], 13);
    drawPath(context, current, "#ee4057", [], 8);
    drawPath(context, target, "rgba(13, 42, 99, .55)", [12, 12], 11);
    drawPath(context, target, "#fff", [12, 12], 6);
    setSprite(state.hasRun ? current.at(-1) : current[0]);
  }

  function setSprite(point) {
    const sprite = root.querySelector("[data-upper-sprite]");
    if (!sprite || !point) return;
    sprite.style.left = `${point.x}px`;
    sprite.style.top = `${point.y}px`;
    sprite.style.transform = `translate(-50%, -50%) rotate(${point.rotation || 0}deg)`;
  }

  async function animateSprite(points, duration) {
    const sprite = root.querySelector("[data-upper-sprite]");
    if (!sprite || points.length < 2) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());
    const safeDuration = Number.isFinite(duration) ? duration : 1200;
    const animation = sprite.animate(points.map((point) => ({
      left: `${point.x}px`,
      top: `${point.y}px`,
      transform: `translate(-50%, -50%) rotate(${point.rotation || 0}deg)`,
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
          : state.kind === "keyframe" && state.keyframe.program.length === 0;
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
        ? "<strong>自動でくりかえす</strong><small>最大10回</small>"
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
    const route = createRescueRoute(state.rescue.program, state.rescue.values)
      .map((point) => rescuePoint(point, bounds.width, bounds.height));
    setBusy(true);
    showFeedback("実行しています", "カードを左から順番に使っています。");
    await animateSprite(route, Math.max(900, (route.length - 1) * 420));
    if (token !== state.runToken) return false;
    state.hasRun = true;
    setBusy(false);
    const correct = isRescueCorrect(state.rescue.program, state.rescue.values);
    if (correct) {
      showFeedback("正解！1・2・3の番号を順番に通れました", "数と順番が目標の道と一致しています。", "is-success");
      onSuccess({ repeating: state.looping });
    } else {
      showFeedback("目標の道と同じかな？", "白い点線と赤い線を見て、数と順番を直してみよう。", "is-question");
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
    state.keyframe.pendingOutcome = result.outcome;

    if (!state.looping) {
      const nextPrompt = result.outcome === "goal"
        ? "ゴールしたとき、プログラムをどう終わらせるか考えよう。"
        : "xとyのどちらを、増やすか減らすか、自分で選ぼう。";
      showFeedback(kickOutcomeLabels[result.outcome], nextPrompt, result.outcome === "goal" ? "is-success" : "is-question");
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
    if (result.stopped) {
      state.looping = false;
      state.keyframe.pendingOutcome = null;
      setBusy(false);
      showFeedback("正解！ゴールして自動で止まりました", `${state.keyframe.history.length}回のシュートで、作ったルールがゴールまで直しました。`, "is-success");
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
      onSuccess({ repeating: true });
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
    const route = createPatternRoute(state.pattern).map(map);
    setBusy(true);
    showFeedback("ルールをくりかえしています", `「前へ x → 右へ θ」を ${state.pattern.count}回使っています。`);
    await animateSprite(route, Math.max(1000, state.pattern.count * 360));
    if (token !== state.runToken) return false;
    state.hasRun = true;
    setBusy(false);
    if (isPatternCorrect(state.pattern)) {
      showFeedback("正解！正六角形ができました", "同じ2つの命令を6回使って、6本の辺をかきました。", "is-success");
      onSuccess({ repeating: state.looping });
    } else {
      showFeedback("目標の形と同じかな？", "xは長さ、θは角度、nは回数です。赤い線を見て直そう。", "is-question");
    }
    return true;
  }

  function drawCurrentLesson() {
    if (state.kind === "rescue") drawRescue();
    else if (state.kind === "keyframe") drawKeyframe();
    else drawPattern();
  }

  async function runRepeatedly() {
    if (state.looping) return stopRepeating();
    const missingProgram = state.kind === "rescue"
      ? state.rescue.program.length === 0
      : state.kind === "keyframe" && state.keyframe.program.length === 0;
    if (state.running || missingProgram) return;
    if (state.kind === "keyframe") {
      state.keyframe.force = { ...kickInitialForce };
      state.keyframe.history = [];
      state.keyframe.pendingOutcome = null;
      renderKeyframeProgram();
      window.requestAnimationFrame(drawKeyframe);
    }
    state.looping = true;
    setBusy(false);
    let completedRuns = 0;
    while (state.looping) {
      const completed = state.kind === "rescue"
        ? await runRescue()
        : state.kind === "keyframe"
          ? await runKeyframe()
          : await runPattern();
      completedRuns += 1;
      if (!completed || !state.looping) break;
      if (state.kind === "keyframe" && completedRuns >= 10) {
        state.looping = false;
        setBusy(false);
        showFeedback("10回試したので止めました", "記録を見て、うまく直せていない条件のルールを考えなおそう。", "is-question");
        renderKeyframeProgram();
        break;
      }
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
      const bounds = { distance: [20, 120], angle: [30, 120], count: [3, 10] };
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
    state.hasRun = false;
    window.requestAnimationFrame(drawPattern);
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
      const bounds = { distance: [20, 120], angle: [30, 120], count: [3, 10] };
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
    if (action === "add-rescue" && state.rescue.program.length < 8) {
      const direction = button.dataset.key;
      state.rescue.program.push({ direction, value: state.rescue.values[direction] });
      return renderRescueProgram();
    }
    if (action === "remove-rescue") {
      state.rescue.program.splice(Number(button.dataset.index), 1);
      return renderRescueProgram();
    }
    if (action === "sample-rescue") {
      state.rescue.program = rescueTargetProgram.map((direction) => ({ direction, value: state.rescue.values[direction] }));
      showFeedback("順番のヒントを入れました", "数はまだ正解ではありません。座標のマス目を見て直そう。", "is-question");
      return renderRescueProgram();
    }
    if (action === "clear-rescue") {
      state.rescue.program = [];
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
      state.pattern = { ...patternTarget };
      return renderPattern();
    }
    if (action === "reset-pattern") {
      state.pattern = { distance: 60, angle: 50, count: 5 };
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
    if (state.kind === "pattern") window.requestAnimationFrame(drawPattern);
  });

  return { render };
}
