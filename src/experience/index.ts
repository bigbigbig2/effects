import { Experience, type ExperienceOptions } from "./Experience";

let instance: Experience | null = null;

export function createExperience(options: ExperienceOptions) {
  if (instance) {
    instance.destroy();
  }

  instance = new Experience(options);
  return instance;
}

export function getExperience() {
  return instance;
}
