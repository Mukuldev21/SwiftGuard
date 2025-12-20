/**
 * Parses a SWIFT MT103 message string into a JSON object.
 * 
 * Mapping:
 * :20: -> transactionReference
 * :23B: -> bankOperationCode
 * :32A: -> valueDateCurrencyAmount
 * :50K: -> orderingCustomer
 * :59: -> beneficiaryCustomer
 * :71A: -> charges
 * 
 * @param {string} message - The raw SWIFT message string.
 * @returns {object} - The parsed JSON object.
 */
function parseSwiftMessage(message) {
    const lines = message.split(/\r?\n/);
    const result = {};

    const tagMapping = {
        ':20:': 'transactionReference',
        ':23B:': 'bankOperationCode',
        ':32A:': 'valueDateCurrencyAmount',
        ':50K:': 'orderingCustomer',
        ':59:': 'beneficiaryCustomer',
        ':71A:': 'charges'
    };

    let currentTag = null;

    lines.forEach(rawLine => {
        const line = rawLine.trim();
        // Check if line starts with a tag
        const tagMatch = line.match(/^:\w+:/);
        if (tagMatch) {
            const tag = tagMatch[0];
            if (tagMapping[tag]) {
                const value = line.substring(tag.length).trim();
                result[tagMapping[tag]] = value;
                currentTag = tagMapping[tag];
            } else {
                currentTag = null; // Unknown tag
            }
        } else if (currentTag && result[currentTag]) {
            // Handle multiline values (append to previous tag)
            // For simplicity in this blueprint, we might validly just append with newline
            // But for fields like 50K or 59, it's often address lines.
            // We'll just join them with space or keep newline.
            result[currentTag] += '\n' + line.trim();
        }
    });

    return result;
}

module.exports = { parseSwiftMessage };
