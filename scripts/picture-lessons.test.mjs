import assert from "node:assert/strict";
import { findPictureLesson, pictureLessons } from "../public/picture-lessons-data.js";
import { getJumpRoute, getMovementRoute, getPictureProgramStatus } from "../public/picture-lessons.js";

for (const grade of ["lower", "upper"]) {
  const lessons = pictureLessons[grade];
  assert.equal(lessons.length, 3, `${grade} grade must have three independent picture lessons`);
  assert.equal(new Set(lessons.map(({ id }) => id)).size, 3, `${grade} lesson ids must be unique`);

  for (const lesson of lessons) {
    const actionIds = new Set(lesson.actions.map(({ id }) => id));
    assert.equal(lesson.actions.length, 4, `${lesson.id} must provide four rule cards`);
    assert.equal(lesson.sample.length, 4, `${lesson.id} sample must build a four-card rule`);
    assert.equal(lesson.sample.at(-1), "repeat", `${lesson.id} must finish with repeat`);
    assert.ok(lesson.sample.every((id) => actionIds.has(id)), `${lesson.id} sample must only use available cards`);
    assert.ok(lesson.thumbnail.endsWith(".png"), `${lesson.id} must use a raster mock thumbnail`);
    assert.ok(lesson.sprite.endsWith(".png"), `${lesson.id} must use a raster sprite`);
    assert.equal(findPictureLesson(grade, lesson.id), lesson);
  }
}

assert.deepEqual(
  pictureLessons.lower.map(({ id }) => id),
  ["jump", "fish", "paint"]
);
assert.deepEqual(
  pictureLessons.upper.map(({ id }) => id),
  ["motion", "story", "coordinate"]
);
assert.equal(findPictureLesson("lower", "missing"), null);

const sample = pictureLessons.lower[0].sample;
assert.deepEqual(getPictureProgramStatus([], sample), { canRun: false, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump"], sample), { canRun: true, isCorrect: false });
assert.deepEqual(getPictureProgramStatus(["jump", "right", "stomp", "repeat"], sample), {
  canRun: true,
  isCorrect: false
});
assert.deepEqual(getPictureProgramStatus(sample, sample), { canRun: true, isCorrect: true });

const jumpRoute = getJumpRoute(1000, 500);
assert.equal(jumpRoute.length, 9);
assert.deepEqual(
  jumpRoute.filter(({ hit }) => Number.isInteger(hit)).map(({ hit }) => hit),
  [0, 1]
);
assert.deepEqual(jumpRoute.at(-1), { x: 780, y: 0, rotation: 0, offset: 1 });

const singleJumpRoute = getMovementRoute("jump", ["jump"], 1000, 500);
assert.equal(singleJumpRoute.length, 3);
assert.ok(singleJumpRoute[1].x > 0 && singleJumpRoute[1].y < 0, "a single jump must move diagonally upward");
assert.deepEqual(singleJumpRoute.at(-1), { x: 320, y: 0, rotation: 0, offset: 1 });

const swimRoute = getMovementRoute("fish", ["swim-right", "swim-up"], 1000, 500);
assert.ok(swimRoute[1].x > 0 && swimRoute[1].y > 0, "swimming right must include a diagonal wave");
assert.ok(swimRoute[2].x > swimRoute[1].x && swimRoute[2].y < 0, "swimming up must move diagonally upward");

console.log("Picture lesson tests passed");
