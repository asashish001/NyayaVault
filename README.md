# NyayaVault — SIH 2026 PS 26190

**Secure Digital Document Management System for legal and investigation documents**

NyayaVault is a Smart India Hackathon prototype. It is a court-ready evidence-document intelligence platform: encrypted off-chain storage, SHA-256 version integrity, an append-only audit trail, a tamper-evident hash chain (not a public blockchain), OCR, controlled RAG, and privacy-aware sharing. It is **not** a national ICJS/CCTNS replacement.

All people, stations, FIR numbers, and facts in the demo are **fictional**.

## Current phase

Phase 0 scaffolding and Phase 1 (identity, RBAC/ABAC, seed data, audit) are implemented. Upload, ledger UI, OCR, sharing, RAG, and court export are scheduled in later phases. Navigation entries for later modules are labeled honestly.

See [`docs/IMPLEMENTATION_LOG.md`](docs/IMPLEMENTATION_LOG.md) for the living engineering record.

## Quick start

Prerequisites: Node.js 20+ and npm.

```bash
copy .env.example. env
npm install
npx prisma migrate dev --name phase1_init
npm run db:seed
npm test
npm run dev
```

Open http://localhost:3000

SQLite file: `prisma/dev.db`. Production path: change `DATABASE_URL` to PostgreSQL and keep the same Prisma schema.

## Demo credentials

Password for every account: `demo1234!`  
Demo MFA OTP: `000000`

| Role | Email | Assignment |
|---|---|---|
| Investigating Officer | `io.mehra@nyayavault.demo` | WS-2026-0001 |
| SHO / Supervisor | `sho.kapoor@nyayavault.demo` | WS-2026-0001 |
| Forensic Expert | `forensic.nair@nyayavault.demo` | WS-2026-0001 |
| Prosecutor | `pp.sharma@nyayavault.demo` | WS-2026-0001 |
| Judge / Auditor | `auditor.iyer@nyayavault.demo` | WS-2026-0001 |
| System Admin | `admin@nyayavault.demo` | No case bypass; cannot open WS-2026-0001 |
| Unauthorized IO | `io.unassigned@nyayavault.demo` | CY-2026-0099 only |

Use the unassigned IO and the dashboard “Attempt restricted case” link to show **denied access + audit log**.

## Architecture (short)

- **App:** Next.js App Router (UI + route handlers)
- **DB:** Prisma + SQLite (Postgres-ready schema)
- **Auth:** HttpOnly JWT cookie, demo MFA OTP, presentation role switcher (audited)
- **AuthZ:** RBAC + case assignment + classification ABAC on **server** routes and server-rendered pages
- **Audit:** append-only `AuditLog` rows for login, allow, and deny
- **Adapters (interfaces / mocks):** filesystem storage, hash-chain ledger, mock CCTNS/ICJS/e-Courts/e-Forensics/e-Prosecution, mock LLM (later)

Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Features vs phase

| Capability | Status |
|---|---|
| Demo login, MFA OTP, role switcher | Phase 1 |
| Cases dashboard, seeded women-safety case | Phase 1 |
| Server ABAC + denied-access audit | Phase 1 |
| Upload / encrypted versions / SHA-256 | Phase 2 |
| Hash-chain ledger UI + custody timeline | Phase 3 |
| OCR, search, viewer | Phase 4 |
| Share, watermark, redaction, court bundle | Phase 5 |
| Cited Case Assistant | Phase 6 |

## Environment variables

See `.env.example`. Never commit `.env`. Do not hard-code API keys. `LLM_MODE=mock` unless you later add a key (ask before paid APIs).

## Security notes

- Authorization is enforced in server code, not only the UI.
- Admin cannot silently skip case ABAC or the audit trail.
- Rate limiting is an in-memory placeholder.
- TLS 1.3 applies in deployment; local demo is HTTP.
- Ledger in the database is a **tamper-evident hash chain**. It is not Hyperledger Fabric.
- Mock adapters must not be described as live government integrations.

## Limitations

- No real malware engine, KMS/HSM, or Class-3 DSC.
- No live CCTNS/ICJS/e-Courts calls.
- Documents are not uploaded yet (Phase 2).
- AES-256 at rest is designed for the storage adapter in Phase 2.

## License

MIT — see `LICENSE`. Demo use only; do not load real investigative or victim data.

## Product specs

Product docs remain in [`Docs/`](Docs/) (`01_PRD.md` … `08_DEMO_AND_PITCH_GUIDE.md`).
