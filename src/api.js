// src/api.js
export async function findSku(last6) {
  try {
    const cleaned = last6.trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
      console.warn('findSku: input inválido ->', cleaned);
      return null;
    }

    console.log('findSku: buscando SKU con terminación', cleaned);

    const response = await fetch('./inventory.json');
    console.log('findSku: response status', response.status);

    if (!response.ok) {
      console.error('findSku: error HTTP al cargar inventory.json:', response.status, response.statusText);
      return null;
    }

    const inventory = await response.json();
    console.log('findSku: items en inventory.json =', inventory.length);

    // 1. Prioridad: campo 'short' (si existe)
    const byShort = inventory.find(item => item.short === cleaned);
    if (byShort) {
      console.log('findSku: encontrado por short:', byShort);
      return byShort;
    }

    // 2. Coincidencia exacta en los últimos 6 del EAN
    const exact = inventory.find(item => String(item.ean).slice(-6) === cleaned);
    if (exact) {
      console.log('findSku: encontrado por últimos 6:', exact);
      return exact;
    }

    // 3. Coincidencia más laxa (por si acaso)
    const loose = inventory.find(item => String(item.ean).includes(cleaned));
    if (loose) {
      console.log('findSku: encontrado por includes:', loose);
      return loose;
    }

    console.warn('findSku: no se encontró nada para', cleaned);
    return null;

  } catch (error) {
    console.error('Error cargando o procesando inventory.json en findSku:', error);
    return null;
  }
}
