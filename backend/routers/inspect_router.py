"""APIRouter for Crypto Inspector & Trace Debugger."""
from fastapi import APIRouter, HTTPException
from backend.models.schemas import InspectTraceRequest, InspectTraceResponse, InspectStep
from backend.core.inspector import trace_eea, trace_mod_exp, trace_miller_rabin

router = APIRouter()

@router.post("/trace", response_model=InspectTraceResponse)
def inspect_trace(req: InspectTraceRequest) -> InspectTraceResponse:
    """Execute step-by-step trace on modular arithmetic algorithms."""
    algo = req.algorithm.lower().strip()
    params = req.params

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
