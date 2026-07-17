const OBJ_GAS_URL = "https://script.google.com/macros/s/AKfycbyVD5zhbzY09kMu3KLd3nEU9tcgymmoyALWn_pTyGPAAO1XfpXwd6F6dQKBqZIIsFOd/exec";

// Extra dny pro 10denní uživatele (dny 8, 9, 10)
const EXTRA_OBJ = {
  8: [{ objId:"OBJ019", nazev:"Lumosity – trénink mozku", popis:"Vědecky ověřené hry pro paměť, pozornost a rychlost myšlení.", wow:"Váš mozek potřebuje trénink stejně jako vaše tělo. Zkuste to dnes.", url:"https://www.lumosity.com", kategorie:"mozek", cas_min:10, den:8 }],
  9: [{ objId:"OBJ020", nazev:"Meetup – najdi lidi blízko tebe", popis:"Skupiny lidí se společnými zájmy — procházky, kultura, sport, cestování.", wow:"Někde blízko vás se dnes schází lidé, kteří mají stejné zájmy jako vy.", url:"https://www.meetup.com", kategorie:"společnost", cas_min:15, den:9 }],
  10: [{ objId:"OBJ021", nazev:"Penzu – osobní deník online", popis:"Soukromý digitální deník. Zapište, co jste za 10 dní zažili a co chcete dál.", wow:"Deset dní. Zapište si, co se změnilo. Budete překvapeni.", url:"https://penzu.com", kategorie:"osobní rozvoj", cas_min:15, den:10 }],
};

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

  // Přidej extra dny 8-10 pokud maxDay > 7
  const maxDay = parseInt(params.maxDay || "7");
  if (maxDay > 7 && data.ok && data.archive) {
    for (let d = 8; d <= Math.min(maxDay, 10); d++) {
      if (EXTRA_OBJ[d]) data.archive[d] = EXTRA_OBJ[d];
    }
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
