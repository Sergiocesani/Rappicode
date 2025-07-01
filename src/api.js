/**
 * Busca un producto cuyo EAN termine con los últimos 6 dígitos proporcionados.
 * @param {string} last6 - Últimos 6 dígitos del código EAN.
 * @returns {Promise<object|null>} - Objeto con { ean, name } o null si no se encuentra.
 */
export async function findSku(last6) {
  try {
    const response = await fetch('./inventory.json');
    const inventory = await response.json();
    return inventory.find((item) => item.ean.endsWith(last6)) || null;
  } catch (error) {
    console.error('Error cargando inventory.json:', error);
    return null;
  }
}

