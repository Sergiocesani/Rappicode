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

    // Map: ean -> image
    const imageByEan = new Map();
    for (const it of images) {
      const ean = String(it?.ean ?? "").trim();
      const img = String(it?.image ?? "").trim();
      if (ean && img) imageByEan.set(ean, img);
    }

    // Index para búsqueda por nombre
    const nameIndex = inventory.map((it) => ({
      ref: it,
      nameNorm: normalize(it?.name),
    }));

    // Index para short (si existe) y last6
    const byShort = new Map(); // short -> array items
    const byLast6 = new Map(); // last6 -> array items

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

    return {
      inventory,
      images,

      // --- imágenes ---
      getImage(ean) {
        return imageByEan.get(String(ean ?? "").trim()) || "";
      },

      // --- compat: lo que te está rompiendo en Netlify ---
      findByShort(short6) {
        const key = String(short6 ?? "").trim();
        return byShort.get(key) || [];
      },

      // --- helper nuevo: últimos 6 ---
      findByLast6(last6) {
        const key = String(last6 ?? "").trim();
        return byLast6.get(key) || [];
      },

      // --- búsqueda por nombre ---
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
  })();

  return storePromise;
}