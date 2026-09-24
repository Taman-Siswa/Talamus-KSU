import type { School } from './types';

export const SCHOOLS: School[] = [
  {
    id: 'tn', mono: 'TN', short: 'Taruna Nusantara', name: 'SMA Taruna Nusantara', pill: 'Boarding \u00b7 Kemhan',
    // from the school's page in the Notion catalog
    info: { kind: 'Swasta', founded: '1990', province: 'Jawa Tengah', curriculum: ['Kurikulum Merdeka', 'Kurikulum K-13'], boarding: 'Asrama Semi-Militer', funding: ['Beasiswa'], quota: '300', contact: 'https://tarunanusantara.sch.id/' },
    tag: 'Sekolah berasrama Kemhan \u2014 pendaftaran 2027/28 sedang dibuka, gratis + beasiswa penuh.',
    status: 'resmi',
    banner: 'Pendaftaran 2027/28 RESMI dibuka 9\u201323 Sep 2026 di pensisru.tarunanusantara.id (gratis). Jadwal tahap setelah pendaftaran masih estimasi dari pola tahun-tahun lalu.',
    facts: ['6 kampus: Magelang, Cimahi, Malang, Pagar Alam, IKN, Langowan \u2014 penempatan oleh panitia', 'Gratis + beasiswa penuh selama pendidikan (2027/28)', 'Usia maksimal 17 tahun per 1 Juli 2027'],
    reqs: [
      { k: 'Jalur reguler', v: 'B. Indonesia, B. Inggris, Matematika, IPA (nilai pengetahuan sem 1\u20134): rata-rata per mapel \u2265 85 DAN nilai tiap semester \u2265 80.' },
      { k: 'Jalur prestasi', v: 'Rata-rata \u2265 80, tiap semester \u2265 75 \u2014 dengan juara 1\u20133 minimal tingkat kab/kota (OSN, O2SN, FLS2N, dll.) atau pernah ketua OSIS.' },
      { k: 'Dokumen', v: 'Rapor sem 1\u20134 legalisir, surat sehat dokter, surat pernyataan (kepsek, ortu, casis \u2014 format di bit.ly/PersyaratanPensisruSMATN), pas foto 4x6, kartu pelajar.' },
      { k: 'Nilai tambah', v: 'Opsional: hasil tes IQ \u2265 110 (HIMPSI, maks. 6 bulan) dan sertifikat TOEFL.' },
      { k: 'Tahapan', v: 'Administrasi \u2192 tes akademik online \u2192 rikkes & wawancara \u2192 seleksi akhir offline (akademik, jasmani, psikologi).' }
    ],
    calc: { subjects: ['B. Indonesia', 'B. Inggris', 'Matematika', 'IPA'], sems: ['7-1', '7-2', '8-1', '8-2'], minAvg: 85, minSem: 80 },
    calcNote: 'Nilai pengetahuan rapor semester 1\u20134 (kelas VII\u2013VIII). Reguler: rata-rata \u2265 85 dan tiap semester \u2265 80. Aktifkan jalur prestasi bila punya prestasi yang memenuhi.',
    passNote: 'Memenuhi ambang nilai rapor jalur ' + '' + 'yang dipilih. Lanjut lengkapi dokumen & submit sebelum 23 Sep 2026.',
    failNote: 'Coba aktifkan jalur prestasi bila ada juara min. kab/kota atau pernah ketua OSIS.',
    bodyNote: 'Tidak ada angka resmi \u2014 postur dinilai saat rikkes & kesamaptaan. IMT 17\u201325 patokan aman.',
    phases: [
      { l: 'Pendaftaran online', s: '2026-09-09', e: '2026-09-23', t: 'daftar', est: false },
      { l: 'Seleksi administrasi', s: '2026-09-24', e: '2026-10-08', t: 'tes', est: true },
      { l: 'Tes akademik online', s: '2026-10-12', e: '2026-10-16', t: 'tes', est: true },
      { l: 'Rikkes & wawancara', s: '2026-11-02', e: '2026-11-13', t: 'tes', est: true },
      { l: 'Seleksi akhir offline (akademik, jasmani, psikologi)', s: '2026-12-01', e: '2026-12-10', t: 'tes', est: true },
      { l: 'Pengumuman', s: '2026-12-20', e: '2026-12-22', t: 'umum', est: true }
    ],
    checklist: [
      { id: 'akun', l: 'Buat akun casis di pensisru.tarunanusantara.id', d: '20 Sep 2026', dl: '2026-09-20', f: [{ k: 'email', p: 'Email aktif' }, { k: 'pass', p: 'Password akun (tersimpan di perangkat ini saja)' }] },
      { id: 'rapor', l: 'Foto rapor sem 1\u20134 yang sudah dilegalisir', d: '20 Sep 2026', dl: '2026-09-20', note: 'Nilai pengetahuan B.Indo, B.Ing, Matematika, IPA' },
      { id: 'surat', l: 'Surat pernyataan kepsek, ortu, dan casis', d: '21 Sep 2026', dl: '2026-09-21', note: 'Format resmi: bit.ly/PersyaratanPensisruSMATN' },
      { id: 'sehat', l: 'Surat keterangan sehat dari dokter', d: '21 Sep 2026', dl: '2026-09-21' },
      { id: 'iq', l: 'Opsional: tes IQ \u2265 110 (HIMPSI) & TOEFL sebagai nilai tambah', d: '21 Sep 2026', dl: '2026-09-21' },
      { id: 'prestasi', l: 'Scan sertifikat prestasi (wajib untuk jalur prestasi)', d: '21 Sep 2026', dl: '2026-09-21' },
      { id: 'submit', l: 'Submit pendaftaran sebelum ditutup', d: '23 Sep 2026', dl: '2026-09-23' },
      { id: 'tes', l: 'Siapkan perangkat & koneksi untuk tes akademik online', d: 'Okt 2026', dl: '2026-10-12' }
    ],
    docs: [
      { l: 'Portal Pensisru 2027/28', m: 'pensisru.tarunanusantara.id — pendaftaran resmi, dibuka 9–23 Sep 2026', h: 'https://pensisru.tarunanusantara.id', arsip: false },
      { l: 'Format surat pernyataan (kepsek, ortu, casis)', m: 'bit.ly/PersyaratanPensisruSMATN', h: 'https://bit.ly/PersyaratanPensisruSMATN', arsip: false },
      { l: 'Pedoman Pensisru 2026/27', m: 'Referensi tahapan & ambang nilai tahun lalu', h: 'https://tarunanusantara.sch.id', arsip: true }
    ],
    faq: [
      { q: 'Nilai rata-rata anak saya di bawah 85, masih bisa daftar?', a: 'Bisa lewat jalur prestasi: rata-rata \u2265 80 dan tiap semester \u2265 75, dengan syarat juara 1\u20133 minimal tingkat kab/kota (akademik, olahraga, seni) atau pernah menjabat ketua OSIS. Di bawah itu, berkas gugur di seleksi administrasi.' },
      { q: 'Berapa biayanya?', a: 'Untuk angkatan 2027/28 pendaftaran dan seleksi gratis, dan siswa yang diterima mendapat beasiswa penuh selama pendidikan.' },
      { q: 'Bisa pilih kampus yang mana?', a: 'Tidak \u2014 penempatan di salah satu dari 6 kampus (Magelang, Cimahi, Malang, Pagar Alam, IKN, Langowan) ditentukan panitia penerimaan.' },
      { q: 'Tes IQ wajib?', a: 'Tidak wajib, tapi hasil IQ \u2265 110 jadi nilai tambah. Harus dari psikolog anggota HIMPSI dan berlaku maksimal 6 bulan sebelum pendaftaran.' },
      { q: 'Seleksinya seperti apa?', a: 'Empat tahap: seleksi administrasi \u2192 tes akademik online \u2192 pemeriksaan kesehatan & wawancara \u2192 seleksi akhir offline yang menilai akademik, jasmani, dan psikologi.' }
    ]
  },
  {
    id: 'ktb', mono: 'KTB', short: 'Kemala Taruna Bhayangkara', name: 'SMA Kemala Taruna Bhayangkara', pill: 'Boarding \u00b7 Polri \u00b7 IB',
    // from the school's page in the Notion catalog
    info: { kind: 'Swasta', founded: '2024', province: 'Jawa Barat', curriculum: ['Kurikulum Merdeka', 'International Baccalaureate'], boarding: 'Asrama Semi-Militer', funding: ['Beasiswa'], quota: '', contact: 'Telepon: +62 85282227300 · Email: info@kaderbangsa.foundation' },
    tag: 'Sekolah berasrama Polri dengan kurikulum IB \u2014 beasiswa penuh, kuota 180 siswa.',
    status: 'est',
    banner: 'Info resmi SPMB 2027/28 belum rilis. Referensi tahun lalu (2026/27): pendaftaran 28 Okt \u2013 30 Nov 2025 via schools.kaderbangsa.foundation. Pantau IG @kemalatarunabhayangkara.',
    facts: ['Gunung Sindur, Bogor \u00b7 asrama 3 tahun', 'Beasiswa penuh Polri (angkatan 2026/27) \u00b7 kuota 180 siswa', 'Kelas X kurikulum nasional, XI\u2013XII IB Diploma Programme'],
    reqs: [
      { k: 'Nilai rapor', v: 'Tidak ada ambang nilai minimum & tidak ada gugur berkas \u2014 semua pendaftar tervalidasi ikut tes NST Tahap I. Tapi data harus jujur: nilai fiktif = diskualifikasi.' },
      { k: 'Ketentuan', v: 'Tidak sedang terikat kontrak/beasiswa penuh program lain; bersedia tinggal di asrama 3 tahun; satu akun pendaftaran per siswa.' },
      { k: 'Tahapan', v: 'Pendaftaran online \u2192 Try Out 1 \u2192 NST Tahap I (tes potensi akademik) \u2192 Try Out 2 \u2192 NST Tahap II \u2192 seleksi terpusat (kesehatan, psikologi, wawancara).' },
      { k: 'Try out', v: '2\u00d7 daring, wajib hadir untuk adaptasi aplikasi ujian \u2014 nilainya tidak memengaruhi kelulusan. Referensi 2026: TO1 20\u201321 Des, TO2 7 Feb.' }
    ],
    calc: null,
    calcNote: 'KTB tidak memakai ambang nilai rapor \u2014 seleksi murni lewat tes NST. Gunakan kolom tinggi/berat untuk cek kondisi fisik menjelang seleksi terpusat.',
    noGradeNote: 'Tidak ada gugur berkas \u2014 fokus persiapan ke tes potensi akademik (NST Tahap I & II). Isi data pendaftaran dengan jujur; data fiktif didiskualifikasi.',
    bodyNote: 'Standar fisik resmi belum dirilis; pemeriksaan kesehatan ada di seleksi terpusat. IMT 17\u201325 patokan aman.',
    phases: [
      { l: 'Pendaftaran online', s: '2026-10-26', e: '2026-11-29', t: 'daftar', est: true },
      { l: 'Try Out 1 (wajib hadir)', s: '2026-12-19', e: '2026-12-20', t: 'tes', est: true },
      { l: 'NST Tahap I \u2014 tes potensi akademik', s: '2027-01-09', e: '2027-01-10', t: 'tes', est: true },
      { l: 'Try Out 2', s: '2027-02-06', e: '2027-02-07', t: 'tes', est: true },
      { l: 'NST Tahap II', s: '2027-02-20', e: '2027-02-21', t: 'tes', est: true },
      { l: 'Seleksi terpusat (kesehatan, psikologi, wawancara)', s: '2027-03-08', e: '2027-03-19', t: 'tes', est: true },
      { l: 'Pengumuman', s: '2027-04-05', e: '2027-04-07', t: 'umum', est: true }
    ],
    checklist: [
      { id: 'pantau', l: 'Pantau rilis SPMB 2027/28 di schools.kaderbangsa.foundation', d: 'Okt 2026', dl: '2026-10-26' },
      { id: 'akun', l: 'Buat satu akun & isi formulir dengan data valid', d: 'Nov 2026', dl: '2026-11-15', note: 'Akun ganda otomatis ditolak sistem', f: [{ k: 'email', p: 'Email akun' }, { k: 'pass', p: 'Password akun (tersimpan di perangkat ini saja)' }] },
      { id: 'rapor', l: 'Siapkan scan rapor \u2014 isi jujur, data fiktif = diskualifikasi', d: 'Nov 2026', dl: '2026-11-20' },
      { id: 'submit', l: 'Submit sebelum penutupan', d: '\u00b129 Nov 2026', dl: '2026-11-29' },
      { id: 'to1', l: 'Ikut Try Out 1 (wajib hadir, tidak dinilai)', d: '\u00b119 Des 2026', dl: '2026-12-19' },
      { id: 'nst1', l: 'NST Tahap I \u2014 latihan TPA & logika', d: '\u00b1Jan 2027', dl: '2027-01-09' },
      { id: 'nst2', l: 'Try Out 2 + NST Tahap II', d: '\u00b1Feb 2027', dl: '2027-02-06' },
      { id: 'pusat', l: 'Seleksi terpusat: jaga kesehatan & pola tidur', d: '\u00b1Mar 2027', dl: '2027-03-08' }
    ],
    docs: [
      { l: 'Laman admisi Akademi Kader Bangsa', m: 'schools.kaderbangsa.foundation/admissions — rilis SPMB 2027/28 di sini', h: 'https://schools.kaderbangsa.foundation/admissions', arsip: false },
      { l: 'Panduan & FAQ SPMB 2026/27', m: 'bit.ly/PanduanSPMB-KTB — pola pendaftaran, try out, & NST tahun lalu', h: 'https://bit.ly/PanduanSPMB-KTB', arsip: true }
    ],
    faq: [
      { q: 'Ada syarat nilai rapor minimal?', a: 'Tidak ada \u2014 KTB tidak menerapkan sistem gugur berkas. Semua pendaftar yang datanya tervalidasi otomatis ikut NST Tahap I. Yang penting data diisi jujur; nilai fiktif berakibat diskualifikasi.' },
      { q: 'Berapa biayanya?', a: 'Pendaftaran dan seleksi gratis. Untuk angkatan 2026/27, Polri memberikan beasiswa penuh bagi seluruh peserta didik \u2014 kemungkinan besar berlanjut, tunggu konfirmasi resmi.' },
      { q: 'Try out-nya memengaruhi kelulusan?', a: 'Tidak. Fungsinya adaptasi aplikasi ujian dan uji koneksi. Tapi panitia mewajibkan hadir \u2014 melewatkannya mempertaruhkan kelancaran tes sesungguhnya.' },
      { q: 'Kurikulumnya apa?', a: 'Kelas X memakai Kurikulum Nasional, kelas XI\u2013XII memakai IB Diploma Programme. Seluruh siswa tinggal di asrama Gunung Sindur, Bogor selama 3 tahun.' }
    ]
  },
  {
    id: 'pradita', mono: 'PD', short: 'Pradita Dirgantara', name: 'SMA Pradita Dirgantara', pill: 'Boarding \u00b7 TNI AU \u00b7 IB',
    // from the school's page in the Notion catalog
    info: { kind: 'Swasta', founded: '2018', province: 'Jawa Tengah', curriculum: ['Kurikulum Merdeka', 'International Baccalaureate'], boarding: 'Asrama Semi-Militer', funding: ['Beasiswa'], quota: '150', contact: 'https://praditadirgantara.sch.id/id/' },
    tag: 'Boarding school Yayasan Ardhya Garini (TNI AU) di Boyolali \u2014 kurikulum nasional + IB.',
    status: 'est',
    banner: 'Info resmi PPDB 2027/28 belum rilis. Referensi tahun lalu (2026/27): pendaftaran 1 Des 2025 \u2013 18 Jan 2026 via admission.praditadirgantara.sch.id.',
    facts: ['Boyolali, Jawa Tengah (kompleks Bandara Adi Soemarmo) \u00b7 boarding', 'Jalur: beasiswa penuh, B2P (bantuan biaya), dan mandiri', 'Seleksi daerah di Lanud terdekat, seleksi pusat di Boyolali'],
    reqs: [
      { k: 'Nilai rapor', v: 'Rata-rata gabungan semester 1\u20135 untuk B. Inggris, Matematika, dan IPA masing-masing \u2265 90 (kurikulum nasional). Kurikulum IB/internasional: rata-rata \u2265 50 tanpa nilai mapel < 4. Tidak pernah tinggal kelas.' },
      { k: 'Tes IQ', v: 'Minimal 115 dari lembaga psikologi anggota HIMPSI, berlaku maksimal 6 bulan \u2014 dilampirkan saat pendaftaran.' },
      { k: 'Kesehatan', v: 'Sehat jasmani & rohani, bebas narkoba \u2014 diperiksa di seleksi daerah dan pusat.' },
      { k: 'Tahapan', v: 'Administrasi \u2192 seleksi daerah di Lanud terdekat (akademik, psikologi, kesehatan) \u2192 seleksi pusat di Boyolali.' }
    ],
    calc: { subjects: ['B. Inggris', 'Matematika', 'IPA'], sems: ['7-1', '7-2', '8-1', '8-2', '9-1'], minAvg: 90, minSem: null },
    calcNote: 'Nilai pengetahuan rapor semester 1\u20135 (s.d. kelas IX semester 1). Syarat: rata-rata per mapel \u2265 90, plus skor IQ \u2265 115.',
    passNote: 'Rata-rata rapor dan IQ memenuhi. Siapkan dokumen & pantau pembukaan pendaftaran (\u00b1awal Desember).',
    failNote: 'Rapor sem 1 kelas IX masih bisa memperbaiki rata-rata bila belum final.',
    phases: [
      { l: 'Pendaftaran online', s: '2026-12-01', e: '2027-01-17', t: 'daftar', est: true },
      { l: 'Seleksi administrasi', s: '2027-01-18', e: '2027-01-29', t: 'tes', est: true },
      { l: 'Seleksi daerah (Lanud terdekat)', s: '2027-02-08', e: '2027-02-19', t: 'tes', est: true },
      { l: 'Seleksi pusat (Boyolali)', s: '2027-03-01', e: '2027-03-12', t: 'tes', est: true },
      { l: 'Pengumuman', s: '2027-03-26', e: '2027-03-28', t: 'umum', est: true }
    ],
    checklist: [
      { id: 'iq', l: 'Tes IQ di biro psikologi anggota HIMPSI (target \u2265 115)', d: 'Nov 2026', dl: '2026-11-30', note: 'Sertifikat berlaku 6 bulan \u2014 jangan tes terlalu awal' },
      { id: 'nilai', l: 'Jaga rata-rata B.Ing / Matematika / IPA \u2265 90 s.d. sem 1 kls IX', d: 'Des 2026', dl: '2026-12-15' },
      { id: 'jalur', l: 'Tentukan jalur: beasiswa / B2P / mandiri', d: 'Des 2026', dl: '2026-12-20', note: 'Beasiswa & B2P butuh dokumen ekonomi tambahan' },
      { id: 'akun', l: 'Registrasi di admission.praditadirgantara.sch.id', d: 'Des 2026', dl: '2026-12-05', f: [{ k: 'email', p: 'Email akun' }, { k: 'pass', p: 'Password akun (tersimpan di perangkat ini saja)' }] },
      { id: 'rapor', l: 'Legalisir rapor semester 1\u20135', d: 'Jan 2027', dl: '2027-01-10' },
      { id: 'submit', l: 'Submit sebelum penutupan', d: '\u00b117 Jan 2027', dl: '2027-01-17' },
      { id: 'daerah', l: 'Ikut seleksi daerah di Lanud terdekat', d: '\u00b1Feb 2027', dl: '2027-02-08' }
    ],
    docs: [
      { l: 'Portal admisi Pradita Dirgantara', m: 'admission.praditadirgantara.sch.id', h: 'https://admission.praditadirgantara.sch.id', arsip: false },
      { l: 'Pedoman PPDB 2026/27', m: 'Referensi jadwal (1 Des – 18 Jan) & syarat nilai/IQ tahun lalu', h: 'https://www.praditadirgantara.sch.id', arsip: true }
    ],
    faq: [
      { q: 'Tes IQ-nya di mana dan kapan?', a: 'Di biro/lembaga psikologi yang psikolognya anggota HIMPSI. Sertifikat berlaku maksimal 6 bulan sebelum pendaftaran \u2014 idealnya tes sekitar Oktober\u2013November 2026 untuk pendaftaran Desember.' },
      { q: 'Apakah gratis seperti Taruna Nusantara?', a: 'Tidak seluruhnya. Ada jalur beasiswa penuh dan B2P (bantuan biaya) untuk siswa berprestasi/prasejahtera, tapi jalur mandiri berbayar. Rincian biaya per jalur menunggu rilis resmi \u2014 konfirmasi ke tim TamanSchool.' },
      { q: 'Seleksi daerahnya di mana?', a: 'Di Lanud (Pangkalan Udara TNI AU) terdekat dari domisili, meliputi tes akademik, psikologi, dan kesehatan. Yang lolos lanjut seleksi pusat di kampus Boyolali.' },
      { q: 'Anak dari SMP kurikulum internasional bisa daftar?', a: 'Bisa \u2014 ambangnya dikonversi: rata-rata IB \u2265 50 tanpa ada mapel bernilai di bawah 4, dan tidak pernah tinggal kelas.' }
    ]
  },
  {
    id: 'mht', mono: 'MHT', short: 'SMANU MHT', name: 'SMA Negeri Unggulan M.H. Thamrin', pill: 'Negeri · Boarding · DKI',
    // from the school's page in the Notion catalog
    info: { kind: 'Negeri', founded: '2008', province: 'DKI Jakarta', curriculum: ['Kurikulum Nasional', 'Cambridge', 'Olimpiade'], boarding: 'Asrama Heterogen', funding: ['Beasiswa', 'Berbayar'], quota: '88', contact: 'instagram.com/smanumht' },
    tag: 'Sekolah Unggul Garuda Transformasi — negeri, berasrama, gratis, khusus domisili DKI Jakarta.',
    status: 'est',
    banner: 'Juknis SPMB 2027/28 belum rilis — biasanya keluar ±2 minggu sebelum pendaftaran (Januari). Jadwal di bawah prediksi dari pola SPMB 2026; pendaftaran tahun lalu hanya 4 hari. Kolom referensi = TA 2026/27.',
    facts: ['Cipayung, Jakarta Timur · asrama penuh', 'Gratis: pendaftaran, seleksi, pendidikan, & asrama (negeri)', 'Kuota ±88 kursi: Prestasi ±8 · Afirmasi ±44 · Umum ±36', 'Wajib KK DKI Jakarta (terbit ≥ 1 tahun sebelum pendaftaran)'],
    reqs: [
      { k: 'Nilai rapor', v: 'Rata-rata Matematika, IPA, dan B. Inggris masing-masing ≥ 90 — kelas 7 (sem 1–2), 8 (sem 1–2), dan 9 (sem 1). Di bawah ambang, sistem menolak berkas.' },
      { k: 'Domisili', v: 'Tercatat di KK DKI Jakarta yang terbit ≥ 1 tahun sebelum pendaftaran (2026/27: paling lambat terbit 1 Feb 2025).' },
      { k: 'Jalur & kuota', v: 'Prestasi ≤10% (±8; medali OSN/OPSI/ITMO/IJSO, sertifikat asli) · Afirmasi ≤50% (±44; KJP Plus tahap II / PIP + DTKS) · Umum ≥40% (±36).' },
      { k: 'Seleksi', v: 'Tes Akademik satu hari (Mat, IPA, B. Inggris, Skolastik; 07.00–12.00) + daftar ulang dengan wawancara murid & orang tua. Ada Simulasi Tes ±1 minggu sebelumnya — wajib ikut.' },
      { k: 'Catatan 2027', v: 'Cek juknis 2027 — mulai 2026 nilai TKA dihitung sebagai prestasi akademik di SPMB DKI.' }
    ],
    calc: { subjects: ['Matematika', 'IPA', 'B. Inggris'], sems: ['7-1', '7-2', '8-1', '8-2', '9-1'], minAvg: 90, minSem: null },
    calcNote: 'Nilai pengetahuan rapor 5 semester (kelas 7 sem 1 s.d. kelas 9 sem 1). Syarat: rata-rata tiap mapel ≥ 90 — tidak ada ambang per semester.',
    passNote: 'Rata-rata memenuhi ambang 90. Pastikan KK DKI aman — selanjutnya penentu adalah Tes Akademik.',
    failNote: 'Nilai sem 1 kelas 9 masih dihitung — fokus naikkan di sana bila belum final.',
    phases: [
      { l: 'Sosialisasi calon murid baru', s: '2027-01-21', e: '2027-01-31', t: 'umum', est: true },
      { l: 'Pendaftaran daring (tutup pk 14.00)', s: '2027-02-02', e: '2027-02-05', t: 'daftar', est: true },
      { l: 'Verifikasi berkas & kartu peserta (wajib hadir)', s: '2027-02-02', e: '2027-02-06', t: 'tes', est: true },
      { l: 'Seleksi & pengumuman Jalur Prestasi', s: '2027-02-02', e: '2027-02-09', t: 'tes', est: true },
      { l: 'Simulasi Tes Akademik (wajib hadir)', s: '2027-02-12', e: '2027-02-13', t: 'tes', est: true },
      { l: 'TES AKADEMIK (07.00–12.00)', s: '2027-02-20', e: '2027-02-20', t: 'tes', est: true },
      { l: 'Pengumuman Jalur Afirmasi & Umum', s: '2027-02-22', e: '2027-02-22', t: 'umum', est: true },
      { l: 'Daftar ulang + kirim berkas + wawancara murid & ortu', s: '2027-02-23', e: '2027-02-26', t: 'tes', est: true }
    ],
    checklist: [
      { id: 'kk', l: 'Pastikan KK DKI Jakarta atas nama anak terbit ≥ 1 tahun sebelum pendaftaran', d: 'Cek sekarang', dl: '2026-12-31', note: 'Dokumen · 2026/27: KK terbit paling lambat 1 Feb 2025' },
      { id: 'rapor', l: 'Legalisir rapor kelas 7 (sem 1–2), 8 (sem 1–2), 9 (sem 1) — minta konversi predikat huruf → angka ke sekolah asal', d: 'Jan 2027', dl: '2027-01-31', note: 'Dokumen · rata-rata Mat/IPA/B.Inggris masing-masing ≥ 90' },
      { id: 'rekom', l: 'Surat rekomendasi Kepala Sekolah asal (format diunduh di laman SPMB, dikirim kolektif)', d: 'Jan 2027', dl: '2027-01-31', note: 'Dokumen · wajib semua jalur' },
      { id: 'berkas', l: 'Siapkan akta kelahiran, NISN, dan pas foto', d: 'Jan 2027', dl: '2027-01-31', note: 'Dokumen', f: [{ k: 'nisn', p: 'NISN (10 digit)' }] },
      { id: 'akun', l: 'Registrasi akun di spmbsmanumht.jakarta.go.id — simpan password!', d: '±2 Feb 2027', dl: '2027-02-02', note: 'Administrasi · 2026/27: pendaftaran 2–5 Feb, tutup pk 14.00', f: [{ k: 'user', p: 'NISN / username akun' }, { k: 'pass', p: 'Password akun (tersimpan di perangkat ini saja)' }] },
      { id: 'prestasi', l: 'Jalur Prestasi: sertifikat ASLI medali OSN/OPSI/ITMO/IJSO', d: 'Feb 2027', dl: '2027-02-02', note: 'Dokumen · kuota ±8 murid' },
      { id: 'afirmasi', l: 'Jalur Afirmasi: KJP Plus aktif tahap II / PIP + terdaftar DTKS', d: 'Feb 2027', dl: '2027-02-02', note: 'Dokumen · kuota ±44 murid' },
      { id: 'verif', l: 'Verifikasi berkas & ambil kartu peserta (datang langsung, 08.00–15.00)', d: '±2–6 Feb 2027', dl: '2027-02-02', note: 'Wajib hadir · 2026/27: 2–6 Feb' },
      { id: 'simul', l: 'Ikut Simulasi Tes Akademik', d: '±13 Feb 2027', dl: '2027-02-12', note: 'Wajib hadir · 2026/27: 13 Feb' },
      { id: 'tes', l: 'TES AKADEMIK — persiapan Mat, IPA, B. Inggris, Skolastik', d: '±20 Feb 2027', dl: '2027-02-20', note: 'Wajib hadir · 2026/27: Sabtu 21 Feb, 07.00–12.00' },
      { id: 'du', l: 'Daftar ulang daring + kirim berkas + wawancara murid & orang tua', d: '±23–26 Feb 2027', dl: '2027-02-23', note: 'Daftar ulang · 2026/27: 24–27 Feb — terlambat dianggap mundur' },
      { id: 'keluarga', l: 'Komitmen keluarga: siap sistem asrama & jadwal belajar intensif', d: 'Sebelum daftar', dl: '2027-01-31', note: 'Keluarga · wawancara ortu menyamakan visi' }
    ],
    docs: [
      { l: 'Laman resmi SPMB SMANU MHT', m: 'spmbsmanumht.jakarta.go.id — juknis 2027 akan rilis di sini', h: 'https://spmbsmanumht.jakarta.go.id', arsip: false },
      { l: 'Juknis & jadwal SPMB 2026', m: 'Pola tahun lalu: pendaftaran 2–5 Feb, tes Sabtu 21 Feb', h: 'https://spmbsmanumht.jakarta.go.id', arsip: true }
    ],
    faq: [
      { q: 'Anak kami tinggal di Bekasi/Depok, KK bukan DKI. Bisa daftar?', a: 'Tidak. Domisili DKI Jakarta (tercatat di KK DKI yang terbit ≥ 1 tahun sebelumnya) adalah syarat wajib semua jalur. Tahun lalu batas terbit KK = 1 Feb 2025 untuk SPMB 2026.' },
      { q: 'Nilai rapor anak 89,5 di IPA. Masih bisa?', a: 'Syarat resmi: rata-rata kelas 7 (sem 1–2), 8 (sem 1–2), dan 9 (sem 1) untuk Mat, IPA, dan B. Inggris masing-masing minimal 90,0. Di bawah itu, sistem akan menolak. Fokus naikkan nilai sem 1 kelas 9 karena masih dihitung.' },
      { q: 'Apa saja yang diujikan di Tes Akademik?', a: 'Umumnya Matematika, IPA, B. Inggris, dan Skolastik (penalaran), materi setara kelas 7–9 dengan tingkat kesulitan olimpiade dasar. Ada Simulasi Tes Akademik ±1 minggu sebelum tes — wajib ikut untuk kenal format & lokasi.' },
      { q: 'Berapa kuotanya dan seberapa ketat?', a: 'Total ±88 kursi: Prestasi ≤ 8, Afirmasi ≤ 44, Umum ≥ 36. Jalur Umum diperebutkan seluruh DKI, jadi tes akademik sangat menentukan.' },
      { q: 'Apakah bayar?', a: 'Tidak. Pendaftaran, seleksi, pendidikan, dan asrama gratis (sekolah negeri, status Sekolah Unggul Garuda Transformasi).' },
      { q: 'Info tahun ini beda dengan tahun lalu?', a: 'Juknis resmi biasanya rilis ±2 minggu sebelum pendaftaran (Jan). Tahun lalu jadwal pendaftaran hanya 4 hari (2–5 Feb) — siapkan semua dokumen dari Desember.' }
    ]
  },
  {
    id: 'wardaya', mono: 'WD', short: 'SMA Wardaya', name: 'SMA Wardaya', pill: 'Swasta \u00b7 STEM \u00b7 Beasiswa',
    // from the school's page in the Notion catalog
    info: { kind: 'Swasta', founded: '2022', province: 'DKI Jakarta', curriculum: ['Kurikulum Nasional', 'Cambridge'], boarding: 'Non-Asrama', funding: ['Berbayar'], quota: '', contact: 'WA: +62 811-9393-995 · Email: wardayaschool.sma@gmail.com' },
    tag: 'Sekolah kecil fokus STEM & olimpiade di bawah Wardaya College \u2014 banyak beasiswa.',
    status: 'est',
    banner: 'Info resmi sangat terbatas \u2014 referensi di bawah dari profil PSB 2021 (terakhir yang terdokumentasi). Tim TamanSchool: lengkapi via kontak admisi Wardaya, lalu perbarui halaman ini.',
    facts: ['Jakarta Selatan \u00b7 kelas kecil, fokus IPA', 'Di bawah Wardaya College \u2014 kultur olimpiade (OSN) kuat', 'Beasiswa tersedia untuk siswa berprestasi'],
    reqs: [
      { k: 'Nilai rapor (ref. 2021)', v: 'Rapor SMP kelas 7\u20139 legalisir dengan rata-rata nilai pengetahuan Matematika dan IPA masing-masing memenuhi ambang (2021: \u00b185).' },
      { k: 'Seleksi (ref.)', v: 'Tes seleksi Matematika & IPA (level menantang, bergaya olimpiade) dan wawancara.' },
      { k: 'Gelombang', v: 'Pendaftaran per gelombang \u2014 referensi 2021: gelombang 1 pada 10 Jan \u2013 2 Feb.' },
      { k: 'Catatan', v: 'Sekolah tidak selalu mempublikasikan info per tahun \u2014 hubungi admisi langsung untuk jadwal 2027/28.' }
    ],
    calc: { subjects: ['Matematika', 'IPA'], sems: ['7-1', '7-2', '8-1', '8-2', '9-1'], minAvg: 85, minSem: null },
    calcNote: 'Referensi 2021: rata-rata Matematika dan IPA masing-masing \u2265 85 (angka perlu konfirmasi tim). Penentu utama tetap tes seleksinya.',
    passNote: 'Rata-rata memenuhi ambang referensi. Fokus persiapan ke tes Matematika & IPA bergaya olimpiade.',
    failNote: 'Ambang ini referensi 2021 \u2014 konfirmasi angka terbaru ke admisi sebelum menyerah.',
    phases: [
      { l: 'Pendaftaran gelombang 1', s: '2027-01-10', e: '2027-02-02', t: 'daftar', est: true },
      { l: 'Tes seleksi (Matematika & IPA)', s: '2027-02-06', e: '2027-02-07', t: 'tes', est: true },
      { l: 'Wawancara', s: '2027-02-15', e: '2027-02-26', t: 'tes', est: true },
      { l: 'Pengumuman', s: '2027-03-05', e: '2027-03-07', t: 'umum', est: true }
    ],
    checklist: [
      { id: 'kontak', l: 'Konfirmasi jadwal & syarat PSB 2027/28 ke admisi Wardaya', d: 'Des 2026', dl: '2026-12-01', note: 'Tugas tim TamanSchool \u2014 update halaman ini setelahnya' },
      { id: 'nilai', l: 'Jaga rata-rata Matematika & IPA (ref. \u2265 85)', d: 'Des 2026', dl: '2026-12-15' },
      { id: 'rapor', l: 'Legalisir rapor kelas 7\u20139', d: 'Jan 2027', dl: '2027-01-05' },
      { id: 'daftar', l: 'Daftar gelombang 1', d: '\u00b1Jan 2027', dl: '2027-01-10' },
      { id: 'tes', l: 'Latihan soal Matematika & IPA level olimpiade', d: '\u00b1Feb 2027', dl: '2027-02-06' }
    ],
    docs: [
      { l: 'Profil SMA Wardaya (PDF, 2021)', m: 'Dokumen resmi terakhir yang terdokumentasi — syarat & alur PSB', h: 'https://www.wardayacollege.com/wp-content/uploads/2021/01/PROFIL-SMA-WARDAYA.pdf', arsip: true },
      { l: 'Situs Wardaya College', m: 'wardayacollege.com — kontak admisi untuk jadwal 2027/28', h: 'https://www.wardayacollege.com', arsip: false }
    ],
    faq: [
      { q: 'Kenapa infonya sedikit sekali?', a: 'SMA Wardaya sekolah kecil dan tidak selalu mempublikasikan pengumuman PSB terbuka per tahun. Data di halaman ini dari profil resmi 2021 \u2014 anggap sebagai gambaran pola, bukan jadwal pasti. Tim TamanSchool akan konfirmasi langsung ke admisi.' },
      { q: 'Sekolahnya cocok untuk siapa?', a: 'Siswa yang kuat dan senang Matematika/IPA \u2014 kulturnya intensif ke olimpiade (OSN) dan persiapan universitas top, didukung ekosistem Wardaya College.' },
      { q: 'Ada beasiswa?', a: 'Ada, untuk siswa berprestasi \u2014 besaran dan syaratnya ditentukan dari hasil tes seleksi dan wawancara. Detail terbaru perlu dikonfirmasi ke admisi.' }
    ]
  }
];
