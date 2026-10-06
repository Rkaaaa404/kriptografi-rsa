"""
Polynomial Rolling Hash implementation for SecurePass RSA.

No external crypto libraries used. Pure Python stdlib only.
Hash function: H(s) = sum(ord(s[i]) * base^i) mod m
Modulus: Mersenne prime M31 = 2^31 - 1 = 2147483647
"""

import json

MERSENNE_31: int = 2147483647  # 2^31 - 1
HASH_BASE: int = 313


def polynomial_hash(text: str, base: int = HASH_BASE, mod: int = MERSENNE_31) -> int:
    """Compute Polynomial Rolling Hash of a string.

    Uses the recurrence:
        H(s) = sum_{i=0}^{n-1} ord(s[i]) * base^i  mod m

    Each character's contribution is weighted by a power of the base,
    providing avalanche sensitivity — a single character change produces
    a completely different digest.

    Args:
        text: Input string to hash.
        base: Prime base for rolling multiplication. Default 313.
        mod: Modulus — Mersenne prime M31 = 2^31-1. Default MERSENNE_31.

    Returns:
        Non-negative integer digest in [0, mod).

    Example:
        >>> polynomial_hash('HELLO')
        # deterministic integer < 2147483647
        >>> polynomial_hash('A') != polynomial_hash('B')
        True
    """
    h = 0
    power = 1
    for ch in text:
        h = (h + ord(ch) * power) % mod
        power = (power * base) % mod
    return h


def compute_digest(payload: str) -> int:
    """Compute hash digest of a payload string.

    Convenience wrapper around polynomial_hash using default parameters
    (base=313, mod=MERSENNE_31).

    Args:
        payload: Input string to digest.

    Returns:
        Non-negative integer digest in [0, MERSENNE_31).
    """
    return polynomial_hash(payload)


def canonical_json_digest(data: dict) -> int:
    """Serialize a dict to canonical JSON and return its polynomial hash.

    Canonical form: sorted keys, no spaces, ensure_ascii=False.
    This guarantees the same digest regardless of dict insertion order.

    Args:
        data: Dictionary to serialize and hash. May contain nested
            structures serializable by the stdlib ``json`` module.

    Returns:
        Non-negative integer digest of the canonical JSON string.

    Example:
        >>> canonical_json_digest({'b': 2, 'a': 1}) == canonical_json_digest({'a': 1, 'b': 2})
        True
    """
    canonical = json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    return polynomial_hash(canonical)


def hex_digest(text: str) -> str:
    """Return polynomial hash as a hex string (0x-prefixed).

    Args:
        text: Input string to hash.

    Returns:
        Hex string representation of the polynomial hash, e.g. '0x1a2b3c'.
    """
    return hex(polynomial_hash(text))
