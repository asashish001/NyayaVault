# Product Requirements Document (PRD)
## : Secure Digital Document Management System for Legal and Investigation Documents

**Sponsor:** Ministry of Home Affairs (NCRB, Women Safety Division)
**Category:** Software | Theme: Blockchain & Cybersecurity
**Doc owner:** Team | **Status:** Draft v1.0

---

## 1. Purpose & Vision

Build a centralized, secure, AI-assisted platform that manages the full lifecycle of legal and
investigative documents (FIRs, charge sheets, witness statements, forensic reports, court
filings) with guaranteed **integrity, confidentiality, auditability, and legal admissibility**.

**Product statement:**
> A secure, blockchain-anchored and AI-assisted legal evidence management platform that
> turns scattered legal records into searchable case intelligence while preserving
> confidentiality, version history, chain-of-custody, and court-verifiable document integrity.

**Positioning:** This is not a "secure vault." It is a **court-ready evidence intelligence and
chain-of-custody layer** that interoperates with existing government systems (ICJS, CCTNS,
e-Courts, e-Sakshya, e-Prosecution) rather than replacing them.

---

## 2. Problem Statement

- Fragmented / paper-based storage → slow retrieval and collaboration.
- Unauthorized access and document tampering risk.
- Poor version control, audit trails, and compliance tracking.
- Growing data volume with no secure, scalable, intelligent DMS.

## 3. Goals & Success Metrics

| Goal | Metric (prototype-level) |
|---|---|
| Tamper-evident storage | 100% of stored versions hashed (SHA-256) + anchored; modified-file demo shows mismatch |
| Fast retrieval | Search returns relevant case docs via keyword + metadata + 1 semantic query |
| Controlled access | ≥1 demonstrated denied-access event, logged |
| Reduced manual review time | AI-assisted case summary generated with 100% cited claims |
| Auditability | Every view/download/share/custody-transfer event logged, append-only |
| Legal defensibility | Exportable "Proof of Integrity" + audit report per case |

## 4. Non-Goals (Out of Scope for MVP / )

- Production integration with CCTNS/ICJS/e-Courts (mocked only).
- Real Class-3 DSC/eSign PKI onboarding (simulated signing only).
- Handwritten text recognition, deepfake/advanced forgery detection.
- Public, multi-validator production blockchain network.
- Full SIEM/SOC deployment; multi-language support beyond English + 1 Indic language.

## 5. Stakeholders / Personas

| Persona | Role | Key needs |
|---|---|---|
| Investigating Officer (IO) | Uploads FIRs, evidence, manages case | Fast upload, case-scoped access, custody transfer |
| SHO / Station Admin | Approves documents, oversees station cases | Approval workflow, oversight dashboard |
| Forensic Expert | Uploads forensic reports | Secure intake, chain-of-custody linkage |
| Public Prosecutor | Reviews case bundle, prepares filings | Read access, case summary, redacted sharing |
| Judge / Court Staff | Views court-ready exports | Verified integrity report, minimal UI |
| Auditor / Oversight Body | Reviews access & integrity | Full audit trail, integrity verification tool |
| System Admin | Manages users/roles | RBAC/ABAC configuration, key management oversight |

## 6. User Stories (MVP-critical, prioritized)

1. **As an IO**, I can log in with MFA and upload a document to a case I'm assigned to, so it is securely stored and versioned.
2. **As the system**, I automatically OCR, classify, and extract key fields from an uploaded document, so metadata entry is faster.
3. **As an IO/SHO**, I can review and correct low-confidence extracted fields before the document is approved/indexed.
4. **As the system**, I compute a SHA-256 hash per version and anchor it to a ledger, so tampering is detectable.
5. **As an Auditor**, I can recompute a document's hash and compare to the anchored record to get a Verified/Mismatch result.
6. **As an IO**, I can transfer custody of a document (e.g., to Forensic Lab) and the event is signed, timestamped, and logged.
7. **As a Prosecutor**, I can receive a time-bound, watermarked, view-only link to a shared document.
8. **As any authorized role**, I can search case documents by case ID, doc type, keyword, and one semantic query.
9. **As a Judge/Prosecutor**, I can request an AI-generated case summary where every claim is cited to a source document/page, or the system says "Not found."
10. **As a user without case assignment**, my access attempt is denied and logged (negative test case).
11. **As an Auditor**, I can export a court-ready "Integrity & Audit Report" for a case.
12. **As any user**, all my actions (view/download/share/edit) are recorded in an append-only audit log.

## 7. Functional Requirements (mapped to problem statement)

### FR1 — Digitization & Centralized Storage
Bulk/single upload, OCR pipeline, metadata extraction, auto-classification (FIR / charge
sheet / witness statement / forensic report / judgment).

### FR2 — Secure Access & Confidentiality
RBAC + ABAC (role, case assignment, sensitivity, purpose, time-bound), MFA, encryption at
rest (AES-256) and in transit (TLS 1.3).

### FR3 — Tamper Prevention & Integrity
SHA-256 hashing per version, blockchain/ledger anchoring, digital-signature simulation,
integrity verification (recompute vs anchored).

### FR4 — Complete Audit Trail
Immutable/append-only logs for view, download, edit, share, and custody-transfer events.

### FR5 — Efficient Search & Retrieval
Full-text search (OCR text + metadata), filters (case, doc type, date, station), one semantic
/ RAG-based query feature.

### FR6 — Collaboration Among Authorized Stakeholders
Secure time-bound sharing links, watermarking, view-only mode, redaction of sensitive
fields, approval workflow.

### FR7 — Legal & Regulatory Compliance
Court-ready export package (hash, audit trail, ledger reference, verification result), DPDP
Act–aligned data handling, IT Act–aligned electronic record/signature treatment.

### FR8 — AI Case Assistant (controlled)
RAG-based case summarization / semantic search with mandatory source citation and a
"Not found in documents" fallback — never the sole source of truth.

## 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Security | MFA, RBAC+ABAC, AES-256 at rest, TLS 1.3 in transit, key mgmt via KMS/HSM (simulated for MVP) |
| Privacy | DPDP-aligned; field-level redaction of victim/witness identity; data minimization to LLM |
| Auditability | Append-only audit store; every sensitive action logged with actor, timestamp, purpose |
| Availability | Async job processing for OCR/AI so uploads don't block; resumable uploads |
| Scalability | Off-chain document storage; on-chain only hashes; batched/Merkle anchoring |
| Usability | Simple role-based dashboards; clear status labels (Verified / Pending / Mismatch / Denied) |
| Explainability | Every AI-generated claim traceable to a source snippet; confidence indicators shown |
| Compliance | IT Act (electronic records/signatures), Evidence Act (electronic evidence), DPDP Act, CERT-In practices, ISO 27001–style controls |

## 9. Ecosystem Positioning (must state explicitly to judges)

| System | Focus | This product's relationship |
|---|---|---|
| ICJS | Cross-pillar data exchange (police/courts/prisons/forensics/prosecution) | Document-integrity layer plugging into ICJS APIs (mocked) |
| e-Courts (Phase III) | Digital court records, Virtual Evidence Rooms | Supplies court-ready, hash-verified export packages |
| CCTNS | Police FIR/crime tracking | References CCTNS case/FIR IDs; adds versioning + audit + AI |
| e-Sakshya | Raw digital evidence (photo/video) | Complements — this system handles structured legal *documents* |
| e-Prosecution | Prosecutor case management | Supplies charge sheets / evidence bundles in compliant format |

**Narrative:** "We are not replacing ICJS/CCTNS/e-Courts/e-Sakshya. We add the missing
piece: a secure, AI-assisted, blockchain-anchored document layer with tamper-evident
integrity, controlled collaboration, and court-verifiable proofs."

## 10. MVP Scope (single vertical slice)

1. Role login (IO, SHO, Forensic Expert, Prosecutor, Judge/Auditor) + MFA + case-based RBAC/ABAC (incl. 1 denied-access demo).
2. Upload → malware/type validation → encrypted storage → versioning.
3. OCR + document-type classification + 5–8 key-field extraction with edit/approve UI.
4. SHA-256 hashing per version + ledger/hash-chain anchoring + visible proof/tx ID.
5. Custody-transfer events (signed, timestamped, logged).
6. Search: case ID / doc type / keyword / date + 1 semantic query.
7. One controlled LLM/RAG feature: cited case summary or semantic Q&A.
8. Time-bound, watermarked sharing link with optional redaction.
9. Integrity verification screen (tamper a copy → show mismatch).
10. Exportable Integrity & Audit Report (PDF).

## 11. Risks (see RULES.md and DESIGN.md Threat Model for detail)

Data quality/OCR accuracy, AI hallucination, blockchain scalability perception, DSC/eSign
complexity, scope creep, demo-data realism, over-claiming AI/blockchain capability,
privacy/DPDP compliance for victim data (Women Safety Division context).

## 12. Open Questions

- Which permissioned ledger (Hyperledger Fabric / Quorum / simple hash-chain) fits team skillset and timeline?
- Which second Indic language (Hindi vs Punjabi) will the team validate OCR against?
- Which LLM will be self-hosted vs API-based for the demo, given data-sensitivity constraints?

## 13. Related Documents
`02_DESIGN.md` · `03_RULES.md` · `04_TASKS.md` · `05_THREAT_MODEL.md` · `06_DATA_MODEL_AND_API.md` · `07_TEST_AND_EVAL_PLAN.md` · `08_DEMO_AND_PITCH_GUIDE.md`
