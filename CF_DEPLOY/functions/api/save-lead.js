export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (_) {
    return new Response(JSON.stringify({ error: "Neplatný požadavek." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const { email, jmeno, pohlavi, pohyb, nalada, spojeni, spanek, motivace, zalib, text, total } = data;

  if (!email || !jmeno) {
    return new Response(JSON.stringify({ error: "Chybí povinné údaje." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const GAS_URL = env.GAS_LEADS_URL;
  if (!GAS_URL) {
    console.warn("GAS_LEADS_URL není nastavena – lead nebyl uložen:", email, jmeno);
    return new Response(JSON.stringify({ ok: true, saved: false }), {
      headers: { "Content-Type": "application/json" }
    });
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
      return new Response(JSON.stringify({ ok: true, saved: false }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    console.error("save-lead fetch error:", err.message);
    return new Response(JSON.stringify({ ok: true, saved: false }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true, saved: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
