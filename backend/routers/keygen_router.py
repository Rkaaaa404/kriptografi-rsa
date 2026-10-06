"""APIRouter for RSA Key Generation and Parameter Validation."""
from fastapi import APIRouter
from backend.models.schemas import (
    GenerateKeyRequest,
    ValidateKeyRequest,
    KeypairResponse,
)
from backend.core.rsa_engine import generate_keypair
from backend.core.math_utils import gcd, mod_inverse
from backend.core.primes import miller_rabin

router = APIRouter()

@router.post("/generate", response_model=KeypairResponse)
def generate_key(req: GenerateKeyRequest) -> KeypairResponse:
    """Generate a fresh RSA keypair."""
    result = generate_keypair(bits=req.bits, e_manual=req.e_manual)
    p = result["params"]["p"]
    q = result["params"]["q"]
    phi = result["params"]["phi"]
    e_val, n_val = result["public_key"]
    d_val, _ = result["private_key"]
    return KeypairResponse(
        pub_key=[e_val, n_val],
        priv_key=[d_val, n_val],
        p=p,
        q=q,
        phi=phi,
        n=n_val,
        e=e_val,
        d=d_val,
        valid=True,
        message="Keypair generated successfully",
    )

@router.post("/validate", response_model=KeypairResponse)
def validate_key(req: ValidateKeyRequest) -> KeypairResponse:
    """Validate manual p, q, e parameters and compute RSA keys."""
    p, q, e = req.p, req.q, req.e

    if p <= 1 or not miller_rabin(p, k=20):
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=0, n=0, e=e, d=0,
            valid=False,
            message=f"Parameter p={p} is not a prime number.",
        )

    if q <= 1 or not miller_rabin(q, k=20):
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=0, n=0, e=e, d=0,
            valid=False,
            message=f"Parameter q={q} is not a prime number.",
        )

    if p == q:
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=0, n=0, e=e, d=0,
            valid=False,
            message="p and q must be distinct primes (p != q).",
        )

    n = p * q
    phi = (p - 1) * (q - 1)

    if not (1 < e < phi):
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=phi, n=n, e=e, d=0,
            valid=False,
            message=f"e must satisfy 1 < e < phi(n)={phi}.",
        )

    if gcd(e, phi) != 1:
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=phi, n=n, e=e, d=0,
            valid=False,
            message=f"gcd(e, phi(n)) != 1 (gcd={gcd(e, phi)}). e and phi(n) must be coprime.",
        )

    try:
        d = mod_inverse(e, phi)
    except ValueError as exc:
        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=p, q=q, phi=phi, n=n, e=e, d=0,
            valid=False,
            message=str(exc),
        )

    return KeypairResponse(
        pub_key=[e, n],
        priv_key=[d, n],
        p=p,
        q=q,
        phi=phi,
        n=n,
        e=e,
        d=d,
        valid=True,
        message="Parameters valid! RSA keypair generated successfully.",
    )
