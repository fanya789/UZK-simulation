import type { AntoineCoeffs, CriticalProperties } from './units';

/**
 * Представляет чистый компонент (вещество)
 * Содержит физико-химические свойства и методы расчёта
 */
export class Component {
  readonly id: string;
  readonly name: string;

  // Критические свойства
  readonly Tc: number; // K
  readonly Pc: number; // bar
  readonly omega: number; // acentric factor
  readonly Mw: number; // г/моль

  // Антике коэффициенты (для vapour pressure)
  readonly antoine: AntoineCoeffs;

  // К-значения для быстрых расчётов (могут быть перезаписаны из EOS)
  private _Kvalues?: Record<number, number>; // T -> K

  constructor(
    id: string,
    name: string,
    critical: CriticalProperties,
    antoine: AntoineCoeffs
  ) {
    this.id = id;
    this.name = name;
    this.Tc = critical.Tc;
    this.Pc = critical.Pc;
    this.omega = critical.omega;
    this.Mw = critical.Mw;
    this.antoine = antoine;
  }

  /**
   * Давление насыщенного пара по Антике
   * log10(P_sat) = A - B / (T + C)
   * P_sat в bar, T в K
   */
  satPressure(T: number): number {
    const { A, B, C } = this.antoine;
    const T_C = T - 273.15; // convert to Celsius for Antoine
    const log10_Psat = A - B / (T_C + C);
    return Math.pow(10, log10_Psat);
  }

  /**
   * Давление насыщенного пара по упрощённой кластерной корреляции
   * (для псевдокомпонентов без коэффициентов Антике)
   */
  satPressureCluster(T: number): number {
    const Tr = T / this.Tc; // reduced temperature
    if (Tr < 0.5) return 0.01;
    if (Tr >= 1) return this.Pc * 1.1; // выше критической температуры

    // Watson correlation approximation
    const log10_Psat = Math.log10(this.Pc) + (5.92714 - 6.09648 / Tr - 1.28862 * Math.log(Tr) + 0.169347 * Tr ** 6) / 15.9478;
    return Math.pow(10, log10_Psat);
  }

  /**
   * Идеальная теплоёмкость газа ( Cp^ig ) в кДж/(моль·K)
   * Используем полином: Cp = A + B*T + C*T² + D*T³
   * Коэффициенты для типичных углеводородов (примерные)
   */
  idealGasHeatCapacity(T: number): number {
    // Коэффициенты для парифинов (примерные, в ккал/(моль·K))
    // Конвертируем в кДж: 1 ккал = 4.184 кДж
    const coeffs = this.getCoefficients();

    const T_K = T / 1000;
    const T2 = T_K * T_K;
    const T3 = T2 * T_K;

    // Cp = A + B*T + C*T² + D*T³ (в ккал/(моль·K))
    const cp_ig = coeffs.A + coeffs.B * T + coeffs.C * T2 + coeffs.D * T3;

    return cp_ig * 4.184; // в кДж/(моль·K)
  }

  /**
   * Возвращает коэффициенты для теплоёмкости
   * Can be overridden by subclasses for specific components
   */
  protected getCoefficients(): { A: number; B: number; C: number; D: number } {
    // Коэффициенты для n-pentane (пример)
    // A=2.234, B=12.273, C=-3.297, D=3.120 (в ккал/(моль·K)*10^-3, 10^-3, 10^-6, 10^-9)
    return {
      A: 2.234,
      B: 12.273e-3,
      C: -3.297e-6,
      D: 3.120e-9,
    };
  }

  /**
   * Уменьшение энтальпии для сжатия газа (enthalpy departure)
   * Вычисляется через Z-фактор (упрощённо)
   */
  enthalpyDeparture(T: number, P: number, Z: number): number {
    // Упрощённая формула: H_dep = RT(Z - 1) - T*(dZ/dT)_P
    // Для идеального газа Z = 1, H_dep = 0
    // Для реального газа используем EOS
    const Tr = T / this.Tc;
    const Pr = P / this.Pc;

    // Приближение для неполярных веществ
    const omega_ave = 0.25; // средний acentric factor
    const Z0 = 1 + 0.083 - 0.422 / Tr ** 1.6;
    const Z1 = 0.139 - 0.172 / Tr ** 4.2;

    const Z_dep = Z0 + omega_ave * Z1;

    // H_dep / RT = -Tr * (dZ/dT)_P
    // Приближённо: H_dep ≈ RT * (Z - 1) * (1 - 1.5 * Tr)
    const H_dep = R_GAS_KJ * T * (Z_dep - 1) * (1 - 1.5 * Tr);

    return H_dep; // кДж/моль
  }

  /**
   * Установить K-значения для быстрого доступа
   */
  setKvalues(kValues: Record<number, number>): void {
    this._Kvalues = kValues;
  }

  /**
   * Получить K-значение для температуры
   */
  getKvalue(T: number): number | undefined {
    if (this._Kvalues !== undefined) {
      // Интерполяция
      const temps = Object.keys(this._Kvalues).map(Number).sort((a, b) => a - b);
      if (T <= temps[0]) return this._Kvalues[temps[0]];
      if (T >= temps[temps.length - 1]) return this._Kvalues[temps[temps.length - 1]];

      for (let i = 0; i < temps.length - 1; i++) {
        if (T >= temps[i] && T <= temps[i + 1]) {
          const T1 = temps[i];
          const T2 = temps[i + 1];
          const K1 = this._Kvalues[T1];
          const K2 = this._Kvalues[T2];
          return K1 + (K2 - K1) * (T - T1) / (T2 - T1);
        }
      }
    }
    return undefined;
  }

  /**
   * Проверка, является ли компонент газом при заданных условиях
   */
  isGas(T: number, P: number): boolean {
    const Psat = this.satPressureCluster(T);
    return P < Psat;
  }

  /**
   * Проверка, является ли компонент жидкостью при заданных условиях
   */
  isLiquid(T: number, P: number): boolean {
    const Psat = this.satPressureCluster(T);
    return P > Psat;
  }

  /**
   * Молярный объём идеального газа
   */
  idealGasMolarVolume(T: number, P: number): number {
    // V = RT/P
    // R = 0.08314 bar·L/(mol·K)
    return R_GAS_BAR_L * T / P; // L/mol
  }
}

// Вспомогательная функция для получения R
const R_GAS_KJ = 0.008314462618; // кДж/(моль·K)
const R_GAS_BAR_L = 0.08314462618; // (бар·л)/(моль·K)
