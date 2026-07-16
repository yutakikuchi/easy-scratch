import assert from "node:assert/strict";
import { findPictureLesson, pictureLessons } from "../public/picture-lessons-data.js";

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

console.log("Picture lesson tests passed");
