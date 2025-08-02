export async function findSku(last6) {
  try {
    const cleaned = last6.trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) return null;

    const response = await fetch('./inventory.json');
    const inventory = await response.json();

    // 1. Prioridad: coincidencia exacta en campo 'short'
    const byShort = inventory.find(item => item.short === cleaned);
    if (byShort) return byShort;

    // 2. Coincidencia exacta en los últimos 6 del EAN
    const exact = inventory.find(item => String(item.ean).slice(-6) === cleaned);
    if (exact) return exact;

    // 3. Coincidencia más laxa
    const loose = inventory.find(item => String(item.ean).includes(cleaned));
    return loose || null;

  } catch (error) {
    console.error('Error cargando inventory.json:', error);
    return null;
  }
}
