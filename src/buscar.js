// src/buscar.js
import { getBarcodeFormat } from "./barcodeFormat.js";
import { getStore } from "./dataStore.js";

const $ = (id) => document.getElementById(id);

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

function safeText(v) {
  return (v ?? "").toString();
}

function dedupeByEan(items) {
  const m = new Map();
  for (const it of items) {
    const key = String(it?.ean ?? "").trim();
    if (key) m.set(key, it);
  }
  return [...m.values()];
}

function buildCarouselShell(total) {
  const container = $("searchResults");
  container.innerHTML = "";

  const wrap = document.createElement("section");
  wrap.className = "search-carousel";

  wrap.innerHTML = `
    <div class="search-carousel__head">
      <div class="search-carousel__title">Resultados</div>
      <div class="search-carousel__counter" id="scCounter">1 / ${total}</div>
    </div>

    <div class="search-carousel__frame">
      <button class="carousel-btn" id="scPrev" type="button" aria-label="Anterior">⟨</button>
      <div class="search-carousel__stage" id="scStage"></div>
      <button class="carousel-btn" id="scNext" type="button" aria-label="Siguiente">⟩</button>
    </div>
  `;

  container.appendChild(wrap);
}

function renderActiveSlide(item, store) {
  const stage = $("scStage");
  if (!stage) return;

  const name = safeText(item?.name) || "Sin nombre";
  const ean = safeText(item?.ean);
  const imgSrc = store.getImage(ean);

  stage.innerHTML = `
    <article class="result-item active">
      <div class="result-header">
        <p class="result-name"><strong>${name}</strong></p>
        <button class="btn-mini js-copy" type="button">Copiar EAN</button>
      </div>

      <div class="result-main">
        <div class="result-image-wrapper">
          ${
            imgSrc
              ? `<img src="${imgSrc}" alt="${name}" loading="lazy" />`
              : `<div class="no-image">Sin imagen</div>`
          }
        </div>

        <div class="result-barcode-wrapper">
          <svg class="result-barcode" id="scBarcode"></svg>
        </div>
      </div>

      <p class="result-ean">EAN: <strong>${ean}</strong></p>
    </article>
  `;

  stage.querySelector(".js-copy")?.addEventListener("click", () => copyToClipboard(ean));

  // ✅ Barcode SOLO del item activo (esto es lo que acelera todo)
  const svg = $("scBarcode");
  if (svg) {
    try {
      svg.innerHTML = "";
      JsBarcode(svg, String(ean), {
        format: getBarcodeFormat(ean),
        lineColor: "#000000",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
      });
    } catch (err) {
      console.error("Error barcode:", err);
    }
  }
}

async function buscar() {
  const raw = $("searchInput")?.value.trim() || "";
  if (!raw) {
    alert("Escribí algo para buscar.");
    return;
  }

  // UX: loader simple
  const container = $("searchResults");
  container.innerHTML = `<div class="home-empty">Buscando…</div>`;

  const store = await getStore();

  let results = [];

  // Si son 6 dígitos: short + last6 (rápido por Map)
  if (/^\d{6}$/.test(raw)) {
    results = dedupeByEan([...store.findByShort(raw), ...store.findByLast6(raw)]);
  } else {
    if (raw.length < 3) {
      alert("Escribí al menos 3 letras para buscar por nombre.");
      container.innerHTML = "";
      return;
    }
    // ✅ limit razonable para no cargar de más
    results = store.searchByName(raw, { limit: 120 });
  }

  if (!results.length) {
    container.innerHTML = `<div class="home-empty">No se encontraron productos.</div>`;
    return;
  }

  // ---- Carousel real (1 item visible) ----
  buildCarouselShell(results.length);

  let idx = 0;
  const counter = $("scCounter");
  const prev = $("scPrev");
  const next = $("scNext");

  function paint() {
    if (counter) counter.textContent = `${idx + 1} / ${results.length}`;
    renderActiveSlide(results[idx], store);

    // deshabilitar límites
    if (prev) prev.disabled = idx === 0;
    if (next) next.disabled = idx === results.length - 1;
  }

  prev?.addEventListener("click", () => {
    if (idx > 0) {
      idx--;
      paint();
    }
  });

  next?.addEventListener("click", () => {
    if (idx < results.length - 1) {
      idx++;
      paint();
    }
  });

  // teclado
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" && idx > 0) {
      idx--;
      paint();
    }
    if (e.key === "ArrowRight" && idx < results.length - 1) {
      idx++;
      paint();
    }
  });

  paint();
}

document.addEventListener("DOMContentLoaded", () => {
  $("searchBtn")?.addEventListener("click", buscar);
  $("searchInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") buscar();
  });
});