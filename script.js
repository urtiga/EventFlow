const CONFIG = {
  DAYS: ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"],
  PLATFORMS: {
    twitch: { icon: "monitor-play", class: "p-twitch", label: "Twitch", url: "https://www.twitch.tv" },
    youtube: { icon: "play", class: "p-youtube", label: "Youtube", url: "https://www.youtube.com" },
    crunchyroll: { icon: "clapperboard", class: "p-crunchy", label: "Crunchyroll", url: "https://www.crunchyroll.com" },
    "prime video": { icon: "play-circle", class: "p-prime", label: "Prime Video", url: "https://www.primevideo.com" },
    "hbo max": { icon: "tv", class: "p-hbo", label: "HBO Max", url: "https://www.max.com" },
    disney: { icon: "sparkles", class: "p-disney", label: "Disney+", url: "https://www.disneyplus.com" },
    "disney+": { icon: "sparkles", class: "p-disney", label: "Disney+", url: "https://www.disneyplus.com" },
    netflix: { icon: "film", class: "p-netflix", label: "Netflix", url: "https://www.netflix.com" },
  },
};

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const WEEKDAYS = ["DOMINGO", "SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO"];

const STATE = {
  viewMode: "weekly",
  monthOffset: 0,
};

let scheduleData = JSON.parse(localStorage.getItem("mySchedule")) || [];
let editState = null;
let modalConfirmCallback = null;
let deleteChoiceState = null;

const elements = {
  form: document.getElementById("schedule-form"),
  container: document.getElementById("schedule-container"),
  submitBtn: document.getElementById("submit-btn"),
  clearBtn: document.getElementById("clear-btn"),
  scheduleSummary: document.getElementById("schedule-summary"),
  calendarHeader: document.getElementById("calendar-header"),
  monthName: document.getElementById("calendar-month-name"),
  monthDesc: document.getElementById("calendar-month-desc"),
  weeklyViewBtn: document.getElementById("weekly-view-btn"),
  monthlyViewBtn: document.getElementById("monthly-view-btn"),
  prevMonthBtn: document.getElementById("prev-month-btn"),
  nextMonthBtn: document.getElementById("next-month-btn"),
  repeatType: document.getElementById("repeat-type"),
  daySelect: document.getElementById("day"),
  eventDate: document.getElementById("event-date"),
  eventDateField: document.getElementById("event-date-field"),
  repeatWeeks: document.getElementById("repeat-weeks"),
  repeatWeeksField: document.getElementById("repeat-weeks-field"),
  scheduleRow: document.getElementById("schedule-row"),
  placeSelect: document.getElementById("place"),
  customPlace: document.getElementById("custom-place"),
  customUrl: document.getElementById("custom-url"),
  toastContainer: document.getElementById("toast-container"),
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalMessage: document.getElementById("modal-message"),
  modalConfirm: document.getElementById("modal-confirm"),
  modalCancel: document.getElementById("modal-cancel"),
  deleteModalBackdrop: document.getElementById("delete-modal-backdrop"),
  deleteModalMessage: document.getElementById("delete-modal-message"),
  deleteSkipWeek: document.getElementById("delete-skip-week"),
  deleteAllWeeks: document.getElementById("delete-all-weeks"),
  deleteChoiceCancel: document.getElementById("delete-choice-cancel"),
  editModalBackdrop: document.getElementById("edit-modal-backdrop"),
  editForm: document.getElementById("edit-form"),
  editTitle: document.getElementById("edit-title"),
  editHour: document.getElementById("edit-hour"),
  editMinute: document.getElementById("edit-minute"),
  editRepeatType: document.getElementById("edit-repeat-type"),
  editDay: document.getElementById("edit-day"),
  editEventDate: document.getElementById("edit-event-date"),
  editEventDateField: document.getElementById("edit-event-date-field"),
  editRepeatWeeks: document.getElementById("edit-repeat-weeks"),
  editRepeatWeeksField: document.getElementById("edit-repeat-weeks-field"),
  editScheduleRow: document.getElementById("edit-schedule-row"),
  editPlace: document.getElementById("edit-place"),
  editCustomPlace: document.getElementById("edit-custom-place"),
  editCustomUrl: document.getElementById("edit-custom-url"),
  editCancel: document.getElementById("edit-cancel"),
};

const init = () => {
  const hadMissingIds = Array.isArray(scheduleData) && scheduleData.some((event) => !event.id);
  scheduleData = normalizeScheduleData(scheduleData);
  if (hadMissingIds) localStorage.setItem("mySchedule", JSON.stringify(scheduleData));
  setupTimeSelectors();
  bindEvents();
  setupSteppers();
  render();
};

const bindEvents = () => {
  elements.weeklyViewBtn.addEventListener("click", () => switchView("weekly"));
  elements.monthlyViewBtn.addEventListener("click", () => switchView("monthly"));
  elements.prevMonthBtn.addEventListener("click", () => {
    STATE.monthOffset -= 1;
    render();
  });
  elements.nextMonthBtn.addEventListener("click", () => {
    STATE.monthOffset += 1;
    render();
  });
  elements.repeatType.addEventListener("change", updateRepeatFields);
  elements.eventDate.addEventListener("change", updateDayFromDate);
  elements.placeSelect.addEventListener("change", updatePlaceFields);
  elements.editRepeatType.addEventListener("change", updateEditRepeatFields);
  elements.editEventDate.addEventListener("change", updateEditDayFromDate);
  elements.editPlace.addEventListener("change", updateEditPlaceFields);
  elements.editForm.addEventListener("submit", handleEditSubmit);
  elements.editCancel.addEventListener("click", hideEditModal);
  elements.editModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.editModalBackdrop) hideEditModal();
  });
  elements.modalCancel.addEventListener("click", hideModal);
  elements.modalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.modalBackdrop) hideModal();
  });
  elements.modalConfirm.addEventListener("click", () => {
    if (typeof modalConfirmCallback === "function") modalConfirmCallback();
    hideModal();
  });
  elements.deleteSkipWeek.addEventListener("click", () => {
    if (!deleteChoiceState) return;
    skipOccurrence(deleteChoiceState.id, deleteChoiceState.date);
    hideDeleteChoiceModal();
  });
  elements.deleteAllWeeks.addEventListener("click", () => {
    if (!deleteChoiceState) return;
    deleteEntireEvent(deleteChoiceState.id);
    hideDeleteChoiceModal();
  });
  elements.deleteChoiceCancel.addEventListener("click", hideDeleteChoiceModal);
  elements.deleteModalBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.deleteModalBackdrop) hideDeleteChoiceModal();
  });
  elements.container.addEventListener("click", (event) => {
    const btn = event.target.closest(".btn-action.edit, .btn-action.delete");
    if (!btn) return;
    const id = btn.dataset.eventId;
    if (!id) return;
    if (btn.classList.contains("edit")) handleEdit(id);
    else handleDelete(id, btn.dataset.eventDate);
  });
};

const setupSteppers = () => {
  document.querySelectorAll(".stepper-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.stepperTarget);
      if (!input) return;
      const step = Number(btn.dataset.step) || 0;
      const min = Number(input.min) || 1;
      const max = Number(input.max) || 52;
      const next = Math.min(max, Math.max(min, (Number(input.value) || min) + step));
      input.value = next;
    });
  });
};

const setupTimeSelectors = () => {
  const hSelect = document.getElementById("hour");
  const mSelect = document.getElementById("minute");
  for (let i = 0; i < 24; i++) {
    const label = i.toString().padStart(2, "0");
    hSelect.add(new Option(label));
    elements.editHour.add(new Option(label));
  }
  for (let i = 0; i < 60; i += 5) {
    const label = i.toString().padStart(2, "0");
    mSelect.add(new Option(label));
    elements.editMinute.add(new Option(label));
  }
  updateRepeatFields();
  updateEditRepeatFields();
  updatePlaceFields();
  updateEditPlaceFields();
};

const normalizeScheduleData = (data) => {
  let events = [];
  if (Array.isArray(data)) {
    events = data;
  } else if (data && typeof data === "object") {
    Object.entries(data).forEach(([day, list]) => {
      if (Array.isArray(list)) {
        list.forEach((item) => {
          events.push({
            id: generateId(),
            title: item.title,
            time: item.time,
            place: item.place,
            repeatType: "weekly",
            day,
            repeatWeeks: 52,
            startDate: getNextDateForDay(day),
          });
        });
      }
    });
  }
  return events.map((event) => ({
    ...event,
    id: event.id || generateId(),
    skippedDates: Array.isArray(event.skippedDates) ? event.skippedDates : [],
  }));
};

const getNextDateForDay = (dayName) => {
  const targetIndex = WEEKDAYS.indexOf(dayName);
  if (targetIndex < 0) return new Date();
  const today = new Date();
  const offset = (targetIndex - today.getDay() + 7) % 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
};

const generateId = () => `evt_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;

const getPlatform = (place, placeUrl = "") => {
  if (!place) {
    return { icon: "external-link", class: "", label: "Outro", url: normalizeUrl(placeUrl) };
  }
  const key = place.toLowerCase().trim();
  const aliases = { "disney plus": "disney" };
  const resolved = aliases[key] || key;
  const known = CONFIG.PLATFORMS[resolved];
  if (known) return known;
  return { icon: "external-link", class: "", label: place, url: normalizeUrl(placeUrl) };
};

const isKnownPlatform = (place) => {
  if (!place) return false;
  const key = place.toLowerCase().trim();
  const aliases = { "disney plus": "disney" };
  return Boolean(CONFIG.PLATFORMS[aliases[key] || key]);
};

const normalizeUrl = (url) => {
  const trimmed = url?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const readPlaceFromForm = (placeSelect, customPlaceInput, customUrlInput) => {
  const selected = placeSelect.value.trim();
  if (!selected || selected === "none") return { place: "", placeUrl: "" };
  if (selected === "other") {
    return {
      place: customPlaceInput.value.trim(),
      placeUrl: normalizeUrl(customUrlInput.value),
    };
  }
  return { place: selected, placeUrl: "" };
};

const updatePlaceFields = () => {
  const isOther = elements.placeSelect.value === "other";
  elements.customPlace.classList.toggle("hidden", !isOther);
  elements.customUrl.classList.toggle("hidden", !isOther);
};

const updateEditPlaceFields = () => {
  const isOther = elements.editPlace.value === "other";
  elements.editCustomPlace.classList.toggle("hidden", !isOther);
  elements.editCustomUrl.classList.toggle("hidden", !isOther);
};

const fillPlaceFields = (placeSelect, customPlaceInput, customUrlInput, event) => {
  if (isKnownPlatform(event.place)) {
    placeSelect.value = event.place;
    customPlaceInput.value = "";
    customUrlInput.value = "";
  } else if (event.place || event.placeUrl) {
    placeSelect.value = "other";
    customPlaceInput.value = event.place || "";
    customUrlInput.value = event.placeUrl || "";
  } else {
    placeSelect.value = "none";
    customPlaceInput.value = "";
    customUrlInput.value = "";
  }
};

const renderPlatformMeta = (platform) => {
  if (!platform.url) {
    return `<span class="meta-item"><i data-lucide="${platform.icon}"></i> ${platform.label}</span>`;
  }
  return `<a class="meta-item platform-link" href="${platform.url}" target="_blank" rel="noopener noreferrer" title="Abrir ${platform.label}"><i data-lucide="${platform.icon}"></i> ${platform.label}</a>`;
};

const updateRepeatFields = () => {
  const isUnique = elements.repeatType.value === "unique";
  elements.daySelect.classList.toggle("hidden", isUnique);
  elements.repeatWeeksField.classList.toggle("hidden", isUnique);
  elements.eventDateField.classList.toggle("hidden", !isUnique);
  elements.scheduleRow.classList.toggle("is-unique", isUnique);
  if (isUnique && elements.eventDate.value) {
    updateDayFromDate();
  }
};

const updateDayFromDate = () => {
  const selectedDate = elements.eventDate.value;
  if (!selectedDate) return;
  const date = new Date(selectedDate + "T00:00:00");
  const weekday = WEEKDAYS[date.getDay()];
  if (weekday) {
    elements.daySelect.value = weekday;
  }
};

const updateEditRepeatFields = () => {
  const isUnique = elements.editRepeatType.value === "unique";
  elements.editDay.classList.toggle("hidden", isUnique);
  elements.editRepeatWeeksField.classList.toggle("hidden", isUnique);
  elements.editEventDateField.classList.toggle("hidden", !isUnique);
  elements.editScheduleRow.classList.toggle("is-unique", isUnique);
  if (isUnique && elements.editEventDate.value) {
    updateEditDayFromDate();
  }
};

const updateEditDayFromDate = () => {
  const selectedDate = elements.editEventDate.value;
  if (!selectedDate) return;
  const date = new Date(selectedDate + "T00:00:00");
  const weekday = WEEKDAYS[date.getDay()];
  if (weekday) {
    elements.editDay.value = weekday;
  }
};

const switchView = (mode) => {
  STATE.viewMode = mode;
  elements.weeklyViewBtn.classList.toggle("active", mode === "weekly");
  elements.monthlyViewBtn.classList.toggle("active", mode === "monthly");
  render();
};

const render = () => {
  elements.container.innerHTML = "";
  elements.scheduleSummary.textContent = getSummaryText();

  if (STATE.viewMode === "monthly") {
    renderMonthly();
  } else {
    renderWeekly();
  }
};

const getSummaryText = () => {
  if (scheduleData.length === 0) {
    return "Nenhum evento cadastrado ainda. Adicione seus lançamentos e acompanhe no calendário.";
  }

  if (STATE.viewMode === "weekly") {
    const total = scheduleData.length;
    return (
      `Você tem ${total} evento${total > 1 ? "s" : ""} configurado${total > 1 ? "s" : ""}. ` +
      "Veja sua semana organizada por dia."
    );
  }

  const { count, monthName, year } = getMonthOccurrenceStats();
  if (count === 0) {
    return `Nenhum evento em ${monthName} de ${year}. Use as setas para navegar entre os meses.`;
  }

  return (
    `${count} evento${count > 1 ? "s" : ""} em ${monthName} de ${year}. ` +
    "Veja sua agenda no calendário mensal."
  );
};

const getMonthOccurrenceStats = () => {
  const baseDate = new Date();
  const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + STATE.monthOffset, 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let count = 0;

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber);
    count += getOccurrencesForDate(dateToString(date)).length;
  }

  return { count, monthName: MONTHS[month], year };
};

const renderWeekly = () => {
  elements.calendarHeader.classList.add("hidden");
  elements.container.className = "schedule-grid";
  const [weekStart, weekEnd] = getCurrentWeekRange();

  CONFIG.DAYS.forEach((day) => {
    const dayColumn = document.createElement("section");
    dayColumn.className = "day-column";
    dayColumn.innerHTML = `<h2 class="day-label">${day}</h2>`;

    const events = getOccurrencesForWeek(day, weekStart, weekEnd).sort((a, b) => a.time.localeCompare(b.time));

    if (events.length === 0) {
      const empty = document.createElement("p");
      empty.className = "calendar-empty";
      empty.textContent = "Sem compromissos neste dia.";
      dayColumn.appendChild(empty);
    }

    events.forEach((event, index) => {
      const platform = getPlatform(event.place, event.placeUrl);

      const card = document.createElement("article");
      card.className = `event-card ${platform.class}`;
      card.innerHTML = `
        <strong class="event-title">${event.title}</strong>
        <div class="event-meta">
          <span class="meta-item"><i data-lucide="clock"></i> ${event.time}</span>
          ${renderPlatformMeta(platform)}
        </div>
        <div class="card-actions">
          <button type="button" class="btn-action edit" data-event-id="${event.id}" title="Editar"><i data-lucide="pencil"></i>Editar</button>
          <button type="button" class="btn-action delete" data-event-id="${event.id}" data-event-date="${event.date}" title="Excluir"><i data-lucide="trash-2"></i>Excluir</button>
        </div>
      `;
      dayColumn.appendChild(card);
    });

    elements.container.appendChild(dayColumn);
  });

  if (window.lucide) lucide.createIcons();
};

const renderMonthly = () => {
  elements.calendarHeader.classList.remove("hidden");
  elements.container.className = "calendar-grid";

  const baseDate = new Date();
  const monthDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + STATE.monthOffset, 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstWeekDay = (monthDate.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  elements.monthName.textContent = `${MONTHS[month]} ${year}`;
  elements.monthDesc.textContent = `Calendário inteligente para ${MONTHS[month]}. Eventos aparecem nas datas corretas do mês.`;

  const weekHeaders = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  weekHeaders.forEach((label) => {
    const heading = document.createElement("div");
    heading.className = "calendar-weekday";
    heading.textContent = label;
    elements.container.appendChild(heading);
  });

  for (let i = 0; i < firstWeekDay; i++) {
    const empty = document.createElement("div");
    empty.className = "calendar-day calendar-empty";
    elements.container.appendChild(empty);
  }

  for (let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
    const date = new Date(year, month, dayNumber);
    const formattedDate = dateToString(date);
    const events = getOccurrencesForDate(formattedDate).sort((a, b) => a.time.localeCompare(b.time));

    const dayCard = document.createElement("article");
    dayCard.className = "calendar-day";
    dayCard.innerHTML = `<strong>${dayNumber}</strong>`;

    if (events.length === 0) {
      const emptyText = document.createElement("p");
      emptyText.className = "calendar-empty";
      emptyText.textContent = "Nada marcado.";
      dayCard.appendChild(emptyText);
    }

    events.forEach((event) => {
      const platform = getPlatform(event.place, event.placeUrl);
      const eventPill = document.createElement("div");
      eventPill.className = `calendar-event-pill ${platform.class}`.trim();
      eventPill.innerHTML = `
        <div class="event-title">${event.title}</div>
        <div class="event-meta">
          <span class="meta-item"><i data-lucide="clock"></i> ${event.time}</span>
          ${renderPlatformMeta(platform)}
        </div>
        <div class="card-actions calendar-card-actions">
          <button type="button" class="btn-action edit" data-event-id="${event.id}" title="Editar"><i data-lucide="pencil"></i>Editar</button>
          <button type="button" class="btn-action delete" data-event-id="${event.id}" data-event-date="${event.date}" title="Excluir"><i data-lucide="trash-2"></i>Excluir</button>
        </div>
      `;
      dayCard.appendChild(eventPill);
    });

    elements.container.appendChild(dayCard);
  }

  if (window.lucide) lucide.createIcons();
};

elements.form.onsubmit = (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const time = `${document.getElementById("hour").value}:${document.getElementById("minute").value}`;
  const { place, placeUrl } = readPlaceFromForm(elements.placeSelect, elements.customPlace, elements.customUrl);
  const repeatType = elements.repeatType.value;
  const day = elements.daySelect.value;
  const repeatWeeks = Number(elements.repeatWeeks.value) || 1;
  const startDate = repeatType === "unique" ? elements.eventDate.value : getNextDateForDay(day);

  if (repeatType === "unique" && !startDate) {
    showToast("Escolha a data do evento único.", "danger");
    return;
  }

  scheduleData.push({
    id: generateId(),
    title,
    time,
    place,
    placeUrl,
    repeatType,
    day,
    repeatWeeks: repeatType === "unique" ? 1 : repeatWeeks,
    startDate,
    skippedDates: [],
  });
  save();
  showToast("Evento criado com sucesso.", "success");
};

const handleEdit = (id) => {
  const event = scheduleData.find((item) => item.id === id);
  if (!event) return;

  const [hour, minute] = event.time.split(":");
  elements.editTitle.value = event.title;
  elements.editHour.value = hour;
  elements.editMinute.value = minute;
  fillPlaceFields(elements.editPlace, elements.editCustomPlace, elements.editCustomUrl, event);
  elements.editRepeatType.value = event.repeatType || "weekly";
  elements.editDay.value = event.day;
  elements.editRepeatWeeks.value = event.repeatWeeks || 1;
  elements.editEventDate.value = event.repeatType === "unique" ? event.startDate : "";

  updateEditRepeatFields();
  updateEditPlaceFields();
  editState = { id };
  elements.editModalBackdrop.classList.remove("hidden");
  elements.editTitle.focus();
};

const handleEditSubmit = (e) => {
  e.preventDefault();
  if (!editState?.id) return;

  const title = elements.editTitle.value.trim();
  const time = `${elements.editHour.value}:${elements.editMinute.value}`;
  const { place, placeUrl } = readPlaceFromForm(elements.editPlace, elements.editCustomPlace, elements.editCustomUrl);
  const repeatType = elements.editRepeatType.value;
  const day = elements.editDay.value;
  const repeatWeeks = Number(elements.editRepeatWeeks.value) || 1;
  const startDate = repeatType === "unique" ? elements.editEventDate.value : getNextDateForDay(day);

  if (repeatType === "unique" && !startDate) {
    showToast("Escolha a data do evento único.", "danger");
    return;
  }

  const existing = scheduleData.find((event) => event.id === editState.id);
  const updatedEvent = {
    id: editState.id,
    title,
    time,
    place,
    placeUrl,
    repeatType,
    day,
    repeatWeeks: repeatType === "unique" ? 1 : repeatWeeks,
    startDate,
    skippedDates: existing?.skippedDates || [],
  };

  scheduleData = scheduleData.filter((event) => event.id !== editState.id);
  scheduleData.push(updatedEvent);
  hideEditModal();
  save();
  showToast("Evento atualizado com sucesso.", "success");
};

const hideEditModal = () => {
  editState = null;
  elements.editForm.reset();
  updateEditRepeatFields();
  updateEditPlaceFields();
  elements.editModalBackdrop.classList.add("hidden");
};

const handleDelete = (id, occurrenceDate) => {
  const event = scheduleData.find((item) => item.id === id);
  if (!event) return;

  if (event.repeatType === "weekly" && occurrenceDate) {
    showDeleteChoiceModal(event, occurrenceDate);
    return;
  }

  showModal("Excluir evento? Esta ação não pode ser desfeita.", () => {
    deleteEntireEvent(id);
  }, "Excluir");
};

const showDeleteChoiceModal = (event, occurrenceDate) => {
  deleteChoiceState = { id: event.id, date: occurrenceDate };
  elements.deleteModalMessage.textContent =
    `"${event.title}" se repete toda semana. Remover só a ocorrência de ${formatDisplayDate(occurrenceDate)} ou excluir o evento por completo?`;
  elements.deleteModalBackdrop.classList.remove("hidden");
};

const hideDeleteChoiceModal = () => {
  deleteChoiceState = null;
  elements.deleteModalBackdrop.classList.add("hidden");
};

const skipOccurrence = (id, date) => {
  scheduleData = scheduleData.map((event) => {
    if (event.id !== id) return event;
    const skippedDates = [...(event.skippedDates || [])];
    if (!skippedDates.includes(date)) skippedDates.push(date);
    return { ...event, skippedDates };
  });
  save();
  showToast("Ocorrência desta semana removida.", "success");
};

const deleteEntireEvent = (id) => {
  scheduleData = scheduleData.filter((event) => event.id !== id);
  save();
  showToast("Evento excluído do calendário.", "success");
};

const formatDisplayDate = (dateString) => {
  const date = parseDate(dateString);
  return date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
};

const save = () => {
  localStorage.setItem("mySchedule", JSON.stringify(scheduleData));
  elements.form.reset();
  updateRepeatFields();
  updatePlaceFields();
  render();
};

elements.clearBtn.onclick = () => {
  showModal("Limpar toda a semana? Todos os eventos serão removidos.", () => {
    localStorage.removeItem("mySchedule");
    scheduleData = [];
    STATE.monthOffset = 0;
    hideEditModal();
    hideDeleteChoiceModal();
    render();
    showToast("Agenda limpa com sucesso.", "success");
  }, "Limpar");
};

const showToast = (message, type = "success") => {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => toast.remove(), 300);
  }, 2800);
};

const showModal = (message, onConfirm, confirmText = "Confirmar") => {
  elements.modalMessage.textContent = message;
  elements.modalConfirm.textContent = confirmText;
  modalConfirmCallback = onConfirm;
  elements.modalBackdrop.classList.remove("hidden");
};

const hideModal = () => {
  modalConfirmCallback = null;
  elements.modalBackdrop.classList.add("hidden");
};

const getCurrentWeekRange = () => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  monday.setHours(0, 0, 0, 0);
  sunday.setHours(23, 59, 59, 999);
  return [monday, sunday];
};

const getOccurrencesForWeek = (dayName, weekStart, weekEnd) => {
  return scheduleData
    .flatMap((event) => getOccurrencesForEvent(event, weekStart, weekEnd))
    .filter((occ) => occ.day === dayName);
};

const getOccurrencesForDate = (dateString) => {
  const date = parseDate(dateString);
  return scheduleData
    .flatMap((event) => getOccurrencesForEvent(event, date, date))
    .filter((occ) => occ.date === dateString);
};

const getOccurrencesForEvent = (event, startDate, endDate) => {
  const occurrences = [];
  const eventStart = parseDate(event.startDate);
  if (Number.isNaN(eventStart.getTime())) return occurrences;
  const skipped = new Set(event.skippedDates || []);

  if (event.repeatType === "unique") {
    if (isDateInRange(eventStart, startDate, endDate) && !skipped.has(event.startDate)) {
      occurrences.push({ ...event, date: event.startDate, day: event.day });
    }
    return occurrences;
  }

  for (let week = 0; week < (event.repeatWeeks || 1); week += 1) {
    const occurrenceDate = addDays(eventStart, week * 7);
    if (occurrenceDate > endDate) break;
    if (occurrenceDate < startDate) continue;
    const date = dateToString(occurrenceDate);
    if (skipped.has(date)) continue;
    occurrences.push({ ...event, date, day: event.day });
  }

  return occurrences;
};

const parseDate = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const dateToString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

const isDateInRange = (date, start, end) => date >= start && date <= end;

init();
