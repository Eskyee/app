import Decimal from 'decimal.js'
import { writeUInt64LE } from 'liquidjs-lib/src/bufferutils';

// number to string
export function numberToHexEncodedUint64LE(n: number): string {
  const num = Math.floor(n)
  const buf = Buffer.alloc(8);
  writeUInt64LE(buf, num, 0);
  return '0x'.concat(buf.toString('hex'));
}

export function toSatoshi(fractional: number, precision: number = 8): number {
  return Math.floor(new Decimal(fractional).mul(Decimal.pow(10, precision)).toNumber());
}

// open modal
export const openModal = (id: string): void => {
  document.getElementById(id)?.classList.add('is-active')
}

// close modal
export const closeModal = (id: string): void => {
  document.getElementById(id)?.classList.remove('is-active')
}
