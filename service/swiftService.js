const http = require('http');
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const { parseSwiftMessage } = require('../parser/swiftParser');
const schema = require('../contracts/mt103.schema.json');

const ajv = new Ajv();
const validate = ajv.compile(schema);

const PORT = 1934;
let lastProcessedMessage = null;

const server = http.createServer((req, res) => {
    // Enable CORS for local testing if needed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/swift') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                // Parse the raw SWIFT message
                const parsedData = parseSwiftMessage(body);

                // Validate against schema
                const valid = validate(parsedData);

                const response = {
                    status: valid ? 'success' : 'failed',
                    valid: valid,
                    errors: validate.errors,
                    data: parsedData,
                    raw: body
                };

                lastProcessedMessage = response;

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(response));
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: error.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/swift') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(lastProcessedMessage || { status: 'none', message: 'No message processed yet' }));
    } else if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        // Serve UI
        const uiPath = path.join(__dirname, '../ui/index.html');
        fs.readFile(uiPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('UI not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`SwiftGuard Service running on port ${PORT}`);
});
