"""
Pydantic v2 request/response schemas for SecurePass RSA.

All models use Pydantic BaseModel with strict field definitions.
No external crypto libraries; crypto fields carry raw integers.
"""

from __future__ import annotations

import json
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ─── Key Management ───────────────────────────────────────────────────────────


class GenerateKeyRequest(BaseModel):
    """Request to generate an RSA keypair for a named entity.

    Args:
        bits: Prime bit-length for p and q (each prime is `bits` bits wide).
        entity: Warehouse entity label — A (PPIC/issuer), B (Gate), C (receiver).
        e_manual: Override public exponent; None means auto-select a valid e.
    """

    bits: int = Field(default=32, ge=16, le=52, description="Bit-length of each prime p, q (max 52 for JS safe integer)")
    entity: str = Field(default="A", pattern="^[ABC]$", description="Entity label: A | B | C")
    e_manual: Optional[int] = Field(default=None, description="Manual override for public exponent e")


class ValidateKeyRequest(BaseModel):
    """Request to validate an RSA keypair given raw primes and exponent.

    Args:
        p: First prime factor.
        q: Second prime factor.
        e: Candidate public exponent; must satisfy gcd(e, φ(n)) == 1.
    """

    p: int = Field(description="First prime factor p")
    q: int = Field(description="Second prime factor q")
    e: int = Field(description="Public exponent e")


class KeypairResponse(BaseModel):
    """Full RSA keypair with derived values.

    Args:
        pub_key: Public key as [e, n].
        priv_key: Private key as [d, n].
        p: Prime p used to generate the key.
        q: Prime q used to generate the key.
        phi: Euler totient φ(n) = (p-1)(q-1).
        n: RSA modulus n = p * q.
        e: Public exponent e.
        d: Private exponent d; satisfies (e * d) % φ(n) == 1.
        valid: Whether the key is mathematically valid.
        message: Human-readable status string.
    """

    pub_key: list[int] = Field(description="Public key [e, n]")
    priv_key: list[int] = Field(description="Private key [d, n]")
    p: int
    q: int
    phi: int
    n: int
    e: int
    d: int
    valid: bool = True
    message: str = "OK"


# ─── Inspector Trace ──────────────────────────────────────────────────────────


class InspectTraceRequest(BaseModel):
    """Request to trace the step-by-step execution of a core RSA algorithm.

    Args:
        algorithm: Algorithm identifier — "eea" | "mod_exp" | "miller_rabin".
        params: Algorithm-specific input parameters as a free-form dict.
    """

    algorithm: str = Field(description='Algorithm to trace: "eea" | "mod_exp" | "miller_rabin"')
    params: dict[str, Any] = Field(description="Algorithm-specific input parameters")


class InspectStep(BaseModel):
    """Single recorded step from an algorithm trace.

    Args:
        step_number: 1-based sequential step index.
        operation: Human-readable operation name performed at this step.
        details: Key-value pairs with intermediate values for this step.
    """

    step_number: int = Field(description="1-based step index")
    operation: str = Field(description="Operation name at this step")
    details: dict[str, Any] = Field(description="Intermediate values for this step")


class InspectTraceResponse(BaseModel):
    """Full algorithm trace with all intermediate steps and final result.

    Args:
        algorithm: Echo of the requested algorithm name.
        input_params: Echo of the input parameters.
        steps: Ordered list of traced steps.
        result: Final computed value (type depends on algorithm).
    """

    algorithm: str
    input_params: dict[str, Any]
    steps: list[InspectStep]
    result: Any


# ─── Gate Pass Domain ─────────────────────────────────────────────────────────


class ItemEntry(BaseModel):
    """Single line item in a gate pass manifest.

    Args:
        sku: Stock-keeping unit identifier.
        name: Human-readable item name.
        qty: Integer quantity dispatched.
        unit: Unit of measure (default "unit").
    """

    sku: str = Field(description="Stock-keeping unit identifier")
    name: str = Field(description="Item name")
    qty: int = Field(description="Quantity dispatched")
    unit: str = Field(default="unit", description="Unit of measure")


class ManifestHeader(BaseModel):
    """Canonical gate pass manifest — all fields feed the hash/signature pipeline.

    Args:
        pass_id: Unique pass identifier, e.g. "SP-20241006-0001".
        timestamp: ISO-8601 issuance datetime string.
        valid_until: ISO-8601 expiry datetime string.
        issuer_entity: Issuing department label (default "Entity-A-PPIC").
        origin: Origin location label.
        destination: Destination location label.
        vehicle_plate: Vehicle licence plate string.
        driver_name: Full name of driver.
        item_list: Non-empty list of dispatched items.
    """

    pass_id: str = Field(description="Unique pass identifier")
    timestamp: str = Field(description="ISO-8601 issuance datetime")
    valid_until: str = Field(description="ISO-8601 expiry datetime")
    issuer_entity: str = Field(default="Entity-A-PPIC", description="Issuing entity label")
    origin: str = Field(description="Origin location")
    destination: str = Field(description="Destination location")
    vehicle_plate: str = Field(description="Vehicle licence plate")
    driver_name: str = Field(description="Driver full name")
    item_list: list[ItemEntry] = Field(description="Dispatched items")

    def to_canonical_str(self) -> str:
        """Produce a deterministic canonical JSON string for hashing.

        Serialises the manifest with sorted keys and no whitespace so that
        identical manifests always produce byte-for-byte identical strings,
        regardless of field insertion order.

        The canonical form is used as input to the Polynomial-Rolling-Hash-313
        before RSA signing.

        Returns:
            str: Compact, sorted-key JSON representation of the manifest.

        Example:
            >>> m = ManifestHeader(pass_id="SP-001", ...)
            >>> s = m.to_canonical_str()
            >>> s.startswith("{")
            True
        """
        data = self.model_dump()
        return json.dumps(data, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


class SecurityLayer(BaseModel):
    """Metadata describing the cryptographic algorithms used in a gate pass.

    Args:
        algorithm: RSA implementation label.
        hash_algorithm: Hash algorithm label.
        key_size_bits_a: Bit-length of Entity-A's RSA key.
        key_size_bits_b: Bit-length of Entity-B's RSA key.
        key_size_bits_c: Bit-length of Entity-C's RSA key.
    """

    algorithm: str = Field(default="RSA-Custom-Scratch", description="RSA implementation label")
    hash_algorithm: str = Field(
        default="Polynomial-Rolling-Hash-313", description="Hash algorithm label"
    )
    key_size_bits_a: int = Field(default=32, description="Entity-A key bit-length")
    key_size_bits_b: int = Field(default=32, description="Entity-B key bit-length")
    key_size_bits_c: int = Field(default=32, description="Entity-C key bit-length")


class GateClearance(BaseModel):
    """Gate inspection clearance record appended by Entity-B (gate officer).

    Args:
        gate_id: Logical gate identifier, e.g. "GATE-OUT-01".
        inspector_id: Officer identifier who performed inspection.
        timestamp_inspected: ISO-8601 datetime of inspection.
        status: "APPROVED" or "REJECTED".
        counter_signature: RSA signature of clearance digest by Entity-B's private key.
        clearance_digest: Hash of clearance fields used as signing input.
    """

    gate_id: str = Field(description="Gate identifier")
    inspector_id: str = Field(description="Inspecting officer identifier")
    timestamp_inspected: str = Field(description="ISO-8601 inspection datetime")
    status: str = Field(description='"APPROVED" | "REJECTED"')
    counter_signature: Optional[int] = Field(
        default=None, description="RSA counter-signature integer"
    )
    clearance_digest: Optional[int] = Field(
        default=None, description="Hash digest used as counter-signature input"
    )


class GatePassPackage(BaseModel):
    """Complete signed gate pass token payload.

    Args:
        security: Cryptographic metadata layer.
        header: Manifest with cargo / logistics data.
        encrypted_secret: Secret note encrypted with Entity-C's public key, as list[int].
        primary_signature: RSA signature of manifest hash by Entity-A's private key.
        clearance: Gate inspection clearance record (null before gate scan).
        nonce: UUID-v4 string preventing replay attacks.
    """

    security: SecurityLayer
    header: ManifestHeader
    encrypted_secret: list[int] = Field(description="Encrypted secret note as integer blocks")
    primary_signature: int = Field(description="RSA signature of manifest hash by Entity-A")
    clearance: Optional[GateClearance] = Field(default=None, description="Gate clearance record")
    nonce: str = Field(description="UUID-v4 anti-replay nonce")


# ─── Pass Operations ──────────────────────────────────────────────────────────


class IssuePassRequest(BaseModel):
    """Request to issue and sign a new gate pass.

    Args:
        manifest: Manifest header describing the shipment.
        priv_key_a: Entity-A's private key as [d, n].
        pub_key_c: Entity-C's public key as [e, n] (for secret encryption).
        secret_note: Plaintext secret note to encrypt for Entity-C.
        key_bits_a: Bit-length label for Entity-A's key (metadata only).
        key_bits_c: Bit-length label for Entity-C's key (metadata only).
    """

    manifest: ManifestHeader
    priv_key_a: list[int] = Field(description="Entity-A private key [d, n]")
    pub_key_c: list[int] = Field(description="Entity-C public key [e, n]")
    secret_note: str = Field(description="Plaintext secret note")
    key_bits_a: int = Field(default=32, description="Entity-A key bit-length label")
    key_bits_c: int = Field(default=32, description="Entity-C key bit-length label")


class IssuePassResponse(BaseModel):
    """Response from the pass issuance endpoint.

    Args:
        token_base64: Base64-encoded JSON-serialised GatePassPackage.
        package: Raw GatePassPackage dict (for UI inspection).
        digest_hash: Polynomial rolling hash of the canonical manifest string.
        signature: Primary RSA signature integer (same as package.primary_signature).
    """

    token_base64: str = Field(description="Base64-encoded GatePassPackage token")
    package: dict[str, Any] = Field(description="Raw GatePassPackage dict")
    digest_hash: int = Field(description="Hash of canonical manifest")
    signature: int = Field(description="RSA signature integer")


class GateVerifyRequest(BaseModel):
    """Request to verify a gate pass token at the gate scanner.

    Args:
        token_base64: Base64-encoded GatePassPackage token.
        pub_key_a: Entity-A's public key as [e, n] for signature verification.
    """

    token_base64: str = Field(description="Base64-encoded GatePassPackage token")
    pub_key_a: list[int] = Field(description="Entity-A public key [e, n]")


class GateVerifyResponse(BaseModel):
    """Response from the gate verification endpoint.

    Args:
        valid: True if signature is valid and pass is not replayed.
        manifest: Decoded manifest dict (present when valid is True).
        is_replayed: True if the nonce was seen before (replay attack detected).
        error_code: Machine-readable error code on failure.
        message: Human-readable verification outcome.
        digest_expected: Hash recomputed from manifest (for audit display).
        digest_recovered: Hash recovered by RSA-decrypting the signature.
    """

    valid: bool
    manifest: Optional[dict[str, Any]] = None
    is_replayed: bool = False
    error_code: Optional[str] = None
    message: str
    digest_expected: Optional[int] = None
    digest_recovered: Optional[int] = None


class ClearanceRequest(BaseModel):
    """Request for a gate officer to apply clearance to an existing pass token.

    Args:
        token_base64: Base64-encoded GatePassPackage token.
        priv_key_b: Entity-B's private key as [d, n] for counter-signing.
        officer_id: Unique officer identifier string.
        gate_id: Logical gate identifier (default "GATE-OUT-01").
    """

    token_base64: str = Field(description="Base64-encoded GatePassPackage token")
    pub_key_a: list[int] = Field(description="Entity-A public key [e, n] for primary signature verification")
    priv_key_b: list[int] = Field(description="Entity-B private key [d, n]")
    officer_id: str = Field(description="Gate officer identifier")
    gate_id: str = Field(default="GATE-OUT-01", description="Logical gate identifier")


class ClearanceResponse(BaseModel):
    """Response from the gate clearance endpoint.

    Args:
        updated_token_base64: New Base64-encoded token with clearance embedded.
        clearance: Clearance record dict (mirrors GateClearance fields).
    """

    updated_token_base64: str = Field(description="Updated token with clearance embedded")
    clearance: dict[str, Any] = Field(description="Embedded clearance record")


class ReceiveRequest(BaseModel):
    """Request for Entity-C to receive and fully verify a gate pass.

    Args:
        token_base64: Base64-encoded GatePassPackage token.
        pub_key_a: Entity-A's public key [e, n] for primary signature verification.
        pub_key_b: Entity-B's public key [e, n] for counter-signature verification.
        priv_key_c: Entity-C's private key [d, n] for secret decryption.
    """

    token_base64: str = Field(description="Base64-encoded GatePassPackage token")
    pub_key_a: list[int] = Field(description="Entity-A public key [e, n]")
    pub_key_b: list[int] = Field(description="Entity-B public key [e, n]")
    priv_key_c: list[int] = Field(description="Entity-C private key [d, n]")


class ReceiveResponse(BaseModel):
    """Response from the pass receive endpoint.

    Args:
        valid_a: True if Entity-A's primary signature verified successfully.
        valid_b: True if Entity-B's counter-signature verified successfully.
        decrypted_secret: Plaintext secret note recovered by Entity-C's private key.
        message: Human-readable combined verification outcome.
        error_code: Machine-readable error code on failure.
    """

    valid_a: bool
    valid_b: bool
    decrypted_secret: Optional[str] = None
    message: str
    error_code: Optional[str] = None


# ─── Attack Lab ───────────────────────────────────────────────────────────────


class AttackRequest(BaseModel):
    """Request to simulate a cryptographic attack on a gate pass token.

    Supported attack types:

    - ``tamper`` — modify manifest fields then re-verify; expect HASH_MISMATCH.
    - ``rogue_signer`` — sign a forged manifest with a different private key.
    - ``corrupt_sig`` — flip bits in ``primary_signature``; expect INVALID_SIGNATURE.
    - ``replay`` — submit same token twice; expect REPLAY_ATTACK_DETECTED.

    Args:
        attack_type: One of "tamper" | "rogue_signer" | "corrupt_sig" | "replay".
        token_base64: Base64-encoded GatePassPackage token to attack.
        pub_key_a: Entity-A's public key [e, n] used during verification.
        modifications: Field overrides applied to the package before re-verification.
        rogue_priv_key: Alternative private key [d, n] used by rogue_signer attack.
    """

    attack_type: str = Field(
        description='"tamper" | "rogue_signer" | "corrupt_sig" | "replay"'
    )
    token_base64: str = Field(description="Base64-encoded GatePassPackage token")
    pub_key_a: list[int] = Field(description="Entity-A public key [e, n]")
    modifications: dict[str, Any] = Field(
        default_factory=dict, description="Field overrides for tamper/rogue attacks"
    )
    rogue_priv_key: Optional[list[int]] = Field(
        default=None, description="Rogue private key [d, n] for rogue_signer attack"
    )


class AttackResponse(BaseModel):
    """Response describing the outcome of a simulated attack.

    Args:
        status: High-level outcome label, e.g. "TAMPERED", "INVALID_SIGNATURE",
                "SIGNATURE_CORRUPTED", "REPLAY_ATTACK_DETECTED".
        error_code: Machine-readable error code matching the detected failure mode.
        details: Diagnostic dict with intermediate values (hashes, recovered sigs, etc.).
        message: Human-readable explanation of why the attack was detected.
    """

    status: str = Field(
        description='"TAMPERED" | "INVALID_SIGNATURE" | "SIGNATURE_CORRUPTED" | "REPLAY_ATTACK_DETECTED"'
    )
    error_code: str = Field(description="Machine-readable error code")
    details: dict[str, Any] = Field(description="Diagnostic intermediate values")
    message: str = Field(description="Human-readable detection explanation")


# ─── Standalone Encryption & Decryption Trace ────────────────────────────────


class EncryptDecryptBlockTrace(BaseModel):
    """Trace details for a single chunk/block in text encryption/decryption."""

    block_index: int = Field(description="0-based sequential block index")
    raw_bytes_hex: str = Field(description="Hexadecimal representation of chunk bytes")
    raw_bytes_int: list[int] = Field(description="List of integer byte values in chunk")
    m: int = Field(description="Plaintext integer m < n")
    c: int = Field(description="Ciphertext integer c = m^e mod n")
    decrypted_m: Optional[int] = Field(default=None, description="Decrypted integer m' = c^d mod n")
    decrypted_bytes_hex: Optional[str] = Field(
        default=None, description="Hexadecimal representation of decrypted chunk bytes"
    )


class EncryptDecryptTraceRequest(BaseModel):
    """Request for step-by-step RSA text encryption and optional decryption."""

    text: str = Field(description="Plaintext string to encrypt and trace")
    pub_key: list[int] = Field(description="Public key [e, n]")
    priv_key: Optional[list[int]] = Field(
        default=None, description="Optional private key [d, n] for decryption trace"
    )


class EncryptDecryptTraceResponse(BaseModel):
    """Comprehensive trace of text encryption and optional decryption."""

    original_text: str = Field(description="Original input string")
    original_bytes_hex: str = Field(description="Hex string of input UTF-8 bytes")
    original_bytes_length: int = Field(description="Total bytes in input UTF-8 string")
    block_size_bytes: int = Field(description="Adaptive block size B in bytes")
    modulus_bits: int = Field(description="Bit length of modulus n")
    blocks: list[EncryptDecryptBlockTrace] = Field(description="Per-block computation traces")
    ciphertexts: list[int] = Field(description="List of ciphertext block integers")
    decrypted_text: Optional[str] = Field(
        default=None, description="Reconstructed decrypted text (if priv_key provided)"
    )
    is_reversible: Optional[bool] = Field(
        default=None, description="True if decrypted_text matches original_text"
    )
