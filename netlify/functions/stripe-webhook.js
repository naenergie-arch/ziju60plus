const Stripe = require("stripe");

const SITE_URL = "https://adorable-cranachan-cb596f.netlify.app";

exports.handler = async (event) => {
  const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook signature error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {

      // ── Checkout dokončen ──────────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = stripeEvent.data.object;
        // Jednorázová platba → odeslat fakturu
        if (session.invoice && session.mode === "payment") {
          await stripe.invoices.sendInvoice(session.invoice);
        }
        // Subscription trial → uložit plan do subscription metadata (už tam je)
        break;
      }

      // ── Faktura zaplacena (po skončení trialu nebo přímá platba) ──────────
      case "invoice.payment_succeeded": {
        const invoice = stripeEvent.data.object;
        if (invoice.status === "paid" && invoice.customer) {
          // Odeslat fakturu zákazníkovi
          try { await stripe.invoices.sendInvoice(invoice.id); } catch (_) {}

          // Po první platbě u subscription – zrušíme auto-renewal
          // (plán je jednorázový, zákazník dostane nabídku prodloužení emailem)
          if (invoice.subscription && invoice.billing_reason === "subscription_cycle") {
            const sub = await stripe.subscriptions.retrieve(invoice.subscription);
            const plan = sub.metadata?.plan || "";
            // 30denní plán → po prvním cyklu zrušit, nabídnout upgrade
            // 90denní plán → po prvním cyklu zrušit, nabídnout roční
            if (["trial30", "trial90"].includes(plan)) {
              await stripe.subscriptions.update(invoice.subscription, {
                cancel_at_period_end: true,
              });
            }
          }
        }
        break;
      }

      // ── Trial končí za 3 dny – Stripe pošle email automaticky ────────────
      // (je třeba povolit v Stripe Dashboard → Settings → Emails → Trial ends soon)
      case "customer.subscription.trial_will_end": {
        // Stripe odešle email sám – zde jen logujeme
        const sub = stripeEvent.data.object;
        console.log(`Trial ending for subscription ${sub.id}, customer ${sub.customer}`);
        break;
      }

      // ── Subscription zrušena ──────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = stripeEvent.data.object;
        console.log(`Subscription cancelled: ${sub.id}`);
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error("Webhook handler error:", err.message);
    return { statusCode: 500, body: err.message };
  }

  return { statusCode: 200, body: "ok" };
};
