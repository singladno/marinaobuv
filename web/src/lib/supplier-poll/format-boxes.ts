/** Russian pluralization for "коробка" / boxes in order qty. */
export function formatBoxesRu(qty: number): string {
  const n = Math.abs(Math.floor(qty));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) {
    return `${n} коробок`;
  }
  if (mod10 === 1) {
    return `${n} коробка`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${n} коробки`;
  }
  return `${n} коробок`;
}
