export const sortConditionCatalog = Object.freeze({
  fragile: Object.freeze({ id: "fragile", label: "われもの" }),
  chilled: Object.freeze({ id: "chilled", label: "冷蔵" }),
  default: Object.freeze({ id: "default", label: "それ以外" })
});

export const sortDestinationCatalog = Object.freeze({
  special: Object.freeze({ id: "special", label: "特別", action: "紫の特別レーンへ", equipment: "冷蔵＋衝撃対策", useFor: "2つとも必要", cost: 2 }),
  fragile: Object.freeze({ id: "fragile", label: "われもの", action: "赤いレーンへ", equipment: "クッションで保護", useFor: "われものだけ", cost: 1 }),
  chilled: Object.freeze({ id: "chilled", label: "冷蔵", action: "青いレーンへ", equipment: "低温を保つ", useFor: "冷蔵だけ", cost: 1 }),
  default: Object.freeze({ id: "default", label: "ふつう", action: "黄色いレーンへ", equipment: "通常の搬送", useFor: "どちらでもない", cost: 1 })
});

function freezeRule(rule) {
  return Object.freeze({
    conditions: Object.freeze([...(rule.conditions ?? [])]),
    destination: rule.destination,
    isDefault: Boolean(rule.isDefault)
  });
}

export const sortBasicRule = Object.freeze([
  freezeRule({ conditions: ["fragile"], destination: "fragile" }),
  freezeRule({ conditions: ["chilled"], destination: "chilled" }),
  freezeRule({ conditions: [], destination: "default", isDefault: true })
]);

export const sortTargetRule = Object.freeze([
  freezeRule({ conditions: ["fragile", "chilled"], destination: "special" }),
  ...sortBasicRule
]);

const packageCatalog = Object.freeze({
  glass: Object.freeze({ id: "glass", label: "ガラスのコップ", attributes: Object.freeze({ fragile: true, chilled: false }), expectedDestination: "fragile" }),
  ice: Object.freeze({ id: "ice", label: "アイス", attributes: Object.freeze({ fragile: false, chilled: true }), expectedDestination: "chilled" }),
  book: Object.freeze({ id: "book", label: "本", attributes: Object.freeze({ fragile: false, chilled: false }), expectedDestination: "default" }),
  juice: Object.freeze({ id: "juice", label: "びん入りジュース", attributes: Object.freeze({ fragile: true, chilled: true }), expectedDestination: "special" }),
  vase: Object.freeze({ id: "vase", label: "花びん", attributes: Object.freeze({ fragile: true, chilled: false }), expectedDestination: "fragile" }),
  milk: Object.freeze({ id: "milk", label: "牛乳", attributes: Object.freeze({ fragile: false, chilled: true }), expectedDestination: "chilled" })
});

export const sortWarmupPackages = Object.freeze([
  packageCatalog.glass,
  packageCatalog.ice,
  packageCatalog.book
]);

export const sortTestPackages = Object.freeze([
  ...sortWarmupPackages,
  packageCatalog.juice,
  packageCatalog.vase,
  packageCatalog.milk
]);

export const sortBatchPackages = Object.freeze(
  Array.from({ length: 20 }, (_, index) => {
    const source = sortTestPackages[index % sortTestPackages.length];
    return Object.freeze({ ...source, id: `${source.id}-${index + 1}` });
  })
);

export function createSortRule({ firstCondition, useAnd = false, secondCondition = null, destination }) {
  if (firstCondition === "default") {
    return { conditions: [], destination, isDefault: true };
  }
  const conditions = [firstCondition];
  if (useAnd && secondCondition && secondCondition !== firstCondition) conditions.push(secondCondition);
  return { conditions, destination, isDefault: false };
}

export function matchesSortRule(packageItem, rule) {
  if (rule.isDefault) return true;
  if (!rule.conditions?.length) return false;
  return rule.conditions.every((conditionId) => packageItem.attributes?.[conditionId] === true);
}

export function tracePackage(packageItem, program = []) {
  const checks = [];
  for (let index = 0; index < program.length; index += 1) {
    const rule = program[index];
    const matched = matchesSortRule(packageItem, rule);
    checks.push({ index, matched });
    if (matched) return { destination: rule.destination, matchedRuleIndex: index, checks };
  }
  return { destination: null, matchedRuleIndex: -1, checks };
}

export function classifyPackage(packageItem, program = []) {
  return tracePackage(packageItem, program).destination;
}

export function runSortProgram(program, packages = sortTestPackages) {
  const results = packages.map((packageItem) => {
    const trace = tracePackage(packageItem, program);
    return {
      packageItem,
      destination: trace.destination,
      matchedRuleIndex: trace.matchedRuleIndex,
      checks: trace.checks,
      correct: trace.destination === packageItem.expectedDestination
    };
  });
  return {
    results,
    correctCount: results.filter((result) => result.correct).length,
    total: results.length,
    complete: results.every((result) => result.correct)
  };
}

export function isSortRuleCorrect(program) {
  return program.length === 4 && runSortProgram(program, sortTestPackages).complete;
}
