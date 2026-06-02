const lessons = {
  lower: {
    title: "紙の道順を命令にしよう",
    paperTitle: "方眼紙に矢印と色をかこう",
    paperWorkCount: 18,
    paperPoint: "何度も書くのはたいへん",
    goal: "紙で書いた矢印と色ぬりを、命令カードに置き換えます。スタートを押すと同じ作業を一気に実行できます。",
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
      "方眼紙のスタートからゴールまで矢印を1つずつ書く",
      "同じ道順をもう一度書いて、手でくり返す大変さを感じる",
      "指定されたマスを1つずつ色でぬる",
      "紙の手順を命令カードに置き換える"
    ],
    commands: [
      { id: "right", label: "右へ1マス", kind: "move", hint: "矢印を1つ書く代わり" },
      { id: "left", label: "左へ1マス", kind: "move", hint: "戻る動き" },
      { id: "up", label: "上へ1マス", kind: "move", hint: "矢印を1つ書く代わり" },
      { id: "down", label: "下へ1マス", kind: "move", hint: "矢印を1つ書く代わり" },
      { id: "paint", label: "色をぬる", kind: "action", hint: "マスをぬる作業" },
      { id: "say", label: "話す", kind: "action", hint: "お話にする" }
    ],
    sample: ["right", "right", "paint", "right", "up", "up", "paint", "right", "right", "up"]
  },
  upper: {
    title: "くり返しと条件で迷路を自動化しよう",
    paperTitle: "紙の迷路で点数を手で記録しよう",
    paperWorkCount: 32,
    paperPoint: "判断を毎回するのはたいへん",
    goal: "紙で行った長い道順、点数計算、壁の判断を、くり返しと条件の命令に置き換えます。",
    rows: 6,
    cols: 10,
    start: { row: 4, col: 1 },
    goalCell: { row: 1, col: 8 },
    paintTargets: [],
    walls: [
      { row: 3, col: 3 },
      { row: 2, col: 3 },
      { row: 2, col: 6 },
      { row: 3, col: 6 },
      { row: 4, col: 6 }
    ],
    treasures: [
      { row: 4, col: 4 },
      { row: 1, col: 5 }
    ],
    paperSteps: [
      "方眼紙の迷路に、ゴールまでの矢印を1つずつ書く",
      "宝を取ったら点数を手で足す",
      "壁に当たったら戻る、という判断を毎回書く",
      "同じ矢印が続くところを「くり返し」に置き換える"
    ],
    commands: [
      { id: "right", label: "右へ1マス", kind: "move", hint: "矢印1つ" },
      { id: "up", label: "上へ1マス", kind: "move", hint: "矢印1つ" },
      { id: "repeatRight3", label: "右へ3回", kind: "logic", hint: "右・右・右を短く" },
      { id: "repeatUp2", label: "上へ2回", kind: "logic", hint: "上・上を短く" },
      { id: "ifTreasure", label: "もし宝なら+10", kind: "logic", hint: "点数を自動で足す" },
      { id: "ifWall", label: "もし壁なら戻る", kind: "logic", hint: "判断を自動にする" },
      { id: "ifGoal", label: "もしゴールならクリア", kind: "logic", hint: "ゴール判定" },
      { id: "down", label: "下へ1マス", kind: "move", hint: "回り道に使う" }
    ],
    sample: ["ifWall", "ifTreasure", "ifGoal", "repeatRight3", "repeatUp2", "up", "repeatRight3", "right"]
  }
};

const state = {
  mode: "lower",
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
  modeButtons: document.querySelectorAll(".mode-button"),
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

function setMode(mode) {
  state.mode = mode;
  state.program = [];
  resetStage();
  render();
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
  elements.lessonTitle.textContent = lesson.title;
  elements.paperTitle.textContent = lesson.paperTitle;
  elements.paperWorkCount.textContent = `${lesson.paperWorkCount}回`;
  elements.paperPoint.textContent = lesson.paperPoint;
  elements.programGoal.textContent = lesson.goal;

  elements.paperSteps.innerHTML = "";
  for (const step of lesson.paperSteps) {
    const item = document.createElement("li");
    item.textContent = step;
    elements.paperSteps.append(item);
  }

  elements.modeButtons.forEach((button) => {
    const active = button.dataset.mode === state.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });

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
      node.setAttribute("aria-label", `行${row + 1} 列${col + 1}`);

      if (sameCell(cell, lesson.start)) node.classList.add("start");
      if (sameCell(cell, lesson.goalCell)) node.classList.add("goal");
      if (lesson.walls.some((wall) => sameCell(cell, wall))) node.classList.add("wall");

      const treasureKey = keyOf(cell);
      if (lesson.treasures.some((treasure) => sameCell(cell, treasure)) && !state.collected.has(treasureKey)) {
        node.classList.add("treasure");
      }

      if (state.painted.has(treasureKey)) node.classList.add("painted");
      if (sameCell(cell, state.robot)) node.classList.add("robot");
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
    empty.textContent = "紙に書いた手順を命令カードで並べよう";
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
  elements.commandCount.textContent = `${state.program.length}枚`;
  elements.expandedCount.textContent = `${expanded.filter((command) => isMovement(command) || command === "paint").length}回`;
  elements.scoreStatus.textContent = `スコア ${state.score}`;
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
  elements.robotStatus.textContent = "実行中";
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
    elements.robotStatus.textContent = "壁の判断を自動化";
    return;
  }

  if (command === "ifTreasure") {
    state.rules.ifTreasure = true;
    elements.robotStatus.textContent = "点数計算を自動化";
    return;
  }

  if (command === "ifGoal") {
    state.rules.ifGoal = true;
    elements.robotStatus.textContent = "ゴール判定を自動化";
    return;
  }

  if (command === "paint") {
    state.painted.add(keyOf(state.robot));
    elements.robotStatus.textContent = "色をぬった";
    return;
  }

  if (command === "say") {
    elements.robotStatus.textContent = "こんにちは、と話した";
    return;
  }

  if (!isMovement(command)) return;

  const next = nextPosition(command);
  if (!isInside(next)) {
    elements.robotStatus.textContent = "外には出られない";
    return;
  }

  if (isWall(next)) {
    if (state.rules.ifWall) {
      state.robot = { ...currentLesson().start };
      elements.robotStatus.textContent = "壁なのでスタートへ戻った";
    } else {
      elements.robotStatus.textContent = "壁に当たった";
    }
    return;
  }

  state.robot = next;
  elements.robotStatus.textContent = "1マス進んだ";
  applyAutomaticRules();
}

function applyAutomaticRules() {
  const lesson = currentLesson();
  const robotKey = keyOf(state.robot);
  const onTreasure = lesson.treasures.some((treasure) => sameCell(treasure, state.robot));

  if (onTreasure && state.rules.ifTreasure && !state.collected.has(robotKey)) {
    state.collected.add(robotKey);
    state.score += 10;
    elements.robotStatus.textContent = "宝を取って+10";
  }

  if (sameCell(state.robot, lesson.goalCell) && state.rules.ifGoal) {
    elements.robotStatus.textContent = "ゴール判定でクリア";
  }
}

function checkFinish() {
  const lesson = currentLesson();
  if (sameCell(state.robot, lesson.goalCell)) {
    elements.robotStatus.textContent = state.mode === "upper" && !state.rules.ifGoal
      ? "ゴールに着いた。次は条件カードを使おう"
      : "クリア。紙より速くできた";
  } else {
    elements.robotStatus.textContent = "実行完了。命令を直してもう一度試そう";
  }
}

elements.modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

elements.runButton.addEventListener("click", runProgram);

elements.resetButton.addEventListener("click", () => {
  resetStage();
  renderStage();
  renderStats();
  elements.robotStatus.textContent = "スタートで待機中";
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
