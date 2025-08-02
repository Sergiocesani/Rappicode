export async function findSku(last6) {
  try {
    const cleaned = last6.trim();
    if (cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) return null;

    const response = await fetch('./inventory.json');
    const inventory = await response.json();

    // Buscar coincidencia exacta en los últimos 6 dígitos
    const exact = inventory.find(item => {
      const eanStr = String(item.ean).trim();
      return eanStr.slice(-6) === cleaned;
    });

    if (exact) return exact;

    // Si no encuentra, buscar coincidencia parcial como fallback
    const loose = inventory.find(item => {
      const eanStr = String(item.ean).trim();
      return eanStr.includes(cleaned);
    });

    return loose || null;

  } catch (error) {
    console.error('Error cargando inventory.json:', error);
    return null;
  }
}

