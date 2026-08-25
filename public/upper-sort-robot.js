import {
  createSortRule,
  isSortRuleCorrect,
  runSortProgram,
  sortBatchPackages,
  sortConditionCatalog,
  sortDestinationCatalog,
  sortTestPackages,
  sortWarmupPackages,
  tracePackage
} from "./upper-sort-robot-logic.js?v=20260824b";
import { escapeText, upperHeader, upperLearningFocus } from "./upper-picture-shared.js?v=20260825a";

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));
const waitForPaint = () => new Promise((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(resolve)));

function conditionText(rule) {
  if (rule.isDefault) return "それ以外";
  return rule.conditions.map((id) => sortConditionCatalog[id]?.label ?? id).join(" かつ ");
}

function packageBadges(packageItem) {
  const badges = [];
  if (packageItem.attributes.fragile) badges.push("われもの");
  if (packageItem.attributes.chilled) badges.push("冷蔵");
  if (!badges.length) badges.push("ふつう");
  return badges.map((label) => `<span>${escapeText(label)}</span>`).join("");
}

function laneBriefing() {
  const laneCards = Object.entries(sortDestinationCatalog).map(([id, lane]) => `<article class="upper-sort-lane-card is-${id}">
    <strong>${escapeText(lane.label)}レーン</strong>
    <span>${escapeText(lane.equipment)}</span>
    <small>${escapeText(lane.useFor)}</small>
    <b>時間・電力 ×${lane.cost}</b>
  </article>`).join("");
  return `<section class="upper-sort-briefing" aria-labelledby="upper-sort-briefing-title">
    <div class="upper-sort-briefing-copy"><span>配送センターからの依頼</span><h2 id="upper-sort-briefing-title">安全に、でもむだなく仕分けよう</h2><p>紫は冷蔵と衝撃対策を同時に行えます。そのぶん時間と電力が2倍。<strong>両方が必要な荷物だけ</strong>を入れます。</p></div>
    <div class="upper-sort-lane-guide">${laneCards}</div>
    <div class="upper-sort-priority-explanation"><strong>荷物とルールの流れ</strong><p>荷物はベルトを<strong>左から右へ</strong>流れます。検査地点に来ると、ロボットは<strong>優先度1位の一番上のルールから</strong>順に調べ、<strong>最初に一致したルール</strong>のレーンへ送ります。</p></div>
  </section>`;
}

export function initUpperSortRobotLesson({ root, onSuccess }) {
  const state = {
    active: false,
    running: false,
    token: 0,
    program: [],
    draft: { firstCondition: null, useAnd: false, secondCondition: null, destination: null },
    warmupPassed: false,
    verified: false,
    currentIndex: -1,
    currentPackage: null,
    currentDestination: null,
    activeRuleIndex: -1,
    checkDecision: null,
    phase: "idle",
    runMode: "warmup",
    results: [],
    runTotal: sortWarmupPackages.length
  };

  function draftBuilder() {
    return `<div class="upper-sort-draft" data-sort-draft>
      <fieldset><legend>① 条件を選ぶ</legend><div class="upper-sort-choice-row">
        ${["fragile", "chilled", "default"].map((id) => `<button type="button" data-sort-first="${id}" aria-pressed="false">${escapeText(sortConditionCatalog[id].label)}</button>`).join("")}
      </div></fieldset>
      <fieldset><legend>② 条件をつなぐ</legend><div class="upper-sort-choice-row">
        <button type="button" data-sort-mode="single" aria-pressed="true">1つだけ</button>
        <button type="button" data-sort-mode="and" aria-pressed="false">かつ（AND）</button>
      </div><div class="upper-sort-choice-row is-second">
        ${["fragile", "chilled"].map((id) => `<button type="button" data-sort-second="${id}" aria-pressed="false">${escapeText(sortConditionCatalog[id].label)}</button>`).join("")}
      </div></fieldset>
      <fieldset><legend>③ 行き先を選ぶ</legend><div class="upper-sort-choice-row is-destinations">
        ${["special", "fragile", "chilled", "default"].map((id) => `<button type="button" class="is-${id}" data-sort-destination="${id}" aria-pressed="false">${escapeText(sortDestinationCatalog[id].label)}</button>`).join("")}
      </div></fieldset>
      <button type="button" class="upper-sort-add-rule" data-sort-add-rule disabled>このルールを追加する</button>
    </div>`;
  }

  function ruleCard(rule, index) {
    const destination = sortDestinationCatalog[rule.destination];
    let activeClass = "";
    if (index === state.activeRuleIndex) {
      if (state.checkDecision === "matched") activeClass = "is-matched";
      else if (state.checkDecision === "miss") activeClass = "is-missed";
      else activeClass = "is-checking";
    }
    let result = "";
    if (index === state.activeRuleIndex) {
      if (state.checkDecision === "matched") result = "あてはまる";
      else if (state.checkDecision === "miss") result = "ちがう";
      else result = "確認中";
    }
    return `<article class="upper-sort-rule ${activeClass}" data-sort-rule-index="${index}">
      <b class="upper-sort-rule-number">${index + 1}</b>
      <span class="upper-sort-rule-condition"><small>${rule.isDefault ? "" : "もし"}</small><strong>${escapeText(conditionText(rule))}</strong></span>
      <em aria-hidden="true">→</em>
      <span class="upper-sort-rule-action is-${rule.destination}"><strong>${escapeText(destination.action)}</strong></span>
      <span class="upper-sort-rule-controls"><button type="button" data-sort-move="-1" data-sort-index="${index}" ${index === 0 ? "disabled" : ""}>上へ</button><button type="button" data-sort-move="1" data-sort-index="${index}" ${index === state.program.length - 1 ? "disabled" : ""}>下へ</button><button type="button" data-sort-remove="${index}">消す</button></span>
      ${result ? `<span class="upper-sort-rule-result">${escapeText(result)}</span>` : ""}
    </article>`;
  }

  function draftIsValid() {
    const draft = state.draft;
    if (!draft.firstCondition || !draft.destination) return false;
    if (draft.firstCondition === "default" || !draft.useAnd) return true;
    return Boolean(draft.secondCondition && draft.secondCondition !== draft.firstCondition);
  }

  function renderDraft() {
    root.querySelectorAll("[data-sort-first]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sortFirst === state.draft.firstCondition));
    });
    root.querySelectorAll("[data-sort-mode]").forEach((button) => {
      const selectedMode = state.draft.useAnd ? "and" : "single";
      button.setAttribute("aria-pressed", String(button.dataset.sortMode === selectedMode));
      button.disabled = state.draft.firstCondition === "default";
    });
    root.querySelectorAll("[data-sort-second]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sortSecond === state.draft.secondCondition));
      button.disabled = !state.draft.useAnd || state.draft.firstCondition === "default";
    });
    root.querySelectorAll("[data-sort-destination]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.sortDestination === state.draft.destination));
    });
    const addButton = root.querySelector("[data-sort-add-rule]");
    if (addButton) addButton.disabled = state.running || state.program.length >= 4 || !draftIsValid();
  }

  function renderProgram() {
    const list = root.querySelector("[data-sort-program]");
    if (list) {
      list.innerHTML = state.program.length
        ? state.program.map((rule, index) => ruleCard(rule, index)).join("")
        : "<p>条件と行き先を組み合わせて、ルールを作ろう</p>";
    }
    root.querySelector("[data-sort-count]")?.replaceChildren(document.createTextNode(`${state.program.length} / 4`));
    const warmupButton = root.querySelector('[data-sort-run="warmup"]');
    const testButton = root.querySelector('[data-sort-run="test"]');
    const batchButton = root.querySelector('[data-sort-run="batch"]');
    if (warmupButton) warmupButton.disabled = state.running || state.program.length === 0;
    if (testButton) testButton.disabled = state.running || !state.warmupPassed || state.program.length === 0;
    if (batchButton) batchButton.disabled = state.running || !state.verified;
    renderDraft();
  }

  function thinkingText() {
    if (!state.currentPackage) return "荷物を待っています";
    if (state.phase === "queued" || state.phase === "entering") return `${state.currentPackage.label}が入口から流れてきます`;
    if (state.phase === "routing") return `${sortDestinationCatalog[state.currentDestination].label}（${sortDestinationCatalog[state.currentDestination].equipment}）まで移動中`;
    if (state.phase === "dropping") return `${sortDestinationCatalog[state.currentDestination].label}レーンへ投入中`;
    if (state.phase === "arrived") return `${sortDestinationCatalog[state.currentDestination].label}レーンへ仕分け完了`;
    if (state.phase === "rejected") return `${state.currentPackage.label}に当てはまるルールがありません`;
    if (state.activeRuleIndex < 0) return `${state.currentPackage.label}を検査しています`;
    const rule = state.program[state.activeRuleIndex];
    let decision = "確認中";
    if (state.checkDecision === "matched") decision = "あてはまる！";
    if (state.checkDecision === "miss") decision = "ちがうので次へ";
    return `${state.activeRuleIndex + 1}番「${conditionText(rule)}」：${decision}`;
  }

  function parcelMarkup(packageItem) {
    const picture = packageItem.id.startsWith("juice")
      ? '<img src="./assets/picture-lessons/sort-fragile-chilled-parcel.png" alt="">'
      : '<span class="upper-sort-parcel-kind" aria-hidden="true">荷物</span>';
    return `${picture}<strong>${escapeText(packageItem.label)}</strong><small>${packageBadges(packageItem)}</small>`;
  }

  function renderStage() {
    const parcel = root.querySelector("[data-sort-parcel]");
    if (parcel) {
      parcel.innerHTML = state.currentPackage ? parcelMarkup(state.currentPackage) : "";
      const destinationClass = state.currentDestination ? `to-${state.currentDestination}` : "at-gate";
      const speedClass = state.runMode === "batch" ? "is-fast" : "";
      parcel.className = `upper-sort-parcel ${state.currentPackage ? "is-visible" : "is-resetting"} ${destinationClass} is-${state.phase} ${speedClass}`.trim();
    }
    const thinking = root.querySelector("[data-sort-thinking]");
    if (thinking) thinking.textContent = thinkingText();
    root.querySelectorAll("[data-sort-lane]").forEach((lane) => {
      lane.classList.toggle("is-active", lane.dataset.sortLane === state.currentDestination);
      lane.querySelector("b").textContent = String(state.results.filter((result) => result.destination === lane.dataset.sortLane).length);
    });
    const phaseOrder = { queued: 0, entering: 1, checking: 2, rejected: 2, routing: 3, dropping: 3, arrived: 3 };
    const currentStep = phaseOrder[state.phase] ?? -1;
    root.querySelectorAll("[data-sort-flow-step]").forEach((step, index) => {
      step.classList.toggle("is-active", index === currentStep);
      step.classList.toggle("is-complete", index < currentStep);
      if (index === currentStep) step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
    });
    const progress = root.querySelector("[data-sort-progress]");
    if (progress) progress.textContent = state.currentIndex < 0 ? `0 / ${state.runTotal}` : `${state.currentIndex + 1} / ${state.runTotal}`;
  }

  function feedback(title, text, kind = "") {
    const panel = root.querySelector("[data-sort-feedback]");
    if (!panel) return;
    panel.className = `upper-sort-feedback ${kind}`.trim();
    panel.innerHTML = `<strong>${escapeText(title)}</strong><span>${escapeText(text)}</span>`;
  }

  function invalidateVerification() {
    state.verified = false;
    state.results = [];
    state.activeRuleIndex = -1;
    state.checkDecision = null;
    renderProgram();
    renderStage();
  }

  async function run(packages, mode) {
    if (state.running || state.program.length === 0) return;
    const token = ++state.token;
    const timing = mode === "batch"
      ? { arrive: 260, check: 70, route: 130, drop: 130, settle: 30 }
      : { arrive: 1100, check: 480, route: 550, drop: 520, settle: 180 };
    state.running = true;
    state.runMode = mode;
    state.results = [];
    state.runTotal = packages.length;
    state.currentIndex = -1;
    state.currentDestination = null;
    renderProgram();
    const result = runSortProgram(state.program, packages);

    for (let index = 0; index < result.results.length; index += 1) {
      if (token !== state.token) return;
      const item = result.results[index];
      state.currentIndex = index;
      state.currentPackage = item.packageItem;
      state.currentDestination = null;
      state.activeRuleIndex = -1;
      state.checkDecision = null;
      state.phase = "queued";
      renderProgram();
      renderStage();
      await waitForPaint();
      state.phase = "entering";
      renderStage();
      await wait(timing.arrive);

      state.phase = "checking";
      renderStage();
      const trace = tracePackage(item.packageItem, state.program);
      for (const check of trace.checks) {
        if (token !== state.token) return;
        state.activeRuleIndex = check.index;
        state.checkDecision = check.matched ? "matched" : "miss";
        renderProgram();
        renderStage();
        await wait(timing.check);
      }

      state.currentDestination = trace.destination;
      state.phase = trace.destination ? "routing" : "rejected";
      renderStage();
      await wait(timing.route);
      if (trace.destination) {
        state.phase = "dropping";
        renderStage();
        await wait(timing.drop);
      }
      state.results.push(item);
      state.phase = trace.destination ? "arrived" : "rejected";
      renderStage();
      await wait(timing.settle);

      state.currentPackage = null;
      state.currentDestination = null;
      state.activeRuleIndex = -1;
      state.checkDecision = null;
      state.phase = "resetting";
      renderProgram();
      renderStage();
      await wait(40);
    }

    if (token !== state.token) return;
    state.running = false;
    if (mode === "warmup" && result.complete) {
      state.warmupPassed = true;
      feedback("基本の3種類は仕分け成功！", "新しい荷物は「われもの」で、しかも「冷蔵」です。2つの設備が必要なら、どのレーンを使う？", "is-question");
    } else if (mode !== "warmup" && result.complete && isSortRuleCorrect(state.program)) {
      state.verified = true;
      if (mode === "test") {
        feedback("6種類すべて成功！", "複合条件とルールの順番を正しく直せました。次は20個に再利用しよう。", "is-success");
      } else {
        feedback("20個の自動仕分けに成功！", "例外までテストしたルールを、大きな仕事に再利用できました。", "is-success");
        onSuccess({ repeating: true, title: "デバッグ成功！" });
      }
    } else {
      state.verified = false;
      const firstWrong = result.results.find((item) => !item.correct);
      if (firstWrong) {
        const matched = firstWrong.matchedRuleIndex >= 0
          ? `${firstWrong.matchedRuleIndex + 1}番のルールに先に一致しました。`
          : "当てはまるルールがありません。";
        let explanation = mode === "warmup"
          ? "レーンの役割と荷物のマークを見て、基本の3種類を自分で決めよう。"
          : "複合条件と上からの順番を見直そう。";
        if (firstWrong.destination === "special" && firstWrong.packageItem.expectedDestination !== "special") {
          explanation = "特別レーンは時間と電力が2倍です。冷蔵とわれものの両方が必要な荷物だけに使おう。";
        } else if (firstWrong.packageItem.expectedDestination === "special") {
          explanation = firstWrong.matchedRuleIndex >= 0
            ? "冷蔵と衝撃対策の両方が必要です。複合条件のルールを「われものだけ」「冷蔵だけ」より上へ動かそう。"
            : "冷蔵と衝撃対策の両方が必要です。2つを「かつ」でつないだ特別レーンのルールを作ろう。";
        }
        feedback(`${firstWrong.packageItem.label}の仕分けが違います`, `${matched} ${explanation}`, "is-question");
      }
    }
    renderProgram();
  }

  function render(lesson) {
    state.active = true;
    state.running = false;
    state.token += 1;
    state.program = [];
    state.draft = { firstCondition: null, useAnd: false, secondCondition: null, destination: null };
    state.warmupPassed = false;
    state.verified = false;
    state.currentIndex = -1;
    state.currentPackage = null;
    state.currentDestination = null;
    state.activeRuleIndex = -1;
    state.checkDecision = null;
    state.phase = "idle";
    state.runMode = "warmup";
    state.results = [];
    state.runTotal = sortWarmupPackages.length;
    root.className = "picture-experience upper-sort-screen";
    root.innerHTML = `${upperHeader(lesson, "冷蔵で、しかもわれものは紫の特別レーンへ")}
      ${upperLearningFocus("sort-robot")}
      <main class="upper-sort-main">
        ${laneBriefing()}
        <section class="upper-sort-builder"><div class="upper-step-heading"><span>1</span><div><h2>複合条件を作る</h2><p>条件と行き先を自分で組み合わせます</p></div></div>${draftBuilder()}</section>
        <section class="upper-sort-stage-panel"><div class="upper-step-heading"><span>2</span><div><h2>判定の流れを見る</h2><p>光っているルールを上から確認</p></div></div>
          <div class="upper-sort-stage">
            <div class="upper-sort-progress" data-sort-progress>0 / 3</div>
            <div class="upper-sort-thinking" data-sort-thinking>荷物を待っています</div>
            <ol class="upper-sort-flow" aria-label="荷物とルールの流れ"><li data-sort-flow-step>左から入る</li><li data-sort-flow-step>ベルトを右へ</li><li data-sort-flow-step>優先度1位から判定</li><li data-sort-flow-step>最初に一致したレーン</li></ol>
            <div class="upper-sort-parcel is-resetting at-gate" data-sort-parcel></div>
            <img class="upper-sort-robot" src="./assets/robot-mascot.png" alt="荷物をしわけるロボット">
            <div class="upper-sort-lane-labels">${Object.entries(sortDestinationCatalog).map(([id, lane]) => `<div class="upper-sort-lane-label is-${id}" data-sort-lane="${id}"><strong>${escapeText(lane.label)}<small>${escapeText(lane.equipment)}</small></strong><b>0</b></div>`).join("")}</div>
          </div>
        </section>
        <section class="upper-sort-program-panel"><div class="upper-sort-program-heading"><div><h2>ロボットが使うルール</h2><p>優先度1位の一番上から確認し、最初に一致した1つだけを使う</p><small>先に確かめたいルールを「上へ」で動かします</small></div><strong data-sort-count>0 / 4</strong></div>
          <div class="upper-sort-program" data-sort-program></div>
          <div class="upper-sort-actions"><button type="button" data-sort-reset>ルールを全部消す</button><button class="is-warmup" type="button" data-sort-run="warmup">① まず3個で試す</button><button class="is-test" type="button" data-sort-run="test" disabled>② 例外も入れて6個</button><button class="is-batch" type="button" data-sort-run="batch" disabled>③ 20個をしわける<small>直したルールを再利用</small></button></div>
          <div class="upper-sort-feedback" data-sort-feedback aria-live="polite"><strong>ルールを0から設計しよう</strong><span>レーンの役割を読み、まず「われものだけ」「冷蔵だけ」「どちらでもない」の3種類を考えます。</span></div>
        </section>
      </main>`;
    renderProgram();
    renderStage();
  }

  root.addEventListener("click", (event) => {
    if (!state.active || state.running) return;
    const first = event.target.closest("[data-sort-first]");
    if (first) {
      state.draft.firstCondition = first.dataset.sortFirst;
      if (state.draft.firstCondition === "default") {
        state.draft.useAnd = false;
        state.draft.secondCondition = null;
      }
      renderDraft();
      return;
    }
    const mode = event.target.closest("[data-sort-mode]");
    if (mode) {
      state.draft.useAnd = mode.dataset.sortMode === "and";
      if (!state.draft.useAnd) state.draft.secondCondition = null;
      renderDraft();
      return;
    }
    const second = event.target.closest("[data-sort-second]");
    if (second) {
      state.draft.secondCondition = second.dataset.sortSecond;
      renderDraft();
      return;
    }
    const destination = event.target.closest("[data-sort-destination]");
    if (destination) {
      state.draft.destination = destination.dataset.sortDestination;
      renderDraft();
      return;
    }
    if (event.target.closest("[data-sort-add-rule]") && draftIsValid() && state.program.length < 4) {
      state.program.push(createSortRule(state.draft));
      state.draft = { firstCondition: null, useAnd: false, secondCondition: null, destination: null };
      invalidateVerification();
      feedback("ルールを追加しました", "追加したルールを、必要な位置まで「上へ」で動かそう。", "is-question");
      return;
    }
    const remove = event.target.closest("[data-sort-remove]");
    if (remove) {
      state.program.splice(Number(remove.dataset.sortRemove), 1);
      invalidateVerification();
      return;
    }
    const move = event.target.closest("[data-sort-move]");
    if (move) {
      const index = Number(move.dataset.sortIndex);
      const nextIndex = index + Number(move.dataset.sortMove);
      if (nextIndex >= 0 && nextIndex < state.program.length) {
        [state.program[index], state.program[nextIndex]] = [state.program[nextIndex], state.program[index]];
        invalidateVerification();
      }
      return;
    }
    if (event.target.closest("[data-sort-reset]")) {
      state.program = [];
      state.draft = { firstCondition: null, useAnd: false, secondCondition: null, destination: null };
      state.warmupPassed = false;
      invalidateVerification();
      feedback("ルールを全部消しました", "レーンの役割を読み、まず基本の3種類を自分で作ろう。");
      return;
    }
    const runButton = event.target.closest("[data-sort-run]");
    if (runButton?.dataset.sortRun === "warmup") run(sortWarmupPackages, "warmup");
    if (runButton?.dataset.sortRun === "test") run(sortTestPackages, "test");
    if (runButton?.dataset.sortRun === "batch") run(sortBatchPackages, "batch");
  });

  return {
    render,
    deactivate: () => {
      state.active = false;
      state.token += 1;
      state.running = false;
    }
  };
}
