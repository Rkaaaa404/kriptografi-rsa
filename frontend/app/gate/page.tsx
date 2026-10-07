'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GateRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/#pipeline')
  }, [router])

  return (
    <div className="max-w-md mx-auto py-16 text-center text-xs text-zinc-500">
      Mengalihkan ke Alur Terpadu Surat Jalan (Unified Pipeline)...
    </div>
  )
}
