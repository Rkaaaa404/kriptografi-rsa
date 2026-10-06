"""Comprehensive unit tests for RSA mathematics and cryptographic core engine.

Tests all pure-Python mathematical primitives without any external crypto libraries:
- Trial division pre-filtering
- Miller-Rabin probabilistic primality test
- Greatest Common Divisor (Euclidean algorithm)
- Extended Euclidean Algorithm (EEA)
- Modular multiplicative inverse
- Square-and-Multiply modular exponentiation
- RSA keypair generation (random and academic manual parameters)
- Textbook RSA integer encryption and decryption
- RSA digital signature generation and verification
- Adaptive text chunking and payload roundtrip
- Custom Polynomial Rolling Hash & canonical JSON hashing
"""

import os
import sys
import unittest

# Ensure the project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.core.math_utils import gcd, extended_euclidean, mod_inverse, mod_exp
from backend.core.primes import (
    is_prime_trial_division,
    miller_rabin,
    generate_prime_candidate,
    generate_prime,
    SMALL_PRIMES,
)
from backend.core.rsa_engine import (
    generate_keypair,
    encrypt,
    decrypt,
    text_to_blocks,
    blocks_to_text,
    sign,
    verify,
    encrypt_payload,
    decrypt_payload,
)
from backend.core.hashing import (
    polynomial_hash,
    compute_digest,
    canonical_json_digest,
    hex_digest,
    MERSENNE_31,
)


class TestTrialDivision(unittest.TestCase):
    """Unit tests for trial division primality filtering."""

    def test_small_primes_list(self):
        """All entries in SMALL_PRIMES must evaluate as prime."""
        for p in SMALL_PRIMES:
            self.assertTrue(is_prime_trial_division(p), f"{p} should be prime")

    def test_non_primes_below_two(self):
        """Integers less than 2 are not prime."""
        for n in [-100, -1, 0, 1]:
            self.assertFalse(is_prime_trial_division(n), f"{n} should not be prime")

    def test_even_numbers_above_two(self):
        """Even numbers greater than 2 are composite."""
        for n in [4, 6, 8, 10, 100, 1000, 10000]:
            self.assertFalse(is_prime_trial_division(n), f"{n} should not be prime")

    def test_known_composites(self):
        """Known odd composites must return False."""
        composites = [9, 15, 21, 25, 27, 33, 35, 49, 77, 91, 121, 143, 169, 289, 3337]
        for c in composites:
            self.assertFalse(is_prime_trial_division(c), f"{c} is composite")

    def test_primes_beyond_small_primes_table(self):
        """Primes exceeding 257 should be correctly identified."""
        larger_primes = [263, 269, 271, 307, 311, 541, 1009, 1013, 7919]
        for p in larger_primes:
            self.assertTrue(is_prime_trial_division(p), f"{p} should be prime")


class TestMillerRabin(unittest.TestCase):
    """Unit tests for the Miller-Rabin probabilistic primality test."""

    def test_edge_cases(self):
        """Numbers <= 1 and even numbers > 2."""
        for n in [-10, 0, 1]:
            self.assertFalse(miller_rabin(n), f"{n} should not be prime")
        self.assertTrue(miller_rabin(2))
        self.assertTrue(miller_rabin(3))
        self.assertFalse(miller_rabin(4))
        self.assertFalse(miller_rabin(100))

    def test_known_primes(self):
        """Standard small and moderate primes."""
        primes = [5, 7, 11, 13, 17, 19, 23, 29, 31, 47, 71, 79, 1019, 65537]
        for p in primes:
            self.assertTrue(miller_rabin(p, k=15), f"{p} should be identified as prime")

    def test_mersenne_prime_m31(self):
        """Mersenne prime 2^31 - 1 = 2147483647 must be prime."""
        self.assertTrue(miller_rabin(2147483647, k=20))

    def test_carmichael_numbers(self):
        """Carmichael numbers fool Fermat's test but fail Miller-Rabin."""
        carmichaels = [561, 1105, 1729, 2465, 2821, 6601, 8911]
        for c in carmichaels:
            self.assertFalse(
                miller_rabin(c, k=20),
                f"Carmichael number {c} must be identified as composite by Miller-Rabin",
            )

    def test_composite_products_of_primes(self):
        """Semiprimes must return False."""
        semiprimes = [47 * 71, 101 * 103, 257 * 263]
        for sp in semiprimes:
            self.assertFalse(miller_rabin(sp, k=20), f"{sp} is composite")


class TestPrimeGeneration(unittest.TestCase):
    """Unit tests for random prime generation."""

    def test_prime_candidate_bit_length(self):
        """Generated prime candidate must have exact requested bit length and be odd."""
        for bits in [16, 24, 32]:
            candidate = generate_prime_candidate(bits)
            self.assertEqual(candidate.bit_length(), bits)
            self.assertEqual(candidate % 2, 1)

    def test_generate_prime(self):
        """generate_prime must produce valid primes of requested bit length."""
        for bits in [16, 20, 24]:
            p = generate_prime(bits=bits)
            self.assertEqual(p.bit_length(), bits)
            self.assertTrue(miller_rabin(p, k=25))
            self.assertTrue(is_prime_trial_division(p))


class TestEuclideanAndEEA(unittest.TestCase):
    """Unit tests for GCD and Extended Euclidean Algorithm."""

    def test_gcd_properties(self):
        """Test GCD with diverse integer pairs."""
        self.assertEqual(gcd(0, 0), 0)
        self.assertEqual(gcd(17, 0), 17)
        self.assertEqual(gcd(0, 23), 23)
        self.assertEqual(gcd(48, 18), 6)
        self.assertEqual(gcd(100, 25), 25)
        self.assertEqual(gcd(-48, 18), 6)
        # Academic pair: 79 and phi(3337) = 3220 are coprime
        self.assertEqual(gcd(79, 3220), 1)

    def test_extended_euclidean_identity(self):
        """Extended Euclidean must satisfy Bezout's identity: a*x + b*y = gcd(a, b)."""
        pairs = [
            (79, 3220),
            (65537, 10415915047880788752),
            (240, 46),
            (35, 15),
            (1024, 256),
            (997, 883),
        ]
        for a, b in pairs:
            g, x, y = extended_euclidean(a, b)
            expected_g = gcd(a, b)
            self.assertEqual(g, expected_g)
            self.assertEqual(a * x + b * y, g, f"Bezout identity failed for ({a}, {b})")

    def test_extended_euclidean_trace_hook(self):
        """Trace hook callback should record execution steps."""
        steps = []

        def hook(step_dict):
            steps.append(step_dict)

        g, x, y = extended_euclidean(79, 3220, trace_hook=hook)
        self.assertEqual(g, 1)
        self.assertGreater(len(steps), 0)
        self.assertIn("step", steps[0])
        self.assertIn("r", steps[0])


class TestModularInverse(unittest.TestCase):
    """Unit tests for modular multiplicative inverse."""

    def test_academic_manual_calculation(self):
        """Academic lecture reference: e = 79, phi = 3220 -> d = 1019."""
        d = mod_inverse(79, 3220)
        self.assertEqual(d, 1019)
        self.assertEqual((79 * d) % 3220, 1)

    def test_mod_inverse_identity(self):
        """(e * d) mod phi must equal 1 for various valid pairs."""
        cases = [
            (3, 20),
            (7, 40),
            (17, 3120),
            (65537, (2965629853 - 1) * (3512210077 - 1)),
        ]
        for e, phi in cases:
            d = mod_inverse(e, phi)
            self.assertEqual((e * d) % phi, 1)
            self.assertGreater(d, 0)
            self.assertLess(d, phi)

    def test_non_invertible_raises_value_error(self):
        """When gcd(e, phi) != 1, mod_inverse must raise ValueError."""
        non_coprime_pairs = [
            (2, 4),
            (6, 9),
            (15, 25),
            (70, 3220),
        ]
        for e, phi in non_coprime_pairs:
            with self.assertRaises(ValueError):
                mod_inverse(e, phi)


class TestModularExponentiation(unittest.TestCase):
    """Unit tests for Square-and-Multiply modular exponentiation."""

    def test_matches_python_pow(self):
        """Square-and-Multiply must produce identical outputs to Python's pow(b, e, m)."""
        test_cases = [
            (2, 10, 1000),
            (7, 0, 13),
            (0, 5, 13),
            (12345, 6789, 1000000007),
            (47, 79, 3337),
            (999, 1019, 3337),
            (123456789, 65537, 2147483647),
        ]
        for base, exp, mod in test_cases:
            res = mod_exp(base, exp, mod)
            expected = pow(base, exp, mod)
            self.assertEqual(res, expected)

    def test_mod_one(self):
        """Modulo 1 must always yield 0."""
        self.assertEqual(mod_exp(42, 13, 1), 0)

    def test_zero_exponent(self):
        """Exponent 0 must yield 1 (for mod > 1)."""
        self.assertEqual(mod_exp(999, 0, 12345), 1)

    def test_mod_exp_trace_hook(self):
        """Trace hook callback should be called for each bit operation."""
        steps = []

        def hook(step_dict):
            steps.append(step_dict)

        res = mod_exp(7, 13, 19, trace_hook=hook)
        self.assertEqual(res, pow(7, 13, 19))
        self.assertGreater(len(steps), 0)


class TestRSAKeygen(unittest.TestCase):
    """Unit tests for RSA keypair generation."""

    def test_academic_manual_keypair(self):
        """Verify keypair generation with academic parameters p=47, q=71, e=79."""
        kp = generate_keypair(bits=16, p_manual=47, q_manual=71, e_manual=79)
        e, n = kp["public_key"]
        d, n_priv = kp["private_key"]
        params = kp["params"]

        self.assertEqual(n, 3337)
        self.assertEqual(n_priv, 3337)
        self.assertEqual(e, 79)
        self.assertEqual(d, 1019)
        self.assertEqual(params["phi"], 3220)
        self.assertEqual((e * d) % 3220, 1)

    def test_automatic_random_keygen(self):
        """Verify automatic 32-bit keypair generation."""
        kp = generate_keypair(bits=32)
        e, n = kp["public_key"]
        d, _ = kp["private_key"]
        params = kp["params"]

        self.assertTrue(miller_rabin(params["p"], k=20))
        self.assertTrue(miller_rabin(params["q"], k=20))
        self.assertNotEqual(params["p"], params["q"])
        self.assertEqual(params["p"] * params["q"], n)
        self.assertEqual((params["p"] - 1) * (params["q"] - 1), params["phi"])
        self.assertEqual((e * d) % params["phi"], 1)

    def test_invalid_manual_params(self):
        """Invalid manual primes or exponents must raise ValueError."""
        # p == q
        with self.assertRaises(ValueError):
            generate_keypair(bits=16, p_manual=47, q_manual=47, e_manual=79)
        # Composite p
        with self.assertRaises(ValueError):
            generate_keypair(bits=16, p_manual=48, q_manual=71, e_manual=79)
        # e not coprime to phi
        with self.assertRaises(ValueError):
            generate_keypair(bits=16, p_manual=47, q_manual=71, e_manual=70)


class TestRSAEncryptionAndDecryption(unittest.TestCase):
    """Unit tests for textbook RSA encrypt and decrypt."""

    def setUp(self):
        self.kp = generate_keypair(bits=16, p_manual=47, q_manual=71, e_manual=79)
        self.pub = self.kp["public_key"]    # (79, 3337)
        self.priv = self.kp["private_key"]  # (1019, 3337)

    def test_encrypt_decrypt_roundtrip(self):
        """Single integer messages strictly less than n must roundtrip."""
        test_messages = [0, 1, 42, 100, 512, 1234, 3336]
        for m in test_messages:
            c = encrypt(m, self.pub)
            recovered = decrypt(c, self.priv)
            self.assertEqual(recovered, m, f"Roundtrip failed for message {m}")

    def test_message_ge_n_raises(self):
        """Plaintext m >= n must raise ValueError."""
        with self.assertRaises(ValueError):
            encrypt(3337, self.pub)
        with self.assertRaises(ValueError):
            encrypt(5000, self.pub)


class TestDigitalSignature(unittest.TestCase):
    """Unit tests for RSA signing and verification."""

    def setUp(self):
        self.kp_a = generate_keypair(bits=32)
        self.pub_a = self.kp_a["public_key"]
        self.priv_a = self.kp_a["private_key"]

        self.kp_b = generate_keypair(bits=32)
        self.pub_b = self.kp_b["public_key"]

    def test_sign_verify_happy_path(self):
        """Authentic signature must verify successfully."""
        digest = 987654321
        sig = sign(digest, self.priv_a)
        self.assertTrue(verify(digest, sig, self.pub_a))

    def test_tampered_digest_fails(self):
        """Altering the digest must cause verification failure."""
        digest = 987654321
        sig = sign(digest, self.priv_a)
        self.assertFalse(verify(digest + 1, sig, self.pub_a))
        self.assertFalse(verify(123456, sig, self.pub_a))

    def test_tampered_signature_fails(self):
        """Corrupting the signature value must fail verification."""
        digest = 987654321
        sig = sign(digest, self.priv_a)
        corrupted_sig = sig ^ 1
        self.assertFalse(verify(digest, corrupted_sig, self.pub_a))

    def test_wrong_public_key_fails(self):
        """Verifying with a different entity's public key must return False."""
        digest = 987654321
        sig = sign(digest, self.priv_a)
        self.assertFalse(verify(digest, sig, self.pub_b))


class TestTextChunkingAndPayload(unittest.TestCase):
    """Unit tests for text_to_blocks, blocks_to_text, encrypt_payload, and decrypt_payload."""

    def test_chunking_roundtrip_various_strings(self):
        """Text chunking roundtrip must preserve exact plaintext strings."""
        test_strings = [
            "",
            "A",
            "OK",
            "SecurePass RSA 2024",
            "Baja Canai Dingin SPCC-SD 1.2mm x 1200mm",
            "Catatan Rahasia: Pintu gerbang dibuka khusus shift malam jam 21:00 WIB.",
            "Surat Jalan No: SJ-2024-10-001 | Driver: Bambang | Plat: B 9482 KXY",
            "Special characters: !@#$%^&*()_+-=[]{}|;':,.<>?/~` and Indonesian: Selamat pagi!",
        ]

        moduli = [
            3337,                           # 12-bit academic modulus
            10415915054358628681,           # 64-bit realistic modulus
            2**32 + 15,                     # 33-bit modulus
        ]

        for n in moduli:
            for text in test_strings:
                blocks = text_to_blocks(text, n)
                # All block integers must be strictly less than n
                for b in blocks:
                    self.assertLess(b, n, f"Block {b} exceeds modulus {n}")
                recovered = blocks_to_text(blocks, n)
                self.assertEqual(recovered, text, f"Failed roundtrip for string '{text}' with n={n}")

    def test_payload_encryption_decryption_roundtrip(self):
        """Full text encryption and decryption roundtrip."""
        kp = generate_keypair(bits=32)
        pub = kp["public_key"]
        priv = kp["private_key"]

        secret_memo = "CONFIDENTIAL NOTE: Deliver cargo directly to Bay 3."
        encrypted_blocks = encrypt_payload(secret_memo, pub)
        self.assertIsInstance(encrypted_blocks, list)
        self.assertGreater(len(encrypted_blocks), 0)

        decrypted = decrypt_payload(encrypted_blocks, priv)
        self.assertEqual(decrypted, secret_memo)


class TestPolynomialHashing(unittest.TestCase):
    """Unit tests for Polynomial Rolling Hash."""

    def test_deterministic_output(self):
        """Hashing identical text twice must yield identical values."""
        text = "SP-20241021-0089:Baja Canai Dingin:15:roll"
        h1 = polynomial_hash(text)
        h2 = polynomial_hash(text)
        self.assertEqual(h1, h2)
        self.assertGreaterEqual(h1, 0)
        self.assertLess(h1, MERSENNE_31)

    def test_avalanche_effect(self):
        """Single character change must produce completely different hash."""
        base_text = "SURAT JALAN NOMOR 001 QUANTITY 100"
        tampered_text = "SURAT JALAN NOMOR 001 QUANTITY 101"

        h1 = polynomial_hash(base_text)
        h2 = polynomial_hash(tampered_text)
        self.assertNotEqual(h1, h2)

    def test_canonical_json_digest_order_independence(self):
        """Dict insertion order must not alter canonical JSON hash."""
        d1 = {"sku": "RAW-01", "qty": 15, "name": "Baja"}
        d2 = {"name": "Baja", "sku": "RAW-01", "qty": 15}
        d3 = {"qty": 15, "name": "Baja", "sku": "RAW-01"}

        h1 = canonical_json_digest(d1)
        h2 = canonical_json_digest(d2)
        h3 = canonical_json_digest(d3)
        self.assertEqual(h1, h2)
        self.assertEqual(h2, h3)

    def test_hex_digest_format(self):
        """hex_digest must return a valid 0x-prefixed hex string."""
        hd = hex_digest("TEST_DATA")
        self.assertTrue(hd.startswith("0x"))
        val = int(hd, 16)
        self.assertGreaterEqual(val, 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
