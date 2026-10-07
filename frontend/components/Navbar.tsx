'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Layers, ShieldAlert, Binary, Sparkles } from 'lucide-react'
import { KeyringQuickSetup } from './KeyringQuickSetup'

const navItems = [
  { href: '/', label: 'Surat Jalan (Pipeline)', icon: Layers },
  { href: '/attack-lab', label: 'Attack Lab', icon: ShieldAlert },
  { href: '/inspector', label: 'Crypto Inspector', icon: Binary },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 animate-fade-in-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#081c26] flex items-center justify-center text-white shadow-sm group-hover:bg-[#008579] transition-colors">
              <Shield className="w-4 h-4 text-teal-400 group-hover:text-white transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">SecurePass</span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/60 uppercase">
                RSA CORE
              </span>
            </div>
          </Link>

          {/* Primary Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-100 text-slate-900 shadow-subtle'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#008579]' : 'text-slate-400'}`} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Section: Keyring Quick Setup & Status */}
        <div className="flex items-center gap-3">
          <KeyringQuickSetup />
        </div>
      </div>

      {/* Mobile Nav strip */}
      <div className="flex md:hidden px-4 py-2 border-t border-slate-100 bg-slate-50/80 gap-2 overflow-x-auto text-xs">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap text-xs font-semibold ${
                isActive ? 'bg-white shadow-subtle text-[#008579]' : 'text-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
