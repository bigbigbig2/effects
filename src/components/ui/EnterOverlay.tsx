"use client";

type EnterOverlayProps = {
  isVisible: boolean;
  onEnter: () => void;
  onEnterSilent: () => void;
};

export function EnterOverlay({ isVisible, onEnter, onEnterSilent }: EnterOverlayProps) {
  if (!isVisible) return null;

  return (
    <section className="enter" data-visible="true">
      <div className="frame">
        <div className="title">Enter</div>
        <button className="enter-btn" onClick={onEnter} type="button">
          Enter Experience
        </button>
        <button className="enter-btn ghost" onClick={onEnterSilent} type="button">
          Enter without sound
        </button>
      </div>
    </section>
  );
}
