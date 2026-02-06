﻿// Time 类：
// 简单的游戏循环/时间管理器。
// 使用 requestAnimationFrame 来驱动每一帧的更新。
export class Time {
  private rafId = 0;
  private lastTime = 0;
  private elapsed = 0;

  // 构造函数接收一个 onTick 回调，每一帧都会被调用
  constructor(private onTick: (delta: number, elapsed: number) => void) {
    this.tick = this.tick.bind(this);
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  private tick(time: number) {
    if (!this.lastTime) {
      this.lastTime = time;
    }

    // 计算两帧之间的时间差 (delta)，单位：秒
    const delta = (time - this.lastTime) / 1000;
    this.elapsed += delta; // 总经过时间
    this.lastTime = time;

    // 调用回调函数，传入 delta 和 elapsed
    this.onTick(delta, this.elapsed);
    
    // 请求下一帧
    this.rafId = window.requestAnimationFrame(this.tick);
  }

  // 停止循环
  stop() {
    window.cancelAnimationFrame(this.rafId);
  }
}
