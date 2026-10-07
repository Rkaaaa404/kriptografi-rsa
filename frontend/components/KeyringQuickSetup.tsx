'use client'

import React, { useState, useEffect } from 'react'
import { KeyRound, Sparkles, CheckCircle2, AlertCircle, RefreshCw, ChevronDown, Check } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { loadKeyringFromStorage, saveKeyringToStorage, applyKeyPreset, type KeyringState } from '@/lib/keyring'

export function KeyringQuickSetup() {
  const [isOpen, setIsOpen] = useState(false)
  const [keyring, setKeyring] = useState<KeyringState>({ A: null, B: null, C: null })
  const [isGenerating, setIsGenerating] = useState(false)

  const syncKeys = () => setKeyring(loadKeyringFromStorage())

  useEffect(() => {
    syncKeys()
    window.addEventListener('securepass_keyring_updated', syncKeys)
    return () => window.removeEventListener('securepass_keyring_updated', syncKeys)
  }, [])

  const handleApplyPreset = (preset: 'academic' | '64bit') => {
    applyKeyPreset(preset)
    syncKeys()
    toast.success(
      preset === 'academic'
        ? 'Kunci Kuliah Berhasil Diaktifkan! (PPIC: p=47, q=71, e=79, d=1019)'
        : 'Kunci 64-bit Sample Berhasil Diaktifkan untuk 3 Entitas!'
    )
    setIsOpen(false)
  }

  const handleGenerateFreshKeys = async () => {
    setIsGenerating(true)
    try {
      const [keyA, keyB, keyC] = await Promise.all([
        api.generateKeypair({ bits: 32, entity: 'A' }),
        api.generateKeypair({ bits: 32, entity: 'B' }),
        api.generateKeypair({ bits: 32, entity: 'C' }),
      ])
      saveKeyringToStorage({ A: keyA, B: keyB, C: keyC })
      syncKeys()
      toast.success('3 Pasangan Kunci RSA Baru Berhasil Dibuat via Backend!')
      setIsOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal membuat kunci via API')
    } finally {
      setIsGenerating(false)
    }
  }

  const allReady = Boolean(keyring.A && keyring.B && keyring.C)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-subtle transition-colors"
      >
        <KeyRound className="w-3.5 h-3.5 text-zinc-500" />
        <span className="hidden sm:inline text-zinc-500">Keyring:</span>
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <span className={`px-1 rounded ${keyring.A ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-zinc-100 text-zinc-400'}`}>
            A:{keyring.A ? '✓' : '—'}
          </span>
          <span className={`px-1 rounded ${keyring.B ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-zinc-100 text-zinc-400'}`}>
            B:{keyring.B ? '✓' : '—'}
          </span>
          <span className={`px-1 rounded ${keyring.C ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'bg-zinc-100 text-zinc-400'}`}>
            C:{keyring.C ? '✓' : '—'}
          </span>
        </div>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-zinc-200 bg-white p-4 shadow-elevation z-50 animate-in fade-in zoom-in-95 duration-100 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h4 className="text-sm font-semibold text-zinc-900">RSA Keyring Hub</h4>
                <p className="text-xs text-zinc-500">Kelola kunci publik & privat 3 entitas</p>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                  allReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {allReady ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {allReady ? 'Lengkap (Siap)' : 'Belum Lengkap'}
              </span>
            </div>

            {/* Entity Mini Rows */}
            <div className="py-3 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    PPIC (Entitas A)
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {keyring.A ? `e=${keyring.A.pub_key[0]}, n=${keyring.A.pub_key[1]}` : 'Kunci belum diset'}
                  </div>
                </div>
                {keyring.A ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-zinc-400">—</span>}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Pos Gerbang (Entitas B)
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {keyring.B ? `e=${keyring.B.pub_key[0]}, n=${keyring.B.pub_key[1]}` : 'Kunci belum diset'}
                  </div>
                </div>
                {keyring.B ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-zinc-400">—</span>}
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-100">
                <div className="space-y-0.5">
                  <div className="font-medium text-zinc-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Gudang Penerima (Entitas C)
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    {keyring.C ? `e=${keyring.C.pub_key[0]}, n=${keyring.C.pub_key[1]}` : 'Kunci belum diset'}
                  </div>
                </div>
                {keyring.C ? <Check className="w-4 h-4 text-emerald-600" /> : <span className="text-zinc-400">—</span>}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-zinc-100 space-y-1.5">
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Aksi Cepat 1-Klik</div>
              <button
                onClick={() => handleApplyPreset('academic')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Kunci Kuliah ($p=47, q=71, e=79$)</span>
                </div>
                <span className="text-[10px] text-zinc-500">Rekomendasi</span>
              </button>

              <button
                onClick={() => handleApplyPreset('64bit')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors text-left"
              >
                <span>Sample 64-bit Multi-Entitas</span>
                <span className="text-[10px] text-zinc-400">Standard</span>
              </button>

              <button
                onClick={handleGenerateFreshKeys}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Menghitung Bilangan Prima...' : 'Generate 3 Kunci Acak Baru via API'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
