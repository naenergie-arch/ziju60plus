const DAILY_LIMIT = 300;
const usageByDay = {};

function checkAndIncrementDailyLimit() {
  const today = new Date().toISOString().slice(0, 10);
  usageByDay[today] = (usageByDay[today] || 0) + 1;
  return usageByDay[today] <= DAILY_LIMIT;
}

// Detekce kategorií A–J z volného textu (stejná logika jako původní systém)
function detectCategories(text) {
  if (!text) return [];
  const t = text.toLowerCase();
  const scores = {};
  const add = (k, w=1) => { scores[k] = (scores[k]||0) + w; };
  if (/(procházk|procházk|chůz|chuz|chodit|cvič|cvic|pohyb|turistik|nordic|kolo|cykl)/.test(t)) add("A",2);
  if (/(lidé|lidmi|společnost|přátel|pratel|setkávat|setkavat|parta|skupin|komunita)/.test(t)) add("B",2);
  if (/(koncert|divadl|výstav|vystav|kino|galer|hudba|film)/.test(t)) add("C",2);
  if (/(učit|ucit|kurz|školení|skolen|digitáln|digitaln|počítač|pocitac|ai|chatgpt|internet)/.test(t)) add("D",2);
  if (/(psát|psat|malov|tvoř|tvorb|ručn|rucni|háčkov|hackov|pleten|šití|sití|dřevo)/.test(t)) add("E",2);
  if (/(pomáh|pomah|dobrovoln|pomoc druhým|pomoc druhym|podporovat)/.test(t)) add("F",2);
  if (/(cestov|výlet|vylet|poznáv|poznav|zážitk|zazitk|dovolená)/.test(t)) add("G",2);
  if (/(zahrad|vařit|varit|domácnost|domacnost|úklid|uklid|pečen|pecen|opravov)/.test(t)) add("H",2);
  if (/(úkol|ukol|projekt|plánovat|planovat|organizovat|řešit|resit|problém)/.test(t)) add("I",2);
  if (/(vnoučat|vnoucat|vnuk|vnučk|vnuck|děti|deti|rodin|syn|dcera|babička|děda)/.test(t)) add("J",2);
  return Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,3).map(e=>e[0]);
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  if (!checkAndIncrementDailyLimit()) {
    return { statusCode: 429, body: JSON.stringify({ error: "Denní limit dosažen, zkuste prosím zítra." }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný požadavek." }) };
  }

  const { answers } = body;
  const jmeno = (answers.jmeno || "").trim();
  const pohlavi = answers.pohlavi || "muz"; // "muz" nebo "zena"
  const jeZena = pohlavi === "zena";

  // Oslovení
  const osloveni = jmeno ? (jeZena ? `milá ${jmeno}` : `milý ${jmeno}`) : (jeZena ? "milá čtenářko" : "milý čtenáři");

  // Skóre
  const pohyb    = parseInt(answers.pohyb)    || 2;
  const nalada   = parseInt(answers.nalada)   || 2;
  const spojeni  = parseInt(answers.spojeni)  || 2;
  const spanek   = parseInt(answers.spanek)   || 2;
  const motivace = parseInt(answers.motivace) || 2;
  const total    = pohyb + nalada + spojeni + spanek + motivace;
  const volnyText = answers.text || "";
  const zalib    = answers.zalib || "";

  // Detekce zájmových kategorií
  const detekCats = detectCategories(volnyText + " " + zalib);

  // Kategorie z záliby (krok 7)
  const zalibCats = String(zalib).split(",").map(s=>s.trim()).filter(Boolean);
  const allCats = [...new Set([...zalibCats, ...detekCats])].slice(0,4);

  const prompt = `Jsi empatický průvodce vitality specializující se na seniory 60+.
Dostaneš odpovědi z osobního dotazníku. Tvým úkolem je napsat osobní profil vitality.

DŮLEŽITÉ POKYNY:
- Oslovi osobu jménem: "${osloveni}"
- ${jeZena ? "Osoba je ŽENA – používej ženský rod" : "Osoba je MUŽ – používej mužský rod"}
- Buď konkrétní, překvapující, laskavý
- Nikdy nediagnostikuj ani nestraš
- Piš přirozeně česky, jako moudrý přítel

ODPOVĚDI Z DOTAZNÍKU:
- Pohyb (1-3): ${pohyb} ${pohyb===1?"– pohyb chybí":pohyb===2?"– pohyb je občasný":"– pohyb je pravidelný"}
- Nálada (1-3): ${nalada} ${nalada===1?"– energie je nízká":nalada===2?"– nálada kolísá":"– nálada je dobrá"}
- Kontakt s lidmi (1-3): ${spojeni} ${spojeni===1?"– osamělost":spojeni===2?"– kontakt je omezený":"– je obklopen/a lidmi"}
- Spánek (1-3): ${spanek} ${spanek===1?"– spánek nefunguje":spanek===2?"– spánek je průměrný":"– spánek je dobrý"}
- Motivace (1-3): ${motivace} ${motivace===1?"– motivace chybí":motivace===2?"– motivace kolísá":"– motivace je silná"}
- Záliby a zájmy: ${zalib || "nespecifikováno"}
- Volný text od osoby: "${volnyText || "neuvedeno"}"
- Celkové skóre: ${total}/15

NAPIŠ VALIDNÍ JSON s těmito klíči (bez dalšího textu):
{
  "postreh": "Osobní postřeh 3-4 věty – začni oslovením, buď konkrétní a překvapující. Zmiň co vidíš jako silnou stránku a co jako příležitost.",
  "silna_stranka": "Jedna věta – co je na této osobě nejsilnější",
  "prilezitost": "Jedna věta – největší příležitost ke změně",
  "tydenni_tema": "Krátký název tématu pro příštích 7 dní (max 5 slov)",
  "doporuceni": [
    {"ikona":"emoji","nazev":"Krátký název aktivity","popis":"1-2 věty proč právě tato aktivita pro tuto konkrétní osobu","kat":"jedno z: pohyb|lide|kultura|tvorba|vzdelani|priroda|rodina|spánek|jidlo|smysl"}
  ]
}

Pole "doporuceni" musí mít přesně 5 položek – vyber konkrétní aktivity z Knihovny života odpovídající profilu osoby.
${allCats.length ? `Zohledni zájmové kategorie: ${allCats.join(", ")}` : ""}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 900,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || "Chyba AI služby." }) };
    }

    const rawText = data.content?.[0]?.text || "{}";
    const cleanText = rawText.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleanText);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postreh: parsed.postreh || "",
        silna_stranka: parsed.silna_stranka || "",
        prilezitost: parsed.prilezitost || "",
        tydenni_tema: parsed.tydenni_tema || "Váš první týden",
        doporuceni: parsed.doporuceni || [],
        jmeno,
        pohlavi,
      }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
