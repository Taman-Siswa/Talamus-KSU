'use client';

import { useState, type ReactNode } from 'react';
import Icon from '../Icon';
import css from './admin.module.css';

/* Form parts for the school editor, drawn to "Design system v2": underlined inputs, pill chips,
   bordered row cards and a small inline switch. */

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/** `group` is for controls made of several buttons (chips): a <label> there would click the first button. */
export function Field({ label, note, required, group, className, children }: {
  label: ReactNode;
  /** faint text after the label, e.g. "· opsional" */
  note?: string;
  required?: boolean;
  group?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Wrap = group ? 'div' : 'label';
  return (
    <Wrap className={cx(css.field, className)}>
      <span className={css.fieldLabel}>
        {label}
        {required ? <span className={css.req} title="Wajib diisi"> *</span> : null}
        {note ? <span className={css.fieldNote}> · {note}</span> : null}
      </span>
      {children}
    </Wrap>
  );
}

/** Underlined text input. `strong` is the heavier style used for a school's name. */
export function TextInput({ value, onChange, placeholder, type = 'text', maxLength, min, max, invalid, strong, medium, code, label, list }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: 'text' | 'tel' | 'email' | 'date' | 'month' | 'url' | 'number';
  maxLength?: number; min?: string; max?: string; invalid?: boolean; strong?: boolean;
  /** weight 500, for a row's main line (task title, question) */
  medium?: boolean;
  code?: boolean;
  /** accessible name when there is no visible label */
  label?: string;
  /** id of a <datalist> with suggestions */
  list?: string;
}) {
  return (
    <input className={cx(css.input, strong && css.inputStrong, medium && css.inputMedium, code && css.inputCode, invalid && css.inputBad)}
      type={type} value={value} placeholder={placeholder} maxLength={maxLength} min={min} max={max}
      aria-label={label} list={list} aria-invalid={invalid || undefined} onChange={e => onChange(e.target.value)} />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 2 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return <textarea className={cx(css.input, css.textarea)} rows={rows} value={value} placeholder={placeholder}
    onChange={e => onChange(e.target.value)} />;
}

/** Pick one of a few options; clicking the chosen one again clears it when `clearable`. */
export function PickChips<T extends string>({ value, onChange, options, label, clearable }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string; clearable?: T;
}) {
  return (
    <div className={css.chips} role="radiogroup" aria-label={label}>
      {options.map(o => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} className={cx(css.chip, on && css.chipOn)}
            onClick={() => onChange(on && clearable !== undefined ? clearable : o.value)}>
            {on ? <Icon name="check" size={12} stroke={2.6} /> : null}{o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Pick any number of options. Three states: chosen (filled), not chosen (outline), and — unless `fixed` —
 * suggested (dashed, with a plus). Unless `fixed`, a text box adds values that are not in the list.
 */
export function ChipSet({ value, onChange, options, label, fixed, sorted }: {
  value: string[]; onChange: (v: string[]) => void; options: string[]; label: string;
  fixed?: boolean;
  /** keep chosen values in the order of `options` (typed extras last) instead of the order they were added */
  sorted?: boolean;
}) {
  const [text, setText] = useState('');
  const has = (t: string) => value.some(v => v.toLowerCase() === t.toLowerCase());
  const order = (all: string[]) => {
    if (!sorted) return all;
    const rank = (t: string) => { const i = options.indexOf(t); return i < 0 ? options.length : i; };
    return all.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i).map(x => x.t);
  };
  const toggle = (t: string) => onChange(has(t) ? value.filter(v => v.toLowerCase() !== t.toLowerCase()) : order([...value, t]));
  const add = () => {
    const t = text.trim();
    if (t && !has(t)) onChange(order([...value, t]));
    setText('');
  };
  const all = [...options, ...value.filter(v => !options.some(o => o.toLowerCase() === v.toLowerCase()))];
  return (
    <div className={cx(css.chips, css.chipsRoomy)} role="group" aria-label={label}>
      {all.map(t => {
        const on = has(t);
        const sugg = !on && !fixed;
        return (
          <button key={t} type="button" aria-pressed={on} className={cx(css.chip, css.chipLg, on && css.chipOn, sugg && css.chipSugg)}
            onClick={() => toggle(t)}>
            {on ? <Icon name="check" size={13} stroke={2.6} /> : sugg ? <Icon name="plus" size={12} stroke={2.2} /> : null}{t}
          </button>
        );
      })}
      {!fixed ? (
        <input className={css.chipInput} value={text} placeholder="Lainnya… (Enter)" aria-label={label + ' lainnya'}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          onBlur={() => { if (text) add(); }} />
      ) : null}
    </div>
  );
}

/** The legend for ChipSet's three states. */
export function ChipLegend() {
  return (
    <span className={css.legend} aria-hidden="true">
      <span><i className={css.legendOn} />terpilih</span>
      <span><i className={css.legendOff} />belum</span>
      <span><i className={css.legendSugg} />saran</span>
    </span>
  );
}

/** A small switch with its label beside it. `tone` colors the "on" track (school color by default). */
export function Switch({ checked, onChange, label, tone = 'school' }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; tone?: 'school' | 'amber';
}) {
  return (
    <button type="button" className={css.switchRow} role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className={cx(css.switch, checked && (tone === 'amber' ? css.switchAmber : css.switchOn))}><span className={css.knob} /></span>
      <span className={css.switchLabel}>{label}</span>
    </button>
  );
}

/** A text-only "+ Tambah …" button. */
export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={css.addBtn} onClick={onClick}>
      <Icon name="plus" size={14} stroke={2} />{children}
    </button>
  );
}

/** `removeLabel` turns the remove icon into a labelled button, for rows big enough that a bare × is easy to miss. */
export function RowTools({ i, count, onMove, onRemove, removeLabel }: {
  i: number; count: number; onMove: (to: number) => void; onRemove: () => void; removeLabel?: string;
}) {
  return (
    <>
      <button type="button" className={css.rowBtn} onClick={() => onMove(i - 1)} disabled={i === 0} aria-label="Naikkan" title="Naikkan">
        <Icon name="chevronUp" size={14} stroke={1.8} />
      </button>
      <button type="button" className={css.rowBtn} onClick={() => onMove(i + 1)} disabled={i === count - 1} aria-label="Turunkan" title="Turunkan">
        <Icon name="chevronDown" size={14} stroke={1.8} />
      </button>
      {removeLabel ? (
        <button type="button" className={css.removeBtn} onClick={onRemove}>
          <Icon name="trash" size={14} stroke={1.8} />{removeLabel}
        </button>
      ) : (
        <button type="button" className={cx(css.rowBtn, css.rowBtnDanger)} onClick={onRemove} aria-label="Hapus" title="Hapus">
          <Icon name="x" size={14} stroke={1.8} />
        </button>
      )}
    </>
  );
}

export const moveIn = <T,>(items: T[], i: number, to: number) => {
  if (to < 0 || to >= items.length) return items;
  const next = items.slice();
  [next[i], next[to]] = [next[to], next[i]];
  return next;
};

/** Repeating rows, each in a bordered card with its label and reorder/remove buttons on top. */
export function RepeatList<T>({ items, onChange, blank, render, addLabel, rowLabel, rowBadge, empty, removeLabel, extra }: {
  items: T[];
  onChange: (items: T[]) => void;
  /** a new, empty row */
  blank: () => T;
  render: (item: T, set: (patch: Partial<T>) => void, i: number) => ReactNode;
  addLabel: string;
  rowLabel: (item: T, i: number) => string;
  /** optional pill before the row label */
  rowBadge?: (item: T) => ReactNode;
  empty?: string;
  /** text for a labelled remove button, e.g. "Hapus ulasan" */
  removeLabel?: string;
  /** more add buttons next to the main one, e.g. a row that comes with its own fields */
  extra?: ReactNode;
}) {
  void empty;
  const replace = (i: number, item: T) => onChange(items.map((x, j) => (j === i ? item : x)));
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className={css.row}>
          <div className={css.rowHead}>
            {rowBadge ? rowBadge(item) : null}
            <span className={css.rowLabel}>{rowLabel(item, i)}</span>
            <RowTools i={i} count={items.length} onMove={to => onChange(moveIn(items, i, to))}
              onRemove={() => onChange(items.filter((_, j) => j !== i))} removeLabel={removeLabel} />
          </div>
          {render(item, patch => replace(i, { ...item, ...patch }), i)}
        </div>
      ))}
      <div className={css.addRow}>
        <AddButton onClick={() => onChange([...items, blank()])}>{addLabel}</AddButton>
        {extra}
      </div>
    </>
  );
}

/** A list of plain strings: a bullet, an underlined input and reorder/remove buttons per line. */
export function StringList({ items, onChange, addLabel, placeholder }: {
  items: string[]; onChange: (items: string[]) => void; addLabel: string; placeholder?: string;
}) {
  return (
    <>
      {items.map((item, i) => (
        <div key={i} className={css.lineRow}>
          <span className={css.bullet} />
          <input className={css.input} value={item} placeholder={placeholder}
            onChange={e => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
          <RowTools i={i} count={items.length} onMove={to => onChange(moveIn(items, i, to))}
            onRemove={() => onChange(items.filter((_, j) => j !== i))} />
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, ''])}>{addLabel}</AddButton>
    </>
  );
}

/** Small uppercase label above a group of fields, or above a group of sections. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(css.eyebrow, className)}>{children}</div>;
}

/**
 * One card of the editor. `status` is the completeness pill; a `collapsible` section folds away from its header,
 * open or closed as `open` says (the editor keeps that state so the pills above can open a section).
 */
export function Section({ id, title, icon, status, destination, collapsible, open = true, onToggle, livePreview, children }: {
  id: string; title: string; icon: Parameters<typeof Icon>[0]['name'];
  status?: { text: string; done: boolean };
  destination?: string;
  livePreview?: ReactNode;
  collapsible?: boolean; open?: boolean; onToggle?: () => void;
  children: ReactNode;
}) {
  const head = (
    <>
      <Icon name={icon} size={18} />
      <h2 className={css.sectionTitle}>{title}</h2>
      {status ? <span className={cx(css.pill, status.done && css.pillDone)}>{status.text}</span> : null}
      {collapsible ? <Icon name="chevronDown" size={18} className={cx(css.caret, open && css.caretOpen)} /> : null}
    </>
  );
  return (
    <section id={id} className={css.section}>
      {collapsible ? (
        <button type="button" className={cx(css.sectionHead, css.sectionToggle)} aria-expanded={open} onClick={onToggle}>{head}</button>
      ) : <div className={css.sectionHead}>{head}</div>}
      {open ? <div className={css.sectionBody}>{destination && <p className={css.subHelp}>Ditampilkan di: <strong>{destination}</strong></p>}{livePreview ? <div className={css.sectionFormLayout}>
        <div className={css.sectionFormFields}>{children}</div>
        <aside className={css.sectionLivePreview} aria-label={'Pratinjau ' + title}>
          <div className={[css.sectionPreviewScroll, 'skin-murid'].join(' ')}>{livePreview}</div>
        </aside>
      </div> : children}</div> : null}
    </section>
  );
}

/**
 * A compact list: one line per item (inputs side by side, tools at the end), for short rows such as a facility or a
 * highlight. `cols` is the grid template of the inputs, e.g. "2fr 3fr".
 */
export function LineList<T>({ items, onChange, blank, render, addLabel, empty, cols, head }: {
  items: T[];
  onChange: (items: T[]) => void;
  blank: () => T;
  render: (item: T, set: (patch: Partial<T>) => void, i: number) => ReactNode;
  addLabel: string;
  empty?: string;
  cols: string;
  /** column titles above the first line */
  head?: string[];
}) {
  void empty;
  const style = { '--cols': cols } as React.CSSProperties;
  return (
    <div className={css.lines}>
      {head && items.length > 0 ? <div className={css.lineHead} style={style}>{head.map(h => <span key={h}>{h}</span>)}<span /></div> : null}
      {items.map((item, i) => (
        <div key={i} className={css.lineItem} style={style}>
          {render(item, patch => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
          <span className={css.lineTools}>
            <RowTools i={i} count={items.length} onMove={to => onChange(moveIn(items, i, to))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
          </span>
        </div>
      ))}
      <AddButton onClick={() => onChange([...items, blank()])}>{addLabel}</AddButton>
    </div>
  );
}
