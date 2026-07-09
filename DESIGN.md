# PullPay — DESIGN.md (Frontend Design System)

<aside>
📐

File ini adalah **`DESIGN.md`** untuk di-drop ke root repo frontend PullPay (Next.js 16 App Router). Isinya adalah *source of truth* design system: token, setup CSS/Tailwind/font, dan konvensi komponen. Selaras dengan [PullPay — Stitch UI Prompt](https://app.notion.com/p/PullPay-Stitch-UI-Prompt-Anti-AI-Professional-a806a852f20e469f82cb4192b801e885?pvs=21) dan PRD §29.

</aside>

## 1. Principles

- **Precise, editorial, engineered.** Tampilan developer-tool yang di-ship beneran (Linear / Vercel / Stripe / Rainbow), *bukan* template AI.
- **Dark-first**, sediakan light theme.
- **Restraint over decoration** — whitespace lega, border hairline 1px, grid tipografi ketat.
- **Satu aksen** (indigo) dipakai hemat untuk 1 aksi utama per layar.
- **Semua data on-chain = monospace + tabular numbers** (address, USDC, tx hash, rewardId).
- **No** gradient wash, glassmorphism, neon, 3D blob, emoji sebagai ikon, atau lorem ipsum.

## 2. Design tokens

### 2.1 Warna

| Token | Dark (default) | Light | Pakai untuk |
| --- | --- | --- | --- |
| `bg` | `#0E0F13` | `#FBFBFD` | Background halaman |
| `surface` | `#181A20` | `#FFFFFF` | Kartu / panel |
| `surface-2` | `#1F2229` | `#F4F5F7` | Hover / inset |
| `border` | `rgba(255,255,255,0.07)` | `#E7E8EC` | Garis hairline 1px |
| `text` | `#E6E7EB` | `#1A1B1F` | Teks utama |
| `muted` | `#9498A3` | `#6B6F7A` | Teks sekunder / eyebrow |
| `accent` | `#7C8CFF` | `#5A67E8` | Aksi utama, angka kunci |
| `ok` (funded/paid) | `#4ADE80` | `#12B76A` | Status dot hijau |
| `warn` (verifying) | `#E0B341` | `#D9A404` | Status dot amber |
| `bad` (disputed) | `#F0715E` | `#E5533C` | Status dot merah |

> Warna dipakai sebagai **sinyal kecil** (dot, pill, satu angka penting), bukan fill besar.
> 

### 2.2 Tipografi

- **UI + heading:** Geist (alt: Söhne, Neue Haas Grotesk). Heading besar, `letter-spacing` rapat.
- **Eyebrow:** uppercase, 11–12px, `letter-spacing` lebar, warna `muted`.
- **Data on-chain:** Geist Mono (alt: IBM Plex Mono / JetBrains Mono), aktifkan `tabular-nums`.
- **Uang:** selalu mono + tabular + chip mata uang kecil.

### 2.3 Spacing, radius & motion

- **Spacing:** skala 4px → `4 / 8 / 12 / 16 / 24 / 40`.
- **Radius:** `10px` kartu, `6px` input/tombol. Hindari serba-pill.
- **Border:** selalu 1px hairline (`border` token).
- **Motion:** tenang, 150–250ms `ease-out`. Count-up angka, fade/blur-up saat reveal, magnet hover-lift di tombol primary. Tidak bouncy.

## 3. Setup (copy ke repo)

### 3.1 `app/globals.css`

```css
@import "tailwindcss";

/* Dark-first: :root = dark. Light theme via [data-theme="light"]. */
:root {
  --bg: #0E0F13;
  --surface: #181A20;
  --surface-2: #1F2229;
  --border: rgba(255, 255, 255, 0.07);
  --text: #E6E7EB;
  --muted: #9498A3;
  --accent: #7C8CFF;
  --accent-hover: #93A0FF;
  --ok: #4ADE80;
  --warn: #E0B341;
  --bad: #F0715E;

  --radius-card: 10px;
  --radius-input: 6px;
}

[data-theme="light"] {
  --bg: #FBFBFD;
  --surface: #FFFFFF;
  --surface-2: #F4F5F7;
  --border: #E7E8EC;
  --text: #1A1B1F;
  --muted: #6B6F7A;
  --accent: #5A67E8;
  --accent-hover: #4C58D6;
  --ok: #12B76A;
  --warn: #D9A404;
  --bad: #E5533C;
}

/* Tailwind v4 CSS-first theme mapping */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-ok: var(--ok);
  --color-warn: var(--warn);
  --color-bad: var(--bad);
  --radius-card: var(--radius-card);
  --radius-input: var(--radius-input);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--bg);
  color: var(--text);
  font-feature-settings: "cv11", "ss01";
}

/* Angka & data on-chain */
.tnum { font-feature-settings: "tnum" 1; font-variant-numeric: tabular-nums; }

/* Latar dot-grid sangat samar (~3%) */
.dot-grid {
  background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
  background-size: 22px 22px;
}
```

> Kalau pakai **Tailwind v3**, pindahkan mapping `@theme` ke `tailwind.config.ts` di bawah `theme.extend.colors` (`bg: "var(--bg)"`, dst.) dan `borderRadius`.
> 

### 3.2 Fonts — `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = { title: "PullPay" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

> `geist/font` sudah expose `--font-geist-sans` & `--font-geist-mono`, yang di-map ke `--font-sans` / `--font-mono` di `globals.css`.
> 

## 4. Component conventions

### 4.1 Buttons

- **Primary** (1 per view): solid `accent`, teks gelap, radius `6px`, hover → `accent-hover` + lift halus.
- **Ghost / Outline:** transparan, border hairline, teks `text`.
- **Danger:** border/teks `bad`; solid `bad` hanya untuk aksi destruktif terkonfirmasi.

```tsx
// Contoh varian dengan class token
<button className="rounded-[6px] bg-accent px-3.5 py-2 text-sm font-medium
  text-[#0B0B0C] transition hover:bg-accent-hover hover:-translate-y-px">
  Launch app
</button>

<button className="rounded-[6px] border border-border px-3.5 py-2 text-sm
  text-text hover:bg-surface-2">
  See how it works
</button>
```

### 4.2 Status pill (+ dot)

```tsx
const STATUS = {
  Open:      { dot: "var(--muted)" },
  Funded:    { dot: "var(--ok)" },
  "In Review":{ dot: "var(--accent)" },
  Verifying: { dot: "var(--warn)" },
  Paid:      { dot: "var(--ok)" },
  Disputed:  { dot: "var(--bad)" },
  Refunded:  { dot: "var(--muted)" },
  Rejected:  { dot: "var(--bad)" },
} as const;

export function StatusPill({ status }: { status: keyof typeof STATUS }) {
  const dotStyle = { background: STATUS[status].dot };
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border
      border-border px-2 py-0.5 text-xs text-text">
      <span className="size-1.5 rounded-full" style={dotStyle} />
      {status}
    </span>
  );
}
```

### 4.3 Cards & tables

- Kartu: `bg-surface`, `border border-border`, `rounded-[10px]`, padding `16–24px`.
- Tabel: **zebra-free**, pisahkan baris dengan hairline (`divide-y divide-border`), header sticky, angka rata kanan + `tnum`.

### 4.4 Inputs

- `bg-surface`, `border border-border`, `rounded-[6px]`, focus ring tipis `accent` (bukan glow tebal).
- Segmented toggle (Instant / Safeguarded): 2 opsi, indikator aktif solid `accent` tipis.

### 4.5 On-chain data & angka (helper)

```tsx
// lib/format.ts
export const truncateAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`; // 0x9f2c…a41b
export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });
```

```tsx
// Selalu mono + tnum untuk uang & hash
<span className="font-mono tnum">{usd(20)} USDC</span>
<a className="font-mono text-muted hover:text-text"
   href={explorerTx(hash)}>{truncateAddr(hash)} ↗</a>
```

## 5. Iconography

- **Lucide** atau **Phosphor**, line, stroke 1.5px — **satu set saja**.
- Ukuran default 16–18px, warna `muted` (aktif → `text`/`accent`).
- Tidak ada emoji sebagai ikon UI.

## 6. Motion & komponen animasi — ReactBits ([reactbits.dev](http://reactbits.dev))

[reactbits.dev](http://reactbits.dev) adalah koleksi komponen React animasi (text effects, background, interaksi) yang di-**copy-paste / CLI** ke repo (bukan dependency berat), berbasis Tailwind + Framer Motion/GSAP. Di PullPay, ReactBits dipakai **hanya untuk aksen halus** yang memperkuat kesan *engineered* — bukan dekorasi. Prinsip §1 (restraint, 1 aksen, no wash/glow) tetap berlaku di atas ReactBits.

### 6.1 Cara pakai

- Tambah via `npx jsrepo add ...` atau copy manual ke `components/reactbits/`, lalu **re-style pakai token kita** (`accent`, `muted`, `.dot-grid`, radius) — buang warna neon/gradient bawaan.
- Semua efek harus **hormati `prefers-reduced-motion`** (matikan animasi kalau user minta) dan pakai durasi motion §2.3 (150–250ms, `ease-out`, tidak bouncy).
- **Maksimal ~2–3 efek ReactBits per layar.** Data on-chain (address, angka, hash) tetap **statik & terbaca** — hanya `CountUp` yang boleh menganimasikan angka.

### 6.2 Komponen yang dipakai (dan penyesuaiannya)

| Komponen ReactBits | Dipakai di | Penyesuaian ke design system |
| --- | --- | --- |
| **Count Up** | Angka USDC / total locked di hero & dashboard | Mono + `tnum`, sekali saat masuk viewport, 150–250ms |
| **Split Text / Blur Text** | Headline hero (reveal sekali saat load) | Jangan loop; `ease-out`; warna `text` |
| **Shiny Text** | 1 eyebrow / label kecil saja | Sheen sangat halus di atas `muted` — **bukan** gradient warna-warni |
| **Animated / Fade Content** | Reveal section saat scroll (landing) | Fade + blur-up tipis, sekali, jarak kecil |
| **Magnet** | Tombol primary (hover-lift) | Offset kecil, selaras token motion; jangan berlebihan |
| **Dot Grid** (background) | Latar hero / bounty board | Opacity ~3–6%, samakan dengan util `.dot-grid` (§3.1) |
| **Click Spark** (opsional) | Feedback klik aksi on-chain | Warna `accent`, sangat hemat; boleh di-skip |

### 6.3 Hindari (bentrok dengan anti-AI §7)

- **Background wash warna-warni:** Aurora, Silk, Iridescence, Threads, Balatro, Liquid Chrome.
- **Glass / glow / neon:** GlassSurface, efek blur panel, star/neon border yang menyala.
- **Gerak norak:** blob cursor 3D, teks Rotating/Scramble/Decrypt yang **loop terus**, background partikel padat.
- Aturannya: kalau sebuah efek menarik perhatian **lebih dari** data on-chain di layar itu, jangan dipakai.

## 7. Do / Don't (anti-AI)

| ✅ Do | 🚫 Don't |
| --- | --- |
| Left-aligned, asimetris, grid editorial | Semua center + hero simetris |
| Hairline 1px, radius kecil | Shadow tebal, serba pill besar |
| 1 aksen indigo, hemat | Gradient ungu/biru, wash |
| Mono + tabular untuk data on-chain | Inter di mana-mana |
| Konten nyata (repo, amount, tx hash) | Lorem ipsum, kotak abu-abu |
| Dot-grid 3% samar | Glassmorphism, blur panel, neon glow, 3D blob |

## 8. Suggested file structure

```
app/
  layout.tsx            # fonts + data-theme
  globals.css           # tokens + tailwind theme
  page.tsx              # landing
  bounties/page.tsx     # public bounty board
  reward/[id]/page.tsx  # reward detail & status
  create/page.tsx       # create reward
  providers.tsx         # wagmi/rainbowkit/react-query (client)
components/
  ui/                   # button, pill, card, table, input (shadcn-based)
  bounty/               # BountyCard, BountyRow, FilterRail
  onchain/              # ProofPanel, Stepper, DisputePanel
lib/
  format.ts             # truncateAddr, usd
  wagmi.ts              # config (ssr:true + cookieStorage)
  explorer.ts           # explorerTx / explorerAddr
```

## 9. Accessibility

- Kontras teks minimal WCAG AA (dark: `text` di atas `bg` ✓).
- Fokus ring selalu terlihat (`accent`, 2px offset), jangan andalkan warna saja untuk status → selalu ada label teks di pill.
- Target sentuh ≥ 40px; motion hormati `prefers-reduced-motion`.

---

<aside>
🎨

Untuk generate UI-nya, pakai prompt di [PullPay — Stitch UI Prompt](https://app.notion.com/p/PullPay-Stitch-UI-Prompt-Anti-AI-Professional-a806a852f20e469f82cb4192b801e885?pvs=21). Alasan pilihan Next.js 16 + wiring wagmi ada di PRD §29.

</aside>