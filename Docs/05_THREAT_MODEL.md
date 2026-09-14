# Threat Model
## 

A dedicated threat-model slide/document is expected by cybersecurity-track judges. This
covers conventional security threats plus AI/LLM-specific threats.

---

## 1. Conventional Threats

| Threat | Example | Control |
|---|---|---|
| Unauthorized access | Officer views an unassigned case | RBAC + case-based ABAC + MFA + deny logging |
| Insider leak | Authorized user downloads and forwards a witness statement | Dynamic watermark, download control, DLP-style alerts, audit trail |
| Tampering | FIR PDF modified after approval | Versioning, SHA-256 verification, blockchain-anchored integrity proof |
| Malware upload | Weaponized PDF/image enters repository | AV/sandbox scan, MIME validation, content-disarm & reconstruction |
| Credential theft | Attacker reuses an officer's session | MFA, short-lived tokens, device/session anomaly detection |
| Ransomware | Storage/metadata encrypted by attacker | Immutable backups, object-lock/versioning, tested recovery plan |
| API abuse | Script scrapes many case files | Rate limits, WAF, anomaly detection, scoped API tokens |

## 2. AI / LLM-Specific Threats

| Threat | Example | Control |
|---|---|---|
| Prompt injection | Hidden text in a PDF manipulates the case assistant | Treat all retrieved text as untrusted; sanitize inputs; no autonomous tool actions from LLM output |
| LLM data leakage | Case content sent to a public model provider | Self-host/trusted model; redact PII; least-privilege retrieval scoped to one case |
| Hallucination | Fabricated case facts/dates/sections | RAG + mandatory citation + "Not found" fallback + human review |
| Bias/unfair language | Prejudicial description of victim/accused | Neutral-language system prompt, prohibited-phrase checks, diverse test set |

## 3. Incident Response Notes

- CERT-In reporting expectations apply to relevant cyber incidents on short notification
  timelines — the design must include alerting, incident logs, and a documented response
  workflow (even if only described, not fully built, for the MVP).
- SIEM integration is listed as a **production roadmap item**, not MVP-required.

## 4. Security Test Checklist (must run before demo)

- [ ] Denied-access test — user without case assignment is blocked and logged.
- [ ] Tampered-file test — modified copy produces hash Mismatch.
- [ ] Malicious-upload test — a malformed/flagged file is rejected or sandboxed.
- [ ] Prompt-injection test — a document with hidden "ignore instructions" text does not alter LLM behavior.

## Related Documents
`01_PRD.md` · `02_DESIGN.md` · `03_RULES.md` · `07_TEST_AND_EVAL_PLAN.md`
