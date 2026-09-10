# Threat model — NyayaVault

Derived from `Docs/05_THREAT_MODEL.md`. Residual risks are honest: this is an SIH prototype.

## Conventional threats

| Threat | Example | Control in prototype | Residual risk |
|---|---|---|---|
| Unauthorized access | IO opens unassigned case | RBAC + assignment ABAC on server; deny logged | JWT secret in `.env`; demo passwords |
| Insider leak | Download and forward | Planned: watermark, view-only share, audit (Phase 5) | No DLP in MVP |
| Tampering | Modified FIR | Planned: versions + SHA-256 + hash chain (Phases 2–3) | Hash chain lives in the same DB until Fabric adapter |
| Malware upload | Weaponized PDF | Planned allow-list + scan **status** field | No real AV engine |
| Credential theft | Stolen session | HttpOnly cookie, 8h expiry, demo MFA OTP | OTP is a shared demo value |
| API abuse | Scraping | In-memory rate-limit placeholder | Not distributed; easy to bypass locally |
| Admin abuse | Silent override | Admin has no `view_case`; actions still audited | Admin can read audit and user tables |

## AI / LLM (Phase 6)

| Threat | Control |
|---|---|
| Prompt injection | Delimited context; treat document text as untrusted; no tool calls |
| Data leakage | Mock LLM default; redact before live provider; one-case retrieval |
| Hallucination | Citations required; uncited claims suppressed; “Not found…” |
| Bias | Neutral prompt; no guilt/innocence |

## Residual risks to state to judges

- SQLite hash chain is tamper-evident **if** an auditor can compare exported proofs; a privileged DB operator could rewrite the chain unless an external anchor exists.
- Local HTTP has no TLS.
- Demo MFA is not a personal authenticator.
- Classification for prosecutors currently allows case view of protected cases; field-level redaction is Phase 5.

## Security tests (Phase 1)

- [x] Assigned IO can view WS-2026-0001 (policy unit test)
- [x] Unassigned IO cannot view WS-2026-0001 (policy unit test)
- [x] Admin cannot `view_case` (no silent bypass)
- [ ] Denied page write appears in audit UI (manual / later automated)

## Related

`Docs/03_RULES.md`, `Docs/05_THREAT_MODEL.md`, `docs/TEST_PLAN.md`
