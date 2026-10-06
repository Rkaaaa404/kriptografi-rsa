---
name: nextjs-tanstack-frontend
description: "Guidelines and best practices for building the SecurePass RSA frontend with Next.js (App Router), TypeScript, TanStack Query (@tanstack/react-query for Client-Side Fetching / CSF), Tailwind CSS, and shadcn/ui. Covers page layouts, mutation/query patterns, state caching, and dark industrial theme."
---

# Next.js & TanStack Query Frontend: SecurePass RSA

Panduan pengembangan antarmuka web modern untuk **SecurePass RSA** menggunakan **Next.js (App Router)**, **TypeScript**, **TanStack Query** (`@tanstack/react-query`), dan **Tailwind CSS**.

---

## 1. Arsitektur Frontend & Pola Client-Side Fetching (CSF)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # QueryClientProvider, Navbar, Toaster
│   │   ├── page.tsx           # Dashboard landing & project stats
│   │   ├── keygen/page.tsx    # Keypair management (A, B, C)
│   │   ├── inspector/page.tsx # Visualisasi step-by-step crypto debugger
│   │   ├── issue/page.tsx     # PPIC manifest issuing, signing & encrypting
│   │   ├── gate/page.tsx      # Pos satpam checkpoint & counter-signing
│   │   ├── receiving/page.tsx # Gudang penerima dual-verify & decrypt memo
│   │   └── attack-lab/page.tsx# 4 cyber attack scenarios simulator
│   ├── components/            # Reusable UI cards, tables, badges, QR viewer
│   ├── hooks/                 # Custom TanStack Query hooks
│   ├── lib/
│   │   └── api.ts             # Centralized fetcher client ke FastAPI
│   └── types/
│       └── api.ts             # TypeScript interfaces selaras Pydantic
├── package.json
└── tsconfig.json
```

---

## 2. Konfigurasi TanStack Query (`src/app/layout.tsx`)

Bungkus aplikasi dengan `QueryClientProvider` di sisi client:

```tsx
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "sonner"
import "@/app/globals.css"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 menit cache
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  )
}
```

---

## 3. Pola Client-Side Fetching (CSF) dengan `useMutation` & `useQuery`

Dalam aplikasi ini, sebagian besar operasi kriptografi dipicu oleh aksi tombol pengguna (Generate Key, Sign, Verify, Attack Simulation). Gunakan `useMutation`:

```tsx
// Contoh di src/app/gate/page.tsx
const verifyMutation = useMutation({
  mutationFn: (tokenBase64: string) => api.verifyGatePass({ token_base64: tokenBase64, pub_key_a: activeKeyA }),
  onSuccess: (data) => {
    if (data.valid) {
      toast.success("Dokumen Sah & Tanda Tangan PPIC Otentik!")
    } else {
      toast.error(`Verifikasi Gagal: ${data.message}`)
    }
  },
  onError: (err: Error) => {
    toast.error(`Terjadi Kesalahan: ${err.message}`)
  }
})
```

Untuk data read-only seperti data trace debugger (`inspector`):
```tsx
const { data, isLoading, refetch } = useQuery({
  queryKey: ["inspector-trace", algorithm, params],
  queryFn: () => api.getInspectTrace({ algorithm, params }),
  enabled: false, // Dieksekusi saat tombol "Jalankan Trace" ditekan
})
```

---

## 4. Standar Desain Visual (Dark Industrial Theme)

- Gunakan palet warna **Industrial Slate / Dark Mode**:
  - Background: `bg-slate-950`
  - Cards & Containers: `bg-slate-900 border border-slate-800`
  - Teks Utama: `text-slate-100`
  - Teks Sekunder: `text-slate-400`
  - Aksen Valid / Sah: `text-emerald-400 bg-emerald-950/50 border-emerald-800`
  - Aksen Tampered / Bahaya: `text-rose-400 bg-rose-950/50 border-rose-800`
  - Aksen Kriptografi / Inspector: `text-cyan-400 bg-cyan-950/50 border-cyan-800`

---

## 5. Implementasi 6 Halaman Pokok

1. **`/keygen`**: Tampilkan 3 tab entitas (PPIC, Satpam, Cabang). Card parameter harus menampilkan nilai $p, q, n, \phi(n), e, d$ secara jelas dan tombol simpan ke session browser.
2. **`/inspector`**: Render tabel iterasi (tabel EEA dengan kolom $q, r_1, r_2, r, x_1, x_2, x$, tabel Square-and-Multiply dengan bit biner dan kalkulasi kuadrat/kali).
3. **`/issue`**: Formulir manifest rapi, kolom input memo rahasia, preview nilai hash, dan output string token Base64 lengkap dengan QR Code viewer.
4. **`/gate`**: Input paste token, banner besar indikator validasi **HIJAU / MERAH**, dan tombol counter-sign satpam.
5. **`/receiving`**: Verifikasi ganda (PPIC + Satpam) dan tombol dekripsi memo rahasia yang menampilkan plaintext asli.
6. **`/attack-lab`**: Tab 4 serangan (Payload Tamper, Rogue Signer, Corrupt Signature, Replay Attack) dengan tombol injeksi serangan sekali klik yang langsung memperlihatkan alasan kegagalan matematis.
