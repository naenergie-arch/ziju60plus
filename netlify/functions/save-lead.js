// Uloží lead (jméno + email + odpovědi z kvízu) do Google Sheets přes GAS webhook.
// GAS_LEADS_URL musí být URL nasazeného GAS skriptu (viz instrukce níže).

const GAS_URL = process.env.GAS_LEADS_URL;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (_) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný požadavek." }) };
  }

  const { email, jmeno, pohlavi, pohyb, nalada, spojeni, spanek, motivace, zalib, text, total } = data;

  if (!email || !jmeno) {
    return { statusCode: 400, body: JSON.stringify({ error: "Chybí povinné údaje." }) };
  }

  // Pokud GAS URL není nastavena, logujeme a vracíme ok (neblokujeme UX)
  if (!GAS_URL) {
    console.warn("GAS_LEADS_URL není nastavena – lead nebyl uložen:", email, jmeno);
    return { statusCode: 200, body: JSON.stringify({ ok: true, saved: false }) };
  }

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "saveLead",
        email, jmeno, pohlavi,
        pohyb, nalada, spojeni, spanek, motivace,
        zalib: String(zalib || ""),
        text: String(text || "").slice(0, 500),
        total: total || 0,
        zdroj: "quiz-ziju60plus",
        datum: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      console.error("GAS save-lead error:", await res.text());
      return { statusCode: 200, body: JSON.stringify({ ok: true, saved: false }) };
    }
  } catch (err) {
    console.error("save-lead fetch error:", err.message);
    return { statusCode: 200, body: JSON.stringify({ ok: true, saved: false }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, saved: true }),
  };
};
