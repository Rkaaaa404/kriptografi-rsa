'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import type { Keypair } from '@/types/api'
import { toast } from 'sonner'
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Save,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Layers,
  Info,
  Sliders,
  Calculator,
} from 'lucide-react'

type EntityKey = 'A' | 'B' | 'C'

interface EntityMeta {
  id: EntityKey
  name: string
  role: string
  description: string
  storageKey: string
  color: string
}

const ENTITIES: Record<EntityKey, EntityMeta> = {
  A: {
    id: 'A',
    name: 'PPIC (Entity A)',
    role: 'Penerbit Dokumen & Signature Pengirim',
    description: 'Bertanggung jawab membuat surat jalan dan menandatangani manifest dengan RSA Private Key.',
    storageKey: 'securepass_key_A',
    color: 'border-cyan-500/30 text-cyan-400',
  },
  B: {
    id: 'B',
    name: 'Gate Scanner (Entity B)',
    role: 'Pemeriksa Pos & Counter-Signature',
    description: 'Memverifikasi signature PPIC di pos gerbang dan menambahkan approval clearance.',
    storageKey: 'securepass_key_B',
    color: 'border-emerald-500/30 text-emerald-400',
  },
  C: {
    id: 'C',
    name: 'Gudang Penerima (Entity C)',
    role: 'Dekripsi Rahasia & Verifikasi Akhir',
    description: 'Menerima paket, memvalidasi seluruh signature berantai, dan mendekripsi encrypted_secret.',
    storageKey: 'securepass_key_C',
    color: 'border-amber-500/30 text-amber-400',
  },
}

export default function KeygenPage() {
  const [selectedEntity, setSelectedEntity] = useState<EntityKey>('A')

  // Generate form state
  const [bitSize, setBitSize] = useState<number>(32)
  const [eManualGen, setEManualGen] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  // Manual validate form state (pre-filled p=47, q=71, e=79)
  const [manualP, setManualP] = useState<string>('47')
  const [manualQ, setManualQ] = useState<string>('71')
  const [manualE, setManualE] = useState<string>('79')
  const [isValidating, setIsValidating] = useState<boolean>(false)

  // Current active keypair result
  const [currentKeypair, setCurrentKeypair] = useState<Keypair | null>(null)

  // Saved keys in localStorage for all 3 entities
  const [savedKeys, setSavedKeys] = useState<Record<EntityKey, Keypair | null>>({
    A: null,
    B: null,
    C: null,
  })

  // Copied state indicator
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Load stored keys on mount
  const refreshStoredKeys = useCallback(() => {
    if (typeof window === 'undefined') return
    const keys: Record<EntityKey, Keypair | null> = { A: null, B: null, C: null }
    ;(['A', 'B', 'C'] as EntityKey[]).forEach((entity) => {
      const raw = localStorage.getItem(`securepass_key_${entity}`)
      if (raw) {
        try {
          keys[entity] = JSON.parse(raw) as Keypair
        } catch {
          keys[entity] = null
        }
      }
    })
    setSavedKeys(keys)
  }, [])

  useEffect(() => {
    refreshStoredKeys()
  }, [refreshStoredKeys])

  // If tab changes, optionally load the saved key for that entity into view if no active key
  useEffect(() => {
    const saved = savedKeys[selectedEntity]
    if (saved) {
      setCurrentKeypair(saved)
    }
  }, [selectedEntity, savedKeys])

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(label)
    toast.success(`${label} disalin ke clipboard!`)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Handle automatic generation
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    try {
      const payload: { bits: number; entity: string; e_manual?: number } = {
        bits: bitSize,
        entity: selectedEntity,
      }
      if (eManualGen.trim() !== '') {
        const parsedE = parseInt(eManualGen.trim(), 10)
        if (isNaN(parsedE) || parsedE <= 2) {
          toast.error('Nilai e manual harus berupa bilangan ganjil > 2')
          setIsGenerating(false)
          return
        }
        payload.e_manual = parsedE
      }

      const res = await api.generateKeypair(payload)
      // Normalize response
      const nVal = res.n ?? (res.pub_key ? res.pub_key[1] : res.p * res.q)
      const eVal = res.e ?? (res.pub_key ? res.pub_key[0] : 65537)
      const dVal = res.d ?? (res.priv_key ? res.priv_key[0] : 0)

      const normalized: Keypair = {
        ...res,
        n: nVal,
        e: eVal,
        d: dVal,
        valid: res.valid !== false,
      }

      setCurrentKeypair(normalized)
      toast.success(`Pasangan kunci RSA untuk ${ENTITIES[selectedEntity].name} berhasil dibuat!`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal membuat kunci'
      toast.error(`Error: ${message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle manual validation
  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    try {
      const p = parseInt(manualP.trim(), 10)
      const q = parseInt(manualQ.trim(), 10)
      const expE = parseInt(manualE.trim(), 10)

      if (isNaN(p) || isNaN(q) || isNaN(expE)) {
        toast.error('Semua parameter p, q, e harus berupa angka bulat valid!')
        setIsValidating(false)
        return
      }

      const res = await api.validateKeypair({ p, q, e: expE })
      const nVal = res.n ?? p * q
      const phiVal = res.phi ?? (p - 1) * (q - 1)
      const eVal = res.e ?? expE
      const dVal = res.d ?? (res.priv_key ? res.priv_key[0] : 0)

      const normalized: Keypair = {
        ...res,
        p,
        q,
        n: nVal,
        phi: phiVal,
        e: eVal,
        d: dVal,
        pub_key: res.pub_key ?? [eVal, nVal],
        priv_key: res.priv_key ?? [dVal, nVal],
      }

      setCurrentKeypair(normalized)

      if (normalized.valid) {
        toast.success(`Parameter manual VALID! Kunci siap digunakan.`)
      } else {
        toast.error(`Parameter INVALID: ${normalized.message || 'Gagal memvalidasi parameter'}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal validasi kunci'
      toast.error(`Error: ${message}`)
    } finally {
      setIsValidating(false)
    }
  }

  // Save keypair to localStorage
  const handleSaveToLocalStorage = () => {
    if (!currentKeypair || !currentKeypair.valid) {
      toast.error('Tidak ada kunci valid untuk disimpan!')
      return
    }

    const keyName = `securepass_key_${selectedEntity}`
    localStorage.setItem(keyName, JSON.stringify(currentKeypair))
    refreshStoredKeys()
    toast.success(`Kunci ${ENTITIES[selectedEntity].name} tersimpan ke LocalStorage (${keyName})`)
  }

  // Delete keypair from localStorage
  const handleDeleteFromLocalStorage = () => {
    const keyName = `securepass_key_${selectedEntity}`
    localStorage.removeItem(keyName)
    refreshStoredKeys()
    toast.info(`Kunci ${ENTITIES[selectedEntity].name} dihapus dari LocalStorage`)
  }

  const isCurrentKeySaved = Boolean(savedKeys[selectedEntity])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Page Title & Intro */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-cyan-950/60 border border-cyan-700/50 rounded-lg text-cyan-400">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
              RSA Key Management & Parameter Generator
            </h1>
            <p className="text-sm text-slate-400">
              Generasi dan validasi pasangan kunci asimetris $(e, n)$ dan $(d, n)$ untuk tiap entitas rantai pasok.
            </p>
          </div>
        </div>
      </div>

      {/* Entity Selection Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            Pilih Entitas Sistem
          </label>
          <span className="text-xs text-slate-500">
            Kunci disimpan per entitas di browser LocalStorage
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['A', 'B', 'C'] as EntityKey[]).map((id) => {
            const entity = ENTITIES[id]
            const isSelected = selectedEntity === id
            const isSaved = Boolean(savedKeys[id])

            return (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedEntity(id)}
                className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                      Entitas {id}
                    </span>
                    <h3 className="font-semibold text-slate-100 text-base">{entity.name}</h3>
                  </div>

                  {isSaved ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Tersimpan
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                      Kosong
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{entity.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Grid: Controls vs Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator & Manual Validator Forms */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Automatic Keypair Generation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Metode 1: Generasi Otomatis
                </h2>
              </div>
              <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Miller-Rabin Core
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Panjang Bit Bilangan Prima ($p, q$)
                </label>
                <select
                  value={bitSize}
                  onChange={(e) => setBitSize(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                >
                  <option value={16}>16-bit (Cepat / Demo Edukasi ~ 65,536)</option>
                  <option value={32}>32-bit (Standar Tugas / Default ~ 4.29 Miliar)</option>
                  <option value={64}>64-bit (Keamanan Menengah)</option>
                  <option value={128}>128-bit (Kuat / BigInt)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Menghasilkan modulus $n = p \times q$ dengan ukuran mendekati {bitSize * 2} bit.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Eksponen Publik $e$ (Opsional)</span>
                  <span className="text-[11px] text-slate-500">Kosongkan untuk auto (65537)</span>
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 65537, 79, 3, 17"
                  value={eManualGen}
                  onChange={(e) => setEManualGen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder:text-slate-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 disabled:bg-cyan-900/60 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-cyan-950/50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    Membuat Kunci...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4 text-slate-950" />
                    Generate Keypair Entitas {selectedEntity}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card 2: Manual Parameter Validation */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Metode 2: Validasi Manual ($p, q, e$)
                </h2>
              </div>
              <span className="text-xs text-amber-400 font-mono bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                Pre-filled Test Case
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Uji parameter matematis sesuai contoh modul kriptografi (contoh: $p=47$, $q=71$, $e=79$). Sistem akan menghitung $\phi(n)$ dan mencari invers modulo $d \equiv e^{'{'}-1{'}'} \pmod{\phi(n)}$.
            </p>

            <form onSubmit={handleValidate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
                    Prima $p$
                  </label>
                  <input
                    type="number"
                    value={manualP}
                    onChange={(e) => setManualP(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
                    Prima $q$
                  </label>
                  <input
                    type="number"
                    value={manualQ}
                    onChange={(e) => setManualQ(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 font-mono">
                  Eksponen Publik $e$
                </label>
                <input
                  type="number"
                  value={manualE}
                  onChange={(e) => setManualE(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Syarat: $\gcd(e, (p-1)(q-1)) = 1$ dan $1 &lt; e &lt; \phi(n)$
                </span>
              </div>

              <button
                type="submit"
                disabled={isValidating}
                className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 disabled:bg-amber-900/60 disabled:cursor-not-allowed text-slate-950 font-semibold px-4 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-amber-950/50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    Memvalidasi Parameter...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-slate-950" />
                    Validasi Manual ($p, q, e$)
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Key Result Card & Actions */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-6">
            {/* Header & Status Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <div>
                  <h2 className="text-base font-semibold text-slate-100">
                    Hasil Pasangan Kunci RSA
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Entitas: {ENTITIES[selectedEntity].name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentKeypair ? (
                  currentKeypair.valid ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      KUNCI VALID
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-rose-400 bg-rose-950/50 border border-rose-700">
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      INVALID PARAMETER
                    </span>
                  )
                ) : (
                  <span className="text-xs text-slate-500 italic">Belum Ada Kunci Dimuat</span>
                )}
              </div>
            </div>

            {/* Error Message banner if invalid */}
            {currentKeypair && !currentKeypair.valid && (
              <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5">Validasi Matematika Gagal:</span>
                  <span>{currentKeypair.message || 'Parameter tidak memenuhi syarat RSA prima / koprima.'}</span>
                </div>
              </div>
            )}

            {/* If no key at all */}
            {!currentKeypair && (
              <div className="py-12 px-4 text-center border border-dashed border-slate-800 rounded-lg">
                <KeyRound className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <h4 className="text-sm font-medium text-slate-300 mb-1">
                  Belum Ada Kunci yang Digenerate
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Gunakan tombol &quot;Generate Keypair&quot; di sisi kiri atau lakukan &quot;Validasi Manual&quot; dengan memasukkan nilai $p, q, e$.
                </p>
              </div>
            )}

            {/* If key exists */}
            {currentKeypair && (
              <div className="space-y-5">
                {/* Mathematical Parameter Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">Prima $p$</span>
                    <span className="text-xs font-mono font-medium text-slate-200 truncate block">
                      {currentKeypair.p ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">Prima $q$</span>
                    <span className="text-xs font-mono font-medium text-slate-200 truncate block">
                      {currentKeypair.q ?? 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">Modulus $n$ ($p \times q$)</span>
                    <span className="text-xs font-mono font-medium text-cyan-300 truncate block">
                      {currentKeypair.n ?? (currentKeypair.pub_key ? currentKeypair.pub_key[1] : 'N/A')}
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono block">Totient $\phi(n)$</span>
                    <span className="text-xs font-mono font-medium text-slate-200 truncate block">
                      {currentKeypair.phi ?? 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Public Key Display (Cyan Themed) */}
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                        Public Key $(e, n)$
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(currentKeypair.pub_key),
                          'Public Key'
                        )
                      }
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedField === 'Public Key' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-baseline justify-between text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500">Eksponen Publik ($e$):</span>
                      <span className="text-cyan-300 font-bold">
                        {currentKeypair.e ?? (currentKeypair.pub_key ? currentKeypair.pub_key[0] : 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500">Modulus ($n$):</span>
                      <span className="text-cyan-300 font-bold break-all max-w-[70%] text-right">
                        {currentKeypair.n ?? (currentKeypair.pub_key ? currentKeypair.pub_key[1] : 'N/A')}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-cyan-400/80">
                    Kunci ini dapat dibagikan secara publik untuk verifikasi tanda tangan digital atau enkripsi pesan rahasia.
                  </p>
                </div>

                {/* Private Key Display (Amber Themed) */}
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        Private Key $(d, n)$
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(currentKeypair.priv_key),
                          'Private Key'
                        )
                      }
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedField === 'Private Key' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <div className="flex items-baseline justify-between text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500">Eksponen Privat ($d$):</span>
                      <span className="text-amber-300 font-bold break-all max-w-[70%] text-right">
                        {currentKeypair.d ?? (currentKeypair.priv_key ? currentKeypair.priv_key[0] : 'N/A')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-slate-300 bg-slate-950/70 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-500">Modulus ($n$):</span>
                      <span className="text-amber-300 font-bold break-all max-w-[70%] text-right">
                        {currentKeypair.n ?? (currentKeypair.priv_key ? currentKeypair.priv_key[1] : 'N/A')}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    Rahasia matematis: Memenuhi $(e \times d) \pmod{\phi(n)} = 1$. Digunakan untuk signing dan dekripsi.
                  </p>
                </div>

                {/* Storage Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    {isCurrentKeySaved ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Tersimpan di LocalStorage (`securepass_key_{selectedEntity}`)
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">
                        Kunci ini belum disimpan untuk Entitas {selectedEntity}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isCurrentKeySaved && (
                      <button
                        type="button"
                        onClick={handleDeleteFromLocalStorage}
                        className="px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-800/60 transition-colors flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={!currentKeypair.valid}
                      onClick={handleSaveToLocalStorage}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-950/40 flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5 text-slate-950" />
                      Simpan Kunci ke LocalStorage
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Storage Overview Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Status Konfigurasi Kunci Seluruh Entitas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {(['A', 'B', 'C'] as EntityKey[]).map((id) => {
                const k = savedKeys[id]
                return (
                  <div
                    key={id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-slate-200">
                        Entitas {id}
                      </span>
                      {k ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-400" title="Kunci Siap" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600" title="Belum Dikonfigurasi" />
                      )}
                    </div>
                    {k ? (
                      <div className="text-[11px] font-mono text-slate-400 space-y-0.5">
                        <div className="truncate">e: {k.e ?? (k.pub_key ? k.pub_key[0] : '-')}</div>
                        <div className="truncate">n: {k.n ?? (k.pub_key ? k.pub_key[1] : '-')}</div>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-600 italic">Belum disimpan</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
