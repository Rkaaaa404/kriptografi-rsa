# Audit & Refactor Plan — SecurePass RSA

Dokumen lengkap rencana perbaikan dan hasil audit tersimpan di:
👉 [docs/05-audit-and-refactor-plan.md](docs/05-audit-and-refactor-plan.md)

### Ringkasan Cepat untuk Agent Pelaksana:
1. **Scope:** Menutup celah F1 s/d F4 (kritis), F6 s/d F8 (mayor), robustness input (minor), refactor duplikasi (`backend/routers/protocol.py`), serta menambah tab demo enkripsi & dekripsi teks mandiri di Inspector.
2. **Kunci JS Safe:** Modulus $n$ dibatasi maksimal 52-bit agar presisi aman di frontend JavaScript.
3. **Target Verifikasi:** Menjalankan `python -m pytest backend/tests -v` (semua 51 test lama + test regresi baru wajib lulus) dan `cd frontend && npx tsc --noEmit`.
