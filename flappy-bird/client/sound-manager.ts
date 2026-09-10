const DEFAULT_VOLUME = 0.5;

export class SoundManager {
  private ctx = new AudioContext();
  private gain = this.ctx.createGain();
  private buffers = new Map<string, AudioBuffer>();

  constructor() {
    this.gain.gain.value = DEFAULT_VOLUME;
    this.gain.connect(this.ctx.destination);
  }

  load(key: string, url: string): void {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => this.ctx.decodeAudioData(data))
      .then((buffer) => {
        this.buffers.set(key, buffer);
      })
      .catch(() => {});
  }

  play(key: string): void {
    const buffer = this.buffers.get(key);
    if (!buffer) return;
    if (this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gain);
    source.start();
  }
}
