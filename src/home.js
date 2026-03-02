// src/home.js
import { getStore } from "./dataStore.js";
import { getBarcodeFormat } from "./barcodeFormat.js";

console.log("✅ home.js cargado");

const $ = (id) => document.getElementById(id);

const els = {
  grid: () => $("homeGrid"),
  empty: () => $("homeEmpty"),
  count: () => $("homeCount"),
  input: () => $("homeSearchInput"),
  clear: () => $("homeSearchClear"),
  shuffle: () => $("shuffleBtn"),
  top: () => $("topBtn"),
  scanBtn: () => $("scanBtn"),

  overlay: () => $("drawerOverlay"),
  drawer: () => $("drawer"),
  close: () => $("drawerClose"),
  title: () => $("drawerTitle"),
  img: () => $("drawerImage"),
  ean: () => $("drawerEan"),
  copy: () => $("drawerCopy"),
  barcode: () => $("drawerBarcode"),

  scanModal: () => $("scanModal"),
  scanClose: () => $("scanClose"),
};

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

function makeCard(item, store) {
  const card = document.createElement("button");
  card.type = "button";
  card.className = "p-card";

  const imgSrc = store.getImage(item.ean);
  const name = safeText(item.name) || "Sin nombre";
  const ean = safeText(item.ean);

  card.innerHTML = `
    <div class="p-card__media">
      ${
        imgSrc
          ? `<img src="${imgSrc}" alt="${name}" loading="lazy" />`
          : `<div class="p-card__noimg">Sin imagen</div>`
      }
    </div>
    <div class="p-card__body">
      <div class="p-card__name">${name}</div>
      <div class="p-card__ean">${ean}</div>
    </div>
  `;

  card.addEventListener("click", () => openDrawer(item, store));
  return card;
}

function openDrawer(item, store) {
  const overlay = els.overlay();
  const drawer = els.drawer();
  const title = els.title();
  const eanEl = els.ean();
  const img = els.img();
  const barcode = els.barcode();
  const copyBtn = els.copy();

  if (!overlay || !drawer || !title || !eanEl || !img || !barcode || !copyBtn) {
    console.error("❌ Faltan elementos del drawer en el HTML.");
    toast("Error: falta drawer en HTML/CSS");
    return;
  }

  title.textContent = safeText(item.name) || "Producto";
  eanEl.textContent = safeText(item.ean);

  const imgSrc = store.getImage(item.ean);
  if (imgSrc) {
    img.src = imgSrc;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }

  barcode.innerHTML = "";
  try {
    JsBarcode(barcode, String(item.ean), {
      format: getBarcodeFormat(item.ean),
      lineColor: "#000000",
      width: 2.2,
      height: 90,
      displayValue: true,
      fontSize: 16,
    });
  } catch (e) {
    console.error("Barcode error:", e);
  }

  copyBtn.onclick = () => copyToClipboard(item.ean);

  overlay.classList.remove("hidden");
  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  const overlay = els.overlay();
  const drawer = els.drawer();
  if (overlay) overlay.classList.add("hidden");
  if (drawer) {
    drawer.classList.add("hidden");
    drawer.setAttribute("aria-hidden", "true");
  }
}

function openScanModal() {
  const modal = els.scanModal();
  if (!modal) return;
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function closeScanModal() {
  const modal = els.scanModal();
  if (!modal) return;
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}

function pickRandom(items, n) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function renderGrid(list, store) {
  const grid = els.grid();
  const empty = els.empty();
  if (!grid || !empty) return;

  grid.innerHTML = "";

  if (!list.length) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  const frag = document.createDocumentFragment();
  for (const item of list) frag.appendChild(makeCard(item, store));
  grid.appendChild(frag);
}

function buildTop(items, limit = 36) {
  return items
    .filter((x) => x?.ean && x?.name)
    .sort(
      (a, b) =>
        b.name.length + String(b.ean).length - (a.name.length + String(a.ean).length)
    )
    .slice(0, limit);
}

document.addEventListener("DOMContentLoaded", async () => {
  const store = await getStore();

  if (els.count()) els.count().textContent = `${store.inventory.length} SKUs`;
  renderGrid(buildTop(store.inventory, 36), store);

  // Drawer events
  if (els.close()) els.close().addEventListener("click", closeDrawer);
  if (els.overlay()) els.overlay().addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDrawer();
      closeScanModal();
    }
  });

  // Scan modal
  if (els.scanBtn()) els.scanBtn().addEventListener("click", openScanModal);
  if (els.scanClose()) els.scanClose().addEventListener("click", closeScanModal);

  // Tools
  if (els.shuffle()) els.shuffle().addEventListener("click", () => renderGrid(pickRandom(store.inventory, 36), store));
  if (els.top()) els.top().addEventListener("click", () => renderGrid(buildTop(store.inventory, 36), store));

  // Search
  const input = els.input();
  const clear = els.clear();

  if (!input || !clear) return;

  let lastQuery = "";
  function applySearch(q) {
    const term = q.trim();
    if (!term) {
      renderGrid(buildTop(store.inventory, 36), store);
      if (els.count()) els.count().textContent = `${store.inventory.length} SKUs`;
      return;
    }

    const isDigits = /^\d{6,}$/.test(term);
    let results = [];

    if (isDigits) {
      results = store.inventory
        .filter((x) => String(x.ean ?? "").includes(term))
        .slice(0, 60);
    } else {
      results = store.searchByName(term, { limit: 60 });
    }

    if (els.count()) els.count().textContent = `${results.length} resultados`;
    renderGrid(results, store);
  }

  input.addEventListener("input", () => {
    const q = input.value;
    lastQuery = q;
    window.clearTimeout(input._t);
    input._t = window.setTimeout(() => {
      if (q === lastQuery) applySearch(q);
    }, 180);
  });

  clear.addEventListener("click", () => {
    input.value = "";
    applySearch("");
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = els.grid()?.querySelector(".p-card");
      if (first) first.click();
    }
  });
});