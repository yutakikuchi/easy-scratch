import {
  createRuleBatch,
  formatCalculationDuration,
  summarizeRuleBatch
} from "./calculation.js";

const MAX_RESULT_COUNT = 100;
const INITIAL_RESULT_COUNT = 3;
const ROWS_PER_TICK = 4;
const TICK_MILLISECONDS = 45;

const TOKEN_META = {
  circle: { symbol: "○", label: "まる", className: "machine-circle" },
  triangle: { symbol: "▲", label: "さんかく", className: "machine-triangle" },
  add: { symbol: "＋", label: "たす", className: "machine-operator" },
  subtract: { symbol: "−", label: "ひく", className: "machine-operator" }
};

function collectElements() {
  const root = document.querySelector("#lowerMachinePage");
  const elements = Object.fromEntries([
    "lowerMachineBackButton",
    "machineRuleCard",
    "machineRuleBuilder",
    "machineBuildButton",
    "machineRuleName",
    "machineRuleStatus",
    "machineRunTitle",
    "machineRunLead",
    "machineRunFormulaLeft",
    "machineRunFormulaOperator",
    "machineRunFormulaRight",
    "machineRunButton",
    "machineRunHint",
    "machineRepeatCount",
    "machineSummaryTitle",
    "machineTime",
    "machineCorrect",
    "machineMistakes",
    "machineListProgress",
    "machineResultsList"
  ].map((id) => [id, root?.querySelector(`#${id}`)]));

  elements.root = root;
  elements.ruleTokens = [...(root?.querySelectorAll("[data-rule-token]") ?? [])];
  elements.ruleSlots = [...(root?.querySelectorAll("[data-rule-slot]") ?? [])];
  return elements;
}

function isCompatible(slotName, tokenName) {
  if (slotName === "operator") return tokenName === "add" || tokenName === "subtract";
  return tokenName === "circle" || tokenName === "triangle";
}

function symbolFor(tokenName) {
  return TOKEN_META[tokenName]?.symbol ?? "?";
}

function formulaText(rule) {
  return `${symbolFor(rule.leftSymbol)} ${symbolFor(rule.operator)} ${symbolFor(rule.rightSymbol)} ＝ □`;
}

function rulesMatch(a, b) {
  return Boolean(a && b)
    && a.leftSymbol === b.leftSymbol
    && a.operator === b.operator
    && a.rightSymbol === b.rightSymbol;
}

function createResultRow(row) {
  const item = document.createElement("li");
  item.className = "machine-result-row";

  const number = document.createElement("span");
  number.className = "machine-result-number";
  number.textContent = String(row.index);

  const formula = document.createElement("span");
  formula.className = "machine-result-formula";
  formula.textContent = `${row.leftValue} ${symbolFor(row.operator)} ${row.rightValue} ＝ ${row.square}`;

  item.append(number, formula);
  return item;
}

export function initLowerCalculationMachine({ onBack } = {}) {
  const elements = collectElements();
  if (!elements.machineBuildButton || !elements.machineRunButton) return;

  const state = {
    draftRule: { left: null, operator: null, right: null },
    builtRule: null,
    rows: [],
    repeatCount: INITIAL_RESULT_COUNT,
    summary: { total: INITIAL_RESULT_COUNT, correct: 0, mistakes: 0 },
    visibleCount: 0,
    timer: null,
    pointerDrag: null,
    nativeDragToken: null,
    suppressClick: false
  };

  function stopListAnimation() {
    if (state.timer !== null) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function currentDraftRule() {
    if (!state.draftRule.left || !state.draftRule.operator || !state.draftRule.right) return null;
    return {
      leftSymbol: state.draftRule.left,
      operator: state.draftRule.operator,
      rightSymbol: state.draftRule.right
    };
  }

  function setFormulaSymbol(element, tokenName) {
    element.textContent = tokenName ? symbolFor(tokenName) : "?";
    element.classList.remove("machine-circle", "machine-triangle");
    if (tokenName) element.classList.add(TOKEN_META[tokenName].className);
  }

  function resetResultList(message = `ルールを つくって、${state.repeatCount}かい けいさんしてみよう`) {
    elements.machineResultsList.innerHTML = "";
    const empty = document.createElement("li");
    empty.className = "machine-list-empty";
    empty.textContent = message;
    elements.machineResultsList.append(empty);
    elements.machineListProgress.textContent = `0 / ${state.repeatCount}`;
  }

  function resetCalculationResult() {
    stopListAnimation();
    state.rows = [];
    state.visibleCount = 0;
    state.summary = { total: state.repeatCount, correct: 0, mistakes: 0 };
    elements.machineTime.textContent = "まだ けいさんしていないよ";
    elements.machineCorrect.textContent = `0 / ${state.repeatCount}`;
    elements.machineMistakes.textContent = "0かい";
    resetResultList();
  }

  function renderRuleSlots() {
    elements.ruleSlots.forEach((slot) => {
      const slotName = slot.dataset.ruleSlot;
      const tokenName = state.draftRule[slotName];
      slot.classList.toggle("filled", Boolean(tokenName));
      if (tokenName) {
        slot.dataset.token = tokenName;
        slot.textContent = symbolFor(tokenName);
        slot.setAttribute("aria-label", `${TOKEN_META[tokenName].label}。おすと カードを もどす`);
      } else {
        delete slot.dataset.token;
        const placeholder = document.createElement("span");
        placeholder.className = "rule-slot-placeholder";
        placeholder.textContent = "ここ";
        slot.replaceChildren(placeholder);
        slot.setAttribute("aria-label", slotName === "operator"
          ? "けいさんの カードを いれる"
          : "すうじの カードを いれる");
      }
    });
  }

  function renderRunRule() {
    const rule = state.builtRule;
    setFormulaSymbol(elements.machineRunFormulaLeft, rule?.leftSymbol);
    setFormulaSymbol(elements.machineRunFormulaRight, rule?.rightSymbol);
    elements.machineRunFormulaOperator.textContent = rule ? symbolFor(rule.operator) : "?";

    if (!rule) {
      elements.machineRunLead.textContent = `つくった ルールを ${state.repeatCount}かい つかう`;
      return;
    }

    const left = symbolFor(rule.leftSymbol);
    const right = symbolFor(rule.rightSymbol);
    elements.machineRunLead.textContent = rule.leftSymbol === rule.rightSymbol
      ? `${left} に おなじ すうじを いれて ${state.repeatCount}かい つかう`
      : `${left} と ${right} の すうじを ${state.repeatCount}くみ つくる`;
  }

  function renderRuleState() {
    const draftRule = currentDraftRule();
    const isBuilt = rulesMatch(draftRule, state.builtRule);
    elements.machineRuleCard.classList.toggle("rule-built", isBuilt);
    elements.machineBuildButton.disabled = !draftRule;
    elements.machineBuildButton.textContent = isBuilt
      ? "ルールが できた！"
      : (draftRule ? "この ルールを つくる" : "3つ いれたら つくれるよ");
    elements.machineBuildButton.setAttribute("aria-pressed", String(isBuilt));

    if (isBuilt) {
      const text = formulaText(state.builtRule);
      elements.machineRuleName.textContent = `けいさんマシン ＝ ${text} の ルール`;
      elements.machineRuleStatus.textContent = `${text} が できたよ`;
    } else if (draftRule) {
      elements.machineRuleName.textContent = `つくっている ルール：${formulaText(draftRule)}`;
      elements.machineRuleStatus.textContent = "ボタンを おして、ルールを きめよう";
    } else {
      elements.machineRuleName.textContent = "けいさんマシン ＝ じぶんで つくる ルール";
      elements.machineRuleStatus.textContent = "○・▲・＋・− の カードを わくに いれよう";
    }

    elements.machineRunButton.disabled = !isBuilt;
    elements.machineRunTitle.textContent = `おなじ ルールを ${state.repeatCount}かい つかう`;
    elements.machineSummaryTitle.textContent = `${state.repeatCount}かい けいさん`;
    elements.machineRunButton.textContent = `${state.repeatCount}かい けいさんする`;
    elements.machineRunHint.textContent = isBuilt
      ? `おなじ ルールに すうじを ${state.repeatCount}くみ いれるよ`
      : "はじめに ルールを つくろう";
    renderRuleSlots();
    renderRunRule();
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
    const slotOrder = tokenName === "add" || tokenName === "subtract" ? ["operator"] : ["left", "right"];
    const targetSlot = slotOrder.find((slotName) => !state.draftRule[slotName]);
    if (targetSlot) updateDraftRule(targetSlot, tokenName);
  }

  function clearDropStates() {
    elements.ruleSlots.forEach((slot) => slot.classList.remove("drop-ready", "drop-blocked"));
  }

  function dropTargetAt(x, y, tokenName) {
    const slot = document.elementFromPoint(x, y)?.closest?.("[data-rule-slot]");
    if (!slot || !elements.root?.contains(slot)) return null;
    return isCompatible(slot.dataset.ruleSlot, tokenName) ? slot : null;
  }

  function startPointerDrag(event) {
    if (event.button !== 0) return;
    event.preventDefault();
    const source = event.currentTarget;
    if (event.pointerType !== "mouse") source.setPointerCapture(event.pointerId);
    source.classList.add("drag-source");
    state.pointerDrag = {
      pointerId: event.pointerId,
      tokenName: source.dataset.ruleToken,
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
    const hoveredSlot = document.elementFromPoint(event.clientX, event.clientY)?.closest?.("[data-rule-slot]");
    if (hoveredSlot && elements.root?.contains(hoveredSlot)) {
      hoveredSlot.classList.add(isCompatible(hoveredSlot.dataset.ruleSlot, drag.tokenName)
        ? "drop-ready"
        : "drop-blocked");
    }
  }

  function finishPointerDrag(event) {
    const drag = state.pointerDrag;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      const slot = dropTargetAt(event.clientX, event.clientY, drag.tokenName);
      if (slot) updateDraftRule(slot.dataset.ruleSlot, drag.tokenName);
    } else {
      autoPlaceToken(drag.tokenName);
    }
    drag.source.classList.remove("drag-source");
    drag.ghost?.remove();
    document.body.classList.remove("rule-dragging");
    clearDropStates();
    state.pointerDrag = null;
    state.suppressClick = true;
    window.setTimeout(() => {
      state.suppressClick = false;
    }, 0);
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
    elements.machineCorrect.textContent = `${state.summary.correct} / ${state.summary.total}`;
    elements.machineMistakes.textContent = `${state.summary.mistakes}かい`;
  }

  function appendVisibleRows() {
    const nextVisibleCount = Math.min(state.visibleCount + ROWS_PER_TICK, state.rows.length);
    for (let index = state.visibleCount; index < nextVisibleCount; index += 1) {
      elements.machineResultsList.append(createResultRow(state.rows[index]));
    }
    state.visibleCount = nextVisibleCount;
    elements.machineListProgress.textContent = `${state.visibleCount} / ${state.repeatCount}`;
    elements.machineResultsList.scrollTop = elements.machineResultsList.scrollHeight;

    if (state.visibleCount === state.rows.length) {
      stopListAnimation();
      elements.machineRunButton.disabled = false;
      elements.machineRunButton.textContent = `もういちど ${state.repeatCount}かい けいさんする`;
      elements.machineRunHint.textContent = "すうじを かえても、おなじ ルールを つかえるよ";
    }
  }

  function prepareCalculationBatch() {
    const startedAt = performance.now();
    state.rows = createRuleBatch(state.builtRule, state.repeatCount);
    state.summary = summarizeRuleBatch(state.rows);
    const elapsedMilliseconds = performance.now() - startedAt;
    renderSummary();
    elements.machineTime.textContent = formatCalculationDuration(elapsedMilliseconds);
  }

  function runCalculationBatch() {
    if (!state.builtRule) return;
    stopListAnimation();
    elements.machineRunButton.disabled = true;
    elements.machineRunButton.textContent = "けいさんしているよ";
    elements.machineRunHint.textContent = "こたえが つぎつぎに でてくるよ";

    prepareCalculationBatch();
    state.visibleCount = 0;
    elements.machineResultsList.innerHTML = "";
    elements.machineListProgress.textContent = `0 / ${state.repeatCount}`;
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
      autoPlaceToken(token.dataset.ruleToken);
    });
    token.addEventListener("dragstart", (event) => {
      state.nativeDragToken = token.dataset.ruleToken;
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
    slot.addEventListener("click", () => clearDraftSlot(slot.dataset.ruleSlot));
    slot.addEventListener("dragover", (event) => {
      if (!state.nativeDragToken) return;
      clearDropStates();
      const compatible = isCompatible(slot.dataset.ruleSlot, state.nativeDragToken);
      slot.classList.add(compatible ? "drop-ready" : "drop-blocked");
      if (compatible) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      }
    });
    slot.addEventListener("dragleave", () => slot.classList.remove("drop-ready", "drop-blocked"));
    slot.addEventListener("drop", (event) => {
      const tokenName = state.nativeDragToken || event.dataTransfer?.getData("text/plain");
      if (!tokenName || !isCompatible(slot.dataset.ruleSlot, tokenName)) return;
      event.preventDefault();
      updateDraftRule(slot.dataset.ruleSlot, tokenName);
      clearDropStates();
    });
  });

  window.addEventListener("pointerup", finishPointerDrag);
  window.addEventListener("pointercancel", cancelPointerDrag);

  elements.machineBuildButton.addEventListener("click", () => {
    const draftRule = currentDraftRule();
    if (!draftRule) return;
    state.builtRule = { ...draftRule };
    resetCalculationResult();
    renderRuleState();
    elements.machineRunButton.focus();
  });
  elements.machineRunButton.addEventListener("click", runCalculationBatch);
  elements.machineRepeatCount.addEventListener("change", () => {
    state.repeatCount = Math.min(MAX_RESULT_COUNT, Math.max(1, Number(elements.machineRepeatCount.value) || 1));
    resetCalculationResult();
    renderRuleState();
  });
  elements.lowerMachineBackButton.addEventListener("click", () => {
    if (typeof onBack === "function") onBack();
  });

  for (let count = 1; count <= MAX_RESULT_COUNT; count += 1) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = String(count);
    option.selected = count === INITIAL_RESULT_COUNT;
    elements.machineRepeatCount.append(option);
  }
  resetCalculationResult();
  renderRuleState();
}
