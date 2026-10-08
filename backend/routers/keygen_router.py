"""APIRouter for RSA Key Generation and Parameter Validation."""
from fastapi import APIRouter, HTTPException
from backend.models.schemas import (
    GenerateKeyRequest,
    ValidateKeyRequest,
    KeypairResponse,
)
from backend.core.rsa_engine import generate_keypair
from backend.core.math_utils import gcd

router = APIRouter()


@router.post("/generate", response_model=KeypairResponse)
def generate_key(req: GenerateKeyRequest) -> KeypairResponse:
    # Ensure n does not exceed JavaScript's Number.MAX_SAFE_INTEGER (2^53 - 1)
    # For a requested RSA modulus of `bits`, each prime p, q is bits // 2.
    prime_bits = max(8, req.bits // 2)
    try:
        result = generate_keypair(bits=prime_bits, e_manual=req.e_manual)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

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
        message="RSA keypair generated successfully.",
    )


@router.post("/validate", response_model=KeypairResponse)
def validate_key(req: ValidateKeyRequest) -> KeypairResponse:
    """Validate manual p, q, e parameters and compute RSA keys.

    Delegates to core generate_keypair to avoid code duplication while
    providing structured academic feedback.
    """
    try:
        result = generate_keypair(p_manual=req.p, q_manual=req.q, e_manual=req.e)
    except ValueError as exc:
        err_msg = str(exc)
        phi = (req.p - 1) * (req.q - 1) if req.p > 1 and req.q > 1 else 0
        n = req.p * req.q if req.p > 0 and req.q > 0 else 0

        if "p_manual" in err_msg and "is not prime" in err_msg:
            msg = f"Parameter p={req.p} is not a prime number."
        elif "q_manual" in err_msg and "is not prime" in err_msg:
            msg = f"Parameter q={req.q} is not a prime number."
        elif "distinct" in err_msg:
            msg = "p and q must be distinct primes (p != q)."
        elif "must satisfy 1 < e < phi" in err_msg:
            msg = f"e must satisfy 1 < e < phi(n)={phi}."
        elif "coprime" in err_msg:
            g = gcd(req.e, phi) if phi > 0 else 0
            msg = f"gcd(e, phi(n)) != 1 (gcd={g}). e and phi(n) must be coprime."
        else:
            msg = err_msg

        return KeypairResponse(
            pub_key=[0, 0],
            priv_key=[0, 0],
            p=req.p,
            q=req.q,
            phi=phi,
            n=n,
            e=req.e,
            d=0,
            valid=False,
            message=msg,
        )

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
        message="Parameters valid! RSA keypair generated successfully.",
    )
