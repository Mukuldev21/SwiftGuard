# SwiftGuard – Blueprint

## 1. Project Overview

**Project Name:** SwiftGuard

**Tagline:**
LLM-driven contract testing framework for SWIFT microservices using Playwright.

**Purpose:**
SwiftGuard validates SWIFT message–based microservice contracts by combining:

* LLM-generated SWIFT messages
* Schema-based contract validation
* HTML-only UI rendering
* Playwright-driven API + UI verification

The project is designed to run **locally without Docker**, making it lightweight, interview-ready, and easy to demonstrate.

---

## 2. Problem Statement

In banking and fintech systems:

* Microservices exchange SWIFT messages (e.g., MT103)
* Contract breaks lead to financial and regulatory risk
* Test data is hard to generate and maintain
* UI validation is often disconnected from backend contract tests

Traditional contract testing tools do not:

* Support SWIFT message formats natively
* Use AI to generate realistic test messages
* Validate backend contracts and UI rendering together

SwiftGuard addresses these gaps.

---

## 3. Goals & Non-Goals

### Goals

* Validate SWIFT MT message contracts end-to-end
* Use LLMs to generate realistic SWIFT messages dynamically
* Perform contract validation without Docker
* Use Playwright for both API and UI verification
* Keep UI simulation minimal using pure HTML

### Non-Goals

* Full SWIFT network simulation
* Production-grade SWIFT parsing engine
* UI frameworks like React/Angular

---

## 4. Target Users

* SDET / QA Automation Engineers
* Banking & FinTech QA teams
* Engineers testing message-driven microservices
* Interviewers evaluating contract-testing expertise

---

## 5. Supported Message Types (Phase 1)

* SWIFT MT103 – Customer Credit Transfer

Future extensibility:

* MT202
* MT940
* ISO 20022 messages

---

## 6. High-Level Architecture

```
LLM (Gemini / Free LLM)
        ↓
SWIFT Message Generator
        ↓
SWIFT Parser
        ↓
Contract Validator (JSON Schema)
        ↓
Local Microservice (Node.js)
        ↓
HTML UI Renderer
        ↓
Playwright Contract Tests
```

---

## 7. Technology Stack

| Layer               | Technology                            |
| ------------------- | ------------------------------------- |
| LLM                 | Gemini API / OpenRouter (free models) |
| Runtime             | Node.js                               |
| Contract Validation | JSON Schema + AJV                     |
| UI                  | Plain HTML + JavaScript               |
| Test Framework      | Playwright                            |
| API                 | Native Node HTTP server               |

---

## 8. LLM Integration Design

### Responsibilities

* Generate valid SWIFT MT103 messages
* Generate negative/invalid variants for testing

### Prompt Strategy

* Enforce mandatory SWIFT fields
* Restrict output to SWIFT format only
* No explanations or markdown

Example prompt:

> Generate a valid SWIFT MT103 message with mandatory fields only. Output strictly in SWIFT format.

---

## 9. Contract Definition Strategy

### Contract Components

1. **SWIFT Syntax Rules**
2. **Mandatory Field Validation**
3. **Schema Enforcement**

### Example Mandatory Fields (MT103)

* :20: Transaction Reference
* :23B: Bank Operation Code
* :32A: Value Date/Currency/Amount
* :50K: Ordering Customer
* :59: Beneficiary Customer
* :71A: Charges

JSON Schema is used as the formal contract definition.

---

## 10. Local Microservice Design

### Responsibilities

* Accept SWIFT message input
* Parse message into structured JSON
* Validate against schema
* Return success or error response

### API Endpoints

* `POST /swift` – Submit SWIFT message
* `GET /swift` – Retrieve last processed message

No containerization or orchestration is used.

---

## 11. UI Simulation Strategy

### Constraints

* HTML-only
* No UI frameworks
* Minimal JavaScript

### Purpose

* Display parsed SWIFT fields
* Act as UI contract consumer

UI rendering must match backend contract output exactly.

---

## 12. Playwright Testing Strategy

### Test Layers

1. Contract Validation Tests
2. API Tests
3. UI Rendering Tests

### Playwright Responsibilities

* Submit LLM-generated SWIFT messages
* Validate API response
* Verify UI displays correct contract data
* Assert failures for invalid contracts

Playwright acts as the single end-to-end validation tool.

---

## 13. Test Scenarios

### Positive Scenarios

* Valid MT103 message accepted
* UI renders all mandatory fields

### Negative Scenarios

* Missing mandatory fields
* Invalid SWIFT tag formats
* Corrupted LLM output

---

## 14. Folder Structure

```
SwiftGuard/
├── llm/
│   └── swiftGenerator.js
├── contracts/
│   └── mt103.schema.json
├── parser/
│   └── swiftParser.js
├── service/
│   └── swiftService.js
├── ui/
│   └── index.html
├── tests/
│   └── swiftContract.spec.ts
├── playwright.config.ts
└── README.md
```

---

## 15. Key Outcomes

* Demonstrates contract testing expertise
* Showcases AI-assisted test data generation
* Validates backend and UI contracts together
* Aligns with real-world banking QA challenges

---

## 16. Resume Value

This project demonstrates:

* Advanced contract testing
* Message-driven microservices validation
* Playwright beyond UI testing
* Practical AI integration in QA

Ideal for Senior SDET and FinTech QA roles.

---

## 17. Future Enhancements

* Support ISO 20022 XML
* Add contract versioning
* Failure explanation using LLM
* CI execution without Docker

---

**End of Blueprint**
