import { Keypair } from '@/types/api'

export interface KeyringState {
  A: Keypair | null
  B: Keypair | null
  C: Keypair | null
}

export const ACADEMIC_KEYS: { A: Keypair; B: Keypair; C: Keypair } = {
  // Bab 3 Laporan: p=47, q=71 => n=3337, phi=3220, e=79, d=1019
  A: {
    entity: 'A',
    p: 47,
    q: 71,
    n: 3337,
    phi: 3220,
    e: 79,
    d: 1019,
    pub_key: [79, 3337],
    priv_key: [1019, 3337],
    bit_length: 12,
  },
  // Entity B (Pos Gerbang): p=53, q=67 => n=3551, phi=3432, e=17, d=1817 (17*1817 % 3432 = 1)
  B: {
    entity: 'B',
    p: 53,
    q: 67,
    n: 3551,
    phi: 3432,
    e: 17,
    d: 1817,
    pub_key: [17, 3551],
    priv_key: [1817, 3551],
    bit_length: 12,
  },
  // Entity C (Gudang Penerima): p=61, q=73 => n=4453, phi=4320, e=47, d=1103 (47*1103 % 4320 = 1)
  C: {
    entity: 'C',
    p: 61,
    q: 73,
    n: 4453,
    phi: 4320,
    e: 47,
    d: 1103,
    pub_key: [47, 4453],
    priv_key: [1103, 4453],
    bit_length: 13,
  },
}

export const SAMPLE_32BIT_SAFE_KEYS: { A: Keypair; B: Keypair; C: Keypair } = {
  A: {
    entity: 'A',
    p: 37549,
    q: 34667,
    n: 1301711183,
    phi: 1301638968,
    e: 65537,
    d: 571384889,
    pub_key: [65537, 1301711183],
    priv_key: [571384889, 1301711183],
    bit_length: 31,
  },
  B: {
    entity: 'B',
    p: 53657,
    q: 51407,
    n: 2758345399,
    phi: 2758240336,
    e: 65537,
    d: 1974500593,
    pub_key: [65537, 2758345399],
    priv_key: [1974500593, 2758345399],
    bit_length: 32,
  },
  C: {
    entity: 'C',
    p: 42457,
    q: 62723,
    n: 2663030411,
    phi: 2662925232,
    e: 65537,
    d: 1284999473,
    pub_key: [65537, 2663030411],
    priv_key: [1284999473, 2663030411],
    bit_length: 32,
  },
}

export function loadKeyringFromStorage(): KeyringState {
  if (typeof window === 'undefined') {
    return { A: null, B: null, C: null }
  }

  const parse = (key: string): Keypair | null => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as Keypair
      // Guard against JavaScript floating point precision loss:
      // If modulus n exceeds Number.MAX_SAFE_INTEGER, the key cannot be accurately processed by JS.
      const modN = parsed.n ?? parsed.pub_key?.[1]
      if (typeof modN === 'number' && (modN > Number.MAX_SAFE_INTEGER || modN <= 1)) {
        localStorage.removeItem(key)
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  const keys = {
    A: parse('securepass_key_A'),
    B: parse('securepass_key_B'),
    C: parse('securepass_key_C'),
  }

  // If any entity key is missing or was cleared due to precision overflow, auto-heal with academic keys
  if (!keys.A || !keys.B || !keys.C) {
    saveKeyringToStorage(ACADEMIC_KEYS)
    return { ...ACADEMIC_KEYS }
  }

  return keys
}

export function saveKeyringToStorage(keys: { A?: Keypair | null; B?: Keypair | null; C?: Keypair | null }) {
  if (typeof window === 'undefined') return

  if (keys.A) localStorage.setItem('securepass_key_A', JSON.stringify(keys.A))
  if (keys.B) localStorage.setItem('securepass_key_B', JSON.stringify(keys.B))
  if (keys.C) localStorage.setItem('securepass_key_C', JSON.stringify(keys.C))

  // Dispatch custom storage event for in-tab sync
  window.dispatchEvent(new Event('securepass_keyring_updated'))
}

export function applyKeyPreset(preset: 'academic' | '32bit') {
  const chosen = preset === 'academic' ? ACADEMIC_KEYS : SAMPLE_32BIT_SAFE_KEYS
  saveKeyringToStorage(chosen)
  return chosen
}
