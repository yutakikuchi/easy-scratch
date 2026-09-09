export function createPictureSuccessOverlay({ getGrade }) {
  let dismissTimer = 0;

  function dismiss(overlay) {
    window.clearTimeout(dismissTimer);
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
    overlay.tabIndex = -1;
  }

  function enableTapDismiss(overlay) {
    overlay.tabIndex = -1;
    overlay.addEventListener("pointerup", () => dismiss(overlay));
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") dismiss(overlay);
    });
  }

  function ensure(titleText = "") {
    let overlay = document.querySelector("[data-picture-success-overlay]");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "picture-success-overlay";
      overlay.dataset.pictureSuccessOverlay = "";
      overlay.setAttribute("role", "alert");
      overlay.setAttribute("aria-live", "assertive");
      overlay.setAttribute("aria-hidden", "true");
      overlay.setAttribute("aria-label", "せいかい。タップでとじる");
      overlay.innerHTML = `
        <div class="picture-success-message">
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" focusable="false">
              <path d="M5 12.5 9.5 17 19 7" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <strong data-picture-success-title></strong>
          <small data-picture-success-detail></small>
          <em>タップで とじる</em>
        </div>
      `;
      enableTapDismiss(overlay);
      document.body.append(overlay);
    }
    const lowerGrade = getGrade() === "lower";
    const title = overlay.querySelector("[data-picture-success-title]");
    const detail = overlay.querySelector("[data-picture-success-detail]");
    if (title) title.textContent = titleText || (lowerGrade ? "せいかい！" : "正解！");
    if (detail) detail.textContent = lowerGrade ? "ルールどおりに うごいたよ" : "ルールどおりに動きました";
    return overlay;
  }

  function show({ title = "" } = {}) {
    const overlay = ensure(title);
    window.clearTimeout(dismissTimer);
    overlay.classList.remove("is-visible");
    void overlay.offsetWidth;
    overlay.setAttribute("aria-hidden", "false");
    overlay.tabIndex = 0;
    overlay.classList.add("is-visible");
    dismissTimer = window.setTimeout(() => dismiss(overlay), 12000);
  }

  function reset() {
    window.clearTimeout(dismissTimer);
    const overlay = document.querySelector("[data-picture-success-overlay]");
    if (overlay) dismiss(overlay);
  }

  return { reset, show };
}
