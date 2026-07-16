# Design QA — iPad向けサマースクール全体

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
