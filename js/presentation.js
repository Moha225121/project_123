"use strict";

const Presentation = {
  current: 0,
  slides: [],
  total: 0,
  startedAt: Date.now(),
  controlsTimer: null,

  init() {
    this.slides = Array.from(document.querySelectorAll(".slide"));
    this.total = this.slides.length;
    this.slides.forEach((slide, index) => slide.dataset.slide = String(index + 1));
    document.getElementById("totalSlides").textContent = this.total;
    this.applyConfig();
    this.renderDynamicContent();
    this.buildOverview();
    renderAllCharts();
    this.bindEvents();
    this.loadTheme();
    this.loadHash();
    if (location.hash) document.getElementById("startScreen").classList.remove("show");
    if (!location.hash) this.goTo(0, false);
    setInterval(() => this.tick(), 1000);
    this.tick();
    validateCalculations();
    handleImageFallbacks();
  },

  applyConfig() {
    document.querySelectorAll("[data-config='title']").forEach((el) => { el.textContent = projectConfig.title; });
    const studentLine = projectConfig.students.map((student, index) => `${index + 1}. ${student.name} ${student.id}`).join(" | ");
    document.getElementById("coverStudents").textContent = `إعداد الطلبة: ${studentLine}`;
    document.getElementById("startStudents").textContent = studentLine;
    document.getElementById("coverMeta").innerHTML = [
      ["الجامعة", projectConfig.university], ["الكلية", projectConfig.faculty], ["القسم", projectConfig.department], ["المشرف", projectConfig.supervisor], ["العام", projectConfig.academicYear]
    ].map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
    const logo = document.getElementById("logoPanel");
    logo.innerHTML = projectConfig.logo ? `<img src="${projectConfig.logo}" alt="شعار المؤسسة">` : `<span>UB<br>Logo Area</span>`;
  },

  renderDynamicContent() {
    renderTables();
    renderStandards();
    renderWorkflow();
    renderSourceSlides();
    renderWeightTables();
  },

  goTo(index, updateHash = true) {
    this.current = Math.max(0, Math.min(this.total - 1, index));
    this.slides.forEach((slide, i) => slide.classList.toggle("active", i === this.current));
    document.getElementById("currentSlide").textContent = this.current + 1;
    document.getElementById("progressBar").style.width = `${((this.current + 1) / this.total) * 100}%`;
    document.getElementById("footerTitle").textContent = projectConfig.title;
    if (updateHash) history.replaceState(null, "", `#slide-${this.current + 1}`);
    renderNotesPanel(this);
    this.buildOverview();
  },

  next() { this.goTo(this.current + 1); },
  prev() { this.goTo(this.current - 1); },

  buildOverview() {
    const grid = document.getElementById("overviewGrid");
    grid.innerHTML = this.slides.map((s, i) => `<button class="thumb ${i === this.current ? "current" : ""}" data-slide-index="${i}"><span>${String(i + 1).padStart(2, "0")}</span><b>${s.dataset.title}</b><small>${s.dataset.section}</small></button>`).join("");
  },

  toggleOverview(force) { document.getElementById("overview").classList.toggle("show", force); },
  toggleNotes() { document.getElementById("notesPanel").classList.toggle("show"); },

  toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  },

  toggleTheme() {
    document.body.classList.toggle("document-mode");
    document.body.classList.toggle("theme-dark", !document.body.classList.contains("document-mode"));
    localStorage.setItem("presentation-theme", document.body.classList.contains("document-mode") ? "document" : "dark");
    renderAllCharts();
  },

  loadTheme() {
    if (localStorage.getItem("presentation-theme") === "document") this.toggleTheme();
  },

  restart() { this.startedAt = Date.now(); this.goTo(0); },

  tick() {
    const value = formatElapsed(this.startedAt);
    let timer = document.getElementById("timerValue");
    if (!timer) {
      timer = document.createElement("span");
      timer.id = "timerValue";
      timer.hidden = true;
      document.body.appendChild(timer);
    }
    timer.textContent = value;
    if (document.getElementById("notesPanel").classList.contains("show")) renderNotesPanel(this);
  },

  loadHash() {
    const m = location.hash.match(/slide-(\d+)/);
    if (m) this.goTo(Number(m[1]) - 1, false);
  },

  showControls() {
    document.body.classList.add("controls-visible");
    clearTimeout(this.controlsTimer);
    this.controlsTimer = setTimeout(() => document.body.classList.remove("controls-visible"), 1800);
  },

  bindEvents() {
    document.getElementById("nextBtn").addEventListener("click", () => this.next());
    document.getElementById("prevBtn").addEventListener("click", () => this.prev());
    document.getElementById("overviewBtn").addEventListener("click", () => this.toggleOverview(true));
    document.getElementById("closeOverview").addEventListener("click", () => this.toggleOverview(false));
    document.getElementById("notesBtn").addEventListener("click", () => this.toggleNotes());
    document.getElementById("fullscreenBtn").addEventListener("click", () => this.toggleFullscreen());
    document.getElementById("themeBtn").addEventListener("click", () => this.toggleTheme());
    document.getElementById("printBtn").addEventListener("click", () => window.print());
    document.getElementById("startBtn").addEventListener("click", () => document.getElementById("startScreen").classList.remove("show"));
    document.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => { document.getElementById("startScreen").classList.remove("show"); this.toggleOverview(false); this.goTo(Number(b.dataset.jump) - 1); }));
    document.querySelectorAll(".toggle-table").forEach((b) => b.addEventListener("click", () => { const target = document.getElementById(b.dataset.target); target.hidden = !target.hidden; }));
    document.querySelectorAll(".export-chart").forEach((b) => b.addEventListener("click", () => exportSvgAsPng(b.dataset.chart)));
    document.getElementById("overviewGrid").addEventListener("click", (e) => { const b = e.target.closest("button[data-slide-index]"); if (b) { this.goTo(Number(b.dataset.slideIndex)); this.toggleOverview(false); } });
    document.getElementById("modal").addEventListener("click", (e) => { if (e.target.id === "modal" || e.target.id === "modalClose") closeModal(); });
    document.addEventListener("mousemove", () => this.showControls());
    document.addEventListener("keydown", (e) => this.handleKey(e));
    window.addEventListener("resize", () => renderAllCharts());
    window.addEventListener("hashchange", () => this.loadHash());
  },

  handleKey(e) {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); this.next(); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); this.prev(); }
    if (e.key === "Home") this.goTo(0);
    if (e.key === "End") this.goTo(this.total - 1);
    if (e.key.toLowerCase() === "f") this.toggleFullscreen();
    if (e.key.toLowerCase() === "o") this.toggleOverview(!document.getElementById("overview").classList.contains("show"));
    if (e.key.toLowerCase() === "n") this.toggleNotes();
    if (e.key.toLowerCase() === "r") this.restart();
    if (e.key === "Escape") { closeModal(); this.toggleOverview(false); }
  }
};
