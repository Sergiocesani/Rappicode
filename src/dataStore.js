// src/dataStore.js
let storePromise = null;

async function loadJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`No pude cargar ${path} (${res.status})`);
  return res.json();
}

function normalize(str) {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export async function getStore() {
  if (storePromise) return storePromise;

  storePromise = (async () => {
    const [inventoryRaw, imagesRaw] = await Promise.all([
      loadJson("./inventory.json"),
      loadJson("./images.json"),
    ]);

    const inventory = Array.isArray(inventoryRaw) ? inventoryRaw : [];
    const images = Array.isArray(imagesRaw) ? imagesRaw : [];

    const imageByEan = new Map();
    for (const it of images) {
      const ean = String(it?.ean ?? "").trim();
      const img = String(it?.image ?? "").trim();
      if (ean && img) imageByEan.set(ean, img);
    }

    const nameIndex = inventory.map((it) => ({
      ref: it,
      nameNorm: normalize(it?.name),
    }));

    // indices
    const byShort = new Map();
    const byLast6 = new Map();

    for (const it of inventory) {
      const eanStr = String(it?.ean ?? "").trim();
      const short = String(it?.short ?? "").trim();

      if (short) {
        if (!byShort.has(short)) byShort.set(short, []);
        byShort.get(short).push(it);
      }
      if (eanStr) {
        const last6 = eanStr.slice(-6);
        if (last6) {
          if (!byLast6.has(last6)) byLast6.set(last6, []);
          byLast6.get(last6).push(it);
        }
      }
    }

    // store base
    const store = {
      inventory,
      images,

      getImage(ean) {
        return imageByEan.get(String(ean ?? "").trim()) || "";
      },

      findByShort(short6) {
        const key = String(short6 ?? "").trim();
        return byShort.get(key) || [];
      },

      findByLast6(last6) {
        const key = String(last6 ?? "").trim();
        return byLast6.get(key) || [];
      },

      searchByName(query, { limit = 60 } = {}) {
        const q = normalize(query);
        if (!q) return [];

        const out = [];
        for (const row of nameIndex) {
          if (row.nameNorm.includes(q)) {
            out.push(row.ref);
            if (out.length >= limit) break;
          }
        }
        return out;
      },
    };

    // ✅ GUARDRAIL: si Netlify sirvió una versión vieja o te queda cache,
    // garantizamos que existan estos métodos igual.
    if (typeof store.findByShort !== "function") {
      store.findByShort = (short6) =>
        inventory.filter((x) => String(x?.short ?? "").trim() === String(short6 ?? "").trim());
    }

    if (typeof store.findByLast6 !== "function") {
      store.findByLast6 = (last6) =>
        inventory.filter((x) => String(x?.ean ?? "").trim().slice(-6) === String(last6 ?? "").trim());
    }

    if (typeof store.searchByName !== "function") {
      store.searchByName = (q, { limit = 60 } = {}) => {
        const qq = normalize(q);
        if (!qq) return [];
        const out = [];
        for (const it of inventory) {
          if (normalize(it?.name).includes(qq)) {
            out.push(it);
            if (out.length >= limit) break;
          }
        }
        return out;
      };
    }

    return store;
  })();

  return storePromise;
}