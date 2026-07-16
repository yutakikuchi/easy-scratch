import assert from "node:assert/strict";
import {
  answeredCount,
  calculateCorrectCount,
  calculationLessons,
  containsKanji,
  createAdditionBatch,
  createCompositeRuleBatch,
  createRuleBatch,
  evaluateCompositeRule,
  formatCalculationDuration,
  isCalculationComplete,
  summarizeAdditionBatch,
  summarizeCompositeRuleBatch,
  summarizeRuleBatch
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

const randomValues = [0, 0.999, 0.49, 0.11];
let randomIndex = 0;
const batch = createAdditionBatch(2, () => randomValues[randomIndex++]);
assert.deepEqual(batch, [
  { index: 1, circle: 1, triangle: 9, square: 10 },
  { index: 2, circle: 5, triangle: 1, square: 6 }
]);
assert.deepEqual(summarizeAdditionBatch(batch), { total: 2, correct: 2, mistakes: 0 });
assert.deepEqual(
  summarizeAdditionBatch([{ index: 1, circle: 2, triangle: 3, square: 4 }]),
  { total: 1, correct: 0, mistakes: 1 }
);
assert.equal(formatCalculationDuration(0.25), "0.001びょうみまん");
assert.equal(formatCalculationDuration(12), "0.012びょう");
assert.throws(() => createAdditionBatch(0), RangeError);

const sameSymbolValues = [0.11, 0.88];
let sameSymbolIndex = 0;
const sameSymbolBatch = createRuleBatch(
  { leftSymbol: "circle", operator: "add", rightSymbol: "circle" },
  2,
  () => sameSymbolValues[sameSymbolIndex++]
);
assert.deepEqual(sameSymbolBatch, [
  {
    index: 1,
    leftSymbol: "circle",
    rightSymbol: "circle",
    operator: "add",
    leftValue: 1,
    rightValue: 1,
    square: 2
  },
  {
    index: 2,
    leftSymbol: "circle",
    rightSymbol: "circle",
    operator: "add",
    leftValue: 8,
    rightValue: 8,
    square: 16
  }
]);
assert.deepEqual(summarizeRuleBatch(sameSymbolBatch), { total: 2, correct: 2, mistakes: 0 });

const mixedSymbolValues = [0, 0.999];
let mixedSymbolIndex = 0;
assert.deepEqual(
  createRuleBatch(
    { leftSymbol: "circle", operator: "add", rightSymbol: "triangle" },
    1,
    () => mixedSymbolValues[mixedSymbolIndex++]
  ),
  [{
    index: 1,
    leftSymbol: "circle",
    rightSymbol: "triangle",
    operator: "add",
    leftValue: 1,
    rightValue: 9,
    square: 10
  }]
);
assert.throws(
  () => createRuleBatch({ leftSymbol: "circle", operator: "divide", rightSymbol: "circle" }),
  RangeError
);
assert.throws(
  () => createRuleBatch({ leftSymbol: "circle", operator: "add", rightSymbol: "circle" }, 101),
  RangeError
);

const subtractValues = [0, 0.999];
let subtractIndex = 0;
const subtractBatch = createRuleBatch(
  { leftSymbol: "circle", operator: "subtract", rightSymbol: "triangle" },
  1,
  () => subtractValues[subtractIndex++]
);
assert.deepEqual(subtractBatch, [{
  index: 1,
  leftSymbol: "circle",
  rightSymbol: "triangle",
  operator: "subtract",
  leftValue: 9,
  rightValue: 1,
  square: 8
}], "lower-grade subtraction must avoid a negative answer");
assert.deepEqual(summarizeRuleBatch(subtractBatch), { total: 1, correct: 1, mistakes: 0 });

const compositeRule = {
  firstSymbol: "a",
  firstOperator: "multiply",
  secondSymbol: "b",
  secondOperator: "add",
  thirdSymbol: "c"
};
const compositeValues = [0, 0.999, 0.49];
let compositeIndex = 0;
const compositeBatch = createCompositeRuleBatch(compositeRule, 1, () => compositeValues[compositeIndex++]);
assert.deepEqual(compositeBatch, [{
  index: 1,
  ...compositeRule,
  values: { a: 1, b: 9, c: 5 },
  result: 14
}]);
assert.deepEqual(summarizeCompositeRuleBatch(compositeBatch), { total: 1, correct: 1, mistakes: 0 });
assert.equal(evaluateCompositeRule({
  firstSymbol: "a",
  firstOperator: "add",
  secondSymbol: "b",
  secondOperator: "multiply",
  thirdSymbol: "c"
}, { a: 2, b: 3, c: 4 }), 14, "multiplication must run before addition");
assert.equal(evaluateCompositeRule({
  firstSymbol: "a",
  firstOperator: "subtract",
  secondSymbol: "b",
  secondOperator: "multiply",
  thirdSymbol: "c"
}, { a: 20, b: 3, c: 4 }), 8, "multiplication must run before subtraction");

const repeatedCompositeValues = [0.11, 0.88];
let repeatedCompositeIndex = 0;
assert.deepEqual(createCompositeRuleBatch({
  firstSymbol: "a",
  firstOperator: "multiply",
  secondSymbol: "a",
  secondOperator: "add",
  thirdSymbol: "b"
}, 1, () => repeatedCompositeValues[repeatedCompositeIndex++]), [{
  index: 1,
  firstSymbol: "a",
  firstOperator: "multiply",
  secondSymbol: "a",
  secondOperator: "add",
  thirdSymbol: "b",
  values: { a: 1, b: 8 },
  result: 9
}]);
assert.throws(() => createCompositeRuleBatch(compositeRule, 101), RangeError);

console.log("Calculation behavior tests passed");
