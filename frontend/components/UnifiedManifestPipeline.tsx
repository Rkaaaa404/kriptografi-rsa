'use client'

import React, { useState, useEffect } from 'react'
import {
  FileText,
  DoorOpen,
  Package,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Lock,
  Unlock,
  KeyRound,
  RotateCcw,
  Check,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { loadKeyringFromStorage, applyKeyPreset, type KeyringState } from '@/lib/keyring'
import type { ItemLine, GatePassPackage, IssuePassResponse, GateVerifyResponse, ClearanceResponse, ReceiveResponse } from '@/types/api'
import { WaybillPassSheet } from './WaybillPassSheet'

function generatePassId(): string {
  const d = new Date()
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `SP-${ymd}-${rand}`
}

export function UnifiedManifestPipeline() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [keyring, setKeyring] = useState<KeyringState>({ A: null, B: null, C: null })

  // Step 1: Form state (Clean inputs with clues/placeholders)
  const [passId, setPassId] = useState(generatePassId())
  const [timestamp, setTimestamp] = useState(new Date().toISOString())
  const [validUntil, setValidUntil] = useState(new Date(Date.now() + 24 * 3600 * 1000).toISOString())
  const [issuerEntity, setIssuerEntity] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [driverName, setDriverName] = useState('')
  const [secretNote, setSecretNote] = useState('')
  const [items, setItems] = useState<ItemLine[]>([
    { sku: '', name: '', qty: 100 },
  ])
  const [isIssuing, setIsIssuing] = useState(false)

  // Step 2: Gate state
  const [officerId, setOfficerId] = useState('')
  const [gateId, setGateId] = useState('')
  const [isVerifyingGate, setIsVerifyingGate] = useState(false)
  const [isClearingGate, setIsClearingGate] = useState(false)
  const [gateVerifyResult, setGateVerifyResult] = useState<GateVerifyResponse | null>(null)
  // Step 3: Warehouse state
  const [isReceiving, setIsReceiving] = useState(false)
  const [receiveResult, setReceiveResult] = useState<ReceiveResponse | null>(null)

  // Pipeline Shared Package & Tokens
  const [tokenBase64, setTokenBase64] = useState<string>('')
  const [currentPackage, setCurrentPackage] = useState<GatePassPackage | null>(null)

  // Lifecycle status
  const [stepStatus, setStepStatus] = useState({
    isIssued: false,
    isGateCleared: false,
    isReceived: false,
  })

  // Sync keys from storage
  const syncKeys = () => {
    const keys = loadKeyringFromStorage()
    // If no keys exist, automatically initialize academic keys for seamless experience!
    if (!keys.A || !keys.B || !keys.C) {
      const initialized = applyKeyPreset('academic')
      setKeyring(initialized)
    } else {
      setKeyring(keys)
    }
  }

  useEffect(() => {
    syncKeys()
    window.addEventListener('securepass_keyring_updated', syncKeys)
    return () => window.removeEventListener('securepass_keyring_updated', syncKeys)
  }, [])

  // Auto-verify gate pass when transitioning to Step 2
  useEffect(() => {
    if (currentStep === 2 && tokenBase64 && keyring.A?.pub_key && !gateVerifyResult) {
      setIsVerifyingGate(true)
      api.gateVerify({
        token_base64: tokenBase64,
        pub_key_a: keyring.A.pub_key,
      })
        .then((res) => {
          setGateVerifyResult(res)
        })
        .catch((err) => {
          console.warn('Auto gate verify error', err)
        })
        .finally(() => {
          setIsVerifyingGate(false)
        })
    }
  }, [currentStep, tokenBase64, keyring.A, gateVerifyResult])

  const handleLoadSampleData = () => {
    setIssuerEntity('PPIC Dept (Surabaya Plant-1)')
    setOrigin('Pabrik Surabaya (Plant-1)')
    setDestination('Gudang Logistik Jakarta (DC-2)')
    setVehiclePlate('B 9182 UXZ')
    setDriverName('Budi Santoso')
    setSecretNote('KODE SEGEL FISIK: SEC-8842-ALPHA. Cocokkan segel kontainer nomor #00921 sebelum pembongkaran muatan.')
    setItems([
      { sku: 'SKU-ELC-001', name: 'Microcontroller Unit V2', qty: 250 },
      { sku: 'SKU-SMR-004', name: 'Industrial Sensor Module', qty: 100 },
    ])
    setOfficerId('OFFICER-B01')
    setGateId('GATE-OUT-01')
    toast.success('Data contoh demo berhasil dimuat ke formulir!')
  }

  const handleClearForm = () => {
    setIssuerEntity('')
    setOrigin('')
    setDestination('')
    setVehiclePlate('')
    setDriverName('')
    setSecretNote('')
    setItems([{ sku: '', name: '', qty: 100 }])
    toast.info('Formulir dibersihkan.')
  }

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { sku: '', name: '', qty: 50 },
    ])
  }

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) {
      toast.warning('Minimal satu item muatan wajib ada.')
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  // Action: Step 1 Issue
  const handleIssuePass = async () => {
    if (!keyring.A || !keyring.C) {
      toast.error('Kunci PPIC (A) dan Gudang (C) diperlukan. Menginisialisasi kunci kuliah...')
      applyKeyPreset('academic')
      syncKeys()
      return
    }

    const trimmedSecret = secretNote.trim()
    if (!trimmedSecret) {
      toast.error('Catatan rahasia belum diisi! Masukkan instruksi rahasia atau klik "Muat Contoh Demo".')
      return
    }

    // Prepare sanitized items
    const effectiveItems = items.map((it, idx) => ({
      sku: it.sku.trim() || `SKU-ITEM-${idx + 1}`,
      name: it.name.trim() || `Barang Muatan #${idx + 1}`,
      qty: it.qty > 0 ? it.qty : 10,
    }))

    setIsIssuing(true)
    try {
      const res = await api.issuePass({
        manifest: {
          pass_id: passId || generatePassId(),
          timestamp,
          valid_until: validUntil,
          issuer_entity: issuerEntity.trim() || 'PPIC Department',
          origin: origin.trim() || 'Pabrik Surabaya (Plant-1)',
          destination: destination.trim() || 'Gudang Logistik Jakarta (DC-2)',
          vehicle_plate: vehiclePlate.trim() || 'B 9182 UXZ',
          driver_name: driverName.trim() || 'Budi Santoso',
          item_list: effectiveItems,
        },
        secret_note: trimmedSecret,
        priv_key_a: keyring.A.priv_key,
        pub_key_c: keyring.C.pub_key,
        key_bits_a: keyring.A.bit_length || 32,
      })

      setTokenBase64(res.token_base64)
      setCurrentPackage(res.package)
      setStepStatus({
        isIssued: true,
        isGateCleared: false,
        isReceived: false,
      })
      localStorage.setItem('last_token', res.token_base64)
      toast.success('Surat Jalan Berhasil Diterbitkan & Ditandatangani PPIC!')

      // Run immediate gate verification on the generated token
      try {
        const vRes = await api.gateVerify({
          token_base64: res.token_base64,
          pub_key_a: keyring.A.pub_key,
        })
        setGateVerifyResult(vRes)
      } catch (e) {
        console.warn('Initial gate verify error', e)
      }

      // Auto-progress to Step 2
      setCurrentStep(2)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menerbitkan surat jalan')
    } finally {
      setIsIssuing(false)
    }
  }

  // Action: Step 2 Verify & Clearance
  const handleGateClearance = async () => {
    if (!tokenBase64 || !keyring.A || !keyring.B) {
      toast.error('Token surat jalan atau kunci gerbang belum tersedia.')
      return
    }

    setIsClearingGate(true)
    try {
      // 1. Verify gate first
      const vRes = await api.gateVerify({
        token_base64: tokenBase64,
        pub_key_a: keyring.A.pub_key,
      })
      setGateVerifyResult(vRes)

      if (!vRes.valid) {
        toast.error(`Verifikasi Gagal: ${vRes.message}`)
        setIsClearingGate(false)
        return
      }

      // 2. Issue gate clearance & counter-sign
      const cRes = await api.gateClearance({
        token_base64: tokenBase64,
        priv_key_b: keyring.B.priv_key,
        officer_id: officerId,
        gate_id: gateId,
      })

      // Update package and token
      setTokenBase64(cRes.updated_token_base64)
      localStorage.setItem('last_token', cRes.updated_token_base64)

      // Decode updated package
      const decoded = JSON.parse(atob(cRes.updated_token_base64))
      setCurrentPackage(decoded)

      setStepStatus((prev) => ({
        ...prev,
        isGateCleared: true,
      }))

      toast.success('Pemeriksaan Gerbang Lolos! Counter-Signature Berhasil Dibubuhkan.')
      // Auto-progress to Step 3
      setCurrentStep(3)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses clearance gerbang')
    } finally {
      setIsClearingGate(false)
    }
  }

  // Action: Step 3 Warehouse Dual-Verify & Decrypt
  const handleWarehouseReceive = async () => {
    if (!tokenBase64 || !keyring.A || !keyring.B || !keyring.C) {
      toast.error('Token atau kunci verifikasi tidak lengkap.')
      return
    }

    setIsReceiving(true)
    try {
      const res = await api.receivePass({
        token_base64: tokenBase64,
        pub_key_a: keyring.A.pub_key,
        pub_key_b: keyring.B.pub_key,
        priv_key_c: keyring.C.priv_key,
      })

      setReceiveResult(res)

      if (res.valid_a && res.valid_b && res.decrypted_secret) {
        setStepStatus((prev) => ({
          ...prev,
          isReceived: true,
        }))
        toast.success('Verifikasi Ganda Berhasil! Catatan Rahasia Berhasil Didekripsi.')
      } else {
        toast.error(`Penerimaan Ditolak: ${res.message}`)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses verifikasi gudang')
    } finally {
      setIsReceiving(false)
    }
  }

  const handleResetLifecycle = () => {
    setPassId(generatePassId())
    setTokenBase64('')
    setCurrentPackage(null)
    setGateVerifyResult(null)
    setReceiveResult(null)
    setStepStatus({
      isIssued: false,
      isGateCleared: false,
      isReceived: false,
    })
    setCurrentStep(1)
    toast.info('Siklus alur surat jalan di-reset ke awal.')
  }

  return (
    <div className="space-y-8">
      {/* Interactive Stepper Navigation Bar */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-3 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="grid grid-cols-3 w-full sm:w-auto gap-2">
          {/* Step 1 Pill */}
          <button
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all text-left ${
              currentStep === 1
                ? 'bg-zinc-900 text-white shadow-subtle'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono ${
                currentStep === 1
                  ? 'bg-zinc-800 text-white'
                  : stepStatus.isIssued
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {stepStatus.isIssued ? <Check className="w-3 h-3 text-emerald-800" /> : '1'}
            </div>
            <div>
              <div className="font-semibold">PPIC</div>
              <div className="text-[10px] opacity-70 hidden md:block">Penerbitan &amp; Sign</div>
            </div>
          </button>

          {/* Step 2 Pill */}
          <button
            onClick={() => setCurrentStep(2)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all text-left ${
              currentStep === 2
                ? 'bg-zinc-900 text-white shadow-subtle'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono ${
                currentStep === 2
                  ? 'bg-zinc-800 text-white'
                  : stepStatus.isGateCleared
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {stepStatus.isGateCleared ? <Check className="w-3 h-3 text-emerald-800" /> : '2'}
            </div>
            <div>
              <div className="font-semibold">Pos Gerbang</div>
              <div className="text-[10px] opacity-70 hidden md:block">Periksa &amp; Counter-Sign</div>
            </div>
          </button>

          {/* Step 3 Pill */}
          <button
            onClick={() => setCurrentStep(3)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-medium transition-all text-left ${
              currentStep === 3
                ? 'bg-zinc-900 text-white shadow-subtle'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono ${
                currentStep === 3
                  ? 'bg-zinc-800 text-white'
                  : stepStatus.isReceived
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'bg-zinc-100 text-zinc-500'
              }`}
            >
              {stepStatus.isReceived ? <Check className="w-3 h-3 text-emerald-800" /> : '3'}
            </div>
            <div>
              <div className="font-semibold">Gudang Penerima</div>
              <div className="text-[10px] opacity-70 hidden md:block">Dual-Verify &amp; Dekripsi</div>
            </div>
          </button>
        </div>

        {/* Action: Reset cycle */}
        <button
          onClick={handleResetLifecycle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
          title="Reset alur dan buat surat jalan baru"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Siklus</span>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Active Step Interactive Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* STEP 1: PPIC Form */}
          {currentStep === 1 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-[11px] font-mono uppercase font-semibold text-blue-600 tracking-wider">
                    Tahap 1 &bull; Entitas A
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 mt-0.5">Penerbitan Surat Jalan (PPIC)</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Buat manifest pengiriman, tandatangani dengan Kunci Privat A, dan enkripsi catatan rahasia dengan Kunci Publik C.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Isi Contoh Demo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="px-2.5 py-1.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 text-xs font-medium transition-colors"
                  >
                    Reset Form
                  </button>
                </div>
              </div>

              {/* Form Grid with Clues (Helper Text) and Placeholders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Nomor Pass ID</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Identifikasi unik resi (otomatis digenerate)</span>
                  <input
                    type="text"
                    value={passId}
                    onChange={(e) => setPassId(e.target.value)}
                    placeholder="Contoh: SP-20261007-9182"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white font-mono text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Departemen Penerbit (Entitas A)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Unit kerja berwenang penandatangan manifest</span>
                  <input
                    type="text"
                    value={issuerEntity}
                    onChange={(e) => setIssuerEntity(e.target.value)}
                    placeholder="Contoh: PPIC Dept (Surabaya Plant-1)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Lokasi Asal (Origin)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Titik muat atau pabrik tempat kargo diberangkatkan</span>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Contoh: Pabrik Surabaya (Plant-1)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Tujuan Pengiriman (Destination)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Gudang tujuan yang berhak mendekripsi muatan</span>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Contoh: Gudang Logistik Jakarta (DC-2)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Plat Nomor Armada (Nopol)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Nomor polisi truk untuk mencegah pergantian kargo fisik</span>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="Contoh: B 9182 UXZ"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white font-mono text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Nama Pengemudi (Supir)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Nama lengkap pengemudi pembawa muatan</span>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
              </div>

              {/* Items Section with Clues */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700">Daftar Barang (Muatan Fisik)</label>
                    <span className="block text-[11px] text-zinc-400">
                      SKU, nama barang, dan kuantitas dihitung bersama ke dalam nilai hash digital H(M)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Baris
                  </button>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: SKU-ELC-001"
                        value={item.sku}
                        onChange={(e) => {
                          const copy = [...items]
                          copy[idx].sku = e.target.value
                          setItems(copy)
                        }}
                        className="w-1/3 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                      />
                      <input
                        type="text"
                        placeholder="Contoh: Microcontroller Unit V2"
                        value={item.name}
                        onChange={(e) => {
                          const copy = [...items]
                          copy[idx].name = e.target.value
                          setItems(copy)
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty === 0 ? '' : item.qty}
                        onChange={(e) => {
                          const copy = [...items]
                          copy[idx].qty = parseInt(e.target.value, 10) || 0
                          setItems(copy)
                        }}
                        className="w-20 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white font-mono text-xs text-right focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Secret Note with Clear TextView Clue */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-700 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    Catatan Rahasia (Encrypted Secret Note)
                  </label>
                  <span className="text-[11px] text-zinc-400">Terenkripsi Kunci Publik C (e<sub>C</sub>)</span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-50/80 p-2.5 rounded-xl border border-zinc-200/60">
                  <Info className="w-3.5 h-3.5 inline mr-1 text-zinc-600" />
                  <strong>Petunjuk:</strong> Masukkan instruksi khusus atau kode segel fisik gembok kontainer. Teks ini
                  dienkripsi secara asimetris khusus untuk Gudang Tujuan sehingga supir maupun satpam pos tidak dapat membacanya.
                </p>
                <textarea
                  rows={2}
                  value={secretNote}
                  onChange={(e) => setSecretNote(e.target.value)}
                  placeholder="Contoh: KODE SEGEL FISIK: SEC-8842-ALPHA. Cocokkan segel kontainer nomor #00921 sebelum pembongkaran muatan."
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white placeholder:text-zinc-400 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  onClick={handleIssuePass}
                  disabled={isIssuing}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isIssuing ? 'animate-spin' : ''}`} />
                  <span>
                    {isIssuing
                      ? 'Menghitung Hash & Menandatangani...'
                      : 'Terbitkan & Tandatangani Surat Jalan (PPIC) →'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Gate Security Verification & Clearance */}
          {currentStep === 2 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-[11px] font-mono uppercase font-semibold text-emerald-600 tracking-wider">
                    Tahap 2 &bull; Entitas B
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 mt-0.5">Pemeriksaan Pos Gerbang</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Petugas satpam memverifikasi keaslian signature PPIC dan membubuhkan counter-sign approval.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <DoorOpen className="w-5 h-5" />
                </div>
              </div>

              {/* Auto Token Indicator */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Token Surat Jalan Aktif
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {tokenBase64 ? `${tokenBase64.slice(0, 24)}...` : 'Belum ada token'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Token otomatis diteruskan dari Tahap 1. Petugas gerbang siap memeriksa integritas muatan dan memvalidasi
                  nonce anti-replay.
                </p>
              </div>

              {/* Officer Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">ID Petugas Gerbang (Satpam)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Identitas petugas yang memeriksa fisik truk</span>
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    placeholder="Contoh: OFFICER-B01"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white font-mono text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
                <div>
                  <label className="block text-zinc-700 font-semibold mb-0.5">Pos Gerbang (Gate ID)</label>
                  <span className="block text-[11px] text-zinc-400 mb-1">Nomor pos keluar tempat inspeksi dilakukan</span>
                  <input
                    type="text"
                    value={gateId}
                    onChange={(e) => setGateId(e.target.value)}
                    placeholder="Contoh: GATE-OUT-01"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white font-mono text-zinc-900 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 shadow-subtle"
                  />
                </div>
              </div>

              {/* Diagnostic Box if already verified */}
              {isVerifyingGate && (
                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-600 text-xs flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>Memverifikasi tanda tangan digital &amp; memeriksa nonce...</span>
                </div>
              )}

              {!isVerifyingGate && gateVerifyResult && (
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    gateVerifyResult.valid
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-2 text-sm">
                    {gateVerifyResult.valid ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {gateVerifyResult.valid
                        ? 'Dokumen Sah & Tanda Tangan PPIC Otentik! Lolos Pos Gerbang'
                        : gateVerifyResult.message}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    {gateVerifyResult.valid ? (
                      <>
                        Integritas muatan fisik terbukti secara matematis: H(M) cocok dengan signature S<sub>A</sub>. Nonce belum pernah dipakai. Truk diizinkan keluar setelah diberi counter-sign.
                      </>
                    ) : (
                      'Perhatian: Nilai hash manifest tidak sesuai dengan signature primer atau token sudah pernah diproses.'
                    )}
                  </p>
                  {gateVerifyResult.digest_expected !== undefined && (
                    <div className="font-mono text-[11px] pt-1 border-t border-emerald-200/60 text-zinc-600 flex items-center gap-4">
                      <span>Digest Expected: <strong>{gateVerifyResult.digest_expected}</strong></span>
                      <span>Digest Recovered: <strong>{gateVerifyResult.digest_recovered}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Gate Clearance CTA */}
              <div className="pt-2">
                <button
                  onClick={handleGateClearance}
                  disabled={isClearingGate || !tokenBase64}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
                >
                  <ShieldCheck className={`w-4 h-4 ${isClearingGate ? 'animate-spin' : ''}`} />
                  <span>
                    {isClearingGate
                      ? 'Membubuhkan Counter-Signature Satpam...'
                      : gateVerifyResult?.valid
                      ? 'Bubuhkan Counter-Signature & Berikan Clearance Gerbang →'
                      : 'Periksa & Berikan Clearance Gerbang →'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Warehouse Receiving & Secret Decryption */}
          {currentStep === 3 && (
            <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-card space-y-6 text-left">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div>
                  <span className="text-[11px] font-mono uppercase font-semibold text-purple-600 tracking-wider">
                    Tahap 3 &bull; Entitas C
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 mt-0.5">Penerimaan Gudang Tujuan</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Gudang memverifikasi keabsahan kedua tanda tangan (PPIC &amp; Gerbang) lalu mendekripsi memo rahasia pengiriman.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                  <Package className="w-5 h-5" />
                </div>
              </div>

              {/* Status Verification Checklist */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium text-zinc-800">Tanda Tangan PPIC (Entity A)</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                    {stepStatus.isIssued ? 'Otentik' : 'Belum Ada'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-zinc-800">Persetujuan Gerbang (Entity B)</span>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                      stepStatus.isGateCleared
                        ? 'text-emerald-700 bg-emerald-50'
                        : 'text-amber-700 bg-amber-50'
                    }`}
                  >
                    {stepStatus.isGateCleared ? 'Clearance Sah' : 'Menunggu Gerbang'}
                  </span>
                </div>
              </div>

              {/* Decrypted Secret Result */}
              {receiveResult?.decrypted_secret && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5 text-xs text-left">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                    <Unlock className="w-4 h-4 text-emerald-600" />
                    <span>Catatan Rahasia Berhasil Didekripsi</span>
                  </div>
                  <p className="font-mono text-emerald-950 font-medium select-all">
                    {receiveResult.decrypted_secret}
                  </p>
                </div>
              )}

              {/* Receive CTA */}
              <div className="pt-2">
                <button
                  onClick={handleWarehouseReceive}
                  disabled={isReceiving || !tokenBase64}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
                >
                  <Unlock className={`w-4 h-4 ${isReceiving ? 'animate-spin' : ''}`} />
                  <span>
                    {isReceiving
                      ? 'Memverifikasi Ganda & Mendekripsi...'
                      : (
                        <>Verifikasi Ganda &amp; Buka Catatan Rahasia (Kunci Privat d<sub>C</sub>) →</>
                      )}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Digital Waybill Pass Sheet (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <WaybillPassSheet
            tokenBase64={tokenBase64}
            pkg={currentPackage}
            stepStatus={stepStatus}
            decryptedSecret={receiveResult?.decrypted_secret}
            onSendToAttackLab={() => {
              if (tokenBase64) {
                window.location.href = `/attack-lab?token=${encodeURIComponent(tokenBase64)}`
              } else {
                toast.warning('Terbitkan surat jalan terlebih dahulu sebelum menguji serangan.')
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}
