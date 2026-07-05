// Plány, které vedou na kvíz (7 dní zdarma, bez karty)
const QUIZ_REDIRECTS = {
  trial7:  '/quiz.html',
  trial30: '/quiz.html?plan=30d',
  trial90: '/quiz.html?plan=90d',
};

// Volání Stripe Checkout pro placené varianty plánu
async function startCheckout(plan) {
  const btn = document.querySelector(`[data-plan="${plan}"]`);
  if (btn) {
    btn.textContent = "Přesměrováváme…";
    btn.style.opacity = "0.7";
    btn.style.pointerEvents = "none";
  }

  try {
    const res = await fetch("/api/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Chyba při vytváření objednávky: " + (data.error || "zkuste to znovu"));
      if (btn) { btn.textContent = btn.dataset.label; btn.style.opacity = ""; btn.style.pointerEvents = ""; }
    }
  } catch (err) {
    alert("Síťová chyba – zkuste to prosím znovu.");
    if (btn) { btn.textContent = btn.dataset.label; btn.style.opacity = ""; btn.style.pointerEvents = ""; }
  }
}

// Napoj všechna tlačítka s data-plan atributem
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-plan]").forEach(btn => {
    btn.dataset.label = btn.textContent;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const plan = btn.dataset.plan;
      if (QUIZ_REDIRECTS[plan]) {
        window.location.href = QUIZ_REDIRECTS[plan];
      } else {
        startCheckout(plan);
      }
    });
  });
});
