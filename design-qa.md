# Design QA — iPad向けeasy-scratch全体

## Comparison target

- Source visual truth:
  - `docs/mockups/2026-07-16-independent-pages/home-selection-reference.png`
  - `docs/mockups/2026-07-16-independent-pages/upper-grade-calculation-composite-rule-v3.png`
  - `docs/mockups/2026-07-16-picture-lessons/lower-jump-adventure.png`
  - `docs/mockups/2026-07-16-picture-lessons/lower-fish-dance.png`
  - `docs/mockups/2026-07-16-picture-lessons/lower-paint-car.png`
  - `docs/mockups/2026-07-16-picture-lessons/upper-motion-canvas.png`
  - `docs/mockups/2026-07-16-picture-lessons/upper-storyboard.png`
  - `docs/mockups/2026-07-16-picture-lessons/upper-coordinate-lab.png`
  - `/var/folders/1t/wt610wqx641d32_rb11smv8c0000gn/T/codex-clipboard-7cc62e06-b629-4e81-8331-da6c6dd546ed.png`
- Rendered implementation:
  - `docs/audits/2026-07-16-ui-flow/19-home-wide-final.jpg`
  - `docs/audits/2026-07-16-ui-flow/11-home-ipad-768x1024-after.jpg`
  - `docs/audits/2026-07-16-ui-flow/20-lower-final-12-results.jpg`
  - `docs/audits/2026-07-16-ui-flow/14-upper-complex-100-results-top.jpg`
  - `docs/audits/2026-07-16-ui-flow/15-upper-complex-100-results-list.jpg`
  - `docs/audits/2026-07-16-picture-lessons/lower-jump-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/lower-fish-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/lower-paint-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/upper-motion-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/upper-story-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/upper-coordinate-ipad-landscape-final.png`
  - `docs/audits/2026-07-16-picture-lessons/upper-hub-ipad-portrait-final.png`
- Viewports:
  - iPad landscape: 1024 × 768
  - Wide iPad landscape reproduction: 1365 × 768
  - iPad portrait: 768 × 1024 and 820 × 1180
- States:
  - TOP: initial grade/course selection
  - Lower calculation: `○ − ▲ ＝ □`, 12 runs complete
  - Upper calculation: `A × B − C ＝ D`, 100 runs complete
  - Lower picture movement: jump adventure, fish dance, and paint car sample rules complete
  - Upper picture movement: motion canvas, animation storybook, and coordinate art sample rules complete
- Full-view comparison evidence:
  - `docs/audits/2026-07-16-ui-flow/21-upper-design-comparison.jpg`
- Focused-region comparison evidence:
  - `docs/audits/2026-07-16-ui-flow/15-upper-complex-100-results-list.jpg` shows the expanded 100-row list and large ordinary numeric expressions.
  - `docs/audits/2026-07-16-ui-flow/11-home-ipad-768x1024-after.jpg` shows the portrait-specific two-row grade/course composition.

## Findings

- No actionable P0, P1, or P2 findings remain.

## Required fidelity surfaces

- Fonts and typography: The existing rounded Japanese font stack and navy heavy headings match the supplied visual language. Hiragana is retained for lower grades; kanji is used for upper grades. Primary labels do not clip at tested iPad sizes.
- Spacing and layout rhythm: The landscape TOP has measurable clearance between the grade numeral and first course card. Portrait changes from a cramped three-column band to a grade header plus two equal course cards. Calculation and movement controls fit without horizontal overflow.
- Colors and visual tokens: Yellow/coral remain the lower-grade palette; sky blue/blue remain the upper-grade palette. Green communicates a built/runnable rule, and purple/blue summarize high-grade results.
- Image quality and asset fidelity: Existing child, robot, sun, calculator, and picture raster assets are reused. Six selected lesson mockups are used as the lesson-selection previews, while stage artwork is supplied as raster assets. No placeholder asset is visible.
- Copy and content: TOP starts with four independent destinations. Both calculation lessons begin by creating a rule, explain reuse, offer addition/subtraction (plus multiplication for upper grades), and show actual run time, correct count, mistakes, and result rows. The upper course and lesson are named `絵を動かす` / `絵を動かそう` rather than `迷路を動かす`.
- Interaction and accessibility: Calculation and picture-rule cards support touch/mouse pointer drag, native drag, tapping, and keyboard activation. Filled slots can be removed. Selects expose 1–100 choices, default to 100, and use iPad-sized controls. Buttons retain visible focus styles.
- Responsiveness: TOP passes at 1365 × 768, 820 × 1180, and 768 × 1024. Calculation and picture movement pass at 1024 × 768. Expanded result lists use page scrolling instead of an internal scroll trap.

## Primary interactions tested

- Opened `/` and confirmed four choices: lower calculation, lower picture movement, upper calculation, and upper picture movement.
- Dragged `○`, `−`, and `▲` into lower-grade slots, selected 12, built the rule, and ran it. Progress reached `12 / 12`; every result was non-negative; mistakes remained `0かい`.
- Dragged `A`, `×`, `B`, `−`, and `C` into upper-grade slots and ran 100 calculations. Progress reached `100 / 100`, correct reached `100 / 100`, mistakes remained `0回`, and execution time displayed `0.001秒未満` in the audited run.
- Confirmed the lower list uses forms such as `6 − 3 ＝ 3` and the upper list uses forms such as `2 × 6 − 3 ＝ 9`, without redundant `○=` / `A=` labels.
- Confirmed 100 upper results create a 1510px-high fully expanded list with `overflow: visible`.
- Dragged all four fish cards into the rule area with pointer input, then ran the rule and confirmed `3かい およげた！` with elapsed time and reuse count.
- Loaded and ran all six picture lesson samples. Jump completed two stomps; paint drew a square; motion reused one rule three times; the story reused one rule across three frames; coordinate art reused one rule six times.
- Confirmed every picture lesson fits a 1024 × 768 iPad landscape viewport with `scrollHeight=768`; the 768 × 1024 upper lesson hub has three 748 × 238 cards and no horizontal overflow.
- Checked browser console logs after the final flow: none.

## Comparison history

### Iteration 1 — TOP overlap

- [P1] The 1365 × 768 TOP allowed the large `1〜3` and `4〜6` text to overlap the first course card.
  - Fix: extended the compact iPad layout through 1500px and bounded the grade typography and intro tracks.
  - Post-fix evidence: `19-home-wide-final.jpg`; grade text ends at x=440.37 and the first course begins at x=461.99.

### Iteration 2 — iPad portrait composition

- [P1] Portrait kept a three-column grade band and stretched course cards vertically, making the layout appear broken.
  - Fix: portrait now places the grade/mascot across the first row and two fixed-height course cards across the second row.
  - Post-fix evidence: `11-home-ipad-768x1024-after.jpg`; all four course cards are 230px high and the full page is 1024px high without overflow.

### Iteration 3 — calculation list and rule reuse

- [P1] Results used redundant symbol/value notation and were hidden inside a short internal scroller.
  - Fix: result rows now show large ordinary equations, and the list expands for every selected run. Added large 1–100 selects and subtraction to both grades.
  - Post-fix evidence: `20-lower-final-12-results.jpg` and `15-upper-complex-100-results-list.jpg`.

### Iteration 4 — upper calculation entry

- [P1] Upper calculation still opened the older human-versus-program speed exercise instead of rule creation.
  - Fix: replaced it with a draggable three-variable/two-operator builder that observes multiplication precedence and can reuse repeated variables.
  - Post-fix evidence: `14-upper-complex-100-results-top.jpg` and the side-by-side `21-upper-design-comparison.jpg`.

### Iteration 5 — movement page fit and terminology

- [P1] At 1024 × 768, movement panels stacked vertically, putting primary controls far below the fold; upper copy also said `迷路を動かす`.
  - Fix: moved the three-column console breakpoint to iPad landscape, compacted touch controls without making them smaller than 48px, hid the redundant page switcher, and renamed the course to picture movement.
  - Post-fix evidence: `16-upper-picture-program-ready.jpg`, `17-upper-picture-program-result.jpg`, and `18-lower-picture-program-result.jpg`.

### Iteration 6 — six independent picture lessons

- [P1] A single grid exercise did not match the requested `絵を動かす` learning goal or the selected three-option concepts for each grade band.
  - Fix: replaced it with independent low-grade jump, fish, and paint lessons plus independent upper-grade motion, story, and coordinate lessons. Every lesson starts by building a draggable rule, runs the rule on a purpose-built stage, and reports elapsed time and reuse count.
  - Post-fix evidence: the six `*-ipad-landscape-final.png` results and `upper-hub-ipad-portrait-final.png` listed above.

## Follow-up polish

- [P3] Secondary rule-builder hints are intentionally compact at 1024 × 768 to keep the entire build/run/result header visible; primary labels and touch controls remain large.
- [P3] The 768 × 1024 individual upper-grade lesson uses normal page scrolling because its rule palette, stage, and result controls are intentionally presented as full-width stacked sections; it has no horizontal clipping or nested scroll trap.

## Implementation checklist

- [x] TOP is the initial route and has four independent destinations.
- [x] TOP is responsive in iPad portrait and landscape.
- [x] Both calculation lessons start by building a draggable rule.
- [x] Addition and subtraction are available to both grades; multiplication is available to upper grades.
- [x] The learner selects any run count from 1 to 100.
- [x] The selected count updates headings, buttons, progress, correct totals, and result rows.
- [x] Calculation lists use large ordinary expressions and expand fully.
- [x] Low grade has three independent picture lessons: jump adventure, fish dance, and paint car.
- [x] Upper grade has three independent picture lessons: motion canvas, animation storybook, and coordinate art.
- [x] All six picture lessons start by creating a draggable/tappable rule and visibly demonstrate reusing it.
- [x] All six samples complete within the iPad landscape viewport and report elapsed time plus reuse count.
- [x] Picture lesson selection and individual lessons are responsive in iPad portrait.
- [x] No visible forbidden school name is present.

final result: passed

---

# Design QA — 変数つきルール・ラボ

## Evidence

- Browser-rendered upper-grade hub at 1280 × 720: the parameterized-rule lesson is card 1 and uses the revised SVG thumbnail.
- Browser-rendered lesson at 1280 × 720: the header and learning-focus section state that one rule receives different values on each call.
- Browser-rendered reusable-rule panel at 1280 × 720: one six-card rule is followed by three separate `ルール(x, y)` call cards.
- Browser-rendered edit/run states: adding two cards before the first run leaves only the white target and start robot; running the two-card rule draws the expected red three-step staircase; adding another card preserves that path as the labeled previous result.
- Responsive verification at 390 × 844: all three call cards stack, the program uses two columns, and `scrollWidth` equals the 390px viewport width.

## Findings and fixes

- [P1] The old task repeated one fixed six-card rule `n` times, so it taught repetition rather than parameterized reuse.
  - Fix: removed the global `n` control and added three calls that each pass their own `x` and `y` values to one shared six-card rule.
- [P1] Repeating one set of values could previously solve the entire target.
  - Fix: changed the target into three different shapes. The correct calls require different argument pairs; three identical pairs cannot pass the correctness check.
- [P1] The lesson was the fourth upper-grade challenge.
  - Fix: moved it to card 1 and revised the hub title, description, and thumbnail to introduce parameterized reuse first.
- [P2] The initial call heading rendered its numeric badge and number twice in accessible text.
  - Fix: separated the badge from the `回目` label so each heading reads once as `1回目`, `2回目`, or `3回目`.
- [P1] Editing the shared rule immediately drew a red path even though the learner had not run it, making an incomplete three-call preview look like a broken execution result.
  - Fix: store the last executed result separately. Before the first run, editing shows only the white target and start robot. After a run, later edits keep the previous red path and label it as pending until the learner tests again.

## Primary interactions tested

- Confirmed the lesson is the first upper-grade card and all three call values start at 1 without revealing the answer.
- Built the shared rule `右へx → 上へy → 青 → 右へx → 下へy → 黄` once.
- Passed only the first argument pair and confirmed the `1回目の呼び出しは正解！` checkpoint.
- Passed three distinct argument pairs to the same six cards and confirmed `正解！1つのルールを3回再利用できました`.
- Added `右へx → 上へy` without executing and confirmed the stage has no result state or red path.
- Executed the incomplete two-card rule and confirmed the red path is a correct three-call staircase, then added a card and confirmed the previous result remains with a pending-edit explanation.
- Confirmed no browser warnings or errors and closed the verification tab.

final result: passed

---

# Design QA — 荷物の連続搬送アニメーション（2026-08-24）

**Evidence**

- Source visual truth: `docs/mockups/2026-08-22-sort-robot-debug/sort-robot-debug-tablet.png` (1448 × 1086)
- Previous implementation screenshot: `docs/mockups/2026-08-22-sort-robot-debug/implementation-success-final-1440x1080.png` (1440 × 1080)
- Revised implementation screenshot: unavailable
- Intended viewport: 1440 × 1080 CSS pixels, device scale factor 1
- State to verify: `queued → entering → checking → routing → dropping → arrived`
- Full-view comparison: blocked because the in-app browser changed the initial connection failure into a blocked `data:` error page and would not reopen the now-running local URL.
- Focused motion comparison: blocked for the same reason; a still image would not be sufficient to judge the continuity of the requested motion.

**Findings**

- [P1] Revised movement cannot yet be visually certified.
  Location: warehouse stage / `.upper-sort-parcel`.
  Evidence: the implementation now contains distinct entrance, belt travel, rule check, horizontal routing, vertical drop, and arrival states, and the static validation asserts these states. Browser-rendered intermediate frames could not be captured in this run.
  Impact: automated source checks cannot prove that the perceived motion is continuous rather than appearing to pop.
  Fix: open the running local URL in a fresh browser session, run the three-package test, and capture at least the `entering`, `routing`, and `dropping` frames before changing this result to `passed`.

**Required Fidelity Surfaces**

- Fonts and typography: unchanged from the previously passed implementation; not re-captured.
- Spacing and layout rhythm: a four-step flow indicator was added inside the existing stage; visual overlap verification is pending.
- Colors and visual tokens: existing blue, green, orange, and lane colors are reused; visual verification is pending.
- Image quality and asset fidelity: the warehouse, special parcel, and robot raster assets are unchanged; new motion uses those existing assets.
- Copy and content: added `入口`, `ベルトで移動`, `ルール判定`, and `レーンへ投入`, with English translations.

**Implementation Checklist**

- [x] Start each parcel outside the left edge and wait for a painted frame before moving it.
- [x] Move the parcel across the visible belt to the inspection point.
- [x] Pause and pulse at the inspection point while rules are evaluated.
- [x] Move horizontally to the selected lane before dropping vertically into its bin.
- [x] Use shorter but still visible travel timings for the 20-package batch.
- [x] Add reduced-motion handling.
- [x] Pass static validation, behavior tests, and production build.
- [ ] Capture and compare the revised browser-rendered motion states.

**Comparison History**

- [P1] Previous animation began at the inspection point and only moved diagonally into a bin, which read as `appear → disappear` rather than a conveyor journey.
  - Fix: split the path into six explicit phases and force a two-frame paint before the entrance transition begins.
  - Post-fix visual evidence: blocked in this run; source-level and test evidence only.

final result: blocked

---

# Design QA — 仕分けロボットをデバッグせよ

## Evidence

- Source visual truth: `docs/mockups/2026-08-22-sort-robot-debug/sort-robot-debug-tablet.png` (1448 × 1086; comparison用に1440 × 1080へ正規化)
- Final implementation: `docs/mockups/2026-08-22-sort-robot-debug/implementation-success-final-1440x1080.png`
- Motion state: `docs/mockups/2026-08-22-sort-robot-debug/implementation-motion-1440x1080.png`
- Full comparison: `docs/mockups/2026-08-22-sort-robot-debug/design-comparison-full.png`
- Focused rule-area comparison: `docs/mockups/2026-08-22-sort-robot-debug/design-comparison-rules.png`
- Responsive evidence: `implementation-ipad-1194x834.png`, `implementation-mobile-390x844.png`
- Final desktop viewport: 1440 × 1080 CSS pixels, device scale factor 1
- Compared state: source is a conceptual composite of active evaluation and success; final implementation captures the successful six-package state, with the active matching state captured separately.

## Findings and fixes

- [P1] The previous lesson did not show parcels moving, so the learner could not connect a rule with its outcome.
  - Fix: added a visible warehouse stage, four destination lanes, moving parcels, the active rule highlight, and `あてはまる／ちがう` evaluation text.
- [P1] The previous task could be completed by pressing the supplied rules and did not require upper-grade reasoning.
  - Fix: the starting three rules pass a warm-up but fail the compound `われもの かつ 冷蔵` exception. The learner must create the fourth rule and move it above the single-condition rules because evaluation is top-to-bottom.
- [P1] The first implementation was taller than the 1440 × 1080 visual target because the learning objective and mission were repeated in separate panels.
  - Fix: compacted the existing upper-grade header, removed duplicated panels, and placed the success feedback beside the test actions. Final desktop `scrollHeight` is 1080.
- [P2] The first success feedback occupied the full width and diverged from the reference composition.
  - Fix: moved the feedback into the lower-right action area and reused the existing robot mascot asset.
- No unresolved P0, P1, or P2 findings remain.

## Surface review

- Typography: uses the product's rounded Japanese type stack with heavy navy headings and readable control labels.
- Spacing and layout: reproduces the two-column rule/stage structure and the lower rule-builder/action strip; the desktop result fits one 1440 × 1080 viewport.
- Colors: keeps the mock's orange, red, blue, purple, yellow, and green learning-state palette.
- Images: uses generated raster artwork for the warehouse stage and compound-condition parcel, plus the existing robot mascot; no placeholder image is visible.
- Copy: explains the goal, exposes the failing parcel, and states that top-to-bottom order matters.
- Interaction and accessibility: condition controls are semantic fieldsets, selection state uses `aria-pressed`, keyboard/touch controls are available, and choice buttons are at least 48px high.
- Responsiveness: 1194 × 834 and 390 × 844 have no horizontal overflow. Smaller viewports use normal page scrolling.

## Primary interactions tested

- Ran the three-package warm-up with the initial rules and confirmed success plus unlock of the six-package exception test.
- Ran all six packages with the initial rules and confirmed only `びん入りジュース` fails because the first fragile rule wins.
- Built `われもの かつ 冷蔵 → 紫の特別レーン`, added it as rule 4, then moved it to rule 1.
- Re-ran all six packages and confirmed every package succeeds and unlocks the 20-package batch.
- Ran the 20-package batch and confirmed `20個の自動仕分けに成功！`.
- Captured the moving parcel with class `to-special is-moving` and the active first rule reading `あてはまる！`.
- Browser console was checked. The only error was the existing Firebase Analytics network fetch failure in the local/offline environment; it does not interrupt the lesson.

## Follow-up polish

- [P3] The source mock intentionally combines active matching and success in one explanatory image; the real lesson presents those states sequentially so the result is causally clear.
- [P3] The implemented rule builder uses text-first selection controls instead of approximated pictograms, preserving legibility and consistent interaction behavior across desktop and mobile.

final result: passed

---

## Latest QA status — 2026-08-25 priority explanation revision

The current revision makes rule priority an independent item in `ここから学ぶこと`, then repeats the causal sequence beside the lane briefing and above the rule list: parcels enter from the left, move right on the belt, rules are checked from priority 1 downward, and the first matching rule selects the lane. The stage progress labels use the same sequence.

Browser verification passed at the default desktop viewport and at 390 × 844. The mobile page has no horizontal overflow, the four learning cards stack without clipping, and the lane/priority explanation is present in the rendered DOM. A learner-style browser run built the three basic rules from the empty state and observed the first parcel with `at-gate is-entering` while it moved across the belt; the active rule highlight was visible and the browser console had no warnings or errors. Static validation, behavior tests, and the production build also pass.

final result: passed
