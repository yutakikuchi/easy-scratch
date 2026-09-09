import { createPaperCheckRuleBatch, createPaperCheckCompositeRuleBatch } from './calculation.js?v=20260825g';
const symbols = { add: '＋', subtract: '−', multiply: '×', circle: '○', triangle: '▲', a: 'A', b: 'B', c: 'C' };

// Use the same first paper-work question as execution, never a hard-coded example.
export function rulePreviewText(grade, rule) {
  if (!rule) return '';
  if (grade === 'lower') {
    const row = createPaperCheckRuleBatch(rule, 1)[0];
    return `${symbols[rule.leftSymbol]}＝${row.leftValue}　${symbols[rule.rightSymbol]}＝${row.rightValue}\n${row.leftValue} ${symbols[rule.operator]} ${row.rightValue} ＝ ${row.square}`;
  }
  const row = createPaperCheckCompositeRuleBatch(rule, 1)[0];
  return `${Object.entries(row.values).map(([key, value]) => `${symbols[key]}＝${value}`).join("　")}\n${row.values[rule.firstSymbol]} ${symbols[rule.firstOperator]} ${row.values[rule.secondSymbol]} ${symbols[rule.secondOperator]} ${row.values[rule.thirdSymbol]} ＝ ${row.result}`;
}

export function renderRulePreview(root, grade, rule) {
  const preview = root.querySelector('.rule-preview');
  if (!preview) return;
  preview.hidden = !rule;
  preview.replaceChildren();
  if (!rule) return;
  const label = document.createElement('small');
  label.textContent = grade === 'lower' ? 'さいしょの もんだいで ためすと' : '最初の問題で試すと';
  const formula = document.createElement('span');
  formula.textContent = rulePreviewText(grade, rule);
  preview.append(label, formula);
}
