# API — NyayaVault

Authorization is evaluated on the server. All sensitive responses omit storage paths, secrets, and other-case payloads.

Unless noted, routes require the `nv_session` cookie.

## Auth

### `POST /api/auth/login`

Request:

```json
{ "email": "io.mehra@nyayavault.demo", "password": "demo1234!" }
```

If MFA is enabled and `otp` is omitted:

```json
{ "mfaRequired": true, "message": "Enter the demo OTP to complete login." }
```

Complete with `"otp": "000000"`. Success sets HttpOnly cookie and returns the user. Failures are audited as `LOGIN` / `DENIED`.

### `POST /api/auth/logout`

Clears cookie; writes `LOGOUT`.

### `GET /api/auth/session`

Returns current user and case assignments.

### `GET /api/auth/demo-users`

Requires session and `DEMO_ROLE_SWITCH=true`. Lists demo identities for the presentation switcher.

### `POST /api/auth/switch`

```json
{ "userId": "<cuid>" }
```

Issues a new session; writes `ROLE_SWITCH` with from/to emails.

## Cases

### `GET /api/cases`

Returns cases **assigned to the session user** that pass `view_case` ABAC (classification vs role).

### `GET /api/cases/{caseId}`

Runs `authorizeCase`.  
403 `{ "error": "Not assigned to this case", "denied": true }` and `ACCESS_DENIED` audit row when unauthorized.  
404 if the id does not exist (also denied-logged).

## Audit

### `GET /api/audit`

Roles with `view_audit` (SHO, JUDGE_AUDITOR, ADMIN). Others 403 + `ACCESS_DENIED`.

## Admin

### `GET /api/admin/config`

`ADMIN` only. Users, stored policies, runtime policy dump. Does not grant case document access.

## Mock integrations (always labeled MOCK)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/mock/cctns/{firNumber}` | Fictional FIR metadata |
| GET | `/api/mock/icjs/{caseId}` | Fictional ICJS reference |
| POST | `/api/mock/ecourts/ack` | Court bundle acknowledgement stub |
| POST | `/api/mock/eforensics/hook` | Forensic handoff stub |
| POST | `/api/mock/eprosecution/hook` | Prosecution review stub |

These are **not** live government APIs.

## Planned (later phases)

Upload, versions, integrity, custody, search, share, assistant, integrity-report, court-bundle — see `Docs/06_DATA_MODEL_AND_API.md`.
