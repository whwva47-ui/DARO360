export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  try {
    const { prompt, image } = req.body;
    if (!prompt && !image) { res.status(400).json({ error: 'No prompt provided' }); return; }
    const messages = [];
    if (image) {
      messages.push({ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: image.type, data: image.data } },
        { type: 'text', text: prompt || 'Read this timetable and extract it into a structured JSON format.' }
      ]});
    } else {
      messages.push({ role: 'user', content: prompt });
    }
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages })
    });
    const data = await response.json();
    if (!response.ok) { res.status(response.status).json({ error: data.error?.message || 'API error' }); return; }
    const text = (data.content || []).map(b => b.text || '').join('');
    res.status(200).json({ text });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
