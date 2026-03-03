// src/main.js
import { renderBarcode } from "./barcode.js";
import { getBarcodeFormat } from "./barcodeFormat.js";
import { getStore } from "./dataStore.js";

function safeText(v) {
  return (v ?? "").toString();
}

// ---------- UI helpers ----------
function showSingleMode() {
  const multi = document.getElementById("multiResult");
  if (multi) {
    multi.classList.add("hidden");
    multi.innerHTML = "";
  }
  document.getElementById("result")?.classList.remove("hidden");
}

function showMultiMode() {
  document.getElementById("result")?.classList.add("hidden");
  document.getElementById("multiResult")?.classList.remove("hidden");
}

function hideAllResults() {
  document.getElementById("result")?.classList.add("hidden");
  const multi = document.getElementById("multiResult");
  if (multi) {
    multi.classList.add("hidden");
    multi.innerHTML = "";
  }
}

// ---------- Render single ----------
async function renderSingleResult(sku, store) {
  const skuName = document.getElementById("skuName");
  const fullEan = document.getElementById("fullEan");
  const skuImage = document.getElementById("skuImage");

  if (skuName) skuName.textContent = safeText(sku.name) || "Sin nombre";
  if (fullEan) fullEan.textContent = safeText(sku.ean);

  // imagen (con store.getImage)
  const imgUrl = store.getImage(sku.ean);
  if (skuImage) {
    if (imgUrl) {
      skuImage.src = imgUrl;
      skuImage.style.display = "block";
    } else {
      skuImage.removeAttribute("src");
      skuImage.style.display = "none";
    }
  }

  // barcode (tu helper ya decide formato, pero lo dejamos como lo tenés)
  renderBarcode(sku.ean);

  showSingleMode();
}

// ---------- Render multi carousel ----------
function renderMultiResults(matches, store) {
  const multiContainer = document.getElementById("multiResult");
  if (!multiContainer) return;

  multiContainer.innerHTML = "";

  const carousel = document.createElement("div");
  carousel.classList.add("carousel");

  const prevBtn = document.createElement("button");
  prevBtn.classList.add("carousel-btn", "carousel-btn-prev");
  prevBtn.textContent = "⟨";

  const nextBtn = document.createElement("button");
  nextBtn.classList.add("carousel-btn", "carousel-btn-next");
  nextBtn.textContent = "⟩";

  const trackContainer = document.createElement("div");
  trackContainer.classList.add("carousel-track-container");

  const list = document.createElement("ul");
  list.classList.add("carousel-track");

  matches.forEach((item, index) => {
    const li = document.createElement("li");
    li.classList.add("result-item");
    if (index === 0) li.classList.add("active");

    const imgSrc = store.getImage(item.ean);

    li.innerHTML = `
      <div class="result-header">
        <p class="result-name"><strong>${safeText(item.name) || "Sin nombre"}</strong></p>
      </div>

      <div class="result-main">
        <div class="result-image-wrapper">
          ${
            imgSrc
              ? `<img src="${imgSrc}" alt="${safeText(item.name)}" />`
              : `<div class="no-image">Sin imagen</div>`
          }
        </div>
        <div class="result-barcode-wrapper">
          <svg class="result-barcode"></svg>
        </div>
      </div>

      <p class="result-ean">EAN: ${safeText(item.ean)}</p>
    `;

    list.appendChild(li);

    const svg = li.querySelector(".result-barcode");
    try {
      JsBarcode(svg, String(item.ean), {
        format: getBarcodeFormat(item.ean),
        lineColor: "#000000",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
      });
    } catch (err) {
      console.error("Error generando barcode para", item.ean, err);
    }
  });

  trackContainer.appendChild(list);
  carousel.appendChild(prevBtn);
  carousel.appendChild(trackContainer);
  carousel.appendChild(nextBtn);

  const counter = document.createElement("div");
  counter.classList.add("carousel-counter");
  counter.textContent = `1 / ${matches.length}`;

  multiContainer.appendChild(carousel);
  multiContainer.appendChild(counter);

  showMultiMode();

  // Lógica carousel
  let currentIndex = 0;
  const items = list.querySelectorAll(".result-item");

  function updateActive() {
    items.forEach((it, idx) => it.classList.toggle("active", idx === currentIndex));
    counter.textContent = `${currentIndex + 1} / ${matches.length}`;
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateActive();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < items.length - 1) {
      currentIndex++;
      updateActive();
    }
  });
}

// ---------- Main ----------
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("eanInput");
  const button = document.getElementById("generateBtn");

  if (!input || !button) {
    console.error("❌ No encuentro #eanInput o #generateBtn en index.html");
    return;
  }

  async function buscarYMostrar() {
    const digits = input.value.trim();

    hideAllResults();

    if (!/^\d{6}$/.test(digits)) {
      alert("❌ Ingresá exactamente 6 dígitos numéricos.");
      return;
    }

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Buscando…";

    try {
      const store = await getStore();

      // ✅ Matches por short y por últimos 6
      const matches = [
        ...store.findByShort(digits),
        ...store.findByLast6(digits),
      ];

      // ✅ dedupe por EAN (evita repetidos si un item matchea por ambos)
      const uniq = new Map();
      for (const it of matches) {
        const key = String(it?.ean ?? "");
        if (key) uniq.set(key, it);
      }
      const finalMatches = [...uniq.values()];

      if (!finalMatches.length) {
        alert("❌ No se encontró ningún producto con esos 6 dígitos.");
        return;
      }

      if (finalMatches.length === 1) {
        await renderSingleResult(finalMatches[0], store);
      } else {
        renderMultiResults(finalMatches, store);
      }
    } catch (e) {
      console.error(e);
      alert("⚠️ Error cargando inventory/images. Revisá que inventory.json e images.json estén publicados en Netlify.");
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  button.addEventListener("click", buscarYMostrar);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarYMostrar();
  });
});