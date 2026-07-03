const TAX_RATE_ID = "txr_1TmaxLF5lonqYFYRVXAdkm3K";

const PRICES = {
  trial30:  "price_1To0pWF5lonqYFYRvyYB3yd6",
  trial90:  "price_1To0pXF5lonqYFYRoEw1DEtd",
  direct30: "price_1To0pXF5lonqYFYRAtNHT8d6",
  direct90: "price_1To0pXF5lonqYFYR6NI9L3r4",
};

const PLAN_LABELS = {
  trial30:  "7 dní zdarma → pak 30 dní (299 Kč)",
  trial90:  "7 dní zdarma → pak 90 dní (699 Kč)",
  direct30: "30 dní (299 Kč)",
  direct90: "90 dní (699 Kč)",
};

export async function onRequestPost(context) {
  const { request, env } = context;

  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const SITE_URL = "https://ziju60plus.cz";

  let plan = "trial30";
  try {
    const body = await request.json();
    if (body.plan && PRICES[body.plan]) plan = body.plan;
  } catch (_) {}

  const priceId = PRICES[plan];
  const isSubscription = plan.startsWith("trial");

  let sessionConfig = {
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    success_url: `${SITE_URL}/dekujeme.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${SITE_URL}/#cenik`,
    metadata: { plan, plan_label: PLAN_LABELS[plan] },
  };

  if (isSubscription) {
    sessionConfig.mode = "subscription";
    sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    sessionConfig.subscription_data = {
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: { plan, plan_label: PLAN_LABELS[plan] },
    };
  } else {
    sessionConfig.mode = "payment";
    sessionConfig.customer_creation = "always";
    sessionConfig.line_items = [{ price: priceId, quantity: 1, tax_rates: [TAX_RATE_ID] }];
    sessionConfig.invoice_creation = { enabled: true };
  }

  try {
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: buildStripeParams(sessionConfig),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Stripe error");

    return new Response(JSON.stringify({ url: data.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

function buildStripeParams(obj, prefix = "") {
  const parts = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (val === null || val === undefined) continue;
    if (typeof val === "object" && !Array.isArray(val)) {
      parts.push(buildStripeParams(val, fullKey));
    } else if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === "object") {
          parts.push(buildStripeParams(item, `${fullKey}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${fullKey}[${i}]`)}=${encodeURIComponent(item)}`);
        }
      });
    } else {
      parts.push(`${encodeURIComponent(fullKey)}=${encodeURIComponent(val)}`);
    }
  }
  return parts.join("&");
}
