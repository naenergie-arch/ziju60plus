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
    if (action === "load") return respond(loadUser(e.parameter));
    if (action === "ping") return respond({ ok: true });
    return respond({ error: "Unknown action" }, 400);
  } catch (err) {
    return respond({ error: err.message }, 500);
  }
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const action = body.action;
  try {
    if (action === "save")            return respond(saveUser(body));
    if (action === "update_access")   return respond(updateAccess(body));
    if (action === "update_objevovna")return respond(updateObjevovna(body));
    if (action === "set_sheet_id")    return respond(setSheetId(body));
    if (action === "save_feedback")   return respond(saveFeedback(body));
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

// Uloží nebo aktualizuje uživatele po ověření OTP
function saveUser(body) {
  const sheet = getSheet();
  const now = new Date().toISOString();
  const email = body.email;
  if (!email) throw new Error("email required");

  const existing = findRowByEmail(sheet, email);

  if (existing) {
    // Vrací se – aktualizuj last_login, ale profil nech
    sheet.getRange(existing.row, 18).setValue(now);
    const user = rowToUser(existing.data);
    user.last_login = now;
    return { ok: true, token: user.token, user, returning: true };
  }

  // Nový uživatel
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

// Načte uživatele podle tokenu nebo emailu
function loadUser(params) {
  const sheet = getSheet();
  let found;
  if (params.token) {
    found = findRowByToken(sheet, params.token);
  } else if (params.email) {
    found = findRowByEmail(sheet, params.email);
  }
  if (!found) return { ok: false, error: "not_found" };

  // Aktualizuj last_login
  const now = new Date().toISOString();
  sheet.getRange(found.row, 18).setValue(now);
  return { ok: true, user: rowToUser(found.data) };
}

// Aktualizuje access_level po platbě (volá dekujeme.html nebo webhook)
function updateAccess(body) {
  const sheet = getSheet();
  if (!body.token) throw new Error("token required");
  const found = findRowByToken(sheet, body.token);
  if (!found) return { ok: false, error: "not_found" };
  sheet.getRange(found.row, 14).setValue(body.access_level || "free");
  sheet.getRange(found.row, 15).setValue(new Date().toISOString());
  return { ok: true };
}

// Označí překvapení jako zobrazené
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

// Uloží feedback do listu "Feedback"
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

// Nastaví SHEET_ID do Script Properties (spusť jednou po setupu)
function setSheetId(body) {
  if (!body.sheet_id) throw new Error("sheet_id required");
  PropertiesService.getScriptProperties().setProperty("SHEET_ID", body.sheet_id);
  return { ok: true };
}
