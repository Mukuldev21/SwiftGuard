# 🏦 Test Plan: SwiftGuard (Banking & Regulatory Focus)

## 1. Introduction
This document defines the **banking-focused test strategy** for **SwiftGuard**, an LLM-driven contract testing framework for SWIFT financial messaging systems.

The objective is to ensure **MT103 payment messages** are processed in compliance with **ISO 20022 standards** and **RBI regulatory requirements**, covering:
- Message compliance
- Financial integrity
- AML & fraud controls
- Cut-off handling
- Auditability
- System resilience

SwiftGuard leverages **LLM-generated test data** to simulate real-world banking scenarios, including malformed, suspicious, and high-risk financial transactions.

---

## 2. Scope

### 2.1 In Scope
- **Component**: `swiftService.js` (Payment ingestion microservice)
- **Message Type**: SWIFT MT103 (Single Customer Credit Transfer)
- **Validation Logic**:
  - `parser/swiftParser.js`
  - `contracts/mt103.schema.json`
- **AI Integration**: `llm/swiftGenerator.js` (Gemini API)
- **UI**: `ui/index.html` (Operational dashboard)
- **Compliance Coverage**:
  - ISO 20022 message rules
  - RBI payment systems, AML, and audit guidelines

### 2.2 Out of Scope
- Core banking ledger posting
- External clearing & settlement networks
- Real customer data
- Production payment systems

---

## 3. Test Strategy

### 3.1 Contract & Compliance Testing (ISO 20022)
Validate strict adherence to SWIFT MT103 and ISO 20022 rules.

- Mandatory tag enforcement (`:20:`, `:23B:`, `:32A:`, `:50K:`, `:59:`, `:71A:`)
- ISO-compliant date and currency validation (ISO 8601, ISO 4217)
- Field length and value constraints
- Rejection of schema-breaking messages

**Objective**: Prevent non-compliant financial messages from entering downstream banking systems.

---

### 3.2 Financial Integrity & Settlement Controls (RBI)
Ensure correctness of transaction processing.

- Zero or negative amount rejection
- Duplicate transaction reference detection (idempotency)
- Currency mismatch validation
- Decimal precision and rounding checks

**Objective**: Prevent double debit/credit and settlement inconsistencies.

---

### 3.3 AML & Fraud-Oriented Testing
Use LLM-generated scenarios to validate risk controls.

- Sanctioned country and blocked BIC simulation
- Threshold breach detection
- Structuring patterns (multiple low-value transfers)
- Replay and duplicate message attacks

**Objective**: Ensure AML screening and fraud-prevention readiness.

---

### 3.4 Fuzz Testing (LLM-Driven)
Validate robustness using non-deterministic banking inputs.

- Valid MT103 variations with realistic diversity
- Invalid scenarios:
  - Missing mandatory tags
  - Corrupted delimiters
  - Invalid currencies and dates
  - Oversized field values

**Goal**: Ensure safe failure without crashes or data corruption.

---

### 3.5 End-to-End (E2E) Banking Flow Validation
Using **Playwright**, validate the full operational flow:

1. MT103 generation (LLM)
2. Submission to payment API
3. API response validation (ACK / NACK / error reason)
4. UI dashboard reflects correct transaction state

**Objective**: Ensure system consistency and operational visibility.

---

### 3.6 Cut-Off Time & Calendar Handling (RBI)
Validate business calendar rules:

- After cut-off transactions
- Weekend submissions
- Bank holiday handling
- Automatic value date adjustments

**Objective**: Ensure compliance with RBI settlement timelines.

---

### 3.7 Audit & Regulatory Readiness
Validate auditability and traceability.

- End-to-end transaction reference tracking
- Immutable processing logs
- Accurate UTC timestamps (ISO 8601)

**Objective**: Ensure readiness for RBI audits and regulatory investigations.

---

## 4. Test Environment
- **OS**: Windows (Local)
- **Runtime**: Node.js v18+
- **Test Framework**: Playwright (`@playwright/test`)
- **LLM Provider**: Google Gemini (`@google/genai`)
- **Service Port**: `1934`
- **Execution Mode**: Local (non-containerized)

---

## 5. Test Scenarios (Banking Matrix – Extract)

| ID | Category | Title | Description | Expected Result |
|---|---|---|---|---|
| TC001 | Compliance | Valid MT103 Acceptance | LLM generates compliant MT103 | `200 OK`, valid=true |
| TC002 | Compliance | Mandatory Tag Missing | Missing `:23B:` or `:71A:` | `400`, schema violation |
| TC003 | Financial Integrity | Duplicate Reference | Same `:20:` reused | Second request rejected |
| TC004 | AML | Sanctioned Country | High-risk country code | Blocked + alert |
| TC005 | Fraud | Replay Attack | Same message resent | Idempotent rejection |
| TC006 | Cut-Off | After Cut-Off Time | Late submission | Queued next business day |
| TC007 | Audit | Traceability | End-to-end ID tracking | Full lifecycle trace |
| TC008 | Resilience | Garbage Input | Non-SWIFT payload | Graceful rejection |

---

## 6. Execution
Run the complete banking test suite using:

```bash
npx playwright test

```
---
## 7. Deliverables

Test Report: Playwright HTML report

Compliance Evidence: ISO 20022 rule validation logs
RBI-mapped test results

Audit Logs: Transaction reference
Processing status Error or rejection reason codes