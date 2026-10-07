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

export const SAMPLE_64BIT_KEYS: { A: Keypair; B: Keypair; C: Keypair } = {
  A: {
    entity: 'A',
    p: 2965629853,
    q: 3512210077,
    n: 10415915054358628681,
    phi: 10415915047880788752,
    e: 65537,
    d: 7103934736258533281,
    pub_key: [65537, 10415915054358628681],
    priv_key: [7103934736258533281, 10415915054358628681],
    bit_length: 64,
  },
  B: {
    entity: 'B',
    p: 3030705913,
    q: 3445704799,
    n: 10442917908781776487,
    phi: 10442917902305365776,
    e: 65537,
    d: 4205243547305200241,
    pub_key: [65537, 10442917908781776487],
    priv_key: [4205243547305200241, 10442917908781776487],
    bit_length: 64,
  },
  C: {
    entity: 'C',
    p: 3625756891,
    q: 3927791519,
    n: 14241217166425607429,
    phi: 14241217158872059020,
    e: 65537,
    d: 9340223646791853653,
    pub_key: [65537, 14241217166425607429],
    priv_key: [9340223646791853653, 14241217166425607429],
    bit_length: 64,
  },
}

export function loadKeyringFromStorage(): KeyringState {
  if (typeof window === 'undefined') {
    return { A: null, B: null, C: null }
  }

  const parse = (key: string): Keypair | null => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  return {
    A: parse('securepass_key_A'),
    B: parse('securepass_key_B'),
    C: parse('securepass_key_C'),
  }
}

export function saveKeyringToStorage(keys: { A?: Keypair | null; B?: Keypair | null; C?: Keypair | null }) {
  if (typeof window === 'undefined') return

  if (keys.A) localStorage.setItem('securepass_key_A', JSON.stringify(keys.A))
  if (keys.B) localStorage.setItem('securepass_key_B', JSON.stringify(keys.B))
  if (keys.C) localStorage.setItem('securepass_key_C', JSON.stringify(keys.C))

  // Dispatch custom storage event for in-tab sync
  window.dispatchEvent(new Event('securepass_keyring_updated'))
}

export function applyKeyPreset(preset: 'academic' | '64bit') {
  const chosen = preset === 'academic' ? ACADEMIC_KEYS : SAMPLE_64BIT_KEYS
  saveKeyringToStorage(chosen)
  return chosen
}
