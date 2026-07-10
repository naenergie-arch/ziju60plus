const TAX_RATE_ID = "txr_1Trez5JyFHoBa8v7MctH7U1D";

const PRICES = {
  access30:  "price_1TreNRJyFHoBa8v7INRNkWFa",  // 299 Kč – 30 dní, jednorázová
  direct90:  "price_1TreQ5JyFHoBa8v7xc1vGjBD",  // 699 Kč – 90 dní přímo, jednorázová
  upgrade90: "price_1TreROJyFHoBa8v7IOyS3oTq",  // 400 Kč – upgrade z 30 na 90 dní
  yearly:    "",  // roční předplatné – připravujeme
};

const PLAN_LABELS = {
  access30:  "Přístup na 30 dní (299 Kč)",
  direct90:  "Přístup na 90 dní (699 Kč)",
  upgrade90: "Upgrade na 90 dní (400 Kč)",
  yearly:    "Roční předplatné (499 Kč/rok)",
};

export async function onRequestPost(context) {
  const { request, env } = context;

  const STRIPE_KEY = env.STRIPE_SECRET_KEY;
  const SITE_URL = "https://ziju60plus.cz";

  let plan = "access30";
  try {
    const body = await request.json();
    if (body.plan && PRICES[body.plan]) plan = body.plan;
  } catch (_) {}

  const priceId = PRICES[plan];
  const isSubscription = plan === "yearly";

  let sessionConfig = {
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    tax_id_collection: { enabled: true },
    success_url: `${SITE_URL}/dekujeme.html?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${SITE_URL}/result.html`,
    metadata: { plan, plan_label: PLAN_LABELS[plan] },
  };

  if (isSubscription) {
    sessionConfig.mode = "subscription";
    sessionConfig.line_items = [{ price: priceId, quantity: 1 }];
    sessionConfig.subscription_data = {
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
