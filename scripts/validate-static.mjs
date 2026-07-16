import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "firebase.json",
  ".firebaserc",
  "public/index.html",
  "public/styles.css",
  "public/program.css",
  "public/calculation.css",
  "public/home.css",
  "public/lower-machine.css",
  "public/rule-builder.css",
  "public/upper-machine.css",
  "public/picture-lessons.css",
  "public/app.js",
  "public/calculation.js",
  "public/lower-machine.js",
  "public/upper-machine.js",
  "public/picture-lessons-data.js",
  "public/picture-lessons.js",
  "public/firebase-init.js",
  "public/assets/child-mascot.png",
  "public/assets/home-sun.png",
  "public/assets/home-lower-calculation.png",
  "public/assets/home-lower-picture.png",
  "public/assets/home-upper-calculation.png",
  "public/assets/lower-mascot.png",
  "public/assets/robot-mascot.png",
  "public/assets/picture-lessons/lower-jump-stage.png",
  "public/assets/picture-lessons/lower-fish-stage.png",
  "public/assets/picture-lessons/lower-fish.png",
  "public/assets/picture-lessons/lower-paint-car.png",
  "public/assets/picture-lessons/upper-park-stage.png",
  "public/assets/picture-lessons/mock-lower-jump.png",
  "public/assets/picture-lessons/mock-lower-fish.png",
  "public/assets/picture-lessons/mock-lower-paint.png",
  "public/assets/picture-lessons/mock-upper-motion.png",
  "public/assets/picture-lessons/mock-upper-story.png",
  "public/assets/picture-lessons/mock-upper-coordinate.png"
];

for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const html = await readFile(resolve(root, "public/index.html"), "utf8");
const css = await readFile(resolve(root, "public/styles.css"), "utf8");
const programCss = await readFile(resolve(root, "public/program.css"), "utf8");
const calculationCss = await readFile(resolve(root, "public/calculation.css"), "utf8");
const homeCss = await readFile(resolve(root, "public/home.css"), "utf8");
const lowerMachineCss = await readFile(resolve(root, "public/lower-machine.css"), "utf8");
const ruleBuilderCss = await readFile(resolve(root, "public/rule-builder.css"), "utf8");
const upperMachineCss = await readFile(resolve(root, "public/upper-machine.css"), "utf8");
const pictureLessonsCss = await readFile(resolve(root, "public/picture-lessons.css"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");
const lowerMachineJs = await readFile(resolve(root, "public/lower-machine.js"), "utf8");
const upperMachineJs = await readFile(resolve(root, "public/upper-machine.js"), "utf8");
const pictureLessonsJs = await readFile(resolve(root, "public/picture-lessons.js"), "utf8");
const pictureLessonsData = await readFile(resolve(root, "public/picture-lessons-data.js"), "utf8");
const firebaseInit = await readFile(resolve(root, "public/firebase-init.js"), "utf8");
const firebaseConfig = await readFile(resolve(root, "firebase.json"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js"></script>'), "index.html must load app.js"],
  [html.includes('<link rel="stylesheet" href="./program.css?v=20260716a">'), "index.html must load the versioned program.css"],
  [html.includes('<link rel="stylesheet" href="./calculation.css">'), "index.html must load calculation.css"],
  [html.includes('<link rel="stylesheet" href="./home.css?v=20260716b">'), "index.html must load the versioned home.css"],
  [html.includes('<link rel="stylesheet" href="./lower-machine.css">'), "index.html must load lower-machine.css"],
  [html.includes('<link rel="stylesheet" href="./rule-builder.css">'), "index.html must load rule-builder.css"],
  [html.includes('<link rel="stylesheet" href="./upper-machine.css">'), "index.html must load upper-machine.css"],
  [html.includes('<link rel="stylesheet" href="./picture-lessons.css?v=20260716a">'), "index.html must load picture-lessons.css"],
  [html.includes('id="homePage"'), "index.html must include the grade and course TOP page"],
  [html.includes('id="homeIntroTitle"'), "TOP page must explain the programming learning goals first"],
  [html.includes('?grade=lower&amp;page=calculation'), "TOP page must link to lower-grade calculation"],
  [html.includes('?grade=upper&amp;page=program'), "TOP page must link to upper-grade picture programming"],
  [html.includes('id="calculationPage"'), "index.html must include the calculation page"],
  [html.includes('id="lowerMachinePage"'), "calculation page must include the lower-grade machine"],
  [html.includes('id="machineBuildButton"'), "lower-grade machine must build the rule first"],
  [html.includes('data-rule-token="circle"'), "rule builder must provide a draggable circle card"],
  [html.includes('data-rule-token="subtract"'), "lower-grade rule builder must include subtraction"],
  [html.includes('data-rule-slot="left"'), "rule builder must provide formula drop slots"],
  [html.includes('id="machineRunButton"'), "lower-grade machine must run the rule 100 times"],
  [html.includes('id="machineResultsList"'), "lower-grade machine must show the calculation list"],
  [html.includes('id="machineRepeatCount"'), "lower-grade machine must let the user select 1 to 100 runs"],
  [html.includes('id="upperMachinePage"'), "calculation page must include the upper-grade rule machine"],
  [html.includes('data-upper-rule-token="multiply"'), "upper-grade rule builder must include multiplication"],
  [html.includes('data-upper-rule-token="subtract"'), "upper-grade rule builder must include subtraction"],
  [html.includes('data-upper-rule-slot="operator2"'), "upper-grade rule builder must support a composite expression"],
  [html.includes('id="upperRepeatCount"'), "upper-grade machine must let the user select 1 to 100 runs"],
  [html.includes('id="upperResultsList"'), "upper-grade machine must show the calculation list"],
  [html.includes('id="programPage"'), "index.html must include the programming page"],
  [html.includes('id="pictureExperience"'), "programming page must include the six picture lessons"],
  [html.includes('id="calculationStartButton"'), "calculation page must include a start button"],
  [html.includes('id="calculationQuestions"'), "calculation page must include fixed questions"],
  [html.includes('id="programStatusSub"'), "calculation page must show the program waiting state"],
  [html.includes('id="reflectionPanel"'), "calculation page must include reflection time"],
  [html.includes('id="revealInsightButton"'), "reflection must reveal the explanation after discussion"],
  [html.includes('id="goToProgramButton"'), "calculation page must link to programming"],
  [html.includes('class="lesson-console"'), "programming controls must stay in one console"],
  [html.includes('class="command-palette"'), "programming page must include command cards"],
  [html.includes('class="program-panel"'), "programming page must include a program list"],
  [!html.includes('id="paperPage"'), "the old paper page must be removed"],
  [css.includes(".stage-character"), "styles.css must use a mascot image in the stage"],
  [!css.includes(".cell.robot::before"), "styles.css must not draw the mascot with CSS art"],
  [programCss.includes(".lesson-console"), "program.css must style the programming console"],
  [programCss.includes(".program-mascot"), "program.css must style the program mascot"],
  [calculationCss.includes(".calculation-workspace"), "calculation.css must style the calculation layout"],
  [calculationCss.includes(".program-status-card"), "calculation.css must distinguish program status"],
  [homeCss.includes(".home-grade-lower"), "home.css must distinguish the two grade choices"],
  [lowerMachineCss.includes(".machine-formula"), "lower-machine.css must style the reusable rule"],
  [ruleBuilderCss.includes(".rule-drop-slot"), "rule-builder.css must style the drag targets"],
  [upperMachineCss.includes(".upper-rule-builder"), "upper-machine.css must style the composite rule builder"],
  [pictureLessonsCss.includes(".picture-lesson-grid"), "picture-lessons.css must style the three lesson choices"],
  [!pictureLessonsCss.includes("linear-gradient"), "picture lessons must use source assets instead of gradient-drawn artwork"],
  [js.includes('from "./calculation.js"'), "app.js must load calculation data"],
  [js.includes('from "./lower-machine.js"'), "app.js must initialize the lower-grade calculation machine"],
  [js.includes('from "./upper-machine.js"'), "app.js must initialize the upper-grade calculation machine"],
  [js.includes('from "./picture-lessons.js"'), "app.js must initialize the picture lessons"],
  [js.includes("function resetCalculation"), "app.js must start both calculations"],
  [js.includes("function renderCalculationStatus"), "app.js must render human/program status"],
  [js.includes("function renderReflection"), "app.js must render the reflection activity"],
  [js.includes("function runProgram"), "app.js must keep the program runner"],
  [js.includes("activeCommandIndex"), "app.js must highlight the running command"],
  [js.includes("programWaiting"), "app.js must show that the program waits for the human"],
  [!js.includes("かみよりはやい"), "app.js must not compare the program with paper work"],
  [!js.includes("勝ち") && !js.includes("負け") && !js.includes("順位"), "app.js must not rank children"],
  [lowerMachineJs.includes("createRuleBatch(state.builtRule, state.repeatCount)"), "lower-grade machine must run the created rule for the selected count"],
  [lowerMachineJs.includes("pointerdown"), "lower-grade rule builder must support iPad pointer dragging"],
  [lowerMachineJs.includes("setInterval(appendVisibleRows"), "lower-grade machine must reveal results one after another"],
  [lowerMachineJs.includes("formula.textContent"), "lower-grade result list must show a normal numeric expression"],
  [lowerMachineJs.includes("MAX_RESULT_COUNT = 100"), "lower-grade machine must cap the selected run count at 100"],
  [upperMachineJs.includes("createCompositeRuleBatch(state.builtRule, state.repeatCount)"), "upper-grade machine must run the created composite rule"],
  [upperMachineJs.includes("pointerdown"), "upper-grade rule builder must support iPad pointer dragging"],
  [upperMachineJs.includes("formula.textContent"), "upper-grade result list must show a normal numeric expression"],
  [upperMachineJs.includes("MAX_RESULT_COUNT = 100"), "upper-grade machine must cap the selected run count at 100"],
  [pictureLessonsJs.includes("pointerdown"), "picture lesson cards must support iPad pointer dragging"],
  [pictureLessonsJs.includes("sameProgram"), "picture lessons must validate the rule before running it"],
  [pictureLessonsData.includes('title: "ジャンプぼうけん"'), "lower grade must include the jump adventure"],
  [pictureLessonsData.includes('title: "おさかなダンス"'), "lower grade must include the fish movement lesson"],
  [pictureLessonsData.includes('title: "おえかきカー"'), "lower grade must include the drawing car lesson"],
  [pictureLessonsData.includes('title: "モーションキャンバス"'), "upper grade must include motion canvas"],
  [pictureLessonsData.includes('title: "アニメーション絵本"'), "upper grade must include animation storybook"],
  [pictureLessonsData.includes('title: "座標アートラボ"'), "upper grade must include coordinate art"],
  [!html.includes("きぬた"), "the visible app must not include the old school name"],
  [firebaseInit.includes("summer-school-kinuta"), "firebase-init.js must target the Firebase project"],
  [firebaseInit.includes("getAnalytics"), "firebase-init.js must initialize Analytics"],
  [firebaseConfig.includes("no-cache, no-store, max-age=0, must-revalidate"), "firebase.json must disable caching"],
  [firebaseConfig.includes('"key": "Pragma"'), "firebase.json must include Pragma no-cache"],
  [firebaseConfig.includes('"key": "Expires"'), "firebase.json must include Expires header"]
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Static app validation passed");
