'use client'

import React from 'react'
import Link from 'next/link'
import {
  Shield,
  Layers,
  Zap,
  Binary,
  ArrowRight,
  ShieldCheck,
  Lock,
  Cpu,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { CryptographicMesh3D } from '@/components/CryptographicMesh3D'
import { UnifiedManifestPipeline } from '@/components/UnifiedManifestPipeline'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 text-left">
      {/* Hero Section */}
      <div className="relative rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-10 lg:p-12 shadow-card overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Text (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200/80 text-zinc-700 font-mono text-xs font-medium">
              <Shield className="w-3.5 h-3.5 text-zinc-900" /> Pure Scratch RSA (0% Library Kripto Eksternal)
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight leading-[1.15]">
              Otorisasi Surat Jalan Logistik Berbasis <span className="underline decoration-zinc-300 underline-offset-4">RSA Murni</span>.
            </h1>

            <p className="text-zinc-600 text-sm sm:text-base leading-relaxed max-w-xl">
              Sistem pengamanan manifest pergudangan manufaktur nir-kertas (paperless).
              Mengintegrasikan tanda tangan digital berantai ganda (PPIC &amp; Satpam Gerbang),
              enkripsi muatan asimetris penerima, dan proteksi replay attack via nonce.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#pipeline"
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-subtle"
              >
                <Layers className="w-4 h-4" /> Mulai Alur Surat Jalan
              </a>
              <Link
                href="/attack-lab"
                className="px-5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-subtle"
              >
                <Zap className="w-4 h-4 text-rose-600" /> Attack Lab
              </Link>
              <Link
                href="/inspector"
                className="px-5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-subtle"
              >
                <Binary className="w-4 h-4 text-blue-600" /> Crypto Inspector
              </Link>
            </div>
          </div>

          {/* Right Hero Three.js Canvas (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <CryptographicMesh3D />
            <div className="absolute bottom-2 text-center text-[11px] font-mono text-zinc-400">
              Interactive Cryptographic Vault Node &bull; Three.js
            </div>
          </div>
        </div>
      </div>

      {/* Unified Manifest Pipeline Workspace */}
      <section id="pipeline" className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-200/80 pb-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Live Interactive Workspace
            </span>
            <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
              Alur Terpadu Perjalanan Surat Jalan (Manifest Journey)
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Data dan token mengalir otomatis dari PPIC &rarr; Pos Gerbang &rarr; Gudang Penerima tanpa perlu salin-tempel token secara manual.
            </p>
          </div>
        </div>

        <UnifiedManifestPipeline />
      </section>

      {/* 3 Pillars Theoretical Architecture */}
      <section className="space-y-4 pt-6 border-t border-zinc-200/80">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
            Fondasi Matematika &bull; Bab 3 Laporan
          </span>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight mt-0.5">
            Arsitektur Kriptografi Tiga Entitas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card A */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-subtle space-y-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold font-mono text-xs">
              A
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">PPIC (Entitas A)</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Menerbitkan manifest barang, menghitung polynomial hash H(M), menandatangani secara digital dengan kunci privat{' '}
              <span className="font-mono text-zinc-800">S<sub>A</sub> = H(M)<sup>d<sub>A</sub></sup> mod n<sub>A</sub></span>, dan mengenkripsi memo rahasia dengan kunci publik penerima (<span className="font-mono text-zinc-800">e<sub>C</sub></span>).
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400">
              Ref Kuliah: p=47, q=71 &rarr; n=3337, e=79, d=1019
            </div>
          </div>

          {/* Card B */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-subtle space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold font-mono text-xs">
              B
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">Pos Gerbang (Entitas B)</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Memeriksa keaslian signature pengirim{' '}
              <span className="font-mono text-zinc-800">S<sub>A</sub><sup>e<sub>A</sub></sup> mod n<sub>A</sub> = H(M)</span>, memvalidasi masa berlaku,
              memeriksa registry nonce anti-replay, dan membubuhkan persetujuan gerbang <span className="font-mono text-zinc-800">S<sub>B</sub></span>.
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400">
              Ref Kuliah: p=53, q=67 &rarr; n=3551, e=17, d=2825
            </div>
          </div>

          {/* Card C */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-subtle space-y-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold font-mono text-xs">
              C
            </div>
            <h3 className="font-bold text-zinc-900 text-sm">Gudang Penerima (Entitas C)</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Memvalidasi tanda tangan ganda (<span className="font-mono text-zinc-800">S<sub>A</sub></span> dan <span className="font-mono text-zinc-800">S<sub>B</sub></span>) untuk memastikan kargo tidak diselundupkan, kemudian mendekripsi
              catatan rahasia/kode segel kontainer dengan kunci privat <span className="font-mono text-zinc-800">d<sub>C</sub></span>.
            </p>
            <div className="pt-2 text-[11px] font-mono text-zinc-400">
              Ref Kuliah: p=61, q=73 &rarr; n=4453, e=47, d=1751
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
