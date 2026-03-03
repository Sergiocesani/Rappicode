// src/home.js
import { getStore } from "./dataStore.js";
import { getBarcodeFormat } from "./barcodeFormat.js";

const $ = (id) => document.getElementById(id);

const els = {
  grid: () => $("homeGrid"),
  empty: () => $("homeEmpty"),
  count: () => $("homeCount"),
  input: () => $("homeSearchInput"),
  clear: () => $("homeSearchClear"),
  shuffle: () => $("shuffleBtn"),
  top: () => $("topBtn"),

  overlay: () => $("drawerOverlay"),
  drawer: () => $("drawer"),
  close: () => $("drawerClose"),
  title: () => $("drawerTitle"),
  img: () => $("drawerImage"),
  ean: () => $("drawerEan"),
  copy: () => $("drawerCopy"),
  barcode: () => $("drawerBarcode"),
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

  els.title().textContent = safeText(item.name) || "Producto";
  els.ean().textContent = safeText(item.ean);

  const imgSrc = store.getImage(item.ean);
  const img = els.img();
  if (imgSrc) {
    img.src = imgSrc;
    img.style.display = "block";
  } else {
    img.removeAttribute("src");
    img.style.display = "none";
  }

  const svg = els.barcode();
  svg.innerHTML = "";
  try {
    JsBarcode(svg, String(item.ean), {
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

  els.copy().onclick = () => copyToClipboard(item.ean);

  overlay.classList.remove("hidden");
  drawer.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  els.overlay().classList.add("hidden");
  els.drawer().classList.add("hidden");
  els.drawer().setAttribute("aria-hidden", "true");
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
    .sort((a, b) => (b.name.length + String(b.ean).length) - (a.name.length + String(a.ean).length))
    .slice(0, limit);
}

document.addEventListener("DOMContentLoaded", async () => {
  const store = await getStore();

  // ✅ Home: sacar botón "Escanear" si existe en el HTML
  const scanBtn = document.getElementById("scanBtn");
  if (scanBtn) scanBtn.remove();

  if (els.count()) els.count().textContent = `${store.inventory.length} SKUs`;
  renderGrid(buildTop(store.inventory, 36), store);

  els.close().addEventListener("click", closeDrawer);
  els.overlay().addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

  els.shuffle().addEventListener("click", () => renderGrid(pickRandom(store.inventory, 36), store));
  els.top().addEventListener("click", () => renderGrid(buildTop(store.inventory, 36), store));

  const input = els.input();
  const clear = els.clear();

  let lastQuery = "";
  function applySearch(q) {
    const term = q.trim();
    if (!term) {
      renderGrid(buildTop(store.inventory, 36), store);
      els.count().textContent = `${store.inventory.length} SKUs`;
      return;
    }

    const isDigits = /^\d{6,}$/.test(term);
    let results = [];

    if (isDigits) {
      results = store.inventory.filter((x) => String(x.ean ?? "").includes(term)).slice(0, 60);
    } else {
      results = store.searchByName(term, { limit: 60 });
    }

    els.count().textContent = `${results.length} resultados`;
    renderGrid(results, store);
  }

  input.addEventListener("input", () => {
    const q = input.value;
    lastQuery = q;
    window.clearTimeout(input._t);
    input._t = window.setTimeout(() => {
      if (q === lastQuery) applySearch(q);
    }, 160);
  });

  clear.addEventListener("click", () => {
    input.value = "";
    applySearch("");
    input.focus();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const first = els.grid().querySelector(".p-card");
      if (first) first.click();
    }
  });
});