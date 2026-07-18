export const directionLabels = {
  right: "右へ",
  up: "上へ",
  left: "左へ",
  down: "下へ"
};

export const lessonGoals = {
  rescue: "5つの移動ルールを3回くりかえし、1〜6を順番に取ろう",
  keyframe: "x・yの力を変えて、壁をこえるフリーキックを再現しよう",
  pattern: "二重のくりかえしで、六角形の花をかこう"
};

export function canvasSetup(root) {
  const canvas = root.querySelector("[data-upper-canvas]");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const density = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(rect.width * density);
  canvas.height = Math.round(rect.height * density);
  const context = canvas.getContext("2d");
  context.scale(density, density);
  context.lineCap = "round";
  context.lineJoin = "round";
  return { canvas, context, width: rect.width, height: rect.height };
}

export function canvasBounds(root) {
  const canvas = root.querySelector("[data-upper-canvas]");
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  return rect.width && rect.height ? { width: rect.width, height: rect.height } : null;
}

export function drawPath(context, points, color, dash, width) {
  if (points.length < 2) return;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.setLineDash(dash);
  context.beginPath();
  context.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.stroke();
  context.restore();
}

export function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function upperHeader(lesson, goal) {
  return `
    <header class="upper-picture-header">
      <button class="picture-back-button" type="button" data-picture-action="hub">もどる</button>
      <div class="upper-picture-title"><small>4〜6年生</small><h1>${escapeText(lesson.title)}</h1></div>
      <div class="upper-picture-goal"><span>きょうのゴール</span><strong>${escapeText(goal)}</strong></div>
      <img src="./assets/robot-mascot.png" alt="案内ロボット">
    </header>
  `;
}

const learningCopy = {
  rescue: [
    ["📍", "座標の差を読む", "次の番号までのx・yの差を読み、移動ルールに変えます。"],
    ["🧩", "5枚を1つのまとまりにする", "右・上・左・下を組み合わせ、同じ形の移動を作ります。"],
    ["🔁", "まとまりをくりかえす", "作った5枚のルールを3回使い、1〜6を順番に集めます。"]
  ],
  keyframe: [
    ["⚽", "結果から原因を考える", "シュート結果を見て、よこの力と上の力のどちらを直すか考えます。"],
    ["🔧", "自動修正ルールを作る", "手前に落ちた、壁に当たったなどの結果から次の修正を選びます。"],
    ["🏁", "軌道を再現する", "白い目標線に近づくように、力の値を少しずつ調整します。"]
  ],
  pattern: [
    ["📐", "変数で形を変える", "x・θ・nの数字を変え、線の長さ・角度・回数を調整します。"],
    ["⬡", "小さなルールで六角形を作る", "前へ進む、右へ曲がるを6回使って1つの形を作ります。"],
    ["🔁", "二重のくりかえしを使う", "できた六角形をさらにくりかえして、花の模様にします。"]
  ]
};

export function upperLearningFocus(lessonId) {
  const items = learningCopy[lessonId] ?? learningCopy.rescue;
  return `
    <section class="learning-focus" aria-label="この単元で学ぶこと">
      <details open>
        <summary>ここから学ぶこと</summary>
        <div class="learning-focus-panel">
          ${items.map(([icon, title, text]) => `<div class="learning-focus-item"><span aria-hidden="true">${icon}</span><strong>${escapeText(title)}</strong><p>${escapeText(text)}</p></div>`).join("")}
        </div>
      </details>
    </section>
  `;
}

export function stageLegend() {
  return `
    <div class="upper-path-legend" aria-label="線の見方">
      <span><i class="upper-goal-line"></i>目標</span>
      <span><i class="upper-current-line"></i>今の動き</span>
    </div>
  `;
}

export function feedbackMarkup(title, detail) {
  return `<div class="upper-run-feedback" data-upper-feedback aria-live="polite"><strong>${title}</strong><span>${detail}</span></div>`;
}
