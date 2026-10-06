---
name: fastapi-backend-protocol
description: "Guidelines and architecture for SecurePass RSA backend API using Python FastAPI. Covers REST API router design, Pydantic request/response schemas, multi-party security pipeline, anti-replay nonce registry, air-gapped token packaging, and CORS configuration."
---

# FastAPI Backend & Security Protocol: SecurePass RSA

Panduan arsitektur backend REST API menggunakan **FastAPI**, validasi model **Pydantic**, dan implementasi protokol otorisasi bertingkat untuk **SecurePass RSA**.

---

## 1. Arsitektur Direktori Backend

```text
backend/
├── core/                  # Pure math engine from scratch (0% crypto lib)
│   ├── math_utils.py
│   ├── primes.py
│   ├── inspector.py
│   ├── hashing.py
│   └── rsa_engine.py
├── models/
│   └── schemas.py         # Pydantic request & response models
├── routers/
│   ├── keygen_router.py   # /api/v1/keys/*
│   ├── inspect_router.py  # /api/v1/inspect/*
│   ├── pass_router.py     # /api/v1/pass/*
│   └── attack_router.py   # /api/v1/attack/*
├── main.py                # FastAPI app initialization, middleware, routing
└── requirements.txt       # fastapi, uvicorn, pydantic (NO CRYPTO LIB)
```

---

## 2. Inisialisasi Aplikasi & Konfigurasi CORS (`backend/main.py`)

Aplikasi wajib mengaktifkan `CORSMiddleware` agar dapat diakses oleh frontend Next.js (`http://localhost:3000`):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routers import keygen_router, inspect_router, pass_router, attack_router

app = FastAPI(
    title="SecurePass RSA Backend API",
    version="1.0.0",
    description="Sistem Otorisasi Surat Jalan Pabrik Berbasis RSA Murni"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(keygen_router.router, prefix="/api/v1/keys", tags=["Key Management"])
app.include_router(inspect_router.router, prefix="/api/v1/inspect", tags=["Crypto Inspector"])
app.include_router(pass_router.router, prefix="/api/v1/pass", tags=["Gate Pass Protocol"])
app.include_router(attack_router.router, prefix="/api/v1/attack", tags=["Attack Simulator"])
```

---

## 3. Protokol Kriptografi Multi-Entitas (3 Parties)

1. **Entitas A — PPIC / Manajer Logistik**:
   - Memiliki pasangan kunci $(e_A, n_A)$ dan $(d_A, n_A)$.
   - Menandatangani digest manifest: $S_A = \text{mod\_exp}(H(D_{\text{manifest}}), d_A, n_A)$.
   - Mengenkripsi catatan khusus untuk Gudang C: $C_i = \text{mod\_exp}(M_i, e_C, n_C)$.
2. **Entitas B — Satpam Pos Gerbang**:
   - Memiliki pasangan kunci $(e_B, n_B)$ dan $(d_B, n_B)$.
   - Memverifikasi $S_A$ menggunakan Kunci Publik PPIC $(e_A, n_A)$.
   - Setelah inspeksi fisik sesuai, membubuhkan counter-signature clearance:
     $S_B = \text{mod\_exp}(H(D_{\text{manifest}} + D_{\text{clearance}} + S_A), d_B, n_B)$.
3. **Entitas C — Gudang Penerima Cabang**:
   - Memverifikasi tanda tangan ganda ($S_A$ dan $S_B$).
   - Mendekripsi catatan rahasia menggunakan Kunci Privat miliknya: $M_i = \text{mod\_exp}(C_i, d_C, n_C)$.

---

## 4. Mekanisme Anti-Replay (Nonce & Timestamp Registry)

Untuk mencegah supir/penyerang menggunakan tiket surat jalan bekas:
- Setiap token memuat atribut `nonce` (UUID unik) dan `valid_until` (ISO-8601 timestamp).
- Backend mengelola `NonceRegistry`:
  ```python
  class NonceRegistry:
      def __init__(self):
          self.used_nonces: dict[str, dict] = {}

      def is_replayed(self, nonce: str) -> bool:
          return nonce in self.used_nonces

      def register(self, nonce: str, pass_id: str, stage: str):
          self.used_nonces[nonce] = {"pass_id": pass_id, "stage": stage}
  ```
- Evaluasi waktu: jika waktu sekarang $> \text{valid\_until}$, tolak dengan status `EXPIRED_PASS`.
- Evaluasi duplikasi: jika `nonce` sudah pernah tercatat pada status clearance, tolak dengan `REPLAY_ATTACK_DETECTED`.

---

## 5. Serialisasi Token Air-Gapped (Base64 JSON)

- Data paket di-serialize ke string JSON kanonikal dengan kunci terurut (*sorted keys* tanpa spasi).
- Encode ke Base64 UTF-8 untuk mempermudah transfer lewat QR Code atau string input.
- Fungsi decode memverifikasi integritas JSON sebelum didekompresi ke model internal.
