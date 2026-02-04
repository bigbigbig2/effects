export type AudioToggleProps = {
  isOn?: boolean; // 当前声音是否开启
};

// AudioToggle 组件：
// 简单的声音开关按钮 UI。
// 似乎是早期版本或用于 HUD 组件，目前主界面可能使用的是 Site/SoundToggle。
export function AudioToggle({ isOn = false }: AudioToggleProps) {
  return (
    <button className="audio-toggle" data-audio={isOn ? "on" : "off"}>
      <span className="indicator"></span>
      <span>Sound {isOn ? "On" : "Off"}</span>
    </button>
  );
}
