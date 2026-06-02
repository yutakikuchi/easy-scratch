const lessons = {
  lower: {
    gradeName: "1-3ねんせい",
    gradeHint: "やじるしといろのコース",
    title: "かみのじゅんばんを めいれいにしよう",
    paperTitle: "やじるしといろをかこう",
    paperWorkCount: 18,
    paperPoint: "なんどもかくのはたいへん",
    goal: "かみでかいた やじるしといろぬりを、めいれいカードにします。スタートすると、いっきにうごきます。",
    missionTitle: "かみのしごとをらくにしよう",
    missions: ["やじるしをカードにする", "いろをぬる", "ゴールへいく"],
    stageNotes: ["S から G まで", "カードのじゅんにうごく"],
    rows: 6,
    cols: 8,
    start: { row: 4, col: 1 },
    goalCell: { row: 1, col: 6 },
    paintTargets: [
      { row: 2, col: 3 },
      { row: 3, col: 4 }
    ],
    walls: [],
    treasures: [],
    paperSteps: [
      "スタートからゴールまで、やじるしを1つずつかく",
      "おなじじゅんばんを、もういちどかく",
      "きめられたマスを、1つずついろでぬる",
      "かみのしごとを、めいれいカードにする"
    ],
    commands: [
      { id: "right", label: "みぎへ1マス", kind: "move", hint: "やじるし1つ" },
      { id: "left", label: "ひだりへ1マス", kind: "move", hint: "もどるとき" },
      { id: "up", label: "うえへ1マス", kind: "move", hint: "やじるし1つ" },
      { id: "down", label: "したへ1マス", kind: "move", hint: "やじるし1つ" },
      { id: "paint", label: "いろをぬる", kind: "action", hint: "マスをぬる" },
      { id: "say", label: "おはなし", kind: "action", hint: "ことばをだす" }
    ],
    sample: ["right", "right", "paint", "right", "up", "up", "paint", "right", "right", "up"]
  },
  upper: {
    gradeName: "4-6年生",
    gradeHint: "ミッションゲームコース",
    title: "くり返しと「もし」で楽にしよう",
    paperTitle: "点を数えよう",
    paperWorkCount: 42,
    paperPoint: "毎回はたいへん",
    goal: "宝、かべ、ゴールをカードでチェックします。自分で数えなくても、点がふえます。",
    missionTitle: "宝をあつめてゴールしよう",
    missions: ["宝を2こあつめる", "かべなら戻る", "点20でクリア"],
    stageNotes: ["★ をあつめる", "かべはカードでチェック"],
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
      { row: 3, col: 8 },
      { row: 1, col: 5 }
    ],
    paperSteps: [
      "めいろに、ゴールまでのやじるしを1つずつかく",
      "宝をとったら、点を自分でたす",
      "かべにあたったら戻る、と自分でかく",
      "同じやじるしは「くり返し」にする"
    ],
    commands: [
      { id: "right", label: "右へ1マス", kind: "move", hint: "やじるし1つ" },
      { id: "up", label: "上へ1マス", kind: "move", hint: "やじるし1つ" },
      { id: "repeatRight3", label: "右へ3回", kind: "logic", hint: "3つを1まいに" },
      { id: "repeatUp2", label: "上へ2回", kind: "logic", hint: "2つを1まいに" },
      { id: "repeatRight2", label: "右へ2回", kind: "logic", hint: "2つを1まいに" },
      { id: "ifTreasure", label: "もし 宝なら+10", kind: "logic", hint: "点をたす" },
      { id: "ifWall", label: "もし かべなら戻る", kind: "logic", hint: "自分で見ない" },
      { id: "ifGoal", label: "もし ゴールならクリア", kind: "logic", hint: "ついたかチェック" },
      { id: "down", label: "下へ1マス", kind: "move", hint: "回り道" },
      { id: "left", label: "左へ1マス", kind: "move", hint: "戻るとき" }
    ],
    sample: ["ifWall", "ifTreasure", "ifGoal", "repeatRight3", "repeatUp2", "repeatUp2", "right", "repeatRight3"]
  }
};

function readModeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const value = (params.get("grade") || params.get("mode") || params.get("g") || "lower").toLowerCase();
  if (["upper", "high", "4-6", "456"].includes(value)) return "upper";
  return "lower";
}

const state = {
  mode: readModeFromUrl(),
  program: [],
  robot: { row: 0, col: 0 },
  painted: new Set(),
  collected: new Set(),
  score: 0,
  running: false,
  rules: {
    ifWall: false,
    ifTreasure: false,
    ifGoal: false
  }
};

const elements = {
  gradeName: document.querySelector("#gradeName"),
  gradeHint: document.querySelector("#gradeHint"),
  missionTitle: document.querySelector("#missionTitle"),
  missionList: document.querySelector("#missionList"),
  stageNoteA: document.querySelector("#stageNoteA"),
  stageNoteB: document.querySelector("#stageNoteB"),
  paperTitle: document.querySelector("#paperTitle"),
  paperSteps: document.querySelector("#paperSteps"),
  paperWorkCount: document.querySelector("#paperWorkCount"),
  paperPoint: document.querySelector("#paperPoint"),
  programGoal: document.querySelector("#programGoal"),
  lessonTitle: document.querySelector("#lessonTitle"),
  stageGrid: document.querySelector("#stageGrid"),
  robotStatus: document.querySelector("#robotStatus"),
  scoreStatus: document.querySelector("#scoreStatus"),
  commandCount: document.querySelector("#commandCount"),
  expandedCount: document.querySelector("#expandedCount"),
  commandPalette: document.querySelector("#commandPalette"),
  programList: document.querySelector("#programList"),
  runButton: document.querySelector("#runButton"),
  resetButton: document.querySelector("#resetButton"),
  undoButton: document.querySelector("#undoButton"),
  clearButton: document.querySelector("#clearButton"),
  sampleButton: document.querySelector("#sampleButton")
};

function currentLesson() {
  return lessons[state.mode];
}

function keyOf(cell) {
  return `${cell.row}:${cell.col}`;
}

function sameCell(a, b) {
  return a.row === b.row && a.col === b.col;
}

function resetStage() {
  const lesson = currentLesson();
  state.robot = { ...lesson.start };
  state.painted = new Set();
  state.collected = new Set();
  state.score = 0;
  state.rules = {
    ifWall: false,
    ifTreasure: false,
    ifGoal: false
  };
  state.running = false;
}

function addCommand(commandId) {
  if (state.running) return;
  state.program.push(commandId);
  renderProgram();
  renderStats();
}

function expandProgram(program) {
  const expanded = [];
  for (const command of program) {
    if (command === "repeatRight3") {
      expanded.push("right", "right", "right");
    } else if (command === "repeatRight2") {
      expanded.push("right", "right");
    } else if (command === "repeatUp2") {
      expanded.push("up", "up");
    } else {
      expanded.push(command);
    }
  }
  return expanded;
}

function render() {
  const lesson = currentLesson();
  document.body.dataset.grade = state.mode;
  elements.gradeName.textContent = lesson.gradeName;
  elements.gradeHint.textContent = lesson.gradeHint;
  elements.lessonTitle.textContent = lesson.title;
  elements.paperTitle.textContent = lesson.paperTitle;
  elements.paperWorkCount.textContent = `${lesson.paperWorkCount}かい`;
  elements.paperPoint.textContent = lesson.paperPoint;
  elements.programGoal.textContent = lesson.goal;
  elements.missionTitle.textContent = lesson.missionTitle;
  elements.stageNoteA.textContent = lesson.stageNotes[0];
  elements.stageNoteB.textContent = lesson.stageNotes[1];

  elements.missionList.innerHTML = "";
  for (const mission of lesson.missions) {
    const item = document.createElement("span");
    item.textContent = mission;
    elements.missionList.append(item);
  }

  elements.paperSteps.innerHTML = "";
  for (const step of lesson.paperSteps) {
    const item = document.createElement("li");
    item.textContent = step;
    elements.paperSteps.append(item);
  }

  renderPalette();
  renderStage();
  renderProgram();
  renderStats();
}

function renderPalette() {
  const lesson = currentLesson();
  elements.commandPalette.innerHTML = "";

  for (const command of lesson.commands) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `command-card ${command.kind}`;
    button.innerHTML = `<span>${command.label}</span><small>${command.hint}</small>`;
    button.addEventListener("click", () => addCommand(command.id));
    elements.commandPalette.append(button);
  }
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
      node.setAttribute("aria-label", `たて${row + 1} よこ${col + 1}`);

      let mark = "";
      if (sameCell(cell, lesson.start)) {
        node.classList.add("start");
        mark = "S";
      }
      if (sameCell(cell, lesson.goalCell)) {
        node.classList.add("goal");
        mark = "G";
      }
      if (lesson.walls.some((wall) => sameCell(cell, wall))) node.classList.add("wall");

      const treasureKey = keyOf(cell);
      if (lesson.treasures.some((treasure) => sameCell(cell, treasure)) && !state.collected.has(treasureKey)) {
        node.classList.add("treasure");
        mark = "★";
      }

      if (state.painted.has(treasureKey)) node.classList.add("painted");
      if (sameCell(cell, state.robot)) node.classList.add("robot");
      if (mark) {
        const markNode = document.createElement("span");
        markNode.className = "cell-mark";
        markNode.textContent = mark;
        node.append(markNode);
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
    empty.textContent = "かみのじゅんばんをカードでならべよう";
    elements.programList.append(empty);
    return;
  }

  state.program.forEach((command, index) => {
    const item = document.createElement("div");
    item.className = "program-item";
    item.innerHTML = `<span>${index + 1}</span><strong>${labels[command] ?? command}</strong>`;
    elements.programList.append(item);
  });
}

function renderStats() {
  const expanded = expandProgram(state.program);
  elements.commandCount.textContent = `${state.program.length}まい`;
  elements.expandedCount.textContent = `${expanded.filter((command) => isMovement(command) || command === "paint").length}かい`;
  elements.scoreStatus.textContent = `てん ${state.score}`;
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

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function runProgram() {
  if (state.running || state.program.length === 0) return;

  resetStage();
  state.running = true;
  elements.runButton.disabled = true;
  elements.robotStatus.textContent = "うごいている";
  renderStage();
  renderStats();

  const commands = expandProgram(state.program);
  for (const command of commands) {
    await executeCommand(command);
    renderStage();
    renderStats();
    await sleep(360);
  }

  state.running = false;
  elements.runButton.disabled = false;
  checkFinish();
}

async function executeCommand(command) {
  if (command === "ifWall") {
    state.rules.ifWall = true;
    elements.robotStatus.textContent = "かべをチェックできる";
    return;
  }

  if (command === "ifTreasure") {
    state.rules.ifTreasure = true;
    elements.robotStatus.textContent = "てんをじぶんでたせる";
    return;
  }

  if (command === "ifGoal") {
    state.rules.ifGoal = true;
    elements.robotStatus.textContent = "ゴールをチェックできる";
    return;
  }

  if (command === "paint") {
    state.painted.add(keyOf(state.robot));
    elements.robotStatus.textContent = "いろをぬった";
    return;
  }

  if (command === "say") {
    elements.robotStatus.textContent = "こんにちは、といった";
    return;
  }

  if (!isMovement(command)) return;

  const next = nextPosition(command);
  if (!isInside(next)) {
    elements.robotStatus.textContent = "そとにはでられない";
    return;
  }

  if (isWall(next)) {
    if (state.rules.ifWall) {
      state.robot = { ...currentLesson().start };
      elements.robotStatus.textContent = "かべなのでスタートへもどった";
    } else {
      elements.robotStatus.textContent = "かべにあたった";
    }
    return;
  }

  state.robot = next;
  elements.robotStatus.textContent = "1マスすすんだ";
  applyAutomaticRules();
}

function applyAutomaticRules() {
  const lesson = currentLesson();
  const robotKey = keyOf(state.robot);
  const onTreasure = lesson.treasures.some((treasure) => sameCell(treasure, state.robot));

  if (onTreasure && state.rules.ifTreasure && !state.collected.has(robotKey)) {
    state.collected.add(robotKey);
    state.score += 10;
    elements.robotStatus.textContent = "たからをとって+10";
  }

  if (sameCell(state.robot, lesson.goalCell) && state.rules.ifGoal) {
    elements.robotStatus.textContent = "ゴールでクリア";
  }
}

function checkFinish() {
  const lesson = currentLesson();
  if (sameCell(state.robot, lesson.goalCell)) {
    elements.robotStatus.textContent = state.mode === "upper" && !state.rules.ifGoal
      ? "ゴールについた。つぎは「もし」をつかおう"
      : "クリア。かみよりはやい";
  } else {
    elements.robotStatus.textContent = "おわり。カードをなおしてもういちど";
  }
}

elements.runButton.addEventListener("click", runProgram);

elements.resetButton.addEventListener("click", () => {
  resetStage();
  renderStage();
  renderStats();
  elements.robotStatus.textContent = "スタートでまっている";
});

elements.undoButton.addEventListener("click", () => {
  if (state.running) return;
  state.program.pop();
  renderProgram();
  renderStats();
});

elements.clearButton.addEventListener("click", () => {
  if (state.running) return;
  state.program = [];
  resetStage();
  render();
});

elements.sampleButton.addEventListener("click", () => {
  if (state.running) return;
  state.program = [...currentLesson().sample];
  resetStage();
  renderProgram();
  renderStage();
  renderStats();
});

resetStage();
render();
