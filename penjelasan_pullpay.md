# 💸 PullPay: Panduan Singkat & Sederhana

Selamat datang di **PullPay**! Dokumen ini dibuat khusus untuk membantu Anda memahami konsep, alur kerja, dan keunikan proyek ini dengan bahasa yang sangat mudah dimengerti (bebas dari istilah teknis yang memusingkan).

---

## 🎯 Apa itu PullPay?
Bayangkan Anda adalah pembuat aplikasi open-source (gratisan) dan ingin memberi imbalan uang (misalnya $10) kepada siapa saja di internet yang membantu memperbaiki *bug* di kode Anda. 

Biasanya, proses kirim uang receh antar-negara sangat merepotkan karena biaya admin bank/PayPal yang mahal dan rawan penipuan.

**PullPay hadir sebagai solusi:** Begitu kontributor mengirimkan kode perbaikan (Pull Request) dan Anda menyetujuinya (*merge*), **kontributor tersebut langsung dibayar secara otomatis dengan uang digital (USDC) tanpa potongan biaya mahal, dan tanpa perlu saling percaya satu sama lain.**

---

## ⚙️ Cara Kerja (Skenario Sederhana)

Mari kita gunakan analogi **Budi (Maintainer/Pemilik Proyek)** dan **Andi (Kontributor/Developer)**:

```
[ Budi ] --- Mengunci uang $10 di PullPay ---> [ Dompet Aman / Smart Contract ]
                                                             |
[ Andi ] --- Memperbaiki bug & kirim PR -------------------->| (PR di-merge!)
                                                             |
[ Andi ] <--- Uang $10 cair + Dapat Sertifikat Digital -------+
```

### 1. Budi Mengunci Uang (Escrow)
Budi membuat sayembara: *"Siapa yang bisa memperbaiki tombol login ini, saya bayar $10 USDC."* Budi memasukkan uang $10 tersebut ke dalam **dompet aman (smart contract)** di blockchain. Uang ini terkunci dan tidak bisa diambil kembali oleh Budi kecuali tidak ada yang berhasil menyelesaikan tugas tersebut.

### 2. Andi Mengerjakan & Mengirim Kode
Andi melihat sayembara tersebut, memperbaiki kodenya, dan mengirimkannya ke GitHub Budi. Budi memeriksa kode Andi, merasa cocok, lalu menyetujuinya (**Merge PR**).

### 3. Pemeriksaan Otomatis (UMA Oracle)
Setelah di-merge, sistem akan mendiamkan proses selama beberapa menit. Di sini, sistem memverifikasi: *"Apakah Andi benar-benar menyelesaikan tugas dengan baik, atau kodenya asal-asalan?"* Jika tidak ada yang protes, Andi dinyatakan menang.

### 4. Uang Cair & Sertifikat Terbit (EAS & Gasless)
* **Bebas Gas (Gasless):** Andi tidak perlu punya saldo crypto (ETH) untuk mencairkan uangnya. Uang $10 langsung masuk utuh ke dompet crypto Andi.
* **Sertifikat Digital (EAS):** Andi mendapatkan sertifikat digital permanen di blockchain sebagai bukti nyata bahwa ia telah berhasil membantu proyek Budi. Ini bisa jadi portofolio lamaran kerja Andi di masa depan!

---

## 🌟 4 Fitur Keren yang Bikin PullPay Unik

Jika Anda ditanya oleh juri atau orang lain mengapa proyek ini hebat, ini adalah jawabannya:

### 1. ⚖️ Hakim Netral (UMA Oracle)
Di platform lain, jika server penyedia robot rusak atau pemilik proyek curang setelah kode di-merge, kontributor tidak bisa berbuat apa-apa.
* **Di PullPay:** Jika pemilik proyek mencoba menahan uang padahal tugas sudah selesai, atau jika ada yang mengirim kode asal-asalan tapi tetap di-merge demi mencuri uang, siapa saja bisa mengajukan protes. Sengketa ini akan diselesaikan secara adil oleh komunitas global (UMA).

### 2. 📄 CV Digital yang Tidak Bisa Dipalsukan (EAS)
Setiap kali berhasil menyelesaikan tugas, kontributor mendapatkan sertifikat digital (attestation). Sertifikat ini mencatat reputasi developer (nama proyek, kontribusi, nilai bayaran) secara permanen. Ini adalah CV nyata berbasis blockchain yang anti-manipulasi.

### 3. ⛽ Bebas Biaya Gas (Gasless / ERC-4337)
Kendala utama orang awam menggunakan crypto adalah harus memiliki saldo koin asli (seperti ETH) untuk membayar biaya transaksi (*gas fee*). Di PullPay, kontributor tidak perlu pusing soal itu. Semua biaya transaksi sudah ditanggung oleh sistem atau dipotong langsung secara otomatis dari hadiah.

### 4. 🔀 Bagi Hasil Otomatis (Auto-split)
Jika tugas dikerjakan oleh 2 orang atau lebih secara bersama-sama, sistem PullPay bisa membagi hadiahnya secara adil (misal 50:50) secara otomatis langsung ke dompet masing-masing kontributor.

---

## 🛠️ Teknologi yang Digunakan

* **Optimism:** Jaringan blockchain lapis kedua (L2) yang digunakan agar biaya transaksi super murah (kurang dari Rp 10 per transaksi) dan cepat.
* **USDC:** Uang digital yang nilainya stabil setara dengan Dollar AS ($1 USDC = $1 USD).
* **Next.js & RainbowKit:** Teknologi web modern agar tampilan dashboard-nya terlihat sangat premium, cepat, dan mudah menghubungkan dompet crypto (seperti MetaMask).
* **GitHub Actions:** Robot otomatis yang membaca apakah kode Anda sudah di-merge atau belum di GitHub.

---

## 📈 Rencana Masa Depan (Roadmap)
1. **Suku Bunga Otomatis (Escrow Yield):** Uang yang dikunci oleh pemilik proyek bisa menghasilkan bunga kecil secara otomatis selama disimpan di dompet aman, yang nantinya dipakai untuk mendanai operasional website.
2. **Pool Donasi (RetroPGF):** Perusahaan besar bisa menaruh dana donasi besar di sebuah proyek, dan uang tersebut akan dibagi-bagikan otomatis kepada kontributor berprestasi secara berkala.
