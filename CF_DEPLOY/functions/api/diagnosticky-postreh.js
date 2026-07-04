// ── CSV parser (zvládá uvozovkované pole) ──────────────────────────
function parseCsv(text) {
  const rows = [];
  let cur = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c !== '\r') field += c;
    }
  }
  if (cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

// ── Mapování kat → první písmeno Oblast kódu ──────────────────────
const KAT_TO_PREFIX = {
  pohyb: 'A', lide: 'B', kultura: 'C', vzdelani: 'D',
  tvorba: 'E', smysl: 'F', priroda: 'G', jidlo: 'H',
  rodina: 'J', spanek: 'A',
};

// ── Stažení a parsování Knihovny aktivit ──────────────────────────
async function fetchKnihovna() {
  const id = '1_bDZt1PwvIZgkIKVUJBEr8fk4477JHiEsZgQJRTge0U';
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=Knihovna%20aktivit`;
  const r = await fetch(url, { cf: { cacheTtl: 3600 } });
  if (!r.ok) return null;
  const text = await r.text();
  const rows = parseCsv(text);
  // Sloupce: 0=Kod, 9=Odkaz1_název, 10=Odkaz1_URL, 11=Odkaz2_název, 12=Odkaz2_URL
  const byPrefix = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const kod = (row[0] || '').trim();
    if (kod.length < 2) continue; // přeskočit řádky kategorií ("A", "B"…)
    const prefix = kod[0].toUpperCase();
    const n1 = (row[9] || '').trim();
    const u1 = (row[10] || '').trim();
    const n2 = (row[11] || '').trim();
    const u2 = (row[12] || '').trim();
    if (!u1 && !u2) continue;
    if (!byPrefix[prefix]) byPrefix[prefix] = [];
    byPrefix[prefix].push({ n1, u1, n2, u2 });
  }
  return byPrefix;
}

// ── Výběr 2 odkazů pro daný kat ────────────────────────────────────
function pickLinks(byPrefix, kat) {
  const prefix = KAT_TO_PREFIX[kat] || 'A';
  const pool = (byPrefix[prefix] || []).slice(); // kopie
  if (!pool.length) return [null, null];
  // náhodné zamíchání
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const row1 = pool[0];
  const row2 = pool[1] || pool[0];
  return [
    row1.u1 ? { nazev: row1.n1 || 'Odkaz', url: row1.u1 } : (row1.u2 ? { nazev: row1.n2 || 'Odkaz', url: row1.u2 } : null),
    row2.u2 ? { nazev: row2.n2 || 'Odkaz', url: row2.u2 } : (row2.u1 ? { nazev: row2.n1 || 'Odkaz', url: row2.u1 } : null),
  ];
}

// ── HEAD kontrola jednoho URL (timeout 5 s) ────────────────────────
async function headCheck(url) {
  if (!url) return true;
  try {
    const fetchP = fetch(url, { method: 'HEAD', redirect: 'follow' }).then(r => r.status < 400);
    const timeoutP = new Promise(res => setTimeout(() => res(false), 5000));
    return await Promise.race([fetchP, timeoutP]);
  } catch { return false; }
}

// ── Email notifikace o mrtvých odkazech ────────────────────────────
async function notifyDeadLinks(dead, env) {
  if (!dead.length || !env.RESEND_API_KEY) return;
  const list = dead.map(d => `  Den ${d.den}: ${d.nazev} — ${d.url}`).join('\n');
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'notifikace@ziju60plus.cz',
      to: 'naenergie@gmail.com',
      subject: `Žiju60plus – nefunkční odkaz (${dead.length})`,
      text: `Nefunkční odkazy nalezené při generování profilu:\n\n${list}\n\nDatum: ${new Date().toISOString()}`,
    }),
  });
}

// ── Detekce kategorií z volného textu ──────────────────────────────
function detectCategories(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const scores = {};
  const add = (k, w = 1) => { scores[k] = (scores[k] || 0) + w; };
  if (/(procházk|chůz|chuz|chodit|cvič|cvic|pohyb|turistik|nordic|kolo|cykl)/.test(t)) add('A', 2);
  if (/(lidé|lidmi|společnost|přátel|pratel|setkávat|setkavat|parta|skupin|komunita)/.test(t)) add('B', 2);
  if (/(koncert|divadl|výstav|vystav|kino|galer|hudba|film)/.test(t)) add('C', 2);
  if (/(učit|ucit|kurz|školení|skolen|digitáln|digitaln|počítač|pocitac|ai|chatgpt|internet)/.test(t)) add('D', 2);
  if (/(psát|psat|malov|tvoř|tvorb|ručn|rucni|háčkov|hackov|pleten|šití|sití|dřevo)/.test(t)) add('E', 2);
  if (/(pomáh|pomah|dobrovoln|pomoc druhým|pomoc druhym|podporovat)/.test(t)) add('F', 2);
  if (/(cestov|výlet|vylet|poznáv|poznav|zážitk|zazitk|dovolená)/.test(t)) add('G', 2);
  if (/(zahrad|vařit|varit|domácnost|domacnost|úklid|uklid|pečen|pecen|opravov)/.test(t)) add('H', 2);
  if (/(úkol|ukol|projekt|plánovat|planovat|organizovat|řešit|resit|problém)/.test(t)) add('I', 2);
  if (/(vnoučat|vnoucat|vnuk|vnučk|vnuck|děti|deti|rodin|syn|dcera|babička|děda)/.test(t)) add('J', 2);
  return Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
}

export async function onRequestPost(context) {
  const { request, env, waitUntil } = context;

  let body;
  try {
    body = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: 'Neplatný požadavek.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { answers } = body;
  const jmeno    = (answers.jmeno || '').trim();
  const pohlavi  = answers.pohlavi || 'muz';
  const jeZena   = pohlavi === 'zena';
  const osloveni = jmeno
    ? (jeZena ? `milá ${jmeno}` : `milý ${jmeno}`)
    : (jeZena ? 'milá čtenářko' : 'milý čtenáři');

  const pohyb    = parseInt(answers.pohyb)    || 2;
  const nalada   = parseInt(answers.nalada)   || 2;
  const spojeni  = parseInt(answers.spojeni)  || 2;
  const spanek   = parseInt(answers.spanek)   || 2;
  const motivace = parseInt(answers.motivace) || 2;
  const total    = pohyb + nalada + spojeni + spanek + motivace;
  const volnyText = answers.text || '';
  const zalib    = answers.zalib || '';

  const vekSkutecny = parseInt(answers.vek_skutecny) || 0;
  const vekPocitovy = parseInt(answers.vek_pocitovy) || 0;
  const bioVek = Math.round(65 - 8 * ((total - 7.5) / 7.5));
  const skoreVitality = Math.round((total / 15) * 100);

  const detekCats = detectCategories(volnyText + ' ' + zalib);
  const zalibCats = String(zalib).split(',').map(s => s.trim()).filter(Boolean);
  const allCats   = [...new Set([...zalibCats, ...detekCats])].slice(0, 4);

  const prompt = `Jsi empatický průvodce vitality specializující se na seniory 60+.
Dostaneš odpovědi z osobního dotazníku. Tvým úkolem je napsat osobní profil vitality.

DŮLEŽITÉ POKYNY:
- Oslovi osobu jménem: "${osloveni}"
- ${jeZena ? 'Osoba je ŽENA – používej ženský rod' : 'Osoba je MUŽ – používej mužský rod'}
- VŽDY VYKEJ – používej výhradně formální oslovení (Vy, Vás, Váš, Vám). Nikdy netykej.
- Buď konkrétní, překvapující, laskavý
- Nikdy nediagnostikuj ani nestraš
- Piš přirozeně česky, jako moudrý a respektující průvodce

ODPOVĚDI Z DOTAZNÍKU:
- Pohyb (1-3): ${pohyb} ${pohyb === 1 ? '– pohyb chybí' : pohyb === 2 ? '– pohyb je občasný' : '– pohyb je pravidelný'}
- Nálada (1-3): ${nalada} ${nalada === 1 ? '– energie je nízká' : nalada === 2 ? '– nálada kolísá' : '– nálada je dobrá'}
- Kontakt s lidmi (1-3): ${spojeni} ${spojeni === 1 ? '– osamělost' : spojeni === 2 ? '– kontakt je omezený' : '– je obklopen/a lidmi'}
- Spánek (1-3): ${spanek} ${spanek === 1 ? '– spánek nefunguje' : spanek === 2 ? '– spánek je průměrný' : '– spánek je dobrý'}
- Motivace (1-3): ${motivace} ${motivace === 1 ? '– motivace chybí' : motivace === 2 ? '– motivace kolísá' : '– motivace je silná'}
- Záliby a zájmy: ${zalib || 'nespecifikováno'}
- Volný text od osoby: "${volnyText || 'neuvedeno'}"
- Celkové skóre: ${total}/15
${vekSkutecny ? `- Skutečný věk: ${vekSkutecny} let` : ''}
${vekPocitovy ? `- Na kolik se cítí: ${vekPocitovy} let` : ''}

NAPIŠ VALIDNÍ JSON s těmito klíči (bez dalšího textu):
{
  "postreh": "Osobní postřeh 3-4 věty – začni oslovením (vykej!), buď konkrétní a překvapující.",
  "silna_stranka": "Jedna věta – co je na této osobě nejsilnější (vykej!)",
  "prilezitost": "Jedna věta – největší příležitost ke změně (vykej!)",
  "tydenni_tema": "Krátký název tématu pro příštích 7 dní (max 5 slov) – ${jeZena ? 'ženský rod, NIKDY nepoužívej slovo děda nebo muž' : 'mužský rod, NIKDY nepoužívej slovo babička nebo žena'}",
  "doporuceni": [
    {
      "ikona": "emoji",
      "nazev": "Krátký název aktivity (max 5 slov)",
      "popis": "1-2 věty proč právě tato aktivita – propojit s odpověďmi osoby (vykej!)",
      "prinos": ["✔ přínos 1 (max 6 slov)", "✔ přínos 2 (max 6 slov)", "✔ přínos 3 (max 6 slov)"],
      "tip": "Tip odborníka: 1 věta od fyzioterapeuta / psychologa / nutričního terapeuta (vykej!)",
      "kat": "jedno z: pohyb|lide|kultura|tvorba|vzdelani|priroda|rodina|spanek|jidlo|smysl"
    }
  ]
}

Pole "doporuceni" musí mít přesně 7 položek – jeden tip na každý den.
Každý přínos (prinos) je konkrétní, v češtině, začíná ✔.
Tip odborníka (tip) začíná rolí: "Fyzioterapeut:", "Psycholog:", "Nutriční terapeutka:" apod.
${allCats.length ? `Zohledni zájmové kategorie: ${allCats.join(', ')}` : ''}`;

  try {
    // ── AI call + Knihovna paralelně ────────────────────────────────
    const [aiRes, knihovna] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 3000,
          messages: [{ role: 'user', content: prompt }],
        }),
      }),
      fetchKnihovna().catch(() => null),
    ]);

    const aiData = await aiRes.json();
    if (!aiRes.ok) throw new Error(aiData.error?.message || 'Chyba AI služby.');

    const rawText = aiData.content?.[0]?.text || '{}';
    const cleanText = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    const doporuceni = (parsed.doporuceni || []).slice(0, 7);

    // ── Přiřadit odkazy z Knihovny života ───────────────────────────
    if (knihovna) {
      const linkSets = doporuceni.map(r => pickLinks(knihovna, r.kat));

      // HEAD validace všech odkazů najednou
      const checks = linkSets.flatMap((pair, i) =>
        pair.map(async (link, j) => {
          if (!link) return { i, j, ok: true };
          const ok = await headCheck(link.url);
          return { i, j, ok, link };
        })
      );
      const results = await Promise.all(checks);

      const deadLinks = results
        .filter(r => !r.ok && r.link)
        .map(r => ({ den: r.i + 1, nazev: r.link.nazev, url: r.link.url }));

      // Připnout validované odkazy ke kartám
      doporuceni.forEach((r, i) => {
        const [l1, l2] = linkSets[i];
        const res1 = results.find(x => x.i === i && x.j === 0);
        const res2 = results.find(x => x.i === i && x.j === 1);
        r.odkaz1 = (res1?.ok !== false) ? l1 : null;
        r.odkaz2 = (res2?.ok !== false) ? l2 : null;
      });

      // Notifikace admina na pozadí
      if (deadLinks.length) {
        waitUntil(notifyDeadLinks(deadLinks, env));
      }
    }

    return new Response(JSON.stringify({
      postreh:        parsed.postreh || '',
      silna_stranka:  parsed.silna_stranka || '',
      prilezitost:    parsed.prilezitost || '',
      tydenni_tema:   parsed.tydenni_tema || 'Váš první týden',
      doporuceni,
      jmeno, pohlavi,
      skore_vitality: skoreVitality,
      bio_vek:        bioVek,
      vek_skutecny:   vekSkutecny,
      vek_pocitovy:   vekPocitovy,
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
