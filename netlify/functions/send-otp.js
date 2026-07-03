const crypto = require("crypto");

const SECRET = process.env.OTP_SECRET || "ziju60plus-otp-secret-2026";
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "Žiju 60 plus <noreply@ziju60plus.cz>";

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Token je stateless – žádná databáze. Payload = email|otp|timestamp, podepsaný HMAC.
function makeToken(email, otp) {
  const ts = Date.now();
  const payload = `${email}|${otp}|${ts}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(payload).toString("base64") + "." + hmac;
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email;
  try {
    email = (JSON.parse(event.body || "{}").email || "").trim().toLowerCase();
  } catch (_) {}

  if (!email || !email.includes("@") || !email.includes(".")) {
    return { statusCode: 400, body: JSON.stringify({ error: "Zadejte platný email." }) };
  }

  if (!RESEND_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Emailová služba není nakonfigurována." }) };
  }

  const otp = generateOtp();
  const token = makeToken(email, otp);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: `${otp} – váš kód pro Žiju 60 plus`,
      html: `
<!DOCTYPE html>
<html lang="cs">
<body style="margin:0;padding:0;background:#f5ede0;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 16px">
    <table width="100%" style="max-width:440px;background:#fff9ee;border-radius:20px;padding:40px 36px;border:1.5px solid #edd8a8">
      <tr><td style="text-align:center">
        <div style="font-size:32px;margin-bottom:16px">🌿</div>
        <h2 style="color:#3a2008;font-size:22px;margin:0 0 8px">Váš ověřovací kód</h2>
        <p style="color:#7a5030;font-size:14px;margin:0 0 28px;line-height:1.6">
          Zadejte ho na stránce Žiju 60 plus pro zobrazení vašeho osobního profilu.
        </p>
        <div style="font-size:42px;font-weight:700;letter-spacing:14px;color:#ff8a3d;
          text-align:center;padding:24px 16px;background:#fff;border-radius:14px;
          border:2px solid #ffd0a8;margin-bottom:24px">${otp}</div>
        <p style="color:#aaa;font-size:12px;margin:0;line-height:1.6">
          Kód platí <strong>10 minut</strong>. Nikomu ho nesdělujte.<br>
          Pokud jste o kód nežádali, tento email ignorujte.
        </p>
        <hr style="border:none;border-top:1px solid #edd8a8;margin:24px 0">
        <p style="color:#c0a070;font-size:12px;margin:0">Tým Žiju 60 plus · ziju60plus.cz</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`,
    }),
  });

  if (!res.ok) {
    console.error("Resend error:", await res.text());
    return { statusCode: 500, body: JSON.stringify({ error: "Nepodařilo se odeslat email. Zkuste to znovu." }) };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  };
};
