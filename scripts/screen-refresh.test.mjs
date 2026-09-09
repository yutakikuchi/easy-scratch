import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { rulePreviewText } from '../public/rule-preview.js';
import { hubCards, pictureHubMarkup } from '../public/picture-hub-view.js';
import { pictureLessons } from '../public/picture-lessons-data.js';
import { ENGLISH_TEXT } from '../public/i18n-en.js';
assert.equal(rulePreviewText('lower', null), '');
assert.match(rulePreviewText('lower', { leftSymbol: 'circle', operator: 'add', rightSymbol: 'triangle' }), /3 ＋ 4 ＝ 7/);
assert.match(rulePreviewText('lower', { leftSymbol: 'triangle', operator: 'subtract', rightSymbol: 'circle' }), /4 − 3 ＝ 1/);
assert.match(rulePreviewText('lower', { leftSymbol: 'circle', operator: 'add', rightSymbol: 'circle' }), /3 ＋ 3 ＝ 6/);
const repeated = { firstSymbol: 'a', firstOperator: 'add', secondSymbol: 'a', secondOperator: 'multiply', thirdSymbol: 'b' };
const preview = rulePreviewText('upper', repeated);
assert.match(preview, /3 ＋ 3 × 4 ＝ 15/);
assert.doesNotMatch(preview, /undefined|C＝/);
assert.match(rulePreviewText('upper', { ...repeated, thirdSymbol: 'a' }), /3 ＋ 3 × 3 ＝ 12/);
for (const grade of ['lower', 'upper']) {
  const markup = pictureHubMarkup(grade, pictureLessons[grade], value => value);
  assert.equal((markup.match(/data-open-picture-lesson=/g) || []).length, 4);
  for (const lesson of pictureLessons[grade]) {
    assert.ok(markup.includes(`data-open-picture-lesson="${lesson.id}"`));
    assert.ok(markup.includes(lesson.title));
    for (const asset of hubCards[lesson.id].slice(1)) await access(new URL('../public/' + asset, import.meta.url));
    assert.ok(ENGLISH_TEXT[hubCards[lesson.id][0]], 'New lesson captions must translate');
  }
}
const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
assert.ok(html.indexOf('home-grade-lower') < html.indexOf('class="home-intro"'), 'Lesson choice precedes introduction');
assert.equal((html.match(/class="home-course/g) || []).length, 4);
assert.ok(html.includes('screen-refresh.css'));
console.log('Screen refresh: rule previews, routes, assets, translations and hierarchy passed');
