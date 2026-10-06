'use client'

import React, { useState } from 'react'
import { api } from '@/lib/api'
import type { InspectTraceResponse } from '@/types/api'
import { toast } from 'sonner'
import {
  Search,
  Calculator,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Play,
  RefreshCw,
  Binary,
} from 'lucide-react'

type TabType = 'eea' | 'miller_rabin' | 'mod_exp' | 'chunking'

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
      toast.success('Trace Miller-Rabin berhasil!')
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
      toast.success('Trace Square-and-Multiply berhasil!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menjalankan ModExp')
    } finally {
      setModLoading(false)
    }
  }

  // Chunking calculation (pure client math matching backend rsa_engine.py)
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
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-cyan-950/60 border border-cyan-700/50 rounded-lg text-cyan-400">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              Crypto Inspector & Arithmetic Debugger
            </h1>
            <p className="text-sm text-slate-400">
              Visualisasi langkah-demi-langkah modular arithmetic RSA dari implementasi scratch Python murni.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('eea')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'eea'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-x border-slate-800 border-t-cyan-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Calculator className="w-4 h-4" />
          1. Extended Euclidean (EEA)
        </button>

        <button
          onClick={() => setActiveTab('miller_rabin')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'miller_rabin'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-x border-slate-800 border-t-cyan-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          2. Miller-Rabin Primality
        </button>

        <button
          onClick={() => setActiveTab('mod_exp')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'mod_exp'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-x border-slate-800 border-t-cyan-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Zap className="w-4 h-4" />
          3. Square-and-Multiply (ModExp)
        </button>

        <button
          onClick={() => setActiveTab('chunking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'chunking'
              ? 'bg-slate-900 text-cyan-400 border-t-2 border-x border-slate-800 border-t-cyan-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Layers className="w-4 h-4" />
          4. Chunking Visualizer
        </button>
      </div>

      {/* TAB 1: EXTENDED EUCLIDEAN ALGORITHM */}
      {activeTab === 'eea' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-cyan-400" />
                Extended Euclidean Algorithm (EEA) Trace
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Menghitung $\gcd(a, b)$ dan koefisien Bézout $x, y$ sedemikian rupa sehingga $a \cdot x + b \cdot y = \gcd(a, b)$.
                Dalam RSA: mencari invers perkalian modular $d \equiv e^{-1} \pmod{\phi(n)}$.
              </p>
            </div>

            <form onSubmit={handleRunEea} className="flex flex-wrap items-end gap-4 pt-2">
              <div className="w-40">
                <label className="block text-xs font-mono text-slate-300 mb-1">Nilai a (cth: e = 79)</label>
                <input
                  type="number"
                  value={eeaA}
                  onChange={(e) => setEeaA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="w-40">
                <label className="block text-xs font-mono text-slate-300 mb-1">Nilai b (cth: φ = 3220)</label>
                <input
                  type="number"
                  value={eeaB}
                  onChange={(e) => setEeaB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={eeaLoading}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                {eeaLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 font-mono">Hasil gcd(a, b)</span>
                    <div className="text-lg font-bold font-mono text-cyan-400">{gcdVal}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 font-mono">Koefisien Bézout x</span>
                    <div className="text-lg font-bold font-mono text-amber-400">{bezoutX}</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-xs text-slate-500 font-mono">Invers Modular d = (x mod b + b) mod b</span>
                    <div className="text-lg font-bold font-mono text-emerald-400">{modInverseD}</div>
                  </div>
                </div>

              {/* Steps Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Tabel Iterasi Baris (Row-Update Trace)
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Step</th>
                        <th className="px-3 py-2.5 text-cyan-400">q</th>
                        <th className="px-3 py-2.5">r1 (old_r)</th>
                        <th className="px-3 py-2.5">r2 (r)</th>
                        <th className="px-3 py-2.5 text-cyan-400">r (new)</th>
                        <th className="px-3 py-2.5">x1 (old_s)</th>
                        <th className="px-3 py-2.5">x2 (s)</th>
                        <th className="px-3 py-2.5 text-amber-400">x (new)</th>
                        <th className="px-3 py-2.5">y1 (old_t)</th>
                        <th className="px-3 py-2.5">y2 (t)</th>
                        <th className="px-3 py-2.5 text-slate-300">y (new)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {eeaResult.steps.map((st, idx) => {
                        const d = st.details
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2 text-slate-500">{st.step_number ?? st.step ?? idx + 1}</td>
                            <td className="px-3 py-2 text-cyan-400 font-bold">{String(d.q ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-300">{String(d.r1 ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-300">{String(d.r2 ?? '-')}</td>
                            <td className="px-3 py-2 text-cyan-300 font-bold">{String(d.r ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-400">{String(d.x1 ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-400">{String(d.x2 ?? '-')}</td>
                            <td className="px-3 py-2 text-amber-400 font-bold">{String(d.x ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-500">{String(d.y1 ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-500">{String(d.y2 ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-400">{String(d.y ?? '-')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )})()}
        </div>
      )}

      {/* TAB 2: MILLER-RABIN PRIMALITY */}
      {activeTab === 'miller_rabin' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Miller-Rabin Probabilistic Primality Test
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Menguji apakah bilangan bulat $n$ prima atau komposit dengan menguraikan $n-1 = 2^s \cdot d$ ($d$ ganjil)
                dan mengevaluasi $k$ saksi acak (witness) $a \in [2, n-2]$.
              </p>
            </div>

            <form onSubmit={handleRunMillerRabin} className="flex flex-wrap items-end gap-4 pt-2">
              <div className="w-48">
                <label className="block text-xs font-mono text-slate-300 mb-1">Bilangan Uji n (cth: 47)</label>
                <input
                  type="number"
                  value={mrN}
                  onChange={(e) => setMrN(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="w-32">
                <label className="block text-xs font-mono text-slate-300 mb-1">Rounds k (cth: 5)</label>
                <input
                  type="number"
                  value={mrK}
                  onChange={(e) => setMrK(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={mrLoading}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                {mrLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Jalankan Uji Miller-Rabin
              </button>
            </form>
          </div>

          {/* Miller-Rabin Results Card */}
          {mrResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-slate-200 font-mono">Hasil Primality n={mrN}:</span>
                  {mrResult.result === true ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PRIMA (PROBABLY PRIME)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-400 bg-rose-950/50 border border-rose-700">
                      <XCircle className="w-3.5 h-3.5" />
                      KOMPOSIT (COMPOSITE)
                    </span>
                  )}
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Batas Error Probabilitas $\le 4^{`{-${mrK}}`} \approx {(Math.pow(4, -Number(mrK)) * 100).toFixed(4)}%$
                </span>
              </div>

              {/* Rounds Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Tabel Saksi Acak (Witness Rounds Trace)
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Round</th>
                        <th className="px-3 py-2.5 text-cyan-400">Witness (a)</th>
                        <th className="px-3 py-2.5">s ($2^s$)</th>
                        <th className="px-3 py-2.5">d (ganjil)</th>
                        <th className="px-3 py-2.5 text-amber-400">x_init ($a^d \bmod n$)</th>
                        <th className="px-3 py-2.5">Squarings ($x^2 \bmod n$)</th>
                        <th className="px-3 py-2.5 text-right">Status Saksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {mrResult.steps.map((st, idx) => {
                        const d = st.details
                        const squarings = Array.isArray(d.squarings) ? d.squarings : []
                        const isRoundPrime = d.result === 'prime'
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2 text-slate-500">{String(d.round ?? idx + 1)}</td>
                            <td className="px-3 py-2 text-cyan-300 font-bold">{String(d.a ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-300">{String(d.s ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-300">{String(d.d ?? '-')}</td>
                            <td className="px-3 py-2 text-amber-400 font-bold">{String(d.x_init ?? '-')}</td>
                            <td className="px-3 py-2 text-slate-400">
                              {squarings.length > 0 ? squarings.join(' → ') : '(none)'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {isRoundPrime ? (
                                <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                  Lolos Saksi
                                </span>
                              ) : (
                                <span className="text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                                  Terbukti Komposit
                                </span>
                              )}
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                Square-and-Multiply (Modular Exponentiation) Trace
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Menghitung $base^{`{exp}`} \pmod{`{mod}`}$ dalam kompleksitas $O(\log exp)$ melalui representasi biner eksponen
                (metode right-to-left binary exponentiation).
              </p>
            </div>

            <form onSubmit={handleRunModExp} className="flex flex-wrap items-end gap-4 pt-2">
              <div className="w-36">
                <label className="block text-xs font-mono text-slate-300 mb-1">Base m (cth: 65)</label>
                <input
                  type="number"
                  value={modBase}
                  onChange={(e) => setModBase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="w-36">
                <label className="block text-xs font-mono text-slate-300 mb-1">Exponent e (cth: 79)</label>
                <input
                  type="number"
                  value={modExp}
                  onChange={(e) => setModExp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="w-36">
                <label className="block text-xs font-mono text-slate-300 mb-1">Modulus n (cth: 3337)</label>
                <input
                  type="number"
                  value={modMod}
                  onChange={(e) => setModMod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={modLoading}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                {modLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Jalankan ModExp Trace
              </button>
            </form>
          </div>

          {/* ModExp Results Card */}
          {modResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300">
                    Biner Exponent ({modExp}):{' '}
                    <strong className="text-cyan-400">{Number(modExp).toString(2)}</strong> (MSB ke LSB)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Hasil Akhir:</span>
                  <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-700/60">
                    {String(modResult.result)}
                  </span>
                </div>
              </div>

              {/* Steps Table */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Tabel Langkah Bit Eksekusi (Right-to-Left Trace)
                </h3>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                      <tr>
                        <th className="px-3 py-2.5">Bit Index</th>
                        <th className="px-3 py-2.5 text-cyan-400">Bit Value</th>
                        <th className="px-3 py-2.5">Operasi</th>
                        <th className="px-3 py-2.5 text-amber-400">Base Post-Square</th>
                        <th className="px-3 py-2.5 text-emerald-400 text-right">Result Akumulasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {modResult.steps.map((st, idx) => {
                        const d = st.details
                        const bitVal = Number(d.bit_value)
                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2 text-slate-500">{String(d.bit_index ?? idx)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  bitVal === 1
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                    : 'bg-slate-950 text-slate-500 border border-slate-800'
                                }`}
                              >
                                {bitVal}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-slate-300">{String(d.op ?? '-')}</td>
                            <td className="px-3 py-2 text-amber-300 font-bold">{String(d.base_val ?? '-')}</td>
                            <td className="px-3 py-2 text-emerald-300 font-bold text-right">
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                Adaptive Byte Chunking Visualizer
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Visualisasi partisi teks UTF-8 ke dalam blok integer $m_i$ sedemikian rupa sehingga setiap blok $m_i &lt; n$.
                Ukuran blok byte $B = \max(1, \lfloor(\text{bit\_length}(n) - 1) / 8\rfloor)$.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Teks String Input</label>
                <input
                  type="text"
                  value={chunkText}
                  onChange={(e) => setChunkText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="Contoh: Hello"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">RSA Modulus n</label>
                <input
                  type="number"
                  value={chunkMod}
                  onChange={(e) => setChunkMod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-500 focus:outline-none"
                  placeholder="Contoh: 3337"
                />
              </div>
            </div>
          </div>

          {/* Chunking Analysis */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            {chunkInfo.error ? (
              <div className="text-rose-400 text-xs p-3 bg-rose-950/40 rounded border border-rose-800">
                {chunkInfo.error}
              </div>
            ) : (
              <>
                {/* Meta summary metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 font-mono">Panjang Bit Modulus n</span>
                    <div className="text-base font-bold font-mono text-cyan-400">
                      {chunkInfo.bitLength} bits
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 font-mono">Ukuran Blok B (Byte)</span>
                    <div className="text-base font-bold font-mono text-amber-400">
                      {chunkInfo.blockSize} byte(s) / blok
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 font-mono">Total Byte Plaintext</span>
                    <div className="text-base font-bold font-mono text-slate-200">
                      {chunkInfo.rawBytes.length} bytes
                    </div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-500 font-mono">Jumlah Blok Integer</span>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {chunkInfo.chunks.length} blok
                    </div>
                  </div>
                </div>

                {/* Raw Bytes Stream View */}
                <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    UTF-8 Byte Stream:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {chunkInfo.rawBytes.map((b, i) => (
                      <div
                        key={i}
                        className="px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs flex items-center gap-1.5"
                      >
                        <span className="text-slate-500">[{i}]</span>
                        <span className="text-cyan-300">
                          {b >= 32 && b <= 126 ? `'${String.fromCharCode(b)}'` : '·'}
                        </span>
                        <span className="text-slate-400">({b})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chunk blocks table */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Partisi Blok Integer $m_i$ untuk Operasi RSA
                  </h3>
                  <div className="overflow-x-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-xs text-left font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase">
                        <tr>
                          <th className="px-3 py-2.5">Blok i</th>
                          <th className="px-3 py-2.5">Karakter</th>
                          <th className="px-3 py-2.5">Bytes (Hex)</th>
                          <th className="px-3 py-2.5 text-cyan-400">Nilai Integer $m_i$</th>
                          <th className="px-3 py-2.5 text-slate-400">Pemeriksaan $m_i &lt; n$</th>
                          <th className="px-3 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                        {chunkInfo.chunks.map((c) => (
                          <tr key={c.index} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-2 text-slate-500">m_{c.index}</td>
                            <td className="px-3 py-2 text-slate-200 font-bold">&quot;{c.chars.join('')}&quot;</td>
                            <td className="px-3 py-2 text-slate-400">{c.hex}</td>
                            <td className="px-3 py-2 text-cyan-300 font-bold">{c.intBlock}</td>
                            <td className="px-3 py-2 text-slate-400">
                              {c.intBlock} &lt; {chunkMod}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {c.valid ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Valid ($m_i &lt; n$)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                                  <XCircle className="w-3 h-3" />
                                  Overflow ($m_i \ge n$)
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Math Invariant Note */}
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/50 rounded-lg text-xs text-cyan-300 flex items-start gap-2">
                  <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                  <div>
                    <strong>RSA Chunking Invariant:</strong> Dengan memilih $B = \max(1, \lfloor(\text{bit\_length}(n) - 1)/8\rfloor)$,
                    maka nilai maksimum setiap blok $m_i &lt; 256^B = 2^{8B} \le 2^{\text{bit\_length}(n)-1} &lt; n$.
                    Ini menjamin sifat satu-ke-satu (bijective) dan mencegah modulo reduction loss saat enkripsi $c = m^e \pmod n$.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
