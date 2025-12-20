require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
// We can also pass it explicitly if needed, but the SDK auto-detects it often.
// For safety with dotenv in CJS, we pass it.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "TEST_KEY" });

/**
 * Generates a SWIFT MT103 message using Gemini.
 * @param {boolean} valid - Whether to generate a valid or invalid message.
 * @returns {Promise<string>} - The generated SWIFT message.
 */
async function generateMT103(valid) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY found. Returning static stub data.");
        return generateStub(valid);
    }

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
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        let text = response.text;
        // Cleanup markdown if existing
        text = text.replace(/```swift/g, '').replace(/```/g, '').trim();
        return text;
    } catch (error) {
        console.error("Error generating content:", error);
        return generateStub(valid); // Fallback to stub on error
    }
}

// Keep stubs for fallback or testing without key
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
