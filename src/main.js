// src/main.js
import { renderBarcode } from "./barcode.js";
import { getBarcodeFormat } from "./barcodeFormat.js"; // si no lo tenés, lo saco
// OJO: si no querés importar getBarcodeFormat acá, comentá esa línea y listo.

let inventoryCache = null;
let imagesCache = null;

// ---------- Loaders ----------
async function loadInventory() {
  if (inventoryCache) return inventoryCache;

  const res = await fetch("./inventory.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude cargar inventory.json (${res.status})`);
  const json = await res.json();
  inventoryCache = Array.isArray(json) ? json : [];
  return inventoryCache;
}

async function loadImages() {
  if (imagesCache) return imagesCache;

  const res = await fetch("./images.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude cargar images.json (${res.status})`);
  const json = await res.json();
  imagesCache = Array.isArray(json) ? json : [];
  return imagesCache;
}

function safeText(v) {
  return (v ?? "").toString();
}

// ---------- UI helpers ----------
function showSingleMode() {
  document.getElementById("multiResult")?.classList.add("hidden");
  document.getElementById("multiResult").innerHTML = "";
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

async function renderSingleResult(sku) {
  const skuName = document.getElementById("skuName");
  const fullEan = document.getElementById("fullEan");
  const skuImage = document.getElementById("skuImage");

  if (skuName) skuName.textContent = safeText(sku.name) || "Sin nombre";
  if (fullEan) fullEan.textContent = safeText(sku.ean);

  // imagen
  try {
    const images = await loadImages();
    const match = images.find((x) => safeText(x.ean) === safeText(sku.ean));
    if (skuImage) {
      if (match?.image) {
        skuImage.src = match.image;
        skuImage.style.display = "block";
      } else {
        skuImage.removeAttribute("src");
        skuImage.style.display = "none";
      }
    }
  } catch (e) {
    console.warn("No se pudo cargar images.json:", e);
    if (skuImage) {
      skuImage.removeAttribute("src");
      skuImage.style.display = "none";
    }
  }

  // barcode (usa tu renderBarcode que ya decide formato)
  renderBarcode(sku.ean);

  showSingleMode();
}

function renderMultiResults(matches, images) {
  const multiContainer = document.getElementById("multiResult");
  if (!multiContainer) return;

  multiContainer.innerHTML = "";

  // Carousel
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

    const matchImage = images.find((img) => safeText(img.ean) === safeText(item.ean));
    const imgSrc = matchImage?.image || "";

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

    // Barcode para ese item
    const svg = li.querySelector(".result-barcode");

    try {
      // Si tenés barcodeFormat.js, usalo
      const format = getBarcodeFormat ? getBarcodeFormat(item.ean) : undefined;

      JsBarcode(svg, String(item.ean), {
        format: format || "CODE128",
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

  // Lógica
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

// ---------- Main logic ----------
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("eanInput");
  const button = document.getElementById("generateBtn");

  if (!input || !button) {
    console.error("❌ No encuentro #eanInput o #generateBtn en index.html");
    return;
  }

  async function buscarYMostrar() {
    const digits = input.value.trim();

    // Limpia resultados previos sí o sí
    hideAllResults();

    if (!/^\d{6}$/.test(digits)) {
      alert("❌ Ingresá exactamente 6 dígitos numéricos.");
      return;
    }

    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Buscando…";

    try {
      const inventory = await loadInventory();
      const images = await loadImages();

      // ✅ match por últimos 6 + short
      const matches = inventory.filter((item) => {
        const eanStr = safeText(item.ean);
        const short = safeText(item.short);
        return eanStr.slice(-6) === digits || short === digits;
      });

      if (!matches.length) {
        alert("❌ No se encontró ningún producto con esos 6 dígitos.");
        return;
      }

      if (matches.length === 1) {
        await renderSingleResult(matches[0]);
      } else {
        renderMultiResults(matches, images);
      }
    } catch (e) {
      console.error(e);
      alert("⚠️ Error cargando inventory/images. Revisá que estén en la misma carpeta y que el server esté corriendo.");
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