"use strict";

function showTooltip(event, text) {
  const tip = document.getElementById("tooltip");
  tip.textContent = text;
  tip.style.display = "block";
  tip.style.left = `${Math.min(window.innerWidth - 260, event.clientX + 16)}px`;
  tip.style.top = `${event.clientY + 16}px`;
}

function hideTooltip() {
  document.getElementById("tooltip").style.display = "none";
}

function openModal(html) {
  const modal = document.getElementById("modal");
  const box = document.getElementById("modalBox");
  box.innerHTML = `${html}<button class="primary" id="modalClose">إغلاق</button>`;
  modal.classList.add("show");
  document.getElementById("modalClose").focus();
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

function handleImageFallbacks() {
  document.querySelectorAll("img").forEach((img) => {
    img.addEventListener("error", () => {
      const label = img.dataset.fallback || "صورة غير متوفرة";
      console.warn(`Missing image: ${img.getAttribute("src")}`);
      const ph = document.createElement("div");
      ph.className = "image-fallback";
      ph.textContent = label;
      img.replaceWith(ph);
    });
  });
}

function formatElapsed(startedAt) {
  const elapsed = Math.floor((Date.now() - startedAt) / 1000);
  return `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
}
