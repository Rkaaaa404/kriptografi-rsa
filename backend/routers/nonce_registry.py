"""In-memory Nonce and Replay Attack registry."""
from datetime import datetime, timezone
from typing import Optional, Dict, Any

class NonceRegistry:
    """Registry to track used nonces and prevent replay attacks."""

    def __init__(self) -> None:
        self._used: Dict[str, Dict[str, Any]] = {}

    def is_replayed(self, nonce: str) -> bool:
        """Check if nonce has already been registered."""
        return nonce in self._used

    def register(self, nonce: str, pass_id: str, stage: str) -> None:
        """Register a nonce with timestamp and stage."""
        self._used[nonce] = {
            "pass_id": pass_id,
            "used_at": datetime.now(timezone.utc).isoformat(),
            "stage": stage,
        }

    def get_info(self, nonce: str) -> Optional[Dict[str, Any]]:
        """Get registration metadata for a nonce."""
        return self._used.get(nonce)

    def clear(self) -> None:
        """Clear all registered nonces (useful for testing)."""
        self._used.clear()

nonce_registry = NonceRegistry()
