# Test & Evaluation Plan
## SIH 2026 — PS 26190

Judges respond better to measured evaluation than to feature claims alone. Track these
metrics and present them as an "Evaluation" slide.

---

## 1. AI/IDP Evaluation Metrics

| Metric | How to measure | Target for demo |
|---|---|---|
| OCR accuracy | Character/word accuracy on English + 1 Indic language sample set | Report actual % (don't fabricate) |
| Document-classification F1 | Precision/recall per class (FIR, charge sheet, witness statement, forensic report, judgment) | Report per-class F1 |
| Field-extraction precision/recall | Case number, date, station, section, names | Report measured values |
| RAG groundedness | % of summary claims with a valid, verifiable source citation | Target 100% (reject ungrounded claims) |
| Hallucination rate | Unsupported statements per 100 answers (manual review) | Report actual count |
| Latency | Upload→index time, search time, integrity-check time, summary-generation time | Report actual times |

## 2. Security Test Suite

| Test | Expected result |
|---|---|
| Denied-access test | User without case assignment → blocked + logged as `AccessDenied` |
| Tampered-file test | Modified copy of a stored file → integrity check returns `Mismatch` |
| Malicious-upload test | Malformed/flagged file → rejected or sandboxed, not stored |
| Prompt-injection test | Document containing hidden "ignore instructions" text → LLM output unaffected, no restricted data leaked |
| Session/token expiry test | Expired share token → access denied |
| Redaction test | Shared document with redaction config → sensitive fields masked in output |

## 3. Functional/Integration Test Checklist

- [ ] Upload → OCR → classify → extract → review → approve → index (end-to-end)
- [ ] Hash → anchor → verify (Verified path)
- [ ] Hash → anchor → tamper → verify (Mismatch path)
- [ ] Custody transfer creates signed, hash-anchored event visible in timeline
- [ ] Search returns only case/role-permitted results
- [ ] Share link respects expiry, purpose, watermark, redaction
- [ ] RAG summary/Q&A returns cited answer or "Not found"
- [ ] Court export PDF contains hash, ledger ref, audit summary, verification result

## 4. Bias/Fairness Check (LLM outputs)

- [ ] Run case-summary feature across diverse fictional test cases (varying gender, region, religion, socio-economic background of fictional parties).
- [ ] Confirm neutral, non-judgmental language in all outputs; no stereotyping or moral-judgment phrasing.
- [ ] Log and fix any flagged outputs before demo.

## 5. Reporting

Present results as a simple table in the pitch deck (measured %, not claimed %). Include known
limitations honestly — judges with domain expertise value transparency over inflated claims.

## Related Documents
`01_PRD.md` · `03_RULES.md` · `05_THREAT_MODEL.md` · `08_DEMO_AND_PITCH_GUIDE.md`
