# PANDUAN PENCERDASAN LENGKAP: SISTEM KRIPTOGRAFI SECUREPASS RSA

> **Dokumen Resmi Edukasi, Arsitektur & Pengujian Proyek**  
> Lokasi file: Tepat di root proyek di samping `README.md`.  
> Proyek: **Tugas Kriptografi — SecurePass RSA**

### 👥 Anggota Kelompok:
- **Evan Christian Nainggolan** — 5027241026
- **Yuan Bany Albyan** — 5027241027
- **Rayka Dharma Pranandita** — 5027241039

> Dokumen ini disusun untuk menjelaskan secara menyeluruh:  
> 1. **Apa tujuan bisnis dan arsitektur proyek ini?**  
> 2. **Bukti bahwa algoritma kriptografi RSA 100% dibuat sendiri tanpa library eksternal (*0% Crypto Library / From Scratch*).**  
> 3. **Peta Antarmuka (UI): Apa saja yang ada di layar dan bagaimana cara menggunakannya?**  
> 4. **Panduan Pengujian: Apa saja yang harus diuji (TC-01 s/d TC-11) untuk membuktikan sistem berfungsi?**  
> 5. **Peta Endpoint REST API Backend.**

---

## DAFTAR ISI

- [1. Apa Itu Proyek SecurePass RSA?](#1-apa-itu-proyek-securepass-rsa)
  - [1.1 Masalah Riil di Pabrik Manufaktur](#11-masalah-riil-di-pabrik-manufaktur)
  - [1.2 Mengapa Menggunakan Kriptografi Asimetris RSA?](#12-mengapa-menggunakan-kriptografi-asimetris-rsa)
  - [1.3 Tiga Entitas Aktor (A, B, C)](#13-tiga-entitas-aktor-a-b-c)
  - [1.4 Alur Protokol Token Mandiri (Air-Gapped Flow)](#14-alur-protokol-token-mandiri-air-gapped-flow)
- [2. Bukti 0% Library Kriptografi (Pembedahan Kode Asli)](#2-bukti-0-library-kriptografi-pembedahan-kode-asli)
  - [2.1 Penegasan Zero-Dependency](#21-penegasan-zero-dependency)
  - [2.2 Tabel Pemetaan Algoritma Matematika ke Kode Asli](#22-tabel-pemetaan-algoritma-matematika-ke-kode-asli)
  - [2.3 Bedah Kode Modul Inti Backend](#23-bedah-kode-modul-inti-backend)
  - [2.4 Simulasi Perhitungan Manual Akademis ($p=47, q=71, e=79$)](#24-simulasi-perhitungan-manual-akademis-p47-q71-e79)
- [3. Peta Antarmuka (UI) — Panduan Setiap Halaman](#3-peta-antarmuka-ui--panduan-setiap-halaman)
  - [3.1 Keyring Hub (Navbar Modal)](#31-keyring-hub-navbar-modal)
  - [3.2 Halaman Dashboard (`/`) — Pipeline Surat Jalan 3 Tahap](#32-halaman-dashboard---pipeline-surat-jalan-3-tahap)
  - [3.3 Halaman Crypto Inspector (`/inspector`) — Pembuktian Matematika](#33-halaman-crypto-inspector-inspector---pembuktian-matematika)
  - [3.4 Halaman Attack Lab (`/attack-lab`) — Simulasi 4 Serangan Siber](#34-halaman-attack-lab-attack-lab---simulasi-4-serangan-siber)
- [4. Panduan Pengujian Lengkap (TC-01 s/d TC-11)](#4-panduan-pengujian-lengkap-tc-01-sd-tc-11)
  - [TC-01: Inisialisasi Keyring (Preset Akademis)](#tc-01-inisialisasi-keyring-preset-akademis)
  - [TC-02: Validasi Parameter Kunci via Swagger Docs](#tc-02-validasi-parameter-kunci-via-swagger-docs)
  - [TC-03: Alur Normal Surat Jalan (Happy Path E2E)](#tc-03-alur-normal-surat-jalan-happy-path-e2e)
  - [TC-04: Inspector — Extended Euclidean Algorithm](#tc-04-inspector--extended-euclidean-algorithm)
  - [TC-05: Inspector — Uji Keprimaan Miller-Rabin](#tc-05-inspector--uji-keprimaan-miller-rabin)
  - [TC-06: Inspector — Eksponensiasi Square-and-Multiply](#tc-06-inspector--eksponensiasi-square-and-multiply)
  - [TC-07: Attack Lab — Payload Tampering Detection](#tc-07-attack-lab--payload-tampering-detection)
  - [TC-08: Attack Lab — Rogue Signer Detection](#tc-08-attack-lab--rogue-signer-detection)
  - [TC-09: Attack Lab — Corrupt Signature Detection](#tc-09-attack-lab--corrupt-signature-detection)
  - [TC-10: Attack Lab — Replay Attack Prevention (Anti-Replay Nonce)](#tc-10-attack-lab--replay-attack-prevention-anti-replay-nonce)
  - [TC-11: Eksekusi Unit Test Otomatis Backend (37 Tests)](#tc-11-eksekusi-unit-test-otomatis-backend-37-tests)
- [5. Peta Lengkap REST API Backend](#5-peta-lengkap-rest-api-backend)
- [6. Checklist Video Presentasi YouTube & Laporan](#6-checklist-video-presentasi-youtube--laporan)

---

## 1. APA ITU PROYEK SECUREPASS RSA?

### 1.1 Masalah Riil di Pabrik Manufaktur

Pada industri manufaktur berskala besar (misalnya pabrik peleburan baja, semen, perakitan otomotif, atau bahan kimia berbahaya), ratusan truk pengangkut keluar-masuk setiap hari membawa muatan bernilai ratusan juta rupiah. Dokumen pengantar yang digunakan adalah **Surat Jalan (Gate Pass / Delivery Order)**.

Permasalahan nyata di lapangan:
1. **Pemalsuan Fisik (Physical Tampering):** Supir nakal atau pihak ketiga dapat mengubah angka di kertas surat jalan di tengah jalan (misal muatan 500 batang baja diubah menjadi 300 batang, dan 200 batang digelapkan).
2. **Ketiadaan Nir-Sangkalan (*Non-Repudiation*):** Saat terjadi selisih stok di gudang tujuan, bagian pengirim (PPIC) dan satpam gerbang saling tuduh bahwa tanda tangan fisik di atas kertas dipalsukan atau tanda tangan basah dicap oleh oknum tak dikenal.
3. **Kerahasiaan Catatan Khusus (*Confidentiality*):** Surat jalan kerap memerlukan catatan rahasia (seperti nomor segel kontainer rahasia, instruksi penanganan bahan peledak/berbahaya, atau PIN brankas bongkar muat). Catatan ini **tidak boleh dibaca oleh supir truk maupun satpam pos luar**.
4. **Kondisi Tanpa Sinyal (*Air-Gapped / Offline Logistics*):** Pos satpam gerbang terluar dan gudang terpencil sering kali tidak memiliki koneksi internet stabil atau akses langsung ke database pusat perusahaan.

### 1.2 Mengapa Menggunakan Kriptografi Asimetris RSA?

Sistem **SecurePass RSA** memecahkan masalah ini dengan memanfaatkan sifat matematis Kriptografi Kunci Publik RSA:

| Jaminan Keamanan | Cara Kerja Matematis di Sistem |
|---|---|
| **Autentikasi (Authentication)** | Memastikan pihak yang menandatangani benar-benar PPIC resmi dan Satpam gerbang resmi melalui verifikasi public key masing-masing. |
| **Integritas (Integrity)** | Seluruh isi manifes di-hash menjadi ringkasan numerik. Jika 1 karakter atau 1 digit angka diubah, tanda tangan digital otomatis menjadi **TIDAK COCOK (MERAH)**. |
| **Nir-Sangkalan (Non-Repudiation)** | Hanya pemegang kunci privat penerbit ($d_A$) yang dapat menciptakan tanda tangan $S_A$. Pihak pengirim tidak dapat menyangkal telah menerbitkan surat jalan tersebut. |
| **Kerahasiaan (Confidentiality)** | Catatan rahasia dienkripsi menggunakan kunci publik Gudang Tujuan ($e_C, n_C$). Supir dan Satpam tidak bisa membacanya; hanya Gudang Tujuan dengan kunci privatnya ($d_C$) yang bisa mendekripsinya. |

### 1.3 Tiga Entitas Aktor (A, B, C)

Sistem memodelkan tiga aktor independen yang masing-masing memegang sepasang kunci publik dan privat:

```
+---------------------------+       +---------------------------+       +---------------------------+
|    ENTITAS A: PPIC        |       | ENTITAS B: SATPAM GERBANG |       | ENTITAS C: GUDANG TUJUAN  |
|   (Penerbit Dokumen)      |       |    (Pemeriksa Lapangan)   |       |      (Penerima Akhir)     |
| Public : (e_A, n_A)       |       | Public : (e_B, n_B)       |       | Public : (e_C, n_C)       |
| Private: (d_A, n_A)       |       | Private: (d_B, n_B)       |       | Private: (d_C, n_C)       |
+---------------------------+       +---------------------------+       +---------------------------+
```

1. **Entitas A (PPIC - Production Planning & Inventory Control):**
   - Mengisi manifes pengiriman (Nomor Pass, Truk, Supir, Daftar Muatan, Bobot).
   - Menulis catatan rahasia khusus gudang (dienkripsi dengan public key Entitas C).
   - Menandatangani seluruh paket data menggunakan private key Entitas A ($d_A$).
   - Menghasilkan token digital terenkapsulasi (Base64) dan QR code.

2. **Entitas B (Satpam Pos Gerbang Utama):**
   - Menerima token dari supir (scan QR atau paste string).
   - Memverifikasi tanda tangan Entitas A ($e_A$) secara instan tanpa perlu akses internet database pusat.
   - Memeriksa fisik muatan truk apakah sesuai dengan data manifes di layar.
   - Jika muatan sesuai, Satpam menyetujui dan membubuhkan tanda tangan verifikasi kedua (*counter-signature*) menggunakan private key Entitas B ($d_B$).
   - Token diperbarui menjadi *Cleared Token*.

3. **Entitas C (Warehouse / Gudang Cabang Penerima):**
   - Menerima truk dan *Cleared Token*.
   - Melakukan verifikasi ganda (*Dual Signature Verification*):
     - Memastikan tanda tangan PPIC ($A$) sah.
     - Memastikan tanda tangan Satpam ($B$) sah.
   - Mendekripsi catatan rahasia menggunakan private key Entitas C ($d_C$).
   - Mengonfirmasi penerimaan barang secara sah.

### 1.4 Alur Protokol Token Mandiri (Air-Gapped Flow)

Seluruh informasi berjalan di dalam satu payload mandiri (*self-contained package*) berbasis format Base64 JSON, sehingga sistem dapat bekerja secara **air-gapped** (tanpa komunikasi database real-time antar pos):

```
[PPIC (A)] 
   │  Isi manifes + Enkripsi Catatan Rahasia (e_C, n_C)
   │  Hitung Hash Dokumen -> Tanda tangani dengan (d_A, n_A)
   ▼
[Token Tahap 1: Base64 String / QR Code]
   │  (Dibawa supir truk ke gerbang keluar)
   ▼
[Satpam Gerbang (B)]
   │  Verifikasi Tanda Tangan A dengan (e_A, n_A) -> Cocokkan fisik
   │  Bubuhkan Clearance + Counter-Sign dengan (d_B, n_B)
   ▼
[Token Tahap 2: Cleared Base64 Token]
   │  (Dibawa supir truk menuju gudang cabang tujuan)
   ▼
[Gudang Penerima (C)]
   │  Verifikasi Tanda Tangan A (e_A, n_A)
   │  Verifikasi Tanda Tangan B (e_B, n_B)
   │  Dekripsi Catatan Rahasia dengan (d_C, n_C)
   ▼
[Barang Diterima & Transaksi Selesai Sah]
```

---

## 2. BUKTI 0% LIBRARY KRIPTOGRAFI (PEMBEDAHAN KODE ASLI)

### 2.1 Penegasan Zero-Dependency

Kerap kali penguji atau dosen bertanya: *"Apakah enkripsi ini menggunakan modul Python seperti pycryptodome, cryptography, atau modul rsa?"*

**Jawabannya adalah 100% TIDAK.**
- Tidak ada library kriptografi pihak ketiga yang diinstal atau diimpor di backend.
- Tidak menggunakan fungsi bawaan `pow(base, exp, mod)` untuk eksponensiasi modular.
- Tidak menggunakan modul bawaan `hashlib` untuk perhitungan hashing digital signature.
- Seluruh matematika dibangun dari nol (*pure Python*) di direktori [`backend/core/`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core).

### 2.2 Tabel Pemetaan Algoritma Matematika ke Kode Asli

| Konsep Matematika | File Implementasi | Fungsi Utama | Keterangan & Rumus |
|---|---|---|---|
| **FPB / GCD Euclidean** | [`backend/core/math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py) | `gcd(a, b)` | Loop modulo klasik $a, b = b, a \pmod b$ |
| **Extended Euclidean (EEA)** | [`backend/core/math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py) | `extended_euclidean(a, b)` | Menghitung koefisien Bézout $ax + by = \gcd(a, b)$ |
| **Invers Modular** | [`backend/core/math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py) | `mod_inverse(e, phi)` | Menghitung $d = e^{-1} \pmod \phi$ dari koefisien EEA |
| **Square-and-Multiply** | [`backend/core/math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py) | `mod_exp(base, exp, mod)` | Eksponensiasi biner manual $O(\log \text{exp})$ (tanpa `pow`) |
| **Trial Division** | [`backend/core/primes.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/primes.py) | `is_prime_trial_division(n)` | Filter pembagian bilangan prima kecil $< 1000$ |
| **Miller-Rabin Primality Test** | [`backend/core/primes.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/primes.py) | `miller_rabin(n, k=20)` | Uji keprimaan probabilistik 20 ronde dengan saksi acak |
| **Prime Generator** | [`backend/core/primes.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/primes.py) | `generate_prime(bits)` | Membangkitkan kandidat bilangan acak ganjil dan diuji |
| **Polynomial Rolling Hash** | [`backend/core/hashing.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/hashing.py) | `polynomial_hash(data)` | $H = \sum c_i \cdot 313^i \pmod{2^{31}-1}$ (tanpa modul hashlib) |
| **Key Generation RSA** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `generate_keypair(p, q, e)` | $n = p \cdot q$, $\phi = (p-1)(q-1)$, $d = e^{-1} \pmod \phi$ |
| **Text Chunking** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `text_to_blocks()`, `blocks_to_text()` | Memecah teks UTF-8 ke blok integer agar $m_i < n$ |
| **Enkripsi Pesan** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `encrypt()` | $c_i = m_i^e \pmod n$ untuk setiap blok $m_i$ |
| **Dekripsi Pesan** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `decrypt()` | $m_i = c_i^d \pmod n$ untuk setiap ciphertext $c_i$ |
| **Tanda Tangan Digital** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `sign()` | $S = (H \pmod n)^d \pmod n$ |
| **Verifikasi Tanda Tangan** | [`backend/core/rsa_engine.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/rsa_engine.py) | `verify()` | $H' = S^e \pmod n$, memvalidasi $H' == (H \pmod n)$ |
| **Math Step Tracer** | [`backend/core/inspector.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/inspector.py) | `CryptoInspector` | Mencatat langkah komputasi loop untuk visualisasi di UI |

---

### 2.3 Bedah Kode Modul Inti Backend

Mari kita lihat cuplikan kode nyata dari file-file di backend:

#### 1. Pembagian Euclidean & Koefisien Bézout ([`math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py#L32-L55))
```python
def extended_euclidean(a: int, b: int) -> Tuple[int, int, int]:
    """Menghitung gcd(a, b) dan koefisien x, y sehingga a*x + b*y = gcd(a, b)."""
    old_r, r = a, b
    old_s, s = 1, 0
    old_t, t = 0, 1

    while r != 0:
        quotient = old_r // r
        old_r, r = r, old_r - quotient * r
        old_s, s = s, old_s - quotient * s
        old_t, t = t, old_t - quotient * t

    return old_r, old_s, old_t  # Mengembalikan (gcd, x, y)
```

#### 2. Invers Modular Tanpa Library ([`math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py#L58-L67))
```python
def mod_inverse(e: int, phi: int) -> int:
    """Menghitung d = e^(-1) mod phi menggunakan Extended Euclidean Algorithm."""
    g, x, _ = extended_euclidean(e, phi)
    if g != 1:
        raise ValueError(f"Invers modular tidak ada karena gcd({e}, {phi}) = {g} != 1")
    return (x % phi + phi) % phi
```

#### 3. Eksponensiasi Square-and-Multiply Manual ([`math_utils.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/math_utils.py#L70-L87))
```python
def mod_exp(base: int, exp: int, mod: int) -> int:
    """Menghitung (base^exp) mod mod tanpa pow() bawaan."""
    if mod == 1:
        return 0
    result = 1
    base = base % mod
    while exp > 0:
        if exp % 2 == 1:              # Bit aktif: kalikan
            result = (result * base) % mod
        exp = exp // 2                # Geser bit ke kanan
        base = (base * base) % mod     # Kuadratkan base (Square)
    return result
```

#### 4. Uji Keprimaan Probabilistik Miller-Rabin ([`primes.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/primes.py#L42-L78))
```python
def miller_rabin(n: int, k: int = 20) -> bool:
    """Uji keprimaan Miller-Rabin dengan k ronde saksi acak."""
    if n < 2: return False
    if n in (2, 3): return True
    if n % 2 == 0: return False

    # Tulis n - 1 = 2^s * d
    d = n - 1
    s = 0
    while d % 2 == 0:
        d //= 2
        s += 1

    for _ in range(k):
        a = random.randrange(2, n - 1)
        x = mod_exp(a, d, n)
        if x == 1 or x == n - 1:
            continue
        for _ in range(s - 1):
            x = mod_exp(x, 2, n)
            if x == n - 1:
                break
        else:
            return False
    return True
```

#### 5. Fungsi Hash Polynomial Mandiri ([`hashing.py`](file:///c:/Users/asus/OneDrive/Documents/WebDev_BigProject/kriptografi-rsa/backend/core/hashing.py#L12-L34))
```python
POLYNOMIAL_BASE = 313
MERSENNE_MODULUS = 2147483647  # Bilangan prima Mersenne 2^31 - 1

def polynomial_hash(data: str) -> int:
    """Rolling polynomial hash: H(s) = sum(ord(c_i) * BASE^i) mod MODULUS."""
    h = 0
    power = 1
    for char in data:
        code = ord(char)
        h = (h + code * power) % MERSENNE_MODULUS
        power = (power * POLYNOMIAL_BASE) % MERSENNE_MODULUS
    return h
```

---

### 2.4 Simulasi Perhitungan Manual Akademis ($p=47, q=71, e=79$)

Sistem ini menyediakan angka preset standar perkuliahan yang dapat diverifikasi di atas kertas dengan kalkulator biasa:

1. **Memilih Dua Bilangan Prima:**
   $$p = 47, \quad q = 71$$
2. **Menghitung Modulus $n$:**
   $$n = p \times q = 47 \times 71 = 3337$$
3. **Menghitung Totient Euler $\phi(n)$:**
   $$\phi(n) = (p - 1) \times (q - 1) = (47 - 1) \times (71 - 1) = 46 \times 70 = 3220$$
4. **Memilih Eksponen Publik $e$:**
   Dipilih $e = 79$.  
   Verifikasi koprima: $\gcd(79, 3220) = 1$ (relatif prima).
5. **Menghitung Eksponen Privat $d$ via Extended Euclidean Algorithm:**
   Mencari $d$ sedemikian sehingga:
   $$e \cdot d \equiv 1 \pmod{\phi(n)} \iff 79 \cdot d \equiv 1 \pmod{3220}$$
   Langkah pembagian mundur EEA:
   - $3220 = 40 \times 79 + 60$
   - $79 = 1 \times 60 + 19$
   - $60 = 3 \times 19 + 3$
   - $19 = 6 \times 3 + 1$
   - $3 = 3 \times 1 + 0$
   
   Substitusi balik:
   $$1 = 19 - 6 \times 3 = 19 - 6 \times (60 - 3 \times 19) = 19 \times 19 - 6 \times 60$$
   $$\dots \implies 1 = (-1019) \times 3220 + 41501 \times 79$$
   Karena $x = -1019$, maka $d = -1019 \pmod{3220} = 3220 - 1019 = 1019$.  
   **Didapatkan:** $d = 1019$.

6. **Pembuktian Kebenaran:**
   $$(e \times d) \pmod{\phi(n)} = (79 \times 1019) \pmod{3220} = 80501 \pmod{3220} = 1 \quad \text{(VALID!)}$$

7. **Contoh Enkripsi & Dekripsi Karakter 'A' ($m = 65$):**
   - **Enkripsi:**
     $$c = m^e \pmod n = 65^{79} \pmod{3337} = 1603$$
   - **Dekripsi:**
     $$m = c^d \pmod n = 1603^{1019} \pmod{3337} = 65 \quad (\text{ASCII } 65 = \text{'A'}) \quad \text{(TERBUKTI!)}$$

---

## 3. PETA ANTARMUKA (UI) — PANDUAN SETIAP HALAMAN

Frontend dibangun menggunakan Next.js (App Router), TypeScript, Tailwind CSS, dan TanStack Query. Akses aplikasi melalui browser di `http://localhost:3000`.

### 3.1 Keyring Hub (Navbar Modal)

Di pojok kanan atas bilah navigasi (*Navbar*), terdapat tombol **Keyring Hub**:
- Menampilkan status kunci ketiga entitas:
  - `A: PPIC` (Warna Hijau jika kunci terisi)
  - `B: Satpam` (Warna Hijau jika kunci terisi)
  - `C: Gudang` (Warna Hijau jika kunci terisi)
- **Tombol di Dalam Modal:**
  1. **"Preset Akademis (Kuliah)"**: Memuat otomatis $p=47, q=71, e=79 \to d=1019$ untuk semua entitas (sangat direkomendasikan untuk demo dosen).
  2. **"Preset 32-bit Safe"**: Memuat prima 32-bit untuk demonstrasi bilangan lebih realistis.
  3. **"Generate Fresh Keys"**: Memanggil backend untuk membangkitkan prima acak baru.

---

### 3.2 Halaman Dashboard (`/`) — Pipeline Surat Jalan 3 Tahap

Halaman utama (`/`) menampilkan alur terpadu pengurusan surat jalan dalam satu layar:

```
[ STEP 1: PPIC ISSUANCE ] ──> [ STEP 2: GATE SECURITY ] ──> [ STEP 3: WAREHOUSE RECEIPT ]
```

#### Step 1: Penerbitan Manifes (Entitas A - PPIC)
- **Kolom Formulir:**
  - Nomor Surat Jalan (misal `SJ-2026-X01`).
  - Nomor Polisi Truk & Nama Supir.
  - Item Barang, Kuantitas, dan Total Berat.
  - **Catatan Rahasia (*Secret Memo*)**: Catatan khusus yang hanya boleh dibaca oleh gudang tujuan.
- **Tombol Aksi:** `[ Issue & Sign Surat Jalan ]`
- **Hasil di Layar:**
  - String Token Base64 terenkapsulasi.
  - Gambar QR Code digital yang dapat di-scan oleh satpam.
  - Ringkasan tanda tangan digital $S_A$ dan digest dokumen.

#### Step 2: Pos Satpam Gerbang (Entitas B)
- **Sub-langkah 2a: Verifikasi Tanda Tangan PPIC**
  - Kolom token otomatis terisi dari Step 1.
  - Klik `[ Verify Manifest Signature ]`.
  - **Hasil:** Indikator status **HIJAU (VALID)** beserta ringkasan muatan truk yang sah untuk dicocokkan fisik.
- **Sub-langkah 2b: Pemberian Izin Keluar (Gate Clearance Counter-Sign)**
  - Masukkan ID Pos Gerbang (misal `GATE-POS-01`) dan Nama Petugas Satpam.
  - Klik `[ Approve & Counter-Sign ]`.
  - **Hasil:** Token diperbarui menjadi *Cleared Token* yang memuat tanda tangan ganda ($S_A$ dan $S_B$).

#### Step 3: Penerimaan & Dekripsi Gudang (Entitas C)
- Masukkan *Cleared Token*.
- Klik `[ Confirm Receipt & Decrypt Secret ]`.
- **Hasil di Layar:**
  - Verifikasi Tanda Tangan PPIC: **SAH ✓**
  - Verifikasi Tanda Tangan Satpam: **SAH ✓**
  - **Catatan Rahasia Terbuka**: Teks memo asli yang tadinya terenkripsi berhasil terbuka menggunakan private key Entitas C.

---

### 3.3 Halaman Crypto Inspector (`/inspector`) — Pembuktian Matematika

Halaman ini didesain khusus untuk presentasi akademik. Dosen dan penguji dapat melihat visualisasi eksekusi rumus langkah demi langkah:

1. **Tab Extended Euclidean Algorithm (EEA):**
   - Masukkan nilai $a$ (misal $79$) dan $b$ (misal $3220$).
   - Klik **Calculate**.
   - Menampilkan tabel interaktif seluruh iterasi pembagian mundur, nilai $q, r, s, t$, serta hasil akhir $d = 1019$.
2. **Tab Miller-Rabin Primality Test:**
   - Masukkan bilangan $n$ (misal $47$) dan jumlah ronde saksi $k$ (misal $5$).
   - Klik **Test**.
   - Menampilkan faktorisasi $n - 1 = 2^s \cdot d$, pengujian ronde demi ronde, dan vonis: *PRIME* atau *COMPOSITE*.
3. **Tab Square-and-Multiply (ModExp):**
   - Masukkan Base, Exponent, dan Modulus (misal $65^{79} \pmod{3337}$).
   - Klik **Trace Exponentiation**.
   - Menampilkan tabel bit ekspansi biner dari $79$ (`1001111_2`), menunjukkan kapan terjadi operasi *Square* dan kapan terjadi operasi *Multiply*.
4. **Tab Text Chunking Visualizer:**
   - Menampilkan proses pemecahan kalimat teks menjadi beberapa blok integer $m_i$ yang nilainya selalu dijaga lebih kecil dari modulus $n$.

---

### 3.4 Halaman Attack Lab (`/attack-lab`) — Simulasi 4 Serangan Siber

Halaman ini mendemonstrasikan ketangguhan sistem terhadap skenario kejahatan siber:

1. **Tab 1: Payload Tampering (Manipulasi Data)**
   - Mensimulasikan supir nakal yang mengubah jumlah barang di jalan.
   - Hasil: Tanda tangan digital otomatis gagal diverifikasi, muncul notifikasi MERAH: `HASH_MISMATCH`.
2. **Tab 2: Rogue Signer (Pemalsuan Tanda Tangan)**
   - Mensimulasikan penyerang yang membuat tanda tangan menggunakan kunci privat bajakan.
   - Hasil: Verifikasi dengan Public Key resmi PPIC gagal total (`ROGUE_SIGNER_DETECTED`).
3. **Tab 3: Corrupt Signature (Kerusakan Data Transmisi)**
   - Mensimulasikan gangguan transmisi atau manipulasi bit pada tanda tangan (+1 delta).
   - Hasil: Perhitungan matematika $S^e \pmod n$ menghasilkan digest acak tak bermakna (`SIGNATURE_CORRUPTED`).
4. **Tab 4: Replay Attack (Pencegahan Token Bekas)**
   - Mensimulasikan supir yang menggunakan kembali token surat jalan kemarin yang sudah pernah keluar pos gerbang.
   - Hasil: Backend menolak permintaan karena nomor *nonce* unik token telah tercatat di registry memori (`TOKEN_ALREADY_USED`).

---

## 4. PANDUAN PENGUJIAN LENGKAP (TC-01 S/D TC-11)

Lakukan 11 pengujian ini untuk memvalidasi seluruh fungsi sistem:

### TC-01: Inisialisasi Keyring (Preset Akademis)
- **Tujuan:** Menyiapkan kunci untuk Entitas A, B, dan C.
- **Langkah:**
  1. Buka `http://localhost:3000`.
  2. Klik tombol **Keyring Hub** di kanan atas navbar.
  3. Klik tombol **"Preset Akademis (Kuliah)"**.
- **Hasil:**
  - Status di navbar berubah menjadi hijau: `[A: ✓] [B: ✓] [C: ✓]`.
  - Parameter kunci A terisi: $p=47, q=71, n=3337, e=79, d=1019$.

---

### TC-02: Validasi Parameter Kunci via Swagger Docs
- **Tujuan:** Menguji API validasi kunci matematika di backend.
- **Langkah:**
  1. Buka `http://localhost:8000/docs`.
  2. Buka endpoint `POST /api/v1/keys/validate`.
  3. Masukkan body: `{"p": 47, "q": 71, "e": 79}` lalu klik **Execute**.
- **Hasil:** Respon HTTP `200 OK`: `{"valid": true, "n": 3337, "phi": 3220, "d": 1019, "error": null}`.

---

### TC-03: Alur Normal Surat Jalan (Happy Path E2E)
- **Tujuan:** Menjalankan alur lengkap penerbitan $\to$ pos gerbang $\to$ gudang tujuan.
- **Langkah:**
  1. Buka halaman utama `http://localhost:3000/`.
  2. **Step 1 (PPIC):**
     - Isi nomor pass: `SJ-2026-TEST`.
     - Isi kendaraan: `B-1234-XYZ`.
     - Isi muatan: `100 Box Semen`.
     - Isi secret note: `KODE PIN GUDANG: 8899`.
     - Klik **"Issue & Sign Surat Jalan"**.
  3. **Step 2a (Satpam Gerbang):**
     - Klik **"Verify Manifest Signature"**. Status muncul **VALID (HIJAU)**.
  4. **Step 2b (Satpam Clearance):**
     - Isi Gate ID: `GATE-01`, Petugas: `Siti`.
     - Klik **"Approve & Counter-Sign"**.
  5. **Step 3 (Gudang Penerima):**
     - Klik **"Confirm Receipt & Decrypt Secret"**.
- **Hasil:**
  - Tanda tangan PPIC dan Satpam terverifikasi **VALID**.
  - Catatan rahasia berhasil didekripsi: `KODE PIN GUDANG: 8899`.

---

### TC-04: Inspector — Extended Euclidean Algorithm
- **Tujuan:** Memvalidasi perhitungan manual $d = e^{-1} \pmod \phi$ secara visual.
- **Langkah:**
  1. Buka `http://localhost:3000/inspector`.
  2. Pilih tab **Extended Euclidean (EEA)**.
  3. Masukkan `a = 79` dan `b = 3220`. Klik **Calculate**.
- **Hasil:** Tabel langkah pembagian EEA muncul, $\gcd(79, 3220) = 1$, dan $x = 1019$.

---

### TC-05: Inspector — Uji Keprimaan Miller-Rabin
- **Tujuan:** Menguji keandalan uji keprimaan probabilistik.
- **Langkah:**
  1. Di `/inspector`, pilih tab **Miller-Rabin**.
  2. Uji 1: Masukkan `n = 47`, Rounds = `5`. Klik **Test** $\to$ Hasil: **PRIME (HIJAU)**.
  3. Uji 2: Masukkan `n = 48`, Rounds = `5`. Klik **Test** $\to$ Hasil: **COMPOSITE (MERAH)**.

---

### TC-06: Inspector — Eksponensiasi Square-and-Multiply
- **Tujuan:** Membuktikan perhitungan perpangkatan modular bit-per-bit manual.
- **Langkah:**
  1. Di `/inspector`, pilih tab **Square-and-Multiply**.
  2. Masukkan `Base = 65`, `Exponent = 79`, `Modulus = 3337`. Klik **Trace Exponentiation**.
- **Hasil:** Tabel ekspansi biner dari eksponen $79$ muncul, hasil akhir komputasi = `1603`.

---

### TC-07: Attack Lab — Payload Tampering Detection
- **Tujuan:** Membuktikan integritas data: 1 angka diubah, dokumen ditolak.
- **Langkah:**
  1. Buka `http://localhost:3000/attack-lab`.
  2. Pilih tab **Payload Tampering**. Masukkan token asli dari TC-03.
  3. Ubah jumlah muatan (misal `100` diubah jadi `200`). Klik **Simulate Attack**.
- **Hasil:** Status **TIDAK VALID (MERAH)**, error: `HASH_MISMATCH`.

---

### TC-08: Attack Lab — Rogue Signer Detection
- **Tujuan:** Membuktikan tanda tangan pihak bajakan ditolak.
- **Langkah:**
  1. Buka tab **Rogue Signer**. Masukkan token asli.
  2. Buat tanda tangan menggunakan kunci bajakan. Verifikasi terhadap kunci PPIC resmi.
- **Hasil:** Status **DITOLAK (MERAH)**, keterangan: `ROGUE_SIGNER_DETECTED`.

---

### TC-09: Attack Lab — Corrupt Signature Detection
- **Tujuan:** Membuktikan jika tanda tangan digital rusak 1 bit, data tidak lolos.
- **Langkah:**
  1. Buka tab **Corrupt Signature**. Masukkan token asli.
  2. Tambahkan offset gangguan `Delta = +1`. Klik **Execute Corruption Test**.
- **Hasil:** Status **GAGAL**, keterangan: `SIGNATURE_MATH_FAILED`.

---

### TC-10: Attack Lab — Replay Attack Prevention (Anti-Replay Nonce)
- **Tujuan:** Membuktikan surat jalan bekas tidak bisa dipakai ulang.
- **Langkah:**
  1. Buka tab **Replay Attack**.
  2. Masukkan token yang **sudah pernah di-clearance** pada TC-03. Coba kirim ulang clearance.
- **Hasil:** Sistem menolak dengan pesan: `TOKEN_ALREADY_USED` / `NONCE_EXISTS`.

---

### TC-11: Eksekusi Unit Test Otomatis Backend (37 Tests)
- **Tujuan:** Menjalankan automated test suite matematika dan E2E API.
- **Langkah (di Terminal Powershell):**
  ```powershell
  cd c:\Users\asus\OneDrive\Documents\WebDev_BigProject\kriptografi-rsa
  python -m unittest backend/tests/test_math.py
  python -m unittest backend/tests/test_api_e2e.py
  ```
- **Hasil yang Diharapkan:**
  ```text
  Ran 37 tests in 0.015s
  OK
  ```
  Semua skenario perhitungan matematika berstatus **PASSED (OK)**.

---

## 5. PETA LENGKAP REST API BACKEND

Seluruh endpoint backend disajikan melalui FastAPI (`http://localhost:8000`):

| Metode | Endpoint Path | Body Parameter | Output Utama | Fungsi |
|:---:|---|---|---|---|
| `GET` | `/health` | - | `{"status": "ok"}` | Cek status server aktif |
| `POST` | `/api/v1/keys/generate` | `{"bits": 16, "e": 65537}` | `{"p": int, "q": int, "n": int, "e": int, "d": int}` | Bangkitkan kunci prima acak baru |
| `POST` | `/api/v1/keys/validate` | `{"p": 47, "q": 71, "e": 79}` | `{"valid": true, "d": 1019, "n": 3337}` | Validasi matematika parameter kunci |
| `POST` | `/api/v1/pass/issue` | Manifes + Memo + Kunci A & C | `{"token": str, "signature_a": int}` | Terbitkan surat jalan & sign tahap 1 |
| `POST` | `/api/v1/pass/gate-verify` | `{"token": str, "public_key_a": {...}}` | `{"valid": bool, "payload": {...}}` | Verifikasi tanda tangan penerbit di gerbang |
| `POST` | `/api/v1/pass/gate-clearance`| Token + Clearance Info + Kunci B | `{"cleared_token": str, "signature_b": int}` | Satpam counter-sign & izinkan keluar |
| `POST` | `/api/v1/pass/receive` | Cleared Token + Kunci C + Kunci A/B | `{"valid_a": bool, "valid_b": bool, "decrypted_secret": str}` | Gudang verifikasi ganda & buka memo |
| `POST` | `/api/v1/attack/tamper-payload` | Token + Manifes Dimodifikasi | `{"is_valid": false, "expected_hash": int}` | Uji manipulasi muatan barang |
| `POST` | `/api/v1/attack/rogue-signer` | Token + Kunci Bajakan | `{"verification_passed": false}` | Uji tanda tangan kunci bajakan |
| `POST` | `/api/v1/attack/corrupt-signature`| Token + Offset Delta | `{"is_valid": false}` | Uji kerusakan bit tanda tangan |
| `POST` | `/api/v1/attack/replay` | Token Bekas Clearance | `{"replay_detected": true}` | Uji penolakan token bekas (Anti-replay) |
| `POST` | `/api/v1/inspect/eea` | `{"a": int, "b": int}` | `{"gcd": 1, "x": int, "steps": [...]}` | Jejak langkah Extended Euclidean |
| `POST` | `/api/v1/inspect/miller-rabin` | `{"n": int, "k": int}` | `{"is_prime": bool, "rounds": [...]}` | Jejak ronde uji prima Miller-Rabin |
| `POST` | `/api/v1/inspect/mod-exp` | `{"base": int, "exp": int, "mod": int}` | `{"result": int, "steps": [...]}` | Jejak bit Square-and-Multiply |

---

## 6. CHECKLIST VIDEO PRESENTASI YOUTUBE & LAPORAN

### Ketentuan Wajib Dosen:
1. **Perkenalan Diri Wajib di Awal Video:**
   Setiap anggota kelompok **WAJIB** memperkenalkan diri dengan menyebutkan **Nama Lengkap** dan **NRP** secara jelas di kamera dan audio sebelum presentasi dimulai.
2. **Durasi Video:** Maksimal 15 Menit. Resolusi minimal 1080p. Status video: *Public* atau *Unlisted*.

### Rekomendasi Pembagian Tugas & Skenario Video:
- **00:00 - 02:00 (Semua Anggota):** Perkenalan Nama & NRP (Evan, Yuan, Rayka) + Latar belakang masalah surat jalan di industri manufaktur.
- **02:00 - 05:30 (Rayka Dharma Pranandita):** Bedah kode matematika manual (`math_utils.py`, `primes.py`), buktikan 0% library kriptografi eksternal, dan demokan tab *Crypto Inspector* di browser.
- **05:30 - 09:00 (Yuan Bany Albyan):** Bedah kode hashing (`hashing.py`), chunking teks & blocking RSA (`rsa_engine.py`), perlihatkan dokumentasi Swagger API, dan jelaskan anti-replay nonce.
- **09:00 - 13:00 (Evan Christian Nainggolan):** Demo live Happy Path di antarmuka web (Input manifes $\to$ Issue PPIC $\to$ Scan/Verify Satpam $\to$ Counter-sign Gerbang $\to$ Dual-Verify Gudang & Dekripsi memo rahasia).
- **13:00 - 14:30 (Yuan Bany Albyan & Evan Christian Nainggolan):** Demo serangan siber di halaman *Attack Lab* (Payload Tampering & Replay Attack). Tunjukkan badge merah penolakan otomatis.
- **14:30 - 15:00 (Semua Anggota):** Kesimpulan keandalan RSA untuk integritas rantai pasok industri dan penutup.

---

*Dokumen ini berlokasi di root proyek berdampingan dengan `README.md` sebagai panduan referensi utama.*
