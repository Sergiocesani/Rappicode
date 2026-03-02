// src/main.js
import { renderBarcode } from "./barcode.js";
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

function ensureDigits6(s) {
  const v = String(s).trim();
  return /^\d{6}$/.test(v) ? v : "";
}

function renderMultiResults(matches, store) {
  const multiContainer = document.getElementById("multiResult");
  const singleSection = document.getElementById("result");

  singleSection.classList.add("hidden");
  multiContainer.innerHTML = "";

  if (!matches.length) {
    multiContainer.innerHTML = "<p>No se encontraron productos.</p>";
    multiContainer.classList.remove("hidden");
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

  matches.forEach((item, index) => {
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

    // Copy
    li.querySelector(".js-copy")?.addEventListener("click", () => copyToClipboard(item.ean));

    // Barcode
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
  counter.textContent = `1 / ${matches.length}`;

  multiContainer.appendChild(carousel);
  multiContainer.appendChild(counter);
  multiContainer.classList.remove("hidden");

  let currentIndex = 0;
  const items = list.querySelectorAll(".result-item");

  function updateActive() {
    items.forEach((node, idx) => node.classList.toggle("active", idx === currentIndex));
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

async function renderSingleResult(sku, store) {
  const resultSection = document.getElementById("result");
  const multiContainer = document.getElementById("multiResult");

  const skuName = document.getElementById("skuName");
  const fullEan = document.getElementById("fullEan");
  const skuImage = document.getElementById("skuImage");

  multiContainer.classList.add("hidden");
  multiContainer.innerHTML = "";

  skuName.textContent = sku.name || "Sin nombre";
  fullEan.textContent = sku.ean || "";

  const imgSrc = store.getImage(sku.ean);
  if (imgSrc) {
    skuImage.src = imgSrc;
    skuImage.style.display = "block";
  } else {
    skuImage.style.display = "none";
  }

  // Tu renderer existente (elige formato internamente)
  renderBarcode(sku.ean);

  // Mini acción: click para copiar EAN
  fullEan.style.cursor = "pointer";
  fullEan.title = "Click para copiar";
  fullEan.onclick = () => copyToClipboard(sku.ean);

  resultSection.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("eanInput");
  const button = document.getElementById("generateBtn");
  const resultSection = document.getElementById("result");

  if (!input || !button || !resultSection) return;

  async function buscarYMostrar() {
    const digits = ensureDigits6(input.value);
    if (!digits) {
      alert("❌ Ingresá exactamente 6 dígitos numéricos.");
      return;
    }

    const store = await getStore();

    // Prioridad: short (puede traer más de 1)
    const byShort = store.findByShort(digits);
    const byLast6 = store.findByLast6(digits);

    // Unificamos (sin duplicar)
    const map = new Map();
    for (const it of [...byShort, ...byLast6]) {
      const key = `${it.ean}__${it.name}`;
      map.set(key, it);
    }
    const matches = Array.from(map.values());

    if (matches.length === 0) {
      alert("❌ No se encontró ningún producto con esos 6 dígitos.");
      resultSection.classList.add("hidden");
      document.getElementById("multiResult")?.classList.add("hidden");
      return;
    }

    if (matches.length === 1) {
      await renderSingleResult(matches[0], store);
    } else {
      renderMultiResults(matches, store);
    }
  }

  button.addEventListener("click", buscarYMostrar);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscarYMostrar();
  });
});