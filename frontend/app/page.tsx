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
  TrendingUp,
  FileText,
  KeyRound,
  Eye,
} from 'lucide-react'
import { CryptographicMesh3D } from '@/components/CryptographicMesh3D'
import { UnifiedManifestPipeline } from '@/components/UnifiedManifestPipeline'
import { MotionReveal } from '@/components/MotionReveal'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-16 text-left">
      {/* 1. HERO SECTION (Finpay Hero Style with Staggered In-Animation) */}
      <section className="relative rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 lg:p-14 shadow-finpay overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Hero Text (7 cols) - Staggered In-Animation Sequence */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-mono text-xs font-semibold animate-fade-in-up stagger-1">
              <span className="w-2 h-2 rounded-full bg-[#008579] animate-pulse" />
              Pure Scratch RSA (0% Library Kripto Eksternal)
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12] animate-fade-in-up stagger-2">
              Otorisasi Surat Jalan Logistik Berbasis{' '}
              <span className="text-[#008579] underline decoration-teal-300 underline-offset-8">
                RSA Murni
              </span>
              .
            </h1>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl animate-fade-in-up stagger-3">
              Sistem otorisasi manifest pergudangan manufaktur nir-kertas (paperless).
              Mengamankan rantai pasok dengan tanda tangan digital ganda (PPIC &amp; Satpam Gerbang),
              enkripsi muatan asimetris penerima, dan proteksi replay attack via nonce.
            </p>

            {/* Finpay Style Action Pill Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2 animate-fade-in-up stagger-4">
              <a
                href="#pipeline"
                className="px-6 py-3 rounded-full bg-[#081c26] hover:bg-[#008579] text-white font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-sm hover-lift active:scale-95"
              >
                <Layers className="w-4 h-4 text-teal-300" /> Mulai Alur Surat Jalan
              </a>
              <Link
                href="/attack-lab"
                className="px-5 py-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-subtle hover-lift active:scale-95"
              >
                <Zap className="w-4 h-4 text-rose-600" /> Attack Lab
              </Link>
              <Link
                href="/inspector"
                className="px-5 py-3 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-subtle hover-lift active:scale-95"
              >
                <Binary className="w-4 h-4 text-[#008579]" /> Crypto Inspector
              </Link>
            </div>

            {/* Finpay Partner / Proof Badges Row */}
            <div className="pt-4 border-t border-slate-100 animate-fade-in-up stagger-5">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2.5">
                Fondasi Algoritma Tanpa Library Eksternal
              </div>
              <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-slate-600">
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium hover:border-slate-300 transition-colors">
                  Miller-Rabin
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium hover:border-slate-300 transition-colors">
                  Extended Euclidean (EEA)
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium hover:border-slate-300 transition-colors">
                  Square-and-Multiply
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium hover:border-slate-300 transition-colors">
                  Polynomial Hash
                </span>
                <span className="text-slate-300">&bull;</span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium hover:border-slate-300 transition-colors">
                  Nonce Registry
                </span>
              </div>
            </div>
          </div>

          {/* Right Hero: Three.js Interactive Cryptographic Mesh (5 cols) */}
          <div className="lg:col-span-5 relative flex items-center justify-center animate-scale-in">
            <CryptographicMesh3D />
            <div className="absolute bottom-2 text-center text-[11px] font-mono text-slate-400">
              Interactive Cryptographic Vault Node &bull; Three.js
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE PILLARS ARCHITECTURE (Finpay "Experience that grows with your scale") */}
      <MotionReveal delay={60} direction="up">
        <section className="rounded-3xl bg-white border border-slate-200/80 p-8 sm:p-12 shadow-finpay space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#008579] font-bold">
                Arsitektur Kriptografi Tiga Entitas
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Pemisahan Peran Tanpa Kepercayaan Tunggal
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md">
              Masing-masing entitas memiliki pasangan kunci independen untuk menjamin non-repudiation,
              kerahasiaan, dan otorisasi berantai.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card A */}
            <div className="space-y-3.5 p-4 rounded-2xl hover-lift transition-all duration-300 hover:bg-slate-50/70 border border-transparent hover:border-slate-200/60">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 text-[#008579] flex items-center justify-center font-extrabold font-mono text-sm border border-teal-200/50">
                A
              </div>
              <h3 className="font-bold text-slate-900 text-base">PPIC (Entitas A &bull; Pengirim)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Menerbitkan manifest barang, menghitung polynomial hash <span className="font-mono text-slate-800">H(M)</span>, menandatangani digital dengan kunci privat{' '}
                <span className="font-mono text-slate-800 font-semibold">S<sub>A</sub> = H(M)<sup>d<sub>A</sub></sup> mod n<sub>A</sub></span>, dan mengenkripsi memo rahasia dengan kunci publik penerima (<span className="font-mono text-slate-800">e<sub>C</sub></span>).
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-400">
                Ref Kuliah: p=47, q=71 &rarr; n=3337, e=79, d=1019
              </div>
            </div>

            {/* Card B */}
            <div className="space-y-3.5 p-4 rounded-2xl hover-lift transition-all duration-300 hover:bg-slate-50/70 border border-transparent hover:border-slate-200/60">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold font-mono text-sm border border-emerald-200/50">
                B
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pos Gerbang (Entitas B &bull; Satpam)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Memeriksa keaslian signature pengirim{' '}
                <span className="font-mono text-slate-800 font-semibold">S<sub>A</sub><sup>e<sub>A</sub></sup> mod n<sub>A</sub> = H(M)</span>, memvalidasi masa berlaku,
                memeriksa registry nonce anti-replay, dan membubuhkan counter-signature persetujuan gerbang <span className="font-mono text-slate-800 font-semibold">S<sub>B</sub></span>.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-400">
                Ref Kuliah: p=53, q=67 &rarr; n=3551, e=17, d=2825
              </div>
            </div>

            {/* Card C */}
            <div className="space-y-3.5 p-4 rounded-2xl hover-lift transition-all duration-300 hover:bg-slate-50/70 border border-transparent hover:border-slate-200/60">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-extrabold font-mono text-sm border border-slate-200">
                C
              </div>
              <h3 className="font-bold text-slate-900 text-base">Gudang Penerima (Entitas C)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Memvalidasi tanda tangan ganda (<span className="font-mono text-slate-800 font-semibold">S<sub>A</sub></span> dan <span className="font-mono text-slate-800 font-semibold">S<sub>B</sub></span>) untuk memastikan kargo tidak diselundupkan di jalan, lalu mendekripsi
                catatan rahasia segel kontainer dengan kunci privat <span className="font-mono text-slate-800 font-semibold">d<sub>C</sub></span>.
              </p>
              <div className="pt-2 text-[11px] font-mono text-slate-400">
                Ref Kuliah: p=61, q=73 &rarr; n=4453, e=47, d=1751
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* 3. BENTO GRID SECTION (Finpay "Why they prefer Finpay") */}
      <MotionReveal delay={80} direction="up">
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#008579] font-bold">
              Keunggulan Matematika Murni
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Mengapa Memilih Implementasi Pure Scratch RSA?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Bento Item 1: Big Stat Card (4 cols) */}
            <div className="md:col-span-4 rounded-3xl bg-white border border-slate-200/80 p-8 shadow-finpay flex flex-col justify-between hover-lift">
              <div>
                <div className="text-5xl sm:text-6xl font-extrabold text-[#008579] tracking-tight">
                  0%
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-4">
                  Library Kriptografi Eksternal
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  Nol dependensi OpenSSL, PyCryptodome, atau cryptography lib. Semua algoritma dibangun murni dari aritmatika integer dasar.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-mono text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> Sesuai Silabus Kriptografi
              </div>
            </div>

            {/* Bento Item 2: Dual Chain Signature (8 cols) */}
            <div className="md:col-span-8 rounded-3xl bg-white border border-slate-200/80 p-8 shadow-finpay flex flex-col justify-between hover-lift">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Proses Pengamanan
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#008579] border border-teal-200/60">
                    Dual-Signature Chain
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mt-3">
                  Verifikasi Berantai Anti-Penyelundupan
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
                  Setiap paket gate pass menggabungkan tanda tangan PPIC ($S_A$) dan stempel digital pos gerbang ($S_B$) sebelum dapat dibuka di gudang tujuan.
                </p>
              </div>

              {/* Visual Step Nodes */}
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:bg-slate-100/70 transition-colors">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Tahap 1</div>
                  <div className="font-semibold text-slate-900 text-xs mt-1">PPIC Signing</div>
                  <div className="text-[10px] font-mono text-[#008579] mt-0.5">S_A = H(M)^d mod n</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center hover:bg-slate-100/70 transition-colors">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Tahap 2</div>
                  <div className="font-semibold text-slate-900 text-xs mt-1">Gerbang Approval</div>
                  <div className="text-[10px] font-mono text-emerald-600 mt-0.5">S_B = H(M)^d mod n</div>
                </div>
                <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 text-center hover:bg-teal-100/70 transition-colors">
                  <div className="text-[11px] font-bold text-[#008579] uppercase">Tahap 3</div>
                  <div className="font-semibold text-teal-900 text-xs mt-1">Dekripsi Gudang</div>
                  <div className="text-[10px] font-mono text-teal-700 mt-0.5">m = c^d mod n</div>
                </div>
              </div>
            </div>

            {/* Bento Item 3: Complexity Curve (12 cols) */}
            <div className="md:col-span-12 rounded-3xl bg-white border border-slate-200/80 p-8 shadow-finpay hover-lift">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                    Optimasi Algoritma
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    Kompleksitas Logaritmik: Square-and-Multiply
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Menurunkan waktu komputasi dari perkalian berulang <span className="font-mono text-slate-700">O(e)</span> menjadi hanya <span className="font-mono text-slate-700 font-semibold">O(log e)</span> kuadrat-dan-kali bit.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#008579]" />
                    <span className="text-slate-700 font-medium">Square-and-Multiply O(log e)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                    <span className="text-slate-400">Naive Multiplication O(e)</span>
                  </div>
                </div>
              </div>

              {/* SVG Visual Growth Line (Finpay Style Chart) */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="relative h-28 w-full flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="finpayTealGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#008579" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#008579" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Naive exponential slow curve (grey line) */}
                    <path
                      d="M 0,90 Q 400,85 700,50 T 1000,5"
                      fill="none"
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* Square and Multiply fast logarithmic curve (teal line with fill) */}
                    <path
                      d="M 0,95 Q 200,90 500,80 T 1000,65 L 1000,100 L 0,100 Z"
                      fill="url(#finpayTealGradient)"
                    />
                    <path
                      d="M 0,95 Q 200,90 500,80 T 1000,65"
                      fill="none"
                      stroke="#008579"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-3">
                  <span>Eksponen Kecil (e=17)</span>
                  <span>Eksponen Kuliah (e=79)</span>
                  <span>Eksponen Standar (e=65537)</span>
                  <span>Eksponen 1024-bit (2^1024)</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* 4. DARK NAVY FEATURE BANNER (Finpay "Maximize your returns with a Reserve account...") */}
      <MotionReveal delay={80} direction="up">
        <section className="rounded-3xl bg-[#081c26] text-white p-8 sm:p-12 lg:p-16 shadow-xl space-y-10">
          <div className="max-w-2xl space-y-3">
            <span className="text-xs font-mono uppercase tracking-wider text-teal-400 font-bold">
              Standar Keamanan Industri
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Protokol Keamanan 3-Lapis Tanpa Kompromi.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Menjawab tiga ancaman krusial manifest logistik manufaktur (pemalsuan dokumen, serangan pemutaran ulang, dan kebocoran kargo sensitif).
            </p>
          </div>

          {/* 3 Numbered Dark Cards (Finpay 1, 2, 3 Style) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Number 1 */}
            <div className="rounded-2xl bg-[#0f2c3d]/70 border border-slate-700/60 p-6 space-y-3 hover-lift hover:border-teal-400/50 hover:bg-[#103448] transition-all duration-300">
              <div className="text-4xl font-extrabold text-teal-400 font-mono">1</div>
              <h3 className="font-bold text-white text-base">Integritas Muatan (Non-Repudiation)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hash polinomial unik mengikat seluruh butir manifest, nomor plat, dan waktu. Manipulasi 1 karakter akan langsung menggagalkan tanda tangan pengirim.
              </p>
            </div>

            {/* Number 2 */}
            <div className="rounded-2xl bg-[#0f2c3d]/70 border border-slate-700/60 p-6 space-y-3 hover-lift hover:border-teal-400/50 hover:bg-[#103448] transition-all duration-300">
              <div className="text-4xl font-extrabold text-teal-400 font-mono">2</div>
              <h3 className="font-bold text-white text-base">Pertahanan Replay (Anti-Replay Nonce)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Setiap paket membawa nonce acak 64-bit yang dicatat di registry memori backend; upaya duplikasi atau transmisi ulang token yang sama ditolak instan.
              </p>
            </div>

            {/* Number 3 */}
            <div className="rounded-2xl bg-[#0f2c3d]/70 border border-slate-700/60 p-6 space-y-3 hover-lift hover:border-teal-400/50 hover:bg-[#103448] transition-all duration-300">
              <div className="text-4xl font-extrabold text-teal-400 font-mono">3</div>
              <h3 className="font-bold text-white text-base">Kerahasiaan Muatan (Confidentiality)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kode segel kontainer dan memo sensitif dienkripsi asimetris dengan kunci publik gudang penerima (<span className="font-mono text-teal-300">e<sub>C</sub></span>). Petugas pos gerbang tidak dapat mengintip isi.
              </p>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* 5. LIVE INTERACTIVE PIPELINE WORKSPACE */}
      <MotionReveal delay={60} direction="up">
        <section id="pipeline" className="space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200/80">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#008579] font-bold">
                Live Interactive Workspace
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Alur Terpadu Perjalanan Surat Jalan (Manifest Journey)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Data dan token mengalir otomatis dari PPIC &rarr; Pos Gerbang &rarr; Gudang Penerima tanpa perlu salin-tempel token manual.
              </p>
            </div>
          </div>

          <UnifiedManifestPipeline />
        </section>
      </MotionReveal>

      {/* 6. IMPACT NUMBERS ROW (Finpay "We've helped innovative companies...") */}
      <MotionReveal delay={80} direction="up">
        <section className="text-center space-y-8 pt-8 border-t border-slate-200/80">
          <div className="max-w-xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#008579] font-bold">
              Verifikasi &amp; Tolok Ukur
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Metrik Keandalan Sistem
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover-lift">
              <div className="text-4xl font-extrabold text-[#008579] tracking-tight font-mono">100%</div>
              <div className="text-xs font-bold text-slate-900 mt-2">Deterministik</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Verifikasi matematis presisi tanpa false-positive</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover-lift">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">&lt; 5 ms</div>
              <div className="text-xs font-bold text-slate-900 mt-2">Latensi Operasi</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Waktu eksekusi ModExp &amp; Extended Euclidean</div>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover-lift">
              <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">6 Kasus</div>
              <div className="text-xs font-bold text-slate-900 mt-2">Test Suite Lengkap</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Pengujian otomatis TC-01 hingga TC-06 lulus 100%</div>
            </div>
          </div>
        </section>
      </MotionReveal>

      {/* 7. QUICK ACTION MODULE CARDS (Finpay "Plus & Premium") */}
      <MotionReveal delay={80} direction="up">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Card 1: Attack Lab (Plus style) */}
          <Link
            href="/attack-lab"
            className="group rounded-3xl bg-white border border-slate-200/80 p-8 shadow-finpay hover:border-slate-300 transition-all duration-300 flex flex-col justify-between hover-lift"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-rose-600 font-bold">
                  Modul Pengujian Keamanan
                </span>
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-[#008579] group-hover:text-white transition-all transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-3 group-hover:text-[#008579] transition-colors">
                Attack Lab &bull; Adversary Suite
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Uji ketahanan sistem terhadap berbagai skenario ancaman siber: manipulasi muatan (tamper payload), plat nomor palsu, pemalsuan kunci (rogue signer), dan serangan duplikasi (replay attack).
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>4 Skenario Serangan Aktif</span>
              <span className="text-rose-600 font-mono group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Live Simulation &rarr;
              </span>
            </div>
          </Link>

          {/* Card 2: Crypto Inspector (Premium style) */}
          <Link
            href="/inspector"
            className="group rounded-3xl bg-gradient-to-br from-[#008579] via-[#046e65] to-[#084841] text-white p-8 shadow-cardFloat hover:shadow-2xl transition-all duration-300 flex flex-col justify-between hover-lift"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-teal-200 font-bold">
                  Modul Verifikasi Matematis
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-[#008579] transition-all transform group-hover:translate-x-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white mt-3">
                Crypto Inspector &bull; Step Tracer
              </h3>
              <p className="text-xs sm:text-sm text-teal-100 mt-2 leading-relaxed">
                Lacak kalkulasi matematis langkah demi langkah (trace): Extended Euclidean Algorithm (EEA), Miller-Rabin primality test, Square-and-Multiply modular exponentiation, dan Text Chunking.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-semibold text-teal-100">
              <span>Kalkulasi Langkah-demi-Langkah</span>
              <span className="text-white font-mono group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Buka Trace &rarr;
              </span>
            </div>
          </Link>
        </section>
      </MotionReveal>

      {/* 8. DARK CTA BANNER (Finpay "Ready to level up your payment process?") */}
      <MotionReveal delay={80} direction="up">
        <section className="rounded-3xl bg-[#081c26] text-white p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 hover-lift">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Siap Menguji Keandalan Kriptografi Logistik?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Jalankan simulasi alur manifest secara end-to-end sekarang atau buka inspektur algoritma untuk melihat kalkulasi langkah demi langkah.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="#pipeline"
              className="px-6 py-3 rounded-full bg-[#008579] hover:bg-teal-500 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm hover-lift active:scale-95"
            >
              Mulai Alur Sekarang
            </a>
            <Link
              href="/inspector"
              className="px-5 py-3 rounded-full border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs sm:text-sm transition-colors hover-lift active:scale-95"
            >
              Buka Crypto Inspector
            </Link>
          </div>
        </section>
      </MotionReveal>

      {/* 9. MULTI-COLUMN CLEAN FOOTER (Finpay Footer Style) */}
      <MotionReveal delay={50} direction="none">
        <footer className="pt-10 pb-6 border-t border-slate-200/80 text-xs text-slate-500 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Shield className="w-4 h-4 text-[#008579]" /> SecurePass RSA
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sistem otorisasi surat jalan logistik manufaktur berbasis RSA murni (pure scratch) tanpa dependensi eksternal.
              </p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">Navigasi</div>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#pipeline" className="hover:text-slate-900 transition-colors">Alur Surat Jalan</a></li>
                <li><Link href="/attack-lab" className="hover:text-slate-900 transition-colors">Laboratorium Serangan</Link></li>
                <li><Link href="/inspector" className="hover:text-slate-900 transition-colors">Inspektor Kripto</Link></li>
                <li><Link href="/keygen" className="hover:text-slate-900 transition-colors">Generator Kunci</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">Algoritma</div>
              <ul className="space-y-1.5 text-[11px]">
                <li>Miller-Rabin Primality</li>
                <li>Extended Euclidean (EEA)</li>
                <li>Square-and-Multiply ModExp</li>
                <li>Dual Nonce Freshness</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-900 text-xs uppercase tracking-wider font-mono">Akademik</div>
              <ul className="space-y-1.5 text-[11px]">
                <li>SOKRATES &times; BINUS 2026</li>
                <li>Mata Kuliah Kriptografi</li>
                <li>Tugas Besar RSA Murni</li>
                <li className="text-teal-700 font-medium">100% Zero-External Lib</li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
            <div>&copy; 2026 SecurePass RSA &bull; Tim Proyek Kriptografi RSA SOKRATES &times; BINUS.</div>
            <div className="flex items-center gap-4 font-mono">
              <span>FastAPI Backend</span>
              <span>&bull;</span>
              <span>Next.js 15 Frontend</span>
            </div>
          </div>
        </footer>
      </MotionReveal>
    </div>
  )
}

