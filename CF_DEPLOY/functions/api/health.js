const USERS_DB_URL = "https://script.google.com/macros/s/AKfycbzQ93QTkghk29y4qPzD4kMAR4TODai1yltMSkEwBlRFH9aDakvtnHRcNoz6Ejw75uSGjw/exec";
const OBJ_API_URL  = "https://script.google.com/macros/s/AKfycbyVD5zhbzY09kMu3KLd3nEU9tcgymmoyALWn_pTyGPAAO1XfpXwd6F6dQKBqZIIsFOd/exec";
const RESEND_URL   = "https://api.resend.com/emails";
const ADMIN_EMAIL  = "ziju60plus@gmail.com";
const TIMEOUT_MS   = 8000;

async function ping(name, url) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    const ms = Date.now() - start;
    return { name, ok: res.ok, status: res.status, ms };
  } catch (e) {
    return { name, ok: false, status: 0, ms: Date.now() - start, error: e.message };
  }
}

async function pingAI(apiKey) {
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'OK?' }],
      }),
      signal: ctrl.signal,
    });
    const ms = Date.now() - start;
    return { name: 'Claude AI API', ok: res.ok, status: res.status, ms };
  } catch (e) {
    return { name: 'Claude AI API', ok: false, status: 0, ms: Date.now() - start, error: e.message };
  }
}

async function sendAlert(results, env) {
  if (!env.RESEND_API_KEY) return;
  const failed = results.filter(r => !r.ok);
  const rows = results.map(r =>
    `<tr style="background:${r.ok?'#f0fbf2':'#fff0f0'}">
      <td style="padding:8px 12px">${r.name}</td>
      <td style="padding:8px 12px">${r.ok ? '✅ OK' : '❌ CHYBA'}</td>
      <td style="padding:8px 12px">${r.ms} ms</td>
      <td style="padding:8px 12px">${r.error || r.status || ''}</td>
    </tr>`
  ).join('');

  await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'monitoring@ziju60plus.cz',
      to: ADMIN_EMAIL,
      subject: failed.length > 0 ? `🚨 Žiju60plus – ${failed.length} služba/y nefunguje (${new Date().toLocaleString('cs-CZ')})` : `✅ Žiju60plus – monitoring report (${new Date().toLocaleString('cs-CZ')})`,
      html: `
        <h2 style="color:${failed.length > 0 ? '#c00' : '#2a7a2a'}">${failed.length > 0 ? '⚠️ Monitoring Žiju60plus – problém detekován' : '✅ Monitoring Žiju60plus – vše funguje'}</h2>
        <p>Čas kontroly: <strong>${new Date().toLocaleString('cs-CZ')}</strong></p>
        <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
          <tr style="background:#eee">
            <th style="padding:8px 12px;text-align:left">Služba</th>
            <th style="padding:8px 12px;text-align:left">Stav</th>
            <th style="padding:8px 12px;text-align:left">Doba odezvy</th>
            <th style="padding:8px 12px;text-align:left">Detail</th>
          </tr>
          ${rows}
        </table>
        <p style="color:#888;font-size:12px;margin-top:20px">
          Automatický monitoring Žiju60plus · <a href="https://ziju60plus.cz/api/health">Zkontrolovat ručně</a>
        </p>`,
    }),
  });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const sendEmail = url.searchParams.get('alert') === '1';

  // Paralelně otestuj všechny služby
  const results = await Promise.all([
    ping('UsersDB GAS',    `${USERS_DB_URL}?action=ping`),
    ping('Objevovna GAS',  `${OBJ_API_URL}?maxDay=0`),
    ping('Žiju60plus web', 'https://ziju60plus.cz/result'),
    pingAI(env.ANTHROPIC_API_KEY),
  ]);

  const allOk = results.every(r => r.ok);

  // Pošli email pokud je problém (nebo manuálně ?alert=1)
  if ((!allOk || sendEmail) && env.RESEND_API_KEY) {
    await sendAlert(results, env).catch(() => {});
  }

  return new Response(JSON.stringify({
    ok: allOk,
    checked_at: new Date().toISOString(),
    results,
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
}
