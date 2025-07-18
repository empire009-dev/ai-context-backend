# AI Context Dictionary Backend

Backend service for the AI Context Dictionary Chrome extension.

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variable: `OPENAI_API_KEY`
4. Deploy

## API Endpoint

`POST /api/explain`

### Request Body
```json
{
  "text": "word or phrase to explain",
  "context": "surrounding text context (optional)",
  "model": "gpt-3.5-turbo",
  "maxTokens": 200,
  "temperature": 0.3,
  "systemPrompt": "custom system prompt (optional)"
}
```

### Response
```json
{
  "explanation": "AI-generated explanation",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

## Rate Limiting

- 10 requests per minute per IP
- 1000 character limit on input text
- 400 token limit on responses
# Trigger redeploy
