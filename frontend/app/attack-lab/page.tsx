'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ShieldAlert,
  Flame,
  Binary,
  Layers,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ClipboardPaste,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { loadKeyringFromStorage } from '@/lib/keyring'
import type { AttackResult } from '@/types/api'

type TabType = 'tamper' | 'rogue_signer' | 'corrupt_sig' | 'replay'

function AttackLabContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>('tamper')
  const [tokenInput, setTokenInput] = useState('')
  const [pubKeyA, setPubKeyA] = useState<[number, number]>([79, 3337])

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
    // Check URL search params for token
    const urlToken = searchParams.get('token')
    if (urlToken) {
      setTokenInput(urlToken)
    } else {
      const savedToken = localStorage.getItem('last_token')
      if (savedToken) setTokenInput(savedToken)
    }

    const keyring = loadKeyringFromStorage()
    if (keyring.A?.pub_key) {
      setPubKeyA(keyring.A.pub_key)
    }
  }, [searchParams])

  const handlePasteLastToken = () => {
    const savedToken = localStorage.getItem('last_token')
    if (savedToken) {
      setTokenInput(savedToken)
      setResult(null)
      toast.info('Token terbaru dimuat dari penyimpanan lokal!')
    } else {
      toast.warning('Belum ada token tersimpan di penyimpanan.')
    }
  }

  const handleSimulateAttack = async () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan token surat jalan (GatePassPackage) terlebih dahulu.')
      return
    }

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
      toast.error(`Serangan Berhasil Dideteksi & Digagalkan: ${res.status}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal mengeksekusi simulasi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <Flame className="w-3.5 h-3.5" /> Cyber Attack Simulation Lab
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Kriptanalisis &amp; Pengujian Serangan</h1>
        <p className="text-zinc-600 text-sm mt-1 max-w-2xl">
          Uji ketahanan matematis RSA terhadap manipulasi muatan (TC-03), penandatangan palsu (TC-04), kerusakan bit signature
          (TC-05), dan serangan replay token bekas (TC-06).
        </p>
      </div>

      {/* Target Token Input Bar */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
            <Binary className="w-3.5 h-3.5 text-zinc-500" />
            Target Token Surat Jalan (Base64)
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePasteLastToken}
              className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 flex items-center gap-1 transition-colors"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Muat Token Pipeline Aktif</span>
            </button>
            <Link
              href="/"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Buka Pipeline <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <textarea
          rows={2}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste string Base64 GatePassPackage di sini..."
          className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-[11px] text-zinc-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
        />

        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
          <span>Verifikasi Public Key PPIC: e={pubKeyA[0]}, n={pubKeyA[1]}</span>
          <span>{tokenInput ? `${tokenInput.length} karakter` : 'Belum ada token'}</span>
        </div>
      </div>

      {/* Scenario Selection Tabs */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-4 shadow-card space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => {
              setActiveTab('tamper')
              setResult(null)
            }}
            className={`p-3 rounded-xl text-left border transition-all ${
              activeTab === 'tamper'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-subtle'
                : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 text-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono opacity-70">TC-03</div>
            <div className="text-xs font-semibold mt-0.5">Manipulasi Muatan</div>
            <div className="text-[10px] opacity-70 mt-0.5">Data Tampering</div>
          </button>

          <button
            onClick={() => {
              setActiveTab('rogue_signer')
              setResult(null)
            }}
            className={`p-3 rounded-xl text-left border transition-all ${
              activeTab === 'rogue_signer'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-subtle'
                : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 text-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono opacity-70">TC-04</div>
            <div className="text-xs font-semibold mt-0.5">Penandatangan Palsu</div>
            <div className="text-[10px] opacity-70 mt-0.5">Rogue Signer</div>
          </button>

          <button
            onClick={() => {
              setActiveTab('corrupt_sig')
              setResult(null)
            }}
            className={`p-3 rounded-xl text-left border transition-all ${
              activeTab === 'corrupt_sig'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-subtle'
                : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 text-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono opacity-70">TC-05</div>
            <div className="text-xs font-semibold mt-0.5">Kerusakan Bit Tanda Tangan</div>
            <div className="text-[10px] opacity-70 mt-0.5">Bit Corruption</div>
          </button>

          <button
            onClick={() => {
              setActiveTab('replay')
              setResult(null)
            }}
            className={`p-3 rounded-xl text-left border transition-all ${
              activeTab === 'replay'
                ? 'border-zinc-900 bg-zinc-900 text-white shadow-subtle'
                : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/60 text-zinc-700'
            }`}
          >
            <div className="text-[11px] font-mono opacity-70">TC-06</div>
            <div className="text-xs font-semibold mt-0.5">Serangan Replay Token</div>
            <div className="text-[10px] opacity-70 mt-0.5">Nonce Reuse</div>
          </button>
        </div>

        {/* Tab Specific Configuration */}
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/70 space-y-4">
          {activeTab === 'tamper' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-800">
                Pilih Parameter yang Dimanipulasi di Jalan (Man-in-the-Middle)
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="tamper"
                    checked={tamperType === 'qty'}
                    onChange={() => setTamperType('qty')}
                    className="accent-zinc-900"
                  />
                  <span>Manipulasi Jumlah Muatan (Qty)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer">
                  <input
                    type="radio"
                    name="tamper"
                    checked={tamperType === 'plate'}
                    onChange={() => setTamperType('plate')}
                    className="accent-zinc-900"
                  />
                  <span>Manipulasi Plat Kendaraan (Nopol)</span>
                </label>
              </div>

              {tamperType === 'qty' ? (
                <div className="max-w-xs">
                  <label className="block text-[11px] text-zinc-500 mb-1">Nilai Qty Baru (Palsu):</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    placeholder="Contoh: 9999"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              ) : (
                <div className="max-w-xs">
                  <label className="block text-[11px] text-zinc-500 mb-1">Nomor Plat Palsu:</label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    placeholder="Contoh: B 6666 HCK"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'rogue_signer' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-800">
                Simulasi Kunci Privat Penyerang Palsu (Bukan Kunci PPIC Sah)
              </div>
              <p className="text-xs text-zinc-500">
                Penyerang mencoba menerbitkan manifest sah dengan menandatanganinya menggunakan pasangan kunci acak miliknya sendiri.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Rogue Private Exponent (d):</label>
                  <input
                    type="number"
                    value={rogueD}
                    onChange={(e) => setRogueD(Number(e.target.value))}
                    placeholder="Contoh: 2753"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Rogue Modulus (n):</label>
                  <input
                    type="number"
                    value={rogueN}
                    onChange={(e) => setRogueN(Number(e.target.value))}
                    placeholder="Contoh: 3233"
                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'corrupt_sig' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-zinc-800">
                Simulasi Gangguan Transmisi / Bit Flipping pada Nilai Signature
              </div>
              <p className="text-xs text-zinc-500">
                Nilai tanda tangan S dirusak sebesar selisih Δ. Karena aritmatika modulo RSA, perubahan sekecil 1 bit akan
                menghasilkan nilai dekripsi yang jauh berbeda dari hash yang diharapkan.
              </p>
              <div className="max-w-xs">
                <label className="block text-[11px] text-zinc-500 mb-1">Nilai Delta Modifikasi (Δ):</label>
                <input
                  type="number"
                  value={sigDelta}
                  onChange={(e) => setSigDelta(Number(e.target.value))}
                  placeholder="Contoh: 1"
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>
          )}

          {activeTab === 'replay' && (
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-zinc-800">
                Simulasi Serangan Replay Token Bekas (Nonce Duplication)
              </div>
              <p className="text-zinc-500 leading-relaxed">
                Penyerang mencegat token yang telah sukses melewati pos gerbang sebelumnya dan mencoba mengirimkan truk kedua
                dengan token yang identik. Sistem akan menolak karena Nonce acak berumur satu kali pakai telah dicatat di Nonce Registry.
              </p>
            </div>
          )}

          {/* Execute Attack Simulation Button */}
          <button
            onClick={handleSimulateAttack}
            disabled={loading || !tokenInput}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Menjalankan Simulasi Serangan...' : 'Injeksi Serangan Sekarang →'}</span>
          </button>
        </div>

        {/* Attack Diagnostic Result Card */}
        {result && (
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-mono font-semibold">
                  <XCircle className="w-3.5 h-3.5" /> STATUS: {result.status}
                </div>
                <h4 className="text-base font-bold text-rose-950">{result.error_code}</h4>
                <p className="text-xs text-rose-900">{result.message}</p>
              </div>
            </div>

            {/* Mathematical Proof Box */}
            <div className="p-4 rounded-xl bg-white border border-rose-200/80 space-y-3 text-xs">
              <div className="font-semibold text-zinc-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Pembuktian Matematis Kegagalan (RSA Mathematical Verification)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="text-zinc-500 text-[11px]">Hash Dokumen Dihitung: H(M′) mod n</div>
                  <div className="font-bold text-zinc-900 mt-0.5">
                    {String(result.details?.computed_digest ?? 'N/A')}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                  <div className="text-zinc-500 text-[11px]">Hash Dipulihkan dari Signature: S<sup>e</sup> mod n</div>
                  <div className="font-bold text-rose-700 mt-0.5">
                    {String(result.details?.recovered_digest_from_sig ?? result.details?.recovered_digest ?? 'N/A')}
                  </div>
                </div>
              </div>

              <p className="text-zinc-600 text-[11px] leading-relaxed">
                <strong>Analisis Sistem:</strong> {result.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AttackLabPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto p-8 text-xs text-zinc-500">Memuat Attack Lab...</div>}>
      <AttackLabContent />
    </Suspense>
  )
}
