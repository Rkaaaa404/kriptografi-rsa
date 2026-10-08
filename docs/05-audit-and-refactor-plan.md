# Audit & Rencana Perbaikan — SecurePass RSA

Dokumen ini berisi hasil audit menyeluruh kode kriptografi RSA, temuan kerentanan/bug yang telah direproduksi secara empiris, keputusan arsitektur, serta panduan instruksi implementasi langkah-demi-langkah bagi agent/developer pelaksana.

---

## 1. Ringkasan Eksekutif & Status Pemenuhan Tugas

### 1.1 Verifikasi Mandat Akademik
- **0% External Cryptographic Library:** **TERPENUHI (100% PURE PYTHON).** Modul matematika inti di `backend/core/` (`math_utils.py`, `primes.py`, `rsa_engine.py`, `hashing.py`) tidak menggunakan `pycryptodome`, `cryptography`, `hashlib`, maupun `pow(base, exp, mod)`. Semua komputasi berjalan di atas `int` Python arbitrary-precision.
- **Kebenaran Matematika Inti RSA:** **VALID.** Algoritma GCD Euclidean, Extended Euclidean Algorithm (EEA), Modular Invers, Square-and-Multiply, Miller-Rabin, pembuatan kunci, serta block chunking teks telah lulus seluruh 51 unit test. Contoh hitungan manual akademik ($p=47, q=71, e=79 \implies n=3337, \phi=3220, d=1019$) menghasilkan nilai presisi.
- **Transparansi Tahapan RSA:** Fitur edukasi step-by-step sudah tersedia di Crypto Inspector (tabel Miller-Rabin, tabel EEA, trace bit Square-and-Multiply). Sesuai arahan user, akan ditambahkan **Halaman/Tab Demo Enkripsi & Dekripsi Teks Mandiri** agar seluruh tahapan (Teks $\to$ Byte $\to$ Blok integer $m \to c = m^e \pmod n \to m = c^d \pmod n \to$ Teks) dapat diuji langsung di luar siklus surat jalan.

---

## 2. Temuan Audit yang Telah Direproduksi (Empirical Findings)

Seluruh temuan berikut telah direproduksi menggunakan script audit otomatis:

```text
[F1] Replay Bypass: Modifikasi string nonce pada token tidak merusak signature primer. Token dapat di-replay tanpa batas.
[F2] Flawed Gate Clearance: Endpoint /gate-clearance tidak memvalidasi signature A dan tidak menolak nonce yang sudah pernah disetujui.
[F3] Unbound Secret Memo: Nilai encrypted_secret tidak masuk dalam intisari hash signature primer, sehingga memo dapat disubstitusi penyerang.
[F4] Signature Malleability: verify() meloloskan signature s >= n (misal s + n) karena mod_exp mereduksi input secara siklis.
[F6] Exponent Out-of-Bounds: Auto-e memilih 65537 meskipun phi < 65537 pada kunci bit kecil.
[F7] JavaScript Precision Loss: Endpoint keygen mengizinkan bit > 53 (misal 64-bit), menghasilkan modulus n > 2^53 - 1 yang terdistorsi di frontend (Number.MAX_SAFE_INTEGER).
[F8] Unhandled ValueError: Parameter e_manual yang tidak coprime melempar uncaught ValueError -> HTTP 500.
```

---

## 3. Matriks Temuan & Solusi Spesifik

### 3.1 Celah Protokol & Keamanan (Kritis)

| ID | Lokasi File & Baris | Deskripsi Masalah | Solusi Rinci |
|---|---|---|---|
| **F1 & F3** | `backend/routers/pass_router.py:47-57` | `primary_sig` hanya menandatangani `manifest.to_canonical_str()`. Field `nonce` dan `encrypted_secret` tidak masuk perhitungan hash. Akibatnya, penyerang dapat mengganti nonce untuk menghindari deteksi replay, atau menukar ciphertext memo dengan data palsu. | Hitung digest primer dari payload kanonik terpadu: `{"header": manifest.model_dump(), "nonce": nonce_val, "encrypted_secret": encrypted_secret}` menggunakan `canonical_json_digest()`. |
| **F2** | `backend/routers/pass_router.py:147-191` | Endpoint `/gate-clearance` langsung menandatangani token tanpa memverifikasi tanda tangan primer A dan tanpa mengecek apakah token sudah pernah disetujui (`nonce_registry.is_replayed`). | 1. Tambahkan `pub_key_a: list[int]` ke schema `ClearanceRequest`.<br>2. Verifikasi keabsahan signature A sebelum clearance.<br>3. Tolak dengan status HTTP 409 jika nonce sudah pernah di-clear. |
| **F4** | `backend/core/rsa_engine.py:221-237` | Fungsi `verify(digest, signature, pub_key)` tidak memvalidasi range `signature`. Nilai `signature >= n` tetap lolos karena `mod_exp` melakukan `signature % n`. | Tambahkan guard clause: `if not (0 <= signature < n): return False`. |

### 3.2 Integritas Matematika & Presisi UI (Mayor)

| ID | Lokasi File | Deskripsi Masalah | Solusi Rinci |
|---|---|---|---|
| **F6** | `backend/core/rsa_engine.py:96-104` | Logika `generate_keypair` memilih $e = 65537$ secara default tanpa memastikan $e < \phi$. Jika $\phi \le 65537$, nilai $e$ melanggar aturan $1 < e < \phi$. | Gunakan 65537 hanya jika $65537 < \phi$ dan $\gcd(65537, \phi) == 1$. Jika tidak, cari $e$ ganjil terkecil mulai dari 3 yang memenuhi syarat coprime. |
| **F7** | `backend/models/schemas.py`, `backend/routers/keygen_router.py:18` | Field `bits` diizinkan hingga 256. Di frontend, opsi 64-bit menghasilkan $n > 2^{53}-1$, menyebabkan pembulatan IEEE-754 pada JavaScript (`Number.MAX_SAFE_INTEGER`). Selain itu, formula `bits // 2` membuat opsi 16-bit dan 32-bit menghasilkan panjang bit yang sama. | 1. Batasi schema: `bits: int = Field(default=32, ge=16, le=52)`.<br>2. Di router: `prime_bits = max(8, bits // 2)`.<br>3. Di UI `frontend/app/keygen/page.tsx`, ganti opsi 64-bit menjadi 48-bit (aman untuk JS). |
| **F8** | `backend/routers/keygen_router.py:14-36` | `generate_keypair()` melempar `ValueError` saat `e_manual` tidak coprime atau prima manual tidak valid, menyebabkan crash HTTP 500. | Bungkus pemanggilan dengan `try-except ValueError as exc` dan kembalikan `HTTPException(status_code=400, detail=str(exc))`. |
| **F9** | `backend/core/rsa_engine.py:68-76` | `generate_keypair` tidak melempar error jika hanya salah satu dari `p_manual` / `q_manual` yang diisi (diam-diam jatuh ke mode acak). | Validasi eksplisit: jika salah satu disediakan, keduanya wajib disediakan. Jika `e_manual` disediakan, validasi $1 < e < \phi$. |

### 3.3 Robustness & Error Handling (Minor)

- **`mod_exp` Input Guard (`backend/core/math_utils.py:168`):** Tolak `exp < 0` dan `mod <= 0` dengan `ValueError` (mencegah `ZeroDivisionError` yang menghasilkan 500 pada router inspect). Batasi putaran Miller-Rabin $1 \le k \le 64$.
- **`generate_prime` Range Guard (`backend/core/primes.py:183, 210`):** Tolak `bits < 2` untuk menghindari infinite loop.
- **Pesan Umpan Balik Attack Lab (`backend/routers/attack_router.py` & `frontend/app/attack-lab/page.tsx`):** Pastikan status dan toast UI mencerminkan hasil verifikasi matematis secara jujur (bukan hardcoded "berhasil dideteksi").

---

## 4. Rencana Refactoring & Eliminasi Duplikasi Kode

### 4.1 Buat Modul Protokol Terpusat (`backend/routers/protocol.py`)
Ekstrak fungsi yang saat ini terduplikasi di `pass_router.py` dan `attack_router.py`:
1. `encode_token_package(package: GatePassPackage) -> str`: Serialisasi kanonik + Base64.
2. `decode_token_package(token_b64: str) -> GatePassPackage`: Deserialisasi Base64 + JSON + validasi Pydantic.
3. `compute_primary_digest(header: ManifestHeader, nonce: str, encrypted_secret: list[int]) -> int`: Hashing kanonik deterministik untuk seluruh komponen surat jalan (menutup celah F1 & F3).
4. `compute_clearance_digest(header: ManifestHeader, clearance: GateClearance, primary_sig: int) -> int`: Hashing kanonik untuk counter-signature satpam.

### 4.2 Simplifikasi Validasi Kunci (`backend/routers/keygen_router.py`)
Hapus logika manual ~60 baris di endpoint `/validate` yang menduplikasi aturan `generate_keypair`. Cukup delegasikan ke `generate_keypair(p_manual=req.p, q_manual=req.q, e_manual=req.e)` dengan pemetaan pesan error yang ramah pengguna.

---

## 5. Fitur Baru: Demo Enkripsi & Dekripsi Teks Mandiri

Untuk memenuhi secara tuntas butir evaluasi: *"bisa menunjukkan fungsi setiap tahapan RSA, mulai dari pembangkitan kunci, enkripsi hingga dekripsi"*:

1. **Backend Endpoint (`/api/v1/inspect/encrypt-decrypt`):**
   - Menerima: `text: str`, `pub_key: list[int]`, `priv_key: list[int]` (opsional untuk langsung dekripsi).
   - Menghasilkan trace per tahap:
     - Tahap 1: Teks asli UTF-8 dan representasi byte mentah.
     - Tahap 2: Ukuran blok adaptif $B = \max(1, \lfloor (\text{bit\_length}(n)-1)/8 \rfloor)$.
     - Tahap 3: Daftar blok integer plaintext $m_i < n$.
     - Tahap 4: Eksponensiasi modular enkripsi $c_i = m_i^e \pmod n$.
     - Tahap 5: Eksponensiasi modular dekripsi $m'_i = c_i^d \pmod n$.
     - Tahap 6: Rekonstruksi byte dan string teks hasil dekripsi.
2. **Frontend UI (Tab Baru pada `/inspector` atau Halaman Terdedikasi):**
   - Input teks bebas dan pemilih pasangan kunci (A, B, C, atau Academic Preset).
   - Kartu visualisasi interaktif yang menampilkan setiap blok perubahan secara transparan.

---

## 6. Daftar Perubahan File (File Checklist)

```text
[NEW]    backend/routers/protocol.py
[MODIFY] backend/core/math_utils.py
[MODIFY] backend/core/primes.py
[MODIFY] backend/core/rsa_engine.py
[MODIFY] backend/models/schemas.py
[MODIFY] backend/routers/keygen_router.py
[MODIFY] backend/routers/pass_router.py
[MODIFY] backend/routers/attack_router.py
[MODIFY] backend/routers/inspect_router.py
[MODIFY] backend/tests/test_math.py
[MODIFY] backend/tests/test_api_e2e.py
[MODIFY] frontend/types/api.ts
[MODIFY] frontend/lib/api.ts
[MODIFY] frontend/components/UnifiedManifestPipeline.tsx
[MODIFY] frontend/app/keygen/page.tsx
[MODIFY] frontend/app/attack-lab/page.tsx
[MODIFY] frontend/app/inspector/page.tsx
```

---

## 7. Prosedur Verifikasi Sukses (Acceptance Criteria)

Pelaksana wajib menjalankan pengujian berikut untuk memastikan zero-regression:

1. **Unit Test & E2E Test Backend:**
   ```powershell
   python -m pytest backend/tests -v
   ```
   *Kriteria:* Semua test lama (51 test) tetap lolos, ditambah test regresi baru untuk F1–F8 (total $\ge 60$ test lolos, 0 fail).

2. **Reproduction Script Verification:**
   Jalankan script verifikasi untuk memastikan seluruh celah tertutup:
   - F1: Pengubahan nonce pada token menghasilkan `is_signature_valid: False` / `HASH_MISMATCH`.
   - F2: Replay clearance atau clearance manifest palsu ditolak dengan HTTP 400 / 409.
   - F3: Substitusi `encrypted_secret` ditolak saat verifikasi gerbang & gudang.
   - F4: Signature `s + n` otomatis menghasilkan `is_signature_valid: False`.
   - F6: Pada kunci kecil, $e < \phi$ selalu terpenuhi.
   - F7: Kunci yang dihasilkan selalu memenuhi $n \le 2^{53} - 1$.
   - F8: Input `e_manual` tidak valid mengembalikan HTTP 400 terstruktur.

3. **Frontend TypeScript & Build Gate:**
   ```powershell
   cd frontend
   npx tsc --noEmit
   npm run build
   ```
   *Kriteria:* 0 error kompilasi TypeScript, build Next.js sukses.
