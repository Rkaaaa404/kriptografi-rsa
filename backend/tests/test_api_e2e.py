"""End-to-End integration tests for SecurePass RSA FastAPI endpoints.

Verifies complete REST API protocol:
- Health probe (/health)
- Key generation & academic parameter validation (/api/v1/keys/*)
  (including academic reference p=47, q=71, e=79 -> d=1019, n=3337)
- Mathematical algorithm inspector tracing (/api/v1/inspect/trace)
  (EEA, Square-and-Multiply, Miller-Rabin)
- Complete 3-party gate pass authorization lifecycle:
  1. Entity A (PPIC) issues and signs pass (/api/v1/pass/issue)
  2. Entity B (Security Guard) verifies authenticity (/api/v1/pass/gate-verify)
  3. Entity B applies gate clearance counter-signature (/api/v1/pass/gate-clearance)
  4. Entity C (Warehouse) verifies both signatures & decrypts secret note (/api/v1/pass/receive)
- Cybersecurity Attack Simulation Suite (/api/v1/attack/simulate):
  1. Payload tampering attack
  2. Rogue signer impersonation
  3. Digital signature bit corruption
  4. Replay attack with used nonce
"""

import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

# Ensure the project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.main import app
from backend.routers.nonce_registry import nonce_registry


class TestApiE2E(unittest.TestCase):
    """End-to-end integration tests for FastAPI backend."""

    @classmethod
    def setUpClass(cls):
        """Initialize FastAPI TestClient."""
        cls.client = TestClient(app)

    def setUp(self):
        """Reset or clear state before each test if needed."""
        # Clean nonce registry for isolated test executions
        nonce_registry.clear()
    # ─── 1. Health Probe ──────────────────────────────────────────────────────

    def test_health_check(self):
        """GET /health must return status ok."""
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    # ─── 2. Key Management & Academic Validation ──────────────────────────────

    def test_keygen_automatic(self):
        """POST /api/v1/keys/generate creates valid keypair."""
        payload = {"bits": 32, "e_manual": 65537}
        response = self.client.post("/api/v1/keys/generate", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["valid"])
        self.assertEqual(data["e"], 65537)
        self.assertGreater(data["n"], 0)
        self.assertGreater(data["d"], 0)
        self.assertEqual(data["pub_key"], [data["e"], data["n"]])
        self.assertEqual(data["priv_key"], [data["d"], data["n"]])
        self.assertEqual((data["e"] * data["d"]) % data["phi"], 1)

    def test_key_validation_academic_reference(self):
        """POST /api/v1/keys/validate with academic parameters p=47, q=71, e=79.

        Verifies:
        - n = p * q = 3337
        - phi = (p - 1) * (q - 1) = 3220
        - e = 79
        - d = mod_inverse(79, 3220) = 1019
        - (79 * 1019) % 3220 = 1
        """
        payload = {"p": 47, "q": 71, "e": 79}
        response = self.client.post("/api/v1/keys/validate", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertTrue(data["valid"])
        self.assertEqual(data["p"], 47)
        self.assertEqual(data["q"], 71)
        self.assertEqual(data["n"], 3337)
        self.assertEqual(data["phi"], 3220)
        self.assertEqual(data["e"], 79)
        self.assertEqual(data["d"], 1019)
        self.assertEqual(data["pub_key"], [79, 3337])
        self.assertEqual(data["priv_key"], [1019, 3337])
        self.assertEqual((79 * 1019) % 3220, 1)

    def test_key_validation_invalid_parameters(self):
        """POST /api/v1/keys/validate correctly catches invalid inputs."""
        # Non-prime p
        r1 = self.client.post("/api/v1/keys/validate", json={"p": 48, "q": 71, "e": 79})
        self.assertEqual(r1.status_code, 200)
        self.assertFalse(r1.json()["valid"])
        self.assertIn("not a prime", r1.json()["message"])

        # Identical primes p == q
        r2 = self.client.post("/api/v1/keys/validate", json={"p": 47, "q": 47, "e": 79})
        self.assertEqual(r2.status_code, 200)
        self.assertFalse(r2.json()["valid"])
        self.assertIn("distinct", r2.json()["message"])

        # Exponent e not coprime to phi (gcd(70, 3220) = 70 != 1)
        r3 = self.client.post("/api/v1/keys/validate", json={"p": 47, "q": 71, "e": 70})
        self.assertEqual(r3.status_code, 200)
        self.assertFalse(r3.json()["valid"])
        self.assertIn("coprime", r3.json()["message"])

    # ─── 3. Inspector Trace ───────────────────────────────────────────────────

    def test_inspect_trace_eea(self):
        """POST /api/v1/inspect/trace with Extended Euclidean Algorithm."""
        payload = {
            "algorithm": "eea",
            "params": {"a": 79, "b": 3220},
        }
        response = self.client.post("/api/v1/inspect/trace", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["algorithm"], "extended_euclidean")
        self.assertGreater(len(data["steps"]), 0)
        self.assertEqual(data["result"]["gcd"], 1)
        self.assertEqual(data["result"]["x"], 1019)

    def test_inspect_trace_mod_exp(self):
        """POST /api/v1/inspect/trace with Square-and-Multiply."""
        payload = {
            "algorithm": "mod_exp",
            "params": {"base": 7, "exp": 13, "mod": 19},
        }
        response = self.client.post("/api/v1/inspect/trace", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["algorithm"], "mod_exp")
        self.assertGreater(len(data["steps"]), 0)
        self.assertEqual(data["result"], pow(7, 13, 19))

    def test_inspect_trace_miller_rabin(self):
        """POST /api/v1/inspect/trace with Miller-Rabin primality test."""
        payload = {
            "algorithm": "miller_rabin",
            "params": {"n": 47, "k": 5},
        }
        response = self.client.post("/api/v1/inspect/trace", json=payload)
        self.assertEqual(response.status_code, 200)

        data = response.json()
        self.assertEqual(data["algorithm"], "miller_rabin")
        self.assertEqual(data["result"], True)

    def test_inspect_trace_unknown_algorithm(self):
        """Unknown algorithm name should return 400 Bad Request."""
        payload = {
            "algorithm": "unknown_crypto",
            "params": {},
        }
        response = self.client.post("/api/v1/inspect/trace", json=payload)
        self.assertEqual(response.status_code, 400)

    # ─── 4. Complete Gate Pass Lifecycle (Issue -> Verify -> Clear -> Receive) ─

    def _generate_test_entities(self):
        """Helper to generate keys for Entities A, B, and C."""
        res_a = self.client.post("/api/v1/keys/generate", json={"bits": 32, "e_manual": 65537}).json()
        res_b = self.client.post("/api/v1/keys/generate", json={"bits": 32, "e_manual": 65537}).json()
        res_c = self.client.post("/api/v1/keys/generate", json={"bits": 32, "e_manual": 65537}).json()
        return res_a, res_b, res_c

    def _sample_manifest(self, pass_id="SP-E2E-TEST-001"):
        """Helper returning valid ManifestHeader dict."""
        now = datetime.now(timezone.utc)
        valid_until = now + timedelta(hours=8)
        return {
            "pass_id": pass_id,
            "timestamp": now.isoformat(),
            "valid_until": valid_until.isoformat(),
            "issuer_entity": "Entity-A-PPIC",
            "origin": "Pabrik Utama PT Sinar Baja Karawang",
            "destination": "Gudang Distribusi Cakung Blok C",
            "vehicle_plate": "B 9482 KXY",
            "driver_name": "Bambang Sudarsono",
            "item_list": [
                {
                    "sku": "RAW-STL-001",
                    "name": "Baja Canai Dingin SPCC-SD 1.2mm",
                    "qty": 15,
                    "unit": "roll",
                },
                {
                    "sku": "CMP-BLT-012",
                    "name": "High-Tensile Hex Bolt M16x50",
                    "qty": 2500,
                    "unit": "pcs",
                },
            ],
        }

    def test_gate_pass_complete_happy_path(self):
        """Full end-to-end authorization lifecycle: Issue -> Verify -> Clearance -> Receive."""
        ent_a, ent_b, ent_c = self._generate_test_entities()
        manifest = self._sample_manifest()
        secret_note = "CATATAN RAHASIA: Bongkar muatan di Jalur C-2."

        # Step 1: Issue pass by Entity A
        issue_req = {
            "manifest": manifest,
            "secret_note": secret_note,
            "priv_key_a": ent_a["priv_key"],
            "pub_key_c": ent_c["pub_key"],
            "key_bits_a": 32,
            "key_bits_c": 32,
        }
        res_issue = self.client.post("/api/v1/pass/issue", json=issue_req)
        self.assertEqual(res_issue.status_code, 200)

        issue_data = res_issue.json()
        token_b64 = issue_data["token_base64"]
        self.assertTrue(len(token_b64) > 0)
        self.assertGreater(issue_data["signature"], 0)
        self.assertGreater(issue_data["digest_hash"], 0)

        # Step 2: Gate inspection verify by Entity B
        verify_req = {
            "token_base64": token_b64,
            "pub_key_a": ent_a["pub_key"],
        }
        res_verify = self.client.post("/api/v1/pass/gate-verify", json=verify_req)
        self.assertEqual(res_verify.status_code, 200)

        verify_data = res_verify.json()
        self.assertTrue(verify_data["valid"])
        self.assertFalse(verify_data["is_replayed"])
        self.assertEqual(verify_data["manifest"]["pass_id"], manifest["pass_id"])

        # Step 3: Gate clearance approval counter-signed by Entity B
        clearance_req = {
            "token_base64": token_b64,
            "priv_key_b": ent_b["priv_key"],
            "officer_id": "SATPAM-BAMBANG-01",
            "gate_id": "GATE-OUT-01",
        }
        res_clearance = self.client.post("/api/v1/pass/gate-clearance", json=clearance_req)
        self.assertEqual(res_clearance.status_code, 200)

        clearance_data = res_clearance.json()
        updated_token_b64 = clearance_data["updated_token_base64"]
        self.assertNotEqual(token_b64, updated_token_b64)
        self.assertEqual(clearance_data["clearance"]["status"], "APPROVED")

        # Step 4: Destination Warehouse receive & decrypt by Entity C
        receive_req = {
            "token_base64": updated_token_b64,
            "pub_key_a": ent_a["pub_key"],
            "pub_key_b": ent_b["pub_key"],
            "priv_key_c": ent_c["priv_key"],
        }
        res_receive = self.client.post("/api/v1/pass/receive", json=receive_req)
        self.assertEqual(res_receive.status_code, 200)

        receive_data = res_receive.json()
        self.assertTrue(receive_data["valid_a"])
        self.assertTrue(receive_data["valid_b"])
        self.assertEqual(receive_data["decrypted_secret"], secret_note)

    def test_receive_fails_if_uncleared(self):
        """Warehouse C must reject a pass that bypassed Gate Clearance (missing counter-sig)."""
        ent_a, ent_b, ent_c = self._generate_test_entities()
        manifest = self._sample_manifest(pass_id="SP-BYPASS-GATE")

        # Issue pass
        issue_req = {
            "manifest": manifest,
            "secret_note": "Secret Note",
            "priv_key_a": ent_a["priv_key"],
            "pub_key_c": ent_c["pub_key"],
        }
        token_b64 = self.client.post("/api/v1/pass/issue", json=issue_req).json()["token_base64"]

        # Attempt to receive without gate-clearance
        receive_req = {
            "token_base64": token_b64,
            "pub_key_a": ent_a["pub_key"],
            "pub_key_b": ent_b["pub_key"],
            "priv_key_c": ent_c["priv_key"],
        }
        res_receive = self.client.post("/api/v1/pass/receive", json=receive_req)
        self.assertEqual(res_receive.status_code, 200)
        data = res_receive.json()
        self.assertTrue(data["valid_a"])
        self.assertFalse(data["valid_b"])
        self.assertEqual(data["error_code"], "INVALID_CLEARANCE_SIGNATURE")

    # ─── 5. Cryptographic Attack Simulations ──────────────────────────────────

    def test_attack_payload_tampering(self):
        """Simulation: Malicious alteration of manifest items or licence plate."""
        ent_a, _, ent_c = self._generate_test_entities()
        manifest = self._sample_manifest()

        token_b64 = self.client.post(
            "/api/v1/pass/issue",
            json={
                "manifest": manifest,
                "secret_note": "Note",
                "priv_key_a": ent_a["priv_key"],
                "pub_key_c": ent_c["pub_key"],
            },
        ).json()["token_base64"]

        # Attack scenario: Tamper vehicle plate
        attack_req = {
            "token_base64": token_b64,
            "attack_type": "tamper",
            "pub_key_a": ent_a["pub_key"],
            "modifications": {"vehicle_plate": "B 6666 ROGUE"},
        }
        res = self.client.post("/api/v1/attack/simulate", json=attack_req)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["status"], "TAMPERED")
        self.assertEqual(data["error_code"], "HASH_MISMATCH")
        self.assertFalse(data["details"]["is_signature_valid"])

    def test_attack_rogue_signer(self):
        """Simulation: Unauthorised entity re-signing manifest with their own key."""
        ent_a, _, ent_c = self._generate_test_entities()
        rogue_res = self.client.post("/api/v1/keys/generate", json={"bits": 32}).json()

        manifest = self._sample_manifest()
        token_b64 = self.client.post(
            "/api/v1/pass/issue",
            json={
                "manifest": manifest,
                "secret_note": "Note",
                "priv_key_a": ent_a["priv_key"],
                "pub_key_c": ent_c["pub_key"],
            },
        ).json()["token_base64"]

        # Attack scenario: Re-sign using rogue private key
        attack_req = {
            "token_base64": token_b64,
            "attack_type": "rogue_signer",
            "pub_key_a": ent_a["pub_key"],
            "rogue_priv_key": rogue_res["priv_key"],
        }
        res = self.client.post("/api/v1/attack/simulate", json=attack_req)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["status"], "INVALID_SIGNATURE")
        self.assertEqual(data["error_code"], "ROGUE_SIGNER_DETECTED")
        self.assertFalse(data["details"]["is_signature_valid"])

    def test_attack_signature_corruption(self):
        """Simulation: Bit corruption in signature integer."""
        ent_a, _, ent_c = self._generate_test_entities()
        manifest = self._sample_manifest()
        token_b64 = self.client.post(
            "/api/v1/pass/issue",
            json={
                "manifest": manifest,
                "secret_note": "Note",
                "priv_key_a": ent_a["priv_key"],
                "pub_key_c": ent_c["pub_key"],
            },
        ).json()["token_base64"]

        attack_req = {
            "token_base64": token_b64,
            "attack_type": "corrupt_sig",
            "pub_key_a": ent_a["pub_key"],
            "modifications": {"sig_corruption": 7},
        }
        res = self.client.post("/api/v1/attack/simulate", json=attack_req)
        self.assertEqual(res.status_code, 200)

        data = res.json()
        self.assertEqual(data["status"], "SIGNATURE_CORRUPTED")
        self.assertEqual(data["error_code"], "SIGNATURE_MATH_FAILED")
        self.assertFalse(data["details"]["is_signature_valid"])

    def test_attack_replay_simulation_and_gate_verify(self):
        """Simulation: Replay attack is detected both in attack endpoint and gate verification."""
        ent_a, ent_b, ent_c = self._generate_test_entities()
        manifest = self._sample_manifest()

        token_b64 = self.client.post(
            "/api/v1/pass/issue",
            json={
                "manifest": manifest,
                "secret_note": "Note",
                "priv_key_a": ent_a["priv_key"],
                "pub_key_c": ent_c["pub_key"],
            },
        ).json()["token_base64"]

        # 1. Gate clearance registers the nonce in the registry
        res_clear = self.client.post(
            "/api/v1/pass/gate-clearance",
            json={
                "token_base64": token_b64,
                "priv_key_b": ent_b["priv_key"],
                "officer_id": "GUARD-01",
                "gate_id": "GATE-01",
            },
        )
        self.assertEqual(res_clear.status_code, 200)
        updated_token = res_clear.json()["updated_token_base64"]

        # 2. Gate verify on cleared/used token must detect REPLAY_ATTACK_DETECTED
        verify_again = self.client.post(
            "/api/v1/pass/gate-verify",
            json={"token_base64": updated_token, "pub_key_a": ent_a["pub_key"]},
        )
        self.assertEqual(verify_again.status_code, 200)
        self.assertFalse(verify_again.json()["valid"])
        self.assertTrue(verify_again.json()["is_replayed"])
        self.assertEqual(verify_again.json()["error_code"], "REPLAY_ATTACK_DETECTED")

        # 3. Simulate replay attack in Attack Router
        res_atk = self.client.post(
            "/api/v1/attack/simulate",
            json={
                "token_base64": updated_token,
                "attack_type": "replay",
                "pub_key_a": ent_a["pub_key"],
                "modifications": {},
            },
        )
        self.assertEqual(res_atk.status_code, 200)
        self.assertEqual(res_atk.json()["status"], "REPLAY_ATTACK_DETECTED")
        self.assertEqual(res_atk.json()["error_code"], "TOKEN_ALREADY_USED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
