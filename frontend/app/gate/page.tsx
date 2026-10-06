'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  DoorOpen,
  Key,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ClipboardPaste,
  ArrowRight,
  Layers,
  Truck,
  User,
  MapPin,
  Calendar,
  PenTool,
  Hash,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import type { GateVerifyResponse, ClearanceResponse } from '@/types/api'
import { AuditLog, addAuditEntry } from '@/components/AuditLog'

export default function GatePage() {
  const [keyA, setKeyA] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)
  const [keyB, setKeyB] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)

  const [tokenInput, setTokenInput] = useState('')
  const [officerId, setOfficerId] = useState('OFFICER-B01')
  const [gateId, setGateId] = useState('GATE-OUT-01')

  const [verifying, setVerifying] = useState(false)
  const [clearing, setClearing] = useState(false)

  const [verifyResult, setVerifyResult] = useState<GateVerifyResponse | null>(null)
  const [clearanceResult, setClearanceResult] = useState<ClearanceResponse | null>(null)

  useEffect(() => {
    try {
      const aRaw = localStorage.getItem('securepass_key_A')
      if (aRaw) setKeyA(JSON.parse(aRaw))

      const bRaw = localStorage.getItem('securepass_key_B')
      if (bRaw) setKeyB(JSON.parse(bRaw))

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
      setVerifyResult(null)
      setClearanceResult(null)
      toast.info('Token terbaru dimuat dari penyimpanan lokal!')
    } else {
      toast.warning('Belum ada token tersimpan di penyimpanan lokal.')
    }
  }

  const handleVerify = async () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan string token Gate Pass terlebih dahulu.')
      return
    }
    if (!keyA || !keyA.pub_key) {
      toast.error('Kunci Publik Entitas A (PPIC) tidak ditemukan! Buat kunci di Key Management.')
      return
    }

    setVerifying(true)
    setClearanceResult(null)
    try {
      const res = await api.gateVerify({
        token_base64: tokenInput.trim(),
        pub_key_a: keyA.pub_key,
      })

      setVerifyResult(res)

      const docId = res.manifest?.pass_id || 'UNKNOWN'
      const statusLabel = res.valid ? 'VALID' : res.is_replayed ? 'REPLAY' : 'INVALID'
      addAuditEntry('GATE_VERIFY', docId, statusLabel, {
        message: res.message,
        error_code: res.error_code,
        digest_expected: res.digest_expected,
        digest_recovered: res.digest_recovered,
      })

      if (res.valid) {
        toast.success('Verifikasi Berhasil! Manifest sah dan otentik.')
      } else if (res.is_replayed) {
        toast.warning('Peringatan Replay Attack! Token pernah digunakan.')
      } else {
        toast.error(`Verifikasi Gagal: ${res.message}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kesalahan jaringan atau format token'
      toast.error(`Verifikasi Error: ${msg}`)
      addAuditEntry('GATE_VERIFY', 'N/A', 'INVALID', { error: msg })
    } finally {
      setVerifying(false)
    }
  }

  const handleApproveClearance = async () => {
    if (!tokenInput.trim()) {
      toast.error('Token tidak valid.')
      return
    }
    if (!keyB || !keyB.priv_key) {
      toast.error('Kunci Privat Pos Gerbang (Entity B) tidak ditemukan! Buat kunci di Key Management.')
      return
    }
    if (!verifyResult || !verifyResult.valid) {
      toast.error('Harap lakukan verifikasi token terlebih dahulu sebelum memberikan approval clearance.')
      return
    }

    setClearing(true)
    try {
      const res = await api.gateClearance({
        token_base64: tokenInput.trim(),
        priv_key_b: keyB.priv_key,
        officer_id: officerId.trim(),
        gate_id: gateId.trim(),
      })

      setClearanceResult(res)
      setTokenInput(res.updated_token_base64)
      localStorage.setItem('last_token', res.updated_token_base64)

      const docId = verifyResult.manifest?.pass_id || 'UNKNOWN'
      addAuditEntry('GATE_CLEARANCE', docId, 'CLEARED', {
        officer_id: officerId,
        gate_id: gateId,
        clearance: res.clearance,
      })

      toast.success('Approval Clearance Berhasil! Dokumen di-counter-sign oleh Pos Gerbang.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses clearance'
      toast.error(`Clearance Error: ${msg}`)
      addAuditEntry('GATE_CLEARANCE', verifyResult?.manifest?.pass_id || 'UNKNOWN', 'FAILED', { error: msg })
    } finally {
      setClearing(false)
    }
  }

  const copyUpdatedToken = () => {
    if (!clearanceResult?.updated_token_base64) return
    navigator.clipboard.writeText(clearanceResult.updated_token_base64)
    toast.success('Token dengan Counter-Signature disalin ke clipboard!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm uppercase tracking-wider mb-1">
          <DoorOpen className="w-4 h-4" /> Entitas B: Pos Gerbang Pemeriksaan (Gate Security)
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Verifikasi Integritas & Clearance Pos</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Pos gerbang memeriksa keabsahan tanda tangan primer Entitas A menggunakan Kunci Publik PPIC (<span className="text-cyan-400 font-mono">e_A, n_A</span>),
          memastikan pass belum kadaluarsa, mendeteksi serangan replay melalui registri nonce, dan membubuhkan tanda tangan kedua (Counter-Signature).
        </p>
      </div>

      {/* Key Status Warnings */}
      {(!keyA || !keyB) && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-200">Kunci RSA Belum Lengkap: </span>
              <span className="text-amber-300/80">
                {!keyA && 'Kunci PPIC (A) belum ada. '}
                {!keyB && 'Kunci Pos Gerbang (B) belum ada.'}
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

      {/* Token Input Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <h2 className="text-base font-semibold text-slate-200 flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-400" /> Masukkan Token Surat Jalan (Base64)
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
          onChange={(e) => {
            setTokenInput(e.target.value)
            setVerifyResult(null)
            setClearanceResult(null)
          }}
          placeholder="Tempelkan token Base64 GatePassPackage di sini..."
          className="w-full bg-slate-950 border border-slate-700 rounded p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500 break-all"
        />

        <div className="flex justify-end">
          <button
            onClick={handleVerify}
            disabled={verifying || !tokenInput.trim()}
            className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-cyan-950/40"
          >
            <ShieldCheck className="w-4 h-4" />
            {verifying ? 'Memeriksa Integritas...' : 'Verifikasi Integritas'}
          </button>
        </div>
      </div>

      {/* Verification Result Banner & Details */}
      {verifyResult && (
        <div className="space-y-6">
          {/* Status Banner */}
          {verifyResult.valid ? (
            <div className="p-4 rounded-lg bg-emerald-950/60 border border-emerald-700 text-emerald-300 flex items-start gap-3 shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-emerald-300 font-mono">STATUS: VALID & AUTHENTIC</h3>
                <p className="text-sm text-emerald-200/90 mt-1">{verifyResult.message}</p>
                <p className="text-xs text-emerald-400/80 mt-1 font-mono">
                  Matematika RSA: H(M) mod n = S^e mod n terbukti identik. Tanda tangan sah berasal dari PPIC.
                </p>
              </div>
            </div>
          ) : verifyResult.is_replayed ? (
            <div className="p-4 rounded-lg bg-amber-950/60 border border-amber-700 text-amber-300 flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-amber-300 font-mono">STATUS: REPLAY ATTACK DETECTED</h3>
                <p className="text-sm text-amber-200/90 mt-1">{verifyResult.message}</p>
                <p className="text-xs text-amber-400/80 mt-1 font-mono">
                  Kode Nonce unik pada paket ini pernah diproses sebelumnya! Truk terduga menggunakan token ganda.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-700 text-rose-300 flex items-start gap-3 shadow-lg">
              <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-rose-300 font-mono">STATUS: INVALID / MANIFEST TAMPERED</h3>
                <p className="text-sm text-rose-200/90 mt-1">{verifyResult.message}</p>
                <p className="text-xs text-rose-400/80 mt-1 font-mono">
                  Kode Error: {verifyResult.error_code ?? 'HASH_MISMATCH'}. Tanda tangan gagal dicocokkan dengan payload.
                </p>
              </div>
            </div>
          )}

          {/* Cryptographic Comparison Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-cyan-400" /> Expected Digest: H(M) mod n
              </span>
              <p className="text-base text-cyan-300 font-bold break-all">
                {verifyResult.digest_expected !== null && verifyResult.digest_expected !== undefined
                  ? String(verifyResult.digest_expected)
                  : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-500">
                Dihitung dari canonical serialization manifest JSON aktual di pos gerbang.
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Recovered Digest: S^e mod n
              </span>
              <p className="text-base text-amber-300 font-bold break-all">
                {verifyResult.digest_recovered !== null && verifyResult.digest_recovered !== undefined
                  ? String(verifyResult.digest_recovered)
                  : 'N/A'}
              </p>
              <p className="text-[11px] text-slate-500">
                Didekripsi dari tanda tangan primer menggunakan Kunci Publik PPIC (e, n).
              </p>
            </div>
          </div>

          {/* Decoded Manifest Information */}
          {verifyResult.manifest && (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" /> Manifest Fisik Muatan
                </h3>
                <span className="font-mono text-xs text-cyan-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                  {verifyResult.manifest.pass_id}
                </span>
              </div>

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1 mb-1">
                    <Truck className="w-3 h-3" /> Plat Kendaraan
                  </span>
                  <span className="text-slate-200 font-semibold">{verifyResult.manifest.vehicle_plate}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1 mb-1">
                    <User className="w-3 h-3" /> Nama Pengemudi
                  </span>
                  <span className="text-slate-200 font-semibold">{verifyResult.manifest.driver_name}</span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin className="w-3 h-3" /> Rute
                  </span>
                  <span className="text-slate-200 font-semibold truncate block" title={`${verifyResult.manifest.origin} -> ${verifyResult.manifest.destination}`}>
                    {verifyResult.manifest.origin} → {verifyResult.manifest.destination}
                  </span>
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800/80">
                  <span className="text-slate-500 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" /> Kadaluarsa
                  </span>
                  <span className="text-slate-200 font-semibold truncate block" title={verifyResult.manifest.valid_until}>
                    {verifyResult.manifest.valid_until.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Daftar Barang</h4>
                <div className="overflow-x-auto border border-slate-800 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 font-mono text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Nama Barang</th>
                        <th className="py-2.5 px-3 text-right">Kuantitas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {verifyResult.manifest.item_list?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-cyan-300">{item.sku}</td>
                          <td className="py-2 px-3 text-slate-200">{item.name}</td>
                          <td className="py-2 px-3 text-right text-emerald-400 font-bold">{item.qty}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clearance Action Section (Enabled if valid) */}
              {verifyResult.valid && (
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                    <PenTool className="w-4 h-4" /> Otorisasi Pelepasan Gerbang (Counter-Sign Pos B)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">ID Petugas Gerbang</label>
                      <input
                        type="text"
                        value={officerId}
                        onChange={(e) => setOfficerId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1">ID Pos Gerbang</label>
                      <input
                        type="text"
                        value={gateId}
                        onChange={(e) => setGateId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleApproveClearance}
                    disabled={clearing}
                    className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-950/50"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    {clearing ? 'Membubuhkan Counter-Signature...' : 'Approve & Counter-Sign Clearance'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clearance Success Card */}
          {clearanceResult && (
            <div className="bg-slate-900 border border-emerald-600 rounded-lg p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" /> Gate Clearance Selesai & Ditandatangani
                </div>
                <button
                  onClick={copyUpdatedToken}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin Token Diperbarui
                </button>
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Clearance:</span>
                  <span className="text-emerald-400 font-bold">APPROVED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas / Pos:</span>
                  <span className="text-cyan-300">{officerId} ({gateId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Counter-Signature (B):</span>
                  <span className="text-amber-300 font-bold truncate max-w-[200px]">
                    {String(clearanceResult.clearance.counter_signature ?? clearanceResult.clearance.gate_signature ?? 'N/A')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Updated Token Base64 (Membawa Dual-Signature):
                </label>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-emerald-300 break-all max-h-24 overflow-y-auto">
                  {clearanceResult.updated_token_base64}
                </div>
              </div>

              <Link
                href="/receiving"
                className="w-full py-2.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                Lanjutkan ke Gudang Penerima (Entity C) <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Footer */}
      <AuditLog />
    </div>
  )
}
