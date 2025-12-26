# 🧪 Detailed Test Cases

## 1. Core Contract & Parser Tests
*These tests focus on the technical correctness of the SWIFT parser and API contract.*

| ID | Title | Pre-Condition | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **TC001** | **Validate Valid MT103 Contract** | Service is running. | 1. Generate valid MT103 using LLM.<br>2. POST to `/swift`.<br>3. Check UI. | API returns `200 OK`, `valid: true`.<br>UI displays "Contract Valid" and parses all fields. |
| **TC002** | **Validate Invalid MT103 Contract** | Service is running. | 1. Generate MT103 missing `:23B:` or `:71A:`.<br>2. POST to `/swift`.<br>3. Check UI. | API returns `valid: false`.<br>UI displays "Contract Broken" and lists missing fields. |
| **TC003** | **Validate Parser Resilience** | Service is running. | 1. Wrap valid MT103 in `{1:...}` envelopes.<br>2. Add random whitespace.<br>3. POST to `/swift`. | API correctly extracts and validates the core message.<br>UI displays valid data. |
| **TC004** | **Validate UI Dashboard Sync** | Dashboard open in browser. | 1. POST a *new* valid message to API.<br>2. Observe UI without refreshing. | UI automatically updates (via poll) to show the new message details within 2 seconds. |
| **TC005** | **Validate LLM Fallback** | `GEMINI_API_KEY` is unset. | 1. Attempt to generate message.<br>2. Verify output contains `STUB`.<br>3. POST to API. | System uses static stub data.<br>Test does not fail.<br>API accepts stub data as valid. |
| **TC006** | **Validate Field Validation Rules** | Service is running. | 1. Create MT103 with invalid date in `:32A:` (e.g., `991231USD`).<br>2. POST to `/swift`. | API returns `valid: false`.<br>Error indicates pattern mismatch for `:32A:`. |
| **TC007** | **Validate Optional Tags Parsing** | Service is running. | 1. Create MT103 with optional tag `:70:` (Remittance Info).<br>2. POST to `/swift`. | API returns `valid: true`.<br>Response data includes `remittanceInfo` field. |
| **TC008** | **Validate Garbage Input Resilience** | Service is running. | 1. POST "Hello World" or XML to `/swift`. | API returns `200` (or `400`) but **does not crash** (HTTP 500).<br>`valid: false` is returned. |

---

## 2. Banking Compliance Tests (ISO 20022 & RBI)
*These tests focus on banking logic, regulatory compliance, and fraud scenarios.*

| ID | Category | Title | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| **BTC001** | Compliance | **Valid MT103 Acceptance** | 1. Generate compliant MT103.<br>2. Submit to API. | Accepted (`200 OK`).<br>Compliant with ISO 20022 structure. |
| **BTC002** | Compliance | **Mandatory Tag Missing** | 1. Submit MT103 missing `:23B:`. | Rejected (`400 Bad Request`). |
| **BTC003** | Integrity | **Duplicate Reference** | 1. Submit MT103 with Ref `A`.<br>2. Submit *another* with Ref `A`. | Second request rejected (Idempotency check). |
| **BTC004** | AML | **Sanctioned Country** | 1. Submit MT103 to country code `NK` (North Korea). | Blocked / Alert Generated. |
| **BTC005** | Fraud | **Replay Attack** | 1. Capture payload.<br>2. Replay same payload 1 min later. | Rejected as duplicate/replay. |
| **BTC006** | Cut-Off | **After Cut-Off Time** | 1. Simulate submission after 4:00 PM. | Processed with Next Business Day value date (or queued). |
| **BTC007** | Audit | **Traceability** | 1. Submit message.<br>2. Query Audit Log by Ref ID. | Full trace of timestamp, user, and content available. |
| **BTC008** | Resilience | **Garbage Input** | 1. Submit random binary/text. | Graceful rejection (No System Failure). |

*> Note: IDs for Banking tests are prefixed with **BTC** (Banking Test Case) to distinguish them from Core tests.*
