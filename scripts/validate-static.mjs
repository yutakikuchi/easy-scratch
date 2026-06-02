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
  "public/app.js",
  "public/firebase-init.js"
];

for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const html = await readFile(resolve(root, "public/index.html"), "utf8");
const css = await readFile(resolve(root, "public/styles.css"), "utf8");
const programCss = await readFile(resolve(root, "public/program.css"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");
const firebaseInit = await readFile(resolve(root, "public/firebase-init.js"), "utf8");
const firebaseConfig = await readFile(resolve(root, "firebase.json"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js"></script>'), "index.html must load app.js"],
  [html.includes('<script type="module" src="./firebase-init.js"></script>'), "index.html must load firebase-init.js"],
  [html.includes('<link rel="stylesheet" href="./styles.css">'), "index.html must load styles.css"],
  [html.includes('<link rel="stylesheet" href="./program.css">'), "index.html must load program.css"],
  [html.includes('id="paperPage"'), "index.html must include a paper page"],
  [html.includes('id="programPage"'), "index.html must include a programming page"],
  [html.includes('class="lesson-console"'), "index.html must keep programming controls in one console"],
  [html.includes('id="openCommandButton"'), "index.html must include a command popup trigger"],
  [html.includes('id="openProgramButton"'), "index.html must include a program popup trigger"],
  [css.includes(".stage-grid"), "styles.css must style the stage grid"],
  [css.includes(".cell.start"), "styles.css must style the start cell"],
  [css.includes(".cell.goal"), "styles.css must style the goal cell"],
  [programCss.includes('body[data-page="program"] .app-shell'), "program.css must keep the program page in one view"],
  [programCss.includes(".popup-panel"), "program.css must style command and program popups"],
  [programCss.includes(".lesson-console"), "program.css must style the programming console"],
  [js.includes("const lessons"), "app.js must define lesson data"],
  [js.includes("function runProgram"), "app.js must expose the program runner"],
  [js.includes("function setPage"), "app.js must support paper/program page switching"],
  [js.includes("function openPopup"), "app.js must support popup panels"],
  [js.includes("commandIcons"), "app.js must render large command button icons"],
  [js.includes('"スタート"'), "app.js must label the start cell in Japanese"],
  [js.includes('"ゴール"'), "app.js must label the goal cell in Japanese"],
  [js.includes("cell-icon"), "app.js must render start and goal icons"],
  [!js.includes('mark = "S"') && !js.includes('mark = "G"'), "app.js must not render S/G stage labels"],
  [firebaseInit.includes("summer-school-kinuta"), "firebase-init.js must target the Firebase project"],
  [firebaseInit.includes("getAnalytics"), "firebase-init.js must initialize Analytics"],
  [
    firebaseConfig.includes("no-cache, no-store, max-age=0, must-revalidate"),
    "firebase.json must disable browser and CDN caching"
  ],
  [firebaseConfig.includes('"key": "Pragma"'), "firebase.json must include Pragma no-cache header"],
  [firebaseConfig.includes('"key": "Expires"'), "firebase.json must include Expires header"]
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Static app validation passed");
