/* TAMAN Fit Check: five questions every student answers about a school, plus the "Ceritaku" paragraph. */

export const FIT_LETTERS: { L: string; name: string; q: string; more: [string, string] }[] = [
  { L: 'T', name: 'Tujuan', q: 'Lulusannya banyak yang sampai ke tujuan yang aku mau?', more: ['Setelah SMA kamu mau ke mana? Kenapa sekolah ini bisa membawamu ke sana?', 'Bukti apa yang kamu lihat — data alumni, cerita kakak kelas, atau info resmi?'] },
  { L: 'A', name: 'Akademik', q: 'Kemampuanku sudah dekat dengan standar seleksinya?', more: ['Pelajaran mana yang sudah kuat, dan mana yang masih jadi gap?', 'Dari mana kamu tahu — hasil TO, rapor, atau perasaan?'] },
  { L: 'M', name: 'Mental', q: 'Siap dengan asrama, disiplin, dan jauh dari rumah?', more: ['Bayangkan seminggu di asrama. Bagian mana yang paling berat buatmu?', 'Pernah jauh dari rumah atau ikut kegiatan dengan disiplin ketat? Gimana rasanya?'] },
  { L: 'A', name: 'Anggaran', q: 'Biaya, beasiswa, dan lokasinya realistis buat keluargaku?', more: ['Biaya, beasiswa, dan lokasinya — apa yang sudah jelas, apa yang belum?', 'Apa yang perlu dibicarakan dengan keluarga soal ini?'] },
  { L: 'N', name: 'Nilai', q: 'Budaya dan value sekolahnya cocok dengan karakterku?', more: ['Value atau budaya sekolah mana yang paling terasa cocok denganmu?', 'Ada aturan atau kebiasaan di sana yang bikin kamu ragu?'] },
];

/** The "Ceritaku" paragraph: a sentence start, a blank, optionally a middle and a second blank, and a hint. */
export const STORY_LINES = (short: string): { pre: string; k1: string; mid?: string; k2?: string; tag: string }[] => [
  { pre: `Aku memilih ${short} karena setelah SMA aku ingin`, k1: 's1', tag: '(T)' },
  { pre: 'Yang paling bikin aku cocok di sana:', k1: 's2', tag: '(skor tertinggi)' },
  { pre: 'Yang masih bikin aku ragu:', k1: 's3', mid: ', dan rencanaku:', k2: 's4', tag: '(skor terendah)' },
  { pre: 'Gap akademikku ada di', k1: 's5', mid: ', jadi mulai minggu ini aku akan', k2: 's6', tag: '(A)' },
  { pre: 'Orang yang akan aku ajak ngobrol soal ini:', k1: 's7', tag: '' },
];

export const STORY_KEYS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7'];

/** Sentence-by-sentence summary shown on the school card in the picker. */
export function storySummary(short: string, s: Record<string, string> = {}) {
  const parts = [
    s.s1 && `Aku memilih ${short} karena setelah SMA aku ingin ${s.s1}.`,
    s.s2 && `Yang paling bikin aku cocok: ${s.s2}.`,
    (s.s3 || s.s4) && `Yang masih bikin ragu: ${s.s3 || '…'}${s.s4 ? ', dan rencanaku: ' + s.s4 : ''}.`,
    (s.s5 || s.s6) && `Gap akademikku di ${s.s5 || '…'}${s.s6 ? ', jadi aku akan ' + s.s6 : ''}.`,
    s.s7 && `Aku akan ngobrol dengan ${s.s7}.`,
  ].filter(Boolean) as string[];
  return { text: parts.join(' '), count: parts.length };
}

export const scoreReading = (me: number[]) => {
  const total = me.reduce((a, b) => a + b, 0);
  const filled = me.length === 5 && me.every(x => x > 0);
  if (!filled) return { total, range: '?', title: 'Lengkapi skormu', sub: 'Isi kelima huruf untuk melihat hasil.', tone: 'none' as const };
  if (total >= 20) return { total, range: '20–25', title: 'Target utama', sub: 'Cocok. Fokus kejar seleksinya.', tone: 'ok' as const };
  if (total >= 14) return { total, range: '14–19', title: 'Cocok, tapi ada PR', sub: 'Cek dulu skor terendahmu.', tone: 'amb' as const };
  return { total, range: '< 14', title: 'Pikir ulang', sub: 'Cari sekolah yang lebih pas.', tone: 'warn' as const };
};
