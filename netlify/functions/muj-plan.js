const Stripe = require("stripe");

const SITE_URL = "https://ziju60plus.cz";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let email;
  try {
    const body = JSON.parse(event.body || "{}");
    email = (body.email || "").trim().toLowerCase();
  } catch (_) {}

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email je povinný." }) };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Najdi zákazníka podle emailu
    const customers = await stripe.customers.list({ email, limit: 5 });

    if (!customers.data.length) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Tento email jsme nenašli. Zaregistroval/a jste se pod jiným emailem?" }),
      };
    }

    // Vezmi nejnovějšího zákazníka
    const customer = customers.data[0];

    // Zjisti stav předplatného
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      limit: 1,
      status: "all",
    });

    const sub = subscriptions.data[0] || null;
    let status = "none";
    let trialEnd = null;
    let currentPeriodEnd = null;

    if (sub) {
      status = sub.status; // trialing, active, canceled, past_due...
      trialEnd = sub.trial_end;
      currentPeriodEnd = sub.current_period_end;
    }

    // Stripe portál jen pokud má smysl (existuje předplatné)
    let portalUrl = null;
    if (sub) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customer.id,
        return_url: `${SITE_URL}/muj-plan`,
      });
      portalUrl = session.url;
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        portalUrl,
        status,
        trialEnd,
        currentPeriodEnd,
        email: customer.email,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Chyba serveru: " + err.message }),
    };
  }
};
