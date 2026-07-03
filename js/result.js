const LIB_SHEET_ID = "1_bDZt1PwvIZgkIKVUJBEr8fk4477JHiEsZgQJRTge0U";
const SHEET_ACT = "Knihovna aktivit";

const AREA_DEFS = [
  { key: "n1", name: "Pohyb", keywords: ["pohyb", "chůze", "procházka", "cvičení"], fallback: "Krátká procházka nebo lehké cvičení každý den." },
  { key: "n2", name: "Energie", keywords: ["energie", "únava"], fallback: "Pravidelný odpočinek a dostatek pitného režimu během dne." },
  { key: "n3", name: "Vztahy", keywords: ["vztah", "kontakt", "lidé", "rodina"], fallback: "Zavolejte nebo se setkejte s někým blízkým." },
  { key: "n4", name: "Spánek", keywords: ["spánek", "spát"], fallback: "Pravidelný čas usínání a klidný večerní rituál." },
  { key: "n5", name: "Motivace", keywords: ["motivace", "chuť", "aktivita"], fallback: "Vyberte si jednu drobnou aktivitu, která vás baví." },
];

function csvUrl(sheetId, sheetName) {
  return "https://docs.google.com/spreadsheets/d/" + sheetId +
    "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(sheetName);
}

function parseCSV(text) {
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

function pickActivity(rows, areaDef) {
  const match = rows.find(r => {
    const blob = ((r["Oblast"] || "") + " " + (r["Podoblast"] || "") + " " +
      (r["Název_aktivity"] || "")).toLowerCase();
    return areaDef.keywords.some(k => blob.includes(k));
  });

  if (!match) {
    return { name: areaDef.name, popis: areaDef.fallback, prinos: "", links: [] };
  }

  const links = [1, 2, 3, 4, 5]
    .map(n => ({ nazev: match[`Odkaz${n}_název`], url: match[`Odkaz${n}_URL`] }))
    .filter(l => l.url);

  const cleanText = (s) => (s || "").replace(/<\/?p>/gi, " ").trim();
  const isPlaceholder = (s) => !s || /prázdn/i.test(s);

  const prinosRaw = match["Užitek_nebo_přínos"] || "";

  return {
    name: match["Název_aktivity"] || areaDef.name,
    popis: cleanText(match["Popis_aktivity"]) || areaDef.fallback,
    prinos: isPlaceholder(prinosRaw) ? "" : cleanText(prinosRaw),
    links,
  };
}

function countLibrary(rows) {
  const oblasti = new Set(rows.map(r => r["Oblast"]).filter(Boolean));
  return { aktivit: rows.length, oblasti: oblasti.size };
}

function getTopAreas(answers) {
  return AREA_DEFS
    .map(def => ({ ...def, score: answers[def.key] ?? 3 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}

function renderAreas(topAreas, libRows) {
  const stats = countLibrary(libRows);
  const activities = topAreas.map(area => pickActivity(libRows, area));

  localStorage.setItem("ziju60_top_activities", JSON.stringify(activities));

  const container = document.getElementById("areas");
  container.innerHTML = activities.map(act => `
    <div class="card">
      <div class="h">${act.name}</div>
      <p>${act.popis}</p>
      ${act.prinos ? `<p class="benefit">Přínos: ${act.prinos}</p>` : ""}
      ${act.links.length ? `<p class="links">${act.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener">${l.nazev || "Odkaz"}</a>`).join(" · ")}</p>` : ""}
    </div>
  `).join("");

  if (stats.aktivit) {
    const libNote = document.createElement("p");
    libNote.className = "note";
    libNote.textContent = `Plán vychází z knihovny ${stats.aktivit} aktivit ve ${stats.oblasti} oblastech života, s konkrétními tipy, přínosy a odkazy na ověřené zdroje.`;
    document.querySelector(".result-wrap").insertBefore(libNote, document.getElementById("areas"));
  }

  document.getElementById("loadingMsg").style.display = "none";

  const orderBtn = document.createElement("a");
  orderBtn.href = "plan.html";
  orderBtn.className = "btn-continue";
  orderBtn.textContent = "Zobrazit svůj plán na 7 dní zdarma →";
  document.querySelector(".result-wrap").appendChild(orderBtn);

  const priceNote = document.createElement("p");
  priceNote.className = "note";
  priceNote.textContent = "7denní plán je zdarma. Delší plán (30 nebo 90 dní) si budete moct objednat později přímo ve svém plánu.";
  document.querySelector(".result-wrap").appendChild(priceNote);
}

async function startCheckout() {
  const btn = event.target;
  btn.disabled = true;
  btn.textContent = "Přesměrovávám na platbu…";
  try {
    const res = await fetch("/api/create-checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      throw new Error(data.error || "Neznámá chyba");
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "Objednat svůj plán na 7 dní – 499 Kč";
    alert("Platbu se nepodařilo zahájit. Zkuste to prosím znovu.");
  }
}

async function loadInsight(answers) {
  const box = document.getElementById("insightBox");
  try {
    const res = await fetch("/api/diagnosticky-postreh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });
    const data = await res.json();
    if (data.postreh) {
      box.innerHTML = `<p class="insight-text">${data.postreh}</p>`;
    } else {
      box.style.display = "none";
    }
  } catch (e) {
    box.style.display = "none";
  }
}

(async function () {
  const stored = localStorage.getItem("ziju60_answers");
  if (!stored) {
    window.location.href = "quiz.html";
    return;
  }
  const answers = JSON.parse(stored);
  const topAreas = getTopAreas(answers);
  localStorage.setItem("ziju60_top_areas", JSON.stringify(topAreas.map(a => a.name)));

  loadInsight(answers);

  try {
    const res = await fetch(csvUrl(LIB_SHEET_ID, SHEET_ACT));
    const text = await res.text();
    const libRows = parseCSV(text);
    renderAreas(topAreas, libRows);
  } catch (e) {
    renderAreas(topAreas, []);
  }
})();
