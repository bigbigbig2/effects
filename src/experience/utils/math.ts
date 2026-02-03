export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;

export const damp = (from: number, to: number, lambda: number, delta: number) =>
  lerp(from, to, 1 - Math.exp(-lambda * delta));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  shouldClamp = false
) => {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  const mapped = outMin + (outMax - outMin) * t;
  if (!shouldClamp) return mapped;
  const min = Math.min(outMin, outMax);
  const max = Math.max(outMin, outMax);
  return clamp(mapped, min, max);
};
