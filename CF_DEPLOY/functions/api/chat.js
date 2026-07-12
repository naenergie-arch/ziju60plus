const USERS_DB_URL = "https://script.google.com/macros/s/AKfycbzQ93QTkghk29y4qPzD4kMAR4TODai1yltMSkEwBlRFH9aDakvtnHRcNoz6Ejw75uSGjw/exec";

async function loadHistory(token) {
  try {
    const url = `${USERS_DB_URL}?action=load_chat&token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.ok ? data.history : [];
  } catch { return []; }
}

async function saveMessage(token, role, zprava, den_trial) {
  try {
    await fetch(USERS_DB_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_chat', token, role, zprava, den_trial }),
    });
  } catch { /* neselhej kvůli ukládání */ }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); }
  catch (_) {
    return new Response(JSON.stringify({ error: 'Neplatný požadavek.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { token, zprava, jmeno, pohlavi, den_trial = 0, tykani } = body;

  if (!token || !zprava) {
    return new Response(JSON.stringify({ error: 'Chybí token nebo zpráva.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Načti historii
  const history = await loadHistory(token);
  const isFirstMessage = history.length === 0;

  const jeZena = pohlavi === 'zena';
  const osloveni = jmeno || (jeZena ? 'milá čtenářko' : 'milý čtenáři');

  // Sestavení kontextu z historie (max posledních 20 zpráv pro kontext)
  const recentHistory = history.slice(-20);
  const historieShrnutí = recentHistory.length > 0
    ? recentHistory.map(m => `${m.role === 'user' ? 'Uživatel' : 'Průvodce'}: ${m.zprava}`).join('\n')
    : '';

  // Systémový prompt
  const systemPrompt = `Jsi AI průvodce programu Žiju60plus – přátelský, moudrý a empatický asistent specializující se na vitalitu, zdraví a aktivní život lidí ve věku 60+.

TVOJE IDENTITA:
- Jmenuješ se Průvodce Žiju60plus
- Jsi trpělivý, laskavý a nikdy nesoudíš
- Mluvíš česky, přirozeně a srozumitelně

UŽIVATEL:
- Jméno: ${jmeno || 'neznámé'}
- Pohlaví: ${jeZena ? 'žena' : 'muž'}
- Den programu: ${den_trial}
${tykani === 'ty' ? `- TYKÁNÍ: uživatel si přeje tykání – vždy tykej (ty, tě, tvůj...)` : tykani === 'vy' ? `- VYKÁNÍ: uživatel si přeje vykání – vždy vykej (Vy, Vás, Váš...)` : `- Oslovení ještě nebylo domluveno – viz instrukce pro první zprávu`}

TVŮJ OKRUH TÉMAT (odpovídáš POUZE na tato témata):
✅ Fyzická vitalita: pohyb, procházky, cvičení pro seniory, protahování
✅ Duševní pohoda: nálada, stres, motivace, pozitivní myšlení
✅ Mozek a paměť: trénink paměti, učení, digitální dovednosti
✅ Sociální život: kontakty, rodina, přátelství, osamělost
✅ Spánek a regenerace: spánkové návyky, odpočinek
✅ Výživa pro seniory: jídlo, pitný režim, základní výživa
✅ Záliby a kreativita: koníčky, tvorba, kultura
✅ Program Žiju60plus: obsah Objevovny, doporučení, aktivity v programu

❌ NIKDY: lékařská diagnóza, doporučení léků, konkrétní zdravotní diagnózy, politika, finance

DŮLEŽITÉ OMEZENÍ:
- Nejsi lékař – při zdravotních potížích vždy doporuč navštívit lékaře
- Neznáš zdravotní historii uživatele, pracuješ jen s tím, co ti řekne
- Odpovědi piš stručně a jasně (max 3-4 věty, pokud není potřeba delší)

${isFirstMessage ? `PRVNÍ ZPRÁVA – UVÍTÁNÍ:
Uživatel právě otevřel chat poprvé. Představ se krátce a přátelsky. Řekni:
1. Jak se jmenuješ a co umíš (2 věty)
2. Na co se lze ptát a na co ne (1 věta)
3. Zeptej se: "Preferuješ, abychom si tykali nebo vykali?" – formuluj přirozeně
Tón: vřelý, přívětivý, ne formální. Délka: max 5 vět.` : ''}

PAMĚŤ KONVERZACE:
${historieShrnutí ? `Dosavadní rozhovor:\n${historieShrnutí}` : 'Zatím žádná historie.'}

Odpovídej POUZE na poslední zprávu uživatele, s ohledem na celý dosavadní kontext.`;

  // Sestavení messages pro Claude
  const messages = [{ role: 'user', content: zprava }];

  try {
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Chyba AI služby.');

    const odpoved = aiData.content?.[0]?.text || '';

    // Ulož obě zprávy do GAS (asynchronně, neblokuje odpověď)
    await Promise.all([
      saveMessage(token, 'user', zprava, den_trial),
      saveMessage(token, 'assistant', odpoved, den_trial),
    ]);

    return new Response(JSON.stringify({ ok: true, odpoved, isFirstMessage }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
