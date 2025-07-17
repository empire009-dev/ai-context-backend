import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map();
const RATE_LIMIT = 10; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function isRateLimited(ip) {
    const now = Date.now();
    const userRequests = rateLimitMap.get(ip) || [];
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (validRequests.length >= RATE_LIMIT) {
        return true;
    }
    
    // Add current request
    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);
    
    return false;
}

export default async function handler(req, res) {
    // Enable CORS for Chrome extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get client IP for rate limiting
        const clientIP = req.headers['x-forwarded-for'] || 
                        req.headers['x-real-ip'] || 
                        req.connection?.remoteAddress || 
                        'unknown';

        // Check rate limit
        if (isRateLimited(clientIP)) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded. Please try again later.' 
            });
        }

        const { text, context, model, maxTokens, temperature, systemPrompt } = req.body;

        // Validate input
        if (!text || text.trim() === '') {
            return res.status(400).json({ error: 'Text is required' });
        }

        if (text.length > 1000) {
            return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
        }

        // Create prompt based on context
        let prompt;
        if (context && context.trim() && context !== text) {
            // Limit context length
            const maxContextLength = 500;
            let truncatedContext = context;
            if (context.length > maxContextLength) {
                truncatedContext = context.substring(0, maxContextLength) + '...';
            }
            prompt = `Explain "${text}" in this context: "${truncatedContext}"\n\nFocus on the specific meaning of "${text}" here.`;
        } else {
            prompt = `Explain "${text}".`;
        }

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: model || 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt || 'Provide clear, concise explanations. Be educational and easy to understand. Keep responses focused and helpful.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: Math.min(maxTokens || 200, 400), // Cap at 400 tokens
            temperature: temperature || 0.3
        });

        res.json({
            explanation: completion.choices[0].message.content.trim(),
            usage: {
                prompt_tokens: completion.usage.prompt_tokens,
                completion_tokens: completion.usage.completion_tokens,
                total_tokens: completion.usage.total_tokens
            }
        });

    } catch (error) {
        console.error('API Error:', error);
        
        // Handle specific OpenAI errors
        if (error.code === 'insufficient_quota') {
            return res.status(503).json({ error: 'Service temporarily unavailable. Please try again later.' });
        }
        
        if (error.code === 'rate_limit_exceeded') {
            return res.status(429).json({ error: 'Service is busy. Please try again in a moment.' });
        }

        res.status(500).json({ error: 'Failed to get explanation. Please try again.' });
    }
}
