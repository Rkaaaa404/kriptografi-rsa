import type {
  Keypair, InspectTraceResponse, IssuePassResponse,
  GateVerifyResponse, ClearanceResponse, ClearanceRequest, ReceiveResponse,
  AttackResult, EncryptDecryptTraceRequest, EncryptDecryptTraceResponse,
} from '@/types/api'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  generateKeypair: (body: { bits: number; entity: string; e_manual?: number }) =>
    post<Keypair>('/api/v1/keys/generate', body),
  validateKeypair: (body: { p: number; q: number; e: number }) =>
    post<Keypair>('/api/v1/keys/validate', body),
  inspectTrace: (body: { algorithm: string; params: Record<string, unknown> }) =>
    post<InspectTraceResponse>('/api/v1/inspect/trace', body),
  issuePass: (body: object) => post<IssuePassResponse>('/api/v1/pass/issue', body),
  gateVerify: (body: object) => post<GateVerifyResponse>('/api/v1/pass/gate-verify', body),
  gateClearance: (body: ClearanceRequest | object) => post<ClearanceResponse>('/api/v1/pass/gate-clearance', body),
  receivePass: (body: object) => post<ReceiveResponse>('/api/v1/pass/receive', body),
  simulateAttack: (body: object) => post<AttackResult>('/api/v1/attack/simulate', body),
  inspectEncryptDecrypt: (body: EncryptDecryptTraceRequest) =>
    post<EncryptDecryptTraceResponse>('/api/v1/inspect/encrypt-decrypt', body),
}
