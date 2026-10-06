# SecurePass RSA: Sistem Otorisasi & Verifikasi Surat Jalan Pabrik

> **Tugas Besar Kriptografi (Semester 5)** — Implementasi Algoritma Kunci-Publik RSA Murni (*0% External Cryptographic Library*)  
> **Batas Pengumpulan**: Senin, 21 Oktober 2024 pukul 10.00 WIB

---

## 📌 Ringkasan Proyek

**SecurePass RSA** adalah sistem verifikasi integritas dan otorisasi *clearance* surat jalan (*Gate Pass / Delivery Order*) untuk barang keluar-masuk pabrik manufaktur. Sistem ini memecahkan masalah pemalsuan dokumen dan penggelapan muatan di perjalanan melalui arsitektur kriptografi multi-entitas:
1. **Otentikasi & Anti-Penyangkalan (*Primary Digital Signature*):** PPIC/Manajer Logistik menandatangani intisari manifest muatan menggunakan Kunci Privat miliknya.
2. **Pemeriksaan Lapangan (*Air-Gapped Gate Verification*):** Satpam pos gerbang memverifikasi keaslian dokumen secara offline menggunakan Kunci Publik PPIC.
3. **Persetujuan Bertingkat (*Gate Clearance Counter-Signature*):** Satpam membubuhkan tanda tangan digital kedua saat truk diizinkan keluar pabrik.
4. **Kerahasiaan Muatan (*Confidential Memo Encryption*):** Informasi rahasia (formula bahan kimia, harga beli) dienkripsi secara asimetris khusus untuk Kunci Privat Kepala Gudang Penerima.
5. **Inspeksi Edukasi (*Crypto Debugger "Under the Hood"*):** Visualisasi langkah-demi-langkah pengujian prima Miller-Rabin, tabel Extended Euclidean Algorithm (EEA), dan eksponensiasi modular *Square-and-Multiply*.
6. **Ketahanan Siber (*Attack Lab Suite*):** Simulator interaktif 4 skenario eksploitasi (*Payload Tampering*, *Rogue Signer*, *Corrupted Signature*, dan *Replay Attack*).

---

## 🛠️ Tech Stack & Arsitektur Sistem

Aplikasi dibangun menggunakan pola arsitektur **Client-Server Terpisah (*Decoupled Architecture*)**:

* **Backend Engine (`backend/`):**
  * **Runtime:** Python 3.11+
  * **Framework:** **FastAPI** + `uvicorn` & `pydantic`
  * **Aturan Mutlak:** **0% Library Kriptografi Eksternal** (`pycryptodome`, `cryptography`, `crypto-js`, `rsa`, `hashlib` **DILARANG KERAS**). Seluruh matematika modular dan digest hash dibangun murni dari nol.
* **Frontend Web (`frontend/`):**
  * **Framework:** **Next.js 15+ (App Router)** + **TypeScript**
  * **Data Fetching & State:** **TanStack Query** (`@tanstack/react-query`) untuk Client-Side Fetching (CSF), caching, dan mutasi data reaktif.
  * **Styling & UI:** **Tailwind CSS** + **shadcn/ui** (Dark Industrial Theme).

---

## 📂 Struktur Direktori Proyek

```text
rsa/
├── docs/                                  # Pusat Dokumentasi Resmi Proyek
│   ├── 01-rangkuman-materi-rsa.md         # Silabus, landasan teori, & syarat tugas kuliah
│   ├── 02-prd-securepass-rsa.md           # Product Requirement Document (PRD)
│   ├── 03-technical-design.md             # Technical System Design & REST API contracts
│   └── 04-task-roadmap.md                 # Rencana kerja & task breakdown per role (3 orang)
├── backend/                               # Layanan Backend FastAPI & Core Crypto
│   ├── core/                              # 100% Algoritma Matematika RSA Murni
│   │   ├── math_utils.py                  # gcd, extended_euclidean, mod_inverse, mod_exp
│   │   ├── primes.py                      # trial division, miller_rabin, prime generator
│   │   ├── inspector.py                   # tracer step-by-step komputasi untuk UI
│   │   ├── hashing.py                     # polynomial rolling hash manual
│   │   └── rsa_engine.py                  # keygen, text chunking, sign, verify, encrypt/decrypt
│   ├── models/
│   │   └── schemas.py                     # Pydantic request & response validation schemas
│   ├── routers/
│   │   ├── keygen_router.py               # Endpoint /api/v1/keys/*
│   │   ├── inspect_router.py              # Endpoint /api/v1/inspect/*
│   │   ├── pass_router.py                 # Endpoint /api/v1/pass/*
│   │   └── attack_router.py               # Endpoint /api/v1/attack/*
│   ├── tests/
│   │   ├── test_math.py                   # Verifikasi matematis manual (p=47, q=71, e=79)
│   │   └── test_protocol.py               # Verifikasi alur signing & clearance
│   ├── main.py                            # Entrypoint FastAPI & konfigurasi CORS
│   └── requirements.txt                   # fastapi, uvicorn, pydantic (NO CRYPTO LIB)
├── frontend/                              # Antarmuka Pengguna Next.js + TanStack Query
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                 # Root layout & QueryClientProvider
│   │   │   ├── page.tsx                   # Overview dashboard & stats
│   │   │   ├── keygen/page.tsx            # Halaman manajemen kunci 3 entitas
│   │   │   ├── inspector/page.tsx         # Halaman visualisasi kalkulasi matematika
│   │   │   ├── issue/page.tsx             # Halaman penerbitan surat jalan PPIC
│   │   │   ├── gate/page.tsx              # Halaman pos satpam & counter-sign
│   │   │   ├── receiving/page.tsx         # Halaman pos penerima & decrypt memo
│   │   │   └── attack-lab/page.tsx        # Halaman simulasi 4 serangan siber
│   │   ├── components/                    # Reusable UI cards, tables, QR viewer
│   │   ├── lib/api.ts                     # Centralized API fetcher client
│   │   └── types/api.ts                   # TypeScript interfaces matching schemas
│   ├── package.json
│   └── tsconfig.json
├── data/samples/                          # Data uji coba siap-pakai (JSON manifest & keys)
├── .agents/                               # Pedoman agen AI & aturan rekayasa perangkat lunak
│   ├── rules/
│   │   └── engineering-discipline.md      # Disiplin kode Karpathy, Ponytail, & zero-crypto lib
│   └── skills/                            # Keahlian terstandarisasi untuk proyek ini
│       ├── rsa-core-math/                 # Panduan implementasi matematika RSA manual
│       ├── fastapi-backend-protocol/      # Panduan arsitektur REST API & protokol keamanan
│       ├── nextjs-tanstack-frontend/      # Panduan Next.js, TanStack Query, & Tailwind
│       └── academic-presentation-and-report/# Panduan video YouTube & format laporan Word
└── README.md
```

---

## 👥 Pembagian Tugas & Tanggung Jawab Tim (3 Orang)

Setiap anggota memiliki porsi yang seimbang dan kepemilikan file yang jelas:

| Peran | Anggota & Fokus | File Kepemilikan | Bagian Video Demo YouTube |
| :--- | :--- | :--- | :--- |
| **ROLE 1** | **Math & Cryptographic Core Specialist**<br>• Algoritma prima, $\gcd$, EEA, Square-and-Multiply.<br>• Engine pencatat jejak matematika (`inspector.py`).<br>• Perhitungan manual angka modul kuliah ($p=47, q=71, e=79$). | `backend/core/primes.py`<br>`backend/core/math_utils.py`<br>`backend/core/inspector.py`<br>`backend/tests/test_math.py` | Menjelaskan teori matematika RSA, bukti invers modular, penanganan overflow, serta demo tab *Crypto Inspector*. |
| **ROLE 2** | **Security Protocol & FastAPI Specialist**<br>• Polynomial hash & chunking string $\leftrightarrow$ integer.<br>• Alur tanda tangan primer, counter-sign, & enkripsi asimetris memo.<br>• Registry anti-replay & Router REST API FastAPI. | `backend/core/hashing.py`<br>`backend/core/rsa_engine.py`<br>`backend/models/schemas.py`<br>`backend/routers/*.py`<br>`backend/main.py` | Menjelaskan protokol multi-entitas, mekanisme blocking/chunking, digital signature, anti-replay, dan struktur REST API. |
| **ROLE 3** | **Frontend Next.js & Video/Report Lead**<br>• Desain UI Web Next.js (App Router, TypeScript).<br>• Integrasi CSF TanStack Query (`useMutation` & `useQuery`).<br>• 6 Halaman web & Interactive Attack Lab Suite.<br>• Sutradara video demo YouTube & kompilasi laporan Word. | `frontend/src/app/*`<br>`frontend/src/components/*`<br>`frontend/src/lib/api.ts`<br>`frontend/src/types/api.ts`<br>`data/samples/*` | Memimpin demo *running application*, alur normal (*Valid*), dan memperlihatkan kegagalan 4 serangan siber di Attack Lab. |

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menjalankan Backend (FastAPI)
```bash
# Masuk ke direktori backend
cd backend

# Buat dan aktifkan virtual environment (opsional)
python -m venv .venv
source .venv/bin/activate  # Di Windows: .venv\Scripts\activate

# Install dependency (FastAPI, Uvicorn, Pydantic - 0% crypto lib)
pip install -r requirements.txt

# Jalankan server API
uvicorn main:app --reload --port 8000
```
API Documentation interaktif dapat diakses di: **`http://localhost:8000/docs`**.

### 2. Menjalankan Frontend (Next.js)
```bash
# Masuk ke direktori frontend
cd frontend

# Install package Node.js
npm install

# Jalankan server frontend Next.js
npm run dev
```
Aplikasi web dapat dibuka di browser: **`http://localhost:3000`**.

---

## 📚 Indeks Dokumentasi Proyek (`docs/`)

1. [**`docs/01-rangkuman-materi-rsa.md`**](./docs/01-rangkuman-materi-rsa.md): Silabus materi kuliah, landasan matematika formal RSA, dan rincian ketentuan penugasan proyek.
2. [**`docs/02-prd-securepass-rsa.md`**](./docs/02-prd-securepass-rsa.md): Dokumen kebutuhan produk (*Product Requirement Document*), arsitektur multi-entitas, skema data, dan 4 skenario simulasi serangan.
3. [**`docs/03-technical-design.md`**](./docs/03-technical-design.md): Spesifikasi teknis rancangan perangkat lunak, formula matematika murni, kontrak REST API endpoint, dan desain antarmuka.
4. [**`docs/04-task-roadmap.md`**](./docs/04-task-roadmap.md): Rencana kerja berjenjang (Phase 0 s/d Phase 4), matriks task per role (3 orang) dengan acceptance criteria terukur, dan skenario script rekaman YouTube.

---

## 🎯 Luaran Akhir yang Dikumpulkan (Senin, 21 Oktober 2024 pukul 10.00 WIB)
- [ ] **1. Source Code (.zip):** Seluruh kode program monorepo bersih (tanpa folder `.venv/` atau `node_modules/`).
- [ ] **2. Dokumen Laporan (.docx):** Format laporan Word memuat latar belakang, dasar teori, hitungan manual $p=47, q=71, e=79$, screenshot pengujian TC-01 s/d TC-06, dan pembagian kerja tim.
- [ ] **3. Tautan Video YouTube:** Video presentasi maksimal 15 menit dengan perkenalan wajib Nama & NRP setiap anggota tim di awal sesi.
