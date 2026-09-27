(() => {
  const STORAGE_KEY = "orar-cfdp-group";
  // Luni 14 septembrie 2026 = începutul săptămânii impare (referință)
  const REF_MONDAY = Date.UTC(2026, 8, 14);

  const data = window.ORAR_DATA;
  if (!data) {
    document.body.innerHTML = "<p style='padding:2rem'>Datele orarului lipsesc (data.js).</p>";
    return;
  }

  const picker = document.getElementById("picker");
  const timetable = document.getElementById("timetable");
  const groupGrid = document.getElementById("group-grid");
  const activeGroupEl = document.getElementById("active-group");
  const weekBoard = document.getElementById("week-board");
  const btnChange = document.getElementById("btn-change");
  const currentWeekLabel = document.getElementById("current-week-label");

  const viewOrar = document.getElementById("view-orar");
  const viewTeme = document.getElementById("view-teme");
  const homeworkList = document.getElementById("homework-list");
  const temeActiveGroupEl = document.getElementById("teme-active-group");

  let selectedGroup = localStorage.getItem(STORAGE_KEY) || "";
  let weekMode = "auto";
  let homeworkTab = "active";

  const dayNames = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];

  const programLabels = {
    "ISTGCC-251": "Anul II · zi",
    "ISTGCC-251 D": "Anul II · zi (D)",
  };

  function startOfMonday(date) {
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7; // Luni = 0
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day);
    return d;
  }

  function detectCurrentWeekType(date = new Date()) {
    const monday = startOfMonday(date);
    const mondayUtc = Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate());
    const weeks = Math.round((mondayUtc - REF_MONDAY) / (7 * 24 * 60 * 60 * 1000));
    return weeks % 2 === 0 ? "impara" : "para";
  }

  function effectiveWeek() {
    return weekMode === "auto" ? detectCurrentWeekType() : weekMode;
  }

  function todayDayName() {
    return dayNames[(new Date().getDay() + 6) % 7];
  }

  function escapeHtml(str) {
    return String(str || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function weekLabel(weeks) {
    if (weeks === "impara") return "Impară";
    if (weeks === "para") return "Pară";
    return "Ambele";
  }

  function matchesWeek(lesson) {
    const mode = effectiveWeek();
    if (mode === "all") return true;
    if (lesson.weeks === "both") return true;
    return lesson.weeks === mode;
  }

  function updateWeekStatus() {
    const current = detectCurrentWeekType();
    const showing = effectiveWeek();
    const currentText = weekLabel(current);
    if (weekMode === "auto" || showing === current) {
      currentWeekLabel.innerHTML = `Săptămâna curentă: <strong>${escapeHtml(currentText)}</strong>`;
    } else if (showing === "all") {
      currentWeekLabel.innerHTML = `Săptămâna curentă: <strong>${escapeHtml(currentText)}</strong> · vezi toate`;
    } else {
      currentWeekLabel.innerHTML = `Săptămâna curentă: <strong>${escapeHtml(currentText)}</strong> · afișezi ${escapeHtml(weekLabel(showing)).toLowerCase()}`;
    }
  }

  function syncWeekButtons() {
    document.querySelectorAll(".week-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.week === weekMode);
    });
  }

  function renderPicker() {
    groupGrid.innerHTML = data.groupOrder
      .map((code) => {
        const label = programLabels[code] || "Grupa";
        return `<button type="button" class="group-card" data-group="${escapeHtml(code)}" role="listitem">
          <span class="code">${escapeHtml(code)}</span>
          <span class="meta">${escapeHtml(label)}</span>
        </button>`;
      })
      .join("");
  }

  function renderLesson(lesson) {
    const type = lesson.type || "";
    const typeBadge = type
      ? `<span class="badge type-${escapeHtml(type)}">${escapeHtml(type)}</span>`
      : "";
    const weekBadge =
      lesson.weeks === "both"
        ? ""
        : `<span class="badge week-${escapeHtml(lesson.weeks)}">${weekLabel(lesson.weeks)}</span>`;

    const teacher = lesson.teacher
      ? `<span><strong>Cadru:</strong> ${escapeHtml(lesson.teacher)}</span>`
      : "";
    const room = lesson.room
      ? `<span><strong>Sala:</strong> ${escapeHtml(lesson.room)}</span>`
      : "";

    return `<article class="lesson ${escapeHtml(type)}">
      <div class="lesson-top">
        <span class="time">${escapeHtml(lesson.time)}</span>
        ${typeBadge}
        ${weekBadge}
      </div>
      <p class="subject">${escapeHtml(lesson.subject || lesson.raw)}</p>
      <div class="meta-row">${teacher}${room}</div>
    </article>`;
  }

  function renderTimetable() {
    const groupData = data.groups[selectedGroup] || {};
    activeGroupEl.textContent = selectedGroup;
    updateWeekStatus();
    syncWeekButtons();

    const today = todayDayName();
    const mode = effectiveWeek();

    weekBoard.innerHTML = data.days
      .map((day) => {
        const lessons = (groupData[day] || []).filter(matchesWeek);
        const isToday = day === today;
        const body = lessons.length
          ? lessons.map(renderLesson).join("")
          : `<p class="empty-day">Fără ore în această zi${mode !== "all" ? " (pentru săptămâna selectată)" : ""}.</p>`;
        return `<section class="day-col${isToday ? " today" : ""}">
          <h3 class="day-head">${escapeHtml(day)}${isToday ? " · azi" : ""}</h3>
          <div class="day-body">${body}</div>
        </section>`;
      })
      .join("");
  }

  function parseHomeworkDate(str) {
    const [y, m, d] = String(str || "").split("-").map(Number);
    return new Date(y || 1970, (m || 1) - 1, d || 1);
  }

  function formatHomeworkDate(str) {
    return parseHomeworkDate(str).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function isHomeworkActive(item) {
    const due = parseHomeworkDate(item.date);
    due.setHours(23, 59, 59, 999);
    return due.getTime() >= Date.now();
  }

  function renderHomeworkItem(item) {
    return `<article class="lesson homework-item">
      <div class="lesson-top">
        <span class="time">${escapeHtml(formatHomeworkDate(item.date))}</span>
      </div>
      <p class="subject">${escapeHtml(item.subject)}</p>
      <div class="meta-row"><span>${escapeHtml(item.task)}</span></div>
    </article>`;
  }

  function syncHomeworkTabs() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.homeworkTab === homeworkTab);
    });
  }

  function renderHomework() {
    temeActiveGroupEl.textContent = selectedGroup || "—";

    if (!selectedGroup) {
      syncHomeworkTabs();
      homeworkList.innerHTML = `<p class="empty-day">Alege întâi grupa în fila „Orar" — temele se afișează separat pentru fiecare grupă.</p>`;
      return;
    }

    const all = (window.HOMEWORK_DATA && window.HOMEWORK_DATA[selectedGroup]) || [];
    syncHomeworkTabs();

    const items = all
      .filter((item) => isHomeworkActive(item) === (homeworkTab === "active"))
      .sort((a, b) => {
        const diff = parseHomeworkDate(a.date) - parseHomeworkDate(b.date);
        return homeworkTab === "active" ? diff : -diff;
      });

    homeworkList.innerHTML = items.length
      ? items.map(renderHomeworkItem).join("")
      : `<p class="empty-day">${
          homeworkTab === "active" ? "Nu sunt teme active momentan." : "Arhiva este goală deocamdată."
        }</p>`;
  }

  function switchView(view) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    const showOrar = view === "orar";
    viewOrar.hidden = !showOrar;
    viewOrar.classList.toggle("hidden", !showOrar);
    viewTeme.hidden = showOrar;
    viewTeme.classList.toggle("hidden", showOrar);

    if (view === "teme") renderHomework();
  }

  function showPicker() {
    picker.hidden = false;
    picker.classList.remove("hidden");
    timetable.hidden = true;
    timetable.classList.add("hidden");
  }

  function showTimetable() {
    picker.hidden = true;
    picker.classList.add("hidden");
    timetable.hidden = false;
    timetable.classList.remove("hidden");
    renderTimetable();
  }

  function selectGroup(code) {
    selectedGroup = code;
    localStorage.setItem(STORAGE_KEY, code);
    showTimetable();
  }

  groupGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-group]");
    if (!btn) return;
    selectGroup(btn.dataset.group);
  });

  btnChange.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    selectedGroup = "";
    showPicker();
  });

  document.querySelectorAll(".week-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      weekMode = btn.dataset.week;
      renderTimetable();
    });
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      homeworkTab = btn.dataset.homeworkTab;
      renderHomework();
    });
  });

  renderPicker();

  if (selectedGroup && data.groups[selectedGroup]) {
    showTimetable();
  } else {
    selectedGroup = "";
    localStorage.removeItem(STORAGE_KEY);
    showPicker();
  }
})();
