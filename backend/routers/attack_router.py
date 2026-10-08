"""APIRouter for Cryptographic Attack Simulation Suite."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.models.schemas import AttackRequest, AttackResponse
from backend.core.rsa_engine import verify, mod_exp, sign
from backend.routers.nonce_registry import nonce_registry
from backend.routers.protocol import decode_token_package, compute_primary_digest

router = APIRouter()


@router.post("/simulate", response_model=AttackResponse)
def simulate_attack(req: AttackRequest) -> AttackResponse:
    """Simulate 4 cybersecurity attack scenarios against the gate pass token."""
    package = decode_token_package(req.token_base64)

    pub_a = (req.pub_key_a[0], req.pub_key_a[1])
    attack = req.attack_type.lower().strip()

    # Skenario 1: Payload Tampering Attack (F1, F3, manifest fields)
    if attack in ("tamper", "payload_tamper"):
        mods = req.modifications
        # Support modifying items, plate, nonce, and encrypted_secret
        if "nonce" in mods:
            package.nonce = str(mods["nonce"])
        if "encrypted_secret" in mods:
            package.encrypted_secret = [int(x) for x in mods["encrypted_secret"]]

        if "item_index" in mods and "new_qty" in mods:
            idx = int(mods["item_index"])
            if 0 <= idx < len(package.header.item_list):
                package.header.item_list[idx].qty = int(mods["new_qty"])
        elif "vehicle_plate" in mods:
            package.header.vehicle_plate = str(mods["vehicle_plate"])
        elif not ("nonce" in mods or "encrypted_secret" in mods):
            # Default modification: change first item qty to 999999
            if package.header.item_list:
                package.header.item_list[0].qty = 999999

        new_digest = compute_primary_digest(package.header, package.nonce, package.encrypted_secret)
        is_valid = verify(new_digest, package.primary_signature, pub_a)
        recovered_digest = (
            mod_exp(package.primary_signature, pub_a[0], pub_a[1])
            if (0 <= package.primary_signature < pub_a[1])
            else None
        )

        if not is_valid:
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
        else:
            return AttackResponse(
                status="ATTACK_UNDETECTED",
                error_code="NONE",
                message="Manipulasi tidak terdeteksi: tanda tangan digital tetap valid.",
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
            raise HTTPException(
                status_code=400,
                detail="rogue_signer attack requires 'rogue_priv_key' param [d, n]",
            )
        rogue_priv = (req.rogue_priv_key[0], req.rogue_priv_key[1])

        digest = compute_primary_digest(package.header, package.nonce, package.encrypted_secret)
        rogue_sig = sign(digest, rogue_priv)

        # Verification using official Public Key A
        is_valid = verify(digest, rogue_sig, pub_a)
        recovered_digest = (
            mod_exp(rogue_sig, pub_a[0], pub_a[1])
            if (0 <= rogue_sig < pub_a[1])
            else None
        )

        if not is_valid:
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
        else:
            return AttackResponse(
                status="ATTACK_UNDETECTED",
                error_code="NONE",
                message="Pemalsuan tidak terdeteksi: tanda tangan lolos verifikasi.",
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

        digest = compute_primary_digest(package.header, package.nonce, package.encrypted_secret)
        is_valid = verify(digest, corrupted_sig, pub_a)
        recovered_digest = (
            mod_exp(corrupted_sig, pub_a[0], pub_a[1])
            if (0 <= corrupted_sig < pub_a[1])
            else None
        )

        if not is_valid:
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
        else:
            return AttackResponse(
                status="ATTACK_UNDETECTED",
                error_code="NONE",
                message="Kerusakan tidak terdeteksi: tanda tangan tetap lolos verifikasi.",
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
            nonce_registry.register(
                nonce_val, package.header.pass_id, stage="SIMULATED_PRIOR_USE"
            )

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
