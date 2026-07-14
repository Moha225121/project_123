"use strict";

const chartState = { gradationVisible: new Set(gradationData.datasets.map((d) => d.label)) };

function themeColors() {
  const light = document.body.classList.contains("document-mode");
  return {
    ink: light ? "#0B2239" : "#F8FAFC",
    muted: light ? "#536574" : "#B8C3CC",
    grid: light ? "#D9DEE2" : "rgba(255,255,255,.14)",
    plot: light ? "#FFFFFF" : "#FFFFFF",
    navy: "#0B2239",
    orange: "#E69A32",
    green: "#31966F",
    red: "#C84A4A",
    amber: "#D89B32"
  };
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function renderSvg(containerId, viewBox, draw) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  const svg = svgEl("svg", { viewBox, role: "img", width: "100%", height: "100%", preserveAspectRatio: "xMidYMid meet" });
  draw(svg, themeColors());
  container.appendChild(svg);
}

function text(svg, value, attrs) {
  const t = svgEl("text", attrs);
  t.textContent = value;
  svg.appendChild(t);
  return t;
}

function addTooltipTarget(el, textValue) {
  el.addEventListener("pointermove", (e) => showTooltip(e, textValue));
  el.addEventListener("pointerleave", hideTooltip);
}

function renderDonut() {
  renderSvg("donutChart", "0 0 620 520", (svg, c) => {
    const r = 172;
    const circumference = 2 * Math.PI * r;
    svg.appendChild(svgEl("path", { d: "M86 390 C140 160 480 160 534 390", fill: "none", stroke: c.grid, "stroke-width": 56, "stroke-linecap": "round" }));
    svg.appendChild(svgEl("path", { d: "M86 390 C140 160 480 160 534 390", fill: "none", stroke: c.orange, "stroke-width": 56, "stroke-linecap": "round", "stroke-dasharray": `${circumference * .38} ${circumference}` }));
    text(svg, "60–75%", { x: 310, y: 304, "text-anchor": "middle", "font-size": 74, "font-weight": 900, fill: c.ink });
    text(svg, "نسبة الركام التقريبية من حجم الخرسانة", { x: 310, y: 352, "text-anchor": "middle", "font-size": 22, fill: c.muted });
  });
}

function axis(svg, cfg, max, c) {
  for (let i = 0; i <= 5; i += 1) {
    const y = cfg.y + cfg.h - (i / 5) * cfg.h;
    svg.appendChild(svgEl("line", { x1: cfg.x, y1: y, x2: cfg.x + cfg.w, y2: y, stroke: c.grid, "stroke-width": 1 }));
    text(svg, String((max / 5 * i).toFixed(0)), { x: cfg.x - 14, y: y + 5, "text-anchor": "end", "font-size": 17, fill: c.muted });
  }
  svg.appendChild(svgEl("line", { x1: cfg.x, y1: cfg.y + cfg.h, x2: cfg.x + cfg.w, y2: cfg.y + cfg.h, stroke: c.muted, "stroke-width": 2 }));
  svg.appendChild(svgEl("line", { x1: cfg.x, y1: cfg.y, x2: cfg.x, y2: cfg.y + cfg.h, stroke: c.muted, "stroke-width": 2 }));
}

function renderGradationLegend() {
  const legend = document.getElementById("gradationLegend");
  if (!legend) return;
  legend.innerHTML = "";
  gradationData.datasets.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${d.color}"></span> ${d.label}`;
    btn.classList.toggle("off", !chartState.gradationVisible.has(d.label));
    btn.addEventListener("click", () => {
      if (chartState.gradationVisible.has(d.label)) chartState.gradationVisible.delete(d.label);
      else chartState.gradationVisible.add(d.label);
      renderGradationLegend();
      renderGradation();
    });
    legend.appendChild(btn);
  });
}

function renderGradation() {
  renderSvg("gradationChart", "0 0 1120 600", (svg, c) => {
    const cfg = { x: 92, y: 48, w: 950, h: 425 };
    axis(svg, cfg, 100, c);
    const minLog = Math.log10(4.75);
    const maxLog = Math.log10(25);
    const sx = (mm) => cfg.x + ((Math.log10(mm) - minLog) / (maxLog - minLog)) * cfg.w;
    const sy = (v) => cfg.y + cfg.h - (v / 100) * cfg.h;
    gradationData.sieves.forEach((s) => {
      const x = sx(s);
      svg.appendChild(svgEl("line", { x1: x, y1: cfg.y, x2: x, y2: cfg.y + cfg.h, stroke: c.grid, "stroke-width": 1 }));
      text(svg, String(s), { x, y: cfg.y + cfg.h + 36, "text-anchor": "middle", "font-size": 18, fill: c.muted });
    });
    text(svg, "فتحة المنخل mm (محور لوغاريتمي)", { x: cfg.x + cfg.w / 2, y: 560, "text-anchor": "middle", "font-size": 20, fill: c.navy });
    text(svg, "المار %", { x: 28, y: cfg.y + cfg.h / 2, transform: `rotate(-90 28 ${cfg.y + cfg.h / 2})`, "text-anchor": "middle", "font-size": 20, fill: c.navy });
    gradationData.datasets.filter((d) => chartState.gradationVisible.has(d.label)).forEach((d) => {
      const points = d.values.map((v, i) => `${sx(gradationData.sieves[i])},${sy(v)}`).join(" ");
      svg.appendChild(svgEl("polyline", { points, fill: "none", stroke: d.color, "stroke-width": 5, "stroke-linejoin": "round" }));
      d.values.forEach((v, i) => {
        const point = svgEl("circle", { cx: sx(gradationData.sieves[i]), cy: sy(v), r: 8, fill: d.color, stroke: "#fff", "stroke-width": 3, tabindex: 0 });
        addTooltipTarget(point, `${d.label}: ${v.toFixed(2)}% عند ${gradationData.sieves[i]} mm`);
        svg.appendChild(point);
      });
    });
  });
}

function renderHorizontalBars(containerId, data, opts = {}) {
  renderSvg(containerId, "0 0 1040 560", (svg, c) => {
    const max = opts.max || Math.max(...data.values) * 1.15;
    const x = 410;
    const y = 86;
    const w = 490;
    const row = 88;
    const colors = opts.colors || data.values.map(() => "#87939D");
    data.values.forEach((v, i) => {
      const yy = y + i * row;
      svg.appendChild(svgEl("rect", { x, y: yy, width: w, height: 34, rx: 17, fill: "rgba(135,147,157,.25)" }));
      const bw = (v / max) * w;
      const bar = svgEl("rect", { x, y: yy, width: bw, height: 34, rx: 17, fill: colors[i] });
      addTooltipTarget(bar, `${data.labels[i]}: ${v.toFixed(2)}${data.unit || ""}`);
      svg.appendChild(bar);
      text(svg, data.labels[i], { x: x - 150, y: yy + 32, "text-anchor": "middle", "font-size": 32, "font-weight": 900, fill: "#FFFFFF", stroke: "#050505", "stroke-width": 4, "paint-order": "stroke" });
      text(svg, `${v.toFixed(2)}${data.unit || ""}`, { x: x + Math.max(18, bw - 8), y: yy + 27, "text-anchor": "end", "font-size": 28, "font-weight": 900, fill: "#FFFFFF", stroke: "#050505", "stroke-width": 3, "paint-order": "stroke" });
    });
    if (opts.reference) {
      const rx = x + (opts.reference / max) * w;
      svg.appendChild(svgEl("line", { x1: rx, y1: y - 32, x2: rx, y2: y + data.values.length * row - 34, stroke: c.red, "stroke-width": 3, "stroke-dasharray": "9 8" }));
      text(svg, "30% حد مرجعي", { x: rx + 10, y: y - 42, "font-size": 18, fill: c.red, "font-weight": 800 });
    }
  });
}

function renderAllCharts() {
  renderDonut();
  renderGradationLegend();
  renderGradation();
  renderHorizontalBars("finenessChart", finenessData, { max: 3.6, colors: ["#87939D", "#87939D", "#87939D", "#A7B0B7"] });
  renderHorizontalBars("crushingChart", crushingData, { max: 35, reference: 30, colors: ["#87939D", "#87939D", "#31966F"] });
  renderHorizontalBars("impactChart", { labels: ["أجدابيا", "البيضاء", "الأبيار"], values: [10.83, 13.61, 16.29], unit: "%" }, { max: 20, colors: ["#31966F", "#87939D", "#87939D"] });
}

function exportSvgAsPng(containerId) {
  const svg = document.querySelector(`#${containerId} svg`);
  if (!svg) return;
  const data = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml;charset=utf-8" }));
  img.onload = () => {
    const ratio = window.devicePixelRatio || 1;
    const canvas = document.createElement("canvas");
    canvas.width = 1600 * ratio;
    canvas.height = 900 * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1600, 900);
    ctx.drawImage(img, 0, 0, 1600, 900);
    URL.revokeObjectURL(url);
    const a = document.createElement("a");
    a.download = `${containerId}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };
  img.src = url;
}
