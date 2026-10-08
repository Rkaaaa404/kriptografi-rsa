"""Centralized cryptographic protocol helper module for SecurePass RSA.

Handles deterministic canonical serialization, token packaging/unpackaging,
and unified digest computation for multi-party signatures (PPIC Entity A and
Gate Guard Entity B).
"""
from __future__ import annotations

import base64
import json
from typing import Any, Union
from fastapi import HTTPException

from backend.models.schemas import GatePassPackage, ManifestHeader, GateClearance
from backend.core.hashing import polynomial_hash


def encode_token_package(package: Union[GatePassPackage, dict[str, Any]]) -> str:
    """Serialize a GatePassPackage to a deterministic compact JSON Base64 string."""
    pkg_dict = package.model_dump() if hasattr(package, "model_dump") else package
    compact_json = json.dumps(pkg_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(compact_json.encode("utf-8")).decode("ascii")


def decode_token_package(token_b64: str) -> GatePassPackage:
    """Decode and validate a Base64 JSON token into a validated GatePassPackage."""
    try:
        decoded_bytes = base64.b64decode(token_b64)
        pkg_dict = json.loads(decoded_bytes.decode("utf-8"))
        return GatePassPackage.model_validate(pkg_dict)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid base64/JSON token: {exc}")


def compute_primary_digest(
    header: Union[ManifestHeader, dict[str, Any]],
    nonce: str,
    encrypted_secret: list[int],
) -> int:
    """Compute deterministic canonical polynomial hash for Entity A primary signature.

    Binds manifest header, unique anti-replay nonce, and encrypted secret note
    together to prevent replay attacks and secret memo substitution (F1 & F3).
    """
    header_dict = header.model_dump() if hasattr(header, "model_dump") else header
    payload = {
        "encrypted_secret": encrypted_secret,
        "header": header_dict,
        "nonce": nonce,
    }
    canonical_str = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return polynomial_hash(canonical_str)


def compute_clearance_digest(
    header: Union[ManifestHeader, dict[str, Any]],
    clearance: Union[GateClearance, dict[str, Any]],
    primary_sig: int,
) -> int:
    """Compute deterministic canonical hash for Entity B gate clearance counter-signature."""
    if hasattr(header, "to_canonical_str"):
        manifest_canon = header.to_canonical_str()
    else:
        manifest_canon = json.dumps(header, sort_keys=True, separators=(",", ":"), ensure_ascii=False)

    clearance_dict = {
        "gate_id": clearance.gate_id if hasattr(clearance, "gate_id") else clearance["gate_id"],
        "inspector_id": clearance.inspector_id if hasattr(clearance, "inspector_id") else clearance["inspector_id"],
        "status": clearance.status if hasattr(clearance, "status") else clearance["status"],
        "timestamp_inspected": clearance.timestamp_inspected if hasattr(clearance, "timestamp_inspected") else clearance["timestamp_inspected"],
    }
    clearance_canon = json.dumps(clearance_dict, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    combined_input = manifest_canon + clearance_canon + str(primary_sig)
    return polynomial_hash(combined_input)
