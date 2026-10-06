"""Pure-Python modular arithmetic utilities for RSA cryptography.

No external crypto libraries. All math is built from first principles
using Python's arbitrary-precision int type.
"""


def gcd(a: int, b: int) -> int:
    """Compute the Greatest Common Divisor using the iterative Euclidean algorithm.

    Uses the recurrence ``gcd(a, b) = gcd(b, a % b)`` until ``b == 0``.
    Handles negative inputs by taking ``abs(result)`` at the end.

    Args:
        a: First integer operand.
        b: Second integer operand.

    Returns:
        The non-negative GCD of *a* and *b*.  Returns 0 only when both
        inputs are 0.

    Examples:
        >>> gcd(3120, 79)
        1
        >>> gcd(48, 18)
        6
        >>> gcd(-12, 8)
        4
    """
    while b != 0:
        a, b = b, a % b
    return abs(a)


def extended_euclidean(
    a: int,
    b: int,
    trace_hook: callable | None = None,
) -> tuple[int, int, int]:
    """Solve the Diophantine equation ``a*x + b*y = gcd(a, b)`` iteratively.

    Implements the iterative Extended Euclidean Algorithm (EEA) using the
    standard row-update scheme::

        (old_r, r) = (a, b)
        (old_s, s) = (1, 0)   # coefficients for a
        (old_t, t) = (0, 1)   # coefficients for b

    At each step:
        q      = old_r // r
        new_r  = old_r - q * r
        new_s  = old_s - q * s
        new_t  = old_t - q * t

    When *r* reaches 0 the algorithm terminates with:
        g = old_r,  x = old_s,  y = old_t

    Args:
        a: First integer (typically *e* in RSA key generation).
        b: Second integer (typically *phi* in RSA key generation).
        trace_hook: Optional callable invoked after each step with a dict::

            {
                "step":  int,   # 1-based iteration counter
                "q":     int,   # quotient old_r // r
                "r1":    int,   # old_r before update
                "r2":    int,   # r before update
                "r":     int,   # new remainder (= old_r - q*r)
                "x1":    int,   # old_s before update
                "x2":    int,   # s before update
                "x":     int,   # new s coefficient
                "y1":    int,   # old_t before update
                "y2":    int,   # t before update
                "y":     int,   # new t coefficient
            }

    Returns:
        A 3-tuple ``(g, x, y)`` where ``g = gcd(a, b)`` and
        ``a * x + b * y == g``.

    Examples:
        >>> g, x, y = extended_euclidean(79, 3220)
        >>> g
        1
        >>> (79 * x + 3220 * y) == 1
        True
    """
    old_r, r = a, b
    old_s, s = 1, 0
    old_t, t = 0, 1
    step = 0

    while r != 0:
        q = old_r // r
        step += 1

        new_r = old_r - q * r
        new_s = old_s - q * s
        new_t = old_t - q * t

        if trace_hook is not None:
            trace_hook({
                "step": step,
                "q": q,
                "r1": old_r,
                "r2": r,
                "r": new_r,
                "x1": old_s,
                "x2": s,
                "x": new_s,
                "y1": old_t,
                "y2": t,
                "y": new_t,
            })

        old_r, r = r, new_r
        old_s, s = s, new_s
        old_t, t = t, new_t

    return old_r, old_s, old_t


def mod_inverse(
    e: int,
    phi: int,
    trace_hook: callable | None = None,
) -> int:
    """Compute the modular multiplicative inverse of *e* modulo *phi*.

    Finds an integer *d* such that ``(e * d) % phi == 1`` using the
    Extended Euclidean Algorithm.  The result is normalised to lie in
    ``[0, phi)`` via ``(x % phi + phi) % phi``.

    Math:
        e * d ≡ 1 (mod phi)   ⟺   e * d + phi * y = 1   (Bezout identity)

    Args:
        e: The integer whose inverse is sought (e.g. RSA public exponent).
        phi: The modulus (e.g. Euler's totient φ(n) = (p-1)*(q-1)).
        trace_hook: Forwarded directly to :func:`extended_euclidean` for
            step-by-step tracing.

    Returns:
        The modular inverse *d* in the range ``[0, phi)``.

    Raises:
        ValueError: When ``gcd(e, phi) != 1``, i.e. the inverse does not
            exist.

    Examples:
        >>> mod_inverse(79, 3220)
        1019
        >>> (79 * 1019) % 3220
        1
    """
    g, x, _ = extended_euclidean(e, phi, trace_hook=trace_hook)
    if g != 1:
        raise ValueError(
            f"Modular inverse does not exist: gcd({e}, {phi}) = {g} ≠ 1"
        )
    return (x % phi + phi) % phi


def mod_exp(
    base: int,
    exp: int,
    mod: int,
    trace_hook: callable | None = None,
) -> int:
    """Compute ``(base ** exp) % mod`` using the Square-and-Multiply method.

    Processes bits of *exp* from LSB to MSB (right-to-left binary method),
    achieving ``O(log exp)`` multiplications without overflow.

    Algorithm::

        result = 1
        base   = base % mod
        while exp > 0:
            if exp % 2 == 1:           # current bit is 1 → multiply
                result = (result * base) % mod
            base = (base * base) % mod  # square unconditionally
            exp //= 2                   # shift to next bit

    **IMPORTANT:** This function deliberately avoids Python's built-in
    ``pow(base, exp, mod)`` so the computation is fully observable and
    educational.

    Args:
        base: The base integer.
        exp:  The non-negative integer exponent.
        mod:  The positive modulus.
        trace_hook: Optional callable invoked once per loop iteration with::

            {
                "bit_index":  int,   # 0-based index of the current bit
                "bit_value":  int,   # 0 or 1 (the LSB of exp before shift)
                "op":         str,   # "Square+Multiply" if bit==1 else "Square"
                "base_val":   int,   # value of base *after* squaring
                "result_val": int,   # value of result *after* this step
            }

    Returns:
        ``(base ** exp) % mod``.  Returns 0 when *mod* == 1.

    Examples:
        >>> c = mod_exp(65, 79, 3337)
        >>> mod_exp(c, 1019, 3337)
        65
    """
    if mod == 1:
        return 0

    result = 1
    base = base % mod
    bit_index = 0

    while exp > 0:
        bit = exp % 2
        if bit == 1:
            result = (result * base) % mod
        base = (base * base) % mod
        exp //= 2

        if trace_hook is not None:
            op = "Square+Multiply" if bit == 1 else "Square"
            trace_hook({
                "bit_index": bit_index,
                "bit_value": bit,
                "op": op,
                "base_val": base,
                "result_val": result,
            })

        bit_index += 1

    return result
