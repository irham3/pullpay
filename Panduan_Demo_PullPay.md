# 🚀 PANDUAN DEMO & PENJELASAN PROYEK: PULLPAY

Dokumen ini adalah rangkuman dari semua berkas `.md` yang ada di proyek **PullPay** (`penjelasan_pullpay.md`, `isiProject.md`, `DESIGN.md`, `PRD.md`, `Planning.md`, dan `README.md`). 

Dokumen ini ditulis menggunakan **bahasa yang mudah dipahami orang awam/juri**, terstruktur, dan siap dijadikan panduan berbicara (contekkan) saat Anda melakukan demo aplikasi.

---

## 🎯 1. Apa itu PullPay? (Penjelasan 30 Detik)
> *"PullPay adalah platform pembayaran hadiah (bounty) open-source otomatis berbasis blockchain **Optimism**. Konsepnya sederhana: **Merge Pull Request (PR) Anda, dan kontributor langsung dibayar dalam USDC secara otomatis, tanpa gas fee, dan tanpa perlu saling percaya.**"*

### 🔍 Masalah yang Diselesaikan:
Di dunia perangkat lunak gratisan (open-source), memberi upah kecil (misalnya $5 - $20) untuk perbaikan bug kecil sangat sulit dilakukan. Biaya transfer bank internasional atau PayPal sangat mahal (terkadang biaya admin lebih besar dari hadiahnya). Koordinasi manual lewat Discord atau email juga rawan penipuan atau memakan waktu.

### 💡 Solusi PullPay:
Menghubungkan aktivitas kode di **GitHub** langsung dengan dompet **on-chain**. Hadiah dikunci di awal oleh pemilik proyek (Maintainer) di blockchain, dan akan langsung cair ke pembuat kode (Contributor) ketika kodenya disetujui (*merged*).

---

## 🔄 2. Alur Kerja PullPay (Bagaimana Cara Kerjanya?)

Sistem berjalan dalam 3 fase utama yang menghubungkan dunia pemrograman (GitHub) dengan dunia Blockchain:

```
[ Maintainer ] -> Kunci dana USDC di Contract -> Tambah pullpay.yml ke repo
      |
      v (Tugas dipublikasikan)
[ Contributor ] -> Buat perbaikan kode -> Kirim Pull Request (PR)
      |
      v (Pekerjaan disetujui & di-merge)
[ GitHub Action ] -> Memicu Relayer -> Membuat pernyataan (Assertion) ke UMA Oracle
      |
      v (Challenge Window / Masa Sanggah 30-120 detik untuk demo)
[ Tanpa Protes? ] -> USDC cair otomatis ke dompet Contributor (Klaim Gasless)
                   -> Cetak Sertifikat Digital Portofolio (EAS Attestation)
```

1. **Fase 1: Penguncian Dana (Escrow)**
   * Pemilik proyek (Maintainer) memilih isu di GitHub yang ingin diselesaikan, menentukan nilai hadiah (misal: $50 USDC), lalu mengunci dana tersebut ke dalam **Smart Contract** di jaringan Optimism.
   * Maintainer menambahkan file konfigurasi `pullpay.yml` ke repositori mereka agar sistem PullPay memantau repositori tersebut.
2. **Fase 2: Pengerjaan & Merge**
   * Developer (Contributor) melihat tugas tersebut, mengerjakan kodenya, dan mengirimkan **Pull Request (PR)**.
   * Maintainer meninjau kode. Jika cocok, Maintainer melakukan **Merge PR** tersebut.
3. **Fase 3: Verifikasi & Pembayaran**
   * Robot GitHub Actions mendeteksi *merge* dan memicu verifikasi ke **UMA Optimistic Oracle** (Hakim Blockchain).
   * Setelah lolos masa sanggah tanpa ada sengketa, uang USDC otomatis dikirim ke dompet Contributor tanpa biaya gas transaksi (Gasless), dan sertifikat bukti kontribusi dicetak di blockchain (**EAS**).

---

## 🌟 3. Mengapa PullPay Unik? (Diferensiasi dengan Kompetitor)

Di hadapan juri, Anda harus menekankan bahwa ide *"bayar saat merge"* memang sudah ada (seperti Octasol atau Opire). Namun, **semua kompetitor memiliki kelemahan fatal**: mereka bergantung pada server terpusat/bot yang bisa rusak/dicurangi, dan hanya mengecek *"apakah PR sudah di-merge"* (bukan apakah kualitas kerjanya bagus).

PullPay menggebrak pasar dengan **3 Fitur Unggulan**:

### A. ⚖️ Verifikasi Terdesentralisasi dengan UMA Oracle (Hakim Netral)
* **Masalah Kompetitor:** Jika bot server mereka mati, atau pemilik proyek melakukan *merge* tapi mengunci pembayaran secara sepihak, kontributor dirugikan. Atau sebaliknya, kontributor mengirim kode sampah lalu bekerja sama dengan admin palsu untuk mencairkan dana.
* **Solusi PullPay:** Kami menggunakan **UMA Optimistic Oracle**. Setiap klaim pembayaran diajukan dengan jaminan (*bond*). Jika ada kecurangan (misalnya kode asal-asalan tapi tetap di-merge demi mencuri uang), siapa pun di dunia dapat mengajukan protes (*dispute*). Sengketa akan diselesaikan secara adil oleh komunitas global UMA.

### B. ⛽ Pembayaran Tanpa Biaya Gas (Gasless Claims via ERC-4337)
* **Masalah Kompetitor:** Untuk mencairkan uang crypto di blockchain, Anda harus memiliki koin asli (seperti Ethereum/ETH) untuk membayar biaya gas. Developer web tradisional (non-crypto) akan bingung jika harus membeli ETH dulu di bursa.
* **Solusi PullPay:** Menggunakan teknologi Account Abstraction. Kontributor tidak perlu memiliki saldo ETH sama sekali. Biaya gas transaksi otomatis disponsori oleh protokol atau langsung dipotong dari hadiah USDC yang diterima.

### C. 📄 Sertifikat Portofolio Anti-Pemalsuan (EAS Attestation)
* Setiap kali pembayaran sukses, PullPay menerbitkan sertifikat digital permanen di blockchain menggunakan **Ethereum Attestation Service (EAS)**.
* Sertifikat ini mencatat secara resmi: nama repositori, jenis kontribusi, tanggal, dan jumlah bayaran. Ini menjadi **CV Digital portabel** bagi developer yang tidak bisa dimanipulasi untuk melamar kerja di masa depan.

---

## 📦 4. Penjelasan Tiap Berkas `.md` di Repositori

Berikut adalah peta isi dari masing-masing file markdown yang ada di proyek Anda:

### 1. [`penjelasan_pullpay.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/penjelasan_pullpay.md) (Panduan Sederhana)
* **Fokus:** Penjelasan super kasual untuk pemula.
* **Isi Penting:** Menggunakan analogi **Budi** (Maintainer) dan **Andi** (Contributor) untuk menjelaskan bagaimana uang mengalir secara aman tanpa perlu rasa saling percaya.

### 2. [`isiProject.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/isiProject.md) (Esensi & Strategi Pitch)
* **Fokus:** Visi bisnis, perbandingan kompetitor, arsitektur, dan cara presentasi ke juri.
* **Isi Penting:** Diagram alur lengkap (*mermaid diagram*), tabel komparasi kompetitor, konsep "Instant vs Safeguarded Mode", dan bukti dana (*Proof of Funding*).

### 3. [`DESIGN.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/DESIGN.md) (Panduan Antarmuka / UI)
* **Fokus:** Standar keindahan visual frontend.
* **Isi Penting:** Menolak desain templat AI yang membosankan. Desain PullPay dibuat premium ala Vercel/Linear: menggunakan warna latar gelap murni (`#0B0B0C`), aksen ungu, huruf monospace untuk angka on-chain agar terlihat rapi dan presisi.

### 4. [`PRD.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/PRD.md) (Spesifikasi Kebutuhan Produk)
* **Fokus:** Detail teknis super mendalam untuk implementator kode.
* **Isi Penting:** Cara integrasi *Smart Contract* dengan kontrak UMA, skema penerbitan sertifikat EAS, struktur *database*/event blockchain yang perlu dibaca frontend, dan cara menangani kegagalan (misalnya dana kedaluwarsa).

### 5. [`Planning.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/Planning.md) (Langkah Pengembangan)
* **Fokus:** Catatan harian/mingguan tim selama hackathon.
* **Isi Penting:** Pembagian tugas (kontrak pintar, relayer backend, UI frontend) dan target yang harus diselesaikan untuk MVP (Minimum Viable Product).

### 6. [`README.md`](file:///d:/SEMESTER%204/BANDUNG%20DEVELOPER%20BLOCKCHAIN/TEMPELAN%20PROJECT/pullpay/README.md) (Pintu Masuk Repositori)
* **Fokus:** Petunjuk cara menjalankan aplikasi secara lokal.
* **Isi Penting:** Perintah instalasi (`npm install`), cara menjalankan server lokal (`npm run dev`), dan prasyarat variabel lingkungan (Environment Variables).

---

## 💡 5. Tips Sukses Saat Melakukan Demo (Tips Presentasi)
1. **Mulailah dengan Masalah Nyata:** *"Banyak developer open-source menyumbangkan waktu mereka gratis, tapi saat maintainer ingin memberi tips $10, prosesnya sangat rumit dan mahal di luar crypto."*
2. **Tunjukkan Transparansi Dana:** Tunjukkan bahwa uang benar-benar dikunci di blockchain (bukan sekadar angka di database website).
3. **Fokus pada Demo Cepat:** Karena batas waktu demo biasanya singkat, jelaskan bahwa untuk demo ini, *Challenge Window* (masa sanggah) UMA Oracle disingkat menjadi 1 menit (di dunia nyata biasanya beberapa jam/hari) agar uang USDC bisa cair langsung di depan mata juri.
4. **Soroti Keunggulan Gasless:** Klik tombol klaim tanpa MetaMask meminta saldo ETH untuk gas fee, dan tunjukkan sertifikat EAS yang terbit setelahnya.
