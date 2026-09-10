# Data Model & API Contracts
## SIH 2026 — PS 26190

Define these contracts **before** building dependent modules (Rule R32).

---

## 1. Core Entities

### Case
```
case_id (PK), cctns_ref, title, station, status,
sensitivity_level [Public|Internal|Confidential|Restricted|Protected],
created_at, created_by
```

### Document
```
doc_id (PK), case_id (FK), type [FIR|ChargeSheet|WitnessStatement|ForensicReport|
Judgment|Other], current_version, classification_confidence,
status [Processing|ManualReview|Approved|Shared|Filed|Archived],
sensitivity_level, created_at
```

### DocumentVersion
```
doc_id (FK), version (int), storage_ref, sha256_hash, created_by,
created_at, prev_version_hash, ledger_tx_ref, ledger_status
[Pending|Anchored|Mismatch]
```

### CustodyEvent
```
event_id (PK), doc_id (FK), version, from_actor, to_actor,
timestamp, reason, signature_ref, ledger_tx_ref
```

### AuditLog (append-only)
```
event_id (PK), actor_id, role, action [View|Download|Edit|Share|
CustodyTransfer|AccessDenied|Login|RagQuery], doc_id/case_id,
timestamp, ip, device, result [Success|Denied]
```

### User
```
user_id (PK), name, role, station/department, mfa_enabled,
case_assignments[]
```

### AccessPolicy
```
role, case_scope, sensitivity_scope, purpose_required (bool),
time_window
```

### ShareToken
```
token_id (PK), doc_id, recipient, expiry, purpose,
watermark_config, redaction_config, created_by, created_at
```

### RagQueryLog
```
query_id (PK), user_id, case_id, query_text, retrieved_chunk_ids[],
model_version, output_text, output_hash, citations[], reviewer_action
```

---

## 2. API Endpoints (MVP)

### Auth
- `POST /auth/login` → issues MFA challenge
- `POST /auth/mfa/verify` → returns JWT with role + case-assignment claims

### Documents
- `POST /documents/upload` `{case_id, file, doc_type_hint?}` → `{doc_id, version, status}`
- `GET /documents/{doc_id}` → document + current version metadata
- `GET /documents/{doc_id}/versions` → version history
- `POST /documents/{doc_id}/review` `{field_corrections}` → updates extracted fields
- `GET /documents/{doc_id}/integrity` → `{status: Verified|Mismatch|Pending, computed_hash, anchored_hash, ledger_tx_ref}`

### Custody
- `POST /documents/{doc_id}/custody-transfer` `{to_actor, reason}` → `{event_id, signature_ref, ledger_tx_ref}`
- `GET /documents/{doc_id}/custody-timeline` → ordered list of CustodyEvents

### Search
- `GET /search?case_id=&doc_type=&keyword=&date_from=&date_to=` → filtered results
- `POST /search/semantic` `{case_id, query}` → RAG-filtered relevant chunks/snippets

### Sharing
- `POST /documents/{doc_id}/share` `{recipient, expiry, purpose, redact_fields[]}` → `{token_id, share_url}`
- `GET /share/{token_id}` → watermark-rendered, view-only document (validates expiry/purpose)

### RAG / Case Assistant
- `POST /cases/{case_id}/summary` → `{summary, citations[], disclaimer}`
- `POST /cases/{case_id}/ask` `{question}` → `{answer | "Not found in documents", citations[]}`

### Audit & Export
- `GET /cases/{case_id}/audit-trail` → full AuditLog + CustodyEvent list
- `GET /cases/{case_id}/integrity-report` → PDF: hashes, ledger refs, verification results, audit summary

### Mock Ecosystem Adapters
- `GET /icjs/case/{caseId}` → mock case metadata
- `GET /cctns/fir/{firNumber}` → mock FIR details
- `POST /documents/export-to-court` `{doc_id}` → mock export confirmation

---

## 3. Standard Metadata Fields (for interoperability)

`case_id, document_id, version_id, evidence_id, custody_event_id, document_type,
classification_confidence, owner_department, uploader, approver, sha256_hash,
digital_signature_status, ledger_proof_ref, retention_date, legal_hold_status,
access_policy_ref, ocr_confidence`

## Related Documents
`01_PRD.md` · `02_DESIGN.md` · `04_TASKS.md`
