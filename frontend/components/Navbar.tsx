'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Key, Search, FileText, DoorOpen, Package, Zap } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Shield },
  { href: '/keygen', label: 'Key Management', icon: Key },
  { href: '/inspector', label: 'Crypto Inspector', icon: Search },
  { href: '/issue', label: 'Terbitkan Surat Jalan', icon: FileText },
  { href: '/gate', label: 'Pos Gerbang', icon: DoorOpen },
  { href: '/receiving', label: 'Gudang Penerima', icon: Package },
  { href: '/attack-lab', label: 'Attack Lab', icon: Zap },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 h-14 overflow-x-auto">
        <span className="text-cyan-400 font-bold text-lg mr-4 whitespace-nowrap flex items-center gap-2">
          <Shield className="w-5 h-5" /> SecurePass RSA
        </span>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
              pathname === href
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}>
            <Icon className="w-3.5 h-3.5" />{label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
