export const calculationLessons = {
  lower: {
    questions: [
      { formula: "1+1+1+1+1+1+1", answer: 7, choices: [6, 7, 8] },
      { formula: "2+2+2+2", answer: 8, choices: [6, 8, 10] },
      { formula: "3+1+3+1", answer: 8, choices: [6, 7, 8] }
    ],
    copy: {
      eyebrow: "おなじ けいさんを やってみよう",
      title: "プログラムは どうやって けいさんするの？",
      lead: "スタートを おすと、いっしょに はじまるよ",
      questionHeading: "こたえを えらぼう",
      startHint: "おすと いっしょに はじまる",
      humanTitle: "にんげん",
      programTitle: "プログラム",
      waiting: "スタートを まっているよ",
      humanRunning: "けいさんちゅう",
      humanComplete: "ぜんぶ こたえたよ！",
      programComplete: "けいさん できた！",
      programWaiting: "みんなが おわるのを まっているよ",
      programTogether: "みんなの けいさんも おわった！",
      reflectionTitle: "どうして すぐに せいかくに できたのかな？",
      reflectionLead: "となりの ひとと はなして、あてはまる ことばを おそう",
      reflectionChoices: ["おなじ じゅんばん", "まちがえずに", "なんどでも"],
      reveal: "わかったことを みる",
      insightTitle: "プログラムは、すぐに せいかくに けいさんできる！",
      insightBody: "きめた やりかたを、まちがえずに なんどでも できるから",
      next: "つぎは えを うごかそう"
    }
  },
  upper: {
    questions: [
      { formula: "12+8+12+8+12+8", answer: 60 },
      { formula: "25+25+25+25", answer: 100 },
      { formula: "7+3+7+3+7+3", answer: 30 },
      { formula: "14+6+14+6+14+6", answer: 60 },
      { formula: "30+20+30+20", answer: 100 }
    ],
    copy: {
      eyebrow: "同じ計算式で、速さと正確さを確かめよう",
      title: "人間とプログラムで、同じ計算に挑戦",
      lead: "スタートを押すと、同時に始まります",
      questionHeading: "答えを入力しよう",
      startHint: "押すと同時に始まります",
      humanTitle: "人間",
      programTitle: "プログラム",
      waiting: "スタートを待っています",
      humanRunning: "回答中",
      humanComplete: "回答完了",
      programComplete: "計算完了",
      programWaiting: "人間の回答完了を待っています",
      programTogether: "人間の回答も完了しました",
      reflectionTitle: "なぜ、すぐ正確に計算できたのだろう？",
      reflectionLead: "自分の予想を選び、近くの人に理由を説明しよう",
      reflectionChoices: ["決めた手順を守る", "同じ処理を高速に繰り返す", "疲れても精度が変わらない"],
      reveal: "考えを確かめる",
      insightTitle: "プログラムは、すぐに正確に計算できた",
      insightBody: "決めた手順を、間違えず・飛ばさず・同じように繰り返せるから",
      next: "次はプログラミングへ"
    }
  }
};

export function calculateCorrectCount(questions, answers) {
  return questions.reduce((count, question, index) => (
    Number(answers[index]) === question.answer ? count + 1 : count
  ), 0);
}

export function answeredCount(answers) {
  return answers.filter((answer) => answer !== null && answer !== "").length;
}

export function isCalculationComplete(questions, answers) {
  return answeredCount(answers) === questions.length;
}

export function containsKanji(value) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/u.test(value);
}

function randomDigit(random) {
  const value = Number(random());
  const normalized = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.999999999) : 0;
  return Math.floor(normalized * 9) + 1;
}

const RULE_SYMBOLS = new Set(["circle", "triangle"]);
const COMPOSITE_SYMBOLS = new Set(["a", "b", "c"]);
const COMPOSITE_OPERATORS = new Set(["add", "subtract", "multiply"]);
const MAX_RULE_RUNS = 100;

function validateCount(count) {
  if (!Number.isInteger(count) || count <= 0 || count > MAX_RULE_RUNS) {
    throw new RangeError(`count must be an integer from 1 to ${MAX_RULE_RUNS}`);
  }
}

function validateRule(rule) {
  if (!rule || typeof rule !== "object") {
    throw new TypeError("rule must be an object");
  }
  if (!RULE_SYMBOLS.has(rule.leftSymbol) || !RULE_SYMBOLS.has(rule.rightSymbol)) {
    throw new RangeError("rule symbols must be circle or triangle");
  }
  if (rule.operator !== "add" && rule.operator !== "subtract") {
    throw new RangeError("rule operator must be add or subtract");
  }
}

export function createRuleBatch(rule, count = 100, random = Math.random) {
  validateRule(rule);
  validateCount(count);
  if (typeof random !== "function") {
    throw new TypeError("random must be a function");
  }

  return Array.from({ length: count }, (_, index) => {
    let leftValue = randomDigit(random);
    let rightValue = rule.rightSymbol === rule.leftSymbol
      ? leftValue
      : randomDigit(random);
    if (rule.operator === "subtract" && rightValue > leftValue) {
      [leftValue, rightValue] = [rightValue, leftValue];
    }
    return {
      index: index + 1,
      leftSymbol: rule.leftSymbol,
      rightSymbol: rule.rightSymbol,
      operator: rule.operator,
      leftValue,
      rightValue,
      square: rule.operator === "subtract" ? leftValue - rightValue : leftValue + rightValue
    };
  });
}

function validateCompositeRule(rule) {
  if (!rule || typeof rule !== "object") {
    throw new TypeError("rule must be an object");
  }
  if (![rule.firstSymbol, rule.secondSymbol, rule.thirdSymbol].every((symbol) => COMPOSITE_SYMBOLS.has(symbol))) {
    throw new RangeError("rule symbols must be a, b, or c");
  }
  if (![rule.firstOperator, rule.secondOperator].every((operator) => COMPOSITE_OPERATORS.has(operator))) {
    throw new RangeError("rule operators must be add, subtract, or multiply");
  }
}

export function evaluateCompositeRule(rule, values) {
  validateCompositeRule(rule);
  const first = values[rule.firstSymbol];
  const second = values[rule.secondSymbol];
  const third = values[rule.thirdSymbol];
  if (![first, second, third].every(Number.isFinite)) {
    throw new TypeError("values must include finite numbers for every rule symbol");
  }

  const applyOperator = (left, operator, right) => {
    if (operator === "multiply") return left * right;
    if (operator === "subtract") return left - right;
    return left + right;
  };

  if (rule.firstOperator !== "multiply" && rule.secondOperator === "multiply") {
    return applyOperator(first, rule.firstOperator, second * third);
  }
  const firstResult = applyOperator(first, rule.firstOperator, second);
  return applyOperator(firstResult, rule.secondOperator, third);
}

export function createCompositeRuleBatch(rule, count = 100, random = Math.random) {
  validateCompositeRule(rule);
  validateCount(count);
  if (typeof random !== "function") {
    throw new TypeError("random must be a function");
  }

  return Array.from({ length: count }, (_, index) => {
    const values = {};
    [rule.firstSymbol, rule.secondSymbol, rule.thirdSymbol].forEach((symbol) => {
      if (!(symbol in values)) values[symbol] = randomDigit(random);
    });
    return {
      index: index + 1,
      ...rule,
      values,
      result: evaluateCompositeRule(rule, values)
    };
  });
}

export function summarizeCompositeRuleBatch(rows) {
  const correct = rows.filter((row) => evaluateCompositeRule(row, row.values) === row.result).length;
  return {
    total: rows.length,
    correct,
    mistakes: rows.length - correct
  };
}

export function summarizeRuleBatch(rows) {
  const correct = rows.filter(({ leftValue, rightValue, operator, square }) => (
    (operator === "subtract" ? leftValue - rightValue : leftValue + rightValue) === square
  )).length;
  return {
    total: rows.length,
    correct,
    mistakes: rows.length - correct
  };
}

export function createAdditionBatch(count = 100, random = Math.random) {
  validateCount(count);
  if (typeof random !== "function") {
    throw new TypeError("random must be a function");
  }

  return Array.from({ length: count }, (_, index) => {
    const circle = randomDigit(random);
    const triangle = randomDigit(random);
    return {
      index: index + 1,
      circle,
      triangle,
      square: circle + triangle
    };
  });
}

export function summarizeAdditionBatch(rows) {
  const correct = rows.filter(({ circle, triangle, square }) => circle + triangle === square).length;
  return {
    total: rows.length,
    correct,
    mistakes: rows.length - correct
  };
}

export function formatCalculationDuration(milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds < 0) {
    throw new RangeError("milliseconds must be zero or greater");
  }
  if (milliseconds < 1) return "0.001びょうみまん";
  return `${(milliseconds / 1000).toFixed(3)}びょう`;
}
