"use strict";

function $(id) { return document.getElementById(id); }

function table(headers, rows, className = "") {
  return `<table class="${className}"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function renderTables() {
  const gradHeaders = ["المنخل", "المقاس mm", "الوزن المحجوز g", "الوزن التراكمي g", "المحجوز %", "المار %"];
  $("abyarsGradationTable").innerHTML = table(gradHeaders, gradationTables.abyars);
  $("baydaGradationTable").innerHTML = table(gradHeaders, gradationTables.bayda);
  $("ajdabiyaGradationTable").innerHTML = table(gradHeaders, gradationTables.ajdabiya);
  $("gradationTable").innerHTML = table(["المقاس mm", ...gradationData.datasets.map((d) => `${d.label} - المار %`)], gradationData.sieves.map((s, i) => [s, ...gradationData.datasets.map((d) => d.values[i].toFixed(2))]));
  $("fineAggregateTable").innerHTML = table(["Sieve opening mm", "Retained weight g", "Cumulative weight g", "Retained %", "Passing %"], fineAggregateTable);
  $("comparisonTable").innerHTML = `<table><thead><tr><th>المؤشر</th><th>الأبيار</th><th>البيضاء</th><th>أجدابيا</th></tr></thead><tbody>${comparisonRows.map((r) => {
    const cells = r.slice(0, 4).map((c, idx) => {
      const key = idx === 1 ? "abyars" : idx === 2 ? "bayda" : idx === 3 ? "ajdabiya" : "";
      const review = "";
      const icon = c === MISSING ? "○ " : review ? "△ " : "● ";
      return `<td class="${c === MISSING ? "missing" : ""} ${r[4] === key ? "best" : ""} ${review}">${idx ? icon : ""}${String(c).replace(" / ", "<br>")}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("")}</tbody></table>`;
}

function renderStandards() {
  $("standardsTable").innerHTML = standardsRows.map((row, i) => `
    <div class="spec-row">
      <span class="spec-icon">${i + 1}</span>
      <div><b>${row[0]}</b><small>${row[1]}</small></div>
      <p>${row[2]}</p>
    </div>
  `).join("");
}

function renderWorkflow() {
  const wrap = $("workflowTimeline");
  wrap.innerHTML = workflowSteps.map((s, i) => `<button type="button" data-step="${i}"><b>${String(i + 1).padStart(2, "0")}</b><span>${s[0]}</span></button>`).join("");
  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-step]");
    if (!btn) return;
    const s = workflowSteps[Number(btn.dataset.step)];
    openModal(`<h3>${s[0]}</h3><p><b>هدف الاختبار:</b> ${s[1]}</p><p><b>الأداة:</b> ${s[2]}</p><p><b>النتيجة:</b> ${s[3]}</p>`);
  });
}

function resultValue(cards, label) {
  return cards.find((item) => item[0] === label)?.[1] || MISSING;
}

function renderSourceSlides() {
  const configs = [
    ["abyars", "source-abyars", "الأبيار", "بيانات مكتملة نسبيًا", "complete"],
    ["bayda", "source-bayda", "البيضاء", "بيانات مكتملة", "complete"],
    ["ajdabiya", "source-ajdabiya", "أجدابيا", "بيانات مكتملة", "complete"]
  ];
  configs.forEach(([key, id, location, status, statusType]) => {
    if (!$(id)) return;
    const data = materialResults[key];
    const complete = statusType === "missing" ? "missing-status" : "";
    const review = "";
    const facts = data.cards.filter(([label]) => !["التهشيم", "الصدمية"].includes(label)).map(([label, value]) => `<p><span>${label}</span><b class="${value === MISSING ? "missing" : ""}">${value}</b></p>`).join("");
    $(id).insertAdjacentHTML("beforeend", `
      <div class="mechanical-score">
        <div class="score"><small>Crushing Value</small><strong class="count" data-value="${calculatePercentage(data.crushing.w1, data.crushing.w2).toFixed(2)}">${calculatePercentage(data.crushing.w1, data.crushing.w2).toFixed(2)}%</strong></div>
        <div class="score"><small>Impact Value</small><strong class="count" data-value="${calculatePercentage(data.impact.w1, data.impact.w2).toFixed(2)}">${calculatePercentage(data.impact.w1, data.impact.w2).toFixed(2)}%</strong></div>
      </div>
      <div class="source-facts"><span class="status-pill ${complete}">${status}</span><p><span>الموقع / المصدر</span><b>${location}</b></p>${facts}</div>
      <div class="weights-block"><h3>أوزان الاختبار</h3><p>Crushing: W1 = ${data.crushing.w1} g، W2 = ${data.crushing.w2} g</p><p>Impact: W1 = ${data.impact.w1} g، W2 = ${data.impact.w2} g</p><button class="primary calc-details" data-source="${key}">تفاصيل الحساب</button></div>
      ${review}
      <p class="source-note">${SOURCE_NOTE}</p>
    `);
  });
  document.querySelectorAll(".calc-details").forEach((b) => b.addEventListener("click", () => calculationDetails(b.dataset.source)));
}

function weightsTable(kind) {
  const rows = [
    ["الأبيار", materialResults.abyars[kind].w1, materialResults.abyars[kind].w2],
    ["البيضاء", materialResults.bayda[kind].w1, materialResults.bayda[kind].w2],
    ["أجدابيا", materialResults.ajdabiya[kind].w1, materialResults.ajdabiya[kind].w2]
  ].map(([name, w1, w2]) => [name, w1.toFixed(1), w2.toFixed(1), (w1 - w2).toFixed(1), calculatePercentage(w1, w2).toFixed(2)]);
  return table(["المصدر", "W1 g", "W2 g", "Difference g", "Result %"], rows);
}

function renderWeightTables() {
  $("crushingWeights").innerHTML = `<h3>Crushing test</h3>${weightsTable("crushing")}`;
  $("impactWeights").innerHTML = `<h3>Impact test</h3>${weightsTable("impact")}`;
}

function calculationDetails(source) {
  const data = materialResults[source];
  const c = calculatePercentage(data.crushing.w1, data.crushing.w2).toFixed(2);
  const i = calculatePercentage(data.impact.w1, data.impact.w2).toFixed(2);
  openModal(`<h3>${data.title} — تفاصيل الحساب</h3><p>Crushing = (${data.crushing.w1} − ${data.crushing.w2}) ÷ ${data.crushing.w1} × 100 = <b>${c}%</b></p><p>Impact = (${data.impact.w1} − ${data.impact.w2}) ÷ ${data.impact.w1} × 100 = <b>${i}%</b></p>`);
}

function validateCalculations() {
  const checks = [
    [materialResults.abyars.crushing, 23.00, "الأبيار تهشيم"], [materialResults.bayda.crushing, 19.19, "البيضاء تهشيم"], [materialResults.ajdabiya.crushing, 15.95, "أجدابيا تهشيم"],
    [materialResults.abyars.impact, 16.29, "الأبيار صدمية"], [materialResults.bayda.impact, 13.61, "البيضاء صدمية"], [materialResults.ajdabiya.impact, 10.83, "أجدابيا صدمية"]
  ];
  const failures = checks.filter(([w, expected]) => Math.abs(calculatePercentage(w.w1, w.w2) - expected) > 0.01);
  if (failures.length) console.warn("Calculation check requires review", failures.map((f) => f[2]));
}

document.addEventListener("DOMContentLoaded", () => Presentation.init());
