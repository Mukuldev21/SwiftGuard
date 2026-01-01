/**
 * LLM Provider Switcher
 * Uncomment the provider you wish to use.
 */

const generator = require('./geminiGenerator'); // Option 1: Google Gemini
// const generator = require('./puterGenerator');  // Option 2: Puter.ai
// const generator = require('./deepseekGenerator'); // Option 3: DeepSeek
//const generator = require('./groqGenerator'); // Option 4: Groq AI (Active)

module.exports = {
    generateValidMT103: generator.generateValidMT103,
    generateInvalidMT103: generator.generateInvalidMT103,
    generateSanctionedMT103: generator.generateSanctionedMT103
};
