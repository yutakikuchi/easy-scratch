import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "firebase.json",
  ".firebaserc",
  "public/index.html",
  "public/styles.css",
  "public/app.js"
];

for (const file of requiredFiles) {
  await access(resolve(root, file));
}

const html = await readFile(resolve(root, "public/index.html"), "utf8");
const css = await readFile(resolve(root, "public/styles.css"), "utf8");
const js = await readFile(resolve(root, "public/app.js"), "utf8");

const checks = [
  [html.includes('<script type="module" src="./app.js"></script>'), "index.html must load app.js"],
  [html.includes('<link rel="stylesheet" href="./styles.css">'), "index.html must load styles.css"],
  [css.includes(".stage-grid"), "styles.css must style the stage grid"],
  [js.includes("const lessons"), "app.js must define lesson data"],
  [js.includes("function runProgram"), "app.js must expose the program runner"]
];

const failures = checks.filter(([passed]) => !passed).map(([, message]) => message);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Static app validation passed");
