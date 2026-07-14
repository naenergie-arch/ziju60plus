const USERS_DB_URL = "https://script.google.com/macros/s/AKfycbzLyxewZyw7EpAcmJ4XOpdDUSudoIhPdmN2IQDE_zg4yHa09-SIrELmF6Idq4IcRMFJzA/exec";

export async function onRequestPost(context) {
  const body = await context.request.json();
  if (body.action === "ping") {
    return new Response(JSON.stringify({ ok: true, test: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const res = await fetch(USERS_DB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestGet(context) {
  const params = Object.fromEntries(new URL(context.request.url).searchParams);
  const url = new URL(USERS_DB_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
