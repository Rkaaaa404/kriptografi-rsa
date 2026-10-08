"""APIRouter for Gate Pass issuance, gate verification, clearance, and receiving."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from backend.models.schemas import (
    IssuePassRequest,
    IssuePassResponse,
    GateVerifyRequest,
    GateVerifyResponse,
    ClearanceRequest,
    ClearanceResponse,
    ReceiveRequest,
    ReceiveResponse,
    GateClearance,
    GatePassPackage,
    SecurityLayer,
)
from backend.core.rsa_engine import (
    sign,
    verify,
    encrypt_payload,
    decrypt_payload,
    mod_exp,
)
from backend.routers.nonce_registry import nonce_registry
from backend.routers.protocol import (
    encode_token_package,
    decode_token_package,
    compute_primary_digest,
    compute_clearance_digest,
)

router = APIRouter()


@router.post("/issue", response_model=IssuePassResponse)
def issue_pass(req: IssuePassRequest) -> IssuePassResponse:
    """PPIC (Entity A) signs manifest payload and encrypts secret note for Entity C."""
    priv_a = (req.priv_key_a[0], req.priv_key_a[1])
    pub_c = (req.pub_key_c[0], req.pub_key_c[1])

    nonce_val = uuid.uuid4().hex

    # Encrypt secret note using Entity C's public key
    encrypted_secret = encrypt_payload(req.secret_note, pub_c)

    # Deterministic primary digest binding manifest header, nonce, and encrypted secret (F1 & F3)
    digest_hash = compute_primary_digest(req.manifest, nonce_val, encrypted_secret)

    # Digital signature S_A = (H % n)^d mod n
    primary_sig = sign(digest_hash, priv_a)

    security_meta = SecurityLayer(
        key_size_bits_a=req.key_bits_a,
        key_size_bits_b=32,
        key_size_bits_c=req.key_bits_c,
    )

    package = GatePassPackage(
        security=security_meta,
        header=req.manifest,
        encrypted_secret=encrypted_secret,
        primary_signature=primary_sig,
        clearance=None,
        nonce=nonce_val,
    )

    pkg_dict = package.model_dump()
    token_b64 = encode_token_package(package)

    return IssuePassResponse(
        token_base64=token_b64,
        package=pkg_dict,
        digest_hash=digest_hash,
        signature=primary_sig,
    )


@router.post("/gate-verify", response_model=GateVerifyResponse)
def gate_verify(req: GateVerifyRequest) -> GateVerifyResponse:
    """Security Guard (Entity B) verifies manifest integrity and checks replay/expiration."""
    package = decode_token_package(req.token_base64)

    nonce_val = package.nonce
    if nonce_registry.is_replayed(nonce_val):
        return GateVerifyResponse(
            valid=False,
            manifest=package.header.model_dump(),
            is_replayed=True,
            error_code="REPLAY_ATTACK_DETECTED",
            message=f"Nonce {nonce_val} has already been processed previously! Replay attack detected.",
        )

    # Check expiration (ISO-8601 UTC)
    try:
        valid_until_dt = datetime.fromisoformat(package.header.valid_until.replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        if now_dt.timestamp() > valid_until_dt.timestamp() + 60.0:  # 60s grace
            return GateVerifyResponse(
                valid=False,
                manifest=package.header.model_dump(),
                is_replayed=False,
                error_code="EXPIRED_PASS",
                message=f"Pass expired at {package.header.valid_until}. Current time: {now_dt.isoformat()}",
            )
    except Exception:
        pass  # If date parsing fails, continue to signature check

    # Verify primary signature with unified digest (F1 & F3)
    digest_expected = compute_primary_digest(package.header, package.nonce, package.encrypted_secret)
    pub_a = (req.pub_key_a[0], req.pub_key_a[1])

    is_sig_valid = verify(digest_expected, package.primary_signature, pub_a)

    # Recovered digest value for diagnostic display
    recovered_digest = mod_exp(package.primary_signature, pub_a[0], pub_a[1]) if (0 <= package.primary_signature < pub_a[1]) else None

    if not is_sig_valid:
        return GateVerifyResponse(
            valid=False,
            manifest=package.header.model_dump(),
            is_replayed=False,
            error_code="HASH_MISMATCH",
            message="Verification FAILED! Manifest has been tampered with or signature is invalid.",
            digest_expected=digest_expected % pub_a[1],
            digest_recovered=recovered_digest,
        )

    return GateVerifyResponse(
        valid=True,
        manifest=package.header.model_dump(),
        is_replayed=False,
        message="Signature VALID & Authentic! Manifest physical cargo cleared for inspection.",
        digest_expected=digest_expected % pub_a[1],
        digest_recovered=recovered_digest,
    )


@router.post("/gate-clearance", response_model=ClearanceResponse)
def gate_clearance(req: ClearanceRequest) -> ClearanceResponse:
    """Security Guard (Entity B) approves gate clearance and counter-signs the pass."""
    package = decode_token_package(req.token_base64)

    # F2.3: Reject if pass nonce has already received gate clearance
    if nonce_registry.is_replayed(package.nonce):
        raise HTTPException(
            status_code=409,
            detail=f"Pass nonce {package.nonce} has already been cleared. Replay clearance rejected.",
        )

    # F2.2: Verify authenticity of primary signature A before applying clearance
    pub_a = (req.pub_key_a[0], req.pub_key_a[1])
    expected_primary_digest = compute_primary_digest(
        package.header, package.nonce, package.encrypted_secret
    )
    if not verify(expected_primary_digest, package.primary_signature, pub_a):
        raise HTTPException(
            status_code=400,
            detail="Primary signature (Entity A) is invalid or manifest has been tampered.",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    clearance = GateClearance(
        gate_id=req.gate_id,
        inspector_id=req.officer_id,
        timestamp_inspected=now_iso,
        status="APPROVED",
    )

    clearance_digest = compute_clearance_digest(
        package.header, clearance, package.primary_signature
    )

    priv_b = (req.priv_key_b[0], req.priv_key_b[1])
    counter_sig = sign(clearance_digest, priv_b)

    clearance.counter_signature = counter_sig
    clearance.clearance_digest = clearance_digest
    package.clearance = clearance

    # Register nonce so it cannot be cleared twice
    nonce_registry.register(package.nonce, package.header.pass_id, stage="GATE_CLEARED")

    updated_b64 = encode_token_package(package)

    return ClearanceResponse(
        updated_token_base64=updated_b64,
        clearance=clearance.model_dump(),
    )


@router.post("/receive", response_model=ReceiveResponse)
def receive_pass(req: ReceiveRequest) -> ReceiveResponse:
    """Destination Warehouse (Entity C) performs dual verification and decrypts confidential payload."""
    package = decode_token_package(req.token_base64)

    pub_a = (req.pub_key_a[0], req.pub_key_a[1])
    pub_b = (req.pub_key_b[0], req.pub_key_b[1])
    priv_c = (req.priv_key_c[0], req.priv_key_c[1])

    # 1. Verify Manifest Signature A (F1 & F3: unified digest)
    digest_a = compute_primary_digest(package.header, package.nonce, package.encrypted_secret)
    valid_a = verify(digest_a, package.primary_signature, pub_a)

    # 2. Verify Clearance Counter-Signature B
    valid_b = False
    if package.clearance and package.clearance.counter_signature is not None:
        clearance_digest = compute_clearance_digest(
            package.header, package.clearance, package.primary_signature
        )
        valid_b = verify(clearance_digest, package.clearance.counter_signature, pub_b)

    if not valid_a:
        return ReceiveResponse(
            valid_a=False,
            valid_b=valid_b,
            message="PPIC Primary Signature (A) is INVALID / FORGED! Cargo release rejected.",
            error_code="INVALID_PRIMARY_SIGNATURE",
        )

    if not valid_b:
        return ReceiveResponse(
            valid_a=True,
            valid_b=False,
            message="Gate Clearance Counter-Signature (B) is INVALID / MISSING! Truck bypassed gate clearance.",
            error_code="INVALID_CLEARANCE_SIGNATURE",
        )

    # Both signatures valid -> Decrypt secret payload
    try:
        decrypted_memo = decrypt_payload(package.encrypted_secret, priv_c)
    except Exception as exc:
        return ReceiveResponse(
            valid_a=True,
            valid_b=True,
            message=f"Signatures valid, but failed to decrypt memo using Private Key C: {exc}",
            error_code="DECRYPTION_ERROR",
        )

    return ReceiveResponse(
        valid_a=True,
        valid_b=True,
        decrypted_secret=decrypted_memo,
        message="Dual verification SUCCESSFUL! Cargo received and secret memo decrypted.",
    )
