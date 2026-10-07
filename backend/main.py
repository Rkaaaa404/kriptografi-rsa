"""SecurePass RSA – FastAPI application entry point.

Mounts all domain routers and exposes a /health check.
Router imports are guarded so the server starts even when
individual router modules are incomplete during development.
"""
import sys
from pathlib import Path

# Ensure both project root and backend dir are in sys.path
_backend_dir = Path(__file__).resolve().parent
_project_root = _backend_dir.parent
for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

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
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from backend.routers.keygen_router import router as keygen_router
from backend.routers.inspect_router import router as inspect_router
from backend.routers.pass_router import router as pass_router
from backend.routers.attack_router import router as attack_router

app.include_router(keygen_router, prefix="/api/v1/keys", tags=["Key Generation"])
app.include_router(inspect_router, prefix="/api/v1/inspect", tags=["Inspection & Trace"])
app.include_router(pass_router, prefix="/api/v1/pass", tags=["Gate Pass"])
app.include_router(attack_router, prefix="/api/v1/attack", tags=["Attack Simulation"])
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
