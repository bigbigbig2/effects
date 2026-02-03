import { Howl } from "howler";

type SoundSetDetail = {
  enabled: boolean;
};

export class Soundscape {
  private ambient?: Howl;
  private enabled = false;
  private onToggle = () => this.setEnabled(!this.enabled);
  private onSet = (event: Event) => {
    const detail = (event as CustomEvent<SoundSetDetail>).detail;
    if (!detail) return;
    this.setEnabled(detail.enabled);
  };

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("sound:toggle", this.onToggle);
      window.addEventListener("sound:set", this.onSet as EventListener);
    }
  }

  private ensureAmbient() {
    if (this.ambient) return;
    this.ambient = new Howl({
      src: ["/audio/ambient.webm"],
      loop: true,
      volume: 0,
      html5: true,
    });
  }

  private emitState() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(
      new CustomEvent<SoundSetDetail>("sound:state", {
        detail: { enabled: this.enabled },
      })
    );
  }

  private setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.ensureAmbient();

    if (!this.ambient) return;

    if (this.enabled) {
      if (!this.ambient.playing()) {
        this.ambient.play();
      }
    } else {
      this.ambient.pause();
    }

    this.emitState();
  }

  update(velocity: number) {
    if (!this.ambient || !this.enabled) return;

    const speed = Math.min(1, Math.max(0, Math.abs(velocity) * 0.02));
    const volume = 0.15 + speed * 0.35;
    const rate = 0.9 + speed * 0.2;

    this.ambient.volume(volume);
    this.ambient.rate(rate);
  }

  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("sound:toggle", this.onToggle);
      window.removeEventListener("sound:set", this.onSet as EventListener);
    }
    if (this.ambient) {
      this.ambient.unload();
    }
  }
}
