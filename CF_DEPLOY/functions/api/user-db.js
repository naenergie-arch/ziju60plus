const USERS_DB_URL = "https://script.google.com/macros/s/AKfycbzvXFlH3hlt5CCjgqDoVcHFS96jx9NMQeCa3HRagPvusn4jKIiAWS1LOVTChAh1qdSQkQ/exec";

async function safeJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    // GAS vrátil HTML (chyba/timeout) — vrátíme chybový objekt
    return { ok: false, error: "GAS_ERROR", detail: text.substring(0, 300) };
  }
}

export async function onRequestPost(context) {
  const body = await context.request.json();
  if (body.action === "ping") {
    return new Response(JSON.stringify({ ok: true, test: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const res = await fetch(USERS_DB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await safeJson(res);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "FETCH_ERROR", detail: e.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestGet(context) {
  const params = Object.fromEntries(new URL(context.request.url).searchParams);
  const url = new URL(USERS_DB_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url.toString());
    const data = await safeJson(res);
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: "FETCH_ERROR", detail: e.message }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
