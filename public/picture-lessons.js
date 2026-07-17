import { findPictureLesson, pictureLessons } from "./picture-lessons-data.js?v=20260717n";
import { initUpperPictureLessons } from "./upper-picture-lessons.js?v=20260717o";
import { createGridPaintRoute, drawGridPaintBoard } from "./lower-grid-paint.js?v=20260717n";

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
  const addGentleCurve = (deltaX, nextY, tilt, steps = 7) => {
    const startX = x;
    const startY = y;
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      const smoothProgress = progress * progress * (3 - 2 * progress);
      x = startX + deltaX * progress;
      y = startY + (nextY - startY) * smoothProgress;
      rotation = tilt * Math.sin(Math.PI * progress);
      route.push({ x, y, rotation });
    }
    rotation = 0;
    route.at(-1).rotation = 0;
  };

  program.forEach((actionId) => {
    if (stageType === "jump") {
      if (actionId === "right") addPoint(width * 0.16, 0);
      else if (actionId === "jump") {
        addPoint(width * 0.16, height * -0.48, -5);
        addPoint(width * 0.16, 0, 0);
      } else if (actionId === "stomp") {
        addPoint(width * 0.04, height * -0.38, 4);
        addPoint(width * 0.02, height * -0.19, 0, { hit: 0 });
        addPoint(width * 0.06, height * -0.38, 4);
        addPoint(width * 0.03, height * -0.19, 0, { hit: 1 });
        addPoint(width * 0.03, 0, 0);
      }
    } else if (stageType === "fish") {
      if (actionId === "swim-up-right") addGentleCurve(width * 0.24, height * -0.28, -14);
      else if (actionId === "bubble") addPoint(0, y, rotation, { bubble: true, opensShell: y <= height * -0.2 });
      else if (actionId === "swim-down-right") addGentleCurve(width * 0.26, 0, 14);
      else if (actionId === "swim-right") addGentleCurve(width * 0.22, y, 0, 5);
    } else if (stageType === "motion") {
      if (actionId === "forward-120" || actionId === "forward-80") {
        const distance = width * (actionId === "forward-120" ? 0.22 : 0.16);
        const radians = rotation * Math.PI / 180;
        addPoint(Math.cos(radians) * distance, y + Math.sin(radians) * distance, rotation);
      } else if (actionId === "turn-left-45") {
        addPoint(0, y, rotation - 45);
      } else if (actionId === "turn-right-90") {
        addPoint(0, y, rotation + 90);
      }
    }
  });

  return route.map((point, index) => ({
    ...point,
    offset: route.length === 1 ? 0 : index / (route.length - 1)
  }));
}

export function getJumpRoute(width, height) {
  return getMovementRoute("jump", ["right", "jump", "stomp", "right"], width, height);
}

export function getPaintRoute(program, width, height) {
  const lineColor = "#2289df";
  const step = Math.min(width * 0.3, height * 0.5);
  let x = 0;
  let y = 0;
  let rotation = 0;
  const route = [{ x, y, rotation, color: lineColor, draws: false }];

  program.forEach((actionId) => {
    let draws = false;
    if (actionId === "forward") {
      const radians = rotation * Math.PI / 180;
      x += Math.round(Math.cos(radians) * step * 100) / 100;
      y += Math.round(Math.sin(radians) * step * 100) / 100;
      draws = true;
    } else if (actionId === "backward") {
      const radians = rotation * Math.PI / 180;
      x -= Math.round(Math.cos(radians) * step * 100) / 100;
      y -= Math.round(Math.sin(radians) * step * 100) / 100;
      draws = true;
    } else if (actionId === "turn") {
      rotation = (rotation + 90) % 360;
    } else if (actionId === "turn-left") {
      rotation = (rotation + 270) % 360;
    }
    route.push({ x, y, rotation, color: lineColor, draws });
  });

  return route.map((point, index) => ({
    ...point,
    offset: route.length === 1 ? 0 : index / (route.length - 1)
  }));
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
        repeatRun: "くりかえし うごかす",
        stop: "とめる",
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
        repeatRun: "繰り返し実行する",
        stop: "止める",
        back: "TOPへ戻る",
        hubBack: "レッスンを選ぶ"
      };
}

export function initPictureLessons({ root, onBackHome }) {
  let successOverlayTimer = 0;
  let upperLessons = null;
  const state = {
    grade: "lower",
    lesson: null,
    program: [],
    runs: 0,
    running: false,
    looping: false,
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
    state.looping = false;
    const overlay = document.querySelector("[data-picture-success-overlay]");
    overlay?.classList.remove("is-visible");
    overlay?.setAttribute("aria-hidden", "true");
    root.querySelector("[data-picture-loop-success]")?.remove();
  }

  function ensureSuccessOverlay() {
    let overlay = document.querySelector("[data-picture-success-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "picture-success-overlay";
      overlay.dataset.pictureSuccessOverlay = "";
      overlay.setAttribute("role", "alert");
      overlay.setAttribute("aria-live", "assertive");
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = `
        <div class="picture-success-burst" aria-hidden="true">
          <span>★</span><span>●</span><span>★</span><span>●</span><span>★</span><span>●</span>
        </div>
        <div class="picture-success-message">
          <span aria-hidden="true">🎉</span>
          <strong data-picture-success-title></strong>
          <small data-picture-success-detail></small>
        </div>
      `;
      document.body.append(overlay);
    }
    const title = overlay.querySelector("[data-picture-success-title]");
    const detail = overlay.querySelector("[data-picture-success-detail]");
    if (title) title.textContent = state.grade === "lower" ? "せいかい！" : "正解！";
    if (detail) detail.textContent = state.grade === "lower" ? "ルールどおりに うごいたよ" : "ルールどおりに動きました";
    return overlay;
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
           <span class="picture-jump-hit picture-jump-hit-2" data-jump-hit="1">イタイ！</span><div class="picture-jump-goal" aria-label="ジャンプぼうけんのゴール"><span aria-hidden="true">🏁</span><strong>ゴール</strong></div>`
        : "";
    const fishMission =
      lesson.stageType === "fish"
        ? `<div class="picture-fish-shell" data-fish-shell aria-label="あわで ひらく かい">
             <span aria-hidden="true">🐚</span><strong data-fish-shell-text>いちばん うえで<br>あわを だそう</strong>
           </div>
           <div class="picture-fish-bubbles" data-fish-bubbles aria-hidden="true"><i></i><i></i><i></i><i></i></div>
           <div class="picture-fish-goal" aria-label="おさかなのゴール"><span aria-hidden="true">🏁</span><strong>ゴール</strong></div>`
        : "";
    const motionMission =
      lesson.stageType === "motion"
        ? `<div class="picture-motion-obstacle" aria-label="よける池"><span aria-hidden="true">💧</span><strong>この池を<br>よけよう</strong></div>
           <div class="picture-motion-goal" aria-label="ロボットのゴール"><span aria-hidden="true">🏁</span><strong>ゴール</strong></div>`
        : "";
    const pathLegend = ["jump", "fish", "paint", "motion", "grid-paint"].includes(lesson.stageType)
      ? `<div class="picture-path-legend" aria-label="線の見方">
           <span class="picture-path-goal"><i aria-hidden="true"></i>もくひょう</span>
           <span class="picture-path-current"><i aria-hidden="true"></i>いまの ルール</span>
         </div>`
      : "";
    const canvasLabel = lesson.stageType === "grid-paint" ? "方眼紙の移動と色ぬり" : lesson.stageType === "coordinate" ? "座標と動きの線" : "動きの道";
    return `
      <div class="picture-stage-scene picture-stage-${lesson.stageType}">
        ${background}
        <canvas class="picture-stage-canvas" data-picture-canvas aria-label="${canvasLabel}"></canvas>
        ${pathLegend}
        <img class="picture-stage-sprite" data-picture-sprite src="${lesson.sprite}" alt="動かす絵">
        ${jumpHitMessages}
        ${fishMission}
        ${motionMission}
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
            <em aria-hidden="true">えらぶ</em>
          </button>
        `
      )
      .join("");
  }

  function renderLesson() {
    const lesson = state.lesson;
    if (state.grade === "upper" && upperLessons) {
      upperLessons.render(lesson);
      return;
    }
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
            <div class="picture-run-controls">
              <button class="picture-run-button" type="button" data-picture-action="run" disabled>${copy.run}</button>
              <button class="picture-repeat-button" type="button" data-picture-action="repeat-run" disabled>
                <strong>${copy.repeatRun}</strong><small>${state.grade === "lower" ? "とめるまで" : "止めるまで"}</small>
              </button>
            </div>
          </div>
          <div class="picture-run-feedback" data-picture-feedback aria-live="polite">
            <strong>まだ ルールは できていないよ</strong>
            <span>つくったルールは、消さずに何度も使えます。</span>
          </div>
        </section>
      </div>
    `;
    ensureSuccessOverlay();
    renderProgram();
    window.requestAnimationFrame(drawStagePreview);
  }

  function renderProgram() {
    if (!state.lesson) return;
    const dropzone = root.querySelector("[data-picture-dropzone]");
    const feedback = root.querySelector("[data-picture-feedback]");
    const runButton = root.querySelector('[data-picture-action="run"]');
    const repeatButton = root.querySelector('[data-picture-action="repeat-run"]');
    if (!dropzone || !feedback || !runButton || !repeatButton) return;
    feedback.classList.remove("is-question", "is-success");

    const copy = gradeCopy(state.grade);
    repeatButton.classList.toggle("is-stopping", state.looping);
    repeatButton.innerHTML = state.looping
      ? `<strong>${copy.stop}</strong><small>${state.grade === "lower" ? "ここで おわる" : "繰り返しを終了"}</small>`
      : `<strong>${copy.repeatRun}</strong><small>${state.grade === "lower" ? "とめるまで" : "止めるまで"}</small>`;

    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample);
    if (!programStatus.canRun) {
      dropzone.innerHTML = `<p>ここに カードを はこぼう</p>`;
      feedback.innerHTML = `<strong>カードを 1まい いれてみよう</strong><span>1まい入れたら、すぐにうごかしてためせます。</span>`;
      runButton.disabled = true;
      repeatButton.disabled = true;
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
    repeatButton.disabled = state.running && !state.looping;
    feedback.innerHTML = programStatus.isCorrect
      ? `<strong>ルールが できた！</strong><span>「${escapeText(state.lesson.repeatLabel)}」を実行できます。</span>`
      : `<strong>1まいでも うごかせるよ</strong><span>できあがる前でも、まずはうごかしてためそう。</span>`;
    window.requestAnimationFrame(drawStagePreview);
  }

  function addAction(actionId) {
    if (state.running || !state.lesson?.actions.some((action) => action.id === actionId)) return;
    if (state.program.length >= 10) {
      const feedback = root.querySelector("[data-picture-feedback]");
      if (feedback) feedback.innerHTML = `<strong>カードは 10まいまで</strong><span>いらないカードをおして外そう。</span>`;
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
    root.querySelector("[data-fish-bubbles]")?.classList.remove("is-visible");
    const fishShell = root.querySelector("[data-fish-shell]");
    fishShell?.classList.remove("is-open");
    const fishShellText = root.querySelector("[data-fish-shell-text]");
    if (fishShellText) fishShellText.innerHTML = "いちばん うえで<br>あわを だそう";
    const sprite = root.querySelector("[data-picture-sprite]");
    if (sprite) {
      sprite.getAnimations().forEach((animation) => animation.cancel());
      sprite.style.transform = "";
    }
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = "ルールを つくろう";
    drawStagePreview();
  }

  function showSuccessOverlay({ compact = false } = {}) {
    if (compact) {
      const stage = root.querySelector(".upper-stage, .picture-stage-scene");
      if (!stage) return;
      let badge = stage.querySelector("[data-picture-loop-success]");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "picture-loop-success";
        badge.dataset.pictureLoopSuccess = "";
        badge.setAttribute("role", "status");
        stage.append(badge);
      }
      badge.textContent = state.grade === "lower" ? "せいかい！" : "正解！";
      window.clearTimeout(successOverlayTimer);
      badge.classList.remove("is-visible");
      void badge.offsetWidth;
      badge.classList.add("is-visible");
      successOverlayTimer = window.setTimeout(() => badge.classList.remove("is-visible"), 3200);
      return;
    }
    const overlay = ensureSuccessOverlay();
    window.clearTimeout(successOverlayTimer);
    overlay.classList.remove("is-visible");
    void overlay.offsetWidth;
    overlay.setAttribute("aria-hidden", "false");
    overlay.classList.add("is-visible");
    successOverlayTimer = window.setTimeout(() => {
      overlay.classList.remove("is-visible");
      overlay.setAttribute("aria-hidden", "true");
    }, 2300);
  }

  async function runRule({ repeating = false } = {}) {
    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample);
    if (state.running || !programStatus.canRun) return;
    const feedback = root.querySelector("[data-picture-feedback]");

    state.running = true;
    renderProgram();
    feedback.innerHTML = repeating
      ? `<strong>くりかえしているよ</strong><span>「とめる」を おすまで、同じルールを なんども つかいます。</span>`
      : `<strong>1かい うごかしているよ</strong><span>つくったルールを、はじめから おわりまで ためします。</span>`;
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
      showSuccessOverlay({ compact: repeating });
    } else {
      feedback.classList.add("is-question");
      feedback.innerHTML = `<strong>${reviewQuestion}</strong><span>うごきを見て、カードのじゅんばんを考えよう。直して何度でもためせるよ。</span>`;
    }
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = programStatus.isCorrect ? state.lesson.success : reviewQuestion;
  }

  async function runRepeatedly() {
    if (state.looping) return stopRepeating();
    if (state.running || state.program.length === 0) return;

    state.looping = true;
    renderProgram();
    while (state.looping) {
      await runRule({ repeating: true });
      if (!state.looping) break;
      await sleep(260);
      if (!state.looping) break;
      resetStageVisual();
    }
    state.running = false;
    state.looping = false;
    renderProgram();
    const feedback = root.querySelector("[data-picture-feedback]");
    if (feedback) feedback.innerHTML = `<strong>くりかえしを とめたよ</strong><span>カードを なおして、また ためせます。</span>`;
  }

  function stopRepeating() {
    if (!state.looping) return;
    state.looping = false;
    state.running = false;
    root.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
    renderProgram();
  }

  async function animateLesson(isCorrect) {
    const type = state.lesson.stageType;
    if (type === "story") return animateStory(isCorrect);
    const sprite = root.querySelector("[data-picture-sprite]");
    if (!sprite) return;
    sprite.getAnimations().forEach((animation) => animation.cancel());

    if (["jump", "fish", "motion"].includes(type)) return animateMovementPath(sprite, type, isCorrect);
    if (type === "paint") return animatePaintPath(sprite);
    if (type === "grid-paint") return animateGridPaintPath(sprite);

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
      coordinate: [
        { transform: "translate(0, 0) rotate(0deg)" },
        { transform: "translate(170%, -90%) rotate(60deg)" },
        { transform: "translate(340%, 0) rotate(120deg)" },
        { transform: "translate(255%, 115%) rotate(180deg)" },
        { transform: "translate(80%, 115%) rotate(240deg)" },
        { transform: "translate(0, 0) rotate(360deg)" }
      ]
    };
    const durations = { coordinate: 2600 };
    const animation = sprite.animate(keyframes[type], {
      duration: durations[type],
      easing: "ease-in-out",
      fill: "forwards"
    });
    if (type === "coordinate") animateDrawing(type, durations[type]);
    await animation.finished.catch(() => {});
  }

  async function animatePaintPath(sprite) {
    const scene = root.querySelector(".picture-stage-paint");
    if (!scene) return;
    const route = getPaintRoute(state.program, scene.clientWidth, scene.clientHeight);
    const duration = Math.max(900, (route.length - 1) * 300);
    const animation = sprite.animate(
      route.map(({ x, y, rotation, offset }) => ({
        transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
        offset,
        easing: "ease-in-out"
      })),
      { duration, fill: "forwards" }
    );
    animateDrawing("paint", duration);
    await animation.finished.catch(() => {});
  }

  async function animateGridPaintPath(sprite) {
    const scene = root.querySelector(".picture-stage-grid-paint");
    if (!scene) return;
    const route = createGridPaintRoute(state.program, scene.clientWidth, scene.clientHeight);
    const duration = Math.max(900, (route.length - 1) * 360);
    const animation = sprite.animate(route.map(({ x, y, offset }) => ({ transform: `translate(${x}px, ${y}px)`, offset })), {
      duration,
      easing: "ease-in-out",
      fill: "forwards"
    });
    animateDrawing("grid-paint", duration);
    await animation.finished.catch(() => {});
  }

  async function animateMovementPath(sprite, type, isCorrect) {
    const scene = root.querySelector(`.picture-stage-${type}`);
    if (!scene) return;
    const route = getMovementRoute(type, state.program, scene.clientWidth, scene.clientHeight);
    const duration = type === "fish"
      ? Math.max(1200, state.program.length * 760)
      : Math.max(900, (route.length - 1) * 420);
    root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
    root.querySelector("[data-fish-bubbles]")?.classList.remove("is-visible");
    root.querySelector("[data-fish-shell]")?.classList.remove("is-open");
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
    const bubbleAnimations = type === "fish"
      ? route.filter(({ bubble }) => bubble)
      .map(async ({ x, y, offset, opensShell }) => {
        await sleep(duration * offset);
        if (!state.running) return;
        const bubbles = root.querySelector("[data-fish-bubbles]");
        if (bubbles) {
          bubbles.style.left = `${sprite.offsetLeft + sprite.offsetWidth * 0.72 + x}px`;
          bubbles.style.top = `${sprite.offsetTop + sprite.offsetHeight * 0.2 + y}px`;
          bubbles.classList.remove("is-visible");
          void bubbles.offsetWidth;
          bubbles.classList.add("is-visible");
        }
        if (opensShell) {
          root.querySelector("[data-fish-shell]")?.classList.add("is-open");
          const shellText = root.querySelector("[data-fish-shell-text]");
          if (shellText) shellText.textContent = "ひらいた！";
        }
      })
      : [];
    await Promise.all([animation.finished.catch(() => {}), ...hitAnimations, ...bubbleAnimations]);
  }

  function buildTrialKeyframes() {
    let x = 0;
    let y = 0;
    let rotation = 0;
    const keyframes = [{ transform: "translate(0, 0) rotate(0deg)" }];
    const rightActions = new Set(["right", "swim-right", "swim-up-right", "swim-down-right", "forward", "right-100", "right-80", "x-100"]);
    const upActions = new Set(["jump", "swim-up-right", "up-50", "up-60", "y-50"]);

    state.program.forEach((actionId) => {
      if (rightActions.has(actionId)) x += 105;
      if (upActions.has(actionId)) y -= 62;
      if (actionId === "down-60" || actionId === "stomp" || actionId === "swim-down-right") y += 55;
      if (actionId === "turn" || actionId === "turn-30") rotation += 30;
      if (actionId === "turn-60") rotation += 60;
      if (actionId === "bubble") rotation += 0;
      keyframes.push({ transform: `translate(${x}%, ${y}%) rotate(${rotation}deg)` });
    });

    return keyframes;
  }

  async function animateStory(isCorrect) {
    const frames = [...root.querySelectorAll(".picture-story-frame")];
    frames.forEach((frame) => frame.classList.remove("active", "done"));
    const framesToRun = isCorrect ? frames : frames.slice(0, Math.min(2, Math.max(1, state.program.length)));
    for (const frame of framesToRun) {
      if (!state.running) break;
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
      if (!state.running) break;
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
      if (state.program.length > 0) {
        const currentRoute = getMovementRoute(state.lesson.stageType, state.program, w, h);
        drawRouteLine(ctx, currentRoute, startX, startY, "rgba(255,255,255,.92)", [], Math.max(10, w * 0.014));
        drawRouteLine(ctx, currentRoute, startX, startY, "#ee4057", [], Math.max(6, w * 0.008));
      }
      drawRouteLine(ctx, goalRoute, startX, startY, "rgba(13, 42, 99, .44)", [10, 12], Math.max(8, w * 0.012));
      drawRouteLine(ctx, goalRoute, startX, startY, "#fff", [10, 12], Math.max(4, w * 0.006));
    }

    if (state.lesson.stageType === "paint") drawPaintCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
    if (state.lesson.stageType === "grid-paint") drawGridPaintCanvas(ctx, w, h, state.runs > 0 ? 1 : 0);
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
      else if (type === "grid-paint") drawGridPaintCanvas(setup.context, setup.width, setup.height, progress);
      else drawCoordinateCanvas(setup.context, setup.width, setup.height, progress);
      if (progress < 1) window.requestAnimationFrame(frame);
    };
    window.requestAnimationFrame(frame);
  }

  function drawPaintCanvas(ctx, w, h, progress) {
    ctx.clearRect(0, 0, w, h);
    const sprite = root.querySelector(".picture-stage-paint [data-picture-sprite]");
    const startX = (sprite?.offsetLeft ?? w * 0.18) + (sprite?.offsetWidth ?? 0) / 2;
    const startY = (sprite?.offsetTop ?? h * 0.17) + (sprite?.offsetHeight ?? 0) / 2;
    const goalRoute = getPaintRoute(state.lesson.sample, w, h);
    drawRouteLine(ctx, goalRoute, startX, startY, "rgba(13, 42, 99, .44)", [10, 12], Math.max(8, w * 0.012));
    drawRouteLine(ctx, goalRoute, startX, startY, "#fff", [10, 12], Math.max(4, w * 0.006));
    if (state.program.length > 0) {
      const currentRoute = getPaintRoute(state.program, w, h);
      drawRouteLine(ctx, currentRoute, startX, startY, "rgba(255,255,255,.92)", [], Math.max(10, w * 0.014));
      drawRouteLine(ctx, currentRoute, startX, startY, "#ee4057", [], Math.max(6, w * 0.008));
    }
    const route = getPaintRoute(state.program, w, h);
    const amount = progress * Math.max(0, route.length - 1);
    ctx.lineWidth = Math.max(8, w * 0.012);
    route.slice(1).forEach((point, index) => {
      const local = Math.max(0, Math.min(1, amount - index));
      if (!point.draws || !local) return;
      const previous = route[index];
      ctx.strokeStyle = point.color;
      ctx.beginPath();
      ctx.moveTo(startX + previous.x, startY + previous.y);
      ctx.lineTo(
        startX + previous.x + (point.x - previous.x) * local,
        startY + previous.y + (point.y - previous.y) * local
      );
      ctx.stroke();
    });
  }

  function drawGridPaintCanvas(ctx, w, h, progress) {
    const { start } = drawGridPaintBoard(ctx, w, h, state.program, state.lesson.sample, progress);
    const sprite = root.querySelector(".picture-stage-grid-paint [data-picture-sprite]");
    if (!sprite) return;
    sprite.style.left = `${start.x - sprite.offsetWidth / 2}px`;
    sprite.style.top = `${start.y - sprite.offsetHeight / 2}px`;
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
    if (action === "repeat-run") runRepeatedly();
  }

  function render(grade) {
    state.grade = grade === "upper" ? "upper" : "lower";
    const lessonId = new URLSearchParams(window.location.search).get("lesson");
    state.lesson = findPictureLesson(state.grade, lessonId);
    resetLessonState();
    if (state.lesson) renderLesson();
    else renderHub();
  }

  upperLessons = initUpperPictureLessons({
    root,
    onSuccess: ({ repeating = false } = {}) => showSuccessOverlay({ compact: repeating })
  });
  root.addEventListener("click", handleClick);
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("pointercancel", removeDragGhost);
  window.addEventListener("resize", () => window.requestAnimationFrame(drawStagePreview));
  window.addEventListener("popstate", () => render(state.grade));

  return { render };
}
