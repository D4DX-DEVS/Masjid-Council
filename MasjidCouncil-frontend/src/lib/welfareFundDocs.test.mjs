// Run: node --test src/lib/welfareFundDocs.test.mjs
// ponytail: node:test only. Guards the rules that silently regressed before —
// the admin view claiming house-repair documents for every help purpose, and
// documents being listed that the form never collected.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPurposeLabel,
  getRequiredDocuments,
  getMissingRequiredDocs,
} from './welfareFundDocs.js';

const keys = (purpose) => getRequiredDocuments(purpose).map((d) => d.key);

test('each purpose gets the common docs plus only its own', () => {
  assert.deepEqual(keys('marriage'), ['aadhaarCopy', 'bankPassbook', 'marriageProof']);
  assert.deepEqual(keys('house'), ['aadhaarCopy', 'bankPassbook', 'repairEstimate', 'housePhotos']);
  assert.deepEqual(keys('medical'), ['aadhaarCopy', 'bankPassbook', 'doctorRecommendation']);
  assert.deepEqual(keys('education'), [
    'aadhaarCopy',
    'bankPassbook',
    'courseFeeStructure',
    'admissionDetails',
  ]);
  for (const purpose of ['marriage', 'medical', 'education']) {
    assert.ok(!keys(purpose).includes('housePhotos'), purpose);
  }
});

test('every doc carries both labels and a required flag', () => {
  for (const purpose of ['house', 'marriage', 'medical', 'education']) {
    for (const doc of getRequiredDocuments(purpose)) {
      assert.ok(doc.ml && doc.en, `${purpose}/${doc.key} missing a label`);
      assert.equal(typeof doc.required, 'boolean', `${purpose}/${doc.key} missing required flag`);
    }
  }
});

test('only the two common docs block submission', () => {
  assert.deepEqual(getMissingRequiredDocs('marriage', {}).map((d) => d.key), [
    'aadhaarCopy',
    'bankPassbook',
  ]);
  assert.deepEqual(
    getMissingRequiredDocs('house', { aadhaarCopy: 'https://cdn/a.pdf', bankPassbook: 'https://cdn/b.pdf' }),
    []
  );
});

test('unknown or empty purpose degrades to common docs and raw label', () => {
  assert.equal(getRequiredDocuments('').length, 2);
  assert.equal(getRequiredDocuments('legacy-value').length, 2);
  assert.equal(getPurposeLabel('legacy-value'), 'legacy-value');
  assert.equal(getPurposeLabel(''), '');
});

test('labels translate per language', () => {
  assert.equal(getPurposeLabel('marriage', 'en'), 'Marriage');
  assert.equal(getPurposeLabel('marriage'), 'വിവാഹം');
});
