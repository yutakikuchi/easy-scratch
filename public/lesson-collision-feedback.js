export function showLowerCollision(root, collision) {
  const number = collision.commandIndex + 1;
  const title = `${number}まいめで かべに ぶつかったよ`;
  const feedback = root.querySelector('[data-picture-feedback]');
  if (feedback) {
    feedback.className = 'picture-run-feedback is-collision';
    feedback.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = title;
    const hint = document.createElement('span');
    hint.textContent = '赤い枠のかべを見て、うえへまわる命令を考えよう。カードをタップして直せます。';
    feedback.append(strong, hint);
  }
  root.querySelector(`[data-remove-picture-block="${collision.commandIndex}"]`)?.classList.add('is-collision');
  const result = root.querySelector('[data-picture-stage-result]');
  if (result) { result.textContent = title; result.classList.add('is-collision'); }
}

export function markUpperCollision(root, collision) {
  root.querySelectorAll('[data-grid-lab-remove], .upper-grid-lab-call').forEach(node => node.classList.remove('is-collision'));
  if (!collision) return;
  root.querySelector(`[data-grid-lab-remove="${collision.commandIndex}"]`)?.classList.add('is-collision');
  root.querySelectorAll('.upper-grid-lab-call')[collision.callIndex]?.classList.add('is-collision');
}
