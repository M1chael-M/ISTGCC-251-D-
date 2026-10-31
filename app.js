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

  const viewCalendar = document.getElementById("view-calendar");
  const calGroupEl = document.getElementById("cal-active-group");
  const calInput = document.getElementById("cal-input");
  const calNative = document.getElementById("cal-native");
  const calError = document.getElementById("cal-error");
  const calResult = document.getElementById("cal-result");

  let selectedGroup = localStorage.getItem(STORAGE_KEY) || "";
  let weekMode = "auto";
  let homeworkTab = "active";
  let calDate = startOfDay(new Date());

  const dayNames = ["Luni", "Marți", "Miercuri", "Joi", "Vineri", "Sâmbătă", "Duminică"];
  const monthNames = [
    "ianuarie", "februarie", "martie", "aprilie", "mai", "iunie",
    "iulie", "august", "septembrie", "octombrie", "noiembrie", "decembrie",
  ];

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

    const all = ((window.HOMEWORK_DATA && window.HOMEWORK_DATA[selectedGroup]) || []).filter(
      (item) => item && item.date && (item.subject || item.task)
    );
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

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateInput(date) {
    return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
  }

  function formatDateIso(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  // Acceptă: 05.10.2026 · 5.10.2026 · 05/10/2026 · 05-10-2026 · 05 10 2026 · 2026-10-05
  function parseDateInput(str) {
    const text = String(str || "").trim();
    let y;
    let mo;
    let d;
    let m = text.match(/^(\d{1,2})[.\/\-\s]+(\d{1,2})[.\/\-\s]+(\d{4})$/);
    if (m) {
      d = Number(m[1]);
      mo = Number(m[2]);
      y = Number(m[3]);
    } else {
      m = text.match(/^(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})$/);
      if (!m) return null;
      y = Number(m[1]);
      mo = Number(m[2]);
      d = Number(m[3]);
    }
    const date = new Date(y, mo - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
    return date;
  }

  function showCalError(message) {
    calError.textContent = message || "";
    calError.hidden = !message;
    calInput.classList.toggle("invalid", Boolean(message));
  }

  function renderCalendar() {
    calGroupEl.textContent = selectedGroup || "—";

    if (!selectedGroup) {
      calResult.innerHTML = `<p class="empty-day">Alege întâi grupa în fila „Orar" — orarul pe zi se afișează pentru grupa ta.</p>`;
      return;
    }

    const dayName = dayNames[(calDate.getDay() + 6) % 7];
    const weekType = detectCurrentWeekType(calDate);
    const isToday = isSameDay(calDate, new Date());
    const groupData = data.groups[selectedGroup] || {};
    const isWeekend = !data.days.includes(dayName);

    const lessons = (groupData[dayName] || [])
      .filter((lesson) => lesson.weeks === "both" || lesson.weeks === weekType)
      .sort((a, b) => (a.slot || 0) - (b.slot || 0));

    const dateText = `${calDate.getDate()} ${monthNames[calDate.getMonth()]} ${calDate.getFullYear()}`;
    const status = isWeekend
      ? `Săptămâna <strong>${escapeHtml(weekLabel(weekType).toLowerCase())}</strong> · zi liberă`
      : `Săptămâna <strong>${escapeHtml(weekLabel(weekType).toLowerCase())}</strong> · ${lessons.length} ${lessons.length === 1 ? "oră" : "ore"}`;

    let body;
    if (isWeekend) {
      body = `<p class="empty-day">Zi liberă — ${escapeHtml(dayName.toLowerCase())} nu sunt ore.</p>`;
    } else if (!lessons.length) {
      body = `<p class="empty-day">Fără ore în această zi (săptămâna ${escapeHtml(weekLabel(weekType).toLowerCase())}).</p>`;
    } else {
      body = lessons.map(renderLesson).join("");
    }

    calResult.innerHTML = `<section class="day-col${isToday ? " today" : ""}">
      <h3 class="day-head">${escapeHtml(dayName)} · ${escapeHtml(dateText)}${isToday ? " · azi" : ""}</h3>
      <div class="day-body">
        <p class="week-status">${status}</p>
        ${body}
      </div>
    </section>`;
  }

  function setCalDate(date, { syncText = true } = {}) {
    const changed = !isSameDay(date, calDate);
    calDate = startOfDay(date);
    if (syncText) calInput.value = formatDateInput(calDate);
    calNative.value = formatDateIso(calDate);
    showCalError("");
    if (changed || syncText) renderCalendar();
  }

  function shiftCalDate(days) {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth(), calDate.getDate() + days));
  }

  function commitCalInput() {
    const raw = calInput.value.trim();
    if (!raw) {
      showCalError("Scrie o dată, de exemplu 05.10.2026.");
      return;
    }
    const parsed = parseDateInput(raw);
    if (!parsed) {
      showCalError("Dată invalidă. Folosește formatul zz.ll.aaaa, de exemplu 05.10.2026.");
      return;
    }
    setCalDate(parsed);
  }

  const views = { orar: viewOrar, teme: viewTeme, calendar: viewCalendar };

  function switchView(view) {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
      const isActive = btn.dataset.view === view;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", String(isActive));
    });

    Object.entries(views).forEach(([name, el]) => {
      const show = name === view;
      el.hidden = !show;
      el.classList.toggle("hidden", !show);
    });

    if (view === "teme") renderHomework();
    if (view === "calendar") {
      calInput.value = formatDateInput(calDate);
      calNative.value = formatDateIso(calDate);
      showCalError("");
      renderCalendar();
    }
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

  // --- Calendar: scriere manuală a datei ---
  calInput.addEventListener("input", () => {
    const digitsOnly = /^\d{8}$/.test(calInput.value.trim());
    if (digitsOnly) {
      const v = calInput.value.trim();
      calInput.value = `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4)}`;
    }
    const parsed = parseDateInput(calInput.value);
    if (parsed) {
      setCalDate(parsed, { syncText: false });
    } else if (calInput.classList.contains("invalid")) {
      // utilizatorul corectează textul — ascunde eroarea veche
      showCalError("");
    }
  });

  // La click/focus selectează tot textul — o dată nouă o înlocuiește direct pe cea veche
  calInput.addEventListener("focus", () => {
    setTimeout(() => calInput.select(), 0);
  });

  calInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitCalInput();
    }
  });

  calInput.addEventListener("change", commitCalInput);

  // --- Calendar: alegere din calendarul nativ ---
  calNative.addEventListener("click", () => {
    try {
      if (typeof calNative.showPicker === "function") calNative.showPicker();
    } catch (_) {
      /* unele browsere nu permit showPicker — rămâne comportamentul implicit */
    }
  });

  calNative.addEventListener("change", () => {
    const parsed = parseDateInput(calNative.value);
    if (parsed) setCalDate(parsed);
  });

  document.getElementById("cal-prev").addEventListener("click", () => shiftCalDate(-1));
  document.getElementById("cal-next").addEventListener("click", () => shiftCalDate(1));
  document.getElementById("cal-today").addEventListener("click", () => setCalDate(new Date()));

  renderPicker();

  if (selectedGroup && data.groups[selectedGroup]) {
    showTimetable();
  } else {
    selectedGroup = "";
    localStorage.removeItem(STORAGE_KEY);
    showPicker();
  }
})();
