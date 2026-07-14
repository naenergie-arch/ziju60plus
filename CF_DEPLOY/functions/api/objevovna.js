const OBJ_GAS_URL = "https://script.google.com/macros/s/AKfycbzFibgwKBpdHy6pfD_87-XXmHhIcQjPb1U65OGDTnGQl5DX-wj4c0KwNlFreZuy-031/exec";

export async function onRequestPost(context) {
  const body = await context.request.json();
  const res = await fetch(OBJ_GAS_URL, {
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
  const url = new URL(OBJ_GAS_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
