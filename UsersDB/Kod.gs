// Žiju60plus – Users DB API
// Verze: v1.0

const SECRET = "ZJ60_SECRET_2026_xK9pL";

// ── Sheet sloupce ──────────────────────────────────────────────
// A: token | B: email | C: jmeno | D: pohlavi | E: vek_skutecny
// F: vek_pocitovy | G: pohyb | H: nalada | I: spojeni | J: spanek
// K: motivace | L: zalib | M: trial_start | N: access_level
// O: access_ts | P: objevovna_shown (JSON pole indexů) | Q: created_at | R: last_login

function setupAutoTrigger() {
  // Smaž staré triggery pro approveSvedectvi
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'approveSvedectvi') ScriptApp.deleteTrigger(t);
  });
  // Spouštěj každou hodinu
  ScriptApp.newTrigger('approveSvedectvi')
    .timeBased().everyHours(1).create();
  Logger.log('Trigger nastaven.');
}

function setupOnEditTrigger() {
  // Smaž staré onEdit triggery pro svedectvi
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onEditSvedectvi') ScriptApp.deleteTrigger(t);
  });
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  ScriptApp.newTrigger('onEditSvedectvi')
    .forSpreadsheet(ss)
    .onEdit()
    .create();
  Logger.log('onEdit trigger nastaven.');
}

// Spustí se automaticky při každé úpravě sheetu Svedectvi (sloupec G = schvaleno)
function onEditSvedectvi(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== 'Svedectvi') return;
  // Sloupec G = index 7 (1-based)
  if (e.range.getColumn() !== 7) return;
  const val = (e.value || '').toString().trim().toUpperCase();
  if (val !== 'ANO') return;
  // Spustí zpracování jen pro tento řádek
  processOneSvedectviRow(e.range.getRow(), sheet);
}

function processOneSvedectviRow(row, sheet) {
  const data = sheet.getRange(row, 1, 1, 9).getValues()[0];
  const schvaleno = (data[6] || '').toString().trim().toUpperCase();
  const kodOdeslan = (data[8] || '').toString().trim().toUpperCase();
  if (schvaleno !== 'ANO' || kodOdeslan === 'ANO') return;

  const email = data[2];
  const jmeno = data[1];
  const stripeKey = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");
  const couponId = PropertiesService.getScriptProperties().getProperty("STRIPE_COUPON_ID");

  let kod = '';
  try {
    const res = UrlFetchApp.fetch('https://api.stripe.com/v1/promotion_codes', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + stripeKey },
      payload: {
        coupon: couponId,
        max_redemptions: '1'
      },
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    kod = json.code || '';
    if (!kod) { Logger.log('Stripe no code: ' + res.getContentText()); return; }
  } catch(e) {
    Logger.log('Stripe chyba: ' + e.message);
    return;
  }

  sheet.getRange(row, 8).setValue(kod);
  sheet.getRange(row, 9).setValue('ANO');

  try {
    GmailApp.sendEmail(
      email,
      '🎁 Váš slevový kód – Žiju60plus',
      '',
      {
        name: 'Tým Žiju60plus',
        replyTo: 'info@ziju60plus.cz',
        htmlBody:
          '<p>Dobrý den, ' + (jmeno || 'příteli') + ',</p>' +
          '<p>děkujeme za vaše svědectví! Jak jsme slíbili, zasíláme vám slevový kód na 30denní program:</p>' +
          '<p style="font-size:24px;font-weight:bold;letter-spacing:4px;color:#ff8a3d">' + kod + '</p>' +
          '<p>Kód zadejte při objednávce na <a href="https://ziju60plus.cz/result">ziju60plus.cz/result</a><br>' +
          'Sleva 50 % = platíte jen <strong>149 Kč</strong> místo 299 Kč.</p>' +
          '<p>Tým Žiju60plus</p>'
      }
    );
  } catch(e) {
    Logger.log('Email chyba: ' + e.message);
  }
}

function setupUsersDB() {
  const ss = SpreadsheetApp.create("Žiju60plus – Users DB");
  const sheet = ss.getActiveSheet();
  sheet.setName("Users");
  sheet.getRange(1, 1, 1, 18).setValues([[
    "token", "email", "jmeno", "pohlavi", "vek_skutecny",
    "vek_pocitovy", "pohyb", "nalada", "spojeni", "spanek",
    "motivace", "zalib", "trial_start", "access_level",
    "access_ts", "objevovna_shown", "created_at", "last_login"
  ]]);
  sheet.setFrozenRows(1);
  Logger.log("Sheet ID: " + ss.getId());
  Logger.log("Sheet URL: " + ss.getUrl());
}

function getStats() {
  const sheet = getSheet();
  const total = Math.max(0, sheet.getLastRow() - 1);
  const INTERNAL = 2;
  return { ok: true, members: Math.max(0, total - INTERNAL) };
}

// ── Helpers ────────────────────────────────────────────────────
function getSheet() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return SpreadsheetApp.openById(id).getSheetByName("Users");
}

function getKnihovnaSheet(nazev) {
  const id = PropertiesService.getScriptProperties().getProperty("KNIHOVNA_SHEET_ID");
  if (!id) throw new Error("KNIHOVNA_SHEET_ID není nastaven v Script Properties");
  return SpreadsheetApp.openById(id).getSheetByName(nazev);
}

// Načte jednu záložku knihovny a vrátí pole objektů
function nactiKnihovnu(nazevListu) {
  const sheet = getKnihovnaSheet(nazevListu);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => h.toString().trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  );
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // přeskoč prázdné řádky
    const obj = {};
    headers.forEach((h, j) => { if (h) obj[h] = row[j] || ''; });
    // Seskup až 5 odkazů do pole
    const odkazy = [];
    for (let n = 1; n <= 5; n++) {
      const nazev = obj['odkaz' + n + '_n_zev'] || obj['odkaz' + n + '_nazev'] || '';
      const url   = obj['odkaz' + n + '_url'] || '';
      if (url) odkazy.push({ nazev: nazev.toString(), url: url.toString() });
    }
    obj.odkazy = odkazy;
    rows.push(obj);
  }
  return rows;
}

// Vrátí obě knihovny + scoring pro konkrétního uživatele
function getKnihovna(params) {
  const aktivity = nactiKnihovnu('Knihovna aktivit');
  const vitality  = nactiKnihovnu('Knihovna vitality');

  // Volitelný scoring dle profilu uživatele
  let skore = null;
  if (params && params.token) {
    const sheet = getSheet();
    const found = findRowByToken(sheet, params.token);
    if (found) {
      const u = rowToUser(found.data);
      skore = spocitejSkore(u, aktivity, vitality);
    }
  }

  return { ok: true, aktivity, vitality, skore };
}

// Jednoduchý scoring: vrátí seřazené kódy kategorií podle profilu uživatele
function spocitejSkore(u, aktivity, vitality) {
  // Mapování kvízových hodnot na kategorie aktivit (A=fyzické, B=společenské atd.)
  const pohyb    = Number(u.pohyb)    || 3;
  const nalada   = Number(u.nalada)   || 3;
  const spojeni  = Number(u.spojeni)  || 3;
  const spanek   = Number(u.spanek)   || 3;
  const motivace = Number(u.motivace) || 3;

  // Skóre pro kategorie aktivit (čím nižší hodnota z kvízu = tím větší potřeba = vyšší priorita)
  const skoreAktivit = {
    A: 6 - pohyb,           // fyzické aktivity — priorita pro ty s nízkým pohybem
    B: 6 - spojeni,         // společenské — pro osamělé
    C: 3,                   // kulturní — vždy střední priorita
    D: 6 - motivace,        // vzdělávací — pro méně motivované
    E: 6 - nalada,          // kreativní — pro špatnou náladu
    F: 3,                   // dobrovolnické — střední
    G: pohyb >= 4 ? 4 : 2,  // cestovatelské — pro aktivní
    H: 2,                   // domácí — nižší priorita
    I: motivace >= 4 ? 4 : 2, // projektové — pro motivované
    J: 3,                   // rodina — střední
    K: 2,                   // hry — nižší
  };
  const skoreVitalit = {
    V1: 6 - pohyb,
    V2: 6 - pohyb,
    V3: 6 - motivace,
    V4: 6 - nalada,
    V5: 6 - spanek,
    V6: 2,
    V7: 6 - motivace,
  };

  // Seřaď kategorie od nejvyšší priority
  const serazeneAktivity = Object.entries(skoreAktivit)
    .sort((a, b) => b[1] - a[1])
    .map(([kat]) => kat);
  const serazeneVitality = Object.entries(skoreVitalit)
    .sort((a, b) => b[1] - a[1])
    .map(([kat]) => kat);

  return { aktivity: serazeneAktivity, vitality: serazeneVitality };
}

// Uloží reakci na aktivitu — každý token+den má přesně jeden řádek (přepíše nebo smaže)
function saveReakce(body) {
  const { token, den, aktivita_kod, aktivita_nazev, reakce, typ } = body;
  if (!token || !den) throw new Error("token a den jsou povinné");
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName("Reakce");
  if (!sheet) {
    sheet = ss.insertSheet("Reakce");
    sheet.appendRow(["token","den","aktivita_kod","aktivita_nazev","typ","reakce","timestamp"]);
  }
  // Hledej existující řádek pro tento token + den
  const data = sheet.getDataRange().getValues();
  let existingRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token && String(data[i][1]) === String(den)) {
      existingRow = i + 1; // 1-based
      break;
    }
  }
  const now = new Date().toISOString();
  if (existingRow > 0) {
    // Přepis existujícího řádku
    sheet.getRange(existingRow, 1, 1, 7).setValues([[
      token, den, aktivita_kod || data[existingRow-1][2] || '',
      aktivita_nazev || data[existingRow-1][3] || '',
      typ || 'aktivita', reakce || '', now
    ]]);
  } else {
    // Nový řádek
    sheet.appendRow([
      token, den, aktivita_kod || '', aktivita_nazev || '',
      typ || 'aktivita', reakce || '', now
    ]);
  }
  return { ok: true };
}

// Sestaví rozšířený plán pro dny 8–90 z knihovny dle profilu uživatele
function getExtendedPlan(params) {
  if (!params.token) return { ok: false, error: "token required" };
  const sheet = getSheet();
  const found = findRowByToken(sheet, params.token);
  if (!found) return { ok: false, error: "not_found" };
  const u = rowToUser(found.data);

  const aktivity = nactiKnihovnu('Knihovna aktivit');
  const vitality  = nactiKnihovnu('Knihovna vitality');
  const skore = spocitejSkore(u, aktivity, vitality);

  // Emoji dle kategorie
  const katEmoji = {
    A:'🏃', B:'🤝', C:'🎭', D:'📚', E:'🎨', F:'❤️',
    G:'🌿', H:'🏠', I:'💡', J:'👨‍👩‍👧', K:'🎮',
    V1:'💪', V2:'⚖️', V3:'🧠', V4:'😊', V5:'😴', V6:'🔧', V7:'⭐'
  };

  // Filtruj pouze skutečné aktivity (ne kategoriové řádky)
  // Aktivit: Kod=A,B,C... jsou kategorie → přeskočit; A1,A2... jsou aktivity
  // Vitality: Kod=V1,V2... jsou kategorie → přeskočit; V1-1,V1-2... jsou aktivity
  const realAkt = aktivity.filter(item => item.kod && item.kod.length > 1 && /\d/.test(item.kod));
  const realVit = vitality.filter(item => item.kod && item.kod.indexOf('-') !== -1);

  // Seřaď aktivity dle skóre
  const sortedAkt = [...realAkt].sort((a, b) => {
    const ka = (a.kod || '').charAt(0);
    const kb = (b.kod || '').charAt(0);
    return skore.aktivity.indexOf(ka) - skore.aktivity.indexOf(kb);
  });
  const sortedVit = [...realVit].sort((a, b) => {
    const ka = (a.kod || '').substring(0, 2);
    const kb = (b.kod || '').substring(0, 2);
    return skore.vitality.indexOf(ka) - skore.vitality.indexOf(kb);
  });

  // Sestav dny 8–90: každý 3. den = vitalita, ostatní = aktivita
  const plan = [];
  let ai = 0, vi = 0;
  for (let den = 8; den <= 90; den++) {
    const useVit = (den % 3 === 0) && sortedVit.length > 0;
    const item = useVit ? sortedVit[vi++ % sortedVit.length] : sortedAkt[ai++ % sortedAkt.length];
    if (!item) continue;
    const kat = item.kod || '';
    const katKey = useVit ? kat.substring(0, 2) : kat.charAt(0);
    plan.push({
      ikona: katEmoji[katKey] || '⭐',
      nazev: item.n_zev_aktivity || '',
      popis: item.popis_aktivity || '',
      prinos: parsePrinos(item.u_itek_nebo_p_nos || ''),
      tip: item.tip_na_za_tek || '',
      kat: (item.oblast || '').toLowerCase(),
      odkaz1: item.odkazy && item.odkazy[0] ? { nazev: item.odkazy[0].nazev, url: item.odkazy[0].url } : null,
      odkaz2: item.odkazy && item.odkazy[1] ? { nazev: item.odkazy[1].nazev, url: item.odkazy[1].url } : null,
    });
  }

  return { ok: true, plan };
}

function parsePrinos(text) {
  if (!text) return [];
  const t = text.toString().trim();
  // Pokud je text jedna věta s čárkami — rozděl po čárce
  const parts = t.split(/[;\n]/).map(s => s.replace(/^[-•*]\s*/, '').trim()).filter(s => s.length > 2);
  if (parts.length >= 2) return parts.slice(0, 3);
  // Jinak rozděl po čárce
  return t.split(',').map(s => s.trim()).filter(s => s.length > 2).slice(0, 3);
}

// Vrátí statistiky reakcí pro uživatele
function getReakceStats(params) {
  if (!params.token) return { ok: false, error: "token required" };
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  const sheet = ss.getSheetByName("Reakce");
  if (!sheet) return { ok: true, stats: { splneno: 0, vaham: 0, prijdu: 0, celkem: 0 }, reakce: [] };
  const data = sheet.getDataRange().getValues();
  const reakce = [];
  let splneno = 0, vaham = 0, prijdu = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== params.token) continue;
    const r = { den: data[i][1], kod: data[i][2], nazev: data[i][3], typ: data[i][4], reakce: data[i][5] };
    reakce.push(r);
    if (r.reakce === 'splneno') splneno++;
    else if (r.reakce === 'vaham') vaham++;
    else if (r.reakce === 'prijdu') prijdu++;
  }
  return { ok: true, stats: { splneno, vaham, prijdu, celkem: reakce.length }, reakce };
}

function generateToken(email) {
  const raw = email + SECRET + Date.now();
  return Utilities.base64Encode(Utilities.computeDigest(
    Utilities.DigestAlgorithm.MD5, raw
  )).replace(/[^a-zA-Z0-9]/g, "").substring(0, 32);
}

function findRowByEmail(sheet, email) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) return { row: i + 1, data: data[i] };
  }
  return null;
}

function findRowByToken(sheet, token) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) return { row: i + 1, data: data[i] };
  }
  return null;
}

function rowToUser(d) {
  return {
    token: d[0], email: d[1], jmeno: d[2], pohlavi: d[3],
    vek_skutecny: d[4], vek_pocitovy: d[5], pohyb: d[6],
    nalada: d[7], spojeni: d[8], spanek: d[9], motivace: d[10],
    zalib: d[11], trial_start: d[12], access_level: d[13],
    access_ts: d[14],
    objevovna_shown: d[15] ? JSON.parse(d[15]) : [],
    created_at: d[16], last_login: d[17],
    trial_days: d[18] ? Number(d[18]) : 7
  };
}

// ── Router ─────────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "load")             return respond(loadUser(e.parameter));
    if (action === "load_chat")        return respond(loadChat(e.parameter));
    if (action === "ping")             return respond({ ok: true });
    if (action === "get_stats")        return respond(getStats());
    if (action === "get_svedectvi")    return respond(getSvedectviPublic());
    if (action === "get_my_svedectvi") return respond(getMySvedectvi(e.parameter));
    if (action === "load_all")         return respond(loadAllUsers(e.parameter));
    if (action === "get_knihovna")     return respond(getKnihovna(e.parameter));
    if (action === "get_reakce_stats") return respond(getReakceStats(e.parameter));
    if (action === "get_extended_plan") return respond(getExtendedPlan(e.parameter));
    return respond({ error: "Unknown action" }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === "save")               return respond(saveUser(body));
    if (action === "update_access")      return respond(updateAccess(body));
    if (action === "update_objevovna")   return respond(updateObjevovna(body));
    if (action === "set_objevovna")      return respond(setObjevovna(body));
    if (action === "extend_trial")       return respond(extendTrial(body));
    if (action === "set_sheet_id")       return respond(setSheetId(body));
    if (action === "save_feedback")      return respond(saveFeedback(body));
    if (action === "save_chat")          return respond(saveChat(body));
    if (action === "save_svedectvi")     return respond(saveSvedectvi(body));
    if (action === "approve_svedectvi")  return respond(approveSvedectvi(body));
    if (action === "save_reakce")        return respond(saveReakce(body));
    return respond({ error: "Unknown action" }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

function respond(data, code) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Actions ────────────────────────────────────────────────────

function saveUser(body) {
  const sheet = getSheet();
  const now = new Date().toISOString();
  const email = body.email;
  if (!email) throw new Error("email required");
  const existing = findRowByEmail(sheet, email);
  if (existing) {
    sheet.getRange(existing.row, 18).setValue(now);
    const user = rowToUser(existing.data);
    user.last_login = now;
    return { ok: true, token: user.token, user, returning: true };
  }
  const token = generateToken(email);
  const trial_start = now;
  const row = [
    token, email,
    body.jmeno || "", body.pohlavi || "",
    body.vek_skutecny || "", body.vek_pocitovy || "",
    body.pohyb || "", body.nalada || "", body.spojeni || "",
    body.spanek || "", body.motivace || "", body.zalib || "",
    trial_start, "free", "", "[]", now, now
  ];
  sheet.appendRow(row);
  return { ok: true, token, user: rowToUser(row), returning: false };
}

function loadUser(params) {
  const sheet = getSheet();
  let found;
  if (params.token) {
    found = findRowByToken(sheet, params.token);
  } else if (params.email) {
    found = findRowByEmail(sheet, params.email);
  }
  if (!found) return { ok: false, error: "not_found" };
  const now = new Date().toISOString();
  sheet.getRange(found.row, 18).setValue(now);
  return { ok: true, user: rowToUser(found.data) };
}

function updateAccess(body) {
  const sheet = getSheet();
  if (!body.token) throw new Error("token required");
  const found = findRowByToken(sheet, body.token);
  if (!found) return { ok: false, error: "not_found" };
  sheet.getRange(found.row, 14).setValue(body.access_level || "free");
  sheet.getRange(found.row, 15).setValue(new Date().toISOString());
  return { ok: true };
}

function updateObjevovna(body) {
  const sheet = getSheet();
  if (!body.token) throw new Error("token required");
  const found = findRowByToken(sheet, body.token);
  if (!found) return { ok: false, error: "not_found" };
  const current = found.data[15] ? JSON.parse(found.data[15]) : [];
  if (!current.includes(body.index)) current.push(body.index);
  sheet.getRange(found.row, 16).setValue(JSON.stringify(current));
  return { ok: true, shown: current };
}

function setObjevovna(body) {
  const sheet = getSheet();
  if (!body.token) throw new Error("token required");
  if (!body.admin_key || body.admin_key !== 'ZJ60_ADMIN_2026') return { ok: false, error: "unauthorized" };
  const found = findRowByToken(sheet, body.token);
  if (!found) return { ok: false, error: "not_found" };
  const newVal = Array.isArray(body.shown) ? body.shown : [];
  sheet.getRange(found.row, 16).setValue(JSON.stringify(newVal));
  return { ok: true, shown: newVal };
}

function extendTrial(body) {
  if (!body.admin_key || body.admin_key !== 'ZJ60_ADMIN_2026') return { ok: false, error: "unauthorized" };
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const extraDays = body.extra_days || 3;
  const totalDays = 7 + extraDays;
  const cutoffDate = body.cutoff_date || '2026-07-17'; // registrovaní PŘED tímto datem
  let extended = 0, emailed = 0, errors = [];

  for (let i = 1; i < data.length; i++) {
    const d = data[i];
    if (!d[1]) continue; // prázdný řádek
    const createdAt = d[16] ? new Date(d[16]) : null;
    if (!createdAt) continue;
    // Jen uživatelé registrovaní před cutoffDate
    if (createdAt >= new Date(cutoffDate)) continue;
    // Nastav trial_days (sloupec S = index 19, řádek i+1)
    sheet.getRange(i + 1, 19).setValue(totalDays);
    extended++;
    // Pošli email
    const email = d[1];
    const jmeno = d[2] || '';
    try {
      GmailApp.sendEmail(
        email,
        '🎁 Váš program Žiju60plus se prodlužuje – získáváte 3 dny navíc zdarma',
        '',
        {
          name: 'Tým Žiju60plus',
          replyTo: 'info@ziju60plus.cz',
          htmlBody:
            '<p>Dobrý den, ' + (jmeno || 'příteli') + ',</p>' +
            '<p>v posledních dnech jsme na vašem programu Žiju60plus pracovali a dolaďovali některé funkce, aby vše fungovalo co nejlépe.</p>' +
            '<p>Jako poděkování za vaši trpělivost a důvěru jsme se rozhodli <strong>prodloužit váš program o 3 dny zdarma</strong> — z původních 7 na celých 10 dní.</p>' +
            '<p>Vaše překvapení v Objevovně, plán aktivit i vše ostatní na vás stále čeká.</p>' +
            '<p>Přejeme vám spoustu energie! 💪</p>' +
            '<p>Tým Žiju60plus</p>'
        }
      );
      emailed++;
    } catch(e) {
      errors.push(email + ': ' + e.message);
    }
  }
  return { ok: true, extended, emailed, errors };
}

function saveFeedback(body) {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName("Feedback");
  if (!sheet) {
    sheet = ss.insertSheet("Feedback");
    sheet.getRange(1, 1, 1, 5).setValues([["datum", "jmeno", "email", "zprava", "token"]]);
    sheet.setFrozenRows(1);
  }
  const now = new Date().toISOString();
  sheet.appendRow([now, body.jmeno || "", body.email || "", body.zprava || "", body.token || ""]);
  return { ok: true };
}

function setSheetId(body) {
  if (!body.sheet_id) throw new Error("sheet_id required");
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", body.sheet_id);
  return { ok: true };
}

function loadAllUsers(params) {
  if (params.admin_key !== 'ZJ60_ADMIN_2026') return { ok: false, error: 'unauthorized' };
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < data.length; i++) {
    const d = data[i];
    if (!d[1]) continue; // přeskočit prázdné řádky
    users.push({
      email: d[1], jmeno: d[2], pohlavi: d[3],
      vek_skutecny: d[4], trial_start: d[12],
      access_level: d[13], created_at: d[16]
    });
  }
  // Seřadit od nejnovějšího
  users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return { ok: true, users };
}

// ── Svědectví ──────────────────────────────────────────────────

function getSvedectviSheet() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName("Svedectvi");
  if (!sheet) {
    sheet = ss.insertSheet("Svedectvi");
    sheet.getRange(1, 1, 1, 9).setValues([[
      "datum", "jmeno", "email", "misto", "text", "token", "schvaleno", "slevovy_kod", "kod_odeslan"
    ]]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 9).setBackground("#c9daf8").setFontWeight("bold");
  }
  return sheet;
}

function saveSvedectvi(body) {
  if (!body.text) throw new Error("text required");
  const sheet = getSvedectviSheet();
  const now = new Date().toISOString();
  sheet.appendRow([
    now, body.jmeno||'', body.email||'', body.misto||'',
    body.text, body.token||'', '', '', ''
  ]);
  try {
    GmailApp.sendEmail(
      'poukazy@ziju60plus.cz',
      '🆕 Nové svědectví – Žiju60plus',
      'Nové svědectví od: ' + (body.jmeno||'neznámý') + ' (' + (body.email||'') + ')\n' +
      'Město: ' + (body.misto||'') + '\n\n' +
      body.text + '\n\n' +
      'Schval v Google Sheetu (sloupec G = ANO/NE):\n' +
      'https://docs.google.com/spreadsheets/d/' +
      PropertiesService.getScriptProperties().getProperty("SHEET_ID")
    );
  } catch(e) {}
  return { ok: true };
}

function approveSvedectvi(body) {
  const sheet = getSvedectviSheet();
  const data = sheet.getDataRange().getValues();
  let processed = 0;
  for (let i = 1; i < data.length; i++) {
    const schvaleno = (data[i][6] || '').toString().trim().toUpperCase();
    const kodOdeslan = (data[i][8] || '').toString().trim().toUpperCase();
    if (schvaleno !== 'ANO' || kodOdeslan === 'ANO') continue;
    processOneSvedectviRow(i + 1, sheet);
    processed++;
  }
  return { ok: true, processed };
}

// ── Veřejná svědectví ──────────────────────────────────────────

function getSvedectviPublic() {
  const svedSheet = getSvedectviSheet();
  const svedData = svedSheet.getDataRange().getValues();
  const userSheet = getSheet();
  const userData = userSheet.getDataRange().getValues();

  // Mapa token → vek_skutecny
  const tokenToVek = {};
  for (let i = 1; i < userData.length; i++) {
    tokenToVek[userData[i][0]] = userData[i][4] || '';
  }

  const result = [];
  for (let i = 1; i < svedData.length; i++) {
    const schvaleno = (svedData[i][6] || '').toString().trim().toUpperCase();
    if (schvaleno !== 'ANO') continue;
    const token = svedData[i][5] || '';
    result.push({
      jmeno: svedData[i][1],
      vek: tokenToVek[token] || '',
      misto: svedData[i][3],
      text: svedData[i][4],
      datum: svedData[i][0]
    });
  }
  return { ok: true, svedectvi: result };
}

function getMySvedectvi(params) {
  if (!params.token) return { ok: false, error: 'token required' };
  const userSheet = getSheet();
  const found = findRowByToken(userSheet, params.token);
  if (!found) return { ok: false, error: 'not_found' };
  const email = found.data[1];

  const sheet = getSvedectviSheet();
  const data = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][2] === email) {
      const schvaleno = (data[i][6] || '').toString().trim().toUpperCase();
      const kod = data[i][7] || '';
      const kodOdeslan = (data[i][8] || '').toString().trim().toUpperCase();
      const status = schvaleno === 'ANO' ? 'approved' : 'pending';
      return { ok: true, status, kod: kodOdeslan === 'ANO' ? kod : '' };
    }
  }
  return { ok: true, status: 'none', kod: '' };
}

// ── Chat historie ──────────────────────────────────────────────

function getChatSheet() {
  const id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  const ss = SpreadsheetApp.openById(id);
  let sheet = ss.getSheetByName("Chat_Historie");
  if (!sheet) {
    sheet = ss.insertSheet("Chat_Historie");
    sheet.getRange(1, 1, 1, 5).setValues([["token", "datum", "role", "zprava", "den_trial"]]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, 5).setBackground("#f0c060").setFontWeight("bold");
  }
  return sheet;
}

function saveChat(body) {
  if (!body.token) throw new Error("token required");
  if (!body.role || !body.zprava) throw new Error("role a zprava required");
  const sheet = getChatSheet();
  const now = new Date().toISOString();
  sheet.appendRow([body.token, now, body.role, body.zprava, body.den_trial || 0]);
  return { ok: true };
}

function loadChat(params) {
  if (!params.token) throw new Error("token required");
  const sheet = getChatSheet();
  const data = sheet.getDataRange().getValues();
  const history = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.token) {
      history.push({
        datum: data[i][1],
        role: data[i][2],
        zprava: data[i][3],
        den_trial: data[i][4]
      });
    }
  }
  return { ok: true, history: history.slice(-100) };
}
