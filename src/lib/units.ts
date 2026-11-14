export type VolumeUnit = 'ml' | 'oz';

/** US fluid ounce. */
export const ML_PER_OZ = 29.5735;

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

/**
 * One stepper tap: ±50 ml, or ±1 oz on whole-ounce values in oz mode (snaps to the nearest
 * whole oz first, so 8.5 oz → 9 oz, not 10.2 oz).
 */
export function stepVolume(ml: number, dir: 1 | -1, unit: VolumeUnit, stepMl = 50): number {
  if (unit === 'oz') return ozToMl(Math.round(mlToOz(ml)) + dir);
  return Math.round(ml / stepMl) * stepMl + dir * stepMl;
}

/** Display value for a stored ml amount: whole ml, or oz to one decimal. */
export function formatVolume(ml: number, unit: VolumeUnit): string {
  if (unit === 'oz') return `${Math.round(mlToOz(ml) * 10) / 10} oz`;
  return `${Math.round(ml).toLocaleString('en-US')} ml`;
}

export const KG_PER_LB = 0.45359237;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
