---
name: academic-presentation-and-report
description: "Guidelines and checklists for university assignment deliverables in Kriptografi RSA. Covers YouTube demo video requirements (mandatory member intro, code walkthrough, running program demo), Word report formatting (.docx), manual calculations example (p=47, q=71, e=79), and test case verification checklist (TC-01 to TC-06)."
---

# Academic Presentation & Report Guidelines: RSA Coursework

Panduan penyusunan luaran tugas mata kuliah Kriptografi untuk proyek **SecurePass RSA**.

---

## 1. Identitas Proyek & Anggota Tim

- **Mata Kuliah**: Kriptografi
- **Topik Proyek**: Implementasi Algoritma RSA (Studi Kasus Surat Jalan Pabrik - SecurePass RSA)
- **Komposisi Tim**:
  1. **Rayka Dharma Pranandita** — 5027241039 (Math & Cryptographic Core Specialist)
  2. **Yuan Bany Albyan** — 5027241027 (Security Protocol & FastAPI Backend Specialist)
  3. **Evan Christian Nainggolan** — 5027241026 (Frontend Next.js & Integration Lead)
- **Bentuk Luaran Wajib**:
  1. Source Code Program (.zip)
  2. Dokumen Laporan Word (.docx)
  3. Tautan Video Demo YouTube (Public / Unlisted)

---

## 2. Ketentuan Video Demo YouTube (Maksimal 15 Menit)

### 2.1 Persyaratan Wajib Dosen
- **PERKENALAN DIRI WAJIB**: Di awal video sebelum presentasi dimulai, setiap anggota kelompok **WAJIB** memperkenalkan diri dengan menyebutkan **Nama Lengkap** dan **NRP** secara jelas di kamera/suara.
- **Resolusi**: Minimal 1080p, audio jernih dan bebas gangguan.
- **Publikasi**: Status video harus *Public* atau *Unlisted* (bukan Private).

### 2.2 Struktur & Rincian Skenario Video (15 Menit)

| Waktu | Sesi & Topik | Pembicara | Hal yang Wajib Ditampilkan |
| :---: | :--- | :--- | :--- |
| **00:00 - 02:00** | **Pendahuluan & Perkenalan Diri** | Semua Anggota | • Perkenalan Nama & NRP masing-masing.<br>• Latar belakang studi kasus (masalah pemalsuan surat jalan di pabrik).<br>• Solusi kriptografi kunci-publik RSA multi-entitas. |
| **02:00 - 05:30** | **Bedah Kode Matematika Manual** | Rayka Dharma Pranandita | • Penjelasan kode `primes.py` (Miller-Rabin & Trial Division).<br>• Penjelasan kode `math_utils.py` (Extended Euclidean & Square-and-Multiply).<br>• Bukti 0% library kriptografi eksternal.<br>• Demo tab *Crypto Inspector* (tabel EEA & bit-trace ModExp). |
| **05:30 - 09:00** | **Bedah Protokol & REST API** | Yuan Bany Albyan | • Penjelasan kode `hashing.py` (Polynomial Rolling Hash dari nol).<br>• Penjelasan `rsa_engine.py` (blocking $m_i < n$, primary sign, counter-sign, payload encryption).<br>• Penjelasan FastAPI routers & model anti-replay nonce. |
| **09:00 - 13:00** | **Demo Aplikasi Live (Happy Path)** | Evan Christian Nainggolan | • Generate kunci 3 entitas (PPIC, Satpam, Gudang).<br>• Penerbitan surat jalan oleh PPIC (signing + enkripsi memo rahasia).<br>• Pemeriksaan pos gerbang satpam (status HIJAU) & approval clearance counter-sign.<br>• Konfirmasi gudang cabang & pembukaan catatan rahasia. |
| **13:00 - 14:30** | **Demo Serangan Siber (Attack Lab)** | Evan & Yuan | • Skenario 1: Manipulasi jumlah muatan (Status MERAH - Hash Mismatch).<br>• Skenario 2: Pemalsuan tanda tangan (Status MERAH - Rogue Signer).<br>• Skenario 3: Kerusakan signature (Status MERAH - Bit Corrupted).<br>• Skenario 4: Percobaan replay token bekas (Status DITOLAK - Nonce Reused). |
| **14:30 - 15:00** | **Kesimpulan & Penutup** | Semua Anggota | • Kesimpulan keandalan RSA untuk integritas logistik.<br>• Evaluasi performa dan penutup. |

---

## 3. Format Dokumen Laporan Word (`LAPORAN_TUGAS.docx`)

Laporan wajib disusun menggunakan format dokumen Word (`.docx`) dan dimasukkan ke dalam berkas `.zip`. Struktur bab:

### Bab 1: Pendahuluan & Latar Belakang Studi Kasus
- Profil studi kasus: Pengamanan dokumen surat jalan barang keluar-masuk pabrik manufaktur.
- Masalah industri: Data tampering, supir nakal, surat jalan fiktif, ketiadaan bukti nir-sangkalan.
- Analisis perbandingan: Logistik umum vs. barang keluar-masuk pabrik.

### Bab 2: Landasan Teori Kriptografi RSA
- Teori matematika RSA: Pembagi Bersama Terbesar ($\gcd$), Bilangan Relatif Prima (*Coprime*), Fungsi Totient Euler $\phi(n)$, dan Teorema Euler.
- Algoritma Extended Euclidean untuk mencari invers modular $d = e^{-1} \pmod{\phi(n)}$.
- Algoritma uji keprimaan Miller-Rabin dan metode eksponensiasi modular *Square-and-Multiply*.

### Bab 3: Simulasi Perhitungan Manual Angka Kuliah
- Perhitungan manual lengkap menggunakan angka referensi kuliah:
  - Dipilih $p = 47, q = 71 \implies n = 3337, \phi(n) = 3220$.
  - Dipilih $e = 79$ (karena $\gcd(79, 3220) = 1$).
  - Perhitungan $d$ melalui langkah mundur EEA hingga diperoleh $d = 1019$.
  - Contoh enkripsi pesan teks per blok dan dekripsi kembali.

### Bab 4: Arsitektur Sistem & Struktur Fungsi Manual
- Penjelasan struktur file monorepo (`backend/` dan `frontend/`).
- Dokumentasi fungsi-fungsi inti manual:
  - `miller_rabin(n, k)`
  - `extended_euclidean(a, b)` & `mod_inverse(e, phi)`
  - `mod_exp(base, exp, mod)`
  - `polynomial_hash(data)`
  - `text_to_blocks(text, n)` & `blocks_to_text(blocks)`
- Arsitektur Client-Server: FastAPI REST API dan Next.js TanStack Query.

### Bab 5: Hasil Pengujian & Matriks Test Cases (TC-01 s/d TC-06)
- Dokumentasi pengujian sistem lengkap dengan tabel dan screenshot:
  - TC-01: Key Generation & Math Inspector
  - TC-02: Complete Lifecycle Happy Path (Penerbitan $\to$ Gerbang $\to$ Penerimaan)
  - TC-03: Attack 1 — Payload Tampering Detection
  - TC-04: Attack 2 — Rogue Signer / Impersonation
  - TC-05: Attack 3 — Signature Corruption
  - TC-06: Attack 4 — Replay / Expired Token Attack

### Bab 6: Pembagian Kerja Tim & Kontribusi Anggota
- Tabel matriks kontribusi 3 anggota (Role 1, Role 2, Role 3) mencakup peran kode, pengujian, penulisan laporan, dan sesi video YouTube.

### Lampiran
- Tautan video YouTube (*Public* / *Unlisted*).
- Kode program lengkap.
