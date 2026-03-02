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

    // Map: ean -> image url
    const imageByEan = new Map();
    for (const it of images) {
      if (!it) continue;
      const ean = String(it.ean ?? "").trim();
      const img = String(it.image ?? "").trim();
      if (ean && img) imageByEan.set(ean, img);
    }

    // Pre-index simple para búsqueda por nombre
    const nameIndex = inventory.map((it) => ({
      ref: it,
      nameNorm: normalize(it?.name),
      eanStr: String(it?.ean ?? ""),
    }));

    return {
      inventory,
      images,

      getImage(ean) {
        return imageByEan.get(String(ean ?? "").trim()) || "";
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
  })();

  return storePromise;
}