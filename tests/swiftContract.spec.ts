import { test, expect } from '@playwright/test';
import { generateValidMT103, generateInvalidMT103 } from '../llm/swiftGenerator';

test.describe('SwiftGuard Contract Tests', () => {

    test('TC001: Validate Valid MT103 Contract (API + UI)', async ({ request, page }) => {
        test.setTimeout(30000); // Increase timeout for LLM
        // 1. Generate Valid SWIFT Message (Simulating LLM)
        const validMessage = await generateValidMT103();
        console.log('Generated Valid Message:\n', validMessage);

        // 2. Submit to API
        const response = await request.post('/swift', {
            data: validMessage,
            headers: { 'Content-Type': 'text/plain' }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();

        // 3. Verify API Contract Response
        expect(json.status).toBe('success');
        expect(json.valid).toBe(true);
        // Note: Transaction Ref might vary now, so we just check existence
        expect(json.data.transactionReference).toBeTruthy();
        expect(json.data.bankOperationCode).toBeTruthy();

        // 4. Verify UI Rendering
        await page.goto('/');

        // Wait for data to appear
        await expect(page.locator('#status-badge')).toHaveText('Contract Valid', { timeout: 10000 });
        await expect(page.locator('#status-badge')).toHaveClass(/status-success/);

        // Verify Fields in UI
        await expect(page.locator('#tx-ref')).not.toBeEmpty();
        await expect(page.locator('#op-code')).not.toBeEmpty();
    });

    test('TC003: Validate Parser Resilience (API + UI)', async ({ request, page }) => {
        test.setTimeout(30000);
        // 1. Generate Valid SWIFT Message
        let baseMessage = await generateValidMT103();

        // 2. Wrap it in a SWIFT Envelope and add random whitespace
        // Ensure newlines are explicit to strictly separate blocks
        const envelopedMessage =
            "{1:F01BANKBEBBAXXX0000000000}\n" +
            "{2:I103BANKBEBBAXXXN}\n" +
            "{4:\n" +
            baseMessage + "\n" +
            "-}\n" +
            "{5:{CHK:1234567890AB}}";

        console.log('Generated Enveloped Message:\n', envelopedMessage);

        // 3. Submit to API
        const response = await request.post('/swift', {
            data: envelopedMessage,
            headers: { 'Content-Type': 'text/plain' }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();

        // 4. Verify API Accepts it (Parser should have stripped envelopes)
        expect(json.status).toBe('success');
        expect(json.valid).toBe(true);
        expect(json.data.transactionReference).toBeTruthy();

        // 5. Verify UI
        await page.goto('/');
        await expect(page.locator('#status-badge')).toHaveText('Contract Valid', { timeout: 10000 });
        // Ensure parsing worked and we see data, not garbage
        await expect(page.locator('#tx-ref')).not.toBeEmpty();
    });

    test('TC002: Validate Invalid MT103 Contract (Schema Enforcement)', async ({ request, page }) => {
        test.setTimeout(30000); // Increase timeout for LLM
        // 1. Generate Invalid SWIFT Message
        const invalidMessage = await generateInvalidMT103();
        console.log('Generated Invalid Message:\n', invalidMessage);

        // 2. Submit to API
        const response = await request.post('/swift', {
            data: invalidMessage,
            headers: { 'Content-Type': 'text/plain' }
        });

        expect(response.ok()).toBeTruthy();
        const json = await response.json();

        // 3. Verify API Rejection
        expect(json.status).toBe('failed');
        expect(json.valid).toBe(false);
        expect(json.errors.length).toBeGreaterThan(0);

        // 4. Verify UI Error Handling
        await page.goto('/');

        await expect(page.locator('#status-badge')).toHaveText('Contract Broken', { timeout: 10000 });
        await expect(page.locator('#status-badge')).toHaveClass(/status-failed/);

        await expect(page.locator('#error-section')).toBeVisible();
        await expect(page.locator('#error-list li')).toBeVisible();
    });

    test('TC004: Validate UI Dashboard Sync (API + UI)', async ({ request, page }) => {
        test.setTimeout(45000); // Higher timeout for polling + LLM

        // 1. Open Dashboard (Pre-condition)
        // Note: It might show previous test data, which is fine. We verify it UPDATES.
        await page.goto('/');

        // 2. Generate a NEW Valid SWIFT Message
        const validMessage = await generateValidMT103();

        // 3. Submit to API via backend (simulating external system)
        const response = await request.post('/swift', {
            data: validMessage,
            headers: { 'Content-Type': 'text/plain' }
        });
        expect(response.ok()).toBeTruthy();
        const json = await response.json();

        // Capture the expected values from the API response
        const expectedRef = json.data.transactionReference;
        const expectedAmount = json.data.valueDateCurrencyAmount;

        console.log(`TC004: Sent message with Ref ${expectedRef}. Waiting for UI sync...`);

        // 4. Verify UI Auto-Sync (Polling Verification)
        // The UI should pick this up automatically within ~2 seconds (poll interval is 2s)

        // Check Status Badge
        await expect(page.locator('#status-badge')).toHaveText('Contract Valid', { timeout: 15000 });
        await expect(page.locator('#status-badge')).toHaveClass(/status-success/);

        // Check Specific Data Fields match the NEW message
        await expect(page.locator('#tx-ref')).toHaveText(expectedRef);
        await expect(page.locator('#amount')).toHaveText(expectedAmount);

        // Check Raw Data
        // The raw message in UI should contain the unique Reference
        await expect(page.locator('#raw-message')).toContainText(expectedRef);
    });

    test('TC005: Validate LLM Fallback (API + UI)', async ({ request, page }) => {
        // 1. Simulate LLM Outage by unsetting API KEY
        const originalKey = process.env.GEMINI_API_KEY;
        delete process.env.GEMINI_API_KEY;

        console.log('TC005: Simulating LLM outage...');

        try {
            // 2. Attempt to Generate Token (Should use fallback)
            const fallbackMessage = await generateValidMT103();

            // 3. Verify it is a Stub
            expect(fallbackMessage).toContain('REF_STUB');
            console.log('TC005: Fallback engaged. Generated:\n', fallbackMessage);

            // 4. Submit Stub Verification
            // The system should still accept valid stubs as regular traffic
            const response = await request.post('/swift', {
                data: fallbackMessage,
                headers: { 'Content-Type': 'text/plain' }
            });

            expect(response.ok()).toBeTruthy();
            const json = await response.json();

            expect(json.status).toBe('success');
            expect(json.valid).toBe(true);
            expect(json.data.transactionReference).toContain('REF_STUB');

            // 5. Verify UI
            await page.goto('/');
            await expect(page.locator('#status-badge')).toHaveText('Contract Valid', { timeout: 10000 });
            await expect(page.locator('#tx-ref')).toContainText('REF_STUB');

        } finally {
            // Restore Key for other tests
            process.env.GEMINI_API_KEY = originalKey;
        }
    });

    test('TC006: Validate Field Validation Rules', async ({ request }) => {
        // 1. Generate Valid Message base
        const validMessage = await generateValidMT103();

        // 2. Corrupt the :32A: field
        // Valid: :32A:231220USD1000,
        // Invalid: :32A:INVALID_DATE_USD
        const invalidFieldMessage = validMessage.replace(/:32A:[^\n]+/, ':32A:INVALID_DATE_USD');

        console.log('TC006: Sending message with invalid :32A: pattern:\n', invalidFieldMessage);

        // 3. Submit
        const response = await request.post('/swift', {
            data: invalidFieldMessage,
            headers: { 'Content-Type': 'text/plain' }
        });

        const json = await response.json();

        // 4. Verify Rejection
        expect(response.ok()).toBeTruthy(); // Http 200 is fine as long as logic says invalid (or 400 if strictly designed, but current logic returns 200 with valid:false)
        expect(json.valid).toBe(false);
        expect(json.status).toBe('failed');

        // 5. Verify the error points to the specific field
        // AJV errors usually contain instancePath pointing to the property
        const hasFieldMismatch = json.errors.some(e => e.instancePath === '/valueDateCurrencyAmount' || e.params.pattern);
        expect(hasFieldMismatch).toBeTruthy();
    });

    test('TC007: Validate Optional Tags Parsing', async ({ request }) => {
        // 1. Generate Valid Base
        const validMessage = await generateValidMT103();

        // 2. Append Optional Tag :70:
        const messageWithOptional = validMessage + '\n:70:INV-2023-001 REMITTANCE INFO';

        console.log('TC007: Sending message with optional :70: tag...');

        // 3. Submit
        const response = await request.post('/swift', {
            data: messageWithOptional,
            headers: { 'Content-Type': 'text/plain' }
        });

        const json = await response.json();

        // 4. Verify Success & Parsing
        expect(response.ok()).toBeTruthy();
        expect(json.valid).toBe(true);
        expect(json.data.remittanceInfo).toBe('INV-2023-001 REMITTANCE INFO');
    });

    test('TC008: Validate Garbage Input Resilience', async ({ request }) => {
        const garbageInputs = [
            "Just some random text",
            "<?xml version='1.0'?><note>Invalid SWIFT</note>",
            JSON.stringify({ key: "value " })
        ];

        for (const input of garbageInputs) {
            console.log(`TC008: Testing garbage input: ${input.substring(0, 20)}...`);

            const response = await request.post('/swift', {
                data: input,
                headers: { 'Content-Type': 'text/plain' }
            });

            // Should NOT crash (500)
            expect(response.status()).not.toBe(500);

            // Should be rejected (200 OK with valid:false OR 400 Bad Request)
            // Based on current implementation, it likely returns 200 with valid: false because parser returns empty/partial obj and schema rejects it.
            const json = await response.json();
            expect(json.valid).toBe(false);
        }
    });

});
