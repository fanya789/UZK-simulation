// === Единицы измерения и конверсии ===
// SI-единицы для ядра расчётов

// Температура
export const K_TO_C = 273.15;
export const C_TO_K = (t: number) => t + K_TO_C;
export const K_TO_C_VAL = (t: number) => t - K_TO_C;

// Давление
export const BAR_TO_PA = 100000;
export const PA_TO_BAR = (p: number) => p / BAR_TO_PA;
export const MPa_TO_BAR = (p: number) => p * 10;
export const BAR_TO_MPa = (p: number) => p / 10;

// Энергия/enthalpy
export const KJ_PER_KG_TO_KJ_PER_KMOL = (Mw: number) => Mw;
export const KJ_PER_KMOL_TO_KJ_PER_KG = (Mw: number) => 1 / Mw;

// Расход
export const KMOL_PER_HOUR_TO_KG_PER_HOUR = (Mw: number) => Mw;
export const KG_PER_HOUR_TO_KMOL_PER_HOUR = (Mw: number) => 1 / Mw;

// Длина
export const M_TO_CM = 100;
export const CM_TO_M = (l: number) => l / M_TO_CM;

// Площадь
export const M2_TO_CM2 = 10000;

// Время
export const H_TO_S = 3600;
export const S_TO_H = (t: number) => t / H_TO_S;

// === Константы ===
export const R_GAS = 8.314462618; // Дж/(моль·K)
export const R_GAS_BAR_L = 0.08314462618; // (бар·л)/(моль·K)
export const R_GAS_KJ = 0.008314462618; // кДж/(моль·K)

// === Антике (для vapour pressure) ===
// Антике: log10(P_sat) = A - B / (T + C)
export interface AntoineCoeffs {
  A: number;
  B: number;
  C: number;
  T_min: number; // K
  T_max: number; // K
}

// === Критические свойства ===
export interface CriticalProperties {
  Tc: number; // K
  Pc: number; // bar
  omega: number; // acentric factor
  Mw: number; // г/моль
}
