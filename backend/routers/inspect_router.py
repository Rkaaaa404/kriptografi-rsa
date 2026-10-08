"""APIRouter for Crypto Inspector, Trace Debugger, and Standalone RSA Text Encryption/Decryption."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from backend.models.schemas import (
    InspectTraceRequest,
    InspectTraceResponse,
    InspectStep,
    EncryptDecryptTraceRequest,
    EncryptDecryptTraceResponse,
    EncryptDecryptBlockTrace,
)
from backend.core.inspector import trace_eea, trace_mod_exp, trace_miller_rabin
from backend.core.math_utils import mod_exp

router = APIRouter()


@router.post("/trace", response_model=InspectTraceResponse)
def inspect_trace(req: InspectTraceRequest) -> InspectTraceResponse:
    """Execute step-by-step trace on modular arithmetic algorithms."""
    algo = req.algorithm.lower().strip()
    params = req.params

    try:
        if algo in ("eea", "extended_euclidean"):
            if "a" not in params or "b" not in params:
                raise HTTPException(status_code=400, detail="EEA requires 'a' and 'b' integer params")
            report = trace_eea(int(params["a"]), int(params["b"]))
        elif algo in ("mod_exp", "square_and_multiply"):
            for key in ("base", "exp", "mod"):
                if key not in params:
                    raise HTTPException(status_code=400, detail=f"ModExp requires '{key}' param")
            report = trace_mod_exp(int(params["base"]), int(params["exp"]), int(params["mod"]))
        elif algo in ("miller_rabin", "primality"):
            if "n" not in params:
                raise HTTPException(status_code=400, detail="Miller-Rabin requires 'n' param")
            k = int(params.get("k", 5))
            report = trace_miller_rabin(int(params["n"]), k=k)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown algorithm '{algo}'. Valid options: eea, mod_exp, miller_rabin",
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    steps = [
        InspectStep(
            step_number=s.step_number,
            operation=s.operation,
            details=s.details,
        )
        for s in report.steps
    ]

    return InspectTraceResponse(
        algorithm=report.algorithm_name,
        input_params=report.input_params,
        steps=steps,
        result=report.output_result,
    )


@router.post("/encrypt-decrypt", response_model=EncryptDecryptTraceResponse)
def inspect_encrypt_decrypt(req: EncryptDecryptTraceRequest) -> EncryptDecryptTraceResponse:
    """Execute transparent standalone text encryption and optional decryption with per-block trace."""
    if len(req.pub_key) != 2:
        raise HTTPException(status_code=400, detail="pub_key must be a list of 2 integers [e, n]")
    e_val, n_val = req.pub_key
    if e_val <= 0 or n_val <= 1:
        raise HTTPException(status_code=400, detail=f"Invalid public key: e={e_val}, n={n_val}")

    priv_key_tuple = None
    if req.priv_key is not None:
        if len(req.priv_key) != 2:
            raise HTTPException(status_code=400, detail="priv_key must be a list of 2 integers [d, n]")
        d_val, n_priv = req.priv_key
        if d_val <= 0 or n_priv <= 1:
            raise HTTPException(status_code=400, detail=f"Invalid private key: d={d_val}, n={n_priv}")
        priv_key_tuple = (d_val, n_priv)

    raw_bytes = req.text.encode("utf-8")
    modulus_bits = n_val.bit_length()
    block_size = max(1, (modulus_bits - 1) // 8)

    blocks_trace: list[EncryptDecryptBlockTrace] = []
    ciphertexts: list[int] = []
    decrypted_chunks: list[bytes] = []

    for idx, offset in enumerate(range(0, len(raw_bytes), block_size)):
        chunk = raw_bytes[offset : offset + block_size].ljust(block_size, b"\x00")
        chunk_ints = list(chunk)
        chunk_hex = chunk.hex()
        m = int.from_bytes(chunk, "big")
        c = mod_exp(m, e_val, n_val)
        ciphertexts.append(c)

        dec_m = None
        dec_hex = None
        if priv_key_tuple is not None:
            dec_m = mod_exp(c, priv_key_tuple[0], priv_key_tuple[1])
            dec_chunk = dec_m.to_bytes(block_size, "big")
            dec_hex = dec_chunk.hex()
            decrypted_chunks.append(dec_chunk)

        blocks_trace.append(
            EncryptDecryptBlockTrace(
                block_index=idx,
                raw_bytes_hex=chunk_hex,
                raw_bytes_int=chunk_ints,
                m=m,
                c=c,
                decrypted_m=dec_m,
                decrypted_bytes_hex=dec_hex,
            )
        )

    decrypted_text = None
    is_reversible = None
    if priv_key_tuple is not None:
        reconstructed_bytes = b"".join(decrypted_chunks)
        decrypted_text = reconstructed_bytes.rstrip(b"\x00").decode("utf-8", errors="replace")
        is_reversible = (decrypted_text == req.text)

    return EncryptDecryptTraceResponse(
        original_text=req.text,
        original_bytes_hex=raw_bytes.hex(),
        original_bytes_length=len(raw_bytes),
        block_size_bytes=block_size,
        modulus_bits=modulus_bits,
        blocks=blocks_trace,
        ciphertexts=ciphertexts,
        decrypted_text=decrypted_text,
        is_reversible=is_reversible,
    )
