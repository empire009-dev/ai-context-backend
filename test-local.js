// Simple test script to verify the API works locally
const handler = require('./api/explain.js').default;

// Mock request and response objects
const mockReq = {
    method: 'POST',
    body: {
        text: 'photosynthesis',
        context: 'Plants use photosynthesis to convert sunlight into energy.',
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.3,
        systemPrompt: 'Provide clear, concise explanations.'
    },
    headers: {
        'x-forwarded-for': '127.0.0.1'
    }
};

const mockRes = {
    setHeader: (key, value) => console.log(`Header: ${key} = ${value}`),
    status: (code) => ({ 
        json: (data) => console.log(`Status: ${code}`, data),
        end: () => console.log(`Status: ${code} - Request ended`)
    }),
    json: (data) => console.log('Response:', data)
};

// Test the handler
console.log('Testing API endpoint...');
handler(mockReq, mockRes).catch(console.error);
