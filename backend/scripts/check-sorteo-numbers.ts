/**
 * Chequeo del reparto de números del sorteo — lo único con lógica de verdad del módulo.
 * Correr con:  npx ts-node scripts/check-sorteo-numbers.ts
 */
import assert from 'node:assert/strict';
import { pickFreeNumbers } from '../src/sorteo/pick-numbers';

// Devuelve la cantidad pedida, sin repetidos, dentro del rango.
const a = pickFreeNumbers(100, new Set(), 8);
assert.equal(a.length, 8);
assert.equal(new Set(a).size, 8);
assert.ok(a.every((n) => n >= 1 && n <= 100));

// Nunca pisa un número ya vendido.
const taken = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const b = pickFreeNumbers(10, taken, 1);
assert.deepEqual(b, [10]);

// Sorteo agotado: falla en vez de repetir o colgarse.
assert.throws(() => pickFreeNumbers(10, taken, 2), /suficientes/);

// Caso borde real: casi todo vendido, tiene que devolver los que quedan sin loopear.
const casiLleno = new Set<number>();
for (let n = 1; n <= 9_990; n++) casiLleno.add(n);
const c = pickFreeNumbers(10_000, casiLleno, 10);
assert.deepEqual(c, [9991, 9992, 9993, 9994, 9995, 9996, 9997, 9998, 9999, 10_000]);

// Reparte al azar: dos tiradas seguidas no deberían dar lo mismo.
const x = pickFreeNumbers(10_000, new Set(), 20);
const y = pickFreeNumbers(10_000, new Set(), 20);
assert.notDeepEqual(x, y);

console.log('OK — reparto de números del sorteo');
