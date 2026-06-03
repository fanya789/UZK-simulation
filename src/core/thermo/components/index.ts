
import type { AntoineCoeffs, CriticalProperties } from '../units';
import { Component } from '../component';

export const hydrogen: Component = new Component(
  'H2',
  'Водород',
  { Tc: 33.19, Pc: 12.97, omega: -0.219, Mw: 2.016 },
  { A: 3.087, B: -36.33, C: -236.15, T_min: 20, T_max: 100 }
);

export const methane: Component = new Component(
  'CH4',
  'Метан',
  { Tc: 190.6, Pc: 46.0, omega: 0.011, Mw: 16.04 },
  { A: 3.637, B: 269.1, C: -45.8, T_min: 90, T_max: 500 }
);

export const ethane: Component = new Component(
  'C2H6',
  'Этан',
  { Tc: 305.3, Pc: 48.7, omega: 0.099, Mw: 30.07 },
  { A: 3.961, B: 441.6, C: -46.0, T_min: 90, T_max: 500 }
);

export const ethylene: Component = new Component(
  'C2H4',
  'Этилен',
  { Tc: 282.3, Pc: 50.4, omega: 0.087, Mw: 28.05 },
  { A: 3.992, B: 454.2, C: -43.9, T_min: 100, T_max: 500 }
);

export const propane: Component = new Component(
  'C3H8',
  'Пропан',
  { Tc: 369.8, Pc: 42.5, omega: 0.152, Mw: 44.10 },
  { A: 4.018, B: 579.4, C: -46.9, T_min: 85, T_max: 500 }
);

export const propylene: Component = new Component(
  'C3H6',
  'Пропилен',
  { Tc: 365.0, Pc: 46.2, omega: 0.138, Mw: 42.08 },
  { A: 4.067, B: 602.6, C: -41.3, T_min: 100, T_max: 500 }
);

export const butanes: Component = new Component(
  'C4',
  'Н-Бутан',
  { Tc: 425.1, Pc: 37.9, omega: 0.199, Mw: 58.12 },
  { A: 4.160, B: 706.2, C: -43.6, T_min: 80, T_max: 500 }
);

export const butylene: Component = new Component(
  'C4=',
  'Бутилен',
  { Tc: 420.0, Pc: 40.0, omega: 0.185, Mw: 56.11 },
  { A: 4.149, B: 704.5, C: -41.0, T_min: 100, T_max: 500 }
);

export const h2s: Component = new Component(
  'H2S',
  'Сероводород',
  { Tc: 373.5, Pc: 89.1, omega: 0.081, Mw: 34.08 },
  { A: 3.915, B: 589.2, C: -35.7, T_min: 180, T_max: 500 }
);

function createPseudoComponent(
  id: string,
  name: string,
  Tc: number,
  Pc: number,
  omega: number,
  Mw: number,
  boilingRange: { min: number; max: number } // °C
): Component {
  // Создаём приближённые коэффициенты Антике на основе критических свойств
  const T_C = 100; // Точка для расчёта Psat
  const Tr = (T_C + 273.15) / Tc;
  const log10_Psat = Math.log10(Pc) + (5.92714 - 6.09648 / Tr - 1.28862 * Math.log(Tr) + 0.169347 * Tr ** 6) / 15.9478;
  const Psat = Math.pow(10, log10_Psat);

  // Аппроксимация коэффициентов Антике
  const C_antoine = 230; // Типичное значение для углеводородов
  const B_antoine = -(Math.log10(Psat) - 3) * (T_C + C_antoine);
  const A_antoine = 3 + B_antoine / (T_C + C_antoine);

  return new Component(
    id,
    name,
    { Tc, Pc, omega, Mw },
    { A: A_antoine, B: B_antoine, C: C_antoine, T_min: boilingRange.min + 273.15, T_max: boilingRange.max + 273.15 }
  );
}

export const lightGasOil: Component = createPseudoComponent(
  'LGO',
  'Лёгкий газойль (180-350°C)',
  520, // Tc (примерно)
  20, // Pc (примерно)
  0.45, // omega для ароматиков
  180, // Mw
  { min: 180, max: 350 }
);

export const heavyGasOil: Component = createPseudoComponent(
  'HGO',
  'Тяжёлый газойль (>350°C)',
  620, // Tc
  10, // Pc
  0.60, // omega
  300, // Mw
  { min: 350, max: 520 }
);

export const gasoline: Component = createPseudoComponent(
  'GASOLINE',
  'Бензин (н.к.-180°C)',
  450, // Tc
  30, // Pc
  0.40, // omega
  120, // Mw
  { min: 30, max: 180 }
);

export const gas: Component = createPseudoComponent(
  'GAS',
  'Углеводородный газ',
  200, // Tc
  40, // Pc
  0.15, // omega
  35, // Mw
  { min: -50, max: 0 }
);

export const headStabilization: Component = createPseudoComponent(
  'HEAD',
  'Головка стабилизации (пропан-бутан)',
  380, // Tc
  35, // Pc
  0.20, // omega
  55, // Mw
  { min: -40, max: 40 }
);

export const coke: Component = createPseudoComponent(
  'COKE',
  'Кокс',
  800, // Tc (примерно для асфальтенов)
  5, // Pc (примерно)
  0.80, // omega
  1000, // Mw (среднее для поликонденсатов)
  { min: 400, max: 600 }
);

// === Экспортируем все компоненты ===
export const components = {
  // Газы
  H2: hydrogen,
  CH4: methane,
  C2H6: ethane,
  C2H4: ethylene,
  C3H8: propane,
  C3H6: propylene,
  C4: butanes,
  C4_: butylene,
  H2S: h2s,

  // Нефтяные фракции
  LGO: lightGasOil,
  HGO: heavyGasOil,
  GASOLINE: gasoline,
  GAS: gas,
  HEAD: headStabilization,
  COKE: coke,
};

// === Функции для работы с компонентами ===

/**
 * Получить компонент по ID
 */
export function getComponent(id: string): Component | undefined {
  return components[id as keyof typeof components];
}

/**
 * Получить список всех компонентов
 */
export function getAllComponents(): Component[] {
  return Object.values(components);
}

/**
 * Найти компонент по диапазону кипения
 */
export function findComponentByBoilingRange(
  T_min: number,
  T_max: number
): Component[] {
  return getAllComponents().filter((c) => {
    const cMin = c.antoine.T_min - 273.15;
    const cMax = c.antoine.T_max - 273.15;
    return T_min <= cMax && T_max >= cMin;
  });
}
