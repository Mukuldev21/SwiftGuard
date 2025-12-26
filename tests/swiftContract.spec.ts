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

});
