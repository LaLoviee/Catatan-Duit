# DESIGN.md — CatatDuit

## Design Read
Reading this as: student personal finance web app for Indonesian university students, in an **Ekspresif Mahasiswa (Tactile Ledger & Editorial Ink)** visual language, dial **ENERGY 3 / RHYTHM 3 / MOTION 2**.

## Visual Identity & Dials
- **ENERGY 3**: High-contrast dark ink (`#18181B`) primary balance focal block set against warm ledger paper (`#FAF7F2`), bold display numerals (`Bricolage Grotesque` + `tabular-nums`), crisp hairline borders (`1.5px` `#E2DDD3` and `#18181B` on key interactive anchors), and a solid `3px` offset ink shadow reserved strictly for the primary Quick-Add CTA and main balance card.
- **RHYTHM 3**: Asymmetric, non-template screen compositions:
  - **Beranda**: 12-column asymmetric split (7-col focal balance & daily safe allowance card + 5-col action/metric pulse stack), followed by an asymmetric 7/5 ledger-and-category-limits split.
  - **Transaksi**: Summary + search/filter strip above date-grouped interactive ledger sheets.
  - **Anggaran**: Horizontal equation strip (`Uang Saku + Pemasukan - Tabungan = Dana Belanja`) above interactive category limit rows and past period records.
  - **Laporan**: Working timeframe switcher (`Bulanan` / `Mingguan` / `Harian`) driving live metrics, interactive SVG donut breakdown, and daily spend bar chart.
  - **Pengaturan**: Two-column utility layout separating profile & sample data from cloud config, privacy commitments, and danger zone.
- **MOTION 2**: Purposeful entrance transitions (`180ms–220ms` cubic-bezier) for views and dialogs, smooth width transitions on progress bars, tactile press translation (`active:translate-y-[1px]`), zero endless loops, and complete respect for `prefers-reduced-motion: reduce`.

## Color System (2 Core + 1 Accent + Neutrals)
- **Neutrals**:
  - Canvas: `#FAF7F2` (warm paper)
  - Surface: `#FFFFFF` (crisp card)
  - Secondary Surface: `#F2EDE4` (warm stone tint)
  - Ink Primary: `#18181B`
  - Ink Secondary: `#52525B`
  - Border: `#E2DDD3`
- **Core Colors (2)**:
  - Core 1 (Stability / Money): Forest Pine `#0F5132` (hover `#0B3D26`, tint `#ECFDF5`)
  - Core 2 (Grounding / Contrast): Deep Charcoal Ink `#18181B`
- **Single Deliberate Accent (1)**:
  - Vermilion Tangerine `#C2410C` (light text-safe accent; `#FB923C` on dark ink surfaces) — reserved strictly for the primary "Catat Pengeluaran" trigger and key active indicators.
- **Semantic Status Only**:
  - Safe: `#0F5132`
  - Warning (80%+): `#B45309` on `#FEF3C7`
  - Danger (100%+ / Overdue): `#BE123C` on `#FFE4E6`

## Typography
- **Display & Section Headings**: `Bricolage Grotesque` (expressive geometric-humanist voice suited to student identity, paired with `tabular-nums` for Rupiah).
- **UI Body & Tables**: `Plus Jakarta Sans` (clean Indonesian character support and high small-size legibility).
- **Code/SQL Viewer Only**: System monospace.

## Radius & Elevation Rules
- Structural panels: `16px` (`rounded-2xl`)
- Interactive controls & inputs: `12px` (`rounded-xl`)
- Functional status tags: `6px` (`rounded-md`)
- Elevation: Flat hairline borders by default; tactile `3px` ink offset shadow on the primary focal card and primary CTA only (max 2 elements). No page-wide soft drop shadows, no decorative glows, no multi-surface glassmorphism.
