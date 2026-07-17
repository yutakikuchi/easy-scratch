import { findPictureLesson, pictureLessons } from "./picture-lessons-data.js";

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function getPictureProgramStatus(program, sample) {
  return {
    canRun: program.length > 0,
    isCorrect: program.length === sample.length && program.every((item, index) => item === sample[index])
  };
}

export function getMovementRoute(stageType, program, width, height) {
  let x = 0;
  let y = 0;
  let rotation = 0;
  const route = [{ x, y, rotation }];
  const addPoint = (deltaX, nextY, nextRotation = rotation, details = {}) => {
    x += deltaX;
    y = nextY;
    rotation = nextRotation;
    route.push({ x, y, rotation, ...details });
  };

  program.forEach((actionId) => {
    if (stageType === "jump") {
      if (actionId === "right") addPoint(width * 0.2, 0);
      else if (actionId === "jump") {
        addPoint(width * 0.16, height * -0.48, -5);
        addPoint(width * 0.16, 0, 0);
      } else if (actionId === "stomp") {
        addPoint(width * 0.04, height * -0.38, 4);
        addPoint(width * 0.02, height * -0.19, 0, { hit: 0 });
        addPoint(width * 0.06, height * -0.38, 4);
        addPoint(width * 0.03, height * -0.19, 0, { hit: 1 });
      } else if (actionId === "repeat") addPoint(width * 0.11, 0, 0);
    } else if (stageType === "fish") {
      if (actionId === "swim-right") addPoint(width * 0.22, height * 0.08, 6);
      else if (actionId === "swim-up") addPoint(width * 0.2, height * -0.24, -10);
      else if (actionId === "bubble") addPoint(width * 0.16, height * 0.12, 7);
      else if (actionId === "repeat") addPoint(width * 0.18, 0, 0);
    } else if (stageType === "motion") {
      if (actionId === "right-100") addPoint(width * 0.22, 0, 0);
      else if (actionId === "up-50") addPoint(width * 0.18, height * -0.18, 0);
      else if (actionId === "turn-30") addPoint(width * 0.18, height * -0.28, 30);
      else if (actionId === "repeat") addPoint(width * 0.18, height * -0.34, 30);
    }
  });

  return route.map((point, index) => ({
    ...point,
    offset: route.length === 1 ? 0 : index / (route.length - 1)
  }));
}

export function getJumpRoute(width, height) {
  return getMovementRoute("jump", ["right", "jump", "stomp", "repeat"], width, height);
}

function gradeCopy(grade) {
  return grade === "lower"
    ? {
        badge: "1〜3ねんせい",
        title: "えを どう うごかす？",
        lead: "すきな うごかしかたを えらんでね",
        rule: "ルールを つくる",
        reuse: "なんども つかう",
        run: "うごかす",
        back: "TOPへ もどる",
        hubBack: "えらびなおす"
      }
    : {
        badge: "4〜6年生",
        title: "絵をどう動かす？",
        lead: "3つの方法から、作りたい動きを選ぼう",
        rule: "動きのルールを作る",
        reuse: "同じルールを何度も使う",
        run: "実行する",
        back: "TOPへ戻る",
        hubBack: "レッスンを選ぶ"
      };
}

export function initPictureLessons({ root, onBackHome }) {
  const state = {
    grade: "lower",
    lesson: null,
    program: [],
    runs: 0,
    running: false,
    drag: null,
    suppressActionClickUntil: 0
  };

  function setLessonInUrl(lessonId) {
    const url = new URL(window.location.href);
    if (lessonId) url.searchParams.set("lesson", lessonId);
    else url.searchParams.delete("lesson");
    window.history.pushState({}, "", url);
  }

  function resetLessonState() {
    state.program = [];
    state.runs = 0;
    state.running = false;
  }

  function openLesson(lessonId) {
    const lesson = findPictureLesson(state.grade, lessonId);
    if (!lesson) return;
    setLessonInUrl(lessonId);
    state.lesson = lesson;
    resetLessonState();
    renderLesson();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openHub({ updateUrl = true } = {}) {
    if (updateUrl) setLessonInUrl(null);
    state.lesson = null;
    resetLessonState();
    renderHub();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderHub() {
    const copy = gradeCopy(state.grade);
    const lessons = pictureLessons[state.grade];
    root.className = `picture-experience picture-hub picture-${state.grade}`;
    root.innerHTML = `
      <header class="picture-hub-header">
        <button class="picture-back-button" type="button" data-picture-action="home">${copy.back}</button>
        <div>
          <span>${copy.badge}</span>
          <h1>${copy.title}</h1>
          <p>${copy.lead}</p>
        </div>
      </header>
      <section class="picture-lesson-grid" aria-label="絵を動かすレッスン">
        ${lessons
          .map(
            (lesson, index) => `
              <button class="picture-lesson-card" type="button" data-open-picture-lesson="${lesson.id}">
                <span class="picture-lesson-number">${index + 1}</span>
                <img src="${lesson.thumbnail}" alt="" aria-hidden="true">
                <span class="picture-lesson-copy">
                  <strong>${escapeText(lesson.title)}</strong>
                  <b>${escapeText(lesson.shortTitle)}</b>
                  <small>${escapeText(lesson.description)}</small>
                </span>
              </button>
            `
          )
          .join("")}
      </section>
      <aside class="picture-hub-takeaway">
        <strong>${copy.rule}</strong><small>つぎに</small><strong>${copy.reuse}</strong>
        <p>${state.grade === "lower" ? "しくみが できたら、1かい おすだけ！" : "仕組みにすれば、いろいろな動きを簡単に作れます。"}</p>
      </aside>
    `;
  }

  function stageMarkup(lesson) {
    if (lesson.stageType === "story") {
      return `
        <div class="picture-story-frames" aria-label="3コマのアニメーション">
          ${[0, 1, 2]
            .map(
              (index) => `
                <div class="picture-story-frame" data-story-frame="${index}">
                  <span>${index + 1}</span>
                  <img class="picture-story-bg" src="${lesson.stageBackground}" alt="">
                  <img class="picture-story-robot picture-story-robot-${index + 1}" src="${lesson.sprite}" alt="動くロボット">
                </div>
              `
            )
            .join("")}
        </div>
      `;
    }

    const background = lesson.stageBackground
      ? `<img class="picture-stage-background" src="${lesson.stageBackground}" alt="">`
      : "";
    const jumpHitMessages =
      lesson.stageType === "jump"
        ? `<span class="picture-jump-hit picture-jump-hit-1" data-jump-hit="0">イタイ！</span>
           <span class="picture-jump-hit picture-jump-hit-2" data-jump-hit="1">イタイ！</span>`
        : "";
    const pathLegend = ["jump", "fish", "motion"].includes(lesson.stageType)
      ? `<div class="picture-path-legend" aria-label="線の見方">
           <span class="picture-path-goal"><i aria-hidden="true"></i>もくひょう</span>
           <span class="picture-path-current"><i aria-hidden="true"></i>いまの ルール</span>
         </div>`
      : "";
    const canvasLabel = lesson.stageType === "coordinate" ? "座標と動きの線" : "動きの道";
    return `
      <div class="picture-stage-scene picture-stage-${lesson.stageType}">
        ${background}
        <canvas class="picture-stage-canvas" data-picture-canvas aria-label="${canvasLabel}"></canvas>
        ${pathLegend}
        <img class="picture-stage-sprite" data-picture-sprite src="${lesson.sprite}" alt="動かす絵">
        ${jumpHitMessages}
        <output class="picture-stage-result" data-picture-stage-result aria-live="polite">ルールを つくろう</output>
      </div>
    `;
  }

  function actionCardsMarkup(lesson) {
    return lesson.actions
      .map(
        (action) => `
          <button class="picture-action-card picture-action-${action.id}" type="button" data-picture-card="${action.id}" aria-label="${escapeText(action.label)}を追加">
            <img src="${lesson.sprite}" alt="" aria-hidden="true">
            <span><strong>${escapeText(action.label)}</strong><small>${escapeText(action.hint)}</small></span>
            <em aria-hidden="true">もつ</em>
          </button>
        `
      )
      .join("");
  }

  function renderLesson() {
    const lesson = state.lesson;
    const copy = gradeCopy(state.grade);
    root.className = `picture-experience picture-lesson picture-${state.grade} picture-kind-${lesson.stageType}`;
    root.innerHTML = `
      <header class="picture-lesson-header">
        <button class="picture-back-button" type="button" data-picture-action="hub">${copy.hubBack}</button>
        <div class="picture-lesson-heading">
          <span>${copy.badge}</span>
          <h1>${escapeText(lesson.title)}</h1>
          <div class="picture-goal-summary" aria-label="きょうのゴール">
            <span class="picture-goal-icon" aria-hidden="true">🏁</span>
            <div><small>きょうの ゴール</small><strong>${escapeText(lesson.description)}</strong></div>
          </div>
        </div>
        <img class="picture-goal-preview" src="${lesson.thumbnail}" alt="ゴールの完成イメージ">
      </header>
      <div class="picture-builder-grid">
        <section class="picture-palette" aria-labelledby="pictureRuleTitle">
          <div class="picture-section-heading">
            <span>1</span><div><h2 id="pictureRuleTitle">${copy.rule}</h2><p>${state.grade === "lower" ? "カードを はこんで いれよう" : "カードをドラッグして並べよう"}</p></div>
          </div>
          <div class="picture-action-list">${actionCardsMarkup(lesson)}</div>
        </section>
        <section class="picture-stage-panel" aria-labelledby="pictureStageTitle">
          <div class="picture-section-heading">
            <span>2</span><div><h2 id="pictureStageTitle">${escapeText(lesson.stageTitle)}</h2><p>${copy.reuse}</p></div>
          </div>
          ${stageMarkup(lesson)}
        </section>
        <section class="picture-program-panel" aria-labelledby="pictureProgramTitle">
          <div class="picture-program-heading">
            <div><h2 id="pictureProgramTitle">できたルール</h2><p>${escapeText(lesson.repeatLabel)}</p></div>
            <div class="picture-program-actions">
              <button type="button" data-picture-action="sample">みほん</button>
              <button type="button" data-picture-action="clear">ぜんぶ けす</button>
            </div>
          </div>
          <div class="picture-program-row">
            <div class="picture-program-dropzone" data-picture-dropzone aria-label="カードを入れる場所"></div>
            <button class="picture-run-button" type="button" data-picture-action="run" disabled>${copy.run}</button>
          </div>
          <div class="picture-run-feedback" data-picture-feedback aria-live="polite">
            <strong>まだ ルールは できていないよ</strong>
            <span>つくったルールは、消さずに何度も使えます。</span>
          </div>
        </section>
      </div>
    `;
    renderProgram();
    window.requestAnimationFrame(drawStagePreview);
  }

  function renderProgram() {
    if (!state.lesson) return;
    const dropzone = root.querySelector("[data-picture-dropzone]");
    const feedback = root.querySelector("[data-picture-feedback]");
    const runButton = root.querySelector('[data-picture-action="run"]');
    if (!dropzone || !feedback || !runButton) return;
    feedback.classList.remove("is-question", "is-success");

    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample);
    if (!programStatus.canRun) {
      dropzone.innerHTML = `<p>ここに カードを はこぼう</p>`;
      feedback.innerHTML = `<strong>カードを 1まい いれてみよう</strong><span>1まい入れたら、すぐにうごかしてためせます。</span>`;
      runButton.disabled = true;
      window.requestAnimationFrame(drawStagePreview);
      return;
    }

    const labels = Object.fromEntries(state.lesson.actions.map((action) => [action.id, action.label]));
    dropzone.innerHTML = state.program
      .map(
        (actionId, index) => `
          <button type="button" class="picture-program-block" data-remove-picture-block="${index}" aria-label="${escapeText(labels[actionId])}を外す">
            <span>${index + 1}</span><strong>${escapeText(labels[actionId])}</strong>
          </button>
        `
      )
      .join("");
    runButton.disabled = state.running;
    feedback.innerHTML = programStatus.isCorrect
      ? `<strong>ルールが できた！</strong><span>「${escapeText(state.lesson.repeatLabel)}」を実行できます。</span>`
      : `<strong>1まいでも うごかせるよ</strong><span>できあがる前でも、まずはうごかしてためそう。</span>`;
    window.requestAnimationFrame(drawStagePreview);
  }

  function addAction(actionId) {
    if (state.running || !state.lesson?.actions.some((action) => action.id === actionId)) return;
    if (state.program.length >= 6) {
      const feedback = root.querySelector("[data-picture-feedback]");
      if (feedback) feedback.innerHTML = `<strong>カードは 6まいまで</strong><span>いらないカードをおして外そう。</span>`;
      return;
    }
    state.program.push(actionId);
    renderProgram();
  }

  function clearProgram() {
    if (state.running) return;
    state.program = [];
    state.runs = 0;
    renderProgram();
    resetStageVisual();
  }

  function showSample() {
    if (state.running) return;
    state.program = [...state.lesson.sample];
    renderProgram();
  }

  function resetStageVisual() {
    root.querySelectorAll(".picture-story-frame").forEach((frame) => frame.classList.remove("active", "done"));
    root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
    const sprite = root.querySelector("[data-picture-sprite]");
    if (sprite) {
      sprite.getAnimations().forEach((animation) => animation.cancel());
      sprite.style.transform = "";
    }
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = "ルールを つくろう";
    drawStagePreview();
  }

  async function runRule() {
    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample);
    if (state.running || !programStatus.canRun) return;
    const feedback = root.querySelector("[data-picture-feedback]");

    state.running = true;
    renderProgram();
    feedback.innerHTML = `<strong>うごかしているよ</strong><span>同じルールをくり返しています。</span>`;
    const startedAt = performance.now();
    await animateLesson(programStatus.isCorrect);
    const elapsed = Math.max(0.1, (performance.now() - startedAt) / 1000);
    state.running = false;
    state.runs += 1;
    renderProgram();
    const reviewQuestion = state.grade === "lower" ? "これで ただしいかな？" : "この動きで正しいかな？";
    if (programStatus.isCorrect) {
      feedback.classList.add("is-success");
      feedback.innerHTML = `<strong>${escapeText(state.lesson.success)}</strong><span>${elapsed.toFixed(1)}秒・このルールを ${state.runs}回 つかった！</span>`;
    } else {
      feedback.classList.add("is-question");
      feedback.innerHTML = `<strong>${reviewQuestion}</strong><span>うごきを見て、カードのじゅんばんを考えよう。直して何度でもためせるよ。</span>`;
    }
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = programStatus.isCorrect ? state.lesson.success : reviewQuestion;
  }

  async function animateLesson(isCorrect) {
    const type = state.lesson.stageType;
    if (type === "story") return animateStory(isCorrect);
    const sprite = root.querySelector("[data-picture-sprite]");
    if (!sprite) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());

    if (["jump", "fish", "motion"].includes(type)) return animateMovementPath(sprite, type, isCorrect);

    if (!isCorrect) {
      root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
      const trialKeyframes = buildTrialKeyframes();
      const trialAnimation = sprite.animate(trialKeyframes, {
        duration: Math.max(700, trialKeyframes.length * 280),
        easing: "ease-in-out",
        fill: "forwards"
      });
      await trialAnimation.finished.catch(() => {});
      return;
    }

    const keyframes = {
      paint: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(430%, 0) rotate(90deg)" },
        { transform: "translate(430%, 220%) rotate(180deg)" },
        { transform: "translate(0, 220%) rotate(270deg)" },
        { transform: "translate(0, 0) rotate(360deg)" }
      ],
      coordinate: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(170%, -90%) rotate(60deg)" },
        { transform: "translate(340%, 0) rotate(120deg)" },
        { transform: "translate(255%, 115%) rotate(180deg)" },
        { transform: "translate(80%, 115%) rotate(240deg)" },
        { transform: "translate(0, 0) rotate(360deg)" }
      ]
    };
    const durations = { paint: 2600, coordinate: 2600 };
    const animation = sprite.animate(keyframes[type], {
      duration: durations[type],
      easing: "ease-in-out",
      fill: "forwards"
    });
    if (type === "paint" || type === "coordinate") animateDrawing(type, durations[type]);
    await animation.finished.catch(() => {});
  }

  async function animateMovementPath(sprite, type, isCorrect) {
    const scene = root.querySelector(`.picture-stage-${type}`);
    if (!scene) return;
    const route = getMovementRoute(type, state.program, scene.clientWidth, scene.clientHeight);
    const duration = Math.max(900, (route.length - 1) * 420);
    root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
    const animation = sprite.animate(
      route.map(({ x, y, rotation, offset }) => ({
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        offset,
        easing: "ease-in-out"
      })),
      { duration, fill: "forwards" }
    );
    const hitAnimations = type === "jump"
      ? route.filter(({ hit }) => Number.isInteger(hit))
      .map(async ({ hit, offset }) => {
        await sleep(duration * offset);
        if (state.running) root.querySelector(`[data-jump-hit="${hit}"]`)?.classList.add("is-visible");
      })
      : [];
    await Promise.all([animation.finished.catch(() => {}), ...hitAnimations]);
  }

  function buildTrialKeyframes() {
    let x = 0;
    let y = 0;
    let rotation = 0;
    const keyframes = [{ transform: "translate(0, 0) rotate(0deg)" }];
    const rightActions = new Set(["right", "swim-right", "forward", "right-100", "right-80", "x-100"]);
    const upActions = new Set(["jump", "swim-up", "up-50", "up-60", "y-50"]);

    state.program.forEach((actionId) => {
      if (rightActions.has(actionId)) x += 105;
      if (upActions.has(actionId)) y -= 62;
      if (actionId === "down-60" || actionId === "stomp") y += 55;
      if (actionId === "turn" || actionId === "turn-30") rotation += 30;
      if (actionId === "turn-60") rotation += 60;
      if (actionId === "bubble" || actionId === "color") rotation += 12;
      if (actionId === "repeat") {
        x += 45;
        rotation += 15;
      }
      keyframes.push({ transform: `translate(${x}%, ${y}%) rotate(${rotation}deg)` });
    });

    return keyframes;
  }

  async function animateStory(isCorrect) {
    const frames = [...root.querySelectorAll(".picture-story-frame")];
    frames.forEach((frame) => frame.classList.remove("active", "done"));
    const framesToRun = isCorrect ? frames : frames.slice(0, Math.min(2, Math.max(1, state.program.length)));
    for (const frame of framesToRun) {
      frame.classList.add("active");
      const robot = frame.querySelector(".picture-story-robot");
      const animation = robot.animate(
        [
          { transform: "translateY(16px) scale(.92)", opacity: 0.55 },
          { transform: "translateY(-22px) scale(1.04)", opacity: 1 },
          { transform: "translateY(0) scale(1)", opacity: 1 }
        ],
        { duration: 620, easing: "ease-out" }
      );
      await animation.finished.catch(() => {});
      frame.classList.remove("active");
      frame.classList.add("done");
      await sleep(130);
    }
  }

  function canvasContext() {
    const canvas = root.querySelector("[data-picture-canvas]");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * scale);
    canvas.height = Math.round(rect.height * scale);
    const context = canvas.getContext("2d");
    context.scale(scale, scale);
    return { canvas, context, width: rect.width, height: rect.height };
  }

  function drawStagePreview() {
    if (!state.lesson || state.lesson.stageType === "story") return;
    const setup = canvasContext();
    if (!setup) return;
    const { context: ctx, width: w, height: h } = setup;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (["jump", "fish", "motion"].includes(state.lesson.stageType)) {
      const sprite = root.querySelector("[data-picture-sprite]");
      const startX = (sprite?.offsetLeft ?? w * 0.06) + (sprite?.offsetWidth ?? 0) / 2;
      const startY = (sprite?.offsetTop ?? h * 0.6) + (sprite?.offsetHeight ?? 0) / 2;
      const goalRoute = getMovementRoute(state.lesson.stageType, state.lesson.sample, w, h);
      drawRouteLine(ctx, goalRoute, startX, startY, "rgba(13, 42, 99, .44)", [10, 12], Math.max(8, w * 0.012));
      drawRouteLine(ctx, goalRoute, startX, startY, "#fff", [10, 12], Math.max(4, w * 0.006));
      if (state.program.length > 0) {
        const currentRoute = getMovementRoute(state.lesson.stageType, state.program, w, h);
        drawRouteLine(ctx, currentRoute, startX, startY, "rgba(255,255,255,.92)", [], Math.max(10, w * 0.014));
        drawRouteLine(ctx, currentRoute, startX, startY, "#ee4057", [], Math.max(6, w * 0.008));
      }
    }

    if (state.lesson.stageType === "paint") drawPaintCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
    if (state.lesson.stageType === "coordinate") drawCoordinateCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
  }

  function drawRouteLine(ctx, route, startX, startY, color, dash, width) {
    ctx.save();
    ctx.setLineDash(dash);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    route.slice(1).forEach(({ x, y }) => ctx.lineTo(startX + x, startY + y));
    ctx.stroke();
    ctx.restore();
  }

  function animateDrawing(type, duration) {
    const started = performance.now();
    const frame = (now) => {
      if (!state.running) return;
      const setup = canvasContext();
      if (!setup) return;
      const progress = Math.min(1, (now - started) / duration);
      if (type === "paint") drawPaintCanvas(setup.context, setup.width, setup.height, progress);
      else drawCoordinateCanvas(setup.context, setup.width, setup.height, progress);
      if (progress < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  function drawPaintCanvas(ctx, w, h, progress) {
    ctx.clearRect(0, 0, w, h);
    const left = w * 0.19;
    const top = h * 0.17;
    const right = w * 0.76;
    const bottom = h * 0.76;
    const segments = [
      [left, top, right, top, "#2289df"],
      [right, top, right, bottom, "#62b64b"],
      [right, bottom, left, bottom, "#ff952d"],
      [left, bottom, left, top, "#8b59d4"]
    ];
    const amount = progress * segments.length;
    ctx.lineWidth = Math.max(8, w * 0.012);
    segments.forEach((segment, index) => {
      const local = Math.max(0, Math.min(1, amount - index));
      if (!local) return;
      const [x1, y1, x2, y2, color] = segment;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - x1) * local, y1 + (y2 - y1) * local);
      ctx.stroke();
    });
  }

  function drawCoordinateCanvas(ctx, w, h, progress) {
    ctx.clearRect(0, 0, w, h);
    const cx = w * 0.54;
    const cy = h * 0.52;
    ctx.strokeStyle = "rgba(21,74,130,.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, cy);
    ctx.lineTo(w * 0.94, cy);
    ctx.moveTo(cx, h * 0.08);
    ctx.lineTo(cx, h * 0.92);
    ctx.stroke();
    ctx.fillStyle = "#173f78";
    ctx.font = "800 16px sans-serif";
    ctx.fillText("x", w * 0.94, cy - 8);
    ctx.fillText("y", cx + 8, h * 0.1);

    const radius = Math.min(w, h) * 0.24;
    const colors = ["#2e8fe5", "#66b84f", "#f6b51d", "#ff7a55", "#ef5c8d", "#8b62d6"];
    const count = 6;
    for (let index = 0; index < count; index += 1) {
      if (progress * count < index) break;
      const local = Math.min(1, progress * count - index);
      const angle = (Math.PI * 2 * index) / count;
      const nextAngle = angle + Math.PI / 3;
      const x1 = cx + Math.cos(angle) * radius;
      const y1 = cy + Math.sin(angle) * radius;
      const x2 = cx + Math.cos(nextAngle) * radius;
      const y2 = cy + Math.sin(nextAngle) * radius;
      ctx.strokeStyle = colors[index];
      ctx.lineWidth = Math.max(5, w * 0.008);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(x1, y1, x1 + (x2 - x1) * local, y1 + (y2 - y1) * local);
      ctx.stroke();
    }
  }

  function removeDragGhost() {
    state.drag?.ghost?.remove();
    root.querySelector("[data-picture-dropzone]")?.classList.remove("drag-over");
    state.drag = null;
  }

  function handlePointerDown(event) {
    const card = event.target.closest("[data-picture-card]");
    if (!card || state.running) return;
    state.drag = {
      id: card.dataset.pictureCard,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null,
      pointerId: event.pointerId
    };
    card.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - state.drag.startX, event.clientY - state.drag.startY);
    if (!state.drag.moved && distance < 9) return;
    event.preventDefault();
    if (!state.drag.ghost) {
      const source = root.querySelector(`[data-picture-card="${state.drag.id}"]`);
      state.drag.ghost = source.cloneNode(true);
      state.drag.ghost.classList.add("picture-drag-ghost");
      state.drag.ghost.removeAttribute("data-picture-card");
      document.body.append(state.drag.ghost);
    }
    state.drag.moved = true;
    state.drag.ghost.style.left = `${event.clientX}px`;
    state.drag.ghost.style.top = `${event.clientY}px`;
    const dropzone = root.querySelector("[data-picture-dropzone]");
    const rect = dropzone?.getBoundingClientRect();
    dropzone?.classList.toggle(
      "drag-over",
      Boolean(rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom)
    );
  }

  function handlePointerUp(event) {
    if (!state.drag || state.drag.pointerId !== event.pointerId) return;
    const { id, moved } = state.drag;
    const dropzone = root.querySelector("[data-picture-dropzone]");
    const rect = dropzone?.getBoundingClientRect();
    const dropped = Boolean(
      moved && rect && event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom
    );
    if (moved) state.suppressActionClickUntil = performance.now() + 500;
    removeDragGhost();
    if (dropped) addAction(id);
  }

  function handleClick(event) {
    const lessonButton = event.target.closest("[data-open-picture-lesson]");
    if (lessonButton) return openLesson(lessonButton.dataset.openPictureLesson);

    const card = event.target.closest("[data-picture-card]");
    if (card) {
      if (performance.now() < state.suppressActionClickUntil) return;
      return addAction(card.dataset.pictureCard);
    }

    const removeButton = event.target.closest("[data-remove-picture-block]");
    if (removeButton && !state.running) {
      state.program.splice(Number(removeButton.dataset.removePictureBlock), 1);
      return renderProgram();
    }

    const actionButton = event.target.closest("[data-picture-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.pictureAction;
    if (action === "home") onBackHome();
    if (action === "hub") openHub();
    if (action === "sample") showSample();
    if (action === "clear") clearProgram();
    if (action === "run") runRule();
  }

  function render(grade) {
    state.grade = grade === "upper" ? "upper" : "lower";
    const lessonId = new URLSearchParams(window.location.search).get("lesson");
    state.lesson = findPictureLesson(state.grade, lessonId);
    resetLessonState();
    if (state.lesson) renderLesson();
    else renderHub();
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("pointercancel", removeDragGhost);
  window.addEventListener("resize", () => window.requestAnimationFrame(drawStagePreview));
  window.addEventListener("popstate", () => render(state.grade));

  return { render };
}
