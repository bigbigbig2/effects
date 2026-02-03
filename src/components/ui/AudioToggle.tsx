export type AudioToggleProps = {
  isOn?: boolean;
};

export function AudioToggle({ isOn = false }: AudioToggleProps) {
  return (
    <button className="audio-toggle" data-audio={isOn ? "on" : "off"}>
      <span className="indicator"></span>
      <span>Sound {isOn ? "On" : "Off"}</span>
    </button>
  );
}
