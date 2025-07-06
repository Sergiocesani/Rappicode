export async function findSku(last6) {
  try {
    const cleaned = last6.trim();
    if (cleaned.length < 6 || cleaned.length > 7) return null;

    const response = await fetch('./inventory.json');
    const inventory = await response.json();

    const exact = inventory.find((item) => item.ean.endsWith(cleaned));
    if (exact) return exact;

    const loose = inventory.find((item) => item.ean.includes(cleaned));
    return loose || null;

  } catch (error) {
    console.error('Error cargando inventory.json:', error);
    return null;
  }
}
