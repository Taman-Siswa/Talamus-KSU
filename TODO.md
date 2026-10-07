# TODO

## Sprint KSU Digital #1

Dicek 2026-10-05 terhadap kode dan aplikasi yang berjalan.

- [x] **Ganti design system ke versi Claude Design** (palet warna, sidebar Katalog, Checklist, Timeline, Forum). Skin hijau Murid v3 berlaku di semua halaman setelah login, termasuk admin. Login dan daftar tetap biru.
- [x] **Sorting katalog.** Pilihan "Urutkan" di bar atas Katalog: urutan admin (bawaan), Pendaftaran terdekat (yang sedang dibuka dulu, lalu yang akan dibuka, lalu yang sudah lewat), dan Nama A–Z.
- [x] **Judul halaman.** Judul di bar atas sudah ada di semua halaman murid. Judul tab browser sekarang mengikuti halaman: Katalog, nama sekolah, "Checklist <sekolah>", Timeline, Forum, Profil, dan halaman admin. Login dan daftar tetap punya judul sendiri.
- [ ] **Router sesuai sidebar.** `/katalog`, `/checklist`, `/timeline`, `/forum` sudah ada. Sisa: hapus rute lama `/faq` dan `/kalkulator` (hanya mengarahkan ke Forum dan Checklist, tidak ada tautan ke sana).
- [ ] **Migrasi dari web storage ke Supabase** untuk pengujian admin dan murid bersama. Belum dimulai: tidak ada Supabase di `package.json`, tidak ada `.env`. Data masih di `localStorage` (`tsprep-auth`, `tsprep-schools-v1`, `tsprep-v1:<email>`).
- [ ] **Rencana notifikasi dan Forum.** Fiturnya sudah ada versi lokal (notifikasi jadwal 60 hari, Forum dengan FAQ dari admin). Dokumen rencana untuk versi dengan backend belum ditulis; sekalian dengan skema Supabase, karena berbagi data (akun, sekolah, pertanyaan, jawaban).

## Ketidaksesuaian dengan HLPD

Hasil pengecekan aplikasi terhadap HLPD (2026-10-05). Aturan yang berlaku: data yang diinput admin harus sama dengan yang tampil ke murid, dan yang tampil ke murid harus berasal dari isian admin atau dari murid sendiri.

## Bisa dikerjakan sekarang

- [ ] **Filter bulan pembukaan di Katalog.** Tambah pilihan "Bulan" di filter Katalog. Bulan diambil dari tahap pendaftaran (`daftarLabel` di `src/lib/murid.ts`), jadi tidak ada isian baru di form. (HLPD: Katalog)
- [ ] **Sejarah sekolah di halaman detail.** Isian "Sejarah" (tahun + keterangan) di bagian 2 Tentang pada form admin, dan blok Sejarah di tab Tentang. Kosong = blok tidak tampil. (HLPD: Katalog, halaman detail)
- [ ] **Sumber data di Alumni & prestasi.** Satu isian "Sumber data" di bagian 4 form, tampil di bawah sebaran lulusan dan prestasi. (HLPD: Katalog, alumni & prestasi)

## Perlu keputusan

- [ ] **Header foto Checklist bisa diganti murid.** Sekarang memakai foto dari admin. Murid belum bisa mengunggah foto sendiri. Kita pernah sepakat tidak ada unggahan di platform kecuali foto sekolah dari admin, jadi tentukan dulu apakah foto murid diizinkan (disimpan di perangkat, seperti foto sekolah). (HLPD: Checklist)
- [ ] **Urutan ulasan "Populer".** Sekarang "Terbaik" (berdasarkan bintang) dan "Terbaru", dengan tombol suka tanpa hitungan. Pilihan: tetap begini, atau pakai jumlah suka setelah ada penyimpanan bersama. (HLPD: Katalog, ulasan alumni)

## Menunggu backend dan akun bersama

Belum bisa dikerjakan selama data hanya tersimpan per perangkat (`localStorage`). Tanpa backend, fitur ini hanya akan jadi tampilan kosong.

- [ ] **Jawaban dari murid lain dengan label "Pengguna".** Sekarang hanya ada jawaban Admin TamanSchool dan jawaban sendiri (label "Kamu"). (HLPD: Forum)
- [ ] **Label "Tutor" dengan profil singkat.** Butuh akun tutor dan data profilnya. Tidak boleh ada nama tutor karangan. (HLPD: Forum)
- [ ] **Notifikasi "pertanyaan yang sudah dijawab".** Sekarang notifikasi hanya berisi jadwal 60 hari ke depan. (HLPD: Umum)
- [ ] **Jumlah suka ulasan dan jumlah ikut tanya** yang dibagi antar murid. Sekarang suka disimpan per perangkat.

## Disengaja berbeda dari HLPD

- 5 sekolah (TN, KTB, Pradita, MHT, Wardaya) → 2 sekolah contoh (TN, KTB). Sekolah lain ditambah lewat admin.
- Profil punya tambahan yang tidak ada di desain: ganti password dan keluar.
