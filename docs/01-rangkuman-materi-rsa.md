# Kriptografi Kunci Publik: Algoritma RSA *(Rivest–Shamir–Adleman)*

## 1. Pengenalan Algoritma RSA

Algoritma RSA merupakan salah satu algoritma kriptografi kunci-publik (*asymmetric-key cryptography*) yang paling populer di dunia.

* **Penemu:** Diciptakan pada tahun 1976 oleh tiga peneliti asal MIT (*Massachusetts Institute of Technology*):

  * **R**on Rivest

  * **S**hamir (Adi Shamir)

  * **A**dleman (Leonard Adleman)

* **Dasar Keamanan:** Terletak pada tingkat kesulitan komputasi dalam memfaktorkan bilangan komposit yang sangat besar menjadi faktor-faktor primanya (*integer factorization problem*). Pemfaktoran ini diperlukan untuk mencari kunci privat dari kunci publik yang diketahui. Selama belum ada algoritma mangkus (*efisien*) untuk memfaktorkan bilangan besar, keamanan algoritma RSA tetap terjamin.

## 2. Landasan Matematika RSA

### 2.1 Pembagi Bersama Terbesar (PBB / GCD)

Misalkan $a$ dan $b$ adalah dua buah bilangan bulat tidak nol. Pembagi Bersama Terbesar ($\text{PBB}$ atau *Greatest Common Divisor* / $\gcd$) dari $a$ dan $b$ adalah bilangan bulat terbesar $d$ sedemikian rupa sehingga $d \mid a$ dan $d \mid b$, dituliskan:

$$
\gcd(a, b) = d
$$

* **Contoh:**

  * Faktor dari $45$: $1, 3, 5, 9, 15, 45$

  * Faktor dari $36$: $1, 2, 3, 4, 9, 12, 18, 36$

  * Faktor bersama: $1, 3, 9$

  * Maka, $\gcd(45, 36) = 9$.

### 2.2 Relatif Prima (*Coprime*)

Dua buah bilangan bulat $a$ dan $b$ dikatakan **relatif prima** jika:

$$
\gcd(a, b) = 1
$$

Jika $a$ dan $b$ relatif prima, maka berdasarkan Identitas Bézout terdapat bilangan bulat $m$ dan $n$ sedemikian sehingga:

$$
m \cdot a + n \cdot b = 1
$$

* **Contoh:**

  * $20$ dan $3$ relatif prima karena $\gcd(20, 3) = 1$, dapat dituliskan $2 \cdot 20 + (-13) \cdot 3 = 1$ ($m = 2, n = -13$).

  * $20$ dan $5$ tidak relatif prima karena $\gcd(20, 5) = 5 \neq 1$.

### 2.3 Fungsi Totient Euler ($\phi(n)$)

Fungsi Euler $\phi(n)$ mendefinisikan banyaknya bilangan bulat positif $< n$ yang relatif prima terhadap $n$.

* Jika $n = p \cdot q$ merupakan bilangan komposit dengan $p$ dan $q$ adalah bilangan prima, maka:

$$
\phi(n) = \phi(p) \cdot \phi(q) = (p - 1)(q - 1)
$$

* **Contoh:**
  Tentukan $\phi(21)$. Karena $21 = 7 \times 3$:

$$
\phi(21) = (7 - 1)(3 - 1) = 6 \times 2 = 12
$$

Terdapat 12 bilangan yang relatif prima terhadap 21: $\{1, 2, 4, 5, 8, 10, 11, 13, 16, 17, 19, 20\}$.

### 2.4 Teorema Euler

Misalkan $a$ dan $n$ adalah dua buah bilangan yang relatif prima ($\gcd(a, n) = 1$), maka berlaku:

$$
a^{\phi(n)} \equiv 1 \pmod{n}
$$

* **Contoh:** $a = 7$ dan $n = 10$, $\phi(10) = 4$:

$$
7^4 = 2401 \equiv 1 \pmod{10}
$$

## 3. Parameter dan Properti Algoritma RSA

| Variabel | Deskripsi | Sifat Kerahasiaan | 
| ----- | ----- | ----- | 
| $p, q$ | Bilangan prima acak berukuran besar | **Rahasia** | 
| $n$ | Modulus hasil kali: $n = p \times q$ | **Publik (Tidak Rahasia)** | 
| $\phi(n)$ | Totient Euler: $\phi(n) = (p - 1)(q - 1)$ | **Rahasia** | 
| $e$ | Kunci enkripsi (*public exponent*) | **Publik (Tidak Rahasia)** | 
| $d$ | Kunci dekripsi (*private exponent*) | **Rahasia** | 
| $m$ | Plainteks (pesan asli, $0 \le m < n$) | **Rahasia** | 
| $c$ | Cipherteks (pesan terenkripsi) | **Publik (Tidak Rahasia)** | 

## 4. Mekanisme Kerja Algoritma RSA

### 4.1 Pembangkitan Pasangan Kunci (*Key Generation*)

1. Pilih dua bilangan prima sembarang $p$ dan $q$ ($p \neq q$).

2. Hitung modulus:

$$
n = p \times q
$$

3. Hitung fungsi totient:

$$
\phi(n) = (p - 1)(q - 1)
$$

4. Pilih kunci publik $e$ sedemikian rupa sehingga:

$$
1 < e < \phi(n) \quad \text{dan} \quad \gcd(e, \phi(n)) = 1
$$

5. Hitung kunci privat $d$ menggunakan *modular multiplicative inverse*:

$$
e \cdot d \equiv 1 \pmod{\phi(n)} \iff d = \frac{1 + k \cdot \phi(n)}{e} \quad (\text{untuk } k \in \mathbb{Z})
$$

6. **Pasangan Kunci:**

   * **Kunci Publik:** $(e, n)$

   * **Kunci Privat:** $(d, n)$

### 4.2 Enkripsi

Pengirim mengambil kunci publik penerima $(e, n)$. Plainteks $m$ dibagi menjadi blok-blok $m_i$ sehingga nilai numerik tiap blok berada pada rentang $0 \le m_i < n$.

Rumus enkripsi:

$$
c_i = m_i^e \pmod{n}
$$

### 4.3 Dekripsi

Penerima menggunakan kunci privat miliknya $(d, n)$ untuk mengembalikan ciphertext $c_i$ menjadi plainteks semula $m_i$:

$$
m_i = c_i^d \pmod{n}
$$

## 5. Simulasi Perhitungan Lengkap

### 5.1 Pembentukan Kunci Alice

* $p = 47, \quad q = 71$

* $n = 47 \times 71 = 3337$

* $\phi(n) = (47 - 1)(71 - 1) = 46 \times 70 = 3220$

* Dipilih $e = 79$ (karena $\gcd(79, 3220) = 1$)

* Menghitung $d$:

$$
d = \frac{1 + k \cdot 3220}{79}
$$

Untuk $k = 25$, diperoleh nilai bulat $d = 1019$.

* **Kunci Publik Alice:** $(e = 79, n = 3337)$

* **Kunci Privat Alice:** $(d = 1019, n = 3337)$

### 5.2 Proses Enkripsi oleh Bob

Bob ingin mengirim pesan `HELLOALICE` kepada Alice.

* Konversi huruf ke representasi 2 digit ($A=00, B=01, \dots, Z=25$):

  * `H` $= 07$, `E` $= 04$, `L` $= 11$, `L` $= 11$, `O` $= 14$

  * `A` $= 00$, `L` $= 11$, `I` $= 08$, `C` $= 02$, `E` $= 04$

  * Plainteks gabungan: `07041111140011080204`

* Dipecah menjadi blok 4 digit ($m_i < 3337$):

  * $m_1 = 0704 = 704$

  * $m_2 = 1111$

  * $m_3 = 1400$

  * $m_4 = 1108$

  * $m_5 = 0204 = 204$

* Enkripsi setiap blok menggunakan $(e = 79, n = 3337)$:

  * $c_1 = 704^{79} \pmod{3337} = 328$ $\rightarrow$ `0328`

  * $c_2 = 1111^{79} \pmod{3337} = 301$ $\rightarrow$ `0301`

  * $c_3 = 1400^{79} \pmod{3337} = 2653$ $\rightarrow$ `2653`

  * $c_4 = 1108^{79} \pmod{3337} = 2986$ $\rightarrow$ `2986`

  * $c_5 = 204^{79} \pmod{3337} = 1164$ $\rightarrow$ `1164`

* **Ciphertext:** `03280301265329861164`

### 5.3 Proses Dekripsi oleh Alice

Alice mendekripsi cipherteks menggunakan kunci privat $(d = 1019, n = 3337)$:

* $m_1 = 328^{1019} \pmod{3337} = 704$ $\rightarrow$ `0704` (`HE`)

* $m_2 = 301^{1019} \pmod{3337} = 1111$ $\rightarrow$ `1111` (`LL`)

* $m_3 = 2653^{1019} \pmod{3337} = 1400$ $\rightarrow$ `1400` (`OA`)

* $m_4 = 2986^{1019} \pmod{3337} = 1108$ $\rightarrow$ `1108` (`LI`)

* $m_5 = 1164^{1019} \pmod{3337} = 204$ $\rightarrow$ `0204` (`CE`)

* Disusun kembali: `07041111140011080204` $\rightarrow$ `HELLOALICE`.

## 6. Tugas Proyek: Implementasi Algoritma RSA

### 6.1 Ketentuan Umum

* Dikerjakan secara berkelompok (maksimal **2 orang** per kelompok).

* Membuat aplikasi implementasi algoritma RSA dengan **1 Studi Kasus Riil** (misalnya: pengamanan pesan teks terenkripsi antar-pengguna, tanda tangan digital sederhana, atau pertukaran kunci rahasia).

* **Wajib Menggunakan Antarmuka Pengguna (*User Interface* / UI)**, baik berbasis Desktop GUI, Web, maupun Mobile.

### 6.2 Batasan & Syarat Khusus (Wajib Manual by Code)

* **DILARANG KERAS** menggunakan pustaka/library kriptografi bawaan atau pihak ketiga (seperti `pycryptodome`, `cryptography`, `crypto-js`, Java `javax.crypto`, dsb.).

* Seluruh operasi matematika dan alur RSA **wajib diimplementasikan secara mandiri dari awal (*from scratch*)**:

  1. **Pemeriksaan / Pembangkitan Bilangan Prima:** Algoritma uji keprimaan manual (misal: *Trial Division* atau *Miller-Rabin*).

  2. **GCD & Extended Euclidean Algorithm (EEA):** Fungsi rekursif/iteratif manual untuk menghitung $\gcd(e, \phi(n))$ dan menentukan nilai $d = e^{-1} \pmod{\phi(n)}$.

  3. **Eksponensiasi Modular (*Modular Exponentiation*):** Implementasi algoritma modular berpangkat besar secara mandiri (misal: *Binary Exponentiation* / *Square-and-Multiply*) guna menghindari masalah *integer overflow*.

  4. **Bloking & Encoding Teks:** Logika pemecahan blok pesan teks menjadi integer ($m_i < n$) dan penggabungan kembali hasil dekripsi.

### 6.3 Luaran yang Dikumpulkan

1. **Source Code / Program:** Dikemas dalam bentuk berkas `.zip`.

2. **Dokumentasi Laporan:** Format dokumen Word (`.docx`) yang disertakan di dalam `.zip` (memuat latar belakang studi kasus, alur algoritma, struktur fungsi manual yang dibuat, dan hasil pengujian).

3. **Dokumentasi Video:** Tautan YouTube (publikasi *Public* atau *Unlisted*) yang dicantumkan pada *spreadsheet* pengumpulan.

   * Format video: Demo aplikasi, penjelasan alur kode manual RSA, serta *running program*.

   * **Wajib:** Sebelum presentasi dimulai, setiap anggota kelompok wajib memperkenalkan diri dengan menyebutkan **Nama** dan **NRP**.

### 6.4 Anggota Kelompok
- **Rayka Dharma Pranandita** — 5027241039 (Math & Cryptographic Core)
- **Yuan Bany Albyan** — 5027241027 (Security Protocol & FastAPI Backend)
- **Evan Christian Nainggolan** — 5027241026 (Frontend Next.js & Integration Lead)

## 7. Referensi

1. Jean-Philippe Aumasson. (2017). *Serious Cryptography: A Practical Introduction to Modern Encryption*. San Francisco: No Starch Press, Inc.

2. Rinaldi Munir. (2019). *Buku Kriptografi* (Edisi Kedua). Bandung: Informatika.