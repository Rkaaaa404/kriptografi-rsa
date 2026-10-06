"""APIRouter for Gate Pass issuance, gate verification, clearance, and receiving."""
import base64
import json
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
from backend.core.hashing import polynomial_hash
from backend.routers.nonce_registry import nonce_registry

router = APIRouter()

def _package_to_base64(pkg_dict: dict) -> str:
    compact_json = json.dumps(pkg_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(compact_json.encode("utf-8")).decode("ascii")

def _base64_to_package(token_base64: str) -> dict:
    try:
        decoded_bytes = base64.b64decode(token_base64)
        return json.loads(decoded_bytes.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64/JSON token: {exc}")

@router.post("/issue", response_model=IssuePassResponse)
def issue_pass(req: IssuePassRequest) -> IssuePassResponse:
    """PPIC (Entity A) signs manifest and encrypts secret note for Entity C."""
    manifest_canon = req.manifest.to_canonical_str()
    digest_hash = polynomial_hash(manifest_canon)

    priv_a = (req.priv_key_a[0], req.priv_key_a[1])
    pub_c = (req.pub_key_c[0], req.pub_key_c[1])

    # Digital signature S_A = (H % n)^d mod n
    primary_sig = sign(digest_hash, priv_a)

    # Encrypt secret note using Entity C's public key
    encrypted_secret = encrypt_payload(req.secret_note, pub_c)

    nonce_val = uuid.uuid4().hex

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
    token_b64 = _package_to_base64(pkg_dict)

    return IssuePassResponse(
        token_base64=token_b64,
        package=pkg_dict,
        digest_hash=digest_hash,
        signature=primary_sig,
    )

@router.post("/gate-verify", response_model=GateVerifyResponse)
def gate_verify(req: GateVerifyRequest) -> GateVerifyResponse:
    """Security Guard (Entity B) verifies manifest integrity and checks replay/expiration."""
    pkg_dict = _base64_to_package(req.token_base64)
    package = GatePassPackage.model_validate(pkg_dict)

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

    # Verify primary signature
    manifest_canon = package.header.to_canonical_str()
    digest_expected = polynomial_hash(manifest_canon)
    pub_a = (req.pub_key_a[0], req.pub_key_a[1])

    is_sig_valid = verify(digest_expected, package.primary_signature, pub_a)

    # Recovered digest value for diagnostic display
    recovered_digest = mod_exp(package.primary_signature, pub_a[0], pub_a[1])

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
    pkg_dict = _base64_to_package(req.token_base64)
    package = GatePassPackage.model_validate(pkg_dict)

    now_iso = datetime.now(timezone.utc).isoformat()
    clearance = GateClearance(
        gate_id=req.gate_id,
        inspector_id=req.officer_id,
        timestamp_inspected=now_iso,
        status="APPROVED",
    )

    manifest_canon = package.header.to_canonical_str()
    clearance_canon = json.dumps(
        {
            "gate_id": clearance.gate_id,
            "inspector_id": clearance.inspector_id,
            "status": clearance.status,
            "timestamp_inspected": clearance.timestamp_inspected,
        },
        sort_keys=True,
        separators=(",", ":"),
    )
    combined_input = manifest_canon + clearance_canon + str(package.primary_signature)
    clearance_digest = polynomial_hash(combined_input)

    priv_b = (req.priv_key_b[0], req.priv_key_b[1])
    counter_sig = sign(clearance_digest, priv_b)

    clearance.counter_signature = counter_sig
    clearance.clearance_digest = clearance_digest
    package.clearance = clearance

    # Register nonce so it cannot be cleared twice
    nonce_registry.register(package.nonce, package.header.pass_id, stage="GATE_CLEARED")

    updated_pkg_dict = package.model_dump()
    updated_b64 = _package_to_base64(updated_pkg_dict)

    return ClearanceResponse(
        updated_token_base64=updated_b64,
        clearance=clearance.model_dump(),
    )

@router.post("/receive", response_model=ReceiveResponse)
def receive_pass(req: ReceiveRequest) -> ReceiveResponse:
    """Destination Warehouse (Entity C) performs dual verification and decrypts confidential payload."""
    pkg_dict = _base64_to_package(req.token_base64)
    package = GatePassPackage.model_validate(pkg_dict)

    pub_a = (req.pub_key_a[0], req.pub_key_a[1])
    pub_b = (req.pub_key_b[0], req.pub_key_b[1])
    priv_c = (req.priv_key_c[0], req.priv_key_c[1])

    # 1. Verify Manifest Signature A
    manifest_canon = package.header.to_canonical_str()
    digest_a = polynomial_hash(manifest_canon)
    valid_a = verify(digest_a, package.primary_signature, pub_a)

    # 2. Verify Clearance Counter-Signature B
    valid_b = False
    if package.clearance and package.clearance.counter_signature is not None:
        clearance = package.clearance
        clearance_canon = json.dumps(
            {
                "gate_id": clearance.gate_id,
                "inspector_id": clearance.inspector_id,
                "status": clearance.status,
                "timestamp_inspected": clearance.timestamp_inspected,
            },
            sort_keys=True,
            separators=(",", ":"),
        )
        combined_input = manifest_canon + clearance_canon + str(package.primary_signature)
        clearance_digest = polynomial_hash(combined_input)
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
