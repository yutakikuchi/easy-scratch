import { findPictureLesson, pictureLessons } from "./picture-lessons-data.js";

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sameProgram(program, sample) {
  return program.length === sample.length && program.every((item, index) => item === sample[index]);
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
    const canvasLabel = lesson.stageType === "coordinate" ? "座標と動きの線" : "動きの道";
    return `
      <div class="picture-stage-scene picture-stage-${lesson.stageType}">
        ${background}
        <canvas class="picture-stage-canvas" data-picture-canvas aria-label="${canvasLabel}"></canvas>
        <img class="picture-stage-sprite" data-picture-sprite src="${lesson.sprite}" alt="動かす絵">
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
        <div>
          <span>${copy.badge}</span>
          <h1>${escapeText(lesson.title)}</h1>
          <p>${escapeText(lesson.description)}</p>
        </div>
        <img src="${lesson.sprite}" alt="" aria-hidden="true">
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

    if (state.program.length === 0) {
      dropzone.innerHTML = `<p>ここに カードを はこぼう</p>`;
      feedback.innerHTML = `<strong>まだ ルールは できていないよ</strong><span>カードをタップしても追加できます。</span>`;
      runButton.disabled = true;
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
    const ready = sameProgram(state.program, state.lesson.sample);
    feedback.innerHTML = ready
      ? `<strong>ルールが できた！</strong><span>「${escapeText(state.lesson.repeatLabel)}」を実行できます。</span>`
      : `<strong>ルールを つくっているよ</strong><span>じゅんばんを考えて、4まいのカードをそろえよう。</span>`;
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
    if (state.running || state.program.length === 0) return;
    const feedback = root.querySelector("[data-picture-feedback]");
    if (!sameProgram(state.program, state.lesson.sample)) {
      feedback.innerHTML = `<strong>もうすこし！</strong><span>「みほん」を見て、カードのじゅんばんを直そう。</span>`;
      return;
    }

    state.running = true;
    renderProgram();
    feedback.innerHTML = `<strong>うごかしているよ</strong><span>同じルールをくり返しています。</span>`;
    const startedAt = performance.now();
    await animateLesson();
    const elapsed = Math.max(0.1, (performance.now() - startedAt) / 1000);
    state.running = false;
    state.runs += 1;
    renderProgram();
    feedback.innerHTML = `<strong>${escapeText(state.lesson.success)}</strong><span>${elapsed.toFixed(1)}秒・このルールを ${state.runs}回 つかった！</span>`;
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = state.lesson.success;
  }

  async function animateLesson() {
    const type = state.lesson.stageType;
    if (type === "story") return animateStory();
    const sprite = root.querySelector("[data-picture-sprite]");
    if (!sprite) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());

    const keyframes = {
      jump: [
        { transform: "translate(0, 0)" },
        { transform: "translate(165%, 0)" },
        { transform: "translate(310%, -125%)" },
        { transform: "translate(450%, 0)" },
        { transform: "translate(580%, -35%)" },
        { transform: "translate(700%, 0)" }
      ],
      fish: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(150%, -55%) rotate(-8deg)" },
        { transform: "translate(300%, 25%) rotate(7deg)" },
        { transform: "translate(470%, -55%) rotate(-8deg)" },
        { transform: "translate(650%, 5%) rotate(0deg)" }
      ],
      paint: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(430%, 0) rotate(90deg)" },
        { transform: "translate(430%, 220%) rotate(180deg)" },
        { transform: "translate(0, 220%) rotate(270deg)" },
        { transform: "translate(0, 0) rotate(360deg)" }
      ],
      motion: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(210%, -50%) rotate(8deg)" },
        { transform: "translate(420%, -115%) rotate(18deg)" },
        { transform: "translate(620%, -150%) rotate(30deg)" }
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
    const durations = { jump: 2200, fish: 2400, paint: 2600, motion: 2200, coordinate: 2600 };
    const animation = sprite.animate(keyframes[type], {
      duration: durations[type],
      easing: "ease-in-out",
      fill: "forwards"
    });
    if (type === "paint" || type === "coordinate") animateDrawing(type, durations[type]);
    await animation.finished.catch(() => {});
  }

  async function animateStory() {
    const frames = [...root.querySelectorAll(".picture-story-frame")];
    frames.forEach((frame) => frame.classList.remove("active", "done"));
    for (const frame of frames) {
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
      ctx.save();
      ctx.setLineDash([10, 12]);
      ctx.lineWidth = Math.max(4, w * 0.006);
      ctx.strokeStyle = state.lesson.stageType === "fish" ? "rgba(255,255,255,.9)" : "rgba(40,137,218,.8)";
      ctx.beginPath();
      if (state.lesson.stageType === "fish") {
        ctx.moveTo(w * 0.12, h * 0.53);
        ctx.bezierCurveTo(w * 0.3, h * 0.18, w * 0.38, h * 0.82, w * 0.54, h * 0.48);
        ctx.bezierCurveTo(w * 0.7, h * 0.18, w * 0.77, h * 0.75, w * 0.9, h * 0.48);
      } else if (state.lesson.stageType === "motion") {
        ctx.moveTo(w * 0.13, h * 0.74);
        ctx.bezierCurveTo(w * 0.35, h * 0.72, w * 0.55, h * 0.46, w * 0.84, h * 0.35);
      } else {
        ctx.moveTo(w * 0.1, h * 0.7);
        ctx.bezierCurveTo(w * 0.3, h * 0.7, w * 0.37, h * 0.2, w * 0.52, h * 0.7);
        ctx.lineTo(w * 0.88, h * 0.7);
      }
      ctx.stroke();
      ctx.restore();
    }

    if (state.lesson.stageType === "paint") drawPaintCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
    if (state.lesson.stageType === "coordinate") drawCoordinateCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
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
