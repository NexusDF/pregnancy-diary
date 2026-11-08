import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const outDir = path.join(root, "public")

const blush = [246, 217, 214]
const rose = [196, 92, 108]

function crc32(buffer) {
  let crc = ~0
  for (let i = 0; i < buffer.length; i++) {
    crc ^= buffer[i]
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  return ~crc >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const name = Buffer.from(type)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])))
  return Buffer.concat([length, name, data, crc])
}

function png(size, pixels) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

function insideHeart(x, y) {
  const a = x * x + y * y - 1
  return a * a * a - x * x * y * y * y <= 0
}

function render(size, padding) {
  const pixels = Buffer.alloc(size * size * 4)
  const samples = 3
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cover = 0
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = (x + (sx + 0.5) / samples) / size
          const py = (y + (sy + 0.5) / samples) / size
          const nx = ((px - 0.5) / (0.5 - padding)) * 1.05
          const ny = ((0.5 - py) / (0.5 - padding)) * 1.05 + 0.18
          if (insideHeart(nx, ny)) cover++
        }
      }
      const alpha = cover / (samples * samples)
      const index = (y * size + x) * 4
      pixels[index] = Math.round(rose[0] * alpha + blush[0] * (1 - alpha))
      pixels[index + 1] = Math.round(rose[1] * alpha + blush[1] * (1 - alpha))
      pixels[index + 2] = Math.round(rose[2] * alpha + blush[2] * (1 - alpha))
      pixels[index + 3] = 255
    }
  }
  return png(size, pixels)
}

const files = [
  ["pwa-192x192.png", 192, 0.12],
  ["pwa-512x512.png", 512, 0.12],
  ["maskable-192x192.png", 192, 0.28],
  ["maskable-512x512.png", 512, 0.28],
  ["apple-touch-icon.png", 180, 0.14],
]

for (const [name, size, padding] of files) {
  fs.writeFileSync(path.join(outDir, name), render(size, padding))
}
