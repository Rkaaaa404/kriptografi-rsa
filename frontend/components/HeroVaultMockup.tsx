'use client'

import React from 'react'
import { ShieldCheck, Lock, CheckCircle2, Wifi, KeyRound, Sparkles, Layers } from 'lucide-react'

export function HeroVaultMockup() {
  return (
    <div className="relative w-full max-w-md mx-auto py-4 select-none">
      {/* Background Soft Glow */}
      <div className="absolute -top-10 -right-10 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-100/40 rounded-full blur-3xl pointer-events-none" />

      {/* Base Card: Manifest Dashboard (Finpay White Card Style) */}
      <div className="relative z-10 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-finpay transition-transform duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Layers className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900">Manifest #SJ-2026-0881</div>
              <div className="text-[11px] text-slate-500 font-mono">PT Logistik Manufaktur</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Dual-Signed
          </span>
        </div>

        {/* Big Amount / Qty Section */}
        <div className="pt-4 pb-2">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Muatan Kargo Terverifikasi</div>
          <div className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            500 <span className="text-base font-medium text-slate-500">Unit Bearing Presisi</span>
          </div>
        </div>

        {/* Security Parameters Row */}
        <div className="space-y-2 pt-2">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-teal-600" /> Memo Rahasia Enkripsi:
            </span>
            <span className="font-mono text-slate-800 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200/70 text-[11px]">
              Encrypted (e_C)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Freshness Nonce:
            </span>
            <span className="font-mono text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 0x8f2d... (Unused)
            </span>
          </div>
        </div>

        {/* Dual Signatures Trace Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-xl bg-teal-50/50 border border-teal-100/60">
            <div className="text-[10px] uppercase font-bold text-teal-700">Tanda Tangan PPIC (S_A)</div>
            <div className="font-mono text-xs font-semibold text-teal-900 mt-0.5">2841 &bull; VALID</div>
          </div>
          <div className="p-2 rounded-xl bg-slate-100/80 border border-slate-200/60">
            <div className="text-[10px] uppercase font-bold text-slate-600">Approval Gerbang (S_B)</div>
            <div className="font-mono text-xs font-semibold text-slate-900 mt-0.5">1943 &bull; CLEARED</div>
          </div>
        </div>
      </div>

      {/* Floating Top Card: RSA Key Vault Card (Finpay Dark Teal Floating Debit Card Style) */}
      <div className="absolute -top-6 sm:-top-8 -right-3 sm:-right-6 z-20 w-56 sm:w-64 rounded-2xl bg-gradient-to-br from-[#008579] via-[#056d64] to-[#08443e] text-white p-4 sm:p-5 shadow-cardFloat border border-white/20 transform hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wider uppercase text-teal-100/90 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-teal-200" /> Pure RSA-1024
          </span>
          <Wifi className="w-4 h-4 text-teal-200 rotate-90" />
        </div>

        {/* EMV Chip & Key Representation */}
        <div className="my-3 sm:my-4 flex items-center justify-between">
          <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-300/80 shadow-sm flex items-center justify-center">
            <div className="w-4 h-3 border border-amber-600/40 rounded-sm" />
          </div>
          <div className="text-[10px] font-mono text-teal-100 bg-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
            0% EXTERNAL LIB
          </div>
        </div>

        <div className="space-y-1 font-mono">
          <div className="text-[10px] text-teal-200/80 uppercase tracking-wider font-sans">Kunci Publik &amp; Privat</div>
          <div className="text-xs sm:text-sm font-bold tracking-wider text-white">
            (e=79, n=3337)
          </div>
          <div className="text-[10px] text-teal-200">
            d = 1019 &bull; Entitas PPIC
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] font-sans">
          <span className="text-teal-100 font-medium">SOKRATES &times; BINUS</span>
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-200">
            <ShieldCheck className="w-3 h-3" /> VERIFIED
          </span>
        </div>
      </div>
    </div>
  )
}
