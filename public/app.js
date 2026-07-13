import {
  answeredCount,
  calculateCorrectCount,
  calculationLessons,
  isCalculationComplete
} from "./calculation.js";

const lessons = {
  lower: {
    gradeName: "1-3ねんせい",
    programTitle: "えを うごかそう！",
    programSectionLabel: "カードを おして じゅんばんに ならべよう",
    paletteLabel: "めいれいカード",
    paletteHeading: "カードを えらぶ",
    listLabel: "つくった プログラム",
    listHeading: "うえから じゅんばん",
    emptyProgram: "カードを おして ならべよう",
    stageNotes: ["スタートから ゴールまで", "カードの じゅんに うごく"],
    rows: 6,
    cols: 8,
    start: { row: 4, col: 1 },
    goalCell: { row: 1, col: 6 },
    paintTargets: [
      { row: 4, col: 3 },
      { row: 2, col: 4 }
    ],
    walls: [],
    treasures: [],
    commands: [
      { id: "right", label: "みぎへ", kind: "move", hint: "1マス すすむ" },
      { id: "up", label: "うえへ", kind: "move", hint: "1マス すすむ" },
      { id: "down", label: "したへ", kind: "move", hint: "1マス すすむ" },
      { id: "left", label: "ひだりへ", kind: "move", hint: "1マス すすむ" },
      { id: "paint", label: "いろを ぬる", kind: "action", hint: "マスを ぬる" },
      { id: "say", label: "おはなし", kind: "action", hint: "ことばを だす" }
    ],
    sample: ["right", "right", "paint", "right", "up", "up", "paint", "right", "right", "up"]
  },
  upper: {
    gradeName: "4-6年生",
    programTitle: "迷路ゲームを作ろう",
    programSectionLabel: "命令を組み合わせて、宝を取りながらゴールしよう",
    paletteLabel: "命令ブロック",
    paletteHeading: "動き・くり返し・もし",
    listLabel: "作ったプログラム",
    listHeading: "上から順番に実行",
    emptyProgram: "命令を選んで、ここに並べよう",
    stageNotes: ["宝を2個集める", "壁は「もし」で確認"],
    rows: 7,
    cols: 10,
    start: { row: 5, col: 1 },
    goalCell: { row: 1, col: 8 },
    paintTargets: [],
    walls: [
      { row: 1, col: 3 },
      { row: 3, col: 3 },
      { row: 2, col: 3 },
      { row: 2, col: 6 },
      { row: 3, col: 6 },
      { row: 4, col: 6 },
      { row: 5, col: 6 },
      { row: 5, col: 7 }
    ],
    treasures: [
      { row: 5, col: 4 },
      { row: 1, col: 5 }
    ],
    commands: [
      { id: "right", label: "右へ1マス", kind: "move", hint: "動き" },
      { id: "up", label: "上へ1マス", kind: "move", hint: "動き" },
      { id: "left", label: "左へ1マス", kind: "move", hint: "動き" },
      { id: "down", label: "下へ1マス", kind: "move", hint: "動き" },
      { id: "repeatRight3", label: "右へ3回", kind: "logic", hint: "くり返し" },
      { id: "repeatUp2", label: "上へ2回", kind: "logic", hint: "くり返し" },
      { id: "ifTreasure", label: "もし 宝なら+10", kind: "logic", hint: "条件" },
      { id: "ifWall", label: "もし 壁なら戻る", kind: "logic", hint: "条件" },
      { id: "ifGoal", label: "もし ゴールなら完了", kind: "logic", hint: "条件" }
    ],
    sample: ["ifWall", "ifTreasure", "ifGoal", "repeatRight3", "repeatUp2", "repeatUp2", "right", "repeatRight3"]
  }
};

function readModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = (params.get("grade") || params.get("mode") || params.get("g") || "lower").toLowerCase();
  return ["upper", "high", "4-6", "456"].includes(value) ? "upper" : "lower";
}

function readPageFromUrl() {
  const value = (new URLSearchParams(window.location.search).get("page") || "calculation").toLowerCase();
  return value === "program" ? "program" : "calculation";
}

const mode = readModeFromUrl();
const initialQuestions = calculationLessons[mode].questions;
const state = {
  mode,
  page: readPageFromUrl(),
  calculation: {
    phase: "ready",
    answers: initialQuestions.map(() => null),
    drafts: initialQuestions.map(() => ""),
    activeQuestion: 0,
    programDone: false,
    startedAt: 0,
    finishedAt: 0,
    selectedReasons: new Set(),
    insightRevealed: false
  },
  program: [],
  robot: { row: 0, col: 0 },
  painted: new Set(),
  collected: new Set(),
  score: 0,
  running: false,
  activeCommandIndex: -1,
  rules: { ifWall: false, ifTreasure: false, ifGoal: false }
};

const elements = Object.fromEntries([
  "calculationPage", "programPage", "calculationPageButton", "programPageButton",
  "calculationTabTitle", "calculationTabHint", "programTabTitle", "programTabHint",
  "gradeName", "calculationEyebrow", "calculationTitle", "calculationLead",
  "calculationStartButton", "calculationStartLabel", "calculationStartHint",
  "questionHeading", "questionProgress", "calculationQuestions", "numberPad",
  "numberPadGrid", "numberDeleteButton", "numberConfirmButton", "humanStatusTitle",
  "humanStatusMain", "humanStatusProgress", "humanStatusSub", "programStatusTitle",
  "programStatusMain", "programStatusProgress", "programStatusSub", "insightTitle",
  "insightBody", "reflectionPanel", "reflectionTitle", "reflectionLead", "reflectionChoices",
  "revealInsightButton", "learningInsight", "goToProgramButton", "goToProgramLabel", "programSectionLabel",
  "lessonTitle", "programMascot", "backToCalculationButton", "stageNoteA", "stageNoteB",
  "stageGrid", "robotStatus", "scoreStatus", "commandPalette", "paletteLabel",
  "paletteHeading", "programList", "programListLabel", "programListHeading", "runButton",
  "resetButton", "undoButton", "clearButton", "sampleButton"
].map((id) => [id, document.querySelector(`#${id}`)]));

const commandIcons = {
  right: "→",
  left: "←",
  up: "↑",
  down: "↓",
  paint: "ぬる",
  say: "はなす",
  repeatRight3: "→ ×3",
  repeatUp2: "↑ ×2",
  ifTreasure: "もし",
  ifWall: "もし",
  ifGoal: "もし"
};

function currentLesson() {
  return lessons[state.mode];
}

function currentCalculationLesson() {
  return calculationLessons[state.mode];
}

function keyOf(cell) {
  return `${cell.row}:${cell.col}`;
}

function sameCell(a, b) {
  return a.row === b.row && a.col === b.col;
}

function formatSeconds(milliseconds) {
  const seconds = Math.max(0.1, milliseconds / 1000).toFixed(1);
  return state.mode === "lower" ? `${seconds}びょう` : `${seconds}秒`;
}

function questionUnit(count) {
  return state.mode === "lower" ? `${count}もん` : `${count}問`;
}

function resetCalculation() {
  const questions = currentCalculationLesson().questions;
  state.calculation = {
    phase: "running",
    answers: questions.map(() => null),
    drafts: questions.map(() => ""),
    activeQuestion: 0,
    programDone: false,
    startedAt: performance.now(),
    finishedAt: 0,
    selectedReasons: new Set(),
    insightRevealed: false
  };
  renderCalculation();
  window.setTimeout(() => {
    if (state.calculation.phase !== "ready") {
      state.calculation.programDone = true;
      renderCalculationStatus();
    }
  }, state.mode === "lower" ? 100 : 200);
}

function chooseLowerAnswer(questionIndex, answer) {
  if (state.calculation.phase !== "running") return;
  state.calculation.answers[questionIndex] = answer;
  finishAnswer(questionIndex);
}

function finishAnswer(questionIndex) {
  const { questions } = currentCalculationLesson();
  const next = state.calculation.answers.findIndex((answer, index) => index > questionIndex && answer === null);
  const firstOpen = state.calculation.answers.findIndex((answer) => answer === null);
  state.calculation.activeQuestion = next >= 0 ? next : Math.max(0, firstOpen);

  if (isCalculationComplete(questions, state.calculation.answers)) {
    state.calculation.phase = "complete";
    state.calculation.finishedAt = performance.now();
    state.calculation.programDone = true;
  }
  renderCalculation();
}

function typeNumber(value) {
  if (state.calculation.phase !== "running" || state.mode !== "upper") return;
  const index = state.calculation.activeQuestion;
  if (state.calculation.answers[index] !== null) return;
  state.calculation.drafts[index] = `${state.calculation.drafts[index]}${value}`.slice(0, 3);
  renderCalculationQuestions();
}

function deleteNumber() {
  if (state.calculation.phase !== "running" || state.mode !== "upper") return;
  const index = state.calculation.activeQuestion;
  state.calculation.drafts[index] = state.calculation.drafts[index].slice(0, -1);
  renderCalculationQuestions();
}

function confirmNumber() {
  if (state.calculation.phase !== "running" || state.mode !== "upper") return;
  const index = state.calculation.activeQuestion;
  const draft = state.calculation.drafts[index];
  if (!draft) return;
  state.calculation.answers[index] = Number(draft);
  finishAnswer(index);
}

function renderCalculation() {
  const lesson = currentCalculationLesson();
  const copy = lesson.copy;
  elements.gradeName.textContent = currentLesson().gradeName;
  elements.calculationEyebrow.textContent = copy.eyebrow;
  elements.calculationTitle.textContent = copy.title;
  elements.calculationLead.textContent = copy.lead;
  elements.questionHeading.textContent = copy.questionHeading;
  elements.calculationStartHint.textContent = copy.startHint;
  elements.humanStatusTitle.textContent = copy.humanTitle;
  elements.programStatusTitle.textContent = copy.programTitle;
  elements.insightTitle.textContent = copy.insightTitle;
  elements.insightBody.textContent = copy.insightBody;
  elements.reflectionTitle.textContent = copy.reflectionTitle;
  elements.reflectionLead.textContent = copy.reflectionLead;
  elements.revealInsightButton.textContent = copy.reveal;
  elements.goToProgramLabel.textContent = copy.next;
  elements.calculationStartLabel.textContent = state.calculation.phase === "complete"
    ? (state.mode === "lower" ? "もういちど" : "もう一度")
    : "スタート";
  elements.calculationStartButton.disabled = state.calculation.phase === "running";
  elements.goToProgramButton.disabled = state.calculation.phase !== "complete" || !state.calculation.insightRevealed;
  elements.numberPad.hidden = state.mode !== "upper";
  renderCalculationQuestions();
  renderCalculationStatus();
  renderReflection();
}

function renderReflection() {
  const copy = currentCalculationLesson().copy;
  const isComplete = state.calculation.phase === "complete";
  elements.reflectionPanel.hidden = !isComplete;
  elements.learningInsight.hidden = !isComplete || !state.calculation.insightRevealed;
  elements.revealInsightButton.hidden = state.calculation.insightRevealed;
  elements.revealInsightButton.disabled = state.calculation.selectedReasons.size === 0;
  elements.reflectionChoices.innerHTML = "";

  copy.reflectionChoices.forEach((reason) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reflection-choice";
    button.textContent = reason;
    const selected = state.calculation.selectedReasons.has(reason);
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.addEventListener("click", () => {
      if (state.calculation.selectedReasons.has(reason)) {
        state.calculation.selectedReasons.delete(reason);
      } else {
        state.calculation.selectedReasons.add(reason);
      }
      renderReflection();
    });
    elements.reflectionChoices.append(button);
  });
}

function renderCalculationQuestions() {
  const { questions } = currentCalculationLesson();
  elements.calculationQuestions.innerHTML = "";
  const count = answeredCount(state.calculation.answers);
  elements.questionProgress.textContent = `${count} / ${questionUnit(questions.length)}`;

  questions.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "calculation-question";
    if (index === state.calculation.activeQuestion && state.calculation.phase === "running") row.classList.add("active");

    const number = document.createElement("span");
    number.className = "question-number";
    number.textContent = String(index + 1);

    const formula = document.createElement("span");
    formula.className = "question-formula";
    formula.textContent = `${question.formula}=?`;
    row.append(number, formula);

    if (state.mode === "lower") {
      const choices = document.createElement("div");
      choices.className = "question-choices";
      question.choices.forEach((choice) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice-button";
        button.textContent = String(choice);
        button.disabled = state.calculation.phase !== "running" || state.calculation.answers[index] !== null;
        if (state.calculation.answers[index] === choice) {
          button.classList.add("selected", choice === question.answer ? "correct" : "incorrect");
        }
        button.addEventListener("click", () => chooseLowerAnswer(index, choice));
        choices.append(button);
      });
      row.append(choices);
    } else {
      const answer = document.createElement("button");
      answer.type = "button";
      answer.className = "question-answer";
      answer.textContent = state.calculation.answers[index] ?? state.calculation.drafts[index] ?? "";
      answer.addEventListener("click", () => {
        if (state.calculation.phase === "running" && state.calculation.answers[index] === null) {
          state.calculation.activeQuestion = index;
          renderCalculationQuestions();
        }
      });
      if (state.calculation.answers[index] !== null) {
        answer.classList.add(state.calculation.answers[index] === question.answer ? "correct" : "incorrect");
      }
      row.append(answer);
    }
    elements.calculationQuestions.append(row);
  });
}

function renderCalculationStatus() {
  const lesson = currentCalculationLesson();
  const { copy, questions } = lesson;
  const count = answeredCount(state.calculation.answers);
  const correct = calculateCorrectCount(questions, state.calculation.answers);
  const remaining = questions.length - count;
  const phase = state.calculation.phase;

  if (phase === "ready") {
    elements.humanStatusMain.textContent = copy.waiting;
    elements.humanStatusProgress.textContent = `0 / ${questionUnit(questions.length)}`;
    elements.humanStatusSub.textContent = state.mode === "lower" ? "スタートで はじめよう" : "スタートで開始します";
  } else if (phase === "running") {
    elements.humanStatusMain.textContent = copy.humanRunning;
    elements.humanStatusProgress.textContent = `${count} / ${questionUnit(questions.length)}`;
    elements.humanStatusSub.textContent = state.mode === "lower" ? `あと ${questionUnit(remaining)}` : `あと${questionUnit(remaining)}`;
  } else {
    elements.humanStatusMain.textContent = copy.humanComplete;
    elements.humanStatusProgress.textContent = state.mode === "lower"
      ? `${correct} / ${questionUnit(questions.length)} せいかい`
      : `${questions.length}問中 ${correct}問正解`;
    elements.humanStatusSub.textContent = formatSeconds(state.calculation.finishedAt - state.calculation.startedAt);
  }

  if (!state.calculation.programDone) {
    elements.programStatusMain.textContent = phase === "ready" ? copy.waiting : (state.mode === "lower" ? "けいさんちゅう" : "計算中");
    elements.programStatusProgress.textContent = state.mode === "lower" ? "0.0びょう" : "0.0秒";
    elements.programStatusSub.textContent = state.mode === "lower" ? "おなじ しきを けいさんするよ" : "同じ計算式を計算します";
    return;
  }

  const programTime = state.mode === "lower" ? "0.1びょう" : "0.2秒";
  elements.programStatusMain.textContent = copy.programComplete;
  elements.programStatusProgress.textContent = state.mode === "lower"
    ? `${programTime}・${questionUnit(questions.length)} せいかい`
    : `${programTime}・${questions.length}問正解`;
  elements.programStatusSub.textContent = phase === "complete" ? copy.programTogether : copy.programWaiting;
}

function renderNumberPad() {
  elements.numberPadGrid.innerHTML = "";
  [7, 8, 9, 4, 5, 6, 1, 2, 3, 0].forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "number-key";
    button.textContent = String(value);
    button.addEventListener("click", () => typeNumber(value));
    elements.numberPadGrid.append(button);
  });
}

function resetStage() {
  const lesson = currentLesson();
  state.robot = { ...lesson.start };
  state.painted = new Set();
  state.collected = new Set();
  state.score = 0;
  state.running = false;
  state.activeCommandIndex = -1;
  state.rules = { ifWall: false, ifTreasure: false, ifGoal: false };
}

function setPage(page) {
  state.page = page;
  const url = new URL(window.location.href);
  url.searchParams.set("page", page);
  window.history.replaceState({}, "", url);
  renderPage();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function expandProgram(program) {
  const expanded = [];
  program.forEach((command, sourceIndex) => {
    let commands = [command];
    if (command === "repeatRight3") commands = ["right", "right", "right"];
    if (command === "repeatUp2") commands = ["up", "up"];
    commands.forEach((expandedCommand) => expanded.push({ command: expandedCommand, sourceIndex }));
  });
  return expanded;
}

function renderPage() {
  const isProgram = state.page === "program";
  document.body.dataset.page = state.page;
  elements.calculationPage.hidden = isProgram;
  elements.programPage.hidden = !isProgram;
  elements.calculationPageButton.classList.toggle("active", !isProgram);
  elements.programPageButton.classList.toggle("active", isProgram);
  elements.calculationPageButton.setAttribute("aria-pressed", String(!isProgram));
  elements.programPageButton.setAttribute("aria-pressed", String(isProgram));
}

function renderProgramPage() {
  const lesson = currentLesson();
  elements.lessonTitle.textContent = lesson.programTitle;
  elements.programSectionLabel.textContent = lesson.programSectionLabel;
  elements.paletteLabel.textContent = lesson.paletteLabel;
  elements.paletteHeading.textContent = lesson.paletteHeading;
  elements.programListLabel.textContent = lesson.listLabel;
  elements.programListHeading.textContent = lesson.listHeading;
  elements.stageNoteA.textContent = lesson.stageNotes[0];
  elements.stageNoteB.textContent = lesson.stageNotes[1];
  elements.programMascot.src = state.mode === "lower" ? "./assets/lower-mascot.png" : "./assets/robot-mascot.png";
  elements.programMascot.alt = state.mode === "lower" ? "キャラクター" : "ロボット";
  elements.backToCalculationButton.textContent = state.mode === "lower" ? "けいさんへ" : "計算へ戻る";
  elements.runButton.textContent = state.mode === "lower" ? "うごかす" : "実行";
  elements.undoButton.textContent = state.mode === "lower" ? "もどす" : "戻す";
  elements.clearButton.textContent = state.mode === "lower" ? "けす" : "消す";
  elements.sampleButton.textContent = state.mode === "lower" ? "みほん" : "見本";
  renderPalette();
  renderStage();
  renderProgram();
  renderStats();
}

function renderPalette() {
  const lesson = currentLesson();
  elements.commandPalette.innerHTML = "";
  lesson.commands.forEach((command) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `command-card ${command.kind}`;
    const icon = document.createElement("strong");
    icon.textContent = commandIcons[command.id] ?? "+";
    const label = document.createElement("span");
    label.textContent = command.label;
    const hint = document.createElement("small");
    hint.textContent = command.hint;
    button.append(icon, label, hint);
    button.addEventListener("click", () => {
      if (state.running) return;
      state.program.push(command.id);
      renderProgram();
    });
    elements.commandPalette.append(button);
  });
}

function renderStage() {
  const lesson = currentLesson();
  elements.stageGrid.style.gridTemplateColumns = `repeat(${lesson.cols}, minmax(0, 1fr))`;
  elements.stageGrid.style.gridTemplateRows = `repeat(${lesson.rows}, minmax(0, 1fr))`;
  elements.stageGrid.style.aspectRatio = `${lesson.cols} / ${lesson.rows}`;
  elements.stageGrid.innerHTML = "";

  for (let row = 0; row < lesson.rows; row += 1) {
    for (let col = 0; col < lesson.cols; col += 1) {
      const cell = { row, col };
      const node = document.createElement("div");
      node.className = "cell path";
      if (sameCell(cell, lesson.start)) node.classList.add("start");
      if (sameCell(cell, lesson.goalCell)) node.classList.add("goal");
      if (lesson.walls.some((wall) => sameCell(cell, wall))) node.classList.add("wall");

      const cellKey = keyOf(cell);
      const hasTreasure = lesson.treasures.some((treasure) => sameCell(cell, treasure)) && !state.collected.has(cellKey);
      if (hasTreasure) node.classList.add("treasure");
      if (state.painted.has(cellKey)) node.classList.add("painted");

      if (sameCell(cell, lesson.start)) {
        const label = document.createElement("span");
        label.className = "cell-mark start-mark";
        label.textContent = "スタート";
        node.append(label);
      }
      if (sameCell(cell, lesson.goalCell)) {
        const label = document.createElement("span");
        label.className = "cell-mark goal-mark";
        label.textContent = "ゴール";
        node.append(label);
      }
      if (hasTreasure) {
        const mark = document.createElement("span");
        mark.className = "cell-mark treasure-mark";
        mark.textContent = "★";
        node.append(mark);
      }
      if (sameCell(cell, state.robot)) {
        node.classList.add("robot");
        const character = document.createElement("img");
        character.className = "stage-character";
        character.src = state.mode === "lower" ? "./assets/lower-mascot.png" : "./assets/robot-mascot.png";
        character.alt = "";
        node.append(character);
      }
      elements.stageGrid.append(node);
    }
  }
}

function renderProgram() {
  const lesson = currentLesson();
  const labels = Object.fromEntries(lesson.commands.map((command) => [command.id, command.label]));
  elements.programList.innerHTML = "";
  if (state.program.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-program";
    empty.textContent = lesson.emptyProgram;
    elements.programList.append(empty);
    return;
  }
  state.program.forEach((command, index) => {
    const item = document.createElement("div");
    item.className = "program-item";
    if (index === state.activeCommandIndex) item.classList.add("active");
    const number = document.createElement("span");
    number.textContent = String(index + 1);
    const label = document.createElement("strong");
    label.textContent = labels[command] ?? command;
    item.append(number, label);
    elements.programList.append(item);
  });
}

function renderStats() {
  if (state.mode === "lower") {
    elements.scoreStatus.textContent = `いろ ${state.painted.size} / ${currentLesson().paintTargets.length}`;
  } else {
    elements.scoreStatus.textContent = `宝 ${state.collected.size} / ${currentLesson().treasures.length}`;
  }
}

function isMovement(command) {
  return ["right", "left", "up", "down"].includes(command);
}

function nextPosition(command) {
  const next = { ...state.robot };
  if (command === "right") next.col += 1;
  if (command === "left") next.col -= 1;
  if (command === "up") next.row -= 1;
  if (command === "down") next.row += 1;
  return next;
}

function isInside(cell) {
  const lesson = currentLesson();
  return cell.row >= 0 && cell.row < lesson.rows && cell.col >= 0 && cell.col < lesson.cols;
}

function isWall(cell) {
  return currentLesson().walls.some((wall) => sameCell(cell, wall));
}

function sleep(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function runProgram() {
  if (state.running || state.program.length === 0) return;
  resetStage();
  state.running = true;
  elements.runButton.disabled = true;
  elements.robotStatus.textContent = state.mode === "lower" ? "うごいているよ" : "実行中";
  renderStage();
  renderStats();

  for (const entry of expandProgram(state.program)) {
    state.activeCommandIndex = entry.sourceIndex;
    renderProgram();
    await executeCommand(entry.command);
    renderStage();
    renderStats();
    await sleep(320);
  }
  state.running = false;
  state.activeCommandIndex = -1;
  elements.runButton.disabled = false;
  renderProgram();
  checkFinish();
}

async function executeCommand(command) {
  if (command === "ifWall" || command === "ifTreasure" || command === "ifGoal") {
    state.rules[command] = true;
    const messages = {
      ifWall: "壁を確認できる",
      ifTreasure: "宝を取ると点を足せる",
      ifGoal: "ゴールを確認できる"
    };
    elements.robotStatus.textContent = messages[command];
    return;
  }
  if (command === "paint") {
    state.painted.add(keyOf(state.robot));
    elements.robotStatus.textContent = "いろを ぬったよ";
    return;
  }
  if (command === "say") {
    elements.robotStatus.textContent = "こんにちは！";
    return;
  }
  if (!isMovement(command)) return;

  const next = nextPosition(command);
  if (!isInside(next)) {
    elements.robotStatus.textContent = state.mode === "lower" ? "そとには でられないよ" : "ステージの外には進めません";
    return;
  }
  if (isWall(next)) {
    if (state.rules.ifWall) {
      state.robot = { ...currentLesson().start };
      elements.robotStatus.textContent = "壁なのでスタートへ戻りました";
    } else {
      elements.robotStatus.textContent = "壁に当たりました";
    }
    return;
  }
  state.robot = next;
  elements.robotStatus.textContent = state.mode === "lower" ? "1マス すすんだよ" : "1マス進みました";
  applyAutomaticRules();
}

function applyAutomaticRules() {
  const lesson = currentLesson();
  const robotKey = keyOf(state.robot);
  const onTreasure = lesson.treasures.some((treasure) => sameCell(treasure, state.robot));
  if (onTreasure && state.rules.ifTreasure && !state.collected.has(robotKey)) {
    state.collected.add(robotKey);
    state.score += 10;
    elements.robotStatus.textContent = "宝を取って+10点";
  }
  if (sameCell(state.robot, lesson.goalCell) && state.rules.ifGoal) {
    elements.robotStatus.textContent = "ゴールを確認しました";
  }
}

function checkFinish() {
  if (sameCell(state.robot, currentLesson().goalCell)) {
    elements.robotStatus.textContent = state.mode === "lower" ? "ゴールに ついたよ！" : "ゴールに到着しました";
  } else {
    elements.robotStatus.textContent = state.mode === "lower" ? "カードを なおして もういちど" : "命令を直して、もう一度実行しよう";
  }
}

function render() {
  const isLower = state.mode === "lower";
  document.body.dataset.grade = state.mode;
  elements.calculationTabTitle.textContent = isLower ? "けいさん" : "計算";
  elements.calculationTabHint.textContent = isLower ? "おなじ しきを やってみよう" : "速さと正確さを確かめる";
  elements.programTabTitle.textContent = "プログラミング";
  elements.programTabHint.textContent = isLower ? "カードで えを うごかそう" : "命令で迷路を動かす";
  renderCalculation();
  renderProgramPage();
  renderPage();
}

elements.calculationStartButton.addEventListener("click", resetCalculation);
elements.revealInsightButton.addEventListener("click", () => {
  if (state.calculation.selectedReasons.size === 0) return;
  state.calculation.insightRevealed = true;
  renderCalculation();
});
elements.numberDeleteButton.addEventListener("click", deleteNumber);
elements.numberConfirmButton.addEventListener("click", confirmNumber);
elements.calculationPageButton.addEventListener("click", () => setPage("calculation"));
elements.programPageButton.addEventListener("click", () => setPage("program"));
elements.goToProgramButton.addEventListener("click", () => setPage("program"));
elements.backToCalculationButton.addEventListener("click", () => setPage("calculation"));
elements.runButton.addEventListener("click", runProgram);
elements.resetButton.addEventListener("click", () => {
  resetStage();
  renderStage();
  renderStats();
  elements.robotStatus.textContent = state.mode === "lower" ? "スタートで まっている" : "スタートで待っています";
});
elements.undoButton.addEventListener("click", () => {
  if (state.running) return;
  state.program.pop();
  renderProgram();
});
elements.clearButton.addEventListener("click", () => {
  if (state.running) return;
  state.program = [];
  resetStage();
  renderProgramPage();
});
elements.sampleButton.addEventListener("click", () => {
  if (state.running) return;
  state.program = [...currentLesson().sample];
  resetStage();
  renderProgram();
  renderStage();
  renderStats();
});

renderNumberPad();
resetStage();
render();
