'use client';

import type { ChecklistItem } from '@/data/types';
import Icon from '../Icon';
import { AddButton, Field, Switch, TextInput } from './fields';
import css from './admin.module.css';

/** The column code is internal (it keys what the student typed), so it is generated, not asked. */
const nextKey = (fields: { k: string }[]) => {
  let n = fields.length + 1;
  while (fields.some(f => f.k === 'kolom' + n)) n++;
  return 'kolom' + n;
};

/** Metadata shared by document preparation and additional tasks; kept out of the spreadsheet form. */
export default function ChecklistSettings({ item, onChange }: {
  item: ChecklistItem;
  onChange: (patch: Partial<ChecklistItem>) => void;
}) {
  const fields = item.f || [];
  const setFields = (f: typeof fields) => onChange({ f: f.length ? f : undefined });
  return <>
    <div className={css.grid2}>
      <Field label="Catatan"><TextInput value={item.note || ''} onChange={note => onChange({ note })} /></Field>
      <Field label="Tanggal tenggat" note="opsional"><TextInput type="date" value={item.dl} onChange={dl => onChange({ dl })} /></Field>
    </div>
    <div className={css.rowTools}>
      <Switch checked={!!item.est} label="Tanggal masih perkiraan" onChange={est => onChange({ est })} />
      <AddButton onClick={() => setFields([...fields, { k: nextKey(fields), p: '' }])}>Tambah kolom isian siswa</AddButton>
    </div>
    {fields.map((f, j) => <div key={j} className={css.fieldRow}>
      <Field label="Teks petunjuk untuk siswa"><TextInput value={f.p} onChange={p => setFields(fields.map((x, q) => q === j ? { ...x, p } : x))} placeholder="NISN (10 digit)" /></Field>
      <button type="button" className={[css.rowBtn, css.rowBtnDanger].join(' ')} aria-label="Hapus kolom" onClick={() => setFields(fields.filter((_, q) => q !== j))}><Icon name="x" size={14} /></button>
    </div>)}
  </>;
}
