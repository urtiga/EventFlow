const CONFIG = {
  DAYS: ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"],
  PLATFORMS: {
    // Trocando para nomes genéricos ou fallbacks seguros
    twitch: { icon: "monitor-play", class: "p-twitch" }, // Ícone de monitor com play (parece streaming)
    youtube: { icon: "play", class: "p-youtube" }, // Ícone de triângulo de play (universal do YT)
    crunchyroll: { icon: "clapperboard", class: "p-crunchy" },
    "prime video": { icon: "play-circle", class: "p-prime" },
    "hbo max": { icon: "tv", class: "p-hbo" },
    espn: { icon: "trophy", class: "p-espn" },
    netflix: { icon: "film", class: "p-netflix" },
  },
};
let scheduleData = JSON.parse(localStorage.getItem("mySchedule")) || {};
let editState = { index: null, day: null };

const elements = {
  form: document.getElementById("schedule-form"),
  container: document.getElementById("schedule-container"),
  submitBtn: document.getElementById("submit-btn"),
  clearBtn: document.getElementById("clear-btn"),
};

const init = () => {
  setupTimeSelectors();
  CONFIG.DAYS.forEach((day) => {
    if (!scheduleData[day]) scheduleData[day] = [];
  });
  render();
};

const setupTimeSelectors = () => {
  const hSelect = document.getElementById("hour");
  const mSelect = document.getElementById("minute");
  for (let i = 0; i < 24; i++)
    hSelect.add(new Option(i.toString().padStart(2, "0")));
  for (let i = 0; i < 60; i += 5)
    mSelect.add(new Option(i.toString().padStart(2, "0")));
};

const render = () => {
  elements.container.innerHTML = "";

  CONFIG.DAYS.forEach((day) => {
    const dayColumn = document.createElement("section");
    dayColumn.className = "day-column";
    dayColumn.innerHTML = `<h2 class="day-label">${day}</h2>`;

    const events = [...scheduleData[day]].sort((a, b) =>
      a.time.localeCompare(b.time),
    );

    events.forEach((event, index) => {
      const platform = CONFIG.PLATFORMS[event.place.toLowerCase()] || {
        icon: "external-link",
        class: "",
      };

      const card = document.createElement("article");
      card.className = `event-card ${platform.class}`;
      card.innerHTML = `
        <strong class="event-title">${event.title}</strong>
        <div class="event-meta">
          <span class="meta-item"><i data-lucide="clock"></i> ${event.time}</span>
          <span class="meta-item"><i data-lucide="${platform.icon}"></i> ${event.place}</span>
        </div>
        <div class="card-actions">
          <button class="btn-icon edit" title="Editar" onclick="handleEdit('${day}', ${index})"><i data-lucide="pencil"></i></button>
          <button class="btn-icon delete" title="Excluir" onclick="handleDelete('${day}', ${index})"><i data-lucide="trash-2"></i></button>
        </div>
      `;
      dayColumn.appendChild(card);
    });
    elements.container.appendChild(dayColumn);
  });
  if (window.lucide) lucide.createIcons();
};

elements.form.onsubmit = (e) => {
  e.preventDefault();
  const day = document.getElementById("day").value;
  const newEvent = {
    title: document.getElementById("title").value,
    time: `${document.getElementById("hour").value}:${document.getElementById("minute").value}`,
    place: document.getElementById("place").value,
  };

  if (editState.index !== null) {
    scheduleData[editState.day].splice(editState.index, 1);
    resetEditState();
  }

  scheduleData[day].push(newEvent);
  save();
};

window.handleEdit = (day, index) => {
  const item = scheduleData[day][index];
  const [h, m] = item.time.split(":");

  document.getElementById("title").value = item.title;
  document.getElementById("hour").value = h;
  document.getElementById("minute").value = m;
  document.getElementById("place").value = item.place;
  document.getElementById("day").value = day;

  editState = { index, day };
  elements.submitBtn.textContent = "Salvar";
  elements.submitBtn.classList.add("btn-edit-mode");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.handleDelete = (day, index) => {
  if (confirm("Excluir evento?")) {
    scheduleData[day].splice(index, 1);
    save();
  }
};

const save = () => {
  localStorage.setItem("mySchedule", JSON.stringify(scheduleData));
  render();
  elements.form.reset();
};

elements.clearBtn.onclick = () => {
  if (confirm("Limpar toda a semana?")) {
    localStorage.clear();
    location.reload();
  }
};

const resetEditState = () => {
  editState = { index: null, day: null };
  elements.submitBtn.textContent = "Adicionar";
  elements.submitBtn.classList.remove("btn-edit-mode");
};

init();
