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

function safeText(v) {
  return (v ?? "").toString();
}

function renderResults(results, store) {
  const container = document.getElementById("searchResults");
  if (!container) return;

  container.innerHTML = "";

  if (!results.length) {
    container.innerHTML = "<p>No se encontraron productos.</p>";
    return;
  }

  // ====== WRAPPER CAROUSEL ======
  const wrap = document.createElement("div");
  wrap.className = "search-carousel";

  // Header con flechas (izq/der) y acciones
  const head = document.createElement("div");
  head.className = "search-carousel__head";

  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel-btn carousel-btn-prev";
  prevBtn.type = "button";
  prevBtn.textContent = "⟨";

  const centerActions = document.createElement("div");
  centerActions.className = "search-carousel__actions";
  centerActions.innerHTML = `
    <div class="search-carousel__counter" id="searchCounter">1 / ${results.length}</div>
    <button class="btn-mini" id="copyBtn" type="button">Copiar EAN</button>
  `;

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel-btn carousel-btn-next";
  nextBtn.type = "button";
  nextBtn.textContent = "⟩";

  head.appendChild(prevBtn);
  head.appendChild(centerActions);
  head.appendChild(nextBtn);

  // Stage (donde se muestra 1 item)
  const stage = document.createElement("div");
  stage.className = "search-carousel__stage";
  stage.innerHTML = `
    <div class="search-carousel__name" id="skuTitle"></div>

    <div class="search-carousel__body">
      <div class="search-carousel__img">
        <img id="skuImg" alt="Imagen producto" />
        <div id="skuNoImg" class="no-image hidden">Sin imagen</div>
      </div>

      <div class="search-carousel__barcode">
        <div class="result-barcode-wrapper">
          <svg id="skuBarcode" class="result-barcode"></svg>
        </div>
        <p class="result-ean" id="skuEan"></p>
      </div>
    </div>
  `;

  wrap.appendChild(head);
  wrap.appendChild(stage);
  container.appendChild(wrap);

  // ====== LOGICA ======
  let currentIndex = 0;

  const counterEl = document.getElementById("searchCounter");
  const titleEl = document.getElementById("skuTitle");
  const imgEl = document.getElementById("skuImg");
  const noImgEl = document.getElementById("skuNoImg");
  const eanEl = document.getElementById("skuEan");
  const barcodeEl = document.getElementById("skuBarcode");
  const copyBtn = document.getElementById("copyBtn");

  function setDisabled() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === results.length - 1;

    prevBtn.style.opacity = prevBtn.disabled ? 0.35 : 1;
    nextBtn.style.opacity = nextBtn.disabled ? 0.35 : 1;
  }

  function renderCurrent() {
    const item = results[currentIndex];

    // Counter
    if (counterEl) counterEl.textContent = `${currentIndex + 1} / ${results.length}`;

    // Title
    if (titleEl) titleEl.textContent = safeText(item.name) || "Sin nombre";

    // EAN
    const ean = safeText(item.ean);
    if (eanEl) eanEl.textContent = `EAN: ${ean}`;

    // Copy
    if (copyBtn) copyBtn.onclick = () => copyToClipboard(ean);

    // Image
    const imgSrc = store.getImage(item.ean);
    if (imgSrc) {
      imgEl.src = imgSrc;
      imgEl.classList.remove("hidden");
      noImgEl.classList.add("hidden");
    } else {
      imgEl.removeAttribute("src");
      imgEl.classList.add("hidden");
      noImgEl.classList.remove("hidden");
    }

    // Barcode
    barcodeEl.innerHTML = "";
    try {
      JsBarcode(barcodeEl, String(ean), {
        format: getBarcodeFormat(ean),
        lineColor: "#000000",
        width: 2.4,
        height: 90,
        displayValue: true,
        fontSize: 16,
      });
    } catch (err) {
      console.error("Error generando barcode para", ean, err);
    }

    setDisabled();
  }

  prevBtn.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex--;
      renderCurrent();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentIndex < results.length - 1) {
      currentIndex++;
      renderCurrent();
    }
  });

  // Primera render
  renderCurrent();
}

async function buscar() {
  const input = document.getElementById("searchInput");
  const raw = input?.value?.trim() || "";

  if (!raw) {
    alert("Escribí algo para buscar.");
    return;
  }

  const store = await getStore();

  // 6 dígitos => short + last6
  if (/^\d{6}$/.test(raw)) {
    const byShort = store.findByShort(raw);
    const byLast6 = store.findByLast6(raw);

    const map = new Map();
    for (const it of [...byShort, ...byLast6]) {
      const key = String(it?.ean ?? "");
      if (key) map.set(key, it);
    }
    renderResults(Array.from(map.values()), store);
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