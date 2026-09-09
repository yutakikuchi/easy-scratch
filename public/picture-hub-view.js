// Hub presentation is separate from lesson data and individual lesson workspaces.
export const hubCards = {
  'grid-paint': ['よけて、ぬろう', './assets/hub/grid.png'],
  jump: ['すすんで、ジャンプ！', './assets/picture-lessons/lower-jump-stage.webp', './assets/lower-mascot.png'],
  fish: ['おなじ うごきを くりかえそう', './assets/picture-lessons/lower-fish-stage.webp', './assets/picture-lessons/lower-fish.webp'],
  paint: ['しかくを かこう', './assets/picture-lessons/lower-paint-car.webp'],
  'grid-lab': ['値を変えて、同じルールを使う', './assets/hub/grid.png'],
  'sort-robot': ['条件と順番を考える', './assets/picture-lessons/sort-warehouse-stage.png', './assets/robot-mascot.png'],
  keyframe: ['x・yの力で軌道を作る', './assets/hub/kick.png'],
  pattern: ['二重ループで模様を描く', './assets/hub/pattern.png']
};

export function pictureHubMarkup(grade, lessons, escapeText) {
  const lower = grade === 'lower';
  return `
    <header class="picture-hub-header">
      <button class="picture-back-button" type="button" data-picture-action="home">TOPへ</button>
      <div><span>${lower ? '1〜3ねんせい' : '4〜6年生'}</span>
        <h1>${lower ? 'どれを うごかしてみる？' : 'どんな仕組みを作る？'}</h1>
        <p>${lower ? 'すきな あそびを タップしよう' : '4つの教材から、挑戦したいものを選ぼう'}</p>
      </div>
    </header>
    <section class="picture-lesson-grid" aria-label="絵を動かすレッスン">
      ${lessons.map((lesson, index) => {
        const [goal, image, sprite] = hubCards[lesson.id];
        return `<button class="picture-lesson-card" type="button" data-open-picture-lesson="${lesson.id}">
          <span class="picture-lesson-number">${index + 1}</span>
          <span class="picture-lesson-copy"><strong>${escapeText(lesson.title)}</strong><b>${goal}</b></span>
          <span class="hub-art hub-art-${lesson.id}" aria-hidden="true">
            <img src="${image}" alt="" decoding="async">
            ${sprite ? `<img class="hub-sprite" src="${sprite}" alt="" decoding="async">` : ''}
          </span>
        </button>`;
      }).join('')}
    </section>
    <aside class="picture-hub-takeaway"><strong>${lower ? 'つくる → ためす → くりかえす' : '作る → 実行する → 結果を見て直す'}</strong></aside>`;
}
