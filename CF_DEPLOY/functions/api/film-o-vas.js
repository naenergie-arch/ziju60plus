export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch (_) {
    return new Response(JSON.stringify({ error: "Neplatný požadavek." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const { answers } = body;
  const jmeno    = (answers.jmeno || "").trim();
  const pohlavi  = answers.pohlavi || "muz";
  const jeZena   = pohlavi === "zena";
  const osloveni = jmeno
    ? (jeZena ? `milá ${jmeno}` : `milý ${jmeno}`)
    : (jeZena ? "milá čtenářko" : "milý čtenáři");

  const pohyb    = parseInt(answers.pohyb)    || 2;
  const nalada   = parseInt(answers.nalada)   || 2;
  const spojeni  = parseInt(answers.spojeni)  || 2;
  const spanek   = parseInt(answers.spanek)   || 2;
  const motivace = parseInt(answers.motivace) || 2;
  const zalib    = answers.zalib || "";
  const volnyText = answers.text || "";
  const vekSkutecny = parseInt(answers.vek_skutecny) || 0;
  const vekPocitovy = parseInt(answers.vek_pocitovy) || 0;

  const prompt = `Jsi empatický filmový vypravěč pro seniory 60+. Píšeš ČESKY, bez chyb.
Dostaneš výsledky osobního dotazníku. Napiš 4 krátké, poetické věty – jako hlas dokumentárního filmu.

JAZYK A FORMA:
- Piš spisovnou, přirozenou češtinou. Žádné germanismy, žádné překlady z angličtiny.
- VŽDY vykej: Vy, Vás, Váš, Vám, Vašich. Nikdy: ty, tě, tvůj.
- ${jeZena ? "Osoba je ŽENA – všude ženský rod (byla, cítila, dokázala…)" : "Osoba je MUŽ – všude mužský rod (byl, cítil, dokázal…)"}
- Správné pádové koncovky, správná shoda podmětu s přísudkem.

OBSAH:
- První věta MUSÍ začínat přesně takto (zkopíruj doslova, nic nemeň): "${osloveni},"
- Jméno "${jmeno}" NESKLOŇUJ, NEMEŇ, NENAHRAZUJ — použij ho přesně tak jak je.
- Každá věta konkrétní – zmiň co osobu baví, kde má sílu, kde příležitost ke změně.
- Tón: teplý, dojemný, poetický. Jako by tě někdo opravdu znal.
- Žádné uvozovky, čísla, odrážky. Každá věta na vlastním řádku.

DATA Z DOTAZNÍKU:
- Pohyb: ${pohyb}/3 ${pohyb===3?"(pravidelný)":pohyb===2?"(občasný)":"(chybí)"}
- Nálada: ${nalada}/3 ${nalada===3?"(dobrá)":nalada===2?"(kolísá)":"(nízká)"}
- Kontakt s lidmi: ${spojeni}/3 ${spojeni===3?"(živý)":spojeni===2?"(omezený)":"(osamělost)"}
- Spánek: ${spanek}/3 ${spanek===3?"(dobrý)":spanek===2?"(průměrný)":"(špatný)"}
- Motivace: ${motivace}/3 ${motivace===3?"(silná)":motivace===2?"(kolísá)":"(chybí)"}
- Zájmy: ${zalib || "nespecifikováno"}
${vekSkutecny ? `- Věk: ${vekSkutecny} let` : ""}
${vekPocitovy && vekPocitovy !== vekSkutecny ? `- Cítí se na: ${vekPocitovy} let` : ""}
- Volný text od osoby: "${volnyText || "neuvedeno"}"

DATA Z DOTAZNÍKU:
- Pohyb: ${pohyb}/3 ${pohyb===3?"(aktivní)":pohyb===2?"(občasný)":"(chybí)"}
- Nálada: ${nalada}/3 ${nalada===3?"(dobrá)":nalada===2?"(kolísá)":"(nízká)"}
- Kontakt s lidmi: ${spojeni}/3 ${spojeni===3?"(živý)":spojeni===2?"(omezený)":"(osamělost)"}
- Spánek: ${spanek}/3 ${spanek===3?"(dobrý)":spanek===2?"(průměrný)":"(špatný)"}
- Motivace: ${motivace}/3 ${motivace===3?"(silná)":motivace===2?"(kolísá)":"(chybí)"}
- Zájmy: ${zalib || "nespecifikováno"}
${vekSkutecny ? `- Věk: ${vekSkutecny} let` : ""}
${vekPocitovy && vekPocitovy !== vekSkutecny ? `- Cítí se na: ${vekPocitovy} let` : ""}
- Volný text: "${volnyText || "neuvedeno"}"

Napiš přesně 4 věty. Nic víc, nic míň. Každá na samostatném řádku. Žádný úvod ani závěr.`;

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
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Chyba AI.");

    const rawText = (data.content?.[0]?.text || "").trim();
    const vety = rawText.split("\n").map(v => v.trim()).filter(v => v.length > 10).slice(0, 4);

    return new Response(JSON.stringify({ vety }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
