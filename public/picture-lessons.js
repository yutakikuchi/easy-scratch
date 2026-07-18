import { findPictureLesson, pictureLessons } from "./picture-lessons-data.js?v=20260719a";
import { initUpperPictureLessons } from "./upper-picture-lessons.js?v=20260718q";
import { createGridPaintRoute, drawGridPaintBoard } from "./lower-grid-paint.js?v=20260718p";
import { expandPictureProgram, getJumpRoute, getMovementRoute, getPictureProgramStatus, parsePictureCommandToken, setPictureCommandRepeat } from "./picture-program-logic.js?v=20260718s";
export { expandPictureProgram, getJumpRoute, getMovementRoute, getPictureProgramStatus, parsePictureCommandToken, setPictureCommandRepeat };

const sleep = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
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
        back: "もどる",
        hubBack: "もどる"
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
        back: "もどる",
        hubBack: "もどる"
      };
}

export function initPictureLessons({ root, onBackHome }) {
  let successOverlayTimer = 0;
  let additionFeedbackTimer = 0;
  let upperLessons = null;
  const state = {
    grade: "lower",
    lesson: null,
    program: [],
    ruleMultiplier: 1,
    runs: 0,
    running: false,
    looping: false,
    drag: null,
    suppressActionClickUntil: 0,
    lastAddedActionId: null
  };
  const activeProgram = () => expandPictureProgram(state.program, state.ruleMultiplier);

  function setLessonInUrl(lessonId) {
    const url = new URL(window.location.href);
    if (lessonId) url.searchParams.set("lesson", lessonId);
    else url.searchParams.delete("lesson");
    window.history.pushState({}, "", url);
  }

  function resetLessonState() {
    window.clearTimeout(additionFeedbackTimer);
    state.program = [];
    state.ruleMultiplier = 1;
    state.runs = 0;
    state.lastAddedActionId = null;
    state.running = false;
    state.looping = false;
    const overlay = document.querySelector("[data-picture-success-overlay]");
    overlay?.classList.remove("is-visible");
    overlay?.setAttribute("aria-hidden", "true");
    root.querySelector("[data-picture-loop-success]")?.remove();
  }

  function ensureSuccessOverlay(titleText = "") {
    let overlay = document.querySelector("[data-picture-success-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "picture-success-overlay";
      overlay.dataset.pictureSuccessOverlay = "";
      overlay.setAttribute("role", "alert");
      overlay.setAttribute("aria-live", "assertive");
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("aria-label", "せいかい。タップでとじる");
      overlay.innerHTML = `
        <div class="picture-success-burst" aria-hidden="true">
          <span>★</span><span>●</span><span>★</span><span>●</span><span>★</span><span>●</span>
        </div>
        <div class="picture-success-message">
          <span aria-hidden="true">🎉</span>
          <strong data-picture-success-title></strong>
          <small data-picture-success-detail></small>
          <em>タップで とじる</em>
        </div>
      `;
      enableTapDismiss(overlay);
      document.body.append(overlay);
    }
    const title = overlay.querySelector("[data-picture-success-title]");
    const detail = overlay.querySelector("[data-picture-success-detail]");
    if (title) title.textContent = titleText || (state.grade === "lower" ? "せいかい！" : "正解！");
    if (detail) detail.textContent = state.grade === "lower" ? "ルールどおりに うごいたよ" : "ルールどおりに動きました";
    return overlay;
  }

  function dismissSuccess(target) {
    window.clearTimeout(successOverlayTimer);
    target.classList.remove("is-visible");
    target.setAttribute("aria-hidden", "true");
    target.tabIndex = -1;
  }

  function enableTapDismiss(target) {
    target.tabIndex = -1;
    target.addEventListener("pointerup", () => {
      if (target.matches("[data-picture-loop-success]")) target.dataset.userDismissed = "true";
      dismissSuccess(target);
    });
    target.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") dismissSuccess(target);
    });
  }

  function openLesson(lessonId) {
    const lesson = findPictureLesson(state.grade, lessonId);
    if (!lesson) return;
    setLessonInUrl(lessonId);
    state.lesson = lesson;
    resetLessonState();
    renderLesson();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function openHub({ updateUrl = true } = {}) {
    if (updateUrl) setLessonInUrl(null);
    state.lesson = null;
    resetLessonState();
    renderHub();
    window.scrollTo({ top: 0, behavior: "auto" });
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
                <img src="${lesson.thumbnail}" alt="" aria-hidden="true" loading="lazy" decoding="async">
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
      ? `<img class="picture-stage-background" src="${lesson.stageBackground}" alt="" decoding="async" fetchpriority="high">`
      : "";
    const jumpHitMessages =
      lesson.stageType === "jump"
        ? `<span class="picture-jump-hit picture-jump-hit-1" data-jump-hit="0">イタイ！</span>
           <span class="picture-jump-hit picture-jump-hit-2" data-jump-hit="1">イタイ！</span><div class="picture-jump-goal" aria-label="ジャンプぼうけんのゴール"><span aria-hidden="true">🏁</span><strong>ゴール</strong></div>`
        : "";
    const fishMission =
      lesson.stageType === "fish"
        ? `<div class="picture-fish-shell picture-fish-shell-1" data-fish-shell="0" aria-label="1かいめに あわで ひらく かい">
             <span aria-hidden="true">🐚</span><strong data-fish-shell-text="0">1かいめの かい<br>あわで ひらこう</strong>
           </div>
           <div class="picture-fish-shell picture-fish-shell-2" data-fish-shell="1" aria-label="2かいめに あわで ひらく かい">
             <span aria-hidden="true">🐚</span><strong data-fish-shell-text="1">2かいめの かい<br>あわで ひらこう</strong>
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

  function lowerLearningFocus(lesson) {
    const copyByType = {
      "grid-paint": [
        ["🧭", "ほうがんしで じゅんばんを かんがえる", "1マスずつ うごき、しょうがいぶつを よける てじゅんを つくります。"],
        ["🎨", "ひつような ばしょだけ いろを ぬる", "いどうと いろぬりを わけて かんがえ、もくてきの マスだけを ぬります。"],
        ["🔍", "すくない うごきで たしかめる", "しろい せんと あかい せんを みくらべて、てじゅんが あっているか たしかめます。"]
      ],
      jump: [
        ["➡️", "みぎへ すすむ ルールを つくる", "すすむ・ジャンプ・ふむを じゅんばんに くみあわせます。"],
        ["🦶", "おなじ めいれいを くりかえす", "1かい ふむ めいれいを 2まい つかうか、おなじ めいれいを ×2にします。"],
        ["🏁", "ゴールまで なおす", "まちがっても うごかし、せんを みて なおしながら ゴールを めざします。"]
      ],
      fish: [
        ["🐟", "うえ・したを くみあわせる", "なみのような うごきを ちいさな めいれいで つくります。"],
        ["🫧", "そのばの めいれいを つかう", "あわを だす めいれいは いどうではなく、かいを ひらくために つかいます。"],
        ["🔁", "まとまりを くりかえす", "4つの めいれいを 1つの まとまりにして、2かい つかう かんがえかたを まなびます。"]
      ],
      paint: [
        ["🚗", "むきと まえへ すすむを わける", "みぎを むく、まっすぐ すすむ、いろを かえるを べつべつの めいれいにします。"],
        ["🎨", "おなじ ルールで かたちを つくる", "おなじ うごきを くりかえして、せんと いろで かたちを つくります。"],
        ["🔁", "みじかい めいれいを なんども つかう", "おなじ まとまりを なんども つかうと、ながい てじゅんを みじかく できます。"]
      ]
    };
    const items = copyByType[lesson.stageType] ?? copyByType.jump;
    return `
      <section class="learning-focus" aria-label="ここから まなぶこと">
        <details open>
          <summary>ここから まなぶこと</summary>
          <div class="learning-focus-panel">
            ${items.map(([icon, title, text]) => `<div class="learning-focus-item"><span aria-hidden="true">${icon}</span><strong>${escapeText(title)}</strong><p>${escapeText(text)}</p></div>`).join("")}
          </div>
        </details>
      </section>
    `;
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
        <div class="picture-lesson-title-card">
          <span>${copy.badge}</span>
          <h1>${escapeText(lesson.title)}</h1>
        </div>
        <div class="picture-goal-summary" aria-label="きょうのゴール">
          <span class="picture-goal-icon" aria-hidden="true">🏁</span>
          <div><small>きょうの ゴール</small><strong>${escapeText(lesson.description)}</strong></div>
        </div>
        <img class="picture-goal-preview" src="${lesson.thumbnail}" alt="ゴールの完成イメージ">
      </header>
      ${lowerLearningFocus(lesson)}
      <div class="picture-builder-grid">
        <section class="picture-palette" aria-labelledby="pictureRuleTitle">
          <div class="picture-section-heading">
            <span>1</span><div><h2 id="pictureRuleTitle">${copy.rule}</h2><p>${state.grade === "lower" ? "カードを はこんで いれよう" : "カードをドラッグして並べよう"}</p></div>
          </div>
          <div class="picture-action-list">${actionCardsMarkup(lesson)}</div>
          <div class="picture-add-feedback" data-picture-add-feedback aria-live="polite">
            <span class="picture-add-feedback-mark" aria-hidden="true">✓</span>
            <div><strong data-picture-add-message>カードを えらんでね</strong><small data-picture-rule-count>できたルール：0まい</small></div>
            <button type="button" data-picture-action="show-program" aria-label="できたルールを みる">みる <span aria-hidden="true">↓</span></button>
          </div>
        </section>
        <section class="picture-stage-panel" aria-labelledby="pictureStageTitle">
          <div class="picture-section-heading">
            <span>2</span><div><h2 id="pictureStageTitle">${escapeText(lesson.stageTitle)}</h2><p>${copy.reuse}</p></div>
          </div>
          ${stageMarkup(lesson)}
        </section>
        <section class="picture-program-panel" aria-labelledby="pictureProgramTitle">
          <div class="picture-program-heading">
            <div><h2 id="pictureProgramTitle">できたルール</h2><p>${escapeText(lesson.repeatLabel)}</p><small class="picture-tap-delete-note">いらないカードは タップで けせます</small></div>
            <div class="picture-program-actions">
              ${lesson.repeatRuleTimes ? `<div class="picture-rule-times" aria-label="ルールを使う回数">
                <span>このルールを</span>${Array.from({ length: lesson.repeatRuleTimes }, (_, index) => `<button type="button" data-picture-multiplier="${index + 1}">×${index + 1}</button>`).join("")}<strong>かい つかう</strong>
              </div>` : ""}
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
    const count = root.querySelector("[data-picture-rule-count]");
    const addMessage = root.querySelector("[data-picture-add-message]");
    const addFeedback = root.querySelector("[data-picture-add-feedback]");
    if (!dropzone || !feedback || !runButton || !repeatButton) return;
    if (count) count.textContent = `できたルール：${state.program.length}まい`;
    if (addMessage && !state.lastAddedActionId) addMessage.textContent = state.program.length ? "カードを つぎも えらべるよ" : "カードを えらんでね";
    if (!state.program.length) addFeedback?.classList.remove("is-added", "is-confirmed");
    feedback.classList.remove("is-question", "is-success");
    root.querySelectorAll("[data-picture-multiplier]").forEach((button) => {
      button.classList.toggle("is-active", Number(button.dataset.pictureMultiplier) === state.ruleMultiplier);
      button.disabled = state.running;
    });

    const copy = gradeCopy(state.grade);
    repeatButton.classList.toggle("is-stopping", state.looping);
    repeatButton.innerHTML = state.looping
      ? `<strong>${copy.stop}</strong><small>${state.grade === "lower" ? "ここで おわる" : "繰り返しを終了"}</small>`
      : `<strong>${copy.repeatRun}</strong><small>${state.grade === "lower" ? "とめるまで" : "止めるまで"}</small>`;

    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample, state.ruleMultiplier);
    if (!programStatus.canRun) {
      dropzone.innerHTML = `<p>ここに カードを はこぼう</p>`;
      feedback.innerHTML = `<strong>カードを 1まい いれてみよう</strong><span>1まい入れたら、すぐにうごかしてためせます。</span>`;
      runButton.disabled = true;
      repeatButton.disabled = true;
      window.requestAnimationFrame(drawStagePreview);
      return;
    }

    const actions = Object.fromEntries(state.lesson.actions.map((action) => [action.id, action]));
    dropzone.innerHTML = state.program
      .map(
        (token, index) => {
          const { actionId, repeat } = parsePictureCommandToken(token);
          const action = actions[actionId];
          return `<div class="picture-program-item${repeat > 1 ? " is-repeated" : ""}" data-picture-program-item="${index}">
            <button type="button" class="picture-program-block" data-remove-picture-block="${index}" aria-label="${escapeText(action.label)}を外す">
              <span>${index + 1}</span><strong>${escapeText(action.label)}${repeat > 1 ? ` <b>×${repeat}</b>` : ""}</strong><em>タップで けす</em>
            </button>
            ${action.repeatable ? `<button class="picture-command-repeat" type="button" data-repeat-picture-block="${index}">${repeat > 1 ? "×1に もどす" : "この めいれいを ×2"}</button>` : ""}
          </div>`;
        }
      )
      .join("");
    runButton.disabled = state.running;
    repeatButton.disabled = state.running && !state.looping;
    const hasReusableRule = state.lesson.repeatRuleTimes && getPictureProgramStatus(state.program, state.lesson.sample, state.lesson.repeatRuleTimes).isCorrect;
    feedback.innerHTML = programStatus.isCorrect
      ? `<strong>ルールが できた！</strong><span>できたルールを うごかせます。${escapeText(state.lesson.repeatLabel)}</span>`
      : hasReusableRule && state.ruleMultiplier === 1
        ? `<strong>このルールを くりかえそう</strong><span>「×${state.lesson.repeatRuleTimes}」を えらぶか、おなじルールを そのかいすう ならべよう。</span>`
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
    const action = state.lesson.actions.find((item) => item.id === actionId);
    state.program.push(actionId);
    state.lastAddedActionId = actionId;
    renderProgram();
    const addFeedback = root.querySelector("[data-picture-add-feedback]");
    const addMessage = root.querySelector("[data-picture-add-message]");
    const sourceCard = root.querySelector(`[data-picture-card="${actionId}"]`);
    const addedCard = root.querySelector(`[data-picture-program-item="${state.program.length - 1}"]`);
    if (addMessage) addMessage.textContent = `「${action.label}」を いれたよ！`;
    addFeedback?.classList.add("is-confirmed");
    [addFeedback, sourceCard, addedCard].forEach((element) => {
      element?.classList.remove("is-added");
      void element?.offsetWidth;
      element?.classList.add("is-added");
    });
    window.clearTimeout(additionFeedbackTimer);
    additionFeedbackTimer = window.setTimeout(() => {
      [addFeedback, sourceCard, addedCard].forEach((element) => element?.classList.remove("is-added"));
      state.lastAddedActionId = null;
    }, 1800);
  }

  function clearProgram() {
    if (state.running) return;
    state.program = [];
    state.ruleMultiplier = 1;
    state.runs = 0;
    state.lastAddedActionId = null;
    renderProgram();
    resetStageVisual();
  }

  function showSample() {
    if (state.running) return;
    state.ruleMultiplier = state.lesson.repeatRuleTimes || 1;
    state.program = [...(state.lesson.builderSample || (state.lesson.repeatRuleTimes ? state.lesson.sample.slice(0, state.lesson.sample.length / state.lesson.repeatRuleTimes) : state.lesson.sample))];
    renderProgram();
  }

  function resetStageVisual() {
    root.querySelectorAll(".picture-story-frame").forEach((frame) => frame.classList.remove("active", "done"));
    root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
    root.querySelector("[data-fish-bubbles]")?.classList.remove("is-visible");
    root.querySelectorAll("[data-fish-shell]").forEach((shell, index) => {
      shell.classList.remove("is-open");
      const icon = shell.querySelector("span");
      if (icon) icon.textContent = "🐚";
      const text = shell.querySelector("[data-fish-shell-text]");
      if (text) text.innerHTML = `${index + 1}かいめの かい<br>あわで ひらこう`;
    });
    const sprite = root.querySelector("[data-picture-sprite]");
    if (sprite) {
      sprite.getAnimations().forEach((animation) => animation.cancel());
      sprite.style.transform = "";
    }
    const result = root.querySelector("[data-picture-stage-result]");
    if (result) result.textContent = "ルールを つくろう";
    drawStagePreview();
  }

  function showSuccessOverlay({ compact = false, title = "" } = {}) {
    if (compact) {
      const stage = root.querySelector(".upper-stage, .picture-stage-scene");
      if (!stage) return;
      let badge = stage.querySelector("[data-picture-loop-success]");
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "picture-loop-success";
        badge.dataset.pictureLoopSuccess = "";
        badge.setAttribute("role", "status");
        badge.setAttribute("aria-hidden", "true");
        enableTapDismiss(badge);
        stage.append(badge);
      }
      if (badge.dataset.userDismissed === "true") return;
      badge.textContent = title || (state.grade === "lower" ? "せいかい！" : "正解！");
      badge.setAttribute("aria-label", `${badge.textContent} タップでとじる`);
      window.clearTimeout(successOverlayTimer);
      badge.classList.remove("is-visible");
      void badge.offsetWidth;
      badge.setAttribute("aria-hidden", "false");
      badge.tabIndex = 0;
      badge.classList.add("is-visible");
      successOverlayTimer = window.setTimeout(() => dismissSuccess(badge), 12000);
      return;
    }
    const overlay = ensureSuccessOverlay(title);
    window.clearTimeout(successOverlayTimer);
    overlay.classList.remove("is-visible");
    void overlay.offsetWidth;
    overlay.setAttribute("aria-hidden", "false");
    overlay.tabIndex = 0;
    overlay.classList.add("is-visible");
    successOverlayTimer = window.setTimeout(() => dismissSuccess(overlay), 12000);
  }

  async function runRule({ repeating = false } = {}) {
    const programStatus = getPictureProgramStatus(state.program, state.lesson.sample, state.ruleMultiplier);
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
      const useCount = state.lesson.repeatRuleTimes ? state.ruleMultiplier : state.runs;
      feedback.innerHTML = `<strong>${escapeText(state.lesson.success)}</strong><span>${elapsed.toFixed(1)}秒・このルールを ${useCount}回 つかった！</span>`;
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
    root.querySelector("[data-picture-loop-success]")?.remove();
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
    const route = getPaintRoute(activeProgram(), scene.clientWidth, scene.clientHeight);
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
    const program = activeProgram();
    const route = getMovementRoute(type, program, scene.clientWidth, scene.clientHeight);
    const duration = type === "fish"
      ? Math.max(1200, program.length * 560)
      : Math.max(1200, program.length * 720);
    root.querySelectorAll("[data-jump-hit]").forEach((message) => message.classList.remove("is-visible"));
    root.querySelector("[data-fish-bubbles]")?.classList.remove("is-visible");
    root.querySelectorAll("[data-fish-shell]").forEach((shell, index) => {
      shell.classList.remove("is-open");
      const icon = shell.querySelector("span");
      if (icon) icon.textContent = "🐚";
      const text = shell.querySelector("[data-fish-shell-text]");
      if (text) text.innerHTML = `${index + 1}かいめの かい<br>あわで ひらこう`;
    });
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
      .map(async ({ x, y, offset, opensShell }, bubbleIndex) => {
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
          const shell = root.querySelector(`[data-fish-shell="${bubbleIndex}"]`);
          shell?.classList.add("is-open");
          const icon = shell?.querySelector("span");
          if (icon) icon.textContent = "🦪✨";
          const shellText = shell?.querySelector("[data-fish-shell-text]");
          if (shellText) shellText.textContent = `${bubbleIndex + 1}かいめ ひらいた！`;
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

    activeProgram().forEach((actionId) => {
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
        const currentRoute = getMovementRoute(state.lesson.stageType, activeProgram(), w, h);
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
      const currentRoute = getPaintRoute(activeProgram(), w, h);
      drawRouteLine(ctx, currentRoute, startX, startY, "rgba(255,255,255,.92)", [], Math.max(10, w * 0.014));
      drawRouteLine(ctx, currentRoute, startX, startY, "#ee4057", [], Math.max(6, w * 0.008));
    }
    const route = getPaintRoute(activeProgram(), w, h);
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
    const multiplierButton = event.target.closest("[data-picture-multiplier]");
    if (multiplierButton && !state.running) {
      state.ruleMultiplier = Number(multiplierButton.dataset.pictureMultiplier);
      return renderProgram();
    }

    const card = event.target.closest("[data-picture-card]");
    if (card) {
      if (performance.now() < state.suppressActionClickUntil) return;
      return addAction(card.dataset.pictureCard);
    }

    const removeButton = event.target.closest("[data-remove-picture-block]");
    if (removeButton && !state.running) {
      state.program.splice(Number(removeButton.dataset.removePictureBlock), 1);
      state.lastAddedActionId = null;
      return renderProgram();
    }

    const repeatCommandButton = event.target.closest("[data-repeat-picture-block]");
    if (repeatCommandButton && !state.running) {
      const index = Number(repeatCommandButton.dataset.repeatPictureBlock);
      const { repeat } = parsePictureCommandToken(state.program[index]);
      state.program[index] = setPictureCommandRepeat(state.program[index], repeat > 1 ? 1 : 2);
      return renderProgram();
    }

    const actionButton = event.target.closest("[data-picture-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.pictureAction;
    if (action === "home") onBackHome();
    if (action === "hub") openHub();
    if (action === "sample") showSample();
    if (action === "clear") clearProgram();
    if (action === "show-program") {
      root.querySelector(".picture-program-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    onSuccess: ({ repeating = false, title = "" } = {}) => showSuccessOverlay({ compact: repeating, title })
  });
  root.addEventListener("click", handleClick);
  root.addEventListener("pointerdown", handlePointerDown);
  root.addEventListener("pointermove", handlePointerMove);
  root.addEventListener("pointerup", handlePointerUp);
  root.addEventListener("pointercancel", removeDragGhost);
  window.addEventListener("resize", () => window.requestAnimationFrame(drawStagePreview));
  document.addEventListener("easy-scratch-languagechange", () => window.requestAnimationFrame(drawStagePreview));

  return { render };
}
