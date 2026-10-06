'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Package,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ClipboardPaste,
  Unlock,
  Truck,
  Layers,
  Hash,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { ReceiveResponse, GatePassPackage } from '@/types/api'
import { AuditLog, addAuditEntry } from '@/components/AuditLog'

export default function ReceivingPage() {
  const [keyA, setKeyA] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)
  const [keyB, setKeyB] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)
  const [keyC, setKeyC] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)

  const [tokenInput, setTokenInput] = useState('')
  const [parsedPackage, setParsedPackage] = useState<GatePassPackage | null>(null)
  const [receiving, setReceiving] = useState(false)
  const [receiveResult, setReceiveResult] = useState<ReceiveResponse | null>(null)

  useEffect(() => {
    try {
      const aRaw = localStorage.getItem('securepass_key_A')
      if (aRaw) setKeyA(JSON.parse(aRaw))

      const bRaw = localStorage.getItem('securepass_key_B')
      if (bRaw) setKeyB(JSON.parse(bRaw))

      const cRaw = localStorage.getItem('securepass_key_C')
      if (cRaw) setKeyC(JSON.parse(cRaw))

      const savedToken = localStorage.getItem('last_token')
      if (savedToken) {
        setTokenInput(savedToken)
        tryParseToken(savedToken)
      }
    } catch (e) {
      console.error('Error loading stored keys/token', e)
    }
  }, [])

  const tryParseToken = (token: string) => {
    try {
      const decoded = atob(token.trim())
      const parsed = JSON.parse(decoded)
      setParsedPackage(parsed)
    } catch {
      setParsedPackage(null)
    }
  }

  const handleTokenChange = (val: string) => {
    setTokenInput(val)
    setReceiveResult(null)
    tryParseToken(val)
  }

  const handlePasteLastToken = () => {
    const savedToken = localStorage.getItem('last_token')
    if (savedToken) {
      setTokenInput(savedToken)
      setReceiveResult(null)
      tryParseToken(savedToken)
      toast.info('Token terbaru dimuat dari penyimpanan lokal!')
    } else {
      toast.warning('Belum ada token tersimpan di penyimpanan lokal.')
    }
  }

  const handleReceive = async () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan token surat jalan terlebih dahulu.')
      return
    }
    if (!keyA?.pub_key) {
      toast.error('Kunci Publik Entitas A (PPIC) belum dimuat.')
      return
    }
    if (!keyB?.pub_key) {
      toast.error('Kunci Publik Entitas B (Pos Gerbang) belum dimuat.')
      return
    }
    if (!keyC?.priv_key) {
      toast.error('Kunci Privat Entitas C (Gudang Penerima) belum dimuat.')
      return
    }

    setReceiving(true)
    try {
      const res = await api.receivePass({
        token_base64: tokenInput.trim(),
        pub_key_a: keyA.pub_key,
        pub_key_b: keyB.pub_key,
        priv_key_c: keyC.priv_key,
      })

      setReceiveResult(res)

      const docId = parsedPackage?.header?.pass_id || 'UNKNOWN'
      const statusLabel = res.valid_a && res.valid_b ? 'SUCCESS' : 'INVALID'
      addAuditEntry('RECEIVE_PASS', docId, statusLabel, {
        valid_a: res.valid_a,
        valid_b: res.valid_b,
        error_code: res.error_code,
        message: res.message,
      })

      if (res.valid_a && res.valid_b) {
        toast.success('Penerimaan Kargo Berhasil Disahkan!')
      } else {
        toast.error(`Penerimaan Gagal: ${res.message}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan jaringan atau format token'
      toast.error(`Receive Error: ${msg}`)
      addAuditEntry('RECEIVE_PASS', 'N/A', 'FAILED', { error: msg })
    } finally {
      setReceiving(false)
    }
  }

  const copySecretMemo = () => {
    if (!receiveResult?.decrypted_secret) return
    navigator.clipboard.writeText(receiveResult.decrypted_secret)
    toast.success('Memo rahasia disalin ke clipboard!')
  }

  const missingKeys = !keyA || !keyB || !keyC

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm uppercase tracking-wider mb-1">
          <Package className="w-4 h-4" /> Entitas C: Gudang Penerima Logistik (Warehouse Destination)
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Verifikasi Dual-Signature & Dekripsi Pesan Rahasia</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Gudang tujuan memvalidasi integritas penuh melalui dua otoritas independen: Tanda Tangan Primer PPIC (<span className="text-cyan-400 font-mono">e_A</span>)
          dan Counter-Signature Pos Gerbang (<span className="text-emerald-400 font-mono">e_B</span>). Jika kedua tanda tangan sah, memo rahasia didekripsi menggunakan Kunci Privat Gudang (<span className="text-amber-400 font-mono">d_C</span>).
        </p>
      </div>

      {/* Key Status Warnings */}
      {missingKeys && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-200">Kunci RSA Belum Lengkap: </span>
              <span className="text-amber-300/80">
                {!keyA && 'Kunci PPIC (A) belum ada. '}
                {!keyB && 'Kunci Gerbang (B) belum ada. '}
                {!keyC && 'Kunci Gudang (C) belum ada.'}
              </span>
            </div>
          </div>
          <Link
            href="/keygen"
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold text-xs transition-colors shrink-0"
          >
            <Key className="w-3.5 h-3.5" /> Buka Key Management
          </Link>
        </div>
      )}

      {/* Token Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" /> Token Surat Jalan dengan Clearance
          </h2>
          <button
            type="button"
            onClick={handlePasteLastToken}
            className="text-xs px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Tempel Token Terakhir
          </button>
        </div>

        <textarea
          rows={4}
          value={tokenInput}
          onChange={(e) => handleTokenChange(e.target.value)}
          placeholder="Tempelkan token Base64 yang telah melewati clearance pos gerbang..."
          className="w-full bg-slate-950 border border-slate-700 rounded p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 break-all"
        />

        <div className="flex justify-end">
          <button
            onClick={handleReceive}
            disabled={receiving || !tokenInput.trim()}
            className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
          >
            <ShieldCheck className="w-4 h-4" />
            {receiving ? 'Memvalidasi Dual-Signature...' : 'Verifikasi Dual-Signature & Dekripsi'}
          </button>
        </div>
      </div>

      {/* Package Payload Preview (if parsed from base64) */}
      {parsedPackage && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 font-mono">
              <Layers className="w-4 h-4 text-cyan-400" /> Manifest Pengiriman: {parsedPackage.header.pass_id}
            </h3>
            <span className="text-xs font-mono text-slate-500">
              Pengemudi: {parsedPackage.header.driver_name} ({parsedPackage.header.vehicle_plate})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400">Rincian Barang</h4>
              <div className="overflow-x-auto border border-slate-800 rounded">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Barang</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {parsedPackage.header.item_list?.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-1.5 px-3 text-cyan-300">{item.sku}</td>
                        <td className="py-1.5 px-3 text-slate-300">{item.name}</td>
                        <td className="py-1.5 px-3 text-right text-emerald-400">{item.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-mono uppercase text-slate-400">Catatan Clearance Pos</h4>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-2">
                {parsedPackage.clearance ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Petugas Gerbang:</span>
                      <span className="text-slate-200 font-semibold">{parsedPackage.clearance.officer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu Clearance:</span>
                      <span className="text-slate-300 truncate max-w-[180px]">
                        {parsedPackage.clearance.cleared_at || 'Tercatat'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Counter-Signature:</span>
                      <span className="text-amber-400 font-bold truncate max-w-[180px]">
                        {String(parsedPackage.clearance.gate_signature)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-amber-400/90 py-4 text-center">
                    ⚠️ Belum ada catatan clearance gerbang. Token ini belum disahkan oleh Pos B.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Results Section */}
      {receiveResult && (
        <div className="space-y-6">
          {/* Dual Signature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Signature A Badge */}
            <div
              className={`p-4 rounded-lg border flex items-center justify-between ${
                receiveResult.valid_a
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-700 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {receiveResult.valid_a ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold font-mono">Tanda Tangan Primer PPIC (A)</h4>
                  <p className="text-xs opacity-80">
                    {receiveResult.valid_a ? 'Valid & Terverifikasi (e_A, n_A)' : 'Gagal / Dipalsukan'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                  receiveResult.valid_a ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                }`}
              >
                {receiveResult.valid_a ? 'VALID' : 'INVALID'}
              </span>
            </div>

            {/* Signature B Badge */}
            <div
              className={`p-4 rounded-lg border flex items-center justify-between ${
                receiveResult.valid_b
                  ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
                  : 'bg-rose-950/50 border-rose-700 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {receiveResult.valid_b ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold font-mono">Counter-Signature Pos Gerbang (B)</h4>
                  <p className="text-xs opacity-80">
                    {receiveResult.valid_b ? 'Valid & Terverifikasi (e_B, n_B)' : 'Tidak Ada / Invalid'}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-mono font-bold ${
                  receiveResult.valid_b ? 'bg-emerald-900/60 text-emerald-300' : 'bg-rose-900/60 text-rose-300'
                }`}
              >
                {receiveResult.valid_b ? 'VALID' : 'INVALID'}
              </span>
            </div>
          </div>

          {/* Final Outcome Banner */}
          {receiveResult.valid_a && receiveResult.valid_b ? (
            <div className="p-5 rounded-lg bg-emerald-950/60 border border-emerald-700 shadow-xl space-y-2">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                <h3 className="text-xl font-bold text-emerald-300 font-mono">
                  DUAL-VERIFICATION SUCCESS: CARGO RELEASE CLEARED
                </h3>
              </div>
              <p className="text-sm text-emerald-200/90 pl-10">{receiveResult.message}</p>
            </div>
          ) : (
            <div className="p-5 rounded-lg bg-rose-950/60 border border-rose-700 shadow-xl space-y-2">
              <div className="flex items-center gap-3">
                <XCircle className="w-7 h-7 text-rose-400" />
                <h3 className="text-xl font-bold text-rose-300 font-mono">
                  VERIFIKASI GAGAL: PELEPASAN KARGO DITOLAK
                </h3>
              </div>
              <p className="text-sm text-rose-200/90 pl-10">{receiveResult.message}</p>
              {receiveResult.error_code && (
                <p className="text-xs text-rose-400 pl-10 font-mono">Kode Error: {receiveResult.error_code}</p>
              )}
            </div>
          )}

          {/* Decrypted Secret Memo Card */}
          {receiveResult.decrypted_secret && (
            <div className="bg-slate-900 border border-amber-600/60 rounded-lg p-6 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Unlock className="w-5 h-5" /> Catatan Rahasia Terdekripsi (Plaintext Memo)
                </div>
                <button
                  onClick={copySecretMemo}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Memo
                </button>
              </div>

              <div className="p-4 bg-slate-950 rounded border border-amber-900/50 text-sm font-mono text-amber-200 leading-relaxed break-words">
                {receiveResult.decrypted_secret}
              </div>

              <p className="text-xs text-slate-500 font-mono">
                Memo ini berhasil didekripsi menggunakan Kunci Privat Gudang (d_C, n_C) melalui rumus m_i = c_i^d mod n.
                Integritas rantai pasok terbukti aman dari titik asal (PPIC) hingga gudang tujuan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Footer */}
      <AuditLog />
    </div>
  )
}
