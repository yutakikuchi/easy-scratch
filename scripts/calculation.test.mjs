import assert from "node:assert/strict";
import {
  answeredCount,
  calculateCorrectCount,
  calculationLessons,
  containsKanji,
  isCalculationComplete
} from "../public/calculation.js";

const lower = calculationLessons.lower;
const upper = calculationLessons.upper;

assert.equal(lower.questions.length, 3, "lower grade must have three questions");
assert.equal(upper.questions.length, 5, "upper grade must have five questions");
assert.deepEqual(lower.questions.map(({ answer }) => answer), [7, 8, 8]);
assert.deepEqual(upper.questions.map(({ answer }) => answer), [60, 100, 30, 60, 100]);

assert.equal(answeredCount([7, null, 8]), 2);
assert.equal(calculateCorrectCount(lower.questions, [7, 8, 6]), 2);
assert.equal(isCalculationComplete(lower.questions, [7, 8, 8]), true);
assert.equal(isCalculationComplete(lower.questions, [7, null, 8]), false);

for (const [key, value] of Object.entries(lower.copy)) {
  assert.equal(containsKanji(value), false, `lower-grade copy ${key} must not contain kanji`);
}

assert.match(lower.copy.programWaiting, /まっている/);
assert.match(upper.copy.programWaiting, /待っています/);
assert.equal(lower.copy.reflectionChoices.length, 3);
assert.equal(upper.copy.reflectionChoices.length, 3);
assert.match(lower.copy.reflectionTitle, /どうして/);
assert.match(upper.copy.reflectionTitle, /なぜ/);
assert.doesNotMatch(`${lower.copy.title}${upper.copy.title}`, /勝|負|順位/);

console.log("Calculation behavior tests passed");
