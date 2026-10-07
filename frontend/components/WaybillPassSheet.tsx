'use client'

import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import type { GatePassPackage } from '@/types/api'

interface WaybillPassSheetProps {
  tokenBase64: string
  pkg: GatePassPackage | null
  stepStatus: {
    isIssued: boolean
    isGateCleared: boolean
    isReceived: boolean
  }
  decryptedSecret?: string | null
  onSendToAttackLab?: () => void
}

export function WaybillPassSheet({
  tokenBase64,
  pkg,
  stepStatus,
  decryptedSecret,
  onSendToAttackLab,
}: WaybillPassSheetProps) {
  const [copied, setCopied] = useState(false)
  const [showRaw, setShowRaw] = useState(false)

  const handleCopy = () => {
    if (!tokenBase64) return
    navigator.clipboard.writeText(tokenBase64)
    setCopied(true)
    toast.success('Token Base64 berhasil disalin ke clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!pkg) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 p-8 sm:p-12 text-center text-zinc-400 space-y-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-zinc-700">Belum Ada Surat Jalan Terbit</h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Lengkapi formulir di Tahap 1 (PPIC) lalu tekan &quot;Terbitkan &amp; Tandatangani&quot; untuk menggenerasi dokumen fisik digital.
          </p>
        </div>
      </div>
    )
  }

  const { header, primary_signature, clearance, encrypted_secret, nonce } = pkg

  return (
    <div className="relative rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-card overflow-hidden text-left">
      {/* Decorative top security pattern */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800" />

      {/* Header document */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200/60">
              Dokumen Resmi Surat Jalan
            </span>
            <span className="text-xs text-zinc-400 font-mono">NONCE: {nonce.slice(0, 10)}...</span>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900 tracking-tight mt-1.5 font-mono">
            {header.pass_id}
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Diterbitkan oleh <strong className="text-zinc-700">{header.issuer_entity}</strong> &bull; Waktu:{' '}
            {new Date(header.timestamp).toLocaleString('id-ID')}
          </p>
        </div>

        {/* QR Code */}
        <div className="flex items-center gap-4 self-start">
          <div className="p-2 bg-white rounded-xl border border-zinc-200 shadow-subtle shrink-0">
            <QRCode value={tokenBase64} size={84} />
          </div>
        </div>
      </div>

      {/* Logistics metadata grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-zinc-100 text-xs">
        <div>
          <span className="text-zinc-400 block font-medium">Asal Pengiriman</span>
          <span className="text-zinc-800 font-semibold mt-0.5 block">{header.origin}</span>
        </div>
        <div>
          <span className="text-zinc-400 block font-medium">Tujuan Penerima</span>
          <span className="text-zinc-800 font-semibold mt-0.5 block">{header.destination}</span>
        </div>
        <div>
          <span className="text-zinc-400 block font-medium">Armada / Nopol</span>
          <span className="text-zinc-800 font-semibold mt-0.5 block font-mono">{header.vehicle_plate}</span>
        </div>
        <div>
          <span className="text-zinc-400 block font-medium">Pengemudi</span>
          <span className="text-zinc-800 font-semibold mt-0.5 block">{header.driver_name}</span>
        </div>
      </div>

      {/* Cargo Manifest Items Table */}
      <div className="py-5 border-b border-zinc-100">
        <div className="text-xs font-semibold text-zinc-700 mb-2">Manifest Muatan Fisik</div>
        <div className="rounded-xl border border-zinc-100 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 text-zinc-500 font-medium border-b border-zinc-100">
              <tr>
                <th className="py-2 px-3">Kode SKU</th>
                <th className="py-2 px-3">Deskripsi Barang</th>
                <th className="py-2 px-3 text-right">Jumlah (Unit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {(header.item_list || header.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/40">
                  <td className="py-2 px-3 font-mono font-medium text-zinc-900">{item.sku}</td>
                  <td className="py-2 px-3">{item.name}</td>
                  <td className="py-2 px-3 text-right font-mono font-semibold">{item.qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confidential Encrypted Secret Box */}
      <div className="py-5 border-b border-zinc-100">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
            {stepStatus.isReceived && decryptedSecret ? (
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-zinc-500" />
            )}
            <span>Catatan Rahasia Muatan (Encrypted Asymmetric Payload)</span>
          </div>
          <span className="text-[11px] text-zinc-400 font-mono">Enkripsi Kunci Publik C</span>
        </div>

        {stepStatus.isReceived && decryptedSecret ? (
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-950 font-medium">
            <div className="text-[10px] text-emerald-700 uppercase font-mono tracking-wider font-semibold mb-1">
              Plaintext Terdekripsi (Kunci Privat C):
            </div>
            <div className="font-mono text-emerald-900 select-all">{decryptedSecret}</div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-mono text-zinc-500 flex items-center justify-between">
            <span className="truncate max-w-md">Ciphertext Blocks: [{encrypted_secret.slice(0, 6).join(', ')}...]</span>
            <span className="text-[11px] text-zinc-400 italic">Terkunci hingga di Gudang C (dekripsi d<sub>C</sub>)</span>
          </div>
        )}
      </div>

      {/* Digital Stamps / Verification Sign-offs */}
      <div className="pt-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* PPIC Signature Badge */}
          <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50/80 text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>PPIC Primary Signature</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-500">
              S<sub>A</sub> = <span className="text-zinc-900 font-semibold">{primary_signature}</span>
            </div>
          </div>

          {/* Gate Clearance Badge */}
          <div
            className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
              stepStatus.isGateCleared && clearance
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-zinc-200 bg-zinc-50/30 opacity-60'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-semibold ${
                stepStatus.isGateCleared ? 'text-emerald-700' : 'text-zinc-500'
              }`}
            >
              {stepStatus.isGateCleared ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-300" />
              )}
              <span>Gate Clearance ({clearance?.gate_id || 'Pos Satpam'})</span>
            </div>
            <div className="font-mono text-[11px] text-zinc-500">
              {clearance?.counter_signature ? (
                <>
                  S<sub>B</sub> = <span className="text-zinc-900 font-semibold">{clearance.counter_signature}</span>
                </>
              ) : (
                'Menunggu pemeriksaan gerbang...'
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors shadow-subtle"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin' : 'Salin Token'}</span>
          </button>

          {onSendToAttackLab && (
            <button
              onClick={onSendToAttackLab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-subtle"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Uji di Attack Lab</span>
            </button>
          )}

          <button
            onClick={() => setShowRaw(!showRaw)}
            className="p-1.5 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 text-xs"
            title="Lihat raw JSON"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Raw JSON Accordion */}
      {showRaw && (
        <div className="mt-4 pt-4 border-t border-zinc-100">
          <div className="text-[11px] font-mono text-zinc-400 mb-1">Payload JSON Terstruktur:</div>
          <pre className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-mono text-[11px] text-zinc-700 overflow-x-auto max-h-56">
            {JSON.stringify(pkg, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
