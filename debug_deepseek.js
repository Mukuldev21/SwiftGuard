require('dotenv').config();
const OpenAI = require("openai");

console.log("Reading Env...");
const key = process.env.DEEPSEEK_API_KEY;
console.log("Key available:", !!key);
if (key) console.log("Key length:", key.length, "Key start:", key.substring(0, 5));

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: key,
});

async function main() {
    try {
        console.log("Sending request...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }],
            model: "deepseek-chat",
        });
        console.log("Response:", completion.choices[0].message.content);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
