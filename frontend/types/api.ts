// ---------------------------------------------------------------------------
// SecurePass RSA – shared API TypeScript types
// ---------------------------------------------------------------------------

export interface SecurityLayer {
  algorithm: string;
  hash_algorithm: string;
  key_size_bits_a: number;
  key_size_bits_b: number;
  key_size_bits_c: number;
}

export interface ItemLine {
  sku: string;
  name: string;
  qty: number;
}

export interface ManifestHeader {
  pass_id: string;
  timestamp: string;
  valid_until: string;
  issuer_entity: string;
  origin: string;
  destination: string;
  vehicle_plate: string;
  driver_name: string;
  item_list: ItemLine[];
  items?: ItemLine[];
}

export interface GateClearance {
  gate_id: string;
  inspector_id?: string;
  officer_id?: string;
  timestamp_inspected?: string;
  cleared_at?: string;
  status?: string;
  counter_signature?: number;
  clearance_digest?: number;
  gate_signature?: number;
}
export interface GatePassPackage {
  security: SecurityLayer;
  header: ManifestHeader;
  encrypted_secret: number[];
  primary_signature: number;
  clearance: GateClearance | null;
  nonce: string;
}

export interface Keypair {
  pub_key: [number, number];
  priv_key: [number, number];
  p: number;
  q: number;
  phi: number;
  n?: number;
  e?: number;
  d?: number;
  valid?: boolean;
  message?: string;
  bit_length?: number;
  entity?: string;
}

export interface InspectStep {
  step_number?: number;
  step?: number;
  operation: string;
  details: Record<string, unknown>;
}

export interface InspectTraceResponse {
  algorithm: string;
  params: Record<string, unknown>;
  steps: InspectStep[];
  result: unknown;
}

export interface IssuePassResponse {
  token_base64: string;
  package: GatePassPackage;
  digest_hash: number;
  signature: number;
}

export interface GateVerifyResponse {
  valid: boolean;
  manifest?: ManifestHeader | null;
  is_replayed?: boolean;
  error_code?: string | null;
  message: string;
  digest_expected?: number | null;
  digest_recovered?: number | null;
}

export interface ClearanceResponse {
  updated_token_base64: string;
  clearance: GateClearance | Record<string, unknown>;
}

export interface ReceiveResponse {
  valid_a: boolean;
  valid_b: boolean;
  decrypted_secret?: string | null;
  message: string;
  error_code?: string | null;
}

export interface AttackResponse {
  status: string;
  error_code: string;
  details: Record<string, unknown>;
  message?: string;
}

export type AttackResult = AttackResponse;

export interface VerifyResult {
  valid: boolean;
  manifest?: ManifestHeader;
  is_replayed?: boolean;
  message: string;
}
