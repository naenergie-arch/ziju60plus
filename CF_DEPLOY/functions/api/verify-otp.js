async function makeHmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const OTP_TTL_MS = 10 * 60 * 1000;

export async function onRequestPost(context) {
  const { request, env } = context;

  let email, otp, token;
  try {
    const b = await request.json();
    email = (b.email || "").trim().toLowerCase();
    otp   = (b.otp   || "").trim();
    token = (b.token  || "").trim();
  } catch (_) {}

  if (!email || !otp || !token) {
    return new Response(JSON.stringify({ error: "Chybí údaje." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const dotIdx = token.lastIndexOf(".");
  if (dotIdx < 0) {
    return new Response(JSON.stringify({ error: "Neplatný token." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const payloadB64 = token.slice(0, dotIdx);
  const hmacReceived = token.slice(dotIdx + 1);

  let payload;
  try {
    payload = atob(payloadB64);
  } catch (_) {
    return new Response(JSON.stringify({ error: "Neplatný token." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const SECRET = env.OTP_SECRET || "ziju60plus-otp-secret-2026";
  const expectedHmac = await makeHmac(SECRET, payload);

  if (!timingSafeEqual(hexToBytes(hmacReceived), hexToBytes(expectedHmac))) {
    return new Response(JSON.stringify({ error: "Neplatný kód." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const parts = payload.split("|");
  if (parts.length !== 3) {
    return new Response(JSON.stringify({ error: "Neplatný token." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const [tokenEmail, tokenOtp, tsStr] = parts;

  if (tokenEmail !== email) {
    return new Response(JSON.stringify({ error: "Neplatný kód." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  if (Date.now() - parseInt(tsStr, 10) > OTP_TTL_MS) {
    return new Response(JSON.stringify({ error: "Kód vypršel. Klikněte na „Odeslat znovu"." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  if (tokenOtp !== otp) {
    return new Response(JSON.stringify({ error: "Nesprávný kód. Zkuste to znovu." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
