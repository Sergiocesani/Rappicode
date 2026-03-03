// src/dataStore.js (FAST)
let storePromise = null;

async function loadJson(path) {
  const res = await fetch(path, { cache: "force-cache" }); // ✅ deja cachear en Netlify
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

    // ---- image map
    const imageByEan = new Map();
    for (const it of images) {
      const ean = String(it?.ean ?? "").trim();
      const img = String(it?.image ?? "").trim();
      if (ean && img) imageByEan.set(ean, img);
    }

    // ---- indexes
    const byEan = new Map();     // ean -> item
    const byShort = new Map();   // short -> items[]
    const byLast6 = new Map();   // last6 -> items[]
    const nameIndex = [];        // [{ref, nameNorm}]

    for (const it of inventory) {
      const eanStr = String(it?.ean ?? "").trim();
      const short = String(it?.short ?? "").trim();

      if (eanStr && !byEan.has(eanStr)) byEan.set(eanStr, it);

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

      nameIndex.push({ ref: it, nameNorm: normalize(it?.name) });
    }

    // Cache simple por query (acelera tipeo incremental)
    const nameCache = new Map(); // q -> results[]

    const store = {
      inventory,

      getImage(ean) {
        return imageByEan.get(String(ean ?? "").trim()) || "";
      },

      findByShort(short6) {
        return byShort.get(String(short6 ?? "").trim()) || [];
      },

      findByLast6(last6) {
        return byLast6.get(String(last6 ?? "").trim()) || [];
      },

      findByEanExact(ean) {
        return byEan.get(String(ean ?? "").trim()) || null;
      },

      searchByEanIncludes(part, { limit = 60 } = {}) {
        const t = String(part ?? "").trim();
        if (!t) return [];
        const out = [];
        for (const it of inventory) {
          const e = String(it?.ean ?? "");
          if (e.includes(t)) {
            out.push(it);
            if (out.length >= limit) break;
          }
        }
        return out;
      },

      searchByName(query, { limit = 60 } = {}) {
        const q = normalize(query);
        if (!q) return [];

        if (nameCache.has(q)) return nameCache.get(q).slice(0, limit);

        const out = [];
        for (const row of nameIndex) {
          if (row.nameNorm.includes(q)) {
            out.push(row.ref);
            if (out.length >= limit) break;
          }
        }
        nameCache.set(q, out);
        return out;
      },
    };

    return store;
  })();

  return storePromise;
}