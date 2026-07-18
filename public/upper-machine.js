import {
  createCompositeRuleBatch,
  formatCalculationDuration,
  summarizeCompositeRuleBatch
} from "./calculation.js";

const MAX_RESULT_COUNT = 100;
const INITIAL_RESULT_COUNT = 3;
const ROWS_PER_TICK = 5;
const TICK_MILLISECONDS = 35;

const TOKEN_META = {
  a: { symbol: "A", label: "A" },
  b: { symbol: "B", label: "B" },
  c: { symbol: "C", label: "C" },
  multiply: { symbol: "×", label: "かける" },
  add: { symbol: "＋", label: "たす" },
  subtract: { symbol: "−", label: "ひく" }
};

const SLOT_ORDER = ["first", "operator1", "second", "operator2", "third"];

function collectElements() {
  const root = document.querySelector("#upperMachinePage");
  const elements = Object.fromEntries([
    "upperMachineBackButton",
    "upperRuleCard",
    "upperBuildButton",
    "upperRuleName",
    "upperRuleStatus",
    "upperRepeatCount",
    "upperRunLead",
    "upperRunFormula",
    "upperRunButton",
    "upperRunHint",
    "upperTime",
    "upperCorrect",
    "upperMistakes",
    "upperListProgress",
    "upperResultsList"
  ].map((id) => [id, root?.querySelector(`#${id}`)]));

  elements.root = root;
  elements.ruleTokens = [...(root?.querySelectorAll("[data-upper-rule-token]") ?? [])];
  elements.ruleSlots = [...(root?.querySelectorAll("[data-upper-rule-slot]") ?? [])];
  return elements;
}

function isOperatorSlot(slotName) {
  return slotName === "operator1" || slotName === "operator2";
}

function isCompatible(slotName, tokenName) {
  return isOperatorSlot(slotName)
    ? tokenName === "add" || tokenName === "subtract" || tokenName === "multiply"
    : tokenName === "a" || tokenName === "b" || tokenName === "c";
}

function symbolFor(tokenName) {
  return TOKEN_META[tokenName]?.symbol ?? "?";
}

function formulaText(rule) {
  return `${symbolFor(rule.firstSymbol)} ${symbolFor(rule.firstOperator)} ${symbolFor(rule.secondSymbol)} ${symbolFor(rule.secondOperator)} ${symbolFor(rule.thirdSymbol)} ＝ D`;
}

function rulesMatch(first, second) {
  return Boolean(first && second) && [
    "firstSymbol",
    "firstOperator",
    "secondSymbol",
    "secondOperator",
    "thirdSymbol"
  ].every((key) => first[key] === second[key]);
}

function formatUpperDuration(milliseconds) {
  return formatCalculationDuration(milliseconds)
    .replace("びょうみまん", "秒未満")
    .replace("びょう", "秒");
}

function createResultRow(row) {
  const item = document.createElement("li");
  item.className = "machine-result-row upper-result-row";

  const number = document.createElement("span");
  number.className = "machine-result-number";
  number.textContent = String(row.index);

  const formula = document.createElement("span");
  formula.className = "machine-result-formula upper-result-formula";
  formula.textContent = `${row.values[row.firstSymbol]} ${symbolFor(row.firstOperator)} ${row.values[row.secondSymbol]} ${symbolFor(row.secondOperator)} ${row.values[row.thirdSymbol]} ＝ ${row.result}`;

  item.append(number, formula);
  return item;
}

export function initUpperCalculationMachine({ onBack } = {}) {
  const elements = collectElements();
  if (!elements.upperBuildButton || !elements.upperRunButton) return;

  const state = {
    draftRule: { first: null, operator1: null, second: null, operator2: null, third: null },
    builtRule: null,
    repeatCount: INITIAL_RESULT_COUNT,
    rows: [],
    summary: { total: INITIAL_RESULT_COUNT, correct: 0, mistakes: 0 },
    visibleCount: 0,
    timer: null,
    pointerDrag: null,
    nativeDragToken: null,
    suppressClick: false
  };

  function stopListAnimation() {
    if (state.timer === null) return;
    window.clearInterval(state.timer);
    state.timer = null;
  }

  function currentDraftRule() {
    if (SLOT_ORDER.some((slotName) => !state.draftRule[slotName])) return null;
    return {
      firstSymbol: state.draftRule.first,
      firstOperator: state.draftRule.operator1,
      secondSymbol: state.draftRule.second,
      secondOperator: state.draftRule.operator2,
      thirdSymbol: state.draftRule.third
    };
  }

  function resetResultList(message = `ルールを作り、${state.repeatCount}回実行してみよう`) {
    elements.upperResultsList.innerHTML = "";
    const empty = document.createElement("li");
    empty.className = "machine-list-empty";
    empty.textContent = message;
    elements.upperResultsList.append(empty);
    elements.upperListProgress.textContent = `0 / ${state.repeatCount}`;
  }

  function resetCalculationResult() {
    stopListAnimation();
    state.rows = [];
    state.visibleCount = 0;
    state.summary = { total: state.repeatCount, correct: 0, mistakes: 0 };
    elements.upperTime.textContent = "まだ計算していません";
    elements.upperCorrect.textContent = `0 / ${state.repeatCount}`;
    elements.upperMistakes.textContent = "0回";
    resetResultList();
  }

  function renderRuleSlots() {
    elements.ruleSlots.forEach((slot) => {
      const slotName = slot.dataset.upperRuleSlot;
      const tokenName = state.draftRule[slotName];
      slot.classList.toggle("filled", Boolean(tokenName));
      if (tokenName) {
        slot.dataset.token = tokenName;
        slot.textContent = symbolFor(tokenName);
        slot.setAttribute("aria-label", `${TOKEN_META[tokenName].label}。押すとカードを戻します`);
        return;
      }

      delete slot.dataset.token;
      const placeholder = document.createElement("span");
      placeholder.className = "rule-slot-placeholder";
      placeholder.textContent = "ここ";
      slot.replaceChildren(placeholder);
      slot.setAttribute("aria-label", isOperatorSlot(slotName) ? "計算カードを入れる" : "数カードを入れる");
    });
  }

  function renderRuleState() {
    const draftRule = currentDraftRule();
    const isBuilt = rulesMatch(draftRule, state.builtRule);
    elements.upperRuleCard.classList.toggle("rule-built", isBuilt);
    elements.upperBuildButton.disabled = !draftRule;
    elements.upperBuildButton.textContent = isBuilt
      ? "計算ルールができました"
      : (draftRule ? "この計算ルールを作る" : "5つ入れたら作れます");
    elements.upperBuildButton.setAttribute("aria-pressed", String(isBuilt));

    if (isBuilt) {
      const text = formulaText(state.builtRule);
      elements.upperRuleName.textContent = `電卓 ＝ ${text} のルール`;
      elements.upperRuleStatus.textContent = `${text} を何度でも使えます`;
      elements.upperRunFormula.textContent = text;
      elements.upperRunLead.textContent = `同じルールへ数字を入れ替えて${state.repeatCount}回実行します`;
    } else if (draftRule) {
      elements.upperRuleName.textContent = `作っているルール：${formulaText(draftRule)}`;
      elements.upperRuleStatus.textContent = "ボタンを押してルールを決めよう";
      elements.upperRunFormula.textContent = formulaText(draftRule);
      elements.upperRunLead.textContent = "作ったルールを何度でも再利用できます";
    } else {
      elements.upperRuleName.textContent = "電卓 ＝ 自分で作る計算ルール";
      elements.upperRuleStatus.textContent = "A・B・C と ×・＋・−のカードを枠に入れよう";
      elements.upperRunFormula.textContent = "A × B ＋ C ＝ D";
      elements.upperRunLead.textContent = "作ったルールを何度でも再利用できます";
    }

    elements.upperRunButton.disabled = !isBuilt;
    elements.upperRunButton.textContent = `${state.repeatCount}回計算する`;
    elements.upperRunHint.textContent = isBuilt
      ? `ランダムな数字を入れて${state.repeatCount}回実行します`
      : "はじめにルールを作ろう";
    renderRuleSlots();
  }

  function updateDraftRule(slotName, tokenName) {
    if (!isCompatible(slotName, tokenName)) return false;
    state.draftRule[slotName] = tokenName;
    state.builtRule = null;
    resetCalculationResult();
    renderRuleState();
    return true;
  }

  function clearDraftSlot(slotName) {
    if (!state.draftRule[slotName]) return;
    state.draftRule[slotName] = null;
    state.builtRule = null;
    resetCalculationResult();
    renderRuleState();
  }

  function autoPlaceToken(tokenName) {
    const targetSlot = SLOT_ORDER.find((slotName) => !state.draftRule[slotName] && isCompatible(slotName, tokenName));
    if (targetSlot) updateDraftRule(targetSlot, tokenName);
  }

  function clearDropStates() {
    elements.ruleSlots.forEach((slot) => slot.classList.remove("drop-ready", "drop-blocked"));
  }

  function dropTargetAt(x, y, tokenName) {
    const slot = document.elementFromPoint(x, y)?.closest?.("[data-upper-rule-slot]");
    if (!slot || !elements.root?.contains(slot)) return null;
    return isCompatible(slot.dataset.upperRuleSlot, tokenName) ? slot : null;
  }

  function startPointerDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const source = event.currentTarget;
    if (event.pointerType !== "mouse") source.setPointerCapture(event.pointerId);
    source.classList.add("drag-source");
    state.pointerDrag = {
      pointerId: event.pointerId,
      tokenName: source.dataset.upperRuleToken,
      source,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      ghost: null
    };
  }

  function movePointerDrag(event) {
    const drag = state.pointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.moved && distance > 7) {
      drag.moved = true;
      drag.ghost = drag.source.cloneNode(true);
      drag.ghost.removeAttribute("draggable");
      drag.ghost.classList.add("rule-drag-ghost");
      document.body.append(drag.ghost);
      document.body.classList.add("rule-dragging");
    }
    if (!drag.moved) return;
    event.preventDefault();
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    clearDropStates();
    const hovered = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-upper-rule-slot]");
    if (hovered && elements.root?.contains(hovered)) {
      hovered.classList.add(isCompatible(hovered.dataset.upperRuleSlot, drag.tokenName) ? "drop-ready" : "drop-blocked");
    }
  }

  function finishPointerDrag(event) {
    const drag = state.pointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const slot = dropTargetAt(event.clientX, event.clientY, drag.tokenName);
      if (slot) updateDraftRule(slot.dataset.upperRuleSlot, drag.tokenName);
    } else {
      autoPlaceToken(drag.tokenName);
    }
    drag.source.classList.remove("drag-source");
    drag.ghost?.remove();
    document.body.classList.remove("rule-dragging");
    clearDropStates();
    state.pointerDrag = null;
    state.suppressClick = true;
    window.setTimeout(() => { state.suppressClick = false; }, 0);
  }

  function cancelPointerDrag(event) {
    if (!state.pointerDrag || state.pointerDrag.pointerId !== event.pointerId) return;
    state.pointerDrag.source.classList.remove("drag-source");
    state.pointerDrag.ghost?.remove();
    document.body.classList.remove("rule-dragging");
    clearDropStates();
    state.pointerDrag = null;
  }

  function renderSummary() {
    elements.upperCorrect.textContent = `${state.summary.correct} / ${state.summary.total}`;
    elements.upperMistakes.textContent = `${state.summary.mistakes}回`;
  }

  function appendVisibleRows() {
    const nextVisibleCount = Math.min(state.visibleCount + ROWS_PER_TICK, state.rows.length);
    for (let index = state.visibleCount; index < nextVisibleCount; index += 1) {
      elements.upperResultsList.append(createResultRow(state.rows[index]));
    }
    state.visibleCount = nextVisibleCount;
    elements.upperListProgress.textContent = `${state.visibleCount} / ${state.repeatCount}`;
    elements.upperResultsList.scrollTop = elements.upperResultsList.scrollHeight;

    if (state.visibleCount === state.rows.length) {
      stopListAnimation();
      elements.upperRunButton.disabled = false;
      elements.upperRunButton.textContent = `もう一度${state.repeatCount}回計算する`;
      elements.upperRunHint.textContent = "数字を変えても、同じ仕組みを再利用できます";
    }
  }

  function runCalculationBatch() {
    if (!state.builtRule) return;
    stopListAnimation();
    elements.upperRunButton.disabled = true;
    elements.upperRunButton.textContent = "計算しています";
    elements.upperRunHint.textContent = "結果が次々に表示されます";

    const startedAt = performance.now();
    state.rows = createCompositeRuleBatch(state.builtRule, state.repeatCount);
    state.summary = summarizeCompositeRuleBatch(state.rows);
    elements.upperTime.textContent = formatUpperDuration(performance.now() - startedAt);
    renderSummary();
    state.visibleCount = 0;
    elements.upperResultsList.innerHTML = "";
    elements.upperListProgress.textContent = `0 / ${state.repeatCount}`;
    appendVisibleRows();
    state.timer = window.setInterval(appendVisibleRows, TICK_MILLISECONDS);
  }

  elements.ruleTokens.forEach((token) => {
    token.addEventListener("pointerdown", startPointerDrag);
    token.addEventListener("pointermove", movePointerDrag);
    token.addEventListener("pointerup", finishPointerDrag);
    token.addEventListener("pointercancel", cancelPointerDrag);
    token.addEventListener("click", (event) => {
      if (state.suppressClick) {
        event.preventDefault();
        return;
      }
      autoPlaceToken(token.dataset.upperRuleToken);
    });
    token.addEventListener("dragstart", (event) => {
      state.nativeDragToken = token.dataset.upperRuleToken;
      event.dataTransfer?.setData("text/plain", state.nativeDragToken);
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "copy";
      token.classList.add("drag-source");
    });
    token.addEventListener("dragend", () => {
      state.nativeDragToken = null;
      token.classList.remove("drag-source");
      clearDropStates();
    });
  });

  elements.ruleSlots.forEach((slot) => {
    slot.addEventListener("click", () => clearDraftSlot(slot.dataset.upperRuleSlot));
    slot.addEventListener("dragover", (event) => {
      if (!state.nativeDragToken) return;
      clearDropStates();
      const compatible = isCompatible(slot.dataset.upperRuleSlot, state.nativeDragToken);
      slot.classList.add(compatible ? "drop-ready" : "drop-blocked");
      if (compatible) event.preventDefault();
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drop-ready", "drop-blocked"));
    slot.addEventListener("drop", (event) => {
      const tokenName = state.nativeDragToken || event.dataTransfer?.getData("text/plain");
      if (!tokenName || !isCompatible(slot.dataset.upperRuleSlot, tokenName)) return;
      event.preventDefault();
      updateDraftRule(slot.dataset.upperRuleSlot, tokenName);
      clearDropStates();
    });
  });

  window.addEventListener("pointerup", finishPointerDrag);
  window.addEventListener("pointercancel", cancelPointerDrag);
  elements.upperBuildButton.addEventListener("click", () => {
    const draftRule = currentDraftRule();
    if (!draftRule) return;
    state.builtRule = { ...draftRule };
    resetCalculationResult();
    renderRuleState();
    elements.upperRunButton.focus();
  });
  elements.upperRunButton.addEventListener("click", runCalculationBatch);
  elements.upperRepeatCount.addEventListener("change", () => {
    state.repeatCount = Math.min(MAX_RESULT_COUNT, Math.max(1, Number(elements.upperRepeatCount.value) || 1));
    resetCalculationResult();
    renderRuleState();
  });
  elements.upperMachineBackButton.addEventListener("click", () => {
    if (typeof onBack === "function") onBack();
  });

  for (let count = 1; count <= MAX_RESULT_COUNT; count += 1) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = String(count);
    option.selected = count === INITIAL_RESULT_COUNT;
    elements.upperRepeatCount.append(option);
  }
  resetCalculationResult();
  renderRuleState();
}
