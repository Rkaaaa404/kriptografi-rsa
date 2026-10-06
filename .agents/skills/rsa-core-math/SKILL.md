---
name: rsa-core-math
description: "Guidelines and invariants for implementing pure RSA cryptography from scratch in Python (0% external crypto libraries). Covers Miller-Rabin, Extended Euclidean Algorithm, Square-and-Multiply, custom polynomial hashing, text chunking, and math inspection hooks."
---

# RSA Core Math: Manual Cryptographic Engine Standards

Aturan dan standar implementasi modul matematika kriptografi RSA murni dari nol (*from scratch*) menggunakan Python 3.11+ untuk mata kuliah Kriptografi.

---

## 1. Aturan Mutlak: Zero External Crypto Library

> **PERINGATAN KERAS:**
> DILARANG mengimpor library kriptografi eksternal maupun modul hash bawaan untuk logika inti:
> - `pycryptodome`, `cryptography`, `crypto-js`, `rsa`
> - `hashlib`, `hmac`, `secrets` (hanya boleh modul `random` bawaan untuk seed bit mentah)
> Pelanggaran aturan ini berakibat nilai proyek menjadi **0**.

Semua operasi harus dibangun murni menggunakan tipe data integer bawaan Python (`int` mendukung *arbitrary-precision arithmetic* secara alami).

---

## 2. Pembangkitan & Pengujian Bilangan Prima (`backend/core/primes.py`)

### 2.1 Fast Pre-filter: Trial Division (`is_prime_trial`)
Gunakan untuk menyaring cepat komposit kecil ($n < 10^6$) atau faktor prima kecil:
- Filter prima kecil: $[2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47]$
- Loop kelipatan $6k \pm 1$ hingga $\lfloor\sqrt{n}\rfloor$.

### 2.2 Uji Keprimaan Utama: Miller-Rabin (`miller_rabin(n, k=20)`)
1. Jika $n \le 1$, return `False`. Jika $n \in \{2, 3\}$, return `True`. Jika $n$ genap, return `False`.
2. Tulis $n - 1 = 2^s \cdot d$ dengan $d$ ganjil (bagi terus $n-1$ dengan 2).
3. Lakukan pengujian sebanyak $k$ putaran (default $k=20$ memberikan probabilitas kesalahan komposit $< 4^{-20} \approx 10^{-12}$):
   - Pilih basis acak $a \in [2, n-2]$.
   - Hitung $x = a^d \pmod n$ menggunakan fungsi `mod_exp` manual.
   - Jika $x = 1$ atau $x = n - 1$, lewati ke putaran berikutnya.
   - Ulangi $s - 1$ kali:
     - $x = (x \cdot x) \pmod n$
     - Jika $x = n - 1$, lolos putaran.
   - Jika tidak pernah menghasilkan $n - 1$, maka $n$ adalah bilangan komposit (`False`).
4. Jika lolos seluruh $k$ putaran, $n$ adalah bilangan prima (`True`).

### 2.3 Pembangkitan Prima Acak (`generate_prime(bits)`)
- Generate bilangan bulat ganjil acak dengan panjang bit target: set MSB (Most Significant Bit) = 1 dan LSB = 1.
- Uji dengan `miller_rabin`. Loop hingga menemukan prima yang valid.

---

## 3. Aritmetika Modular & Kunci RSA (`backend/core/math_utils.py`)

### 3.1 Pembagi Bersama Terbesar: Euclidean (`gcd(a, b)`)
```python
def gcd(a: int, b: int) -> int:
    while b != 0:
        a, b = b, a % b
    return abs(a)
```

### 3.2 Extended Euclidean Algorithm (EEA) & Modular Invers
Menyelesaikan persamaan Diophantine $a \cdot x + b \cdot y = \gcd(a, b)$:
```python
def extended_euclidean(a: int, b: int) -> tuple[int, int, int]:
    if b == 0:
        return a, 1, 0
    g, x1, y1 = extended_euclidean(b, a % b)
    x = y1
    y = x1 - (a // b) * y1
    return g, x, y

def mod_inverse(e: int, phi: int) -> int:
    g, x, _ = extended_euclidean(e, phi)
    if g != 1:
        raise ValueError("Modular inverse does not exist: gcd(e, phi) != 1")
    return (x % phi + phi) % phi  # Pastikan selalu positif
```

### 3.3 Eksponensiasi Modular: Square-and-Multiply (`mod_exp`)
Menghitung $(base^{exp}) \pmod{mod}$ dengan kompleksitas $\mathcal{O}(\log exp)$ tanpa memori overflow:
```python
def mod_exp(base: int, exp: int, mod: int) -> int:
    if mod == 1:
        return 0
    result = 1
    base = base % mod
    while exp > 0:
        if exp % 2 == 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp //= 2
    return result
```

---

## 4. Custom Hashing Mandiri (`backend/core/hashing.py`)

Karena `hashlib` dilarang keras, gunakan **Polynomial Rolling Hash** dengan modulus bilangan prima Mersenne ($M_{31} = 2^{31} - 1 = 2147483647$) dan basis prima $p = 313$:

$$H(s) = \left( \sum_{i=0}^{L-1} \text{ord}(s[i]) \cdot p^i \right) \pmod m$$

- Menghasilkan nilai digest integer non-negatif deterministik.
- Memberikan avalanche effect yang cukup untuk mendeteksi perubahan 1 karakter pada muatan surat jalan.

---

## 5. Chunking & Encoding Teks (`backend/core/rsa_engine.py`)

Karakteristik RSA mengharuskan nilai pesan integer $m < n$:
1. **Adaptive Block Sizing**:
   - Hitung kapasitas byte per blok: $B = \max(1, \lfloor (\text{bit\_length}(n) - 1) / 8 \rfloor)$.
2. **Text to Blocks (`text_to_blocks`)**:
   - Konversi string teks ke bytes (UTF-8).
   - Pecah bytes menjadi potongan berukuran $B$ byte.
   - Konversi setiap potongan byte menjadi integer *big-endian*.
3. **Blocks to Text (`blocks_to_text`)**:
   - Konversi setiap integer hasil dekripsi menjadi byte array berukuran $B$ byte.
   - Gabungkan dan decode kembali menjadi UTF-8 string (abaikan padding null bytes).

---

## 6. Tracing Hook untuk Modul Inspector (`backend/core/inspector.py`)

Setiap fungsi di atas wajib mendukung parameter opsional `trace_hook: callable | None = None` untuk mencatat langkah-langkah komputasi ke tabel edukasi (tabel EEA, trace bit Square-and-Multiply, putaran Miller-Rabin).
