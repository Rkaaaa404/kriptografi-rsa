"""SecurePass RSA – FastAPI application entry point.

Mounts all domain routers and exposes a /health check.
Router imports are guarded so the server starts even when
individual router modules are incomplete during development.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="SecurePass RSA",
    description="Warehouse gate-pass authorization system using pure RSA cryptography.",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers – imported defensively so the server starts even when a router
# module has a syntax/import error mid-development.
# ---------------------------------------------------------------------------
try:
    from backend.routers.keygen_router import router as keygen_router
    app.include_router(keygen_router, prefix="/api/v1/keys", tags=["Key Generation"])
except ImportError as exc:
    import warnings
    warnings.warn(f"keygen_router not loaded: {exc}", stacklevel=1)

try:
    from backend.routers.inspect_router import router as inspect_router
    app.include_router(inspect_router, prefix="/api/v1/inspect", tags=["Inspection & Trace"])
except ImportError as exc:
    import warnings
    warnings.warn(f"inspect_router not loaded: {exc}", stacklevel=1)

try:
    from backend.routers.pass_router import router as pass_router
    app.include_router(pass_router, prefix="/api/v1/pass", tags=["Gate Pass"])
except ImportError as exc:
    import warnings
    warnings.warn(f"pass_router not loaded: {exc}", stacklevel=1)

try:
    from backend.routers.attack_router import router as attack_router
    app.include_router(attack_router, prefix="/api/v1/attack", tags=["Attack Simulation"])
except ImportError as exc:
    import warnings
    warnings.warn(f"attack_router not loaded: {exc}", stacklevel=1)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Return a simple liveness probe.

    Returns:
        dict: ``{"status": "ok"}``
    """
    return {"status": "ok"}
