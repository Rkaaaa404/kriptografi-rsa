'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import type { InspectTraceResponse, EncryptDecryptTraceResponse } from '@/types/api'
import { loadKeyringFromStorage, ACADEMIC_KEYS } from '@/lib/keyring'
import { toast } from 'sonner'
import {
  Search,
  Calculator,
  ShieldCheck,
  Zap,
  Layers,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Binary,
  Lock,
  Unlock,
  ArrowRight,
  Sparkles,
  FileText,
} from 'lucide-react'

type TabType = 'eea' | 'miller_rabin' | 'mod_exp' | 'chunking' | 'standalone'

export default function InspectorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('eea')

  // EEA State
  const [eeaA, setEeaA] = useState<string>('79')
  const [eeaB, setEeaB] = useState<string>('3220')
  const [eeaLoading, setEeaLoading] = useState<boolean>(false)
  const [eeaResult, setEeaResult] = useState<InspectTraceResponse | null>(null)

  // Miller-Rabin State
  const [mrN, setMrN] = useState<string>('47')
  const [mrK, setMrK] = useState<string>('5')
  const [mrLoading, setMrLoading] = useState<boolean>(false)
  const [mrResult, setMrResult] = useState<InspectTraceResponse | null>(null)

  // ModExp State
  const [modBase, setModBase] = useState<string>('65')
  const [modExp, setModExp] = useState<string>('79')
  const [modMod, setModMod] = useState<string>('3337')
  const [modLoading, setModLoading] = useState<boolean>(false)
  const [modResult, setModResult] = useState<InspectTraceResponse | null>(null)

  // Chunking Visualizer State
  const [chunkText, setChunkText] = useState<string>('Hello')
  const [chunkMod, setChunkMod] = useState<string>('3337')

  // Standalone Encrypt-Decrypt State
  const [standaloneText, setStandaloneText] = useState<string>('Rahasia Logistik: Truk Siap Muat Jalur 2')
  const [standalonePreset, setStandalonePreset] = useState<'academic' | 'A' | 'B' | 'C' | 'custom'>('academic')
  const [standalonePubKeyE, setStandalonePubKeyE] = useState<string>('79')
  const [standalonePubKeyN, setStandalonePubKeyN] = useState<string>('3337')
  const [standalonePrivKeyD, setStandalonePrivKeyD] = useState<string>('1019')
  const [standalonePrivKeyN, setStandalonePrivKeyN] = useState<string>('3337')
  const [standaloneWithDecrypt, setStandaloneWithDecrypt] = useState<boolean>(true)
  const [standaloneLoading, setStandaloneLoading] = useState<boolean>(false)
  const [standaloneResult, setStandaloneResult] = useState<EncryptDecryptTraceResponse | null>(null)

  const handleSelectPreset = (preset: 'academic' | 'A' | 'B' | 'C' | 'custom') => {
    setStandalonePreset(preset)
    if (preset === 'academic') {
      setStandalonePubKeyE('79')
      setStandalonePubKeyN('3337')
      setStandalonePrivKeyD('1019')
      setStandalonePrivKeyN('3337')
    } else if (preset === 'A' || preset === 'B' || preset === 'C') {
      const keyring = loadKeyringFromStorage()
      const kp = keyring[preset] || ACADEMIC_KEYS[preset]
      if (kp) {
        setStandalonePubKeyE(String(kp.pub_key[0]))
        setStandalonePubKeyN(String(kp.pub_key[1]))
        setStandalonePrivKeyD(String(kp.priv_key[0]))
        setStandalonePrivKeyN(String(kp.priv_key[1]))
      }
    }
  }

  const handleRunStandalone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setStandaloneLoading(true)
    try {
      const eVal = parseInt(standalonePubKeyE.trim(), 10)
      const nVal = parseInt(standalonePubKeyN.trim(), 10)
      if (isNaN(eVal) || isNaN(nVal) || eVal <= 0 || nVal <= 1) {
        toast.error('Kunci publik e dan n harus berupa bilangan bulat positif valid!')
        setStandaloneLoading(false)
        return
      }

      let privTuple: [number, number] | undefined = undefined
      if (standaloneWithDecrypt) {
        const dVal = parseInt(standalonePrivKeyD.trim(), 10)
        const dN = parseInt(standalonePrivKeyN.trim(), 10)
        if (isNaN(dVal) || isNaN(dN) || dVal <= 0 || dN <= 1) {
          toast.error('Kunci privat d dan n harus berupa bilangan bulat positif valid!')
          setStandaloneLoading(false)
          return
        }
        privTuple = [dVal, dN]
      }

      const res = await api.inspectEncryptDecrypt({
        text: standaloneText,
        pub_key: [eVal, nVal],
        priv_key: privTuple,
      })
      setStandaloneResult(res)
      toast.success('Trace Enkripsi & Dekripsi Teks RSA berhasil dijalankan!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengeksekusi enkripsi-dekripsi')
    } finally {
      setStandaloneLoading(false)
    }
  }

  // Run EEA Trace
  const handleRunEea = async (e: React.FormEvent) => {
    e.preventDefault()
    setEeaLoading(true)
    try {
      const a = parseInt(eeaA.trim(), 10)
      const b = parseInt(eeaB.trim(), 10)
      if (isNaN(a) || isNaN(b)) {
        toast.error('Parameter a dan b harus berupa angka valid!')
        setEeaLoading(false)
        return
      }
      const data = await api.inspectTrace({
        algorithm: 'eea',
        params: { a, b },
      })
      setEeaResult(data)
      toast.success('Trace EEA berhasil dieksekusi!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjalankan EEA')
    } finally {
      setEeaLoading(false)
    }
  }

  // Run Miller-Rabin Trace
  const handleRunMillerRabin = async (e: React.FormEvent) => {
    e.preventDefault()
    setMrLoading(true)
    try {
      const n = parseInt(mrN.trim(), 10)
      const k = parseInt(mrK.trim(), 10)
      if (isNaN(n) || isNaN(k)) {
        toast.error('Parameter n dan k harus berupa angka valid!')
        setMrLoading(false)
        return
      }
      const data = await api.inspectTrace({
        algorithm: 'miller_rabin',
        params: { n, k },
      })
      setMrResult(data)
      toast.success('Trace Miller-Rabin berhasil dieksekusi!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjalankan Miller-Rabin')
    } finally {
      setMrLoading(false)
    }
  }

  // Run ModExp Trace
  const handleRunModExp = async (e: React.FormEvent) => {
    e.preventDefault()
    setModLoading(true)
    try {
      const base = parseInt(modBase.trim(), 10)
      const exp = parseInt(modExp.trim(), 10)
      const mod = parseInt(modMod.trim(), 10)
      if (isNaN(base) || isNaN(exp) || isNaN(mod)) {
        toast.error('Base, Exponent, dan Modulus harus berupa angka valid!')
        setModLoading(false)
        return
      }
      const data = await api.inspectTrace({
        algorithm: 'mod_exp',
        params: { base, exp, mod },
      })
      setModResult(data)
      toast.success('Trace Square-and-Multiply berhasil dieksekusi!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjalankan ModExp')
    } finally {
      setModLoading(false)
    }
  }

  // Chunking calculation
  const computeChunking = () => {
    const n = parseInt(chunkMod.trim(), 10)
    if (isNaN(n) || n <= 1) {
      return { error: 'Modulus n harus > 1', rawBytes: [], chunks: [], blockSize: 1, bitLength: 0 }
    }
    const encoder = new TextEncoder()
    const rawBytes = Array.from(encoder.encode(chunkText))
    const bitLength = n.toString(2).length
    const blockSize = Math.max(1, Math.floor((bitLength - 1) / 8))

    const chunks: {
      index: number
      bytes: number[]
      chars: string[]
      hex: string
      intBlock: number
      valid: boolean
    }[] = []

    for (let i = 0; i < rawBytes.length; i += blockSize) {
      const slice = rawBytes.slice(i, i + blockSize)
      let intVal = 0
      slice.forEach((b) => {
        intVal = intVal * 256 + b
      })
      chunks.push({
        index: Math.floor(i / blockSize),
        bytes: slice,
        chars: slice.map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '·')),
        hex: slice.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' '),
        intBlock: intVal,
        valid: intVal < n,
      })
    }

    return { error: null, rawBytes, chunks, blockSize, bitLength }
  }

  const chunkInfo = computeChunking()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 text-left">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#008579] text-xs font-semibold uppercase tracking-wider mb-2">
          <Binary className="w-3.5 h-3.5" /> Arithmetic Debugger
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Crypto Inspector &amp; Arithmetic Trace
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Visualisasi langkah-demi-langkah modular arithmetic RSA dari implementasi scratch Python murni (0% library eksternal).
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex bg-slate-100/90 p-1.5 rounded-2xl gap-1.5 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('eea')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'eea'
              ? 'bg-[#081c26] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>1. Extended Euclidean (EEA)</span>
        </button>

        <button
          onClick={() => setActiveTab('miller_rabin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'miller_rabin'
              ? 'bg-[#081c26] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>2. Miller-Rabin Primality</span>
        </button>

        <button
          onClick={() => setActiveTab('mod_exp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'mod_exp'
              ? 'bg-[#081c26] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>3. Square-and-Multiply (ModExp)</span>
        </button>

        <button
          onClick={() => setActiveTab('chunking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'chunking'
              ? 'bg-[#081c26] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>4. Chunking Visualizer</span>
        </button>

        <button
          onClick={() => setActiveTab('standalone')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'standalone'
              ? 'bg-[#081c26] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>5. Demo Enkripsi &amp; Dekripsi Teks Mandiri</span>
        </button>
      </div>

      {/* TAB 1: EXTENDED EUCLIDEAN ALGORITHM */}
      {activeTab === 'eea' && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-finpay space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-zinc-700" />
                Extended Euclidean Algorithm (EEA) Trace
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Menghitung gcd(a, b) dan koefisien Bézout x, y sedemikian rupa sehingga a &times; x + b &times; y = gcd(a, b).
                Dalam RSA: mencari invers perkalian modular d &equiv; e<sup>-1</sup> mod &phi;(n).
              </p>
            </div>

            <form onSubmit={handleRunEea} className="flex flex-wrap items-end gap-3 pt-2">
              <div className="w-40">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Nilai a (e.g. e = 79)</label>
                <input
                  type="number"
                  value={eeaA}
                  onChange={(e) => setEeaA(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="w-44">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Nilai b (e.g. φ = 3220)</label>
                <input
                  type="number"
                  value={eeaB}
                  onChange={(e) => setEeaB(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={eeaLoading}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-subtle disabled:opacity-50"
              >
                {eeaLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Jalankan Trace EEA
              </button>
            </form>
          </div>

          {/* EEA Results Card */}
          {eeaResult && (() => {
            const resultObj =
              eeaResult.result && typeof eeaResult.result === 'object'
                ? (eeaResult.result as Record<string, unknown>)
                : null
            const gcdVal = typeof resultObj?.gcd === 'number' ? resultObj.gcd : '-'
            const bezoutX = typeof resultObj?.x === 'number' ? resultObj.x : '-'
            const bVal = parseInt(eeaB, 10)
            const modInverseD =
              typeof resultObj?.gcd === 'number' &&
              resultObj.gcd === 1 &&
              typeof resultObj.x === 'number' &&
              !isNaN(bVal) &&
              bVal > 0
                ? ((resultObj.x % bVal) + bVal) % bVal
                : 'Tidak Ada Invers'

            return (
              <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="text-xs text-zinc-500">Hasil gcd(a, b)</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{gcdVal}</div>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <span className="text-xs text-zinc-500">Koefisien Bézout x</span>
                    <div className="text-xl font-bold font-mono text-zinc-900 mt-1">{bezoutX}</div>
                  </div>
                  <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-medium">Invers Modular d &equiv; e<sup>-1</sup> mod &phi;(n)</span>
                    <div className="text-xl font-bold font-mono text-emerald-900 mt-1">{modInverseD}</div>
                  </div>
                </div>

                {/* Steps Table */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                    Tabel Iterasi Baris (Row-Update Trace)
                  </h3>
                  <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200/80">
                        <tr>
                          <th className="px-3 py-2.5">Step</th>
                          <th className="px-3 py-2.5">q</th>
                          <th className="px-3 py-2.5">r<sub>1</sub></th>
                          <th className="px-3 py-2.5">r<sub>2</sub></th>
                          <th className="px-3 py-2.5 text-blue-700">r</th>
                          <th className="px-3 py-2.5">x<sub>1</sub></th>
                          <th className="px-3 py-2.5">x<sub>2</sub></th>
                          <th className="px-3 py-2.5 text-zinc-900 font-semibold">x</th>
                          <th className="px-3 py-2.5">y<sub>1</sub></th>
                          <th className="px-3 py-2.5">y<sub>2</sub></th>
                          <th className="px-3 py-2.5">y</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 text-zinc-700">
                        {eeaResult.steps.map((st, idx) => {
                          const d = st.details
                          return (
                            <tr key={idx} className="hover:bg-zinc-50/60 transition-colors">
                              <td className="px-3 py-2 text-zinc-400">{st.step_number ?? st.step ?? idx + 1}</td>
                              <td className="px-3 py-2 font-semibold text-zinc-900">{String(d.q ?? '-')}</td>
                              <td className="px-3 py-2">{String(d.r1 ?? '-')}</td>
                              <td className="px-3 py-2">{String(d.r2 ?? '-')}</td>
                              <td className="px-3 py-2 font-semibold text-blue-700">{String(d.r ?? '-')}</td>
                              <td className="px-3 py-2 text-zinc-500">{String(d.x1 ?? '-')}</td>
                              <td className="px-3 py-2 text-zinc-500">{String(d.x2 ?? '-')}</td>
                              <td className="px-3 py-2 font-bold text-zinc-900">{String(d.x ?? '-')}</td>
                              <td className="px-3 py-2 text-zinc-400">{String(d.y1 ?? '-')}</td>
                              <td className="px-3 py-2 text-zinc-400">{String(d.y2 ?? '-')}</td>
                              <td className="px-3 py-2 text-zinc-500">{String(d.y ?? '-')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* TAB 2: MILLER-RABIN PRIMALITY */}
      {activeTab === 'miller_rabin' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700" />
                Miller-Rabin Probabilistic Primality Test
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Menguji apakah bilangan bulat n prima atau komposit dengan menguraikan n &minus; 1 = 2<sup>s</sup> &times; d (d ganjil)
                dan mengevaluasi k saksi acak (witness) a &isin; [2, n &minus; 2].
              </p>
            </div>

            <form onSubmit={handleRunMillerRabin} className="flex flex-wrap items-end gap-3 pt-2">
              <div className="w-44">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Bilangan Uji n (e.g. 47)</label>
                <input
                  type="number"
                  value={mrN}
                  onChange={(e) => setMrN(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Rounds k (e.g. 5)</label>
                <input
                  type="number"
                  value={mrK}
                  onChange={(e) => setMrK(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={mrLoading}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-subtle disabled:opacity-50"
              >
                {mrLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Jalankan Uji Miller-Rabin
              </button>
            </form>
          </div>

          {/* Miller-Rabin Results Card */}
          {mrResult && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-zinc-600 font-mono">Hasil Primality n={mrN}:</span>
                  {mrResult.result === true ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PRIMA (PROBABLY PRIME)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" />
                      KOMPOSIT (COMPOSITE)
                    </span>
                  )}
                </div>

                <span className="text-xs text-zinc-400 font-mono">
                  Batas Error Probabilitas &le; 4<sup>-{mrK}</sup> &asymp; {(Math.pow(4, -Number(mrK)) * 100).toFixed(4)}%
                </span>
              </div>

              {/* Rounds Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Detail Pengujian Saksi Acak (Witness Rounds)
                </h3>
                <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200/80">
                      <tr>
                        <th className="px-3 py-2.5">Round</th>
                        <th className="px-3 py-2.5">Witness (a)</th>
                        <th className="px-3 py-2.5">a<sup>d</sup> mod n</th>
                        <th className="px-3 py-2.5">Status Ronde</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {mrResult.steps.map((st, idx) => {
                        const d = st.details
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/60">
                            <td className="px-3 py-2 text-zinc-400">{st.step_number ?? idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-zinc-900">{String(d.a ?? '-')}</td>
                            <td className="px-3 py-2 font-mono text-zinc-800">{String(d.x ?? d.ad_mod_n ?? '-')}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {st.operation || 'Lolos Uji'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SQUARE-AND-MULTIPLY (MODEXP) */}
      {activeTab === 'mod_exp' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-700" />
                Square-and-Multiply (Modular Exponentiation) Trace
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Menghitung base<sup>exp</sup> mod m dalam kompleksitas O(log exp) melalui representasi biner eksponen
                (metode right-to-left binary exponentiation).
              </p>
            </div>

            <form onSubmit={handleRunModExp} className="flex flex-wrap items-end gap-3 pt-2">
              <div className="w-36">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Base m (e.g. 65)</label>
                <input
                  type="number"
                  value={modBase}
                  onChange={(e) => setModBase(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="w-36">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Exponent e (e.g. 79)</label>
                <input
                  type="number"
                  value={modExp}
                  onChange={(e) => setModExp(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div className="w-36">
                <label className="block text-xs font-medium text-zinc-600 mb-1">Modulus n (e.g. 3337)</label>
                <input
                  type="number"
                  value={modMod}
                  onChange={(e) => setModMod(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={modLoading}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-4 py-2 rounded-xl text-xs transition-all shadow-subtle disabled:opacity-50"
              >
                {modLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Jalankan ModExp Trace
              </button>
            </form>
          </div>

          {/* ModExp Results Card */}
          {modResult && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-mono text-zinc-600">
                    Biner Exponent ({modExp}):{' '}
                    <strong className="text-zinc-900 font-semibold">{Number(modExp).toString(2)}</strong> (MSB ke LSB)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-mono">Hasil Akhir:</span>
                  <span className="text-sm font-bold font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {String(modResult.result)}
                  </span>
                </div>
              </div>

              {/* Steps Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                  Tabel Langkah Bit Eksekusi (Right-to-Left Trace)
                </h3>
                <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200/80">
                      <tr>
                        <th className="px-3 py-2.5">Bit Index</th>
                        <th className="px-3 py-2.5">Bit Value</th>
                        <th className="px-3 py-2.5">Operasi</th>
                        <th className="px-3 py-2.5">Base Post-Square</th>
                        <th className="px-3 py-2.5 text-right font-semibold text-zinc-900">Result Akumulasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-zinc-700">
                      {modResult.steps.map((st, idx) => {
                        const d = st.details
                        const bitVal = Number(d.bit_value)
                        return (
                          <tr key={idx} className="hover:bg-zinc-50/60">
                            <td className="px-3 py-2 text-zinc-400">{String(d.bit_index ?? idx)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  bitVal === 1
                                    ? 'bg-zinc-900 text-white'
                                    : 'bg-zinc-100 text-zinc-400'
                                }`}
                              >
                                {bitVal}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-zinc-600">{String(d.op ?? '-')}</td>
                            <td className="px-3 py-2 text-zinc-800 font-medium">{String(d.base_val ?? '-')}</td>
                            <td className="px-3 py-2 text-zinc-900 font-bold text-right">
                              {String(d.result_val ?? '-')}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CHUNKING VISUALIZER */}
      {activeTab === 'chunking' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-700" />
                Adaptive Byte Chunking Visualizer
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Visualisasi partisi teks UTF-8 ke dalam blok integer m<sub>i</sub> sedemikian rupa sehingga setiap blok m<sub>i</sub> &lt; n.
                Ukuran blok adaptif dihitung dengan rumus: B = max(1, &lfloor;(bit_length(n) &minus; 1) / 8&rfloor;).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block font-medium text-zinc-600 mb-1">Teks String Masukan</label>
                <input
                  type="text"
                  value={chunkText}
                  onChange={(e) => setChunkText(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-600 mb-1">Modulus n (e.g. 3337)</label>
                <input
                  type="number"
                  value={chunkMod}
                  onChange={(e) => setChunkMod(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* Chunking Results Grid */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-zinc-500">Bit Length n:</span>
                <div className="text-base font-bold text-zinc-900 mt-0.5">{chunkInfo.bitLength} bits</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-zinc-500">Kapasitas Blok (B):</span>
                <div className="text-base font-bold text-zinc-900 mt-0.5">{chunkInfo.blockSize} byte/blok</div>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                <span className="text-zinc-500">Jumlah Blok Integer:</span>
                <div className="text-base font-bold text-zinc-900 mt-0.5">{chunkInfo.chunks.length} blok</div>
              </div>
            </div>

            <div className="overflow-x-auto border border-zinc-200/80 rounded-xl">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200/80">
                  <tr>
                    <th className="px-3 py-2.5">Blok i</th>
                    <th className="px-3 py-2.5">Karakter</th>
                    <th className="px-3 py-2.5">Byte Hex</th>
                    <th className="px-3 py-2.5">Integer m<sub>i</sub></th>
                    <th className="px-3 py-2.5">Invarian m<sub>i</sub> &lt; n</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-700">
                  {chunkInfo.chunks.map((chk) => (
                    <tr key={chk.index} className="hover:bg-zinc-50/60">
                      <td className="px-3 py-2 text-zinc-400">#{chk.index}</td>
                      <td className="px-3 py-2 font-bold text-zinc-900">&quot;{chk.chars.join('')}&quot;</td>
                      <td className="px-3 py-2 text-zinc-500">{chk.hex}</td>
                      <td className="px-3 py-2 font-semibold text-zinc-900">{chk.intBlock}</td>
                      <td className="px-3 py-2">
                        {chk.valid ? (
                          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                            Valid (m<sub>i</sub> &lt; n)
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                            Overflow (m<sub>i</sub> &ge; n)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STANDALONE TEXT ENCRYPTION & DECRYPTION DEMO */}
      {activeTab === 'standalone' && (
        <div className="space-y-6">
          {/* Configuration Form Card */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-finpay space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[#008579] text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Demo Siklus Penuh RSA
              </div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-600" />
                Demo Enkripsi &amp; Dekripsi Teks Mandiri
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Uji coba mandiri siklus lengkap RSA di luar surat jalan: Teks UTF-8 &rarr; Byte &rarr; Blok Integer m<sub>i</sub> &lt; n &rarr; Ciphertext c<sub>i</sub> = m<sub>i</sub><sup>e</sup> mod n &rarr; Dekripsi m&#39;<sub>i</sub> = c<sub>i</sub><sup>d</sup> mod n &rarr; Rekonstruksi Teks Asli.
              </p>
            </div>

            {/* Key Presets Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Pilih Pasangan Kunci RSA:</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'academic', label: 'Preset Akademik (p=47, q=71 -> n=3337)' },
                  { id: 'A', label: 'Entitas A (PPIC)' },
                  { id: 'B', label: 'Entitas B (Pos Gerbang)' },
                  { id: 'C', label: 'Entitas C (Gudang Penerima)' },
                  { id: 'custom', label: 'Kunci Kustom / Manual' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectPreset(item.id as typeof standalonePreset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      standalonePreset === item.id
                        ? 'bg-[#081c26] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleRunStandalone} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Teks Bebas untuk Dienkripsi:
                </label>
                <textarea
                  rows={3}
                  value={standaloneText}
                  onChange={(e) => setStandaloneText(e.target.value)}
                  placeholder="Masukkan teks bebas untuk dienkripsi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-sans text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Key Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Lock className="w-3.5 h-3.5 text-teal-600" />
                    <span>Kunci Publik Enkripsi (e, n)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1 font-mono">Eksponen Publik e:</label>
                      <input
                        type="text"
                        value={standalonePubKeyE}
                        onChange={(e) => {
                          setStandalonePubKeyE(e.target.value)
                          setStandalonePreset('custom')
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1 font-mono">Modulus n:</label>
                      <input
                        type="text"
                        value={standalonePubKeyN}
                        onChange={(e) => {
                          setStandalonePubKeyN(e.target.value)
                          setStandalonePreset('custom')
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Unlock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Kunci Privat Dekripsi (d, n)</span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={standaloneWithDecrypt}
                        onChange={(e) => setStandaloneWithDecrypt(e.target.checked)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span>Dekripsi Otomatis</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1 font-mono">Eksponen Privat d:</label>
                      <input
                        type="text"
                        disabled={!standaloneWithDecrypt}
                        value={standalonePrivKeyD}
                        onChange={(e) => {
                          setStandalonePrivKeyD(e.target.value)
                          setStandalonePreset('custom')
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1 font-mono">Modulus n (Privat):</label>
                      <input
                        type="text"
                        disabled={!standaloneWithDecrypt}
                        value={standalonePrivKeyN}
                        onChange={(e) => {
                          setStandalonePrivKeyN(e.target.value)
                          setStandalonePreset('custom')
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={standaloneLoading || !standaloneText}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {standaloneLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>{standaloneLoading ? 'Memproses Enkripsi & Dekripsi...' : 'Jalankan Enkripsi & Dekripsi Teks &rarr;'}</span>
              </button>
            </form>
          </div>

          {/* Standalone Results Container */}
          {standaloneResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Overview Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-slate-500">Panjang Byte UTF-8:</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {standaloneResult.original_bytes_length} byte
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-slate-500">Bit Modulus n:</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {standaloneResult.modulus_bits} bits
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-slate-500">Kapasitas Blok (B):</span>
                  <div className="text-base font-bold text-teal-700 mt-0.5">
                    {standaloneResult.block_size_bytes} byte/blok
                  </div>
                </div>
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <span className="text-slate-500">Status Keterbalikan:</span>
                  <div className="mt-0.5">
                    {standaloneResult.is_reversible === true ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% Identik
                      </span>
                    ) : standaloneResult.decrypted_text ? (
                      <span className="inline-flex items-center gap-1 text-rose-700 font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Tidak Cocok
                      </span>
                    ) : (
                      <span className="text-slate-500 font-medium">Hanya Enkripsi</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Flow Breakdown */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-finpay space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Tahapan Alur Komputasi Kriptografi RSA Murni
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  {/* Tahap 1 & 2 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">1</span>
                      <span>Teks Asli &amp; Representasi Byte UTF-8</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 break-all text-[11px]">
                      <div className="text-slate-500">Teks: &quot;{standaloneResult.original_text}&quot;</div>
                      <div className="text-teal-700 mt-1">Hex: {standaloneResult.original_bytes_hex}</div>
                    </div>
                  </div>

                  {/* Tahap 3 & 4 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">2</span>
                      <span>Ukuran Blok Adaptif B &amp; Enkripsi c<sub>i</sub> = m<sub>i</sub><sup>e</sup> mod n</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 break-all text-[11px]">
                      <div className="text-slate-500">
                        B = max(1, &lfloor;({standaloneResult.modulus_bits} - 1) / 8&rfloor;) = {standaloneResult.block_size_bytes} byte
                      </div>
                      <div className="text-indigo-700 mt-1">
                        Ciphertext Blocks: [{standaloneResult.ciphertexts.join(', ')}]
                      </div>
                    </div>
                  </div>

                  {/* Tahap 5 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">3</span>
                      <span>Dekripsi Modular: m&#39;<sub>i</sub> = c<sub>i</sub><sup>d</sup> mod n</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 break-all text-[11px]">
                      {standaloneResult.decrypted_text !== null ? (
                        <div className="text-emerald-700">
                          Nilai plaintext integer m&#39;<sub>i</sub> sukses dipulihkan dari seluruh {standaloneResult.blocks.length} blok.
                        </div>
                      ) : (
                        <div className="text-slate-400">Dekripsi dilewati (Kunci privat tidak disediakan).</div>
                      )}
                    </div>
                  </div>

                  {/* Tahap 6 */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px]">4</span>
                      <span>Rekonstruksi Teks Plaintext Pulih</span>
                    </div>
                    <div className="p-2 rounded bg-white border border-slate-200 break-all text-[11px]">
                      {standaloneResult.decrypted_text !== null ? (
                        <div className="font-bold text-slate-900">
                          &quot;{standaloneResult.decrypted_text}&quot;
                        </div>
                      ) : (
                        <div className="text-slate-400">Belum didekripsi.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Per-Block Inspection Table */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-finpay space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-600" />
                    Tabel Rincian Transformasi Matematis Per Blok
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Total {standaloneResult.blocks.length} blok integer
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80">
                      <tr>
                        <th className="px-3 py-2.5">Blok i</th>
                        <th className="px-3 py-2.5">Byte Hex</th>
                        <th className="px-3 py-2.5">Plaintext m<sub>i</sub></th>
                        <th className="px-3 py-2.5">Rumus Enkripsi</th>
                        <th className="px-3 py-2.5">Ciphertext c<sub>i</sub></th>
                        <th className="px-3 py-2.5">Rumus Dekripsi</th>
                        <th className="px-3 py-2.5">Pulih m&#39;<sub>i</sub></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {standaloneResult.blocks.map((blk) => (
                        <tr key={blk.block_index} className="hover:bg-slate-50/70">
                          <td className="px-3 py-2 text-slate-400 font-semibold">#{blk.block_index}</td>
                          <td className="px-3 py-2 font-mono text-teal-700">{blk.raw_bytes_hex}</td>
                          <td className="px-3 py-2 font-bold text-slate-900">{blk.m}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {blk.m}<sup>{standalonePubKeyE}</sup> mod {standalonePubKeyN}
                          </td>
                          <td className="px-3 py-2 font-bold text-indigo-700">{blk.c}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {standaloneWithDecrypt ? (
                              <>{blk.c}<sup>{standalonePrivKeyD}</sup> mod {standalonePrivKeyN}</>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {blk.decrypted_m !== null && blk.decrypted_m !== undefined ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                                {blk.decrypted_m}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
