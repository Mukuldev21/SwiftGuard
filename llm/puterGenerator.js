const puter = require('puter');

/**
 * Generates a SWIFT MT103 message using Puter.ai.
 * @param {boolean} valid - Whether to generate a valid or invalid message.
 * @returns {Promise<string>} - The generated SWIFT message.
 */
async function generateMT103(valid) {
    const prompt = valid
        ? `Generate a valid SWIFT MT103 message. It MUST contain strict SWIFT tags.
Mandatory tags: :20:, :23B:, :32A:, :50K:, :59:, :71A:.
Output ONLY the message content, no markdown, no explanations.
Example format:
:20:REF12345
:23B:CRED
:32A:230101USD1000,
:50K:ORDERING CUST
ADDRESS LINE
:59:BENEFICIARY
ADDRESS LINE
:71A:OUR`
        : "Generate an INVALID SWIFT MT103 message. Miss the mandatory tag :23B: and :71A:. Output ONLY the message content, no markdown.";

    try {
        let response;

        // ---------------------------------------------------------
        // LOCAL ENVIRONMENT COMPATIBILITY FIX
        // The 'puter' npm package is primarily for the Puter.com OS environment using `window.puter`.
        // In a local Node.js environment, `require('puter')` might not expose the full `ai` API.
        // To allow development/testing logic to proceed as requested, we check if `puter.ai` exists.
        // If not, we simulate a successful API call (Mocking) or throw a descriptive error.
        // ---------------------------------------------------------

        if (puter && puter.ai && puter.ai.chat) {
            response = await puter.ai.chat(prompt, { model: "gpt-5.2" });
            console.log("DEBUG: Puter Response:\n", JSON.stringify(response, null, 2));
        } else {
            console.warn("WARNING: `puter.ai` is not available in this environment. Using MOCK response for testing logic flow.");

            // Simulating a valid or invalid response based on the 'valid' param
            if (valid) {
                response = `
:20:REF_PUTER_${Date.now()}
:23B:CRED
:32A:240101USD1000,
:50K:Puter AI User
Cloud OS Address
:59:Beneficiary
Puter Street
:71A:OUR`;
            } else {
                response = "INVALID MESSAGE :20:REF123";
            }
        }

        // Handle Puter response format
        let text = typeof response === 'string' ? response : (response.message || JSON.stringify(response));

        // Cleanup markdown
        text = text.replace(/```swift/g, '').replace(/```/g, '').trim();
        return text;

    } catch (error) {
        console.error("Error generating content with Puter:", error);
        return generateStub(valid);
    }
}

// Keep stubs for fallback
function generateStub(valid) {
    if (valid) {
        return `
:20:REF_STUB_${Date.now()}
:23B:CRED
:32A:231220USD1000,
:50K:Stub User
123 Stub Lane
:59:Stub Beneficiary
456 Stub St
:71A:OUR
`.trim();
    } else {
        return `
:20:INV_STUB_${Date.now()}
:32A:231220USD500,
:50K:Invalid User
`.trim();
    }
}

const generateValidMT103 = async () => generateMT103(true);
const generateInvalidMT103 = async () => generateMT103(false);

module.exports = { generateValidMT103, generateInvalidMT103 };
