/**
 * Busca un producto cuyo EAN termine o contenga los últimos 6 dígitos proporcionados.
 * @param {string} last6 - Últimos 6 dígitos del código EAN.
 * @returns {Promise<object|null>} - Objeto con { ean, name } o null si no se encuentra.
 */
export async function findSku(last6) {
  try {
    const cleaned = last6.trim();

    // Validar longitud del input
    if (cleaned.length < 6 || cleaned.length > 7) return null;

    const response = await fetch('./inventory.json');
    const inventory = await response.json();

    // Primero busca si termina con esos 6 dígitos
    const exact = inventory.find((item) => item.ean.endsWith(cleaned));
    if (exact) return exact;

    // Si no encuentra, intenta buscar si lo incluye
    const loose = inventory.find((item) => item.ean.includes(cleaned));
    return loose || null;

  } catch (error) {
    console.error('Error cargando inventory.json:', error);
    return null;
  }
}


