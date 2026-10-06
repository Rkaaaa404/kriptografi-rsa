"""APIRouter for Cryptographic Attack Simulation Suite."""
import base64
import json
from fastapi import APIRouter, HTTPException

from backend.models.schemas import AttackRequest, AttackResponse, GatePassPackage
from backend.core.rsa_engine import verify, mod_exp, sign
from backend.core.hashing import polynomial_hash
from backend.routers.nonce_registry import nonce_registry

router = APIRouter()

def _base64_to_package(token_base64: str) -> dict:
    try:
        decoded_bytes = base64.b64decode(token_base64)
        return json.loads(decoded_bytes.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64/JSON token: {exc}")

@router.post("/simulate", response_model=AttackResponse)
def simulate_attack(req: AttackRequest) -> AttackResponse:
    """Simulate 4 cybersecurity attack scenarios against the gate pass token."""
    pkg_dict = _base64_to_package(req.token_base64)
    package = GatePassPackage.model_validate(pkg_dict)

    pub_a = (req.pub_key_a[0], req.pub_key_a[1])
    attack = req.attack_type.lower().strip()

    # Skenario 1: Payload Tampering Attack
    if attack in ("tamper", "payload_tamper"):
        mods = req.modifications
        # Modify first item qty or custom field
        if "item_index" in mods and "new_qty" in mods:
            idx = int(mods["item_index"])
            if 0 <= idx < len(package.header.item_list):
                orig_qty = package.header.item_list[idx].qty
                package.header.item_list[idx].qty = int(mods["new_qty"])
        elif "vehicle_plate" in mods:
            package.header.vehicle_plate = str(mods["vehicle_plate"])
        else:
            # Default modification: change first item qty to 999999
            if package.header.item_list:
                package.header.item_list[0].qty = 999999

        manifest_canon = package.header.to_canonical_str()
        new_digest = polynomial_hash(manifest_canon)
        is_valid = verify(new_digest, package.primary_signature, pub_a)
        recovered_digest = mod_exp(package.primary_signature, pub_a[0], pub_a[1])

        return AttackResponse(
            status="TAMPERED",
            error_code="HASH_MISMATCH",
            message="Payload Tampering terdeteksi! Nilai hash manifest yang diubah tidak cocok dengan digest yang diekstrak dari tanda tangan digital.",
            details={
                "tampered_manifest": package.header.model_dump(),
                "computed_digest": new_digest % pub_a[1],
                "recovered_digest_from_sig": recovered_digest,
                "is_signature_valid": is_valid,
            },
        )

    # Skenario 2: Rogue Signer Attack
    elif attack in ("rogue_signer", "rogue"):
        if not req.rogue_priv_key:
            raise HTTPException(status_code=400, detail="rogue_signer attack requires 'rogue_priv_key' param [d, n]")
        rogue_priv = (req.rogue_priv_key[0], req.rogue_priv_key[1])

        manifest_canon = package.header.to_canonical_str()
        digest = polynomial_hash(manifest_canon)
        rogue_sig = sign(digest, rogue_priv)

        # Verification using official Public Key A
        is_valid = verify(digest, rogue_sig, pub_a)
        recovered_digest = mod_exp(rogue_sig, pub_a[0], pub_a[1])

        return AttackResponse(
            status="INVALID_SIGNATURE",
            error_code="ROGUE_SIGNER_DETECTED",
            message="Pemalsuan Penandatangan (Rogue Signer) terdeteksi! Tanda tangan dibuat menggunakan kunci privat penyerang dan gagal diverifikasi oleh Kunci Publik PPIC resmi.",
            details={
                "rogue_signature": rogue_sig,
                "expected_digest": digest % pub_a[1],
                "recovered_digest": recovered_digest,
                "is_signature_valid": is_valid,
            },
        )

    # Skenario 3: Signature Corruption Attack
    elif attack in ("corrupt_sig", "corrupt_signature"):
        delta = int(req.modifications.get("sig_corruption", 1))
        corrupted_sig = package.primary_signature + delta

        manifest_canon = package.header.to_canonical_str()
        digest = polynomial_hash(manifest_canon)
        is_valid = verify(digest, corrupted_sig, pub_a)
        recovered_digest = mod_exp(corrupted_sig, pub_a[0], pub_a[1])

        return AttackResponse(
            status="SIGNATURE_CORRUPTED",
            error_code="SIGNATURE_MATH_FAILED",
            message="Kerusakan Tanda Tangan Digital terdeteksi! Bit/nilai integer tanda tangan telah terdistorsi sehingga rekonstruksi digest menghasilkan bilangan acak yang tidak valid.",
            details={
                "original_signature": package.primary_signature,
                "corrupted_signature": corrupted_sig,
                "expected_digest": digest % pub_a[1],
                "recovered_digest": recovered_digest,
                "is_signature_valid": is_valid,
            },
        )

    # Skenario 4: Replay Attack Simulation
    elif attack in ("replay", "replay_attack"):
        nonce_val = package.nonce
        # Ensure nonce is marked as used
        if not nonce_registry.is_replayed(nonce_val):
            nonce_registry.register(nonce_val, package.header.pass_id, stage="SIMULATED_PRIOR_USE")

        info = nonce_registry.get_info(nonce_val)
        return AttackResponse(
            status="REPLAY_ATTACK_DETECTED",
            error_code="TOKEN_ALREADY_USED",
            message=f"Serangan Penggunaan Ulang (Replay Attack) terdeteksi! Token dengan Nonce '{nonce_val}' sudah pernah dicatat dan diselesaikan sebelumnya.",
            details={
                "nonce": nonce_val,
                "prior_used_info": info,
                "pass_id": package.header.pass_id,
            },
        )

    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown attack_type '{req.attack_type}'. Options: tamper, rogue_signer, corrupt_sig, replay",
        )
