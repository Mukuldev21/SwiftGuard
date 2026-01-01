import { test, expect } from '@playwright/test';
import { generateValidMT103, generateInvalidMT103, generateSanctionedMT103 } from '../llm/swiftGenerator';

test.describe('Banking Compliance Tests (ISO 20022 & RBI)', () => {

    test('BTC001: Valid MT103 Acceptance (Compliance)', async ({ request }) => {
        test.setTimeout(45000); // Allow time for LLM generation

        console.log('BTC001: Compliance - Validating Standard MT103 Acceptance');

        // 1. Generate Compliant MT103 using LLM
        const validMessage = await generateValidMT103();

        // 2. Submit to Payment Gateway / API
        const response = await request.post('/swift', {
            data: validMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z' // Force business hours
            }
        });

        // 3. Verify Response Code (200 OK - Accepted)
        expect(response.ok(), 'API should accept valid MT103').toBeTruthy();

        const json = await response.json();

        // 4. Verify Compliance Status
        expect(json.valid).toBe(true);
        expect(json.status).toBe('success');

        // 5. Verify Essential Compliance Fields exist (Basic Sanity)
        expect(json.data.transactionReference).toBeTruthy();
        expect(json.data.valueDateCurrencyAmount).toBeTruthy();
    });

    test('BTC002: Mandatory Tag Missing (Compliance)', async ({ request }) => {
        test.setTimeout(45000);

        console.log('BTC002: Compliance - Validating Mandatory Tag Enforcements');

        // 1. Generate Invalid MT103 (Missing :23B: or :71A:)
        const invalidMessage = await generateInvalidMT103();
        console.log('Generated Invalid Message:\n', invalidMessage);

        // 2. Submit to API
        const response = await request.post('/swift', {
            data: invalidMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });

        // 3. Verify Response Code
        expect(response.ok()).toBeTruthy();

        const json = await response.json();

        // 4. Verify Failure Status
        expect(json.status).toBe('failed');
        expect(json.valid).toBe(false);

        // 5. Verify explicit schema violation errors
        expect(json.errors.length).toBeGreaterThan(0);
        // Flatten errors string to search for keywords
        const allErrors = JSON.stringify(json.errors);
        expect(allErrors).toMatch(/Missing mandatory tag|validation failed|schema violation|required property|must have required property/i);
    });

    test('BTC003: Duplicate Reference Check (Financial Integrity)', async ({ request }) => {
        test.setTimeout(45000);
        console.log('BTC003: Financial Integrity - Verifying Duplicate Reference Rejection');

        // 1. Generate Valid MT103
        const validMessage = await generateValidMT103();

        // 2. Submit First Time (Should Succeed)
        const response1 = await request.post('/swift', {
            data: validMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });
        expect(response1.ok()).toBeTruthy();

        // 3. Submit Second Time (Should Fail)
        const response2 = await request.post('/swift', {
            data: validMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });

        // 4. Verify Rejection
        const status = response2.status();
        expect([409, 400]).toContain(status);

        const json = await response2.json();
        expect(json.status).toBe('failed');
        expect(JSON.stringify(json.errors)).toMatch(/Duplicate|Reference already exists/i);
    });

    test('BTC004: AML Sanction Screen (High-Risk Country)', async ({ request }) => {
        test.setTimeout(45000);
        console.log('BTC004: AML - Verifying Sanctioned Country Blocking');

        // 1. Generate Sanctioned MT103
        const sanctionedMessage = await generateSanctionedMT103();
        console.log('Generated Sanctioned Message:\n', sanctionedMessage);

        // 2. Submit to API
        const response = await request.post('/swift', {
            data: sanctionedMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });

        // 3. Verify Rejection (403 Forbidden)
        const status = response.status();
        expect(status).toBe(403);

        const json = await response.json();
        expect(json.status).toBe('blocked');
        expect(json.valid).toBe(false);

        const allErrors = JSON.stringify(json.errors);
        expect(allErrors).toMatch(/AML Alert|Sanctioned|Blocked/i);
    });

    test('BTC005: Fraud Prevention - Replay Attack (Idempotency)', async ({ request }) => {
        test.setTimeout(45000);
        console.log('BTC005: Fraud - Verifying Replay Attack Rejection');

        // 1. Generate Valid MT103
        const validMessage = await generateValidMT103();

        // 2. Submit First Time (Success)
        const response1 = await request.post('/swift', {
            data: validMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });
        expect(response1.ok()).toBeTruthy();

        console.log('First submission successful. Attempting Replay Attack...');

        // 3. Submit SAME Message Immediately (Replay)
        const response2 = await request.post('/swift', {
            data: validMessage,
            headers: {
                'Content-Type': 'text/plain',
                'X-Simulated-Time': '2023-10-25T10:00:00Z'
            }
        });

        // 4. Verify Rejection
        const status = response2.status();
        expect([409, 400]).toContain(status); // Expect Conflict or Bad Request

        const json = await response2.json();
        expect(json.status).toBe('failed');
        expect(JSON.stringify(json.errors)).toMatch(/Duplicate|Reference already exists/i);
    });

});
