import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'dachuang.html'), 'utf8');

test('uses the updated community headline', () => {
  assert.match(html, /找一群同频的人一起干/);
  assert.doesNotMatch(html, /找一群同频的人一起做/);
});

test('places all nine community photos after the fit section', () => {
  const fitIndex = html.indexOf('id="fit"');
  const galleryIndex = html.indexOf('id="dachuang-gallery"');
  const joinIndex = html.indexOf('id="join"');

  assert.ok(fitIndex >= 0, 'fit section should exist');
  assert.ok(galleryIndex > fitIndex, 'gallery should follow the fit section');
  assert.ok(joinIndex > galleryIndex, 'join section should follow the gallery');
  assert.match(html, /<h2 class="section-title">大创社群活动现场<\/h2>/);

  for (let index = 1; index <= 9; index += 1) {
    const source = `assets/大创${index}.jpg`;
    assert.equal(html.split(`src="${source}"`).length - 1, 1, `${source} should appear once`);
    assert.ok(fs.existsSync(path.join(root, source)), `${source} should exist`);
  }
});

test('uses a responsive three-column gallery grid', () => {
  assert.match(
    html,
    /\.dachuang-gallery__grid\s*{[^}]*grid-template-columns:\s*repeat\(3,\s*1fr\)/s,
  );
  assert.match(
    html,
    /@media\s*\(max-width:\s*768px\)[^{]*{[\s\S]*?\.dachuang-gallery__grid\s*{[^}]*grid-template-columns:\s*repeat\(2,\s*1fr\)/,
  );
  assert.match(
    html,
    /@media\s*\(max-width:\s*480px\)[^{]*{[\s\S]*?\.dachuang-gallery__grid\s*{[^}]*grid-template-columns:\s*1fr/,
  );
});
