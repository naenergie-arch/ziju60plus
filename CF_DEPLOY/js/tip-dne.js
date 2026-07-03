const TIPY_SHEET_ID = "1_bDZt1PwvIZgkIKVUJBEr8fk4477JHiEsZgQJRTge0U";
const TIPY_SHEET_NAME = "Typy dne";
const LAUNCH_DATE = new Date("2026-07-01");

function tipyCsvUrl() {
  return "https://docs.google.com/spreadsheets/d/" + TIPY_SHEET_ID +
    "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(TIPY_SHEET_NAME);
}

function parseTipyCSV(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"') {
      if (q && n === '"') { cell += '"'; i++; }
      else q = !q;
    } else if (c === "," && !q) {
      row.push(cell); cell = "";
    } else if ((c === "\n" || c === "\r") && !q) {
      if (cell !== "" || row.length) { row.push(cell); rows.push(row.slice()); }
      row.length = 0; cell = "";
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(r => {
    const obj = {};
    header.forEach((h, idx) => obj[h.trim()] = (r[idx] || "").trim());
    return obj;
  });
}

function daysSinceLaunch() {
  const diff = new Date() - LAUNCH_DATE;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function buildSourceHtml(tip) {
  const zdrojUrl   = tip.Zdroj_URL || tip.Zdroj_url || tip.URL || "";
  const zdrojNazev = tip.Zdroj_nazev || tip.Zdroj || "";
  let html = "";
  if (zdrojUrl) {
    html += `Zdroj: <a href="${zdrojUrl}" target="_blank" rel="noopener">${zdrojNazev || "vědecká studie"}</a>`;
  } else if (zdrojNazev) {
    html += `Zdroj: ${zdrojNazev}`;
  }
  if (zdrojUrl) {
    html += ` &nbsp;·&nbsp; <span class="tip-translate-hint">Stránka může být v angličtině – Chrome a Edge ji přeloží automaticky.</span>`;
  }
  return html;
}

async function loadTipDne() {
  const box = document.getElementById("tipDneBox");
  if (!box) return;
  try {
    const res = await fetch(tipyCsvUrl());
    const text = await res.text();
    const rows = parseTipyCSV(text).filter(r => r.Text);
    if (!rows.length) { box.style.display = "none"; return; }

    const idx = daysSinceLaunch() % rows.length;
    const tip = rows[idx];

    box.querySelector(".tip-text").textContent = tip.Text;
    const sourceEl = box.querySelector(".tip-source");
    sourceEl.innerHTML = buildSourceHtml(tip);
  } catch (e) {
    box.style.display = "none";
  }
}

loadTipDne();
