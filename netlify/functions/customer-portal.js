const Stripe = require("stripe");

const SITE_URL = "https://adorable-cranachan-cb596f.netlify.app";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

  let customerId;
  try {
    const body = JSON.parse(event.body || "{}");
    customerId = body.customer_id;
  } catch (_) {}

  if (!customerId) {
    return { statusCode: 400, body: JSON.stringify({ error: "customer_id required" }) };
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${SITE_URL}/dekujeme.html`,
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
