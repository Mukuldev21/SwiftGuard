require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "TEST_KEY" });

/**
 * Generates a SWIFT MT103 message using Gemini.
 * @param {string} type - 'valid', 'invalid', or 'sanctioned'.
 * @returns {Promise<string>} - The generated SWIFT message.
 */
async function generateMT103(type) {
    if (!process.env.GEMINI_API_KEY) {
        console.warn("No GEMINI_API_KEY found. Returning static stub data.");
        return generateStub(type);
    }

    let prompt = "";
    if (type === 'valid') {
        prompt = `Generate a valid SWIFT MT103 message. It MUST contain strict SWIFT tags.
Mandatory tags: :20:, :23B:, :32A:, :50K:, :59:, :71A:.
Output ONLY the message content, no markdown, no explanations.`;
    } else if (type === 'invalid') {
        prompt = "Generate an INVALID SWIFT MT103 message. Miss the mandatory tag :23B: and :71A:. Output ONLY the message content, no markdown.";
    } else if (type === 'sanctioned') {
        prompt = `Generate a valid SWIFT MT103 message BUT include a SANCTIONED COUNTRY.
The Beneficiary (:59:) or Ordering Customer (:50K:) address MUST contain 'North Korea' or country code 'KP', or 'Iran' / 'IR'.
Output ONLY the message content, no markdown.`;
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
            });

            let text = response.text;
            // Cleanup markdown
            text = text.replace(/```swift/g, '').replace(/```/g, '').trim();
            return text;

        } catch (error) {
            // Check for Rate Limit (429) or Service Unavailable (503)
            if ((error.status === 429 || error.status === 503) && attempts < maxAttempts - 1) {
                console.warn(`Attempt ${attempts + 1} failed with ${error.status}. Retrying in 2 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (attempts + 1)));
                attempts++;
            } else {
                console.error("Error generating content with Gemini:", error.message);
                return generateStub(type);
            }
        }
    }
}

// Keep stubs for fallback
function generateStub(type) {
    if (type === 'valid') {
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
    } else if (type === 'sanctioned') {
        return `
:20:SANC_STUB_${Date.now()}
:23B:CRED
:32A:231220USD1000,
:50K:Kim Jong Un
Pyongyang, KP
:59:Beneficiary in Iran
Tehran, IR
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

const generateValidMT103 = async () => generateMT103('valid');
const generateInvalidMT103 = async () => generateMT103('invalid');
const generateSanctionedMT103 = async () => generateMT103('sanctioned');

module.exports = { generateValidMT103, generateInvalidMT103, generateSanctionedMT103 };
