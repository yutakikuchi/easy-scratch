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
  "public/app.js",
  "public/calculation.js",
  "public/firebase-init.js",
  "public/assets/child-mascot.png",
  "public/assets/lower-mascot.png",
  "public/assets/robot-mascot.png"
];

for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const html = await readFile(resolve(root, "public/index.html"), "utf8");
const css = await readFile(resolve(root, "public/styles.css"), "utf8");
const programCss = await readFile(resolve(root, "public/program.css"), "utf8");
const calculationCss = await readFile(resolve(root, "public/calculation.css"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");
const firebaseInit = await readFile(resolve(root, "public/firebase-init.js"), "utf8");
const firebaseConfig = await readFile(resolve(root, "firebase.json"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js"></script>'), "index.html must load app.js"],
  [html.includes('<link rel="stylesheet" href="./calculation.css">'), "index.html must load calculation.css"],
  [html.includes('id="calculationPage"'), "index.html must include the calculation page"],
  [html.includes('id="programPage"'), "index.html must include the programming page"],
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
  [js.includes('from "./calculation.js"'), "app.js must load calculation data"],
  [js.includes("function resetCalculation"), "app.js must start both calculations"],
  [js.includes("function renderCalculationStatus"), "app.js must render human/program status"],
  [js.includes("function renderReflection"), "app.js must render the reflection activity"],
  [js.includes("function runProgram"), "app.js must keep the program runner"],
  [js.includes("activeCommandIndex"), "app.js must highlight the running command"],
  [js.includes("programWaiting"), "app.js must show that the program waits for the human"],
  [!js.includes("かみよりはやい"), "app.js must not compare the program with paper work"],
  [!js.includes("勝ち") && !js.includes("負け") && !js.includes("順位"), "app.js must not rank children"],
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
