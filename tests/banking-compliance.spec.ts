import { test, expect } from '@playwright/test';
import { generateValidMT103 } from '../llm/swiftGenerator';

test.describe('Banking Compliance Tests (ISO 20022 & RBI)', () => {

    test('BTC001: Valid MT103 Acceptance (Compliance)', async ({ request }) => {
        test.setTimeout(45000); // Allow time for LLM generation

        console.log('BTC001: Compliance - Validating Standard MT103 Acceptance');

        // 1. Generate Compliant MT103 using LLM
        const validMessage = await generateValidMT103();

        // 2. Submit to Payment Gateway / API
        const response = await request.post('/swift', {
            data: validMessage,
            headers: { 'Content-Type': 'text/plain' }
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

});
