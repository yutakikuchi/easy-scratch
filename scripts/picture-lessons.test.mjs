import assert from "node:assert/strict";
import { findPictureLesson, pictureLessons } from "../public/picture-lessons-data.js";
import { getJumpRoute, getMovementRoute, getPaintRoute, getPictureProgramStatus } from "../public/picture-lessons.js";
import { createGridPaintState } from "../public/lower-grid-paint.js";
import {
  createKickPath,
  createPatternRoute,
  createRescueCoordinateGrid,
  createRescueRoute,
  doesKickClearWall,
  isKickCorrect,
  isPatternCorrect,
  isRescueCorrect,
  kickInitialForce,
  kickTargetForce,
  mapRescuePoint,
  patternTarget,
  rescueInitialValues,
  rescueTargetProgram,
  rescueTargetValues
} from "../public/upper-picture-lesson-logic.js";
import {
  applyKickProgram,
  classifyKickOutcome,
  simulateKickProgram
} from "../public/upper-free-kick-program.js";

for (const grade of ["lower", "upper"]) {
  const lessons = pictureLessons[grade];
  const expectedCount = grade === "lower" ? 4 : 3;
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
    assert.ok(lesson.thumbnail.endsWith(".png"), `${lesson.id} must use a raster mock thumbnail`);
    assert.ok(lesson.sprite.endsWith(".png"), `${lesson.id} must use a raster sprite`);
    assert.equal(findPictureLesson(grade, lesson.id), lesson);
  }
}

assert.deepEqual(
  pictureLessons.lower.map(({ id }) => id),
  ["jump", "fish", "grid-paint", "paint"]
);
assert.deepEqual(
  pictureLessons.upper.map(({ id }) => id),
  ["rescue", "keyframe", "pattern"]
);
assert.equal(findPictureLesson("lower", "missing"), null);

const sample = findPictureLesson("lower", "jump").sample;
assert.deepEqual(getPictureProgramStatus([], sample), { canRun: false, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump"], sample), { canRun: true, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump", "right", "stomp"], sample), {
  canRun: true,
  isCorrect: false
});
assert.deepEqual(getPictureProgramStatus(sample, sample), { canRun: true, isCorrect: true });

const jumpRoute = getJumpRoute(1000, 500);
assert.equal(jumpRoute.length, 10);
assert.deepEqual(
  jumpRoute.filter(({ hit }) => Number.isInteger(hit)).map(({ hit }) => hit),
  [0, 1]
);
assert.deepEqual(jumpRoute.at(-1), { x: 820, y: 0, rotation: 0, offset: 1 });

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
assert.equal(paintLesson.sample.at(-1), "turn", "the square rule must finish by returning the car to its starting direction");
assert.ok(paintLesson.description.includes("さいごにも みぎを むこう"), "the paint goal must explicitly ask for the final turn");
const halfSquareRoute = getPaintRoute(["forward", "turn", "forward", "turn"], 1000, 500);
assert.deepEqual(halfSquareRoute.at(-1), { x: 250, y: 250, rotation: 180, color: "#2289df", draws: false, offset: 1 });
const squareRoute = getPaintRoute(paintLesson.sample, 1000, 500);
assert.equal(squareRoute.filter(({ draws }) => draws).length, 4, "the complete paint rule must draw four sides");
assert.deepEqual(squareRoute.at(-1), { x: 0, y: 0, rotation: 0, color: "#2289df", draws: false, offset: 1 });

const singleJumpRoute = getMovementRoute("jump", ["jump"], 1000, 500);
assert.equal(singleJumpRoute.length, 3);
assert.ok(singleJumpRoute[1].x > 0 && singleJumpRoute[1].y < 0, "a single jump must move diagonally upward");
assert.deepEqual(singleJumpRoute.at(-1), { x: 320, y: 0, rotation: 0, offset: 1 });

const fishLesson = findPictureLesson("lower", "fish");
assert.equal(fishLesson.actions.length, 4, "fish must provide four distinct actions");
assert.deepEqual(fishLesson.sample, ["swim-up-right", "bubble", "swim-down-right", "swim-right"]);
const swimRoute = getMovementRoute("fish", fishLesson.sample, 1000, 500);
const bubbleIndex = swimRoute.findIndex(({ bubble }) => bubble);
assert.ok(swimRoute.length >= 20, "the fish route must use enough points to make a gentle curve");
assert.ok(bubbleIndex > 2, "the fish must follow a gradual curve before making bubbles");
assert.equal(swimRoute[bubbleIndex].x, swimRoute[bubbleIndex - 1].x, "bubbles must not move the fish horizontally");
assert.equal(swimRoute[bubbleIndex].y, swimRoute[bubbleIndex - 1].y, "bubbles must not move the fish vertically");
assert.equal(swimRoute[bubbleIndex].opensShell, true, "bubbles at the highest point must open the shell");
assert.ok(swimRoute.slice(1, bubbleIndex).every((point, index, points) => index === 0 || point.x > points[index - 1].x && point.y <= points[index - 1].y), "the fish must rise along a smooth forward curve");
assert.ok(swimRoute.slice(bubbleIndex + 1, bubbleIndex + 8).every((point, index, points) => index === 0 || point.x > points[index - 1].x && point.y >= points[index - 1].y), "the fish must descend along a smooth forward curve");
assert.ok(swimRoute.slice(1).every((point, index) => Math.abs(point.x - swimRoute[index].x) <= 45 && Math.abs(point.y - swimRoute[index].y) <= 35), "the route must not contain sharp movement jumps");
assert.ok(swimRoute.at(-1).x > swimRoute[bubbleIndex].x && Math.abs(swimRoute.at(-1).y) < 0.001, "the fish must finish by swimming gently to the goal height");

const rescueRoute = createRescueRoute(rescueTargetProgram, rescueTargetValues);
assert.equal(rescueRoute.length, 7, "the rescue goal must require six commands");
assert.deepEqual(rescueRoute.at(-1), {
  x: 180,
  y: -60,
  direction: "up",
  value: 80,
  offset: 1
});
assert.equal(isRescueCorrect(rescueTargetProgram, rescueTargetValues), true);
assert.equal(isRescueCorrect(rescueTargetProgram, rescueInitialValues), false, "the initial rescue values must require trial and error");
assert.ok([...new Set(rescueTargetProgram)].every((direction) => rescueInitialValues[direction] !== rescueTargetValues[direction]), "every direction used by the goal must start with a non-answer value");
assert.equal(isRescueCorrect([...rescueTargetProgram].reverse(), rescueTargetValues), false, "rescue order must affect correctness");
assert.equal(isRescueCorrect(rescueTargetProgram, { ...rescueTargetValues, right: 110 }), false, "rescue distance must affect correctness");

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
const savedTargetProgram = rescueTargetProgram.map((direction) => ({ direction, value: rescueTargetValues[direction] }));
assert.equal(isRescueCorrect(savedTargetProgram, editedRescueInputs), true, "editing the next input must not change saved command correctness");

const kickPath = createKickPath(kickTargetForce, 20);
assert.deepEqual(kickPath[0], { x: 0, y: 0, rotation: 0, time: 0, offset: 0 });
assert.deepEqual(kickPath[10], { x: 120, y: -70, rotation: 360, time: 1, offset: 0.5 });
assert.deepEqual(kickPath.at(-1), { x: 240, y: 0, rotation: 720, time: 2, offset: 1 });
assert.ok(kickPath.every((point, index) => index === 0 || point.offset >= kickPath[index - 1].offset), "kick animation offsets must follow time");
assert.equal(isKickCorrect(kickTargetForce), true);
assert.equal(isKickCorrect(kickInitialForce), false, "the soccer forces must start from values that require trial and error");
assert.equal(isKickCorrect({ ...kickTargetForce, x: kickTargetForce.x - 20 }), false);
assert.equal(doesKickClearWall(kickTargetForce), true, "the target free kick must clear the defensive wall");
assert.equal(doesKickClearWall(kickInitialForce), false, "the initial free kick must require more upward force to clear the wall");
assert.equal(createKickPath({ x: 40, y: 40 })[0].x, 0, "every kick must start at the robot's foot");

const learnerKickProgram = [
  { outcome: "wall", actionId: "y-plus" },
  { outcome: "short", actionId: "x-plus" },
  { outcome: "over", actionId: "x-minus" },
  { outcome: "goal", actionId: "stop" }
];
assert.equal(classifyKickOutcome(kickInitialForce), "wall", "the first limited kick must visibly hit the wall");
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
assert.equal(isPatternCorrect(patternTarget), true);
assert.equal(isPatternCorrect({ ...patternTarget, angle: 70 }), false);

console.log("Picture lesson tests passed");
