const DAY_NAMES = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];

const AREA_TASKS = {
  "Pohyb": ["10 minut procházka", "Lehké protažení doma", "Procházka v parku"],
  "Energie": ["Vypijte sklenici vody hned po ránu", "10 minut odpočinku bez telefonu", "Krátký pobyt na čerstvém vzduchu"],
  "Vztahy": ["Zavolejte někomu blízkému", "Napište zprávu příteli", "Pozdravte sousedy"],
  "Spánek": ["Jděte spát ve stejný čas jako včera", "Vypněte obrazovky hodinu před spaním", "Krátké večerní protažení"],
  "Motivace": ["Vyberte si jednu drobnou radost na dnešek", "Udělejte jednu věc, na kterou jste se chystali", "Napište si, co se vám dnes povedlo"],
};

function buildWeek(topAreaNames) {
  const areas = topAreaNames.length ? topAreaNames : ["Pohyb", "Energie", "Vztahy"];
  const week = [];
  for (let i = 0; i < 7; i++) {
    const area = areas[i % areas.length];
    const tasks = AREA_TASKS[area] || ["Udělejte si dnes chvíli pro sebe"];
    const task = tasks[Math.floor(i / areas.length) % tasks.length];
    week.push({ day: DAY_NAMES[i], area, task });
  }
  return week;
}

function loadDoneState() {
  return JSON.parse(localStorage.getItem("ziju60_plan_done") || "{}");
}

function saveDoneState(state) {
  localStorage.setItem("ziju60_plan_done", JSON.stringify(state));
}

function render() {
  const topAreaNames = JSON.parse(localStorage.getItem("ziju60_top_areas") || "[]");
  const week = buildWeek(topAreaNames);
  const doneState = loadDoneState();
  const container = document.getElementById("planDays");

  container.innerHTML = week.map((d, i) => `
    <label class="day-card ${doneState[i] ? "done" : ""}" data-index="${i}">
      <span class="label">
        <span class="day-name">${d.day} – ${d.area}</span>
        <span class="task">${d.task}</span>
      </span>
      <input type="checkbox" ${doneState[i] ? "checked" : ""}>
    </label>
  `).join("");

  container.querySelectorAll("input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", (e) => {
      const idx = e.target.closest(".day-card").dataset.index;
      const state = loadDoneState();
      state[idx] = e.target.checked;
      saveDoneState(state);
      e.target.closest(".day-card").classList.toggle("done", e.target.checked);
    });
  });
}

render();
