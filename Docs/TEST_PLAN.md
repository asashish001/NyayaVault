# Test plan — NyayaVault

Mapped to `Docs/07_TEST_AND_EVAL_PLAN.md`. Report measured results; do not invent scores.

## Phase 1 (implemented)

| Test | Expected | Automation |
|---|---|---|
| Assigned IO can view WS-2026-0001 | `evaluateAccess` allowed | `tests/auth-abac.test.ts` |
| Unassigned IO cannot view that case | denied, reason assignment | same |
| Admin cannot `view_case` | no silent bypass | same |
| Denied UI path | unassigned IO + restricted link | manual until API integration test |
| Failed login audited | `LOGIN` DENIED | manual |

Command: `npm test`

## Later phases (must add before claiming complete)

| Test | Expected |
|---|---|
| Upload creates immutable version + SHA-256 | new row, old bytes preserved |
| Modified file fails integrity | Mismatch |
| Hash chain verifies; altered ledger row fails | verify endpoint |
| Redaction derivative does not replace original | two version lineages |
| Expired share token rejected | 403 |
| Assistant unsupported question | “Not found in the authorized case documents.” |
| Uncited claims suppressed | not shown as facts |
| Prompt injection in a document | instructions in OCR do not override system policy |

## Security suite

See `docs/THREAT_MODEL.md` checklist.

## AI/IDP metrics (Phase 4–6)

OCR accuracy, classification F1, extraction P/R, RAG groundedness, hallucination rate — **measure and log**, never fabricate.
