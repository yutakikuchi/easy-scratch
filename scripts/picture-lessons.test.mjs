import assert from "node:assert/strict";
import { findPictureLesson, pictureLessons } from "../public/picture-lessons-data.js";
import { expandPictureProgram, getJumpRoute, getMovementRoute, getPaintRoute, getPictureProgramStatus, setPictureCommandRepeat } from "../public/picture-lessons.js";
import { createGridPaintState } from "../public/lower-grid-paint.js";
import {
  createKickPath,
  createPatternArtRoute,
  createPatternRoute,
  createRescueCoordinateGrid,
  createRescueRoute,
  expandRescueProgram,
  doesKickClearWall,
  isKickCorrect,
  isPatternCorrect,
  isRescueCorrect,
  kickInitialForce,
  kickTargetForce,
  mapRescuePoint,
  patternTarget,
  rescueInitialValues,
  rescueRepeatCount,
  rescueTargetProgram,
  rescueTargetRule,
  rescueTargetValues
} from "../public/upper-picture-lesson-logic.js";
import {
  applyKickProgram,
  classifyKickOutcome,
  simulateKickProgram
} from "../public/upper-free-kick-program.js";
import {
  createUpperGridPaintState,
  createUpperGridPaintTargetState,
  isUpperGridPaintCorrect,
  upperGridPaintConfig
} from "../public/upper-grid-paint-logic.js";

for (const grade of ["lower", "upper"]) {
  const lessons = pictureLessons[grade];
  const expectedCount = 4;
  assert.equal(lessons.length, expectedCount, `${grade} grade must have the expected independent picture lessons`);
  assert.equal(new Set(lessons.map(({ id }) => id)).size, expectedCount, `${grade} lesson ids must be unique`);

  for (const lesson of lessons) {
    if (grade === "lower") {
      const actionIds = new Set(lesson.actions.map(({ id }) => id));
      assert.ok(lesson.actions.length >= 3 && lesson.actions.length <= 4, `${lesson.id} must provide a compact rule palette`);
      assert.ok(lesson.sample.length >= 3 && lesson.sample.length <= 10, `${lesson.id} sample must build a short rule`);
      assert.equal(actionIds.has("repeat"), false, `${lesson.id} must use the repeat-run control instead of a repeat card`);
      assert.ok(lesson.sample.every((id) => actionIds.has(id)), `${lesson.id} sample must only use available cards`);
    }
    const supportedThumbnail = lesson.thumbnail.endsWith(".png") || lesson.thumbnail.endsWith(".svg");
    assert.ok(supportedThumbnail, `${lesson.id} must use a supported mock thumbnail`);
    assert.ok(lesson.sprite.endsWith(".png"), `${lesson.id} must use a raster sprite`);
    assert.equal(findPictureLesson(grade, lesson.id), lesson);
  }
}

assert.deepEqual(
  pictureLessons.lower.map(({ id }) => id),
  ["grid-paint", "jump", "fish", "paint"]
);
assert.deepEqual(
  pictureLessons.upper.map(({ id }) => id),
  ["rescue", "keyframe", "pattern", "grid-lab"]
);
assert.equal(findPictureLesson("lower", "missing"), null);

const upperGridTarget = createUpperGridPaintTargetState();
assert.equal(upperGridTarget.painted.length, 8, "the upper grid target must paint eight cells");
assert.deepEqual(upperGridTarget.position, upperGridPaintConfig.goal, "the target rule must finish at the flag");
assert.equal(isUpperGridPaintCorrect(upperGridPaintConfig.targetProgram, upperGridPaintConfig.targetValues), true);
assert.equal(isUpperGridPaintCorrect(upperGridPaintConfig.targetProgram, { x: 1, y: 1, n: 1 }), false, "initial values must not solve the lesson");
assert.equal(isUpperGridPaintCorrect(["right", "up", "paint-blue", "paint-yellow"], upperGridPaintConfig.targetValues), false, "card order must matter");
assert.equal(createUpperGridPaintState(["right"], { x: 4, y: 1, n: 1 }).outcome, "obstacle", "a shortcut into an obstacle must stop the robot");
assert.equal(isUpperGridPaintCorrect(["right", "up", "paint-blue", "right", "down", "paint-yellow"], { x: 2, y: 2, n: 3 }), false, "three repeats must stop before the goal");

const sample = findPictureLesson("lower", "jump").sample;
assert.deepEqual(getPictureProgramStatus([], sample), { canRun: false, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump"], sample), { canRun: true, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump", "right", "stomp"], sample), {
  canRun: true,
  isCorrect: false
});
assert.deepEqual(getPictureProgramStatus(sample, sample), { canRun: true, isCorrect: true });

const jumpRoute = getJumpRoute(1000, 500);
assert.ok(jumpRoute.length >= 45, "jump and stomps must use enough points for smooth arcs");
assert.deepEqual(
  jumpRoute.filter(({ hit }) => Number.isInteger(hit)).map(({ hit }) => hit),
  [0, 1]
);
assert.deepEqual(jumpRoute.at(-1), { x: 820, y: 0, rotation: 0, offset: 1 });
assert.deepEqual(jumpRoute.filter(({ hit }) => Number.isInteger(hit)).map(({ x, y }) => ({ x, y })), [{ x: 600, y: -80 }, { x: 720, y: -80 }], "each one-stomp command must land on one enemy");
assert.ok(jumpRoute.slice(1).every((point, index) => Math.abs(point.x - jumpRoute[index].x) <= 140 && Math.abs(point.y - jumpRoute[index].y) <= 60), "the jump route must avoid sharp visual steps");

const jumpLesson = findPictureLesson("lower", "jump");
assert.deepEqual(jumpLesson.sample, ["right", "jump", "stomp", "stomp", "right"]);
assert.equal(getPictureProgramStatus(jumpLesson.builderSample, jumpLesson.sample).isCorrect, true, "one stomp command repeated x2 must be correct");
assert.equal(getPictureProgramStatus(["right", "jump", "stomp", "stomp", "right"], jumpLesson.sample).isCorrect, true, "two direct stomp cards must also be correct");
assert.equal(setPictureCommandRepeat("stomp", 2), "stomp::repeat-2");

assert.equal(findPictureLesson("lower", "jump").sample.at(-1), "right", "jump must explicitly move right to the goal");
assert.equal(findPictureLesson("lower", "fish").sample.at(-1), "swim-right", "fish must explicitly swim right to the goal");

const gridPaintLesson = findPictureLesson("lower", "grid-paint");
const gridPaintState = createGridPaintState(gridPaintLesson.sample);
assert.deepEqual(gridPaintState.painted, [{ col: 3, row: 4 }, { col: 3, row: 2 }, { col: 6, row: 2 }]);
assert.deepEqual(gridPaintState.route.at(-1), { col: 6, row: 2, action: "paint-cell", paints: true });
assert.deepEqual(createGridPaintState(["cell-right", "cell-right", "cell-right"]).route.at(-1), { col: 3, row: 4, action: "cell-right", paints: false }, "the obstacle must block a straight path");

const paintLesson = findPictureLesson("lower", "paint");
assert.equal(paintLesson.actions.length, 4, "paint must provide at least four action choices");
assert.equal(paintLesson.actions.some(({ id }) => id === "color"), false, "paint must use one line color without a color action");
assert.equal(paintLesson.sample.length, 8, "a square must require four moves and four turns");
assert.equal(getPictureProgramStatus(paintLesson.builderSample, paintLesson.sample, 4).isCorrect, true, "a two-command paint rule repeated x4 must draw the square");
assert.equal(paintLesson.sample.at(-1), "turn", "the square rule must finish by returning the car to its starting direction");
assert.ok(paintLesson.description.includes("さいごにも みぎを むこう"), "the paint goal must explicitly ask for the final turn");
const halfSquareRoute = getPaintRoute(["forward", "turn", "forward", "turn"], 1000, 500);
assert.deepEqual(halfSquareRoute.at(-1), { x: 250, y: 250, rotation: 180, color: "#2289df", draws: false, offset: 1 });
const squareRoute = getPaintRoute(paintLesson.sample, 1000, 500);
assert.equal(squareRoute.filter(({ draws }) => draws).length, 4, "the complete paint rule must draw four sides");
assert.deepEqual(squareRoute.at(-1), { x: 0, y: 0, rotation: 0, color: "#2289df", draws: false, offset: 1 });

const singleJumpRoute = getMovementRoute("jump", ["jump"], 1000, 500);
assert.equal(singleJumpRoute.length, 25);
assert.ok(singleJumpRoute[1].x > 0 && singleJumpRoute[1].y < 0, "a single jump must move diagonally upward");
assert.deepEqual(singleJumpRoute.at(-1), { x: 420, y: 0, rotation: 0, offset: 1 });

const fishLesson = findPictureLesson("lower", "fish");
assert.equal(fishLesson.actions.length, 4, "fish must provide four distinct actions");
const fishBaseRule = ["swim-up-right", "bubble", "swim-down-right", "swim-right"];
assert.deepEqual(fishLesson.sample, [...fishBaseRule, ...fishBaseRule]);
assert.deepEqual(expandPictureProgram(fishBaseRule, 2), fishLesson.sample, "x2 must expand the four-card fish rule twice");
assert.equal(getPictureProgramStatus(fishBaseRule, fishLesson.sample, 1).isCorrect, false, "one fish rule must stop before the goal");
assert.equal(getPictureProgramStatus(fishBaseRule, fishLesson.sample, 2).isCorrect, true, "the x2 fish rule must reach the goal");
assert.equal(getPictureProgramStatus(fishLesson.sample, fishLesson.sample, 1).isCorrect, true, "eight directly entered cards must also reach the goal");
const swimRoute = getMovementRoute("fish", fishLesson.sample, 1000, 500);
const bubblePoints = swimRoute.filter(({ bubble }) => bubble);
const bubbleIndex = swimRoute.findIndex(({ bubble }) => bubble);
assert.ok(swimRoute.length >= 20, "the fish route must use enough points to make a gentle curve");
assert.equal(bubblePoints.length, 2, "the repeated fish rule must make bubbles twice");
assert.ok(bubbleIndex > 2, "the fish must follow a gradual curve before making bubbles");
assert.equal(swimRoute[bubbleIndex].x, swimRoute[bubbleIndex - 1].x, "bubbles must not move the fish horizontally");
assert.equal(swimRoute[bubbleIndex].y, swimRoute[bubbleIndex - 1].y, "bubbles must not move the fish vertically");
assert.equal(swimRoute[bubbleIndex].opensShell, true, "bubbles at the highest point must open the shell");
assert.ok(swimRoute.slice(1, bubbleIndex).every((point, index, points) => index === 0 || point.x > points[index - 1].x && point.y <= points[index - 1].y), "the fish must rise along a smooth forward curve");
assert.ok(swimRoute.slice(bubbleIndex + 1, bubbleIndex + 8).every((point, index, points) => index === 0 || point.x > points[index - 1].x && point.y >= points[index - 1].y), "the fish must descend along a smooth forward curve");
assert.ok(swimRoute.slice(1).every((point, index) => Math.abs(point.x - swimRoute[index].x) <= 45 && Math.abs(point.y - swimRoute[index].y) <= 35), "the route must not contain sharp movement jumps");
assert.ok(swimRoute.at(-1).x > swimRoute[bubbleIndex].x && Math.abs(swimRoute.at(-1).y) < 0.001, "the fish must finish by swimming gently to the goal height");

const rescueRoute = createRescueRoute(rescueTargetProgram, rescueTargetValues);
assert.equal(rescueRoute.length, 16, "the rescue goal must require five commands repeated three times");
assert.deepEqual(rescueRoute.at(-1), {
  x: 180,
  y: 160,
  direction: "left",
  value: 40,
  offset: 1
});
assert.deepEqual(expandRescueProgram(rescueTargetRule, rescueRepeatCount), rescueTargetProgram);
assert.equal(isRescueCorrect(rescueTargetRule, rescueTargetValues, rescueRepeatCount), true);
assert.equal(isRescueCorrect(rescueTargetProgram, rescueTargetValues), false, "the rescue answer must use repetition instead of fifteen direct cards");
assert.equal(isRescueCorrect(rescueTargetRule, rescueInitialValues, rescueRepeatCount), false, "the initial rescue values must require trial and error");
assert.ok([...new Set(rescueTargetProgram)].every((direction) => rescueInitialValues[direction] !== rescueTargetValues[direction]), "every direction used by the goal must start with a non-answer value");
assert.equal(isRescueCorrect([...rescueTargetRule].reverse(), rescueTargetValues, rescueRepeatCount), false, "rescue order must affect correctness");
assert.equal(isRescueCorrect(rescueTargetRule, { ...rescueTargetValues, right: 70 }, rescueRepeatCount), false, "rescue distance must affect correctness");

const coordinateGrid = createRescueCoordinateGrid(970, 630);
const gridOrigin = mapRescuePoint({ x: -180, y: 40 }, 970, 630);
assert.deepEqual(coordinateGrid.origin, gridOrigin, "the coordinate origin must be the robot start point");
const xZero = coordinateGrid.columns.find(({ value }) => value === 0);
const xTwenty = coordinateGrid.columns.find(({ value }) => value === 20);
const yTwenty = coordinateGrid.rows.find(({ value }) => value === 20);
assert.ok(xZero && xTwenty && yTwenty, "the coordinate grid must include visible 20-unit cells around the origin");
assert.ok(Math.abs((xTwenty.position - xZero.position) - (gridOrigin.y - yTwenty.position)) < 0.001, "coordinate grid cells must be square");
assert.equal(coordinateGrid.labelEvery, 40, "wide coordinate grids must show detailed values");
assert.equal(createRescueCoordinateGrid(320, 350).labelEvery, 120, "narrow coordinate grids must space labels far enough apart");

const savedRescueProgram = [
  { direction: "right", value: 120 },
  { direction: "up", value: 80 }
];
const editedRescueInputs = { ...rescueTargetValues, right: 30, up: 20 };
const savedRescueRoute = createRescueRoute(savedRescueProgram, editedRescueInputs);
assert.deepEqual(savedRescueRoute.at(-1), {
  x: -60,
  y: -40,
  direction: "up",
  value: 80,
  offset: 1
}, "saved rescue commands must keep the value they had when added");
const savedTargetRule = rescueTargetRule.map((direction) => ({ direction, value: rescueTargetValues[direction] }));
assert.equal(isRescueCorrect(savedTargetRule, editedRescueInputs, rescueRepeatCount), true, "editing the next input must not change saved command correctness");

const kickPath = createKickPath(kickTargetForce, 20);
assert.deepEqual(kickPath[0], { x: 0, y: 0, rotation: 0, time: 0, offset: 0 });
assert.deepEqual(kickPath[10], { x: 120, y: -70, rotation: 360, time: 1, offset: 0.5 });
assert.deepEqual(kickPath.at(-1), { x: 240, y: 0, rotation: 720, time: 2, offset: 1 });
assert.ok(kickPath.every((point, index) => index === 0 || point.offset >= kickPath[index - 1].offset), "kick animation offsets must follow time");
assert.equal(isKickCorrect(kickTargetForce), true);
assert.equal(isKickCorrect(kickInitialForce), false, "the soccer forces must start from values that require trial and error");
assert.equal(isKickCorrect({ ...kickTargetForce, x: kickTargetForce.x - 20 }), false);
assert.equal(isKickCorrect({ x: 120, y: 130 }), true, "a ball that visibly lands inside the goal must count as a goal");
assert.equal(doesKickClearWall(kickTargetForce), true, "the target free kick must clear the defensive wall");
assert.equal(doesKickClearWall(kickInitialForce), false, "the initial free kick must require more upward force to clear the wall");
assert.equal(createKickPath({ x: 40, y: 40 })[0].x, 0, "every kick must start at the robot's foot");
const highKickPath = createKickPath({ x: 100, y: 190 }, 40);
assert.ok(highKickPath.at(-1).time > 2, "a stronger upward force must keep the ball in the air longer");
assert.ok(Math.abs(highKickPath.at(-1).y) < 0.001, "a high kick must return smoothly to the ground");
assert.ok(
  highKickPath.slice(1).every((point, index) => Math.abs(point.y - highKickPath[index].y) < 14),
  "a high kick must not add an artificial steep drop at the final point"
);

const learnerKickProgram = [
  { outcome: "wall", actionId: "y-plus" },
  { outcome: "short", actionId: "x-plus" },
  { outcome: "over", actionId: "x-minus" },
  { outcome: "goal", actionId: "stop" }
];
assert.equal(classifyKickOutcome(kickInitialForce), "wall", "the first limited kick must visibly hit the wall");
assert.equal(classifyKickOutcome({ x: 120, y: 130 }), "goal", "the goal judgment must match the displayed landing position");
assert.equal(applyKickProgram(kickInitialForce, []).action, null, "missing learner rules must stop for reflection");
assert.deepEqual(
  applyKickProgram(kickInitialForce, [{ outcome: "wall", actionId: "y-plus" }]).nextForce,
  { x: 90, y: 110 },
  "a learner-selected correction must become the next kick force"
);
const automatedKick = simulateKickProgram(kickInitialForce, learnerKickProgram, 10);
assert.equal(automatedKick.success, true, "a complete learner rule set must automatically reach the goal and stop");
assert.equal(automatedKick.reason, "goal-stop");
assert.ok(automatedKick.attempts.length > 1 && automatedKick.attempts.length <= 10, "automatic correction must visibly reuse the rule without running forever");
assert.equal(simulateKickProgram(kickInitialForce, [], 10).reason, "missing-rule", "an incomplete program must pause at the first unknown result");
assert.equal(
  simulateKickProgram(kickInitialForce, [{ outcome: "wall", actionId: "y-minus" }], 100).attempts.length,
  10,
  "even an incorrect correction rule must stop after ten attempts"
);

const patternRoute = createPatternRoute(patternTarget);
assert.equal(patternRoute.filter(({ draws }) => draws).length, 6, "the pattern rule must draw six equal sides");
assert.ok(Math.abs(patternRoute.at(-1).x) < 0.001 && Math.abs(patternRoute.at(-1).y) < 0.001, "the regular hexagon must close at its start");
assert.equal(patternRoute.at(-1).rotation, 0, "six 60-degree turns must restore the initial direction");
const patternArtRoute = createPatternArtRoute(patternTarget);
assert.equal(patternArtRoute.filter(({ draws }) => draws).length, 36, "the flower must draw six hexagons with six sides each");
assert.ok(Math.abs(patternArtRoute.at(-1).x) < 0.001 && Math.abs(patternArtRoute.at(-1).y) < 0.001, "all six hexagons must return to the shared center");
const singlePatternRoute = createPatternArtRoute({ ...patternTarget, count: 1 });
assert.equal(singlePatternRoute.filter(({ draws }) => draws).length, 6, "n=1 must draw exactly one hexagon");
assert.ok(Math.abs(singlePatternRoute.at(-1).x) < 0.001 && Math.abs(singlePatternRoute.at(-1).y) < 0.001, "the first hexagon must close before n is increased");
assert.equal(isPatternCorrect(patternTarget), true);
assert.equal(isPatternCorrect({ ...patternTarget, distance: 50 }), true, "the side length may change the flower size without changing its shape");
assert.equal(isPatternCorrect({ ...patternTarget, count: 1 }), false, "one hexagon is not yet the six-hexagon flower");
assert.equal(isPatternCorrect({ ...patternTarget, angle: 70 }), false);

console.log("Picture lesson tests passed");
