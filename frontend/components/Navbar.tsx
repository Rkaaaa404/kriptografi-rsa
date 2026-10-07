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
    <nav className="bg-white/85 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white shadow-subtle group-hover:bg-zinc-800 transition-colors">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-zinc-900 tracking-tight text-sm sm:text-base">SecurePass</span>
              <span className="text-[11px] font-mono font-medium px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 border border-zinc-200/60">
                RSA
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 shadow-subtle'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
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
      <div className="flex md:hidden px-4 py-1.5 border-t border-zinc-100 bg-zinc-50/50 gap-2 overflow-x-auto text-xs">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium ${
                isActive ? 'bg-white shadow-subtle text-zinc-900 font-semibold' : 'text-zinc-500'
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
