---
name: code-review-and-quality
description: "Multi-axis code review and quality gate for SIGAP (Smart Manufacturing Agentic Platform — SOKRATES × BINUS 2026). Covers five-axis review (correctness, readability, architecture, security, performance), Next.js 15 App Router, React 19, Tailwind CSS v4, Prisma 6 ORM, and industrial telemetries."
---

# Code Review & Quality Gate (SIGAP — Smart Manufacturing)

Panduan review kode multi-dimensi untuk platform **SIGAP (Sistem Inspeksi Garis Akhir Presisi)** — dirancang untuk memastikan keandalan real-time, akurasi perhitungan telemetri OEE & eskalasi, keamanan webhook edge AI, integritas basis data Prisma 6, dan standar enterprise manufaktur.

---

## 1. Standar Approval

> **Approve perubahan yang meningkatkan keandalan sistem inspeksi, akurasi telemetri, dan responsivitas kendali manusia secara nyata.** Prioritaskan kode yang deterministik, penanganan error yang kuat pada jaringan edge, dan kesederhanaan implementasi tanpa abstraksi berlebihan.

---

## 2. Five-Axis Review

Setiap perubahan dievaluasi pada 5 dimensi utama:

### Axis 1: Correctness & Telemetry Precision

- **Kalkulasi Deterministik**:
  - Apakah formula skor eskalasi ($E = \min(1.0, \dots)$) menangani pembagian dengan nol (*division by zero*) dan batas rentang nilai [0.0, 1.0] dengan aman?
  - Apakah metrik OEE (Availability $\times$ Performance $\times$ Quality) dihitung secara matematis akurat?
- **Computer Vision & Bounding Box**:
  - Apakah transformasi koordinat dari normalisasi inferensi ($0.0 - 1.0$) ke pixel canvas rendered ($x, y, w, h$) sinkron dengan rasio aspek layar?
  - Apakah kelas cacat (`warna_abnormal`, `luka_rebekan`, `sisik_sisa`, `lendir_berlebih`) dipetakan secara konsisten ke taksonomi sistem?
- **State Machine Siklus Lot**:
  - Apakah mutasi status batch (`pending` $\rightarrow$ `held` $\rightarrow$ `released` / `rejected`) valid dan tidak meninggalkan status menggantung (*inconsistent state*)?

### Axis 2: Readability & Simplicity (Ponytail & Karpathy Rules)

- **Surgical Changes**: Apakah perubahan hanya menyentuh baris yang relevan tanpa reformatting massal pada file di sekitarnya?
- **YAGNI & No Over-Engineering**: Hindari pembuatan wrapper atau lapisan abstraksi jika logika dapat diselesaikan dengan kode bawaan yang jelas.
- **Nama Variabel & Fungsi Intuitif**: Menggunakan nama deskriptif manufaktur (`escalationScore`, `quarantineBatch`, `dispatchSapTicket`, `lotId`).

### Axis 3: Architecture & Next.js 15 / Prisma Standards

- **Server vs Client Boundary**:
  - Komponen dengan state interaktif, canvas overlay, atau SSE listener wajib menyertakan `"use client";`.
  - Data fetching statis atau initial load dashboard dioptimalkan sebagai React Server Components (RSC).
- **Prisma 6 ORM**:
  - Selalu gunakan Prisma client singleton (`lib/prisma.ts`) untuk mencegah kebocoran *connection pool*.
  - Pastikan relasi relational query menggunakan `include` atau `select` secara selektif untuk mencegah over-fetching.
- **Real-Time SSE Streaming**:
  - Pastikan route `/api/events` menggunakan internal EventEmitter dengan penanganan cleanup listener saat klien disconnect.

### Axis 4: Security & Enterprise Safeguards

- **Webhook Autentikasi Internal**:
  - Route `/api/internal/inspection-result` wajib memvalidasi header `x-api-key`.
  - Route `/api/internal/agent-decision` wajib memvalidasi token `Authorization: Bearer <AGENT_SECRET_KEY>`.
- **Human-in-the-Loop Authorization**:
  - Aksi pelepasan lot karantina atau dispatch manual (`/api/batches/[id]/approve`, `/api/dispatch/[id]/approve`) harus memvalidasi integritas state lot sebelum eksekusi mutasi.
- **Rahasia Lingkungan**:
  - Database string Neon PostgreSQL, secret key AWS Bedrock, dan API key tidak boleh terpapar ke bundle client (`NEXT_PUBLIC_`).

### Axis 5: Performance & Edge Resilience

- **Zero-Latency UI & Streaming**:
  - Listener `EventSource` di sisi React wajib di-*close* saat unmount (`useEffect cleanup`) agar tidak terjadi kebocoran memori browser.
  - Hindari re-render reaktif pada loop animasi canvas; gunakan `requestAnimationFrame` untuk rendering frame deteksi video.
- **Database Indexing**:
  - Pastikan kolom pencarian cepat (`batchId`, `status`, `storageZone`, `defectClass`) memiliki indeks di `prisma/schema.prisma`.

---

## 3. Quality Gate Checklist Sebelum Commit

- [ ] Lulus verifikasi TypeScript `npm run build` tanpa error tipe data.
- [ ] Tidak ada warning linting kritis atau variabel impor mati (*dead imports*).
- [ ] Mutasi database Prisma teruji dan aman secara transaksional.
- [ ] Penanganan fallback UI tersedia saat feed kamera atau koneksi SSE terputus.
