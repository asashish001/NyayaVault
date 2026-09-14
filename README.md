# NyayaVault: Secure Digital Document Management System for legal and investigation documents 
**Smart India Hackathon 2026 — Problem Statement ID: SIH26190**  
**Team:** S.W.O.R.D.  
**Tagline:** Secure Evidence. Stronger Justice.

NyayaVault is a prototype. It is a court-ready evidence-document intelligence platform: encrypted off-chain storage, SHA-256 version integrity, an append-only audit trail, a tamper-evident hash chain (not a public blockchain), OCR, controlled RAG, and privacy-aware sharing. It is **not** a national ICJS/CCTNS replacement.

All people, stations, FIR numbers, and facts in the demo are **fictional**.

## Current phase

Most core features (identity, RBAC/ABAC, audit, upload, ledger UI, sharing, OCR, AI assistant, and court bundle export) are implemented and functional.

See [`Docs/IMPLEMENTATION_LOG.md`](Docs/IMPLEMENTATION_LOG.md) for the living engineering record.

## Quick start

Prerequisites: Node.js 20+ and npm.

## AI engine
The AI features use the **HuggingFace Inference API**. You must provide your own HuggingFace access token in the `.env` file for the LLM and embeddings to work.

**How to get a free HuggingFace Token:**
1. Create a free account at [HuggingFace](https://huggingface.co/join).
2. Go to your [Access Tokens page](https://huggingface.co/settings/tokens).
3. Click **Create new token** (a "Read" token is sufficient).
4. Copy the generated token (it starts with `hf_...`).
5. Open your `.env` file and set `OPENAI_API_KEY="your_token_here"`.

OCR and text extraction use local libraries (`pdf-parse` for PDFs, `tesseract.js` for images) — no cloud calls needed for document processing.

```bash
copy .env.example .env
npm install
npx prisma migrate dev --name phase1_init
npm run db:seed
npm test
npm run dev
```

> [!WARNING]
> **Important Note for Evaluators:** During `npm install` and `prisma migrate dev`, Prisma will attempt to download its database engine binaries from its external CDN (`binaries.prisma.sh`). 
> If you are on a strict corporate network or VPN, this download may fail with a **403 Forbidden** error. If Prisma fails to initialize, the app will return a **global 500 Error** (even on the login page) due to the middleware architecture.
> **Fix:** Disconnect from your VPN/Proxy for the first run, or configure your terminal's `HTTP_PROXY` and `HTTPS_PROXY` variables.

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
- **Adapters (interfaces / mocks):** filesystem storage, hash-chain ledger, mock CCTNS/ICJS/e-Courts/e-Forensics/e-Prosecution, local AI models

Details: [`Docs/ARCHITECTURE.md`](Docs/ARCHITECTURE.md)

## Features vs phase

| Capability | Status |
|---|---|
| Demo login, MFA OTP, role switcher | Implemented |
| Cases dashboard, seeded women-safety case | Implemented |
| Server ABAC + denied-access audit | Implemented |
| Upload / encrypted versions / SHA-256 | Implemented |
| Hash-chain ledger UI, integrity, custody timeline | Implemented |
| OCR, search, document viewer / review | Implemented |
| Share, watermark, redaction | Implemented |
| Cited Case Assistant (Local AI) | Implemented |
| Court bundle export | Implemented |

## Environment variables

See `.env.example`. Copy it to `.env` before first run. You must add your own HuggingFace token to `OPENAI_API_KEY` for the AI assistant to work. To use a different provider, update `OLLAMA_BASE_URL`, `OPENAI_API_KEY`, `OLLAMA_MODEL`, and `OLLAMA_EMBED_MODEL`.

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
- AES-256 at rest currently uses a local filesystem storage adapter, not a remote KMS-backed bucket.

## License

MIT — see `LICENSE`. Demo use only; do not load real investigative or victim data.

## Product specs

Product docs remain in [`Docs/`](Docs/) (`01_PRD.md` … `08_DEMO_AND_PITCH_GUIDE.md`).
