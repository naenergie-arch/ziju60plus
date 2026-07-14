// Žiju60plus – Users DB API
// Verze: v1.0

const SECRET = "ZJ60_SECRET_2026_xK9pL";

// ── Sheet sloupce ──────────────────────────────────────────────
// A: token | B: email | C: jmeno | D: pohlavi | E: vek_skutecny
// F: vek_pocitovy | G: pohyb | H: nalada | I: spojeni | J: spanek
// K: motivace | L: zalib | M: trial_start | N: access_level
// O: access_ts | P: objevovna_shown (JSON pole indexů) | Q: created_at | R: last_login

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
    created_at: d[16], last_login: d[17]
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
    if (action === "set_sheet_id")       return respond(setSheetId(body));
    if (action === "save_feedback")      return respond(saveFeedback(body));
    if (action === "save_chat")          return respond(saveChat(body));
    if (action === "save_svedectvi")     return respond(saveSvedectvi(body));
    if (action === "approve_svedectvi")  return respond(approveSvedectvi(body));
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
  const stripeKey = PropertiesService.getScriptProperties().getProperty("STRIPE_SECRET_KEY");

  for (let i = 1; i < data.length; i++) {
    const schvaleno = (data[i][6] || '').toString().trim().toUpperCase();
    const kodOdeslan = data[i][8];
    if (schvaleno !== 'ANO' || kodOdeslan === 'ANO') continue;

    const email = data[i][2];
    const jmeno = data[i][1];
    let kod = '';
    try {
      const res = UrlFetchApp.fetch('https://api.stripe.com/v1/promotion_codes', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + stripeKey },
        payload: {
          coupon: PropertiesService.getScriptProperties().getProperty("STRIPE_COUPON_ID"),
          max_redemptions: '1',
          restrictions: { first_time_transaction: 'false' }
        },
        muteHttpExceptions: true
      });
      const json = JSON.parse(res.getContentText());
      kod = json.code || '';
    } catch(e) {
      Logger.log('Stripe chyba: ' + e.message);
      continue;
    }

    if (!kod) continue;

    sheet.getRange(i + 1, 8).setValue(kod);
    sheet.getRange(i + 1, 9).setValue('ANO');

    try {
      GmailApp.sendEmail(
        email,
        '🎁 Váš slevový kód – Žiju60plus',
        'Dobrý den, ' + jmeno + ',\n\n' +
        'děkujeme za vaše svědectví! Jak jsme slíbili, zasíláme vám slevový kód na 30denní program:\n\n' +
        '➡️  ' + kod + '\n\n' +
        'Kód zadejte při objednávce na ziju60plus.cz/result\n' +
        'Sleva 50 % = platíte jen 149 Kč místo 299 Kč.\n\n' +
        'Tým Žiju60plus'
      );
    } catch(e) {
      Logger.log('Email chyba: ' + e.message);
    }
  }
  return { ok: true };
}

// ── Veřejná svědectví ──────────────────────────────────────────

function getSvedectviPublic() {
  const sheet = getSvedectviSheet();
  const data = sheet.getDataRange().getValues();
  const result = [];
  for (let i = 1; i < data.length; i++) {
    const schvaleno = (data[i][6] || '').toString().trim().toUpperCase();
    if (schvaleno !== 'ANO') continue;
    result.push({
      jmeno: data[i][1],
      misto: data[i][3],
      text: data[i][4],
      datum: data[i][0]
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
