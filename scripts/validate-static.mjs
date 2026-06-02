import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "firebase.json",
  ".firebaserc",
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "public/firebase-init.js"
];

for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const html = await readFile(resolve(root, "public/index.html"), "utf8");
const css = await readFile(resolve(root, "public/styles.css"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");
const firebaseInit = await readFile(resolve(root, "public/firebase-init.js"), "utf8");
const firebaseConfig = await readFile(resolve(root, "firebase.json"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js"></script>'), "index.html must load app.js"],
  [html.includes('<script type="module" src="./firebase-init.js"></script>'), "index.html must load firebase-init.js"],
  [html.includes('<link rel="stylesheet" href="./styles.css">'), "index.html must load styles.css"],
  [css.includes(".stage-grid"), "styles.css must style the stage grid"],
  [js.includes("const lessons"), "app.js must define lesson data"],
  [js.includes("function runProgram"), "app.js must expose the program runner"],
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
