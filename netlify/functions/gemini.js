const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const systemPrompt = `You are DawaDost, a medical-focused health assistant. You should only respond to medical and health-related queries. For non-medical queries, say: "I am a medical assistant and can only provide information related to health, medicines, and medical conditions. Please ask me about medical topics." Do not diagnose, prescribe, or replace professional medical care. Encourage urgent medical help for emergencies.`;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers: { Allow: 'POST' }, body: JSON.stringify({ error: 'Method not allowed' }) };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not configured');
        return { statusCode: 500, body: JSON.stringify({ error: 'Chat service is not configured' }) };
    }

    let input;
    try { ({ input } = JSON.parse(event.body || '{}')); } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
    }
    if (typeof input !== 'string' || !input.trim() || input.length > 2000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Please provide a message under 2,000 characters' }) };
    }

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${input.trim()}\n\nAssistant:` }] }],
                generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
                safetySettings: [
                    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
                ]
            })
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Gemini request failed:', response.status, data?.error?.message);
            return { statusCode: response.status, body: JSON.stringify({ error: 'Chat service is temporarily unavailable' }) };
        }
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return { statusCode: 502, body: JSON.stringify({ error: 'Chat service returned an invalid response' }) };
        return { statusCode: 200, body: JSON.stringify({ text }) };
    } catch (error) {
        console.error('Gemini function error:', error);
        return { statusCode: 502, body: JSON.stringify({ error: 'Chat service is temporarily unavailable' }) };
    }
};
