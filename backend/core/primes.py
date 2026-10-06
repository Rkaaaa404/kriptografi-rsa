"""Prime number generation and probabilistic primality testing.

Implements Miller-Rabin without any external crypto libraries.
All randomness comes from the stdlib ``random`` module (seeded by the OS
entropy source automatically on modern Python).
"""

import random
import math

from backend.core.math_utils import mod_exp

# ---------------------------------------------------------------------------
# Pre-computed small primes for fast trial-division pre-filtering
# ---------------------------------------------------------------------------

SMALL_PRIMES: list[int] = [
    2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47,
    53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113,
    127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191,
    193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257,
]


def is_prime_trial_division(n: int, limit: int = 10_000) -> bool:
    """Quick deterministic primality test via trial division.

    Suitable for small integers or as a fast pre-filter before Miller-Rabin.
    First checks against :data:`SMALL_PRIMES`, then tests divisors of the
    form ``6k ± 1`` up to ``min(sqrt(n), limit)``.

    Args:
        n: The integer to test.  Must be a positive integer.
        limit: Upper bound on the trial-division sweep.  Divisors beyond this
            value are not checked, so the test may give false positives for
            large composites with large prime factors.  Default 10 000.

    Returns:
        ``True`` if *n* appears to be prime under trial division up to
        *limit*; ``False`` if a divisor is found.

    Examples:
        >>> is_prime_trial_division(47)
        True
        >>> is_prime_trial_division(48)
        False
        >>> is_prime_trial_division(1)
        False
    """
    if n < 2:
        return False
    if n == 2:
        return True
    if n % 2 == 0:
        return False

    # Check against pre-computed small primes
    for p in SMALL_PRIMES:
        if n == p:
            return True
        if n % p == 0:
            return False

    # 6k ± 1 sweep up to min(sqrt(n), limit)
    sqrt_n = int(math.isqrt(n))
    cap = min(sqrt_n, limit)
    k = 1
    while True:
        lo = 6 * k - 1
        hi = 6 * k + 1
        if lo > cap:
            break
        if n % lo == 0:
            return False
        if hi <= cap and n % hi == 0:
            return False
        k += 1

    return True


def miller_rabin(
    n: int,
    k: int = 20,
    trace_hook: callable | None = None,
) -> bool:
    """Probabilistic primality test using the Miller-Rabin algorithm.

    Decomposes ``n - 1 = 2^s * d`` (with *d* odd) then performs *k*
    independent witness rounds.  Each round picks a random base ``a`` in
    ``[2, n-2]`` and checks whether *n* passes the strong probable-prime
    condition for *a*.

    A composite number is declared prime with probability at most
    ``4^{-k}`` (< 10^{-12} for k = 20).

    Math:
        n - 1 = 2^s * d,   d odd
        For each witness a:
            x = a^d (mod n)
            if x == 1 or x == n-1: continue          # probably prime
            for _ in range(s-1):
                x = x^2 (mod n)
                if x == n-1: break (probably prime)
            else: return False                         # composite

    Args:
        n: The integer to test.  Should be ≥ 2.
        k: Number of independent witness rounds.  Higher *k* reduces the
            probability of a false positive.  Default 20.
        trace_hook: Optional callable invoked once per round with a dict::

            {
                "round":    int,       # 1-based round index
                "a":        int,       # the random witness base
                "s":        int,       # exponent in n-1 = 2^s * d
                "d":        int,       # odd part of n-1
                "x_init":   int,       # x = a^d mod n (before squarings)
                "squarings": list[int], # x values after each squaring step
                "result":   str,       # "prime" or "composite"
            }

    Returns:
        ``True`` if *n* is probably prime; ``False`` if *n* is definitely
        composite.

    Examples:
        >>> miller_rabin(47, k=5)
        True
        >>> miller_rabin(48, k=5)
        False
    """
    # Deterministic small cases
    if n < 2:
        return False
    if n == 2 or n == 3:
        return True
    if n % 2 == 0:
        return False

    # Write n - 1 = 2^s * d, d odd
    s, d = 0, n - 1
    while d % 2 == 0:
        d //= 2
        s += 1

    for round_num in range(1, k + 1):
        a = random.randint(2, n - 2)
        x = mod_exp(a, d, n)
        squarings: list[int] = []
        round_result = "composite"  # pessimistic default

        if x == 1 or x == n - 1:
            round_result = "prime"
        else:
            for _ in range(s - 1):
                x = mod_exp(x, 2, n)
                squarings.append(x)
                if x == n - 1:
                    round_result = "prime"
                    break

        if trace_hook is not None:
            trace_hook({
                "round": round_num,
                "a": a,
                "s": s,
                "d": d,
                "x_init": mod_exp(a, d, n),   # recompute for clean snapshot
                "squarings": squarings,
                "result": round_result,
            })

        if round_result == "composite":
            return False

    return True


def generate_prime_candidate(bits: int) -> int:
    """Generate a random odd integer with exactly *bits* bits.

    The most significant bit and the least significant bit are both forced
    to 1, ensuring:
      * The number has exactly *bits* bits (``2^{bits-1} ≤ n < 2^bits``).
      * The number is odd (necessary condition for primality when bits > 1).

    Args:
        bits: Desired bit length.  Must be ≥ 2.

    Returns:
        A random odd integer in ``[2^{bits-1}, 2^bits - 1]`` with LSB set.

    Examples:
        >>> n = generate_prime_candidate(16)
        >>> n.bit_length() == 16
        True
        >>> n % 2 == 1
        True
    """
    n = random.getrandbits(bits)
    n |= (1 << (bits - 1))  # set MSB so bit length == bits
    n |= 1                   # set LSB so n is odd
    return n


def generate_prime(
    bits: int,
    k: int = 20,
    trace_hook: callable | None = None,
) -> int:
    """Generate a random prime of the requested bit length.

    Generates candidates via :func:`generate_prime_candidate`, applies a
    fast trial-division pre-filter against :data:`SMALL_PRIMES`, then
    confirms with :func:`miller_rabin`.

    The expected number of candidates before success is approximately
    ``ln(2^bits) ≈ bits * ln(2)`` by the Prime Number Theorem.

    Args:
        bits: Desired bit length of the prime.  Typical RSA uses ≥ 512;
            for educational/demo purposes 32 bits is sufficient.
        k:    Miller-Rabin round count forwarded to :func:`miller_rabin`.
        trace_hook: Optional callable forwarded to :func:`miller_rabin` for
            the winning candidate only (not intermediate rejections).

    Returns:
        A probable prime integer with exactly *bits* bits.

    Examples:
        >>> p = generate_prime(32)
        >>> p.bit_length() == 32
        True
        >>> miller_rabin(p, k=20)
        True
    """
    while True:
        candidate = generate_prime_candidate(bits)

        # Fast pre-filter: reject if divisible by any small prime
        divisible = False
        for sp in SMALL_PRIMES:
            if candidate == sp:
                # It *is* a small prime — accept immediately
                divisible = False
                break
            if candidate % sp == 0:
                divisible = True
                break

        if divisible:
            continue

        # Full Miller-Rabin test
        if miller_rabin(candidate, k=k, trace_hook=trace_hook):
            return candidate
