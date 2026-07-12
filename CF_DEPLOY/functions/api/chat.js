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
  } catch {}
}

// Detekce tykání/vykání z textu uživatele
function detectTykani(text) {
  const t = text.toLowerCase();
  if (/(tykej|tykáme|tykat|tykání|tyká|říkejme si ty|buďme na ty|klidně tykej|tykejte nám|tykej mi)/i.test(t)) return 'ty';
  if (/(vykej|vykáme|vykat|vykání|vyká|říkejme si vy|buďme na vy|vykejte|vykej mi)/i.test(t)) return 'vy';
  return null;
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

  const {
    token, zprava, jmeno, pohlavi,
    den_trial = 0, tykani,
    ai_summary = '',
    obj_koment = null,
    profil = null,
  } = body;

  if (!token || !zprava) {
    return new Response(JSON.stringify({ error: 'Chybí token nebo zpráva.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const isInit    = zprava === '__init__';
  const isKoment  = zprava === '__koment__';
  const jeZena    = pohlavi === 'zena';

  // Načti historii
  const history = await loadHistory(token);
  const isFirstMessage = history.length === 0;
  const totalMessages  = history.filter(m => m.role === 'user').length;

  // Detekuj tykání z textu uživatele
  const detectedTykani = detectTykani(zprava);
  const activeTykani   = detectedTykani || tykani || null;

  // Kontext z historie (posledních 8 zpráv nebo summary)
  const recentHistory = history.filter(m => m.role !== 'summary').slice(-8);
  const historieShrnutí = recentHistory.length > 0
    ? recentHistory.map(m => `${m.role === 'user' ? 'Uživatel' : 'Průvodce'}: ${m.zprava}`).join('\n')
    : '';

  const tykaniInstr = activeTykani === 'ty'
    ? 'TYKÁNÍ: uživatel si přeje tykání – vždy tykej (ty, tě, tvůj...).'
    : activeTykani === 'vy'
    ? 'VYKÁNÍ: uživatel si přeje vykání – vždy vykej (Vy, Vás, Váš...).'
    : 'Oslovení nebylo ještě domluveno – viz instrukce pro první zprávu.';

  // Kontext osobního profilu
  const profilBlok = profil ? `
OSOBNÍ PROFIL UŽIVATELE (vygenerován AI při registraci):
- Jméno: ${profil.jmeno || jmeno}
- Pohlaví: ${profil.pohlavi === 'zena' ? 'žena' : 'muž'}
- Skutečný věk: ${profil.vek_skutecny || '?'} let
- Biologický věk: ${profil.bio_vek || '?'} let
- Skóre vitality: ${profil.skore_vitality || '?'}/100
- Osobní postřeh: ${profil.postreh || ''}
- Silná stránka: ${profil.silna_stranka || ''}
- Největší příležitost: ${profil.prilezitost || ''}
- Téma tohoto týdne: ${profil.tydenni_tema || ''}
- 7 doporučení na tento týden:
${(profil.doporuceni || []).map((d,i) => `  ${i+1}. ${d}`).join('\n')}
` : '';


  let systemPrompt;

  if (isKoment && obj_koment) {
    // Denní komentář k Objevovně
    systemPrompt = `Jsi AI průvodce programu Žiju60plus.
Uživatel: ${jmeno || 'uživatel'}, ${jeZena ? 'žena' : 'muž'}, den programu ${den_trial}.
${tykaniInstr}

Napiš KRÁTKÝ, osobní komentář (max 3 věty) k dnešnímu obsahu Objevovny:
Název: "${obj_koment.nazev}"
Kategorie: ${obj_koment.kategorie || ''}
Popis: ${obj_koment.popis || ''}

Komentář má být povzbuzující, konkrétní a propojit obsah s každodenním životem uživatele 60+.
Nezačínej slovem "Komentář" ani nepřepisuj název. Jen přirozená věta nebo dvě.`;
  } else {
    // Standardní chat
    systemPrompt = `Jsi AI průvodce programu Žiju60plus – přátelský, moudrý a empatický asistent specializující se na vitalitu, zdraví a aktivní život lidí ve věku 60+.

TVOJE IDENTITA:
- Jmenuješ se Průvodce Žiju60plus
- Jsi trpělivý, laskavý a nikdy nesoudíš
- Mluvíš česky, přirozeně a srozumitelně

UŽIVATEL:
- Jméno: ${profil?.jmeno || jmeno || 'neznámé'}
- Pohlaví: ${jeZena ? 'žena' : 'muž'}
- Den programu: ${den_trial}
- ${tykaniInstr}
${profilBlok}${ai_summary ? `\nDOPLŇKOVÉ POZNATKY Z KONVERZACE:\n${ai_summary}` : ''}

OKRUH TÉMAT:
✅ Pohyb a vitalita, duševní pohoda, mozek a paměť, sociální život, spánek, výživa, záliby, program Žiju60plus
❌ Lékařská diagnóza, léky, politika, finance

OMEZENÍ: Nejsi lékař – při zdravotních potížích vždy doporuč navštívit lékaře.
Odpovědi max 3–4 věty. Výjimka pokud uživatel potřebuje delší vysvětlení.

${isFirstMessage || isInit ? `PRVNÍ KONTAKT – UVÍTÁNÍ:
Představ se krátce a přátelsky (2 věty). Řekni na co se lze ptát (1 věta). Zeptej se přirozeně: preferuje uživatel tykání nebo vykání? Max 5 vět celkem.` : ''}

DOSAVADNÍ KONTEXT:
${historieShrnutí || 'Zatím žádná historie.'}`;
  }

  const userMsg = isInit ? 'Ahoj, právě jsem otevřel/a chat.' : (isKoment ? 'Napiš krátký komentář.' : zprava);

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
        max_tokens: isKoment ? 200 : 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Chyba AI služby.');
    const odpoved = aiData.content?.[0]?.text || '';

    // Ulož zprávy (ne pro komentář k Objevovně)
    let newSummary = null;
    if (!isKoment) {
      await Promise.all([
        saveMessage(token, 'user', isInit ? '[uvítání]' : zprava, den_trial),
        saveMessage(token, 'assistant', odpoved, den_trial),
      ]);

      // Každých 10 zpráv vygeneruj shrnutí
      if ((totalMessages + 1) % 10 === 0) {
        try {
          const summaryRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 250,
              system: 'Jsi asistent který vytváří stručná shrnutí konverzace.',
              messages: [{
                role: 'user',
                content: `Z této konverzace vytvoř shrnutí max 150 slov – co víme o uživateli, jeho zájmech, problémech a preferencích:\n\n${historieShrnutí}\nPrůvodce: ${odpoved}`
              }],
            }),
          });
          const sd = await summaryRes.json();
          newSummary = sd.content?.[0]?.text || null;
          if (newSummary) await saveMessage(token, 'summary', newSummary, den_trial);
        } catch {}
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      odpoved,
      isFirstMessage,
      detectedTykani,
      newSummary,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
