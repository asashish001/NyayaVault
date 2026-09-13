# NyayaVault Demo Environment: RBAC & ABAC Matrix

NyayaVault uses a strict Attribute-Based Access Control (ABAC) system. A user's ability to perform an action is evaluated against three factors:
1. **Role**: The user's functional job title.
2. **Assignment**: Whether the user is explicitly assigned to the specific case.
3. **Clearance Level**: The maximum data classification the user's role is permitted to view.

## 👥 Demo Users

The following accounts are pre-seeded in the database for testing the system. 
**Global Demo Password:** `demo1234!`
**Global Demo 2FA OTP:** `000000`

| Name | Role | Email | Assignment |
|------|------|-------|------------|
| **IO Kavya Mehra** | Investigating Officer (IO) | `io.mehra@nyayavault.demo` | Case `WS-2026-0001` |
| **SHO Rohan Kapoor** | Station House Officer (SHO) | `sho.kapoor@nyayavault.demo` | Case `WS-2026-0001` |
| **Forensic Expert Leela Nair** | Forensic Expert | `forensic.nair@nyayavault.demo` | Case `WS-2026-0001` |
| **Prosecutor Arjun Sharma** | Prosecutor | `pp.sharma@nyayavault.demo` | Case `WS-2026-0001` |
| **Judge/Auditor N. Iyer** | Judge / Auditor | `auditor.iyer@nyayavault.demo` | Case `WS-2026-0001` |
| **System Admin Divyansh** | Platform Admin | `admin@nyayavault.demo` | *No specific cases* |
| **IO Vikram Dutt** | Investigating Officer (IO) | `io.unassigned@nyayavault.demo` | Case `CY-2026-0099` |

---

## 🛡️ Role Permissions Matrix

The following matrix shows what actions each role can perform **on cases they are assigned to**.

   | Action | IO | SHO | Forensic | Prosecutor | Judge / Auditor | System Admin |
   |--------|:---:|:---:|:---:|:---:|:---:|:---:|
   | **View Case details** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
   | **View Documents** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
   | **Download Original File** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
   | **Upload Documents** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
   | **Approve / Verify** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
   | **Transfer Custody** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
   | **Share externally** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
   | **Export to Court** | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
   | **Ask AI Assistant** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
   | **View Audit Logs** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
   | **Manage Demo System** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🔒 Security & Privacy Enforcement Rules

NyayaVault enforces these additional "Zero-Trust" constraints regardless of role:

1. **Cross-Case Isolation**: A user cannot access a case they are not assigned to.
   > *Test this by logging in as `io.unassigned@nyayavault.demo`. They are an IO, but they will be explicitly blocked from viewing Case `WS-2026-0001` because they are only assigned to `CY-2026-0099`.*
2. **Admin Blind Spot**: Even the **System Admin** cannot view sensitive case details or upload documents. They only have access to system diagnostics and the immutable Audit Logs.
3. **Data Classification Limits**: If a case is marked as `PROTECTED_VICTIM_WITNESS` (Level 4 clearance), it can only be viewed by roles explicitly authorized for Level 4 clearance. If a standard user was assigned but lacked clearance, the system would block them.
4. **Read-Only Roles**: Prosecutors and Judges are strictly marked as `readOnly = true`. They cannot upload, edit, or modify any evidence, ensuring the Chain of Custody remains completely immutable once submitted by the Police.
