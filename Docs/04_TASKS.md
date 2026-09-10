# Task Breakdown & Build Plan
## SIH 2026 — PS 26190

Build order follows one working **vertical slice first**, then layered enhancement. Each phase
should end with something demoable.

---

## Phase 0 — Setup (Day 0–1)

- [ ] Initialize repo structure: `/frontend`, `/backend`, `/ai-service`, `/ledger-service`, `/docs`
- [ ] Create `docs/IMPLEMENTATION_LOG.md` (see format in §5)
- [ ] Create `README.md` with project scope, boundaries, and links to PRD/Design/Rules
- [ ] Define API contracts for: auth, upload, document, search, share, custody, integrity, RAG (see `06_DATA_MODEL_AND_API.md`)
- [ ] Set up Postgres schema (Case, Document, DocumentVersion, CustodyEvent, AuditLog, User, AccessPolicy, ShareToken)
- [ ] Set up object storage (S3-compatible, encrypted bucket)
- [ ] Assign team ownership per DESIGN.md §Team Work Split

## Phase 1 — Identity, RBAC/ABAC, Audit Skeleton (Day 1–3)

- [ ] User model + roles (IO, SHO, Forensic Expert, Prosecutor, Judge, Auditor, Admin)
- [ ] MFA login flow (OTP/TOTP)
- [ ] JWT/OIDC session issuance with role claims
- [ ] RBAC + ABAC policy engine: role + case-assignment + sensitivity + purpose + time-window
- [ ] Append-only audit log service; log every auth event and access decision
- [ ] **Negative test:** unauthorized user attempts access to unassigned case → denied + logged
- [ ] API Gateway / WAF / rate limiting basic setup

## Phase 2 — Ingestion, Storage, Versioning (Day 3–5)

- [ ] Upload endpoint: file-type/size validation, malware scan (basic AV or sandbox)
- [ ] Encrypted storage write (AES-256) + DB record creation (status = Processing)
- [ ] Document versioning model: new upload of same doc → new version, original preserved
- [ ] Case linkage: document → case_id

## Phase 3 — OCR / IDP Pipeline (Day 5–8)

- [ ] Build/curate fictional dummy dataset (FIR, charge sheet, witness statement, forensic report — English + 1 Indic language)
- [ ] OCR integration (Tesseract or chosen IDP), preprocessing (deskew/denoise)
- [ ] Document-type classifier (rule-based + lightweight ML hybrid)
- [ ] Field extraction (case number, date, police station, sections, names) with confidence scores
- [ ] Manual review/edit UI for low-confidence fields
- [ ] Index approved OCR text into search engine

## Phase 4 — Integrity & Ledger (Day 8–11)

- [ ] SHA-256 hashing service for each stored version
- [ ] Ledger choice implementation: simple hash-chained ledger (MVP) or Hyperledger/Quorum testnet (stretch)
- [ ] Batch/Merkle anchoring job
- [ ] Store ledger tx reference against document version
- [ ] Integrity verification endpoint/screen: recompute hash vs anchored → Verified/Mismatch/Pending
- [ ] **Demo test:** tamper a copy of a file → show Mismatch result

## Phase 5 — Workflow & Chain-of-Custody (Day 11–13)

- [ ] Custody-transfer action (IO → Forensic Lab → Prosecutor → Court)
- [ ] Mock digital-signature service for approvals/custody events
- [ ] Custody event: actor, timestamp, reason, signature ref, hash-anchored
- [ ] Chain-of-custody visual timeline (per document/case)
- [ ] Approval workflow for critical docs (e.g., charge sheet requires SHO sign-off)

## Phase 6 — Search & Sharing (Day 13–15)

- [ ] Keyword + metadata search (case ID, doc type, date range, station)
- [ ] Vector index setup for semantic search (embeddings of OCR chunks)
- [ ] Secure share-link generation: time-bound, purpose-bound token
- [ ] Dynamic watermarking on view/download (user ID, timestamp, case ID)
- [ ] Field-level redaction workflow before external sharing
- [ ] Log all share/view/download events

## Phase 7 — Controlled LLM / RAG Feature (Day 15–18)

- [ ] Chunking + embedding pipeline for case documents
- [ ] Retrieval service: top-K relevant chunks, access-filtered (case + role + sensitivity) before retrieval
- [ ] Redaction step before sending text to LLM
- [ ] Prompt template: system instructions, `<context>`/`<user_query>` delimiters, citation requirement, "Not found" fallback
- [ ] LLM integration (self-hosted preferred) — choose: case summary and/or semantic Q&A
- [ ] Output validation: reject claims without valid citation mapping
- [ ] UI: cited answer + clickable source snippets + "AI-assisted, verify" disclaimer
- [ ] RAG interaction logging (model/version, chunk IDs, output hash, reviewer action)
- [ ] Basic prompt-injection sanitization for uploaded documents (strip hidden/invisible text)
- [ ] Bias/neutral-language test pass across diverse fictional sample cases

## Phase 8 — Compliance & Export (Day 18–20)

- [ ] Court-ready export: file hash, audit events, ledger reference, verification result → PDF
- [ ] Retention / legal-hold flag implementation (block deletion while flagged)
- [ ] Data classification tagging on all documents
- [ ] Mock ICJS/CCTNS adapters (`GET /icjs/case/{caseId}`, `GET /cctns/fir/{firNumber}`, `POST /documents/export-to-court`)

## Phase 9 — Testing & Evaluation (Day 20–22)

- [ ] Run evaluation suite from `07_TEST_AND_EVAL_PLAN.md` (OCR accuracy, classification F1, RAG groundedness/hallucination rate, security tests)
- [ ] Security test pass: denied-access test, tampered-file test, malicious-upload test, prompt-injection test
- [ ] Fix critical issues; log all results in implementation log

## Phase 10 — Demo & Pitch Prep (Day 22–24)

- [ ] Finalize one coherent fictional case story (women-safety-context example)
- [ ] Rehearse end-to-end demo per `08_DEMO_AND_PITCH_GUIDE.md`
- [ ] Prepare PPT: problem, architecture, innovation-over-baseline, ecosystem positioning, compliance, evaluation results
- [ ] Prepare answers to anticipated judge questions (see `08_DEMO_AND_PITCH_GUIDE.md`)

---

## Backlog / Future Scope (explicitly NOT in MVP)

- Real CCTNS/ICJS/e-Courts API integration (requires NCRB/NIC authorization)
- Real Class-3 DSC/eSign PKI integration
- Handwritten-text recognition (HTR)
- Advanced deepfake/forgery detection models
- Multi-language OCR beyond English + 1 Indic language
- Production multi-node permissioned blockchain
- Full SIEM/SOC integration, national-scale deployment

---

## 5. Implementation Log Format (mandatory — append to `docs/IMPLEMENTATION_LOG.md`)

```
## YYYY-MM-DD HH:MM — <short title>
- Status: Planned | In Progress | Completed | Blocked | Changed
- Area: Frontend | Backend | Database | Security | AI/RAG | OCR | Ledger | Testing
- Changed: <files/components changed>
- What was done: <concise factual description>
- Why: <requirement or decision reason>
- Validation: <commands/tests/screens verified, or "Not yet tested">
- Result: <pass/fail/current behavior>
- Risks/limitations: <remaining issue, or "None">
- Next: <specific next task>
```

Rules: never overwrite/delete prior entries; log after every meaningful action, including
failures and workarounds (see `03_RULES.md` R36).

## Related Documents
`01_PRD.md` · `02_DESIGN.md` · `03_RULES.md` · `05_THREAT_MODEL.md` · `06_DATA_MODEL_AND_API.md` · `07_TEST_AND_EVAL_PLAN.md` · `08_DEMO_AND_PITCH_GUIDE.md`
