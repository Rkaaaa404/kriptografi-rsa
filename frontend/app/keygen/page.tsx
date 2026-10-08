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
  Sparkles,
  Calculator,
} from 'lucide-react'

type EntityKey = 'A' | 'B' | 'C'

interface EntityMeta {
  id: EntityKey
  name: string
  role: string
  description: string
  storageKey: string
  badgeColor: string
}

const ENTITIES: Record<EntityKey, EntityMeta> = {
  A: {
    id: 'A',
    name: 'PPIC (Entitas A)',
    role: 'Penerbit Dokumen & Signature Pengirim',
    description: 'Membuat surat jalan dan menandatangani manifest dengan Kunci Privat PPIC (d).',
    storageKey: 'securepass_key_A',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  B: {
    id: 'B',
    name: 'Pos Gerbang (Entitas B)',
    role: 'Pemeriksa Pos & Counter-Signature',
    description: 'Memverifikasi signature PPIC di pos gerbang dan menambahkan approval clearance (d).',
    storageKey: 'securepass_key_B',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  C: {
    id: 'C',
    name: 'Gudang Penerima (Entitas C)',
    role: 'Dekripsi Rahasia & Verifikasi Akhir',
    description: 'Menerima paket, memvalidasi dual-signature berantai, dan mendekripsi memo rahasia (d).',
    storageKey: 'securepass_key_C',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
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

  const [copiedField, setCopiedField] = useState<string | null>(null)

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

  const handleSaveToLocalStorage = () => {
    if (!currentKeypair || !currentKeypair.valid) {
      toast.error('Tidak ada kunci valid untuk disimpan!')
      return
    }

    const keyName = `securepass_key_${selectedEntity}`
    localStorage.setItem(keyName, JSON.stringify(currentKeypair))
    refreshStoredKeys()
    window.dispatchEvent(new Event('securepass_keyring_updated'))
    toast.success(`Kunci ${ENTITIES[selectedEntity].name} tersimpan ke LocalStorage`)
  }

  const handleDeleteFromLocalStorage = () => {
    const keyName = `securepass_key_${selectedEntity}`
    localStorage.removeItem(keyName)
    refreshStoredKeys()
    window.dispatchEvent(new Event('securepass_keyring_updated'))
    toast.info(`Kunci ${ENTITIES[selectedEntity].name} dihapus dari LocalStorage`)
  }

  const isCurrentKeySaved = Boolean(savedKeys[selectedEntity])

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* Page Title */}
      <div className="border-b border-zinc-200/80 pb-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold uppercase tracking-wider mb-2">
          <KeyRound className="w-3.5 h-3.5" /> Keyring Engine
        </div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
          Pengelolaan Kunci RSA &amp; Generator Parameter
        </h1>
        <p className="text-sm text-zinc-600 mt-1 max-w-2xl">
          Generasi dan validasi pasangan kunci asimetris $(e, n)$ dan $(d, n)$ untuk tiap entitas rantai pasok logistik.
        </p>
      </div>

      {/* Entity Selection Tabs */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Pilih Entitas Rantai Pasok
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['A', 'B', 'C'] as EntityKey[]).map((id) => {
            const entity = ENTITIES[id]
            const isSelected = selectedEntity === id
            const isSaved = Boolean(savedKeys[id])

            return (
              <button
                key={id}
                onClick={() => setSelectedEntity(id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-subtle'
                    : 'border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 shadow-subtle'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                      isSelected ? 'bg-zinc-800 text-white border-zinc-700' : entity.badgeColor
                    }`}
                  >
                    Entitas {id}
                  </span>
                  {isSaved ? (
                    <span className="text-[11px] font-medium flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-400">Kosong</span>
                  )}
                </div>
                <div className="font-semibold text-sm mt-2">{entity.name}</div>
                <div className={`text-xs mt-0.5 line-clamp-2 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {entity.role}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Two Column Configuration: Auto Generate & Manual Validate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Automatic Generation Form */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Cpu className="w-4 h-4 text-zinc-700" />
            <h3 className="font-bold text-sm text-zinc-900">1. Generator Otomatis (Miller-Rabin Primes)</h3>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-600 font-medium mb-1">Panjang Bit Modulus (bits):</label>
              <select
                value={bitSize}
                onChange={(e) => setBitSize(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              >
                <option value={16}>16 bits (Demo Cepat)</option>
                <option value={32}>32 bits (Standar Tugas)</option>
                <option value={48}>48 bits (Aman Presisi JS / MAX_SAFE_INTEGER)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-600 font-medium mb-1">Nilai Eksponen Publik e (Opsional):</label>
              <input
                type="text"
                placeholder="Default: 65537"
                value={eManualGen}
                onChange={(e) => setEManualGen(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Mencari Prima...' : 'Generate Kunci Acak via Backend'}</span>
            </button>
          </form>
        </div>

        {/* Column 2: Manual Validation Form (Kuliah p=47, q=71, e=79) */}
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
            <Calculator className="w-4 h-4 text-zinc-700" />
            <h3 className="font-bold text-sm text-zinc-900">2. Input Manual Parameter Kuliah (Bab 3)</h3>
          </div>

          <form onSubmit={handleValidate} className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Prima p:</label>
                <input
                  type="number"
                  value={manualP}
                  onChange={(e) => setManualP(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Prima q:</label>
                <input
                  type="number"
                  value={manualQ}
                  onChange={(e) => setManualQ(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-600 font-medium mb-1">Eksponen e:</label>
                <input
                  type="number"
                  value={manualE}
                  onChange={(e) => setManualE(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 font-mono text-zinc-900 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400">
              Contoh dosen: p = 47, q = 71 &rarr; n = 3337, &phi;(n) = 3220. Dipilih e = 79 &rarr; d = 1019.
            </p>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-800 font-medium text-xs transition-colors shadow-subtle disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
              <span>{isValidating ? 'Memvalidasi...' : 'Hitung Parameter & Validasi EEA'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Active Keypair Result Display Card */}
      {currentKeypair && (
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
            <div>
              <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Hasil Pasangan Kunci ({ENTITIES[selectedEntity].name})
              </div>
              <div className="text-base font-bold text-zinc-900 mt-0.5">
                Public Key: [e={currentKeypair.e}, n={currentKeypair.n}]
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveToLocalStorage}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 text-white font-medium text-xs hover:bg-zinc-800 shadow-subtle"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Kunci</span>
              </button>

              {isCurrentKeySaved && (
                <button
                  onClick={handleDeleteFromLocalStorage}
                  className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:text-rose-600 hover:bg-zinc-50"
                  title="Hapus kunci tersimpan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Key Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-zinc-400 text-[11px]">Prima p:</span>
              <div className="font-bold text-zinc-900 mt-0.5">{currentKeypair.p}</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-zinc-400 text-[11px]">Prima q:</span>
              <div className="font-bold text-zinc-900 mt-0.5">{currentKeypair.q}</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-zinc-400 text-[11px]">Modulus n (p × q):</span>
              <div className="font-bold text-zinc-900 mt-0.5">{currentKeypair.n}</div>
            </div>
            <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
              <span className="text-zinc-400 text-[11px]">Totient φ(n):</span>
              <div className="font-bold text-zinc-900 mt-0.5">{currentKeypair.phi}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 flex items-center justify-between">
              <div>
                <span className="text-blue-700 text-[11px] font-sans font-semibold block">
                  Public Key (e, n):
                </span>
                <span className="font-bold text-blue-950 mt-0.5 block">
                  [{currentKeypair.e}, {currentKeypair.n}]
                </span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`[${currentKeypair.e}, ${currentKeypair.n}]`, 'Public Key')
                }
                className="p-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                {copiedField === 'Public Key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 flex items-center justify-between">
              <div>
                <span className="text-amber-800 text-[11px] font-sans font-semibold block">
                  Private Key (d, n) - RAHASIA:
                </span>
                <span className="font-bold text-amber-950 mt-0.5 block">
                  [{currentKeypair.d}, {currentKeypair.n}]
                </span>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(`[${currentKeypair.d}, ${currentKeypair.n}]`, 'Private Key')
                }
                className="p-1.5 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-100"
              >
                {copiedField === 'Private Key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
