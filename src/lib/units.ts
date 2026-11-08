export type VolumeUnit = 'ml' | 'oz';

/** US fluid ounce. */
export const ML_PER_OZ = 29.5735;

export function mlToOz(ml: number): number {
  return ml / ML_PER_OZ;
}

export function ozToMl(oz: number): number {
  return oz * ML_PER_OZ;
}

/** Display value for a stored ml amount: whole ml, or oz to one decimal. */
export function formatVolume(ml: number, unit: VolumeUnit): string {
  if (unit === 'oz') return `${Math.round(mlToOz(ml) * 10) / 10} oz`;
  return `${Math.round(ml).toLocaleString('en-US')} ml`;
}

export const KG_PER_LB = 0.45359237;
export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
