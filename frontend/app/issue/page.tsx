'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Key,
  CheckCircle,
  Copy,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Eye,
  Lock,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { api } from '@/lib/api'
import type { ItemLine, IssuePassResponse } from '@/types/api'
import { AuditLog, addAuditEntry } from '@/components/AuditLog'

function generatePassId(): string {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `SP-${ymd}-${rand}`
}

export default function IssuePage() {
  const [keyA, setKeyA] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)
  const [keyC, setKeyC] = useState<{ pub_key: [number, number]; priv_key: [number, number] } | null>(null)

  const [passId, setPassId] = useState(generatePassId())
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString())
  const [issuerEntity, setIssuerEntity] = useState('PPIC Department')
  const [origin, setOrigin] = useState('Pabrik Surabaya (Plant-1)')
  const [destination, setDestination] = useState('Gudang Logistik Jakarta (DC-2)')
  const [vehiclePlate, setVehiclePlate] = useState('B 9182 UXZ')
  const [driverName, setDriverName] = useState('Budi Santoso')
  const [secretNote, setSecretNote] = useState(
    'KODE OTENTIKASI RAHASIA: SEC-8842-ALPHA. Pastikan nomor segel fisik kontainer cocok sebelum pembongkaran.'
  )

  const [items, setItems] = useState<ItemLine[]>([
    { sku: 'SKU-ELC-001', name: 'Microcontroller Unit V2', qty: 250 },
    { sku: 'SKU-SMR-004', name: 'Industrial Sensor Module', qty: 100 },
  ])

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IssuePassResponse | null>(null)
  const [showPackageJson, setShowPackageJson] = useState(false)

  useEffect(() => {
    try {
      const aRaw = localStorage.getItem('securepass_key_A')
      if (aRaw) setKeyA(JSON.parse(aRaw))

      const cRaw = localStorage.getItem('securepass_key_C')
      if (cRaw) setKeyC(JSON.parse(cRaw))
    } catch (e) {
      console.error('Error loading keys from localStorage', e)
    }
  }, [])

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { sku: `SKU-${Date.now().toString().slice(-4)}`, name: 'Komponen Tambahan', qty: 10 },
    ])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning('Minimal harus menyertakan satu baris barang dalam manifest.')
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof ItemLine, value: string | number) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item
        return {
          ...item,
          [field]: field === 'qty' ? Math.max(1, Number(value) || 0) : value,
        }
      })
    )
  }

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!keyA || !keyA.priv_key) {
      toast.error('Kunci Privat Entitas A (PPIC) belum tersedia! Buat kunci di menu Key Management.')
      return
    }
    if (!keyC || !keyC.pub_key) {
      toast.error('Kunci Publik Entitas C (Gudang) belum tersedia! Buat kunci di menu Key Management.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        manifest: {
          pass_id: passId.trim(),
          timestamp: timestamp.trim(),
          valid_until: validUntil.trim(),
          issuer_entity: issuerEntity.trim(),
          origin: origin.trim(),
          destination: destination.trim(),
          vehicle_plate: vehiclePlate.trim(),
          driver_name: driverName.trim(),
          item_list: items.map((it) => ({
            sku: it.sku.trim(),
            name: it.name.trim(),
            qty: Number(it.qty),
          })),
        },
        priv_key_a: keyA.priv_key,
        pub_key_c: keyC.pub_key,
        secret_note: secretNote.trim(),
        key_bits_a: 32,
        key_bits_c: 32,
      }

      const res = await api.issuePass(payload)
      setResult(res)

      localStorage.setItem('last_token', res.token_base64)
      addAuditEntry('ISSUE_PASS', passId, 'VALID', {
        digest_hash: res.digest_hash,
        signature: res.signature,
        items_count: items.length,
      })

      toast.success('Surat Jalan Kriptografis Berhasil Diterbitkan!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan penerbitan surat jalan'
      toast.error(`Gagal: ${msg}`)
      addAuditEntry('ISSUE_PASS', passId, 'FAILED', { error: msg })
    } finally {
      setLoading(false)
    }
  }

  const copyToken = () => {
    if (!result?.token_base64) return
    navigator.clipboard.writeText(result.token_base64)
    toast.success('Token Base64 disalin ke clipboard!')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm uppercase tracking-wider mb-1">
          <FileText className="w-4 h-4" /> Entitas A: PPIC (Production Planning & Inventory Control)
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Penerbitan Surat Jalan Digital</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-3xl">
          Manifest logistik disahkan dengan tanda tangan digital RSA murni (<span className="text-cyan-400 font-mono">S = H(M)^d mod n</span>).
          Instruksi rahasia dienkripsi secara asimetris khusus untuk Gudang Penerima (<span className="text-amber-400 font-mono">C = m^e mod n</span>).
        </p>
      </div>

      {/* Key Status Warnings */}
      {(!keyA || !keyC) && (
        <div className="bg-amber-950/40 border border-amber-800/80 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-sm">
              <span className="font-semibold text-amber-200">Kunci RSA Belum Lengkap: </span>
              <span className="text-amber-300/80">
                {!keyA && 'Kunci PPIC (A) belum ada. '}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Manifest Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleIssue} className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" /> Form Data Manifest Cargo
              </h2>
              <button
                type="button"
                onClick={() => setPassId(generatePassId())}
                className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                title="Generate ID Baru"
              >
                <RefreshCw className="w-3 h-3" /> Buat ID Baru
              </button>
            </div>

            {/* Pass ID & Issuer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Pass ID (Surat Jalan)</label>
                <input
                  type="text"
                  value={passId}
                  onChange={(e) => setPassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Entitas Penerbit</label>
                <input
                  type="text"
                  value={issuerEntity}
                  onChange={(e) => setIssuerEntity(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Waktu Penerbitan (ISO)</label>
                <input
                  type="text"
                  value={timestamp}
                  onChange={(e) => setTimestamp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Berlaku Sampai (ISO)</label>
                <input
                  type="text"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Lokasi Asal (Origin)</label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Tujuan (Destination)</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Driver & Plate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Plat Kendaraan</label>
                <input
                  type="text"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Nama Pengemudi</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>
            </div>

            {/* Dynamic Items Manifest */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Daftar Muatan Barang (Item Manifest)
                </label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Tambah Barang
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-950/80 border border-slate-800 rounded"
                  >
                    <input
                      type="text"
                      placeholder="SKU-XXXX"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                      className="w-28 sm:w-32 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Nama Barang"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="flex-1 min-w-[120px] bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qty}
                      min={1}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-slate-300 text-right focus:outline-none focus:border-cyan-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 rounded hover:bg-rose-950/50 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Secret Memo to Entity C */}
            <div className="pt-2">
              <label className="block text-xs font-mono text-amber-400 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Catatan Rahasia (Dienkripsi dengan Kunci Publik Gudang C)
              </label>
              <textarea
                rows={2}
                value={secretNote}
                onChange={(e) => setSecretNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-amber-200/90 focus:outline-none focus:border-amber-500 font-mono"
                placeholder="Pesan rahasia hanya untuk Entity C..."
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Pesan ini tidak dapat dibaca oleh Pos Gerbang (Entity B) maupun pihak luar tanpa Kunci Privat Gudang (C).
              </p>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Menandatangani secara Kriptografis...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Sahkan & Terbitkan Gate Pass Token
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Issued Token & Cryptographic Output */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="space-y-6">
              {/* Token Card */}
              <div className="bg-slate-900 border border-emerald-700/60 rounded-lg p-6 space-y-5 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold text-base">Token Sukses Diterbitkan</span>
                  </div>
                  <button
                    onClick={copyToken}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin Token
                  </button>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded border border-slate-800">
                  <div className="p-3 bg-white rounded shadow">
                    <QRCode value={result.token_base64} size={160} level="M" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 mt-2">
                    Pindai di Pos Gerbang (Entity B)
                  </span>
                </div>

                {/* Token Base64 Preview */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Token Base64 (GatePassPackage)
                  </label>
                  <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-cyan-300 break-all max-h-28 overflow-y-auto">
                    {result.token_base64}
                  </div>
                </div>

                {/* Cryptographic Proof Card */}
                <div className="p-3 bg-cyan-950/30 border border-cyan-800/60 rounded space-y-2 text-xs font-mono">
                  <div className="text-cyan-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Bukti Kriptografi RSA Entitas A
                  </div>
                  <div className="flex justify-between border-t border-cyan-900/40 pt-1.5 text-slate-300">
                    <span className="text-slate-400">Digest Rolling Hash:</span>
                    <span className="text-cyan-300 font-bold">{result.digest_hash}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Tanda Tangan Primer:</span>
                    <span className="text-amber-300 font-bold truncate max-w-[200px]" title={String(result.signature)}>
                      {result.signature}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-400">Anti-Replay Nonce:</span>
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {result.package?.nonce ?? 'UUID-v4'}
                    </span>
                  </div>
                </div>

                {/* Next Step Nav */}
                <Link
                  href="/gate"
                  className="w-full py-2.5 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  Bawa Token ke Pos Gerbang (Entity B) <ArrowRight className="w-4 h-4" />
                </Link>

                {/* Raw package inspector toggle */}
                <button
                  onClick={() => setShowPackageJson(!showPackageJson)}
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showPackageJson ? 'Tutup Raw JSON Package' : 'Lihat Raw JSON Package'}
                </button>

                {showPackageJson && (
                  <pre className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-60">
                    {JSON.stringify(result.package, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            /* Standby Card */
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 space-y-4">
              <h2 className="text-base font-semibold text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" /> Pipeline Penerbitan PPIC
              </h2>
              <div className="text-xs text-slate-400 space-y-3">
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="font-semibold text-slate-300 mb-1">1. Canonical Serialization</p>
                  <p className="text-slate-500">
                    Header dan item diurutkan secara leksikografis JSON ketat tanpa spasi untuk menjamin konsistensi digest.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="font-semibold text-slate-300 mb-1">2. Polynomial Rolling Hash</p>
                  <p className="text-slate-500">
                    Menghasilkan integer hash $H(M)$ dengan basis prima $p=31$ dan modulus $2^{{31}}-1$.
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="font-semibold text-slate-300 mb-1">3. Modular Exponentiation Signing</p>
                  <p className="text-slate-500">
                    Tanda tangan dihitung: $S = H(M)^d \pmod n$ menggunakan Kunci Privat PPIC ($d_A, n_A$).
                  </p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded border border-slate-800/80">
                  <p className="font-semibold text-slate-300 mb-1">4. Asymmetric Secret Encryption</p>
                  <p className="text-slate-500">
                    Memo rahasia dipecah per-karakter dan dienkripsi dengan Kunci Publik Gudang: $c_i = m_i^e \pmod n$.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audit Log Footer */}
      <AuditLog />
    </div>
  )
}
