import { Howl } from "howler";

export class Soundscape {
  private ambient?: Howl;
  private enabled = false;

  constructor() {
    // Placeholder: wire real audio once assets are ready.
  }

  enable() {
    this.enabled = true;
  }

  update(velocity: number) {
    if (!this.ambient || !this.enabled) return;
    const volume = Math.min(1, Math.max(0, velocity * 0.02));
    this.ambient.volume(volume);
  }

  destroy() {
    if (this.ambient) {
      this.ambient.unload();
    }
  }
}
