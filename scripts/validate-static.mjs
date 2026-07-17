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
  "public/picture-lessons-effects.css",
  "public/picture-loop-success.css",
  "public/upper-picture-lessons.css",
  "public/upper-picture-soccer.css",
  "public/upper-free-kick-program.css",
  "public/lower-grid-paint.css",
  "public/site-footer.css",
  "public/teacher.css",
  "public/teacher.html",
  "public/app.js",
  "public/calculation.js",
  "public/lower-machine.js",
  "public/upper-machine.js",
  "public/picture-lessons-data.js",
  "public/picture-lessons.js",
  "public/upper-picture-lesson-logic.js",
  "public/upper-free-kick-program.js",
  "public/upper-picture-lessons.js",
  "public/lower-grid-paint.js",
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
  "public/assets/picture-lessons/mock-lower-grid-paint.png",
  "public/assets/picture-lessons/mock-upper-motion.png",
  "public/assets/picture-lessons/mock-upper-story.png",
  "public/assets/picture-lessons/mock-upper-coordinate.png",
  "public/assets/picture-lessons/mock-upper-rescue.png",
  "public/assets/picture-lessons/mock-upper-keyframe.png",
  "public/assets/picture-lessons/mock-upper-free-kick.png",
  "public/assets/picture-lessons/mock-upper-pattern.png"
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
const pictureLessonsEffectsCss = await readFile(resolve(root, "public/picture-lessons-effects.css"), "utf8");
const pictureLoopSuccessCss = await readFile(resolve(root, "public/picture-loop-success.css"), "utf8");
const upperPictureLessonsCss = await readFile(resolve(root, "public/upper-picture-lessons.css"), "utf8");
const upperPictureSoccerCss = await readFile(resolve(root, "public/upper-picture-soccer.css"), "utf8");
const upperFreeKickProgramCss = await readFile(resolve(root, "public/upper-free-kick-program.css"), "utf8");
const lowerGridPaintCss = await readFile(resolve(root, "public/lower-grid-paint.css"), "utf8");
const siteFooterCss = await readFile(resolve(root, "public/site-footer.css"), "utf8");
const teacherHtml = await readFile(resolve(root, "public/teacher.html"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");
const lowerMachineJs = await readFile(resolve(root, "public/lower-machine.js"), "utf8");
const upperMachineJs = await readFile(resolve(root, "public/upper-machine.js"), "utf8");
const pictureLessonsJs = await readFile(resolve(root, "public/picture-lessons.js"), "utf8");
const pictureLessonsData = await readFile(resolve(root, "public/picture-lessons-data.js"), "utf8");
const upperPictureLessonLogic = await readFile(resolve(root, "public/upper-picture-lesson-logic.js"), "utf8");
const upperFreeKickProgramJs = await readFile(resolve(root, "public/upper-free-kick-program.js"), "utf8");
const upperPictureLessonsJs = await readFile(resolve(root, "public/upper-picture-lessons.js"), "utf8");
const rescueRunBlock = upperPictureLessonsJs.slice(
  upperPictureLessonsJs.indexOf("async function runRescue"),
  upperPictureLessonsJs.indexOf("async function runKeyframe")
);
const firebaseInit = await readFile(resolve(root, "public/firebase-init.js"), "utf8");
const firebaseConfig = await readFile(resolve(root, "firebase.json"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js?v=20260717o"></script>'), "index.html must load the versioned app.js"],
  [html.includes('<link rel="stylesheet" href="./program.css?v=20260716a">'), "index.html must load the versioned program.css"],
  [html.includes('<link rel="stylesheet" href="./calculation.css">'), "index.html must load calculation.css"],
  [html.includes('<link rel="stylesheet" href="./home.css?v=20260717c">'), "index.html must load the versioned home.css"],
  [html.includes('<link rel="stylesheet" href="./lower-machine.css">'), "index.html must load lower-machine.css"],
  [html.includes('<link rel="stylesheet" href="./rule-builder.css">'), "index.html must load rule-builder.css"],
  [html.includes('<link rel="stylesheet" href="./upper-machine.css">'), "index.html must load upper-machine.css"],
  [html.includes('<link rel="stylesheet" href="./picture-lessons.css?v=20260717f">'), "index.html must load the versioned picture-lessons.css"],
  [html.includes('<link rel="stylesheet" href="./picture-lessons-effects.css?v=20260717m">'), "index.html must load picture lesson effects"],
  [html.includes('<link rel="stylesheet" href="./picture-loop-success.css?v=20260717o">'), "index.html must load compact repeated-success styles"],
  [html.includes('<link rel="stylesheet" href="./upper-picture-lessons.css?v=20260717o">'), "index.html must load upper picture lesson styles"],
  [html.includes('<link rel="stylesheet" href="./upper-picture-soccer.css?v=20260717n">'), "index.html must load the free-kick field styles"],
  [html.includes('<link rel="stylesheet" href="./upper-free-kick-program.css?v=20260717o">'), "index.html must load the free-kick program styles"],
  [html.includes('<link rel="stylesheet" href="./lower-grid-paint.css?v=20260717n">'), "index.html must load the grid-paint lesson styles"],
  [html.includes('<link rel="stylesheet" href="./site-footer.css?v=20260717n">'), "index.html must load the shared footer styles"],
  [html.includes("はじめてのプログラミングにちょうせん"), "TOP page must introduce the first programming challenge"],
  [html.includes('id="homePage"'), "index.html must include the grade and course TOP page"],
  [html.includes('id="homeIntroTitle"'), "TOP page must explain the programming learning goals first"],
  [html.includes("じぶんで ルールを つくろう"), "TOP page must explain that children create their own rules"],
  [html.includes("つくった ルールを なんども つかおう"), "TOP page must explain rule reuse"],
  [html.includes("しくみに すると、かんたん！"), "TOP page must connect reusable rules to easy mechanisms"],
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
  [pictureLessonsEffectsCss.includes(".picture-jump-hit"), "jump lesson must style stomp reaction messages"],
  [pictureLessonsEffectsCss.includes(".picture-goal-summary"), "picture lessons must display a prominent goal card"],
  [pictureLessonsEffectsCss.includes(".picture-path-legend"), "movement stages must explain goal and current route colors"],
  [pictureLessonsEffectsCss.includes(".picture-success-overlay"), "correct picture rules must show a full-screen success animation"],
  [pictureLessonsEffectsCss.includes("100% { opacity: 1; transform: scale(1) rotate(0); }"), "the centered success message must stay visible until the overlay closes"],
  [upperPictureLessonsCss.includes(".upper-number-control"), "upper picture lessons must style large numeric controls"],
  [upperPictureLessonsCss.includes(".upper-path-legend"), "upper picture lessons must explain target and current paths"],
  [js.includes('from "./calculation.js"'), "app.js must load calculation data"],
  [js.includes('from "./lower-machine.js"'), "app.js must initialize the lower-grade calculation machine"],
  [js.includes('from "./upper-machine.js"'), "app.js must initialize the upper-grade calculation machine"],
  [js.includes('from "./picture-lessons.js?v=20260717o"'), "app.js must initialize the versioned picture lessons"],
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
  [pictureLessonsJs.includes("getPictureProgramStatus"), "picture lessons must classify runnable and correct rules"],
  [pictureLessonsJs.includes("これで ただしいかな？"), "incorrect picture rules must show a prominent review question after running"],
  [pictureLessonsJs.includes('data-picture-success-overlay'), "picture lessons must render a success announcement overlay"],
  [pictureLessonsJs.includes("showSuccessOverlay({ compact: repeating })"), "correct picture rules must trigger the appropriate success announcement"],
  [pictureLessonsJs.includes("getJumpRoute"), "jump guide and animation must share one route"],
  [pictureLessonsJs.includes("getMovementRoute"), "movement guide and animation must use the same program route"],
  [pictureLessonsJs.includes("addGentleCurve"), "the fish guide and animation must use a gentle shared curve"],
  [pictureLessonsJs.includes('type === "fish"\n      ? Math.max(1200, state.program.length * 760)'), "the fish success result must appear promptly after the curved animation"],
  [pictureLessonsJs.includes("getPaintRoute"), "paint drawing and car animation must share the card-built route"],
  [pictureLessonsJs.includes('["jump", "fish", "paint", "motion", "grid-paint"]'), "movement lessons must display the same goal and current route legend"],
  [pictureLessonsJs.includes('data-picture-action="repeat-run"'), "picture lessons must provide repeat execution beside the run button"],
  [pictureLessonsJs.includes("stopRepeating"), "repeat execution must stop from the same control"],
  [pictureLessonsEffectsCss.includes("white-space: nowrap"), "the full-screen success message must stay on one line"],
  [pictureLessonsJs.includes('"#ee4057"'), "current movement route must be drawn in red"],
  [pictureLessonsJs.includes("イタイ！"), "jump enemies must react whenever a stomp action runs"],
  [pictureLessonsJs.includes("ゴールの完成イメージ"), "picture lessons must show a visual goal preview"],
  [pictureLessonsData.includes('title: "ジャンプぼうけん"'), "lower grade must include the jump adventure"],
  [pictureLessonsData.includes('title: "おさかなダンス"'), "lower grade must include the fish movement lesson"],
  [pictureLessonsData.includes('title: "おえかきカー"'), "lower grade must include the drawing car lesson"],
  [pictureLessonsData.indexOf('id: "fish"') < pictureLessonsData.indexOf('id: "grid-paint"') && pictureLessonsData.indexOf('id: "grid-paint"') < pictureLessonsData.indexOf('id: "paint"'), "grid painting must be the third lower-grade lesson"],
  [lowerGridPaintCss.includes(".picture-stage-grid-paint"), "the grid-paint lesson must show a graph-paper stage"],
  [lowerGridPaintCss.includes("grid-template-columns: repeat(2, minmax(0, 1fr))"), "the four lower-grade lessons must use a two-by-two grid"],
  [pictureLessonsData.includes('title: "座標レスキュー"'), "upper grade must include coordinate rescue"],
  [pictureLessonsData.includes('title: "ロボット・フリーキック"'), "upper grade must include the free-kick trajectory lesson"],
  [pictureLessonsData.includes('title: "パターンアートラボ"'), "upper grade must include reusable pattern art"],
  [upperPictureLessonLogic.includes("createRescueRoute"), "coordinate rescue must have one shared route calculation"],
  [upperPictureLessonsJs.includes("rescueInitialValues"), "coordinate rescue must start from non-answer values for trial and error"],
  [upperPictureLessonsJs.includes("さいしょの数は正解ではありません"), "coordinate rescue must explain that learners need to adjust the initial values"],
  [upperPictureLessonsJs.includes("じゅんばんのヒント"), "coordinate rescue may hint the order without revealing the answer values"],
  [upperPictureLessonsJs.includes("value: state.rescue.values[direction]"), "the rescue order hint must preserve the learner's current non-answer values"],
  [upperPictureLessonsJs.includes("drawRescueGrid"), "coordinate rescue must draw an explicit numbered coordinate grid"],
  [!upperPictureLessonsJs.includes("ビーコン") && !pictureLessonsData.includes("ビーコン"), "coordinate rescue must call its checkpoints numbers instead of beacons"],
  [upperPictureLessonsJs.includes("1マス = 20"), "coordinate rescue must explain the distance represented by one grid cell"],
  [upperPictureLessonsJs.includes("state.rescue.program.push({ direction, value: state.rescue.values[direction] })"), "coordinate rescue cards must save their own value when added"],
  [upperPictureLessonsJs.includes("次のシュートの力") && upperPictureLessonsJs.includes("よこの力") && upperPictureLessonsJs.includes("うえの力"), "soccer must teach x and y force instead of editing trajectory points"],
  [upperPictureLessonsJs.includes("upper-soccer-ball"), "the keyframe lesson must animate a soccer ball instead of the robot"],
  [upperPictureLessonsJs.includes("time: point.time"), "the soccer animation must preserve calculated flight time"],
  [upperPictureLessonsJs.includes("Number.isFinite(duration)"), "picture animations must recover from an invalid duration instead of locking controls"],
  [upperPictureLessonsJs.includes("最初は1回シュートすることだけできます"), "free-kick learning must begin with one intentionally limited action"],
  [upperPictureLessonsJs.includes("自分で1つ選ぶと、次の力と自動修正ルールになります"), "learners must choose their own correction after observing a result"],
  [upperPictureLessonsJs.includes("スタートはロボットの足元に固定"), "every soccer kick must start at the robot's foot"],
  [!upperPictureLessonsJs.includes("sample-keyframe") && upperPictureLessonsJs.includes("apply-kick-correction"), "the soccer lesson must not reveal an answer rule before learner correction"],
  [upperPictureLessonsCss.includes(".upper-soccer-goal"), "the soccer trajectory stage must show a visible goal"],
  [upperPictureSoccerCss.includes(".upper-free-kick-wall"), "the free-kick stage must show a defensive wall"],
  [!upperPictureSoccerCss.includes(".upper-soccer-field-lines::before") && !upperPictureSoccerCss.includes(".upper-soccer-field-lines::after"), "the soccer pitch must not draw broken white area lines"],
  [upperPictureLessonsJs.includes("ここは1つの共有ルールです"), "pattern controls must explain why one edit changes every repetition"],
  [upperPictureLessonLogic.includes("createKickPath"), "soccer line and animation must share one force-based path calculation"],
  [upperFreeKickProgramJs.includes("classifyKickOutcome") && upperFreeKickProgramJs.includes("applyKickProgram"), "the soccer program must classify results and apply learner-created rules"],
  [upperFreeKickProgramJs.includes("Math.min(10"), "automatic free-kick correction must stop after at most ten attempts"],
  [upperFreeKickProgramCss.includes(".upper-kick-correction"), "the free-kick correction choices must have a dedicated responsive layout"],
  [upperPictureLessonLogic.includes("createPatternRoute"), "pattern line and animation must share one rule calculation"],
  [upperPictureLessonsJs.includes("createRescueRoute(state.rescue.program, state.rescue.values)"), "coordinate rescue must draw and animate the entered rule"],
  [upperPictureLessonsJs.includes("createKickPath(state.keyframe.force"), "soccer lesson must draw and animate the entered x and y forces"],
  [upperPictureLessonsJs.includes("createPatternRoute(state.pattern)"), "pattern lesson must draw and animate the entered variables"],
  [upperPictureLessonsJs.includes('data-upper-action="repeat-run"'), "all upper lessons must provide repeat execution"],
  [upperPictureLessonsJs.includes("runRepeatedly") && upperPictureLessonsJs.includes("stopRepeating"), "upper repeat execution must run until the learner stops it"],
  [upperPictureLessonsJs.includes('type="number"'), "upper picture lessons must accept numeric values"],
  [rescueRunBlock.includes("canvasBounds(root)") && !rescueRunBlock.includes("canvasSetup(root)"), "rescue animation must not clear the drawn paths before it runs"],
  [pictureLessonsJs.includes("showSuccessOverlay({ compact: repeating })"), "repeated lower lessons must show compact success near the stage goal"],
  [pictureLoopSuccessCss.includes(".picture-loop-success"), "compact repeated success must be styled near the goal instead of covering the screen"],
  [html.includes("講師の方へ") && html.includes("GitHubで連絡"), "every lesson page must link to the instructor guide and GitHub contact"],
  [html.includes("© 2026 yutakikuchi") && html.includes("この教材は授業で再利用できます"), "the page footer must identify the creator and explain reuse"],
  [teacherHtml.includes("作成者 yutakikuchi") && teacherHtml.includes("ページは都度ご利用ください") && teacherHtml.includes("GitHubで一度ご連絡ください"), "the instructor guide must explain creator, current-page use, and contact"],
  [siteFooterCss.includes(".site-footer"), "the shared copyright and reuse notice must be styled"],
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
