import type { School } from '@/data/types';

const fields = {
  phone: /^(telepon|telp|tlp|phone|whatsapp|wa|telepon\s*\/\s*whatsapp)$/i,
  email: /^(e-?mail)$/i,
  website: /^(website|situs|situs web)$/i,
  address: /^(alamat|alamat lengkap)$/i,
} as const;
type Field = keyof typeof fields;

/** Adopt explicit legacy contact labels, preserving ambiguous text for manual editing. */
export function schoolContact(s: School) {
  const info = { ...s.info };
  const profile: { k: string; v: string }[] = [];
  const notes: string[] = [];
  const assign = (key: Field, value: string) => {
    if (info[key] === undefined) info[key] = value.trim();
    else if (info[key] !== value.trim()) notes.push(value.trim());
  };
  const parse = (value: string) => {
    value.split(/\s*[·\n]\s*|\s+(?=(?:Telepon|Telp|Email|Website|Alamat):)/i).filter(Boolean).forEach(part => {
      const match = part.match(/^([^:]+):\s*(.+)$/);
      const key = match && (Object.keys(fields) as Field[]).find(k => fields[k].test(match[1].trim()));
      if (key && match) assign(key, match[2]); else notes.push(part);
    });
  };
  if (info.contact) parse(info.contact);
  for (const row of s.profile ?? []) {
    const key = (Object.keys(fields) as Field[]).find(k => fields[k].test(row.k.trim()));
    if (key) assign(key, row.v);
    else if (/^kontak$/i.test(row.k.trim())) parse(row.v);
    else profile.push(row);
  }
  info.contact = [...new Set(notes)].join(' · ');
  return { info, profile };
}

export function contactRows(s: School) {
  const { info } = schoolContact(s);
  const phone = info.phone?.trim() || '';
  const email = info.email?.trim() || '';
  const website = info.website?.trim() || '';
  let webHref: string | undefined;
  try {
    const url = new URL(website.includes('://') ? website : 'https://' + website);
    if (website && /^https?:$/.test(url.protocol) && url.hostname.includes('.')) webHref = url.href;
  } catch { /* Invalid legacy URLs remain readable text. */ }
  return [
    { k: 'Telepon / WhatsApp', v: phone, href: /^\+?[\d\s().-]+$/.test(phone) ? 'tel:' + phone.replace(/[^+\d]/g, '') : undefined },
    { k: 'Email', v: email, href: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'mailto:' + email : undefined },
    { k: 'Website', v: website, href: webHref },
    { k: 'Alamat lengkap', v: info.address?.trim() || '', href: undefined },
    ...(info.contact ? [{ k: 'Catatan kontak', v: info.contact, href: undefined }] : []),
  ];
}
