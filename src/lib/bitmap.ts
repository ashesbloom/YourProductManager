// Which 10-second buckets of a lecture were actually played, as a hex bitmap
// (bucket i = bit i%8 of byte i/8). The player builds it; the Worker merges and counts it.
// Imported by the Worker too, so this file must stay import-free.

export const BUCKET_S = 10

export const bucketCount = (durationS: number) => Math.max(1, Math.ceil(durationS / BUCKET_S))

const byteLen = (n: number) => Math.ceil(n / 8)

function toBytes(hex: string, len: number): Uint8Array {
  const out = new Uint8Array(len)
  for (let i = 0; i < len && i * 2 < hex.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

/** Buckets fully covered by played time ranges (e.g. `video.played`). Seeking past a bucket never marks it. */
export function fromRanges(ranges: Array<[number, number]>, durationS: number): string {
  const n = bucketCount(durationS)
  const bytes = new Uint8Array(byteLen(n))
  for (const [s, e] of ranges) {
    for (let i = Math.floor(s / BUCKET_S); i < n && i * BUCKET_S < e; i++) {
      const start = i * BUCKET_S
      const end = Math.min(start + BUCKET_S, durationS)
      // 0.5s tolerance absorbs float jitter at bucket edges.
      if (s <= start + 0.5 && e >= end - 0.5) bytes[i >> 3] |= 1 << (i & 7)
    }
  }
  return toHex(bytes)
}

export function orHex(a: string, b: string, n: number): string {
  const x = toBytes(a, byteLen(n))
  const y = toBytes(b, byteLen(n))
  for (let i = 0; i < x.length; i++) x[i] |= y[i]
  return toHex(x)
}

export function countHex(hex: string, n: number): number {
  const bytes = toBytes(hex, byteLen(n))
  let count = 0
  for (let i = 0; i < n; i++) if (bytes[i >> 3] & (1 << (i & 7))) count++
  return count
}

export const isHexBitmap = (hex: string, n: number) =>
  hex.length % 2 === 0 && hex.length <= byteLen(n) * 2 && /^[0-9a-f]*$/.test(hex)
