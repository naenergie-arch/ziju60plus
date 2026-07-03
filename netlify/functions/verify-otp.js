const crypto = require("crypto");

const SECRET = process.env.OTP_SECRET || "ziju60plus-otp-secret-2026";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minut

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email, otp, token;
  try {
    const b = JSON.parse(event.body || "{}");
    email = (b.email || "").trim().toLowerCase();
    otp   = (b.otp   || "").trim();
    token = (b.token  || "").trim();
  } catch (_) {}

  if (!email || !otp || !token) {
    return { statusCode: 400, body: JSON.stringify({ error: "Chybí údaje." }) };
  }

  // Rozlož token na payload a HMAC
  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný token." }) };
  }

  const payloadB64 = token.slice(0, dotIdx);
  const hmacReceived = token.slice(dotIdx + 1);

  let payload;
  try {
    payload = Buffer.from(payloadB64, "base64").toString("utf8");
  } catch (_) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný token." }) };
  }

  // Ověř HMAC
  const expectedHmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(hmacReceived, "hex"), Buffer.from(expectedHmac, "hex"))) {
      return { statusCode: 400, body: JSON.stringify({ error: "Neplatný kód." }) };
    }
  } catch (_) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný kód." }) };
  }

  // Rozeber payload: email|otp|timestamp
  const parts = payload.split("|");
  if (parts.length !== 3) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný token." }) };
  }
  const [tokenEmail, tokenOtp, tsStr] = parts;

  // Email musí souhlasit
  if (tokenEmail !== email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Neplatný kód." }) };
  }

  // Kontrola vypršení
  if (Date.now() - parseInt(tsStr, 10) > OTP_TTL_MS) {
    return { statusCode: 400, body: JSON.stringify({ error: "Kód vypršel. Klikněte na „Odeslat znovu"." }) };
  }

  // Kontrola samotného kódu
  if (tokenOtp !== otp) {
    return { statusCode: 400, body: JSON.stringify({ error: "Nesprávný kód. Zkuste to znovu." }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true }),
  };
};
