'use client';

import { useState, type ReactNode } from 'react';
import Icon from '../Icon';
import css from './admin.module.css';

/** `group` is for controls made of several buttons (tags, check pills): a <label> there would click the first button. */
export function Field({ label, hint, error, required, group, children }: {
  label: ReactNode; hint?: ReactNode; /** replaces the hint, in the warning color */ error?: string; required?: boolean; group?: boolean; children: ReactNode;
}) {
  const Wrap = group ? 'div' : 'label';
  return (
    <Wrap className={css.field}>
      <span className={css.fieldLabel}>
        {label}{required ? <span className={css.req} title="Wajib diisi"> *</span> : null}
      </span>
      {children}
      {error ? <span className={css.fieldError} role="alert">{error}</span> : hint ? <span className={css.fieldHint}>{hint}</span> : null}
    </Wrap>
  );
}

/** `min`/`max` grey out dates in the browser's date picker; typed dates can still fall outside, so callers validate too. */
export function TextInput({ value, onChange, placeholder, type = 'text', maxLength, min, max, invalid }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'date' | 'url' | 'number';
  maxLength?: number; min?: string; max?: string; invalid?: boolean;
}) {
  return <input className={[css.input, invalid ? css.inputBad : ''].join(' ')} type={type} value={value} placeholder={placeholder}
    maxLength={maxLength} min={min} max={max} aria-invalid={invalid || undefined} onChange={e => onChange(e.target.value)} />;
}

/** A string[] as removable tags. Enter or comma adds the typed text; Backspace on an empty input removes the last tag. */
export function TagInput({ value, onChange, label, placeholder, suggestions = [], sorted }: {
  value: string[]; onChange: (v: string[]) => void; label: string; placeholder?: string; suggestions?: string[];
  /** keep tags in the order of `suggestions` (typed extras go last) instead of the order they were added */
  sorted?: boolean;
}) {
  const [text, setText] = useState('');
  const has = (t: string) => value.some(v => v.toLowerCase() === t.toLowerCase());
  const add = (raw: string) => {
    const next = raw.split(',').map(t => t.trim()).filter(t => t && !has(t));
    if (next.length) {
      const all = [...value, ...next.filter((t, i) => next.findIndex(x => x.toLowerCase() === t.toLowerCase()) === i)];
      const rank = (t: string) => { const i = suggestions.indexOf(t); return i < 0 ? suggestions.length : i; };
      onChange(sorted ? all.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i).map(x => x.t) : all);
    }
    setText('');
  };
  const left = suggestions.filter(t => !has(t));
  return (
    <>
      <div className={css.tags}>
        {value.map(t => (
          <span key={t} className={css.tag}>
            {t}
            <button type="button" className={css.tagX} aria-label={'Hapus ' + t} onClick={() => onChange(value.filter(v => v !== t))}>
              <Icon name="x" size={12} stroke={2.4} />
            </button>
          </span>
        ))}
        <input className={css.tagInput} value={text} aria-label={label} placeholder={value.length ? '' : placeholder}
          onChange={e => (e.target.value.includes(',') ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(text); }
            else if (e.key === 'Backspace' && !text && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => add(text)} />
      </div>
      {left.length > 0 ? (
        <div className={css.checks}>
          {left.map(t => (
            <button key={t} type="button" className={css.suggest} onClick={() => add(t)}><Icon name="plus" size={12} stroke={2.2} />{t}</button>
          ))}
        </div>
      ) : null}
    </>
  );
}

/** Pick any of a few fixed options — for Notion multi-selects with a known set, like Pembiayaan. */
export function CheckGroup({ value, onChange, options, label }: {
  value: string[]; onChange: (v: string[]) => void; options: string[]; label: string;
}) {
  return (
    <div className={css.checks} role="group" aria-label={label}>
      {options.map(o => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} className={[css.check, on ? css.checkOn : ''].join(' ')}
            onClick={() => onChange(on ? value.filter(v => v !== o) : options.filter(v => v === o || value.includes(v)))}>
            {on ? <Icon name="check" size={14} stroke={2.4} /> : null}{o}
          </button>
        );
      })}
    </div>
  );
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return <textarea className={[css.input, css.textarea].join(' ')} rows={rows} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)} />;
}

export function Select<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
  return (
    <select className={[css.input, css.select].join(' ')} value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Switch({ checked, onChange, label, note }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; note?: string;
}) {
  return (
    <button type="button" className={css.switchRow} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className={[css.switch, checked ? css.switchOn : ''].join(' ')}><span className={css.knob} /></span>
      <span className={css.switchText}>
        <span className={css.switchLabel}>{label}</span>
        {note ? <span className={css.switchNote}>{note}</span> : null}
      </span>
    </button>
  );
}

/** A list of repeating rows with add, remove and reorder — the shape most school data takes. */
export function RepeatList<T>({ items, onChange, blank, render, addLabel, rowLabel, empty }: {
  items: T[];
  onChange: (items: T[]) => void;
  /** a new, empty row */
  blank: () => T;
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  rowLabel: (item: T, i: number) => string;
  empty?: string;
}) {
  const replace = (i: number, item: T) => onChange(items.map((x, j) => (j === i ? item : x)));
  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  return (
    <div className={css.repeat}>
      {items.length === 0 && empty ? <p className={css.repeatEmpty}>{empty}</p> : null}
      {items.map((item, i) => (
        <div key={i} className={css.row}>
          <div className={css.rowHead}>
            <span className={css.rowLabel}>{rowLabel(item, i)}</span>
            <button type="button" className={css.rowBtn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Naikkan">
              <Icon name="chevronUp" size={15} />
            </button>
            <button type="button" className={css.rowBtn} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Turunkan">
              <Icon name="chevronDown" size={15} />
            </button>
            <button type="button" className={[css.rowBtn, css.rowBtnDanger].join(' ')}
              onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Hapus">
              <Icon name="trash" size={15} />
            </button>
          </div>
          <div className={css.rowBody}>{render(item, patch => replace(i, { ...item, ...patch }))}</div>
        </div>
      ))}
      <button type="button" className={css.addBtn} onClick={() => onChange([...items, blank()])}>
        <Icon name="plus" size={16} />{addLabel}
      </button>
    </div>
  );
}

/** `status` is a short completeness note ("3 item", "Belum diisi"); a collapsible section starts closed. */
export function Section({ id, title, icon, desc, status, collapsible, children }: {
  id: string; title: string; icon: Parameters<typeof Icon>[0]['name']; desc?: string;
  status?: { text: string; done: boolean }; collapsible?: boolean; children: ReactNode;
}) {
  const [open, setOpen] = useState(!collapsible);
  const head = (
    <>
      <Icon name={icon} size={18} />
      <h2 className={css.sectionTitle}>{title}</h2>
      {status ? <span className={[css.sectionStatus, status.done ? css.sectionDone : ''].join(' ')}>{status.text}</span> : null}
      {collapsible ? <Icon name={open ? 'chevronUp' : 'chevronDown'} size={18} /> : null}
    </>
  );
  return (
    <section id={id} className={css.section}>
      {collapsible ? (
        <button type="button" className={[css.sectionHead, css.sectionToggle].join(' ')} aria-expanded={open} onClick={() => setOpen(!open)}>
          {head}
        </button>
      ) : <div className={css.sectionHead}>{head}</div>}
      {desc ? <p className={css.sectionDesc}>{desc}</p> : null}
      {open ? <div className={css.sectionBody}>{children}</div> : null}
    </section>
  );
}

/** A list of plain strings, one input per row — for simple lists like facts. */
export function StringList({ items, onChange, addLabel, placeholder, empty }: {
  items: string[]; onChange: (items: string[]) => void; addLabel: string; placeholder?: string; empty?: string;
}) {
  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = items.slice();
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  return (
    <div className={css.repeat}>
      {items.length === 0 && empty ? <p className={css.repeatEmpty}>{empty}</p> : null}
      {items.map((item, i) => (
        <div key={i} className={css.lineRow}>
          <input className={css.input} value={item} placeholder={placeholder}
            onChange={e => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className={css.rowBtn} onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Naikkan">
            <Icon name="chevronUp" size={15} />
          </button>
          <button type="button" className={css.rowBtn} onClick={() => move(i, i + 1)} disabled={i === items.length - 1} aria-label="Turunkan">
            <Icon name="chevronDown" size={15} />
          </button>
          <button type="button" className={[css.rowBtn, css.rowBtnDanger].join(' ')}
            onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Hapus">
            <Icon name="trash" size={15} />
          </button>
        </div>
      ))}
      <button type="button" className={css.addBtn} onClick={() => onChange([...items, ''])}>
        <Icon name="plus" size={16} />{addLabel}
      </button>
    </div>
  );
}
