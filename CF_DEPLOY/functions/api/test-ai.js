export async function onRequestGet(context) {
  const { env } = context;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Řekni jen: OK' }],
      }),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ status: res.status, key_prefix: (env.ANTHROPIC_API_KEY||'').substring(0,12), data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
