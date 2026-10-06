'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  Key,
  Search,
  FileText,
  DoorOpen,
  Package,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  Cpu,
  Layers,
  ShieldCheck,
  Binary,
} from 'lucide-react'
import { AuditLog } from '@/components/AuditLog'

interface KeySummary {
  exists: boolean
  e?: number
  n?: number
  p?: number
  q?: number
}

export default function DashboardPage() {
  const [keyA, setKeyA] = useState<KeySummary>({ exists: false })
  const [keyB, setKeyB] = useState<KeySummary>({ exists: false })
  const [keyC, setKeyC] = useState<KeySummary>({ exists: false })
  const [lastToken, setLastToken] = useState<string | null>(null)

  useEffect(() => {
    try {
      const a = localStorage.getItem('securepass_key_A')
      if (a) {
        const parsed = JSON.parse(a)
        setKeyA({ exists: true, e: parsed.pub_key?.[0], n: parsed.pub_key?.[1], p: parsed.p, q: parsed.q })
      }

      const b = localStorage.getItem('securepass_key_B')
      if (b) {
        const parsed = JSON.parse(b)
        setKeyB({ exists: true, e: parsed.pub_key?.[0], n: parsed.pub_key?.[1], p: parsed.p, q: parsed.q })
      }

      const c = localStorage.getItem('securepass_key_C')
      if (c) {
        const parsed = JSON.parse(c)
        setKeyC({ exists: true, e: parsed.pub_key?.[0], n: parsed.pub_key?.[1], p: parsed.p, q: parsed.q })
      }

      const tok = localStorage.getItem('last_token')
      if (tok) setLastToken(tok)
    } catch (e) {
      console.error('Error loading localStorage keys in dashboard', e)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-8 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/80 text-cyan-400 font-mono text-xs">
            <Shield className="w-3.5 h-3.5" /> Pure Scratch RSA Implementation (Tanpa Library Kripto Eksternal)
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
            SecurePass <span className="text-cyan-400">RSA</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Sistem otorisasi surat jalan logistik pergudangan nir-kertas (paperless) berbasis kriptografi kunci publik RSA murni.
            Mengintegrasikan tanda tangan digital ganda (PPIC & Pos Gerbang), enkripsi muatan asimetris,
            dan pencegahan serangan replay menggunakan nonce acak.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/keygen"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <Key className="w-4 h-4" /> Kelola Kunci RSA
            </Link>
            <Link
              href="/issue"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-cyan-400" /> Terbitkan Surat Jalan
            </Link>
            <Link
              href="/attack-lab"
              className="px-5 py-2.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800/80 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4 text-rose-400" /> Attack Simulation Lab
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Entity Key Status Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-400" /> Status Pasangan Kunci Entitas (Keyring)
          </h2>
          <Link href="/keygen" className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-mono">
            Buka Konfigurasi Kunci <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Entity A Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Entitas A: PPIC
              </span>
              {keyA.exists ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-700/60">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-700/60">
                  <AlertCircle className="w-3 h-3" /> Belum Dibuat
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100">Departemen Perencanaan</h3>
            <p className="text-xs text-slate-400">
              Bertanggung jawab menerbitkan manifest barang dan menandatangani secara digital dengan Kunci Privat A (<span className="text-cyan-300 font-mono">d_A</span>).
            </p>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs">
              <div className="text-slate-500">Public Key (e, n):</div>
              <div className="text-slate-300 truncate font-semibold">
                {keyA.exists ? `[${keyA.e}, ${keyA.n}]` : 'Belum dikonfigurasi'}
              </div>
            </div>
          </div>

          {/* Entity B Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Entitas B: Pos Gerbang
              </span>
              {keyB.exists ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-700/60">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-700/60">
                  <AlertCircle className="w-3 h-3" /> Belum Dibuat
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100">Petugas Keamanan Gerbang</h3>
            <p className="text-xs text-slate-400">
              Memverifikasi tanda tangan primer A dan membubuhkan persetujuan gerbang (Counter-Signature) dengan Kunci Privat B (<span className="text-cyan-300 font-mono">d_B</span>).
            </p>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs">
              <div className="text-slate-500">Public Key (e, n):</div>
              <div className="text-slate-300 truncate font-semibold">
                {keyB.exists ? `[${keyB.e}, ${keyB.n}]` : 'Belum dikonfigurasi'}
              </div>
            </div>
          </div>

          {/* Entity C Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Entitas C: Gudang Penerima
              </span>
              {keyC.exists ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-700/60">
                  <CheckCircle2 className="w-3 h-3" /> Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-amber-400 bg-amber-950/60 border border-amber-700/60">
                  <AlertCircle className="w-3 h-3" /> Belum Dibuat
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-100">Logistik & Bongkar Muat</h3>
            <p className="text-xs text-slate-400">
              Melakukan verifikasi ganda (A & B) dan mendekripsi memo rahasia pengiriman menggunakan Kunci Privat C (<span className="text-cyan-300 font-mono">d_C</span>).
            </p>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800/80 font-mono text-xs">
              <div className="text-slate-500">Public Key (e, n):</div>
              <div className="text-slate-300 truncate font-semibold">
                {keyC.exists ? `[${keyC.e}, ${keyC.n}]` : 'Belum dikonfigurasi'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Flow Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" /> Alur Kerja Kriptografi (Cryptographic Pipeline)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Proses verifikasi berantai tiga pihak untuk memastikan keaslian, kerahasiaan, dan non-repudiasi surat jalan logistik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1 */}
          <div className="p-5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono">
              1
            </div>
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" /> Penerbitan di PPIC (A)
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Serialisasi manifest canonical JSON</li>
              <li>Hitung Polynomial Rolling Hash $H(M)$</li>
              <li>Tanda tangan primer $S_A = H(M)^{d_A} \pmod{n_A}$</li>
              <li>Enkripsi catatan rahasia dengan $e_C$</li>
              <li>Sertakan Nonce anti-replay acak UUID-v4</li>
            </ul>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono">
              2
            </div>
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-cyan-400" /> Pemeriksaan Pos Gerbang (B)
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Pindai QR / Decode paket token</li>
              <li>Periksa Nonce registry (Cegah Replay)</li>
              <li>Verifikasi signature primer $S_A^{e_A} \stackrel{?}{=} H(M)$</li>
              <li>Validasi batas waktu kedaluwarsa</li>
              <li>Bubuhkan Counter-Signature $S_B = H(Clearance)^{d_B}$</li>
            </ul>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-400 font-bold flex items-center justify-center text-sm font-mono">
              3
            </div>
            <h3 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4 text-cyan-400" /> Penerimaan di Gudang (C)
            </h3>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Verifikasi tanda tangan PPIC ($S_A$)</li>
              <li>Verifikasi persetujuan gerbang ($S_B$)</li>
              <li>Hanya jika kedua tanda tangan valid:</li>
              <li>Dekripsi ciphertext memo: $m_i = c_i^{d_C} \pmod{n_C}$</li>
              <li>Pelepasan kargo disahkan</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-cyan-400 flex items-center gap-1.5 font-semibold text-sm">
            <Cpu className="w-4 h-4" /> Scratch RSA Math
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Implementasi murni Miller-Rabin Primality Test, Extended Euclidean Algorithm untuk invers modulo, dan Square-and-Multiply.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-emerald-400 flex items-center gap-1.5 font-semibold text-sm">
            <ShieldCheck className="w-4 h-4" /> Dual Digital Signatures
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menghilangkan kemungkinan suap internal dengan mewajibkan tanda tangan digital berurutan dari PPIC dan Petugas Gerbang.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-amber-400 flex items-center gap-1.5 font-semibold text-sm">
            <Lock className="w-4 h-4" /> Confidential Payload
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Informasi sensitif seperti kode segel fisik dan instruksi khusus terenkripsi secara asimetris khusus untuk penerima.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
          <div className="text-rose-400 flex items-center gap-1.5 font-semibold text-sm">
            <Zap className="w-4 h-4" /> Kriptanalisis Attack Lab
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Uji ketahanan terhadap 4 skenario serangan nyata: manipulasi payload, penandatangan palsu, kerusakan tanda tangan, dan serangan replay.
          </p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyan-400" /> Modul & Navigasi Cepat
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/keygen"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <Key className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                Manajemen Kunci RSA <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Bangkitkan pasangan kunci asimetris untuk PPIC (A), Gate (B), dan Gudang (C) dengan bit-length dinamis.
              </p>
            </div>
          </Link>

          <Link
            href="/inspector"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <Search className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                Crypto Inspector <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Trace visual interaktif langkah demi langkah: Extended Euclidean, Miller-Rabin, Square-and-Multiply, dan Chunking.
              </p>
            </div>
          </Link>

          <Link
            href="/issue"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <FileText className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                Terbitkan Surat Jalan (A) <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Input form manifest barang, tandatangani secara digital, enkripsi instruksi rahasia, dan hasilkan token QR.
              </p>
            </div>
          </Link>

          <Link
            href="/gate"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <DoorOpen className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                Pos Gerbang Pemeriksaan (B) <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Validasi integritas manifest fisik, cegah replay attack, dan sematkan Counter-Signature pos sebelum truk keluar.
              </p>
            </div>
          </Link>

          <Link
            href="/receiving"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <Package className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 flex items-center gap-1">
                Gudang Penerima (C) <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Verifikasi dual-signature (PPIC + Gerbang) dan dekripsi memo rahasia dengan Kunci Privat Gudang C.
              </p>
            </div>
          </Link>

          <Link
            href="/attack-lab"
            className="p-4 rounded-lg bg-slate-900 border border-slate-800 hover:border-rose-700/80 hover:bg-slate-800/60 transition-all flex items-start gap-3 group"
          >
            <Zap className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-slate-200 group-hover:text-rose-300 flex items-center gap-1">
                Attack Simulation Lab <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Uji ketahanan kriptografi: manipulasi isi kontainer, kunci palsu, bit-flip transmisi, dan uji replay.
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Audit Log Section */}
      <AuditLog />
    </div>
  )
}
