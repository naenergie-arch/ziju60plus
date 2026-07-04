export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch (_) {
    return new Response(JSON.stringify({ error: "Neplatný požadavek." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const { answers } = body;
  const jmeno     = (answers.jmeno || "").trim();
  const pohlavi   = answers.pohlavi || "muz";
  const jeZena    = pohlavi === "zena";

  const pohyb    = parseInt(answers.pohyb)    || 2;
  const nalada   = parseInt(answers.nalada)   || 2;
  const spojeni  = parseInt(answers.spojeni)  || 2;
  const spanek   = parseInt(answers.spanek)   || 2;
  const motivace = parseInt(answers.motivace) || 2;
  const zalib    = answers.zalib    || "";
  const volnyText = answers.text    || "";
  const vekSkutecny = parseInt(answers.vek_skutecny) || 0;
  const vekPocitovy = parseInt(answers.vek_pocitovy) || 0;

  // Oslovení — jen základ, vokativ jména udělá AI
  const osloveniZaklad = jeZena ? "Milá" : "Milý";
  const jmenoPokyn = jmeno
    ? `Jméno osoby je "${jmeno}". První věta MUSÍ začínat: "${osloveniZaklad} [${jmeno} ve správném českém vokativu 5. pádu]," — například Jiřina→Jiřino, Josef→Josefe, Jana→Jano, Míla→Mílo, Pavel→Pavle, Věra→Věro, Martin→Martine.`
    : `První věta začíná: "${jeZena ? "Milá čtenářko" : "Milý čtenáři"},"`;

  const prompt = `Jsi empatický filmový vypravěč. Píšeš krásnou, správnou češtinou pro seniory 60+.
Napiš 4 krátké poetické věty — jako hlas dokumentárního filmu o tomto člověku.

JAZYK — PŘÍSNÁ PRAVIDLA:
- Výhradně spisovná čeština. ŽÁDNÁ anglická slova (rhythm→rytmus, energy→energie, feeling→pocit atd.).
- ŽÁDNÁ vymyšlená, neexistující nebo nejasná slova. Pouze běžná česká slovní zásoba.
- VŽDY vykání: Vy, Vás, Váš, Vám. NIKDY tykání.
- ${jeZena ? "Osoba je ŽENA — ženský rod všude (byla, cítila, dokázala)." : "Osoba je MUŽ — mužský rod všude (byl, cítil, dokázal)."}
- Velké písmeno na začátku každé věty.
- Věk piš přirozeně: "v šedesáti osmi letech" nebo "ve svých 68 letech" — NIKDY jako součet čísel.

OSLOVENÍ:
- ${jmenoPokyn}
- Za oslovením čárka, pak pokračuje věta.

OBSAH:
- Každá věta konkrétní — zmiň co osobu baví, kde je silná, kde má prostor ke změně.
- Tón: teplý, dojemný, poetický. Jako by tě někdo skutečně znal.
- Žádné uvozovky, čísla ani odrážky. Každá věta na vlastním řádku.

DATA:
- Pohyb: ${pohyb}/3 ${pohyb===3?"(pravidelný)":pohyb===2?"(občasný)":"(chybí)"}
- Nálada: ${nalada}/3 ${nalada===3?"(dobrá)":nalada===2?"(kolísá)":"(nízká)"}
- Kontakt s lidmi: ${spojeni}/3 ${spojeni===3?"(živý)":spojeni===2?"(omezený)":"(osamělost)"}
- Spánek: ${spanek}/3 ${spanek===3?"(dobrý)":spanek===2?"(průměrný)":"(špatný)"}
- Motivace: ${motivace}/3 ${motivace===3?"(silná)":motivace===2?"(kolísá)":"(chybí)"}
- Zájmy: ${zalib || "nespecifikováno"}
${vekSkutecny ? `- Věk: ${vekSkutecny} let` : ""}
${vekPocitovy && vekPocitovy !== vekSkutecny ? `- Cítí se na: ${vekPocitovy} let` : ""}
- Volný text: "${volnyText || "neuvedeno"}"

Napiš přesně 4 věty. Žádný úvod ani závěr. Každá věta na samostatném řádku.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 450,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Chyba AI.");

    const rawText = (data.content?.[0]?.text || "").trim();
    const vety = rawText.split("\n").map(v => v.trim()).filter(v => v.length > 8).slice(0, 4);

    return new Response(JSON.stringify({ vety }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
