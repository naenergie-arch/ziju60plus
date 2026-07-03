async function makeHmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let email;
  try {
    const body = await request.json();
    email = (body.email || "").trim().toLowerCase();
  } catch (_) {}

  if (!email || !email.includes("@") || !email.includes(".")) {
    return new Response(JSON.stringify({ error: "Zadejte platný email." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const RESEND_KEY = env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    return new Response(JSON.stringify({ error: "Emailová služba není nakonfigurována." }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const ts = Date.now();
  const payload = `${email}|${otp}|${ts}`;
  const hmac = await makeHmac(env.OTP_SECRET || "ziju60plus-otp-secret-2026", payload);
  const token = btoa(payload) + "." + hmac;

  const FROM_EMAIL = env.FROM_EMAIL || "Žiju 60 plus <noreply@ziju60plus.cz>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      reply_to: "info@ziju60plus.cz",
      to: email,
      subject: `${otp} – váš kód pro Žiju 60 plus`,
      html: `<!DOCTYPE html>
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
    const errText = await res.text();
    console.error("Resend error:", errText);
    return new Response(JSON.stringify({ error: "Nepodařilo se odeslat email. Zkuste to znovu." }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ token }), {
    headers: { "Content-Type": "application/json" }
  });
}
