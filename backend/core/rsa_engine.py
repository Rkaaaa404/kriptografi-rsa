"""RSA key-pair generation and core encryption/decryption engine.

Builds on :mod:`backend.core.math_utils` and :mod:`backend.core.primes`
for all arithmetic.  Zero external crypto libraries.
"""

from backend.core.math_utils import gcd, mod_inverse, mod_exp
from backend.core.primes import generate_prime, miller_rabin


def generate_keypair(
    bits: int = 32,
    e_manual: int | None = None,
    p_manual: int | None = None,
    q_manual: int | None = None,
) -> dict:
    """Generate an RSA key pair with optional manual parameters.

    Follows standard RSA key-generation:
      1. Choose two distinct primes *p* and *q* (provided or generated).
      2. Compute ``n = p * q`` and ``phi = (p-1) * (q-1)``.
      3. Choose public exponent *e* coprime to *phi*.
      4. Compute private exponent ``d = e^{-1} mod phi``.

    Args:
        bits: Bit length for randomly generated primes.  Ignored when both
            *p_manual* and *q_manual* are supplied.  Default 32.
        e_manual: If provided, use this value as the public exponent *e*.
            Must satisfy ``gcd(e_manual, phi) == 1``.
        p_manual: If provided together with *q_manual*, use these as the
            prime factors instead of generating random ones.  Both must be
            prime (verified via Miller-Rabin with k=20).
        q_manual: See *p_manual*.

    Returns:
        A dict with the following structure::

            {
                "public_key":  (e, n),
                "private_key": (d, n),
                "params": {
                    "p":   int,
                    "q":   int,
                    "phi": int,
                    "e":   int,
                    "d":   int,
                },
            }

    Raises:
        ValueError: If provided primes are not actually prime, if *p* == *q*,
            or if *e_manual* is not coprime to *phi*.

    Examples:
        >>> kp = generate_keypair(p_manual=47, q_manual=71, e_manual=79)
        >>> kp["params"]["p"], kp["params"]["q"]
        (47, 71)
        >>> kp["params"]["phi"]
        3220
        >>> kp["params"]["d"]
        1019
        >>> kp["public_key"]
        (79, 3337)
        >>> kp["private_key"]
        (1019, 3337)
    """
    # --- Obtain p and q ---
    if (p_manual is None) != (q_manual is None):
        raise ValueError("Both p_manual and q_manual must be provided together")

    if p_manual is not None and q_manual is not None:
        p, q = p_manual, q_manual
        if not miller_rabin(p, k=20):
            raise ValueError(f"p_manual={p} is not prime")
        if not miller_rabin(q, k=20):
            raise ValueError(f"q_manual={q} is not prime")
        if p == q:
            raise ValueError("p and q must be distinct primes")
    else:
        p = generate_prime(bits)
        q = generate_prime(bits)
        # Ensure p != q (astronomically unlikely but guard anyway)
        while q == p:
            q = generate_prime(bits)

    # --- Compute modulus and totient ---
    n = p * q
    phi = (p - 1) * (q - 1)

    # --- Determine public exponent e ---
    if e_manual is not None:
        e = e_manual
        if not (1 < e < phi):
            raise ValueError(f"e_manual={e} must satisfy 1 < e < phi={phi}")
        if gcd(e, phi) != 1:
            raise ValueError(
                f"e_manual={e} is not coprime to phi={phi}: "
                f"gcd={gcd(e, phi)}"
            )
    else:
        # Prefer the standard 65537 only if e < phi and coprime
        if 65537 < phi and gcd(65537, phi) == 1:
            e = 65537
        else:
            # Fall back to smallest odd integer coprime to phi (≥ 3) and < phi
            e = 3
            while e < phi and gcd(e, phi) != 1:
                e += 2
            if e >= phi:
                raise ValueError(f"Could not find suitable public exponent e < phi={phi}")
    # --- Compute private exponent d ---
    d = mod_inverse(e, phi)

    return {
        "public_key": (e, n),
        "private_key": (d, n),
        "params": {
            "p": p,
            "q": q,
            "phi": phi,
            "e": e,
            "d": d,
        },
    }


def encrypt(m: int, pub_key: tuple[int, int]) -> int:
    """Encrypt a plaintext integer using an RSA public key.

    Computes ``c = m^e mod n`` via :func:`~backend.core.math_utils.mod_exp`.

    Args:
        m: Plaintext integer.  Must satisfy ``0 ≤ m < n``.
        pub_key: Tuple ``(e, n)`` — the RSA public key.

    Returns:
        The ciphertext integer ``c = m^e mod n``.

    Raises:
        ValueError: When ``m >= n``.
    """
    e, n = pub_key
    if m >= n:
        raise ValueError(f"Plaintext m={m} must be < n={n}")
    return mod_exp(m, e, n)


def decrypt(c: int, priv_key: tuple[int, int]) -> int:
    """Decrypt a ciphertext integer using an RSA private key.

    Computes ``m = c^d mod n`` via :func:`~backend.core.math_utils.mod_exp`.

    Args:
        c: Ciphertext integer.  Must satisfy ``0 ≤ c < n``.
        priv_key: Tuple ``(d, n)`` — the RSA private key.

    Returns:
        The recovered plaintext integer ``m = c^d mod n``.
    """
    d, n = priv_key
    return mod_exp(c, d, n)


def text_to_blocks(text: str, n: int) -> list[int]:
    """Encode a UTF-8 string as a list of RSA-compatible integer blocks.

    Computes the adaptive block byte size as
    ``B = max(1, (n.bit_length() - 1) // 8)`` so every block integer is
    strictly less than *n*.  Bytes are interpreted big-endian with null-padding
    for trailing short blocks.

    Args:
        text: Plaintext string to encode.
        n:    RSA modulus; blocks will be < *n*.

    Returns:
        A list of non-negative integers, each < *n*.
    """
    if not text:
        return []
    raw = text.encode("utf-8")
    block_size = max(1, (n.bit_length() - 1) // 8)
    blocks = []
    for i in range(0, len(raw), block_size):
        chunk = raw[i : i + block_size].ljust(block_size, b"\x00")
        blocks.append(int.from_bytes(chunk, "big"))
    return blocks


def blocks_to_text(blocks: list[int], n: int) -> str:
    """Decode a list of integer blocks back to a UTF-8 string.

    Reverses :func:`text_to_blocks`: converts each integer to a big-endian
    byte sequence of the adaptive block size, then decodes as UTF-8,
    stripping trailing null bytes.

    Args:
        blocks: List of plaintext integer blocks.
        n:      RSA modulus (used to determine block byte width).

    Returns:
        The decoded UTF-8 string.
    """
    if not blocks:
        return ""
    block_size = max(1, (n.bit_length() - 1) // 8)
    raw = b"".join(b.to_bytes(block_size, "big") for b in blocks)
    return raw.rstrip(b"\x00").decode("utf-8")


def sign(digest: int, priv_key: tuple[int, int]) -> int:
    """Sign a digest integer using an RSA private key.

    Computes ``S = (digest % n)^d mod n`` via :func:`~backend.core.math_utils.mod_exp`.

    Args:
        digest: Digest integer to sign.
        priv_key: Tuple ``(d, n)`` — the RSA private key.

    Returns:
        Signature integer ``S``.
    """
    d, n = priv_key
    return mod_exp(digest % n, d, n)


def verify(digest: int, signature: int, pub_key: tuple[int, int]) -> bool:
    """Verify an RSA digital signature against expected digest.

    Computes recovered digest ``recovered = signature^e mod n`` and checks
    whether ``recovered == (digest % n)``.

    Args:
        digest: Expected digest integer.
        signature: Signature integer to verify.
        pub_key: Tuple ``(e, n)`` — the RSA public key.

    Returns:
        True if signature is authentic, False otherwise.
    """
    e, n = pub_key
    if not (0 <= signature < n):
        return False
    recovered = mod_exp(signature, e, n)
    return recovered == (digest % n)


def encrypt_payload(text: str, pub_key: tuple[int, int]) -> list[int]:
    """Encrypt a plaintext string using RSA text block chunking.

    Encodes text into blocks strictly less than *n*, then encrypts each block
    using the public key.

    Args:
        text: Plaintext string to encrypt.
        pub_key: Tuple ``(e, n)`` — the RSA public key.

    Returns:
        List of encrypted integer blocks.
    """
    _, n = pub_key
    blocks = text_to_blocks(text, n)
    return [encrypt(b, pub_key) for b in blocks]


def decrypt_payload(encrypted_blocks: list[int], priv_key: tuple[int, int]) -> str:
    """Decrypt a list of encrypted integer blocks using RSA private key.

    Decrypts each ciphertext block, then decodes the integer blocks to string.

    Args:
        encrypted_blocks: List of ciphertext integers.
        priv_key: Tuple ``(d, n)`` — the RSA private key.

    Returns:
        The decrypted UTF-8 plaintext string.
    """
    _, n = priv_key
    decrypted_blocks = [decrypt(c, priv_key) for c in encrypted_blocks]
    return blocks_to_text(decrypted_blocks, n)

