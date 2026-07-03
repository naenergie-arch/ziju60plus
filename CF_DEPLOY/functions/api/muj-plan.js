const SITE_URL = "https://ziju60plus.cz";

async function stripeGet(path, key) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function stripePost(path, key, params) {
  const body = new URLSearchParams(params).toString();
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let email;
  try {
    const body = await request.json();
    email = (body.email || "").trim().toLowerCase();
  } catch (_) {}

  if (!email) {
    return new Response(JSON.stringify({ error: "Email je povinný." }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const STRIPE_KEY = env.STRIPE_SECRET_KEY;

  try {
    const customers = await stripeGet(`/customers?email=${encodeURIComponent(email)}&limit=5`, STRIPE_KEY);

    if (!customers.data.length) {
      return new Response(JSON.stringify({
        error: "Tento email jsme nenašli. Zaregistroval/a jste se pod jiným emailem?"
      }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const customer = customers.data[0];

    const subscriptions = await stripeGet(
      `/subscriptions?customer=${customer.id}&limit=1&status=all`, STRIPE_KEY
    );

    const sub = subscriptions.data[0] || null;
    let status = "none";
    let trialEnd = null;
    let currentPeriodEnd = null;

    if (sub) {
      status = sub.status;
      trialEnd = sub.trial_end;
      currentPeriodEnd = sub.current_period_end;
    }

    let portalUrl = null;
    if (sub) {
      const session = await stripePost("/billing_portal/sessions", STRIPE_KEY, {
        customer: customer.id,
        return_url: `${SITE_URL}/muj-plan`,
      });
      portalUrl = session.url;
    }

    return new Response(JSON.stringify({
      portalUrl, status, trialEnd, currentPeriodEnd, email: customer.email,
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: "Chyba serveru: " + err.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
