import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const context = { window: {} };
vm.runInNewContext(await readFile(new URL('../site/casebook-logic.js', import.meta.url), 'utf8'), context);
const { matchesDatasetNote, sortProjects, mergeSavedSlugs } = context.window.CasebookLogic;
const projects = [
  { slug: 'small', title: 'Small sample', dataset: { rows: 15, raggedRows: 0 } },
  { slug: 'unknown', title: 'Unknown input', dataset: { rows: null, raggedRows: 0 } },
  { slug: 'ragged', title: 'Needs review', dataset: { rows: 20, raggedRows: 2 } },
  { slug: 'large', title: 'Large input', dataset: { rows: 1000, raggedRows: 0 } },
];

test('data-note filters separate small samples, unmatched inputs, and review cases', () => {
  assert.deepEqual(projects.filter(project => matchesDatasetNote(project, 'small')).map(project => project.slug), ['small', 'ragged']);
  assert.deepEqual(projects.filter(project => matchesDatasetNote(project, 'unmatched')).map(project => project.slug), ['unknown']);
  assert.deepEqual(projects.filter(project => matchesDatasetNote(project, 'review')).map(project => project.slug), ['unknown', 'ragged']);
});

test('dataset sorting orders known sizes and keeps unmatched inputs last without mutating input', () => {
  assert.deepEqual(Array.from(sortProjects(projects, 'largest'), project => project.slug), ['large', 'ragged', 'small', 'unknown']);
  assert.deepEqual(Array.from(sortProjects(projects, 'smallest'), project => project.slug), ['small', 'ragged', 'large', 'unknown']);
  assert.equal(projects[0].slug, 'small');
});

test('reading-list restore merges only recognized case slugs and rejects unsupported backups', () => {
  const valid = ['small', 'large'];
  const backup = { format: 'data-fieldnotes-reading-list', version: 1, slugs: ['large', 'unknown', 'large', null] };
  assert.deepEqual(Array.from(mergeSavedSlugs(['small'], backup, valid)), ['small', 'large']);
  assert.equal(mergeSavedSlugs([], { format: 'other', version: 1, slugs: [] }, valid), null);
});
