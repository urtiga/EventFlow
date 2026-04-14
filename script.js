const form = document.getElementById("schedule-form");
const container = document.getElementById("schedule-container");
const submitBtn = document.getElementById("submit-btn");

const DAYS = [
  "SEGUNDA",
  "TERÇA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÁBADO",
  "DOMINGO",
];
let scheduleData = JSON.parse(localStorage.getItem("mySchedule")) || {};
let editState = { index: null, day: null };

const platformIcons = {
  twitch: "twitch",
  youtube: "youtube",
  crunchyroll: "clapperboard",
  "prime video": "play-circle",
  "hbo max": "tv",
  "disney+": "monitor",
  espn: "trophy",
  "globo / premiere": "tv-2",
  netflix: "film",
};

const init = () => {
  populateTimeSelectors();
  DAYS.forEach((day) => {
    if (!scheduleData[day]) scheduleData[day] = [];
  });
  render();
};

const populateTimeSelectors = () => {
  const hSelect = document.getElementById("hour");
  const mSelect = document.getElementById("minute");
  for (let i = 0; i < 24; i++)
    hSelect.add(
      new Option(i.toString().padStart(2, "0"), i.toString().padStart(2, "0")),
    );
  for (let i = 0; i < 60; i += 5)
    mSelect.add(
      new Option(i.toString().padStart(2, "0"), i.toString().padStart(2, "0")),
    );
};

const render = () => {
  container.innerHTML = "";
  DAYS.forEach((day) => {
    const dayDiv = document.createElement("div");
    dayDiv.className = "day-column";
    dayDiv.innerHTML = `<h2 class="day-name">${day}</h2>`;

    scheduleData[day].sort((a, b) => a.time.localeCompare(b.time));

    scheduleData[day].forEach((item, index) => {
      const platformKey = item.place.toLowerCase().trim();

      // Força o ícone da Twitch
      let iconName = platformIcons[platformKey] || "external-link";
      if (platformKey.includes("twitch")) iconName = "twitch";

      const platformClass = platformKey
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");
      const finalClass = item.type === "nba" ? "nba" : platformClass;

      dayDiv.innerHTML += `
                <article class="card ${finalClass}">
                    <div class="card-title">${item.title}</div>
                    <div class="card-info">
                        <div class="info-item">
                            <i data-lucide="clock"></i>
                            <span>${item.time}</span>
                        </div>
                        <div class="info-item">
                            <i data-lucide="${iconName}"></i>
                            <span>${item.place}</span>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button type="button" class="icon-btn edit" onclick="prepareEdit('${day}', ${index})">
                            <i data-lucide="pencil"></i>
                        </button>
                        <button type="button" class="icon-btn delete" onclick="deleteItem('${day}', ${index})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </article>`;
    });
    container.appendChild(dayDiv);
  });
  if (window.lucide) lucide.createIcons();
};

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const time = `${document.getElementById("hour").value}:${document.getElementById("minute").value}`;
  const newItem = {
    title: document.getElementById("title").value,
    time: time,
    place: document.getElementById("place").value,
    type: document.getElementById("type").value,
  };
  const selectedDay = document.getElementById("day").value;

  if (editState.index !== null) {
    scheduleData[editState.day].splice(editState.index, 1);
    resetEditState();
  }

  scheduleData[selectedDay].push(newItem);
  saveAndRender();
  form.reset();
});

window.prepareEdit = (day, index) => {
  const item = scheduleData[day][index];
  const [h, m] = item.time.split(":");
  document.getElementById("title").value = item.title;
  document.getElementById("hour").value = h;
  document.getElementById("minute").value = m;
  document.getElementById("place").value = item.place;
  document.getElementById("day").value = day;
  document.getElementById("type").value = item.type;
  editState = { index, day };
  submitBtn.innerText = "Salvar Alteração";
  submitBtn.style.background = "var(--green)";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const resetEditState = () => {
  editState = { index: null, day: null };
  submitBtn.innerText = "Adicionar";
  submitBtn.style.background = "var(--blue)";
};

window.deleteItem = (day, index) => {
  if (confirm("Remover evento?")) {
    scheduleData[day].splice(index, 1);
    saveAndRender();
  }
};

const saveAndRender = () => {
  localStorage.setItem("mySchedule", JSON.stringify(scheduleData));
  render();
};

document.getElementById("clear-btn").onclick = () => {
  if (confirm("Limpar toda a semana?")) {
    localStorage.clear();
    location.reload();
  }
};

init();
