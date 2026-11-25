# CatatDuit - Aplikasi Pencatat Uang Keluar Mahasiswa 💸

CatatDuit adalah aplikasi web **mobile-first** yang dirancang khusus untuk mahasiswa penerima uang saku bulanan. Aplikasi ini merealisasikan seluruh kebutuhan dan spesifikasi yang tertuang dalam dokumen `PRD-CatatDuit.md`.

---

## 🚀 Fitur Utama Sesuai PRD

### 1. Rilis 1 (MVP)
* **Mobile-First & Responsif**: Nyaman dioperasikan dengan satu tangan di layar ponsel (360px+) maupun layar laptop melalui bilah samping (sidebar).
* **Perhitungan Uang Saku & Jatah Harian**:
  * **Dana Boleh Dibelanjakan** = Uang Saku + Pemasukan Tambahan - Target Tabungan.
  * **Sisa Uang** = Dana Boleh Dibelanjakan - Total Pengeluaran Periode Ini.
  * **Jatah Aman per Hari** = Sisa Uang / Sisa Hari Tersisa (inklusif hari ini, minimal 1 hari).
  * Status "Melebihi Batas" otomatis jika sisa uang negatif.
* **Input Cepat (< 10 detik)**:
  * Input nominal Rupiah berformat otomatis, tombol chip cepat (`+Rp10.000`, `+Rp20.000`, dst.).
  * Pilihan kategori dengan ikon warna-warni (Makan, Transportasi, Kuota/Pulsa, Kos, Hiburan, Kuliah, Belanja, Lainnya).
  * Tanggal transaksi otomatis hari ini (WIB).
* **Daftar Transaksi**:
  * Pencarian instan berdasarkan nama toko/merchant, catatan, atau nominal.
  * Filter kategori dan pengelompokan per hari.
  * Fitur Ubah Transaksi & Hapus Transaksi dengan **Urungkan (Undo toast 5 detik)**.
* **Onboarding Interaktif (3 Langkah)**:
  * Langkah 1: Input uang saku bulanan dan tanggal periode.
  * Langkah 2: Konfirmasi kategori bawaan mahasiswa.
  * Langkah 3: Menentukan target tabungan yang langsung disisihkan di awal.

### 2. Rilis 1.1 (Anggaran & Batas Kategori)
* **Batas per Kategori (Category Limits)**:
  * Progress bar visual per kategori.
  * **Peringatan 80% (Kuning)** dan **Batas Terlampaui 100% (Merah)** beserta selisih nominal lebihnya.
  * Validasi batas: total semua batas kategori tidak boleh melebihi dana yang boleh dibelanjakan.
* **Pemasukan Tambahan (Budget Top-Up)**:
  * Catat uang kiriman tambahan dari orang tua di tengah bulan.
* **Target Tabungan**: Disisihkan di awal agar tidak terpakai secara tidak sengaja.

### 3. Rilis 2 (OCR Struk & Analitik)
* **OCR Screenshot / Struk di Browser (Tesseract.js)**:
  * **100% Client-Side**: Gambar struk/e-wallet (GoPay, OVO, Dana, ShopeePay, QRIS, BCA) diproses langsung di peramban, **tidak pernah diunggah ke server**.
  * **Layar Konfirmasi**: Menampilkan gambar, daftar kandidat nominal terbaca, nama toko, tanggal, dan pemilihan kategori.
  * Gambar langsung dihapus dari memori setelah dikonfirmasi.
* **Laporan & Grafik Visual**:
  * Diagram Donat (Pie Chart) komposisi pengeluaran per kategori.
  * Grafik tren pengeluaran harian.
  * Rata-rata pengeluaran harian dan transaksi terbesar.
  * **Ekspor CSV**: Unduh seluruh transaksi ke format CSV yang siap dibuka di Microsoft Excel atau Google Sheets.

### 4. Database & Sinkronisasi
* **Offline-First & Local Storage**: Langsung berjalan instan tanpa perlu pengaturan backend/kunci API.
* **Supabase Cloud Sync Ready**: Disediakan skema SQL lengkap (`src/services/db-schema.sql`) dengan **Row Level Security (RLS)** dan input URL/Anon Key di menu Akun.
* **Data Percobaan Kasus Raka**: Tombol 1-klik untuk memuat skenario profil mahasiswa perantau (Rp2.000.000) untuk pengujian.

---

## 🛠️ Menjalankan Aplikasi Secara Lokal

### Prasyarat
* Node.js v18+ atau v20+

### Menjalankan Mode Pengembangan (Dev Server)
```bash
npm install
npm run dev
```
Buka browser di `http://localhost:3000`.

### Membangun Versi Produksi & Menjalankan Preview
```bash
npm run build
npm run preview
```
Buka browser di `http://localhost:4173`.

---

## 📂 Struktur Proyek

```
CatatDuit/
├── PRD-CatatDuit.md         # Dokumen PRD asli
├── index.html               # Halaman utama
├── package.json             # Dependensi (React 19, Tailwind, Lucide, Tesseract)
├── vite.config.ts           # Konfigurasi Vite & code-splitting
├── src/
│   ├── types/index.ts       # Definisi antarmuka TypeScript
│   ├── utils/format.ts      # Pemformat mata uang Rupiah & tanggal WIB
│   ├── services/
│   │   ├── storage.ts       # Mesin kalkulasi keuangan, local store, dan seed data
│   │   ├── ocr.ts           # Mesin OCR Tesseract.js & canvas image pre-processing
│   │   └── db-schema.sql    # Skema PostgreSQL Supabase dengan RLS
│   ├── components/
│   │   ├── Navbar.tsx       # Header atas aplikasi
│   │   ├── Navigation.tsx   # Navigasi bawah (mobile) & samping (desktop)
│   │   ├── AddExpenseModal.tsx   # Modal input pengeluaran cepat (< 10 detik)
│   │   ├── OCRScannerModal.tsx   # Modal scanner struk & layar konfirmasi
│   │   ├── NewPeriodModal.tsx    # Modal periode uang saku baru
│   │   ├── TopupModal.tsx        # Modal pemasukan tambahan
│   │   ├── OnboardingModal.tsx   # Wizard onboarding 3 langkah
│   │   └── UndoToast.tsx         # Notifikasi urungkan hapus transaksi (5 detik)
│   └── views/
│       ├── DashboardView.tsx     # Beranda (Sisa uang, jatah harian, transaksi terbaru)
│       ├── TransactionsView.tsx  # Riwayat transaksi, cari, filter, ubah, hapus
│       ├── BudgetView.tsx        # Manajemen anggaran & batas kategori
│       ├── ReportsView.tsx       # Laporan visual, grafik, dan ekspor CSV
│       └── SettingsView.tsx      # Profil, demo data, Supabase, dan privasi
```
