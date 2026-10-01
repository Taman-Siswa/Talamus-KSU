import assert from 'node:assert/strict';
import { test } from 'node:test';
import { schoolProblems, requirementGroup, isWebUrl, automaticSchoolLabels, schoolShortName, updateRequirementText } from '../src/lib/school-form.ts';

const school = () => ({
  id: 'test', name: 'SMA Contoh', short: 'Contoh', mono: 'SC',
  info: { kind: '', founded: '', province: '', curriculum: [], boarding: '', funding: [], quota: '', contact: '' },
  phases: [], checklist: [], reqs: [], docs: [], faq: [], calc: null,
});
const document = id => ({ id, l: 'Scan KTP', dl: '', document: {
  required: true, rules: [{ format: 'JPG/PNG', maxMB: '5' }, { format: 'PDF', maxMB: '10' }], template: '',
} });

test('legacy records need no new profile fields and keep old task IDs', () => {
  const s = school();
  s.checklist = [{ id: 'rapor', l: 'Rapor', dl: '2027-01-10' }];
  assert.deepEqual(schoolProblems(s), []);
  assert.equal(requirementGroup({ k: 'Nilai rapor', v: '' }), 'akademis');
  assert.equal(requirementGroup({ k: 'Kesehatan', v: '', cat: 'Kesehatan' }), 'fisik');
  assert.equal(requirementGroup({ k: 'Usia', v: '', cat: 'Usia' }), 'utama');
  assert.equal(s.checklist[0].id, 'rapor');
});

test('a document accepts separate size limits by format without inventing a deadline', () => {
  const s = school(); s.checklist = [document('a')];
  const original = structuredClone(s);
  assert.deepEqual(schoolProblems(s), []);
  assert.deepEqual(s, original);
});

test('publication rejects incomplete file rules and unsafe template links', () => {
  const s = school(); s.checklist = [document('a')];
  s.checklist[0].document.rules[0].maxMB = '-1';
  s.checklist[0].document.template = 'javascript:alert(1)';
  assert.equal(schoolProblems(s).length, 2);
  s.checklist[0].document.rules = [];
  assert.ok(schoolProblems(s).some(e => e.includes('tambahkan format')));
});

test('duplicate task IDs and field keys are blocked before they share student progress', () => {
  const s = school(); s.checklist = [document('same'), document('same')];
  s.checklist[0].f = [{ k: 'nisn', p: '' }, { k: 'nisn', p: '' }];
  assert.ok(schoolProblems(s).some(e => e.includes('ID tugas')));
  assert.ok(schoolProblems(s).some(e => e.includes('kode kolom')));
});

test('stages need a name and full, ordered dates; a single-day stage is valid', () => {
  const s = school(); s.phases = [{ l: '', s: '2027-02-30', e: '' }];
  assert.equal(schoolProblems(s).length, 2);
  s.phases = [{ l: 'Tes', s: '2027-01-13', e: '2027-01-12' }];
  assert.equal(schoolProblems(s).length, 1);
  s.phases[0].e = '';
  assert.deepEqual(schoolProblems(s), []);
});

test('quotas validate academic years, unique periods, and positive whole seats', () => {
  const s = school(); s.info.quotas = [{ year: '2027-2028', seats: '180' }, { year: '2026-2027', seats: '120' }];
  assert.deepEqual(schoolProblems(s), []);
  s.info.quotas[1] = { year: '2027-2028', seats: '0' };
  assert.equal(schoolProblems(s).length, 2);
  s.info.quotas = [{ year: '2027-2029', seats: '1.5' }];
  assert.equal(schoolProblems(s).length, 2);
});

test('calculator cannot publish empty selections or out-of-range thresholds', () => {
  const s = school(); s.calc = { subjects: [], sems: [], minAvg: 101, minSem: -1 };
  assert.equal(schoolProblems(s).length, 2);
  s.calc = { subjects: ['IPA'], sems: ['7-1'], minAvg: 80, minSem: null };
  assert.deepEqual(schoolProblems(s), []);
});

test('empty content rows and malformed contacts do not silently publish', () => {
  const s = school(); s.reqs = [{ k: '', v: '' }]; s.faq = [{ q: '', a: '' }];
  s.docs = [{ l: 'Panduan', h: '/relative' }]; s.info.email = 'not-an-email';
  assert.equal(schoolProblems(s).length, 6);
  assert.equal(isWebUrl('https://example.com/template.pdf'), true);
  assert.equal(isWebUrl('file:///private/file'), false);
});


test('automatic short name and card label replace manual labels without changing other data', () => {
  const s = school();
  s.name = 'SMA Pradita Dirgantara'; s.short = 'Custom'; s.pill = 'Label lama';
  s.info.kind = 'Swasta'; s.info.boarding = 'Tersedia'; s.info.province = 'Jawa Tengah';
  s.checklist = [document('stable-id')];
  const original = structuredClone(s);
  const derived = automaticSchoolLabels(s);
  assert.equal(derived.short, 'Pradita Dirgantara');
  assert.equal(derived.pill, 'Swasta · Tersedia · Jawa Tengah');
  assert.equal(derived.mono, s.mono);
  assert.deepEqual(derived.checklist, s.checklist);
  assert.deepEqual(s, original);
  const edited = automaticSchoolLabels({ ...derived, name: 'SMA Kemala Taruna Bhayangkara', info: { ...derived.info, province: 'Jawa Barat' } });
  assert.equal(edited.short, 'Kemala Taruna Bhayangkara');
  assert.equal(edited.pill, 'Swasta · Tersedia · Jawa Barat');
  assert.deepEqual(automaticSchoolLabels(edited), edited);
});

test('school names and blank classifications produce clean automatic display values', () => {
  assert.equal(schoolShortName('SMAN 8 Jakarta'), 'SMAN 8 Jakarta');
  assert.equal(schoolShortName('SMA Negeri 8 Jakarta'), 'SMA Negeri 8 Jakarta');
  assert.equal(schoolShortName('SMA 8 Jakarta'), 'SMA 8 Jakarta');
  const s = school(); s.name = ''; s.info.province = 'Jawa Barat';
  const derived = automaticSchoolLabels(s);
  assert.equal(derived.short, ''); assert.equal(derived.pill, 'Jawa Barat');
});

test('one requirement text field generates a title while preserving custom titles and details', () => {
  const empty = { k: '', v: '', group: 'utama', det: { catatan: 'Tetap' } };
  const first = updateRequirementText(empty, 'Warga Negara Indonesia');
  assert.equal(first.k, first.v);
  const edited = updateRequirementText(first, 'Warga Negara Indonesia (WNI).');
  assert.equal(edited.k, edited.v);
  const legacy = { ...edited, k: 'Kewarganegaraan' };
  const changed = updateRequirementText(legacy, 'WNI dengan bukti identitas.');
  assert.equal(changed.k, 'Kewarganegaraan');
  assert.deepEqual(changed.det, empty.det);
  assert.equal(changed.group, 'utama');
  assert.equal(updateRequirementText(edited, '').k, '');
});
