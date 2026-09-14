# Engineering Rules & Constraints
## 

These rules bind every contributor (human or AI coding agent) working on this project. They
exist to prevent scope creep, security shortcuts, and over-claiming — the three most common
reasons similar projects lose credibility with judges.

---

## 1. Scope & Positioning Rules

- R1. Never claim this system **replaces** ICJS, CCTNS, e-Courts, or e-Sakshya. Always frame it as an **interoperable, complementary document-integrity layer**.
- R2. Do not build beyond the MVP vertical slice (see PRD §10) until it works end-to-end. New features are logged as "Future Scope," not started mid-sprint.
- R3. Every external government-system integration is a **mocked adapter** (documented request/response shape) unless real credentials/APIs are explicitly available.
- R4. Do not claim "100% tamper-proof," "fully automated AI," or "legally admissible" as absolute facts. Use defensible language (see §6).

## 2. Security Rules

- R5. All documents are encrypted **at rest** (AES-256) and **in transit** (TLS 1.3). No exceptions, including for demo/test data.
- R6. Every sensitive action (view, download, edit, share, custody-transfer, approve) MUST pass an RBAC + ABAC check (role, case assignment, sensitivity level, purpose, time window) **before** execution.
- R7. Every access attempt — successful or denied — is written to the append-only audit log. Denied attempts are never silently dropped.
- R8. Original uploaded files are **never overwritten**. Every material change creates a new version; the version chain is preserved.
- R9. Blockchain/ledger stores **hashes and minimal event metadata only** — never raw documents, victim/witness names, or other personal data.
- R10. Keys/secrets are never hardcoded. Use a KMS/HSM abstraction (simulated for MVP is acceptable, but the interface must exist).
- R11. All uploaded files pass malware/format validation before storage; reject or sandbox suspicious files.

## 3. Privacy Rules (DPDP-aligned, Women Safety Division context)

- R12. Classify every document: `Public | Internal | Confidential | Restricted | Protected-Victim-Witness`.
- R13. Victim/witness identity fields (name, address, phone, ID numbers) must support **field-level redaction** before any external share or before being sent to an LLM.
- R14. LLM calls receive only the **minimum necessary, redacted** text chunks for the specific case — never a full database dump or unrelated cases.
- R15. External sharing links are **time-bound and purpose-bound**; state the purpose (e.g., "forensic examination," "court filing") at share time.
- R16. Retention/legal-hold flags must prevent deletion of records tied to active proceedings.

## 4. AI / LLM Rules (mandatory guardrails)

- R17. LLM output is **never** treated as ground truth. It is decision-support only; humans verify before any action is taken on it.
- R18. Every LLM-generated claim must carry a citation to a specific source document/page/chunk. If no supporting evidence exists, the system must output "Not found in documents" instead of guessing.
- R19. All retrieved document text passed to the LLM is treated as **untrusted content** — the prompt template must explicitly instruct the model not to follow instructions embedded in `<context>` or `<user_query>`.
- R20. Before ingestion into the RAG pipeline, sanitize documents for hidden/invisible text, off-page content, or instruction-like strings (indirect prompt-injection defense).
- R21. Prefer a self-hosted/trusted LLM for case data. If a third-party API is used, document the data-handling policy and redact sensitive fields first.
- R22. Every AI response in the UI must display: (a) an "AI-assisted — verify before use" disclaimer, (b) source snippet links, (c) a confidence indicator where applicable.
- R23. Log every AI interaction: model/version, prompt template ID, retrieved chunk IDs, output, requesting user, timestamp, and any reviewer correction — for auditability.
- R24. Never let the LLM take autonomous actions (e.g., auto-approve, auto-share, auto-delete). It only produces text for human review.
- R25. Use neutral, non-judgmental prompt instructions; never allow the model to infer guilt/innocence or use loaded/stereotyping language. Test outputs across diverse fictional demographics before demo.
- R26. Never delete existing work/code/schema changes unless explicitly authorized by the team lead.
- R27. Never overwrite or delete the master 'IMPLEMENTATION_LOG.md' or any previously written content.
- R28 When modifying a file, only change the necessary lines and do not modify the file unnecessarily.
- R29 Do not rewrite the whole file if you are only adding one thing, it's unnecessary and confusing.
- R30 Match the exact coding style of the surrounding code.

## 5. Forgery/Tamper-Detection Rules

- R31. Never market forgery/tamper detection as definitive. Present it as a **"risk score"** that routes to human/forensic-expert review.
- R32. Base tamper signals on cryptographic hash mismatch (authoritative) plus metadata/ELA heuristics (indicative only, clearly labeled as such).

## 6. Judge-Facing Language Rules (approved phrasing)

| Say | Don't say |
|---|---|
| "Tamper-evident, blockchain-anchored integrity verification." | "Blockchain makes data 100% tamper-proof." |
| "AI-assisted, source-cited summaries with mandatory human verification." | "The LLM decides legal facts." |
| "Documents are encrypted off-chain; only proof metadata is stored on the ledger." | "We store all documents on blockchain." |
| "Strengthens the ability to prove integrity, origin, and custody." | "This makes the document legally admissible." |
| "An interoperable secure-document layer for ICJS stakeholders." | "This replaces ICJS/CCTNS/e-Courts." |

## 7. Data & Demo Rules

- R33. Never use real police/victim/case data. All demo documents are fictional but internally consistent (matching case numbers, IPC/CrPC sections, station codes, dates).
- R34. Build one coherent end-to-end case story used consistently across all demo screens and the pitch.
- R35. Include at least one *negative* test in the demo: a denied access attempt and a tamper-detected mismatch.

## 8. Engineering Process Rules

- R36. Treat `docs/IMPLEMENTATION_LOG.md` as a required artifact. After every meaningful action (feature, test, bug fix, schema migration, dependency change, security control, AI/RAG change, ledger change), append a timestamped entry using the format in `04_TASKS.md` §5. Never delete or edit prior entries.
- R37. Define API contracts (request/response schemas) **before** building dependent modules, to avoid late-stage integration failures.
- R38. Every module must have at least a minimal automated or scripted test before being marked "Completed" in the task tracker.
- R39. Any risk, limitation, or known issue discovered during build must be logged immediately — not just at the end of the sprint.

## 9. Compliance Reference Points (cite, don't over-interpret)

- IT Act — electronic records and digital signatures.
- Indian Evidence Act — treatment of electronic evidence.
- DPDP Act 2023 — personal data processing, purpose limitation, breach response.
- CERT-In — incident reporting practices/timelines.
- ISO 27001–style controls — as a design reference, not a certification claim.

## 10. Related Documents
`01_PRD.md` · `02_DESIGN.md` · `04_TASKS.md` · `05_THREAT_MODEL.md`
