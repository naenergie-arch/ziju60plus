const Stripe = require("stripe");

const TAX_RATE_ID = "txr_1TmaxLF5lonqYFYRVXAdkm3K";

const PRICES = {
  trial30:  "price_1To0pWF5lonqYFYRvyYB3yd6", // subscription 299 Kč/měsíc, 7d trial
  trial90:  "price_1To0pXF5lonqYFYRoEw1DEtd", // subscription 699 Kč/3měsíce, 7d trial
  direct30: "price_1To0pXF5lonqYFYRAtNHT8d6", // jednorázová 299 Kč
  direct90: "price_1To0pXF5lonqYFYR6NI9L3r4", // jednorázová 699 Kč
};

const PLAN_LABELS = {
  trial30:  "7 dní zdarma → pak 30 dní (299 Kč)",
  trial90:  "7 dní zdarma → pak 90 dní (699 Kč)",
  direct30: "30 dní (299 Kč)",
  direct90: "90 dní (699 Kč)",
};

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const origin = event.headers.origin || "https://adorable-cranachan-cb596f.netlify.app";

  let plan = "trial30";
  try {
    const body = JSON.parse(event.body || "{}");
    if (body.plan && PRICES[body.plan]) plan = body.plan;
  } catch (_) {}

  const priceId = PRICES[plan];
  const isSubscription = plan.startsWith("trial");

  try {
    let sessionConfig = {
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      tax_id_collection: { enabled: true },
      success_url: `${origin}/dekujeme.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${origin}/#cenik`,
      metadata: { plan, plan_label: PLAN_LABELS[plan] },
    };

    if (isSubscription) {
      // Trial varianta: subscription s 7denním zkušebním obdobím
      // Stripe automaticky vytvoří zákazníka v subscription mode
      sessionConfig.mode = "subscription";
      sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
      sessionConfig.subscription_data = {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: { missing_payment_method: "cancel" },
        },
        metadata: { plan, plan_label: PLAN_LABELS[plan] },
      };
    } else {
      // Přímá platba – customer_creation jen v payment mode
      sessionConfig.mode = "payment";
      sessionConfig.customer_creation = "always";
      sessionConfig.line_items = [
        { price: priceId, quantity: 1, tax_rates: [TAX_RATE_ID] },
      ];
      sessionConfig.invoice_creation = { enabled: true };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error("Stripe error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
