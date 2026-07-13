"use strict";

function renderNotesPanel(state) {
  const panel = document.getElementById("notesPanel");
  const notes = speakerNotes[state.current + 1] || [];
  const nextTitle = state.slides[state.current + 1]?.dataset.title || "نهاية العرض";
  const time = document.getElementById("timerValue")?.textContent || formatElapsed(state.startedAt);
  panel.innerHTML = `
    <div class="notes-meta">
      <span>الوقت الحالي: ${time}</span>
      <span>الشريحة الحالية: ${state.current + 1} / ${state.total}</span>
      <span>التالي: ${nextTitle}</span>
    </div>
    <h3>ملاحظات المتحدث</h3>
    <ul>${notes.map((n) => `<li>${n}</li>`).join("")}</ul>
  `;
}
