import { Experience, type ExperienceOptions } from "./Experience";

// 单例模式：存储 Experience 实例
let instance: Experience | null = null;

// 创建 Experience 实例的工厂函数
// 如果实例已存在，先销毁旧实例，确保只有一个 WebGL 上下文在运行
export function createExperience(options: ExperienceOptions) {
  if (instance) {
    instance.destroy();
  }

  instance = new Experience(options);
  return instance;
}

// 获取当前 Experience 实例
export function getExperience() {
  return instance;
}
