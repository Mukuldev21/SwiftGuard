const { test, expect } = require('@playwright/test');
const { generateValidMT103, generateInvalidMT103 } = require('../llm/swiftGenerator');

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

});
