/**
 * Elige `count` números libres al azar dentro de 1..total.
 *
 * Se hace armando la lista de libres y mezclando solo los primeros `count`
 * (Fisher-Yates parcial) en vez de sortear al azar y reintentar: cuando el sorteo
 * está casi vendido, el reintento se vuelve lentísimo y este no.
 */
export function pickFreeNumbers(total: number, taken: Set<number>, count: number): number[] {
  if (total - taken.size < count) throw new Error('No quedan números libres suficientes');

  const free: number[] = [];
  for (let n = 1; n <= total; n++) if (!taken.has(n)) free.push(n);

  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (free.length - i));
    [free[i], free[j]] = [free[j], free[i]];
  }
  return free.slice(0, count).sort((a, b) => a - b);
}
