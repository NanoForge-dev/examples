// Writes two short 8-bit mono WAV melodies (sine notes): node music.ts <out-dir>
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const RATE = 11025;
const wav = (samples: Uint8Array) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + samples.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE, 28);
  header.writeUInt16LE(1, 32);
  header.writeUInt16LE(8, 34);
  header.write("data", 36);
  header.writeUInt32LE(samples.length, 40);
  return Buffer.concat([header, Buffer.from(samples)]);
};
const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const melody = (notes: number[], beat: number, bars: number) => {
  const per = Math.round(RATE * beat);
  const out = new Uint8Array(per * notes.length * bars);
  for (let i = 0; i < notes.length * bars; i++) {
    const f = freq(notes[i % notes.length]!);
    for (let t = 0; t < per; t++) {
      const env = Math.min(1, t / 200) * Math.exp((-3 * t) / per);
      const v =
        Math.sin((2 * Math.PI * f * t) / RATE) * 0.5 +
        Math.sin((4 * Math.PI * f * t) / RATE) * 0.15;
      out[i * per + t] = Math.round(128 + 100 * env * v);
    }
  }
  return out;
};
const dir = process.argv[2]!;
writeFileSync(join(dir, "track-a.wav"), wav(melody([60, 64, 67, 72, 67, 64, 62, 65], 0.25, 4)));
writeFileSync(join(dir, "track-b.wav"), wav(melody([57, 60, 64, 60, 55, 59, 62, 59], 0.4, 3)));
