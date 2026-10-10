import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { parseSiteSettingsForm } from './site-settings-form.ts';

function validForm() {
  const form = new FormData();
  const entries = [
    ['companyName', 'XYZ Company'],
    ['domain', 'xyz.example'],
    ['logoUrl', 'logo.svg'],
    ['logoDarkUrl', 'logo-dark.svg'],
    ['address', 'Istanbul'],
    ['phone', '+90 212 000 00 00'],
    ['email', 'info@xyz.example'],
    ['defaultTitle', 'XYZ Company'],
    ['defaultDescription', 'Tenant description'],
    ['social-linkedin', 'https://linkedin.com/company/xyz'],
    ['radarEnabled', 'on'],
    ['radarCycle', 'weekly'],
    ['radarCompetitors', '["https://competitor.example"]'],
    ['radarKeywords', '["automation"]'],
  ];
  for (const [key, value] of entries) form.append(key, value);
  return form;
}

test('maps validated form data without inventing tenant values', () => {
  const result = parseSiteSettingsForm(validForm());

  assert.equal(result.success, true);
  assert.equal(result.data.companyName, 'XYZ Company');
  assert.deepEqual(result.data.socialMedia, {
    linkedin: 'https://linkedin.com/company/xyz',
  });
  assert.deepEqual(result.data.strategicRadar.competitors.urls, [
    'https://competitor.example',
  ]);
});

test('rejects malformed radar arrays instead of throwing', () => {
  const form = validForm();
  form.set('radarCompetitors', '{broken-json');

  const result = parseSiteSettingsForm(form);

  assert.deepEqual(result, {
    success: false,
    message: 'Rakip ve anahtar kelime listeleri geçerli JSON dizileri olmalıdır.',
  });
});

test('rejects missing required tenant fields instead of inserting demo defaults', () => {
  const form = validForm();
  form.set('companyName', '');

  const result = parseSiteSettingsForm(form);

  assert.equal(result.success, false);
});

test('server actions never mutate application source files', async () => {
  const actionPaths = [
    new URL('./actions.ts', import.meta.url),
    new URL('../../../../admin/settings/site/actions.ts', import.meta.url),
  ];
  const sources = await Promise.all(actionPaths.map((path) => readFile(path, 'utf8')));

  for (const source of sources) {
    assert.doesNotMatch(source, /from ['"]fs['"]/);
    assert.doesNotMatch(source, /writeFile\s*\(/);
    assert.doesNotMatch(source, /site-settings-data\.ts/);
  }
});
