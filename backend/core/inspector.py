"""
Step-by-step cryptographic trace collector for SecurePass RSA.

Provides :class:`CryptoInspector` for recording algorithm execution steps,
plus convenience functions that run each core algorithm with a trace hook
and return a fully-populated :class:`ExecutionReport`.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from typing import Any


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------


@dataclass
class StepTrace:
    """A single recorded step inside an algorithm execution.

    Attributes:
        step_number: 1-based sequential index within the current execution.
        operation:   Short human-readable label for the operation (e.g.
                     ``"EEA Step"``, ``"ModExp Step"``).
        details:     Arbitrary key/value payload captured at this step.
    """

    step_number: int
    operation: str
    details: dict[str, Any]


@dataclass
class ExecutionReport:
    """Complete record of one algorithm invocation.

    Attributes:
        algorithm_name: Canonical name of the algorithm (e.g.
                        ``"extended_euclidean"``).
        input_params:   Dict of arguments supplied to the algorithm.
        output_result:  Return value (set by :meth:`CryptoInspector.end_trace`).
        steps:          Ordered list of :class:`StepTrace` objects.
    """

    algorithm_name: str
    input_params: dict[str, Any]
    output_result: Any
    steps: list[StepTrace] = field(default_factory=list)

    def to_dict(self) -> dict:
        """Serialize the entire report to a plain Python dictionary.

        Returns:
            dict: Fully nested dict representation, safe for JSON serialization.
        """
        return asdict(self)


# ---------------------------------------------------------------------------
# Inspector
# ---------------------------------------------------------------------------


class CryptoInspector:
    """Collects step traces from cryptographic algorithm executions.

    Usage::

        inspector = CryptoInspector()
        inspector.start_trace("my_algo", {"a": 1, "b": 2})
        inspector.record_step("Step label", {"info": "value"})
        report = inspector.end_trace(result_value)

    Attributes:
        reports:  All completed :class:`ExecutionReport` objects accumulated
                  since the last :meth:`clear` call.
    """

    def __init__(self) -> None:
        self.reports: list[ExecutionReport] = []
        self._current: ExecutionReport | None = None
        self._step_counter: int = 0

    def start_trace(self, algorithm_name: str, input_params: dict) -> None:
        """Begin a new trace session, discarding any unsaved active trace.

        Args:
            algorithm_name: Canonical algorithm identifier.
            input_params:   Dict of algorithm inputs to record verbatim.
        """
        self._current = ExecutionReport(
            algorithm_name=algorithm_name,
            input_params=input_params,
            output_result=None,
        )
        self._step_counter = 0

    def record_step(self, operation: str, details: dict) -> None:
        """Append one step to the currently active trace.

        No-op when no trace is active (so callers do not need to guard).

        Args:
            operation: Short label describing this step.
            details:   Key/value payload for this step.
        """
        if self._current is None:
            return
        self._step_counter += 1
        self._current.steps.append(
            StepTrace(
                step_number=self._step_counter,
                operation=operation,
                details=details,
            )
        )

    def end_trace(self, output_result: Any) -> ExecutionReport:
        """Finalise the active trace and store it in :attr:`reports`.

        Args:
            output_result: The algorithm's return value.

        Returns:
            ExecutionReport: The completed report.

        Raises:
            RuntimeError: If no trace is currently active.
        """
        if self._current is None:
            raise RuntimeError("No active trace — call start_trace() first.")
        self._current.output_result = output_result
        report = self._current
        self.reports.append(report)
        self._current = None
        return report

    def clear(self) -> None:
        """Discard all stored reports and reset internal state."""
        self.reports.clear()
        self._current = None
        self._step_counter = 0


# ---------------------------------------------------------------------------
# Convenience trace runners
# ---------------------------------------------------------------------------


def trace_eea(a: int, b: int) -> ExecutionReport:
    """Run Extended Euclidean Algorithm with full step tracing.

    Delegates to :func:`backend.core.math_utils.extended_euclidean`, passing a
    ``trace_hook`` callback that feeds every intermediate row into the inspector.

    The EEA computes ``gcd(a, b)`` and Bézout coefficients ``x``, ``y`` such
    that::

        a·x + b·y = gcd(a, b)

    Args:
        a: First integer (e.g. the public exponent *e*).
        b: Second integer (e.g. Euler's totient *φ(n)*).

    Returns:
        ExecutionReport: Report whose ``output_result`` is
        ``{"gcd": int, "x": int, "y": int}`` and ``steps`` contains one
        :class:`StepTrace` per EEA iteration.
    """
    from backend.core.math_utils import extended_euclidean  # deferred to avoid circular imports

    inspector = CryptoInspector()
    inspector.start_trace("extended_euclidean", {"a": a, "b": b})

    def hook(step_dict: dict) -> None:
        inspector.record_step("EEA Step", step_dict)

    result = extended_euclidean(a, b, trace_hook=hook)
    return inspector.end_trace({"gcd": result[0], "x": result[1], "y": result[2]})


def trace_mod_exp(base: int, exp: int, mod: int) -> ExecutionReport:
    """Run modular exponentiation with full step tracing.

    Delegates to :func:`backend.core.math_utils.mod_exp`, recording each
    square-and-multiply iteration via a ``trace_hook`` callback.

    Computes ``base^exp mod mod`` using the binary (right-to-left) method::

        result = base^exp (mod mod)

    Args:
        base: The base value *m* (plaintext or ciphertext).
        exp:  The exponent *e* (encryption) or *d* (decryption).
        mod:  The RSA modulus *n*.

    Returns:
        ExecutionReport: Report whose ``output_result`` is the final integer
        and ``steps`` contains one :class:`StepTrace` per bit of *exp*.
    """
    from backend.core.math_utils import mod_exp  # deferred to avoid circular imports

    inspector = CryptoInspector()
    inspector.start_trace("mod_exp", {"base": base, "exp": exp, "mod": mod})

    def hook(step_dict: dict) -> None:
        inspector.record_step("ModExp Step", step_dict)

    result = mod_exp(base, exp, mod, trace_hook=hook)
    return inspector.end_trace(result)


def trace_miller_rabin(n: int, k: int = 5) -> ExecutionReport:
    """Run Miller-Rabin primality test with full step tracing.

    Delegates to :func:`backend.core.primes.miller_rabin`, recording each
    witness round via a ``trace_hook`` callback.

    The test writes ``n - 1 = 2^r · d`` and checks *k* random witnesses *a*::

        a^d ≢ 1 (mod n)  and  a^(2^j · d) ≢ -1 (mod n)  for all j < r

    If any witness is a *strong liar*, *n* is composite; otherwise *n* is
    probably prime with error probability ≤ ``4^(-k)``.

    Args:
        n: The integer to test for primality.
        k: Number of witness rounds (higher = more confident). Default 5.

    Returns:
        ExecutionReport: Report whose ``output_result`` is ``True`` (probably
        prime) or ``False`` (definitely composite), with one
        :class:`StepTrace` per witness round.
    """
    from backend.core.primes import miller_rabin  # deferred to avoid circular imports

    inspector = CryptoInspector()
    inspector.start_trace("miller_rabin", {"n": n, "k": k})

    def hook(step_dict: dict) -> None:
        inspector.record_step("Miller-Rabin Round", step_dict)

    result = miller_rabin(n, k=k, trace_hook=hook)
    return inspector.end_trace(result)
