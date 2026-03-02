// src/buscar.js
import { getBarcodeFormat } from "./barcodeFormat.js";
import { getStore } from "./dataStore.js";

function toast(msg, ms = 1200) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(String(text));
    toast("Copiado ✅");
  } catch {
    toast("No se pudo copiar");
  }
}

function renderResults(results, store) {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  const carousel = document.createElement("div");
  carousel.className = "carousel";

  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel-btn carousel-btn-prev";
  prevBtn.type = "button";
  prevBtn.textContent = "⟨";

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel-btn carousel-btn-next";
  nextBtn.type = "button";
  nextBtn.textContent = "⟩";

  const trackContainer = document.createElement("div");
  trackContainer.className = "carousel-track-container";

  const list = document.createElement("ul");
  list.className = "carousel-track";

  results.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "result-item" + (index === 0 ? " active" : "");

    const imgSrc = store.getImage(item.ean);

    li.innerHTML = `
      <div class="result-header">
        <p class="result-name"><strong>${item.name || "Sin nombre"}</strong></p>
        <button class="btn-mini js-copy" type="button">Copiar EAN</button>
      </div>

      <div class="result-main">
        <div class="result-image-wrapper">
          ${
            imgSrc
              ? `<img src="${imgSrc}" alt="${item.name || "Producto"}" />`
              : `<div class="no-image">Sin imagen</div>`
          }
        </div>

        <div class="result-barcode-wrapper">
          <svg class="result-barcode"></svg>
        </div>
      </div>

      <p class="result-ean">EAN: ${item.ean}</p>
    `;

    li.querySelector(".js-copy")?.addEventListener("click", () => copyToClipboard(item.ean));

    const svg = li.querySelector(".result-barcode");
    const format = getBarcodeFormat(item.ean);

    try {
      JsBarcode(svg, String(item.ean), {
        format,
        lineColor: "#000000",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
      });
    } catch (err) {
      console.error("Error generando barcode para", item.ean, err);
    }

    list.appendChild(li);
  });

  trackContainer.appendChild(list);
  carousel.appendChild(prevBtn);
  carousel.appendChild(trackContainer);
  carousel.appendChild(nextBtn);

  const counter = document.createElement("div");
  counter.className = "carousel-counter";
  counter.textContent = `1 / ${results.length}`;

  container.appendChild(carousel);
  container.appendChild(counter);

  let currentIndex = 0;
  const items = list.querySelectorAll(".result-item");

  function updateActive() {
    items.forEach((node, idx) => node.classList.toggle("active", idx === currentIndex));
    counter.textContent = `${currentIndex + 1} / ${results.length}`;
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

async function buscar() {
  const raw = document.getElementById("searchInput").value.trim();
  if (!raw) {
    alert("Escribí algo para buscar.");
    return;
  }

  const store = await getStore();

  // 6 dígitos => last6
  if (/^\d{6}$/.test(raw)) {
    const byShort = store.findByShort(raw);
    const byLast6 = store.findByLast6(raw);

    const map = new Map();
    for (const it of [...byShort, ...byLast6]) {
      const key = `${it.ean}__${it.name}`;
      map.set(key, it);
    }
    const results = Array.from(map.values());
    renderResults(results, store);
    return;
  }

  // texto => nombre (>=3)
  if (raw.length < 3) {
    alert("Escribí al menos 3 letras para buscar por nombre.");
    return;
  }

  const results = store.searchByName(raw, { limit: 120 });
  renderResults(results, store);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("searchBtn");
  const input = document.getElementById("searchInput");

  btn?.addEventListener("click", buscar);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscar();
  });
});