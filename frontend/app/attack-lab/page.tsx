'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Zap,
  ShieldAlert,
  Terminal,
  AlertTriangle,
  ClipboardPaste,
  Key,
  Flame,
  Fingerprint,
  RotateCcw,
  Binary,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { AttackResult } from '@/types/api'
import { AuditLog, addAuditEntry } from '@/components/AuditLog'

type TabType = 'tamper' | 'rogue_signer' | 'corrupt_sig' | 'replay'

export default function AttackLabPage() {
  const [activeTab, setActiveTab] = useState<TabType>('tamper')
  const [tokenInput, setTokenInput] = useState('')
  const [keyA, setKeyA] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)

  // Skenario 1: Tamper
  const [tamperType, setTamperType] = useState<'qty' | 'plate'>('qty')
  const [newQty, setNewQty] = useState(9999)
  const [newPlate, setNewPlate] = useState('B 6666 HCK')

  // Skenario 2: Rogue Signer
  const [rogueD, setRogueD] = useState(2753)
  const [rogueN, setRogueN] = useState(3233)

  // Skenario 3: Corrupt Sig
  const [sigDelta, setSigDelta] = useState(1)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AttackResult | null>(null)

  useEffect(() => {
    try {
      const aRaw = localStorage.getItem('securepass_key_A')
      if (aRaw) setKeyA(JSON.parse(aRaw))

      const savedToken = localStorage.getItem('last_token')
      if (savedToken) setTokenInput(savedToken)
    } catch (e) {
      console.error('Error loading stored keys/token', e)
    }
  }, [])

  const handlePasteLastToken = () => {
    const savedToken = localStorage.getItem('last_token')
    if (savedToken) {
      setTokenInput(savedToken)
      setResult(null)
      toast.info('Token terbaru dimuat dari penyimpanan!')
    } else {
      toast.warning('Belum ada token tersimpan di penyimpanan.')
    }
  }

  const handleSimulateAttack = async () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan token surat jalan (GatePassPackage) terlebih dahulu.')
      return
    }

    const pubKeyA = keyA?.pub_key || [79, 3337]

    setLoading(true)
    setResult(null)

    try {
      let modifications: Record<string, unknown> = {}
      let rogueKey: [number, number] | undefined = undefined

      if (activeTab === 'tamper') {
        if (tamperType === 'qty') {
          modifications = { item_index: 0, new_qty: Number(newQty) }
        } else {
          modifications = { vehicle_plate: newPlate.trim() }
        }
      } else if (activeTab === 'rogue_signer') {
        rogueKey = [Number(rogueD), Number(rogueN)]
      } else if (activeTab === 'corrupt_sig') {
        modifications = { sig_corruption: Number(sigDelta) }
      }

      const payload = {
        attack_type: activeTab,
        token_base64: tokenInput.trim(),
        pub_key_a: pubKeyA,
        modifications,
        rogue_priv_key: rogueKey,
      }

      const res = await api.simulateAttack(payload)
      setResult(res)

      addAuditEntry('ATTACK_SIMULATION', activeTab.toUpperCase(), 'BLOCKED', {
        attack_type: activeTab,
        status: res.status,
        error_code: res.error_code,
        message: res.message,
      })

      toast.error(`Serangan Terdeteksi & Digagalkan: ${res.status}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan eksekusi simulasi'
      toast.error(`Simulasi Gagal: ${msg}`)
      addAuditEntry('ATTACK_SIMULATION', activeTab.toUpperCase(), 'ERROR', { error: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-rose-400 font-mono text-sm uppercase tracking-wider mb-1">
          <Flame className="w-4 h-4" /> Lab Kriptanalisis & Pengujian Keamanan Siber
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Simulasi Serangan Kriptografi (Attack Lab)</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Buktikan secara matematis mengapa sistem SecurePass RSA kebal terhadap pemalsuan muatan, penandatangan palsu,
          kerusakan bit transmisi, dan serangan replay. Setiap manipulasi akan digagalkan oleh sifat modulo satu arah RSA.
        </p>
      </div>

      {/* Missing Key Warning */}
      {!keyA && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Kunci Publik PPIC (Entitas A) belum dimuat. Menggunakan default testing [79, 3337].</span>
          </div>
          <Link
            href="/keygen"
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
          >
            <Key className="w-3.5 h-3.5" /> Buka Key Management
          </Link>
        </div>
      )}

      {/* Token Input Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Binary className="w-3.5 h-3.5 text-cyan-400" /> Target Gate Pass Token (Base64)
          </label>
          <button
            onClick={handlePasteLastToken}
            className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1 transition-colors"
          >
            <ClipboardPaste className="w-3 h-3" /> Tempel Token Terakhir
          </button>
        </div>
        <textarea
          rows={3}
          value={tokenInput}
          onChange={(e) => {
            setTokenInput(e.target.value)
            setResult(null)
          }}
          placeholder="Tempelkan token Base64 yang akan diuji ketahanannya..."
          className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-xs text-slate-300 focus:outline-none focus:border-rose-500 break-all"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setActiveTab('tamper')
            setResult(null)
          }}
          className={`px-4 py-2 text-sm font-mono rounded-t transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tamper'
              ? 'bg-rose-950/80 text-rose-300 border-t-2 border-rose-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> 1. Payload Tampering
        </button>

        <button
          onClick={() => {
            setActiveTab('rogue_signer')
            setResult(null)
          }}
          className={`px-4 py-2 text-sm font-mono rounded-t transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rogue_signer'
              ? 'bg-rose-950/80 text-rose-300 border-t-2 border-rose-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Fingerprint className="w-4 h-4" /> 2. Rogue Signer
        </button>

        <button
          onClick={() => {
            setActiveTab('corrupt_sig')
            setResult(null)
          }}
          className={`px-4 py-2 text-sm font-mono rounded-t transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'corrupt_sig'
              ? 'bg-rose-950/80 text-rose-300 border-t-2 border-rose-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" /> 3. Signature Corruption
        </button>

        <button
          onClick={() => {
            setActiveTab('replay')
            setResult(null)
          }}
          className={`px-4 py-2 text-sm font-mono rounded-t transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'replay'
              ? 'bg-rose-950/80 text-rose-300 border-t-2 border-rose-500 border-x border-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> 4. Replay Attack
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* TAB 1: PAYLOAD TAMPERING */}
        {activeTab === 'tamper' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Skenario 1: Manipulasi Muatan (Payload Tampering)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Penyerang man-in-the-middle memodifikasi kuantitas barang atau nomor plat kendaraan di tengah perjalanan
                tanpa memiliki Kunci Privat PPIC.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div
                onClick={() => setTamperType('qty')}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  tamperType === 'qty'
                    ? 'bg-rose-950/40 border-rose-600 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-semibold text-xs mb-1">Ubah Kuantitas Barang (Item Quantity)</div>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-rose-300 mt-1"
                />
                <span className="text-[11px] opacity-75 mt-1 block">Contoh: Ganti jumlah barang menjadi 9999 unit.</span>
              </div>

              <div
                onClick={() => setTamperType('plate')}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  tamperType === 'plate'
                    ? 'bg-rose-950/40 border-rose-600 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="font-semibold text-xs mb-1">Ganti Nomor Plat Kendaraan</div>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-rose-300 mt-1"
                />
                <span className="text-[11px] opacity-75 mt-1 block">Contoh: Plat dialihkan ke kendaraan ilegal.</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROGUE SIGNER */}
        {activeTab === 'rogue_signer' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Skenario 2: Penandatangan Palsu (Rogue Signer)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Pihak ketiga menghasilkan kunci RSA miliknya sendiri dan menandatangani manifest palsu, berusaha berpura-pura
                menjadi PPIC resmi. Pos gerbang akan mendeteksi karena verifikasi menggunakan Kunci Publik resmi PPIC.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Rogue Private Exponent (d)</label>
                <input
                  type="number"
                  value={rogueD}
                  onChange={(e) => setRogueD(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Rogue Modulus (n)</label>
                <input
                  type="number"
                  value={rogueN}
                  onChange={(e) => setRogueN(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SIGNATURE CORRUPTION */}
        {activeTab === 'corrupt_sig' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Skenario 3: Kerusakan Tanda Tangan (Signature Corruption)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Nilai integer tanda tangan digital diubah atau mengalami bit-flip selama transmisi (S' = S + delta).
                Karena sifat matematika eksponensiasi modular, perubahan sekecil 1 bit akan menghasilkan digest yang sama sekali acak.
              </p>
            </div>

            <div className="max-w-md pt-2">
              <label className="block text-xs font-mono text-slate-400 mb-1">Distorsi Integer Signature (Delta Offset)</label>
              <input
                type="number"
                value={sigDelta}
                onChange={(e) => setSigDelta(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                S_corrupted = S_original + {sigDelta}
              </span>
            </div>
          </div>
        )}

        {/* TAB 4: REPLAY ATTACK */}
        {activeTab === 'replay' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-200">Skenario 4: Serangan Replay (Replay Attack)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Truk kedua mencoba menggunakan kembali token surat jalan lama yang sudah pernah disahkan dan diselesaikan di pos gerbang.
                Sistem mendeteksi bahwa UUID-v4 Nonce unik pada paket ini sudah terdaftar dalam nonce registry.
              </p>
            </div>
            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 font-mono">
              Registri nonce mencatat setiap token yang telah melewati stage penerbitan/clearance. Token tidak dapat dipakai ulang untuk meloloskan muatan kedua.
            </div>
          </div>
        )}

        {/* Attack Trigger Button */}
        <div className="pt-2">
          <button
            onClick={handleSimulateAttack}
            disabled={loading || !tokenInput.trim()}
            className="w-full py-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-rose-950/60"
          >
            <ShieldAlert className="w-5 h-5" />
            {loading ? 'Mengeksekusi Simulasi Kriptanalisis...' : `Luncurkan Serangan: ${activeTab.toUpperCase()}`}
          </button>
        </div>
      </div>

      {/* Red Terminal Console for Attack Detection */}
      {result && (
        <div className="rounded-lg bg-slate-950 border-2 border-rose-700/80 shadow-2xl p-6 font-mono space-y-4">
          {/* Terminal Title Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-rose-900/60 text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Terminal className="w-4 h-4" />
              <span>SECURITY LOG CONSOLE — ATTACK DETECTION MONITOR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-rose-400 font-semibold">{result.status}</span>
            </div>
          </div>

          {/* Banner */}
          <div className="p-3 rounded bg-rose-950/70 border border-rose-700/70 text-rose-200 text-sm">
            <div className="font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              DETECTION RESULT: {result.status} ({result.error_code})
            </div>
            <p className="mt-1 text-xs opacity-90 text-rose-300">{result.message}</p>
          </div>

          {/* Mathematical Failure Explanation */}
          <div className="space-y-2 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider block">
              Analisis Kegagalan Matematika RSA:
            </span>

            {activeTab === 'tamper' && (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
                <p className="text-rose-400 font-semibold">
                  H(M_tampered) mod n ≠ S^e mod n
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Computed Hash H(M'):</span>
                    <span className="text-rose-300 font-bold">{String(result.details.computed_digest)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Digest from Signature (S^e mod n):</span>
                    <span className="text-cyan-300 font-bold">{String(result.details.recovered_digest_from_sig)}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Integritas gagal: Modifikasi payload sekecil apapun merusak kesetaraan hash polinomial.
                </p>
              </div>
            )}

            {activeTab === 'rogue_signer' && (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
                <p className="text-rose-400 font-semibold">
                  (S_rogue)^e_A mod n_A ≠ H(M)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Digest Sebenarnya:</span>
                    <span className="text-cyan-300 font-bold">{String(result.details.expected_digest)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hasil Dekripsi dengan Kunci PPIC:</span>
                    <span className="text-rose-300 font-bold">{String(result.details.recovered_digest)}</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Otentisitas gagal: Kunci privat penyerang tidak memiliki invers modulo yang cocok dengan kunci publik resmi PPIC.
                </p>
              </div>
            )}

            {activeTab === 'corrupt_sig' && (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
                <p className="text-rose-400 font-semibold">
                  (S + delta)^e mod n menghasilkan angka acak
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Signature Asli vs Terdistorsi:</span>
                    <span className="text-slate-300 font-bold">
                      {String(result.details.original_signature)} → {String(result.details.corrupted_signature)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hasil Rekonstruksi Acak:</span>
                    <span className="text-rose-300 font-bold">{String(result.details.recovered_digest)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'replay' && (
              <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-2 text-slate-300">
                <p className="text-amber-400 font-semibold">
                  Nonce Collision Terdeteksi pada Nonce Registry
                </p>
                <div className="text-[11px] space-y-1">
                  <div>
                    <span className="text-slate-500">Nonce Terblokir: </span>
                    <span className="text-amber-300">{String(result.details.nonce)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Pass ID: </span>
                    <span className="text-slate-300">{String(result.details.pass_id)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Raw Diagnostics JSON */}
          <div className="pt-2">
            <span className="text-slate-500 text-[11px] block mb-1">Rincian Variabel Kriptografi Internal:</span>
            <pre className="p-3 bg-slate-900 rounded border border-rose-900/50 text-[11px] text-rose-300/80 overflow-x-auto max-h-48">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Audit Log Footer */}
      <AuditLog />
    </div>
  )
}
