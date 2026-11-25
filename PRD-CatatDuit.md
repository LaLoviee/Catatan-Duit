# PRD: Aplikasi Pencatat Uang Keluar Mahasiswa

**Nama kerja:** CatatDuit | **Versi:** 1.0 | **Tanggal:** 24 November 2026 | **Pemilik:** pembuat tunggal (proyek pribadi)

> **Catatan asumsi.** Jawaban "B" dan "B" dibaca sebagai **1b** (dipakai sendiri dulu, nanti dibagikan ke teman-teman) dan **2b** (gambar dihapus setelah angka terbaca, hanya hasil OCR yang disimpan). Ukuran sukses di bagian 2 adalah usulan dan sudah disetujui.

---

## 1. Ringkasan

CatatDuit adalah aplikasi web mobile-first untuk mahasiswa penerima uang saku bulanan. Penggunanya bisa mencatat pengeluaran dalam kurang dari 10 detik, melihat sisa uang dan jatah harian, membatasi pengeluaran per kategori, menabung, dan membaca laporan. Fitur pembeda: unggah screenshot transaksi atau foto struk, lalu nominalnya dibaca otomatis (OCR) dan dikonfirmasi pengguna.

**Masalah:** uang saku habis sebelum akhir bulan tanpa tahu larinya ke mana, dan pencatatan manual di buku atau Excel tidak bertahan lama.

## 2. Tujuan dan Ukuran Sukses

| Tujuan | Ukuran sukses dalam 1–3 bulan |
|---|---|
| Pencatatan jadi kebiasaan | Mencatat minimal 5 hari per minggu selama 4 minggu berturut-turut |
| Input cepat | Median waktu dari buka form sampai simpan di bawah 10 detik |
| Uang saku terkendali | Tidak ada periode dengan sisa uang negatif sebelum 5 hari terakhir periode |
| Menabung | Target tabungan tercapai minimal 2 dari 3 bulan pertama |
| Dipakai teman (tahap berbagi) | Minimal 5 teman aktif mencatat 3 hari per minggu |

**Bukan tujuan versi ini:** aplikasi native Android/iOS, integrasi otomatis ke bank atau e-wallet, fitur sosial atau patungan, multi-mata uang, pengingat push atau email.

## 3. Ringkasan Keputusan dari Wawancara

| # | Topik | Keputusan |
|---|---|---|
| 1 | Tujuan | Tahu ke mana uang pergi, disiplin menabung dan membatasi pengeluaran, laporan harian/mingguan/bulanan |
| 2 | Pengguna | Mahasiswa dengan uang saku bulanan dari orang tua (uang saku bisa masuk kapan saja; semua pengguna 18 tahun ke atas) |
| 3 | Platform | Web, mobile-first, nyaman juga di laptop |
| 4 | Input | Input cepat (nominal + kategori) dan unggah screenshot/struk |
| 5 | Screenshot | Dibaca otomatis (OCR), wajib dikonfirmasi pengguna |
| 6 | Pembuat | Sendiri, belum bisa coding, anggaran Rp0, proyek pribadi tanpa tenggat |
| 7 | Data | Pakai akun, data di cloud |
| 8 | Anggaran | Batas total bulanan + batas per kategori + target tabungan |
| 9 | Laporan | Angka ringkas, grafik, perbandingan bulan, daftar transaksi, ekspor CSV/Excel; pengingat hanya berupa peringatan dalam aplikasi |
| 10 | Privasi | Dipakai sendiri dulu lalu dibagikan; gambar dihapus setelah OCR |

Kategori awal (bisa diubah): makan, transportasi, kuota/pulsa, kos, hiburan, kuliah, belanja, lainnya.

## 4. Profil Pengguna

**Profil 1: Raka, mahasiswa perantau (20 tahun)**

- Tinggal di kos, menerima Rp2.000.000 per bulan dari orang tua, sering transfer lewat m-banking.
- Sering makan di luar dan uangnya biasanya habis sebelum tanggal 25.
- Frustrasi: tidak tahu apakah jajan hari ini "aman"; pernah mencatat di Excel tapi berhenti setelah dua minggu.
- Kebutuhan: input super cepat, sisa uang per hari yang jelas, peringatan sebelum kebablasan.

**Profil 2: Salsa, mahasiswa yang ingin menabung (21 tahun)**

- Tinggal bersama keluarga, uang saku Rp1.500.000, hampir semua pembayaran lewat e-wallet dan QRIS.
- Ingin menabung Rp300.000 per bulan untuk beli laptop, tapi tabungan sering terpakai tanpa sadar.
- Frustrasi: malas mengetik ulang transaksi yang sudah ada di riwayat e-wallet.
- Kebutuhan: unggah screenshot yang terbaca otomatis, target tabungan, laporan mingguan dan bulanan untuk evaluasi.

## 5. User Story

| ID | User story | Rilis |
|---|---|---|
| US-1 | Sebagai mahasiswa pengguna aplikasi, saya ingin masuk dengan akun pribadi, supaya data saya bisa dibuka dari HP maupun laptop dan hanya saya yang bisa melihatnya. | 1 |
| US-2 | Sebagai mahasiswa perantau, saya ingin mencatat pengeluaran hanya dengan mengisi nominal dan memilih kategori, supaya pencatatan selesai di bawah 10 detik dan tidak membuat saya malas. | 1 |
| US-3 | Sebagai mahasiswa penerima uang saku bulanan, saya ingin mengisi uang saku bulan ini dan melihat sisa uang serta sisa jatah per hari, supaya saya tahu berapa yang boleh dipakai hari ini. | 1 |
| US-4 | Sebagai mahasiswa yang ingin tahu ke mana uangnya pergi, saya ingin melihat total pengeluaran dan kategori terbesar bulan ini, supaya saya tahu pos mana yang paling boros. | 1 |
| US-5 | Sebagai mahasiswa yang kadang salah catat, saya ingin mencari, memfilter, mengubah, dan menghapus transaksi, supaya catatan saya tetap benar. | 1 |
| US-6 | Sebagai mahasiswa yang membayar lewat e-wallet, saya ingin mengunggah screenshot atau foto struk lalu nominalnya terbaca otomatis, supaya saya tidak perlu mengetik ulang. | 2 |
| US-7 | Sebagai mahasiswa yang ingin mengerem pengeluaran, saya ingin menetapkan batas per kategori dan mendapat peringatan saat hampir habis, supaya saya bisa berhenti sebelum kebablasan. | 1.1 |
| US-8 | Sebagai mahasiswa yang ingin disiplin menabung, saya ingin menetapkan target tabungan bulanan dan melihat laporan harian, mingguan, dan bulanan, supaya saya bisa mengevaluasi kebiasaan saya. | 1.1 / 2 |

## 6. Fitur MVP

Prinsip pemilahan: karena pembuatnya belajar coding sambil membangun, **MVP hanya berisi apa yang dibutuhkan untuk menjawab pertanyaan "uangku tinggal berapa dan larinya ke mana?"**

### 6.1 Wajib (Rilis 1, maksimal 5)

1. **Akun (daftar, masuk, keluar, atur ulang kata sandi).** Alasan: data di cloud dan nanti dibagikan ke teman, jadi pemisahan data per pengguna harus ada sejak awal; menambahkannya belakangan jauh lebih sulit.
2. **Input pengeluaran cepat (nominal + kategori, tanggal otomatis hari ini).** Alasan: ini inti produk; kalau lebih dari 10 detik, kebiasaan mencatat tidak akan bertahan.
3. **Uang saku bulanan dan perhitungan sisa uang serta sisa per hari.** Alasan: ini jawaban langsung untuk masalah "uang habis tanpa tahu", dan perhitungannya sederhana.
4. **Daftar transaksi (cari, filter bulan/kategori, ubah, hapus).** Alasan: tanpa koreksi, satu salah ketik merusak seluruh angka dan kepercayaan pada aplikasi.
5. **Dasbor ringkas (total keluar, sisa uang, kategori terbesar) dengan kategori bawaan.** Alasan: laporan paling berguna dengan usaha paling kecil; menjawab "larinya ke mana" tanpa grafik.

### 6.2 Bagus kalau ada (setelah MVP stabil)

- **Rilis 1.1:** batas per kategori + peringatan dalam aplikasi (80% dan 100%), target tabungan, pemasukan tambahan di tengah bulan, kategori buatan sendiri.
- **Rilis 2:** unggah screenshot/struk dengan OCR di browser (konfirmasi wajib), laporan harian/mingguan/bulanan, diagram lingkaran per kategori, grafik batang per hari/minggu.

### 6.3 Nanti dulu (Rilis 3 dan seterusnya)

- Perbandingan bulan ini vs bulan lalu
- Ekspor CSV/Excel
- Mengundang teman secara terbuka (pendaftaran publik)
- Transaksi berulang (kos, langganan), mode gelap, bisa dipakai offline (PWA)
- Impor otomatis dari mutasi rekening, notifikasi push atau email

## 7. Alur Pengguna

### 7.1 Pengguna baru sampai tahu sisa uang (tujuan utama tercapai)

1. Buka alamat web → halaman **Masuk** (ada tautan Daftar).
2. Pilih **Daftar** → isi email dan kata sandi → terima email verifikasi → klik tautan verifikasi.
3. **Onboarding langkah 1:** isi uang saku yang baru diterima, tanggal mulai periode (default hari ini), dan perkiraan tanggal uang saku berikutnya (default 1 bulan ke depan).
4. **Onboarding langkah 2:** cek kategori bawaan, hapus atau ganti nama bila perlu.
5. **Onboarding langkah 3 (opsional):** isi target tabungan bulan ini (boleh dilewati).
6. Masuk **Beranda**: terlihat sisa uang, sisa per hari, dan keadaan kosong "Belum ada pengeluaran".
7. Ketuk tombol **+** → isi nominal → pilih kategori → **Simpan**.
8. Muncul pesan "Tersimpan" dan Beranda langsung diperbarui. **Tujuan tercapai:** pengguna melihat sisa uang dan jatah per hari yang baru.

### 7.2 Pemakaian harian

Buka aplikasi (tetap masuk) → ketuk + → nominal → kategori → Simpan → lihat sisa per hari. Target: kurang dari 10 detik.

### 7.3 Koreksi transaksi

Tab Transaksi → cari atau filter → ketuk transaksi → ubah nominal/kategori/tanggal/catatan → Simpan, atau Hapus (dengan konfirmasi dan opsi Urungkan beberapa detik).

### 7.4 Unggah screenshot/struk (Rilis 2)

Ketuk + → **Unggah gambar** → pilih foto atau screenshot → gambar diproses di browser → layar **Konfirmasi** menampilkan nominal, tanggal, dan nama toko hasil bacaan → pengguna memperbaiki bila salah dan memilih kategori → Simpan → gambar dibuang dari memori dan tidak pernah diunggah ke server.

### 7.5 Peringatan batas kategori (Rilis 1.1)

Setelah menyimpan pengeluaran, jika kategori mencapai 80% batas muncul peringatan kuning; di 100% atau lebih, peringatan merah yang menyebut selisihnya. Peringatan tidak memblokir penyimpanan.

## 8. Daftar Halaman dan Isinya

Navigasi utama di HP: tab bawah (Beranda, Transaksi, tombol +, Anggaran, Akun). Di laptop: bilah samping.

| Halaman | Isi | Rilis |
|---|---|---|
| Masuk | Email, kata sandi, tautan Lupa kata sandi, tautan Daftar | 1 |
| Daftar | Email, kata sandi, persetujuan kebijakan privasi, pesan cek email | 1 |
| Atur ulang kata sandi | Form email, lalu form kata sandi baru | 1 |
| Onboarding (3 langkah) | Uang saku, tanggal mulai periode, perkiraan tanggal uang saku berikutnya, kategori awal, target tabungan (opsional) | 1 |
| Beranda | Sisa uang, sisa per hari, total keluar bulan ini, kategori terbesar, 5 transaksi terakhir, tombol + | 1 |
| Tambah pengeluaran | Nominal (papan angka), pilihan kategori (ikon), tanggal (default hari ini), catatan opsional | 1 |
| Transaksi | Daftar per hari, kolom cari, filter bulan dan kategori, total hasil filter | 1 |
| Detail/Ubah transaksi | Semua kolom bisa diubah, tombol Hapus | 1 |
| Anggaran | Uang saku periode ini, tombol Mulai periode baru (saat uang saku diterima), perkiraan tanggal uang saku berikutnya, sisa, riwayat periode; (1.1) batas per kategori, target tabungan, pemasukan tambahan | 1 / 1.1 |
| Kategori | Daftar, tambah, ganti nama, arsipkan | 1 / 1.1 |
| Unggah dan Konfirmasi | Pilih gambar, indikator proses OCR, form hasil bacaan yang bisa diedit | 2 |
| Laporan | Tab Harian/Mingguan/Bulanan (bulanan = per periode uang saku), angka ringkas, diagram lingkaran, grafik batang | 2 |
| Akun/Pengaturan | Email, ganti kata sandi, kebijakan privasi, keluar, hapus akun dan semua data | 1 |
| Status khusus | Halaman 404, pesan gagal terhubung, tampilan memuat dan kosong | 1 |

## 9. Rancangan Database

Rekomendasi (bukan keputusan final): **Supabase** (login, database PostgreSQL, aturan akses per baris), hosting statis gratis (Cloudflare Pages, Netlify, atau Vercel), OCR **Tesseract.js** di browser. Semua nominal disimpan sebagai bilangan bulat rupiah (tanpa desimal).

**profiles** (satu baris per akun, terhubung ke tabel akun bawaan Supabase)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | sama dengan id akun (auth.users.id) |
| display_name | text | opsional |
| timezone | text | default Asia/Jakarta |
| created_at | timestamptz | |

**categories**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles.id | |
| name | text | unik per pengguna (tanpa membedakan huruf besar/kecil) |
| icon, color | text | tampilan |
| sort_order | int | |
| is_archived | boolean | kategori yang punya transaksi diarsipkan, tidak dihapus |

**monthly_budgets** (satu baris per periode)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles.id | |
| period_start | date | tanggal uang saku diterima dan periode dimulai (bebas, tidak harus awal bulan); unik bersama user_id |
| period_end | date | perkiraan tanggal uang saku berikutnya (default 1 bulan setelah period_start); ≥ period_start; otomatis menjadi sehari sebelum periode baru dimulai; periode tidak boleh tumpang tindih |
| allowance_amount | bigint | uang saku, ≥ 0 |
| savings_target | bigint | default 0; tidak boleh melebihi uang saku |
| created_at, updated_at | timestamptz | |

**expenses**

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| user_id | uuid, FK → profiles.id | |
| category_id | uuid, FK → categories.id | tidak boleh dihapus jika masih dipakai |
| amount | bigint | > 0 dan ≤ 1.000.000.000 |
| spent_on | date | tanggal lokal WIB |
| note | text | maksimal 200 karakter, opsional |
| merchant | text | opsional, dari OCR |
| source | text | manual atau ocr |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | penghapusan lunak untuk fitur Urungkan; null = aktif |

Indeks: (user_id, spent_on desc) dan (user_id, category_id, spent_on).

**category_limits** (Rilis 1.1)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| budget_id | uuid, FK → monthly_budgets.id | |
| category_id | uuid, FK → categories.id | unik bersama budget_id |
| limit_amount | bigint | > 0; jumlah semua batas tidak boleh melebihi uang saku dikurangi target tabungan |

**budget_topups** (Rilis 1.1, pemasukan tambahan di tengah periode)

| Kolom | Tipe | Keterangan |
|---|---|---|
| id | uuid, PK | |
| budget_id | uuid, FK → monthly_budgets.id | |
| amount | bigint | > 0 |
| received_on | date | |
| note | text | opsional |

**Relasi:** satu profil punya banyak categories, monthly_budgets, dan expenses; satu monthly_budget punya banyak category_limits dan budget_topups; satu category punya banyak expenses dan category_limits. Periode sebuah pengeluaran ditentukan dari rentang period_start sampai period_end yang memuat spent_on, bukan disimpan terpisah. Gambar struk **tidak disimpan** sehingga tidak ada tabel lampiran; jika kelak diubah, tambahkan tabel baru dan perbarui bagian privasi.

**Aturan akses (wajib):** Row Level Security aktif di setiap tabel, dengan kebijakan "baris hanya bisa dibaca dan diubah jika user_id sama dengan pengguna yang masuk".

### Rumus perhitungan

- Dana yang boleh dibelanjakan = uang saku + total pemasukan tambahan − target tabungan
- Sisa uang = dana yang boleh dibelanjakan − total pengeluaran periode ini
- Sisa per hari = sisa uang ÷ jumlah hari tersisa **termasuk hari ini** (jika sisa uang negatif, tampilkan 0 dan status "melebihi batas"). Hari tersisa dihitung sampai period_end; bila tanggal itu terlewat dan uang saku baru belum dicatat, hari tersisa dihitung 1 dan muncul pengingat "Uang saku baru belum dicatat?"

## 10. Tinjauan Kritis: Edge Case, Keamanan, Privasi, Ambiguitas

Bagian ini hasil mengkritik rancangan di atas; setiap temuan sudah dimasukkan ke aturan produk.

### 10.1 Edge case

| Temuan | Perbaikan |
|---|---|
| Nominal 0, negatif, kosong, atau tidak masuk akal (mis. salah tambah nol) | Validasi: wajib > 0, batas atas Rp1 miliar; nominal di atas Rp5.000.000 meminta konfirmasi "Yakin?" |
| Tombol Simpan ditekan dua kali atau koneksi lambat | Tombol dinonaktifkan saat proses; kunci unik dari klien untuk mencegah catatan ganda |
| Pencatatan saat tidak ada sinyal | MVP: tampilkan pesan gagal dan simpan isian di layar supaya tidak hilang; mode offline masuk Rilis 3 |
| Zona waktu dan pergantian hari lewat tengah malam | Tanggal disimpan sebagai tanggal lokal WIB; pengguna bisa mengubah tanggal |
| Hari terakhir periode (pembagian dengan nol) dan sisa uang negatif | Hari tersisa dihitung termasuk hari ini (minimal 1); sisa negatif ditampilkan merah, sisa per hari menjadi 0 |
| Uang saku terlambat atau ditambah orang tua di tengah bulan | Tabel budget_topups untuk tambahan di tengah periode; uang saku yang terlambat atau lebih awal cukup dicatat sebagai periode baru |
| Periode berakhir tetapi uang saku baru belum dicatat | Tampilkan pengingat di Beranda dan tawarkan salin angka periode sebelumnya; sisa periode lalu **tidak** otomatis dibawa |
| Kategori dihapus padahal punya transaksi | Hanya bisa diarsipkan; transaksi lama tetap tampil |
| Mengubah transaksi bulan lalu | Diizinkan; angka periode tersebut dihitung ulang, tidak ada penguncian bulan di MVP |
| OCR salah baca (5 vs 6, titik vs koma, 15.000 vs 15.000,00) | Konfirmasi wajib, tidak pernah simpan otomatis; tampilkan semua kandidat angka dan pilih yang benar |
| Struk punya banyak angka (subtotal, total, kembalian) | Pengguna memilih dari kandidat; tidak menebak diam-diam |
| Gambar bukan struk, buram, terlalu besar, atau format HEIC dari iPhone | Batas ukuran dan format; pesan "tidak terbaca, isi manual"; tombol isi manual selalu tersedia |
| Screenshot yang sama diunggah dua kali | Peringatan duplikat jika nominal, tanggal, dan toko sama dengan transaksi yang ada |
| OCR lambat di HP lama | Indikator proses dan tombol batal; OCR tidak boleh memblokir input manual |
| Uang saku masuk lebih awal atau lebih telat dari perkiraan, atau pengeluaran bertanggal di antara dua periode | Periode baru bisa dimulai kapan saja; periode lama otomatis ditutup sehari sebelumnya dan sisanya tidak dibawa; pengeluaran masuk ke periode yang memuat tanggalnya |

### 10.2 Keamanan

| Risiko | Perbaikan |
|---|---|
| Pengguna bisa membaca data pengguna lain (risiko terbesar proyek ini) | Row Level Security di semua tabel; uji dengan dua akun sebelum dibagikan ke siapa pun |
| Kunci rahasia (service role) bocor ke kode web | Hanya kunci publik (anon) di front-end; kunci rahasia tidak pernah masuk repositori |
| Kata sandi lemah, akun palsu, tebak sandi | Verifikasi email, minimal 8 karakter, pembatasan percobaan masuk dari penyedia login |
| XSS lewat kolom catatan atau nama toko dari OCR | Semua teks ditampilkan sebagai teks biasa (escape); tidak memakai innerHTML untuk data pengguna |
| Lalu lintas tidak terenkripsi | HTTPS wajib dari hosting |
| Data hilang (paket gratis umumnya tanpa cadangan andal) | Ekspor CSV dipercepat ke Rilis 2 jika data mulai penting; cek batas paket gratis terbaru sebelum mengandalkannya |
| Proyek gratis dijeda karena tidak aktif atau melebihi kuota | Periksa kebijakan paket gratis saat ini; siapkan pengingat membuka aplikasi berkala dan batasi jumlah pengguna awal |

### 10.3 Privasi

| Risiko | Perbaikan |
|---|---|
| Screenshot memuat nomor rekening, nama, saldo | OCR dijalankan **di browser**; gambar tidak diunggah dan tidak disimpan; hanya nominal, tanggal, nama toko yang tersimpan setelah dikonfirmasi |
| Mengganti OCR ke layanan cloud di masa depan | Dilarang tanpa memperbarui kebijakan privasi dan meminta persetujuan baru |
| Data keuangan pribadi pengguna teman | Kebijakan privasi singkat dalam bahasa sederhana; kumpulkan data seminimal mungkin (email + data pengeluaran); tidak ada iklan atau pelacak pihak ketiga |
| Hak menghapus data | Tombol "Hapus akun dan semua data" yang benar-benar menghapus (bukan hanya menandai) |
| Log atau pesan error memuat nominal atau email | Jangan mencatat data keuangan di log |
| Pengguna di bawah 18 tahun | Semua pengguna awal berusia 18 tahun ke atas; tetap cantumkan syarat usia minimal 18 tahun saat daftar |
| Pembuat bisa melihat data teman | Sampaikan terus terang kepada teman; jangan membuka data mereka kecuali diminta untuk membantu perbaikan |

### 10.4 Bagian yang tadinya ambigu dan keputusannya

| Pertanyaan | Keputusan |
|---|---|
| Target tabungan dihitung dari awal atau sisa akhir bulan? | **Disisihkan di awal:** dikurangkan dari dana yang boleh dibelanjakan. Pengguna dapat mengubah target di tengah bulan, dan perubahan berlaku mulai saat itu juga |
| Apakah transfer ke tabungan dianggap pengeluaran? | Tidak. Tabungan tidak dicatat sebagai transaksi pengeluaran |
| Apa arti "batas total bulanan"? | Sama dengan dana yang boleh dibelanjakan (uang saku + pemasukan tambahan − target tabungan) |
| Berapa jumlah batas kategori yang diizinkan? | Jumlah semua batas kategori tidak boleh melebihi dana yang boleh dibelanjakan |
| Kapan "hampir habis"? | 80% (peringatan) dan 100% (terlampaui) dari batas kategori |
| Apakah periode selalu bulan kalender? | Tidak. Periode dimulai saat uang saku diterima, kapan pun tanggalnya, dan berakhir di perkiraan tanggal uang saku berikutnya atau sehari sebelum periode baru dimulai. Laporan "bulanan" berarti per periode |
| Apakah "dibagikan ke teman" berarti fitur sosial? | Tidak. Setiap akun terpisah total; tidak ada berbagi data antar pengguna |
| Pendaftaran terbuka atau undangan? | Awalnya terbatas pada teman yang diundang langsung (perkiraan di bawah 20 orang) sampai batas paket gratis dipahami |
| Mata uang dan bahasa | Hanya rupiah dan bahasa Indonesia; format Rp1.500.000 |

## 11. Kebutuhan Non-Fungsional

- **Tampilan:** mobile-first (layar 360 px), tombol minimal 44 px, bisa dipakai satu tangan.
- **Kecepatan:** Beranda tampil di bawah 3 detik pada koneksi seluler biasa; simpan pengeluaran terasa instan.
- **Aksesibilitas:** kontras cukup, label jelas, warna tidak menjadi satu-satunya penanda (peringatan juga memakai teks dan ikon).
- **Biaya:** seluruh layanan di paket gratis; periksa ulang batasnya sebelum rilis karena dapat berubah.

## 12. Rencana Rilis (belajar sambil membuat)

| Tahap | Isi | Tanda selesai |
|---|---|---|
| Rilis 1 (MVP) | 5 fitur Wajib, aturan akses diuji dengan dua akun | Kamu memakainya sendiri selama 2 minggu tanpa kehilangan data |
| Rilis 1.1 | Batas kategori + peringatan, target tabungan, pemasukan tambahan, kategori sendiri | Peringatan muncul tepat di 80% dan 100% |
| Rilis 2 | OCR di browser, laporan dan grafik | Mayoritas screenshot e-wallet terbaca dengan benar setelah dikonfirmasi |
| Rilis 3 | Perbandingan bulan, ekspor, undangan teman | Minimal 5 teman aktif |

## 13. Risiko Proyek dan Pertanyaan Terbuka

**Risiko utama:** cakupan terlalu besar bagi pemula (mitigasi: ikuti urutan rilis dan jangan mulai OCR sebelum Rilis 1 stabil); akurasi OCR gratis yang bervariasi antar aplikasi e-wallet (mitigasi: konfirmasi wajib dan isi manual selalu ada); batas paket gratis berubah (mitigasi: cek berkala dan siapkan ekspor data).

**Pertanyaan terbuka:** tidak ada. Semua pertanyaan (ukuran sukses, kategori awal, tanggal uang saku, usia pengguna) sudah terjawab dan masuk ke dokumen.
