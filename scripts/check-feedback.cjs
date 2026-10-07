/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness loads TypeScript fixtures without another test dependency. */
// Run with: node scripts/check-feedback.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (id, ...args) {
  return originalResolve.call(this, id.startsWith('@/') ? path.resolve(__dirname, '../src', id.slice(2)) : id, ...args);
};
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
}).outputText, filename);
const { schoolContact, contactRows } = require('../src/lib/school-contact.ts');
const { checklistOf } = require('../src/lib/schools.ts');
const { progressOf } = require('../src/lib/murid.ts');
const { toFormShape } = require('../src/lib/school-form.ts');
const s = {
  id: 'test', name: 'SMA Test', tag: '', info: { kind: '', province: '', boarding: '', curriculum: [], funding: [] }, reqs: [], calc: null,
  profile: [{ k: 'KONTAK', v: 'Telepon: +62 85282227300 · Email: info@example.org' }, { k: 'ALAMAT', v: 'Jalan Contoh 1' }, { k: 'BERDIRI', v: '1990' }],
  checklist: [{ id: 'rapor', l: 'Scan rapor', dl: '', document: { required: true, rules: [], template: '' } }, { id: 'akun', l: 'Buat akun', dl: '' }],
  phases: [{ l: 'Pendaftaran', t: 'daftar', s: '2026-10-01', e: '2026-10-31' }, { l: 'Tes akademik', t: 'tes', s: '2026-11-01' }],
};
assert.deepEqual(checklistOf(s, 'berkas').map(c => c.id), ['rapor']);
assert.equal(checklistOf(s, 'pendaftaran').length, 3);
assert.equal(checklistOf(s).length, 4);
const checks = { 'test.rapor': true };
assert.equal(progressOf(s, checks, 'berkas').pct, 100);
assert.equal(progressOf(s, checks, 'pendaftaran').done, 0);
assert.equal(progressOf({ ...s, checklist: [], phases: [] }, {}, 'berkas').pct, 0);
const migrated = toFormShape(s);
assert.equal(migrated.info.phone, '+62 85282227300');
assert.equal(migrated.info.email, 'info@example.org');
assert.equal(migrated.info.address, 'Jalan Contoh 1');
assert.deepEqual(migrated.profile, [{ k: 'BERDIRI', v: '1990' }]);
assert.deepEqual(toFormShape(migrated), migrated);
assert.equal(contactRows(s)[1].href, 'mailto:info@example.org');
assert.equal(contactRows(s)[2].v, '');
const legacy = schoolContact({ ...s, profile: [], info: { ...s.info, phone: '123', contact: 'Telepon: 456 · Hubungi sekretariat pagi hari' } });
assert.equal(legacy.info.phone, '123');
assert.equal(legacy.info.contact, '456 · Hubungi sekretariat pagi hari');
assert.deepEqual(schoolContact({ ...s, ...legacy }), legacy);
assert.equal(contactRows({ ...s, profile: [], info: { ...s.info, website: 'javascript:alert(1)' } })[2].href, undefined);
console.log('Passed: checklist isolation, saved progress, empty lists, legacy contact migration, idempotence, conflict preservation, safe links.');

const categorized = { ...s, checklist: s.checklist.map(c => c.document ? { ...c, document: { ...c.document, category: 'Khusus Jalur B2P', required: true } } : c) };
const categoryRoundTrip = toFormShape(JSON.parse(JSON.stringify(toFormShape(categorized))));
assert.equal(categoryRoundTrip.checklist[0].document.category, 'Khusus Jalur B2P');
assert.equal(categoryRoundTrip.checklist[0].document.required, true);
assert.equal(categoryRoundTrip.checklist[0].id, 'rapor');
console.log('Passed: document category survives save/load without changing obligation or progress identity.');
