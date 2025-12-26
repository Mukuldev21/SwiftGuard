require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy_key_for_init",
});
console.log("Groq Config: Key Present?", !!process.env.GROQ_API_KEY);

/**
 * Generates a SWIFT MT103 message using Groq AI.
 * @param {boolean} valid - Whether to generate a valid or invalid message.
 * @returns {Promise<string>} - The generated SWIFT message.
 */
async function generateMT103(valid) {
    if (!process.env.GROQ_API_KEY) {
        console.warn("No GROQ_API_KEY found. Returning static stub data.");
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
        // Using non-streaming mode for simplicity as we need the full string to return.
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            model: "openai/gpt-oss-120b", // User provided model name
            temperature: 1,
            max_completion_tokens: 8192,
            top_p: 1,
            stream: false,
            stop: null
        });

        let text = chatCompletion.choices[0]?.message?.content || "";

        // Cleanup markdown
        text = text.replace(/```swift/g, '').replace(/```/g, '').trim();
        return text;

    } catch (error) {
        console.error("Error generating content with Groq:", error.message);
        return generateStub(valid);
    }
}

// Keep stubs for fallback
function generateStub(valid) {
    if (valid) {
        return `
:20:REF_GROQ_${Date.now()}
:23B:CRED
:32A:240101USD1000,
:50K:Groq User
Fast Lane
:59:Beneficiary
Speed St
:71A:OUR
`.trim();
    } else {
        return `
:20:INV_GROQ_${Date.now()}
:32A:240101USD500,
:50K:Invalid User
`.trim();
    }
}

const generateValidMT103 = async () => generateMT103(true);
const generateInvalidMT103 = async () => generateMT103(false);

module.exports = { generateValidMT103, generateInvalidMT103 };
