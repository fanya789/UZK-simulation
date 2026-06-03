import type { Component } from './component';
import { R_GAS_BAR_L } from './units';

/**
 * Расчёт фазового равновесия (VLE, LLE, Flash)
 */
export class PhaseEq {
  private components: Map<string, Component>;

  constructor(components: Map<string, Component>) {
    this.components = components;
  }

  kValueAntoine(T: number, P: number, componentId: string): number {
    const comp = this.components.get(componentId);
    if (!comp) return 1;
    const Psat = comp.satPressure(T);
    return Psat / P;
  }

  kValueEos(
    T: number,
    P: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const comp = this.components.get(componentId);
    if (!comp) return 1;
    const phi_sat = this.fugacityCoefficient(T, comp.satPressure(T), composition, componentId);
    const phi = this.fugacityCoefficient(T, P, composition, componentId);
    const Psat = comp.satPressure(T);
    return (phi_sat * Psat) / (phi * P);
  }

  fugacityCoefficient(
    T: number,
    P: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const Z = this.computeZ(T, P, composition);
    const comp = this.components.get(componentId);
    if (!comp) return 1;

    const R = R_GAS_BAR_L;
    const Tr = T / comp.Tc;
    const Pr = P / comp.Pc;
    const omega = comp.omega;
    const alpha = (1 + (0.37464 + 1.54226 * omega - 0.26992 * omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
    const a = 0.45724 * (R * comp.Tc) ** 2 / comp.Pc * alpha;
    const b = 0.07780 * (R * comp.Tc) / comp.Pc;

    let amix = 0;
    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const id1 = entries[i][0];
      const x1 = entries[i][1];
      const comp1 = this.components.get(id1);
      if (!comp1) continue;
      const a1 = 0.45724 * (R * comp1.Tc) ** 2 / comp1.Pc * alpha;
      for (let j = i + 1; j < entries.length; j++) {
        const id2 = entries[j][0];
        const x2 = entries[j][1];
        const comp2 = this.components.get(id2);
        if (!comp2) continue;
        const alpha2 = (1 + (0.37464 + 1.54226 * comp2.omega - 0.26992 * comp2.omega ** 2) * (1 - Math.sqrt(T / comp2.Tc))) ** 2;
        const a2 = 0.45724 * (R * comp2.Tc) ** 2 / comp2.Pc * alpha2;
        amix += x1 * x2 * Math.sqrt(a * a2);
      }
    }

    const A = amix * P / (R * T) ** 2;
    const B = b * P / (R * T);
    const ai = a;
    const sum_xa = amix;

    const term1 = (b / b) * (Z - 1);
    const term2 = Math.log(Z - B);
    const term3 = (A / (2 * Math.sqrt(2) * B)) * (2 * sum_xa / A) * Math.log((Z + 2.414 * B) / (Z - 0.414 * B));

    return Math.exp(term1 - term2 - term3);
  }

  private computeZ(
    T: number,
    P: number,
    composition: Map<string, number>
  ): number {
    return P / (R_GAS_BAR_L * T);
  }

  bubblePressure(
    T: number,
    liquidComposition: Map<string, number>
  ): number {
    let P = 1;
    const entries = Array.from(liquidComposition.entries());
    for (let iter = 0; iter < 50; iter++) {
      let sum_y = 0;
      for (let i = 0; i < entries.length; i++) {
        const K = this.kValueAntoine(T, P, entries[i][0]);
        sum_y += entries[i][1] * K;
      }
      const f = sum_y - 1;
      if (Math.abs(f) < 1e-6) return P;
      const dSum_dP = -sum_y / P;
      if (Math.abs(dSum_dP) > 1e-10) {
        P -= f / dSum_dP;
      } else {
        P += f * 0.1;
      }
      if (P < 0.1) P = 0.1;
      if (P > 100) P = 100;
    }
    return P;
  }

  bubbleTemperature(
    P: number,
    liquidComposition: Map<string, number>,
    initialGuess?: number
  ): number {
    let T = initialGuess || 300;
    const entries = Array.from(liquidComposition.entries());
    for (let iter = 0; iter < 50; iter++) {
      let sum_x_Psat = 0;
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          sum_x_Psat += entries[i][1] * comp.satPressure(T);
        }
      }
      const f = sum_x_Psat - P;
      if (Math.abs(f) < 0.01) return T;
      let dSum_dT = 0;
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          const Psat = comp.satPressure(T);
          const B = comp.antoine.B;
          const C = comp.antoine.C;
          const dPsat_dT = Psat * B / Math.pow(C + T - 273.15, 2) / Math.log(10);
          dSum_dT += entries[i][1] * dPsat_dT;
        }
      }
      if (Math.abs(dSum_dT) > 1e-10) {
        T -= f / dSum_dT;
      } else {
        T += f * 0.5;
      }
      if (T < 100) T = 100;
      if (T > 1000) T = 1000;
    }
    return T;
  }

  dewPressure(
    T: number,
    vaporComposition: Map<string, number>
  ): number {
    let P = 1;
    const entries = Array.from(vaporComposition.entries());
    for (let iter = 0; iter < 50; iter++) {
      let sum_x = 0;
      for (let i = 0; i < entries.length; i++) {
        const K = this.kValueAntoine(T, P, entries[i][0]);
        sum_x += entries[i][1] / K;
      }
      const f = sum_x - 1;
      if (Math.abs(f) < 1e-6) return P;
      const dSum_dP = sum_x / P;
      if (Math.abs(dSum_dP) > 1e-10) {
        P -= f / dSum_dP;
      } else {
        P += f * 0.1;
      }
      if (P < 0.1) P = 0.1;
      if (P > 100) P = 100;
    }
    return P;
  }

  dewTemperature(
    P: number,
    vaporComposition: Map<string, number>,
    initialGuess?: number
  ): number {
    let T = initialGuess || 300;
    const entries = Array.from(vaporComposition.entries());
    for (let iter = 0; iter < 50; iter++) {
      let sum_y_Psat = 0;
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          const Psat = comp.satPressure(T);
          sum_y_Psat += entries[i][1] * P / Psat;
        }
      }
      const f = sum_y_Psat - 1;
      if (Math.abs(f) < 0.01) return T;
      let dSum_dT = 0;
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          const Psat = comp.satPressure(T);
          const B = comp.antoine.B;
          const C = comp.antoine.C;
          const dPsat_dT = Psat * B / Math.pow(C + T - 273.15, 2) / Math.log(10);
          dSum_dT += -entries[i][1] * P / (Psat * Psat) * dPsat_dT;
        }
      }
      if (Math.abs(dSum_dT) > 1e-10) {
        T -= f / dSum_dT;
      } else {
        T += f * 0.5;
      }
      if (T < 100) T = 100;
      if (T > 1000) T = 1000;
    }
    return T;
  }

  isothermalFlash(
    T: number,
    P: number,
    composition: Map<string, number>
  ): {
    liquid: Map<string, number>;
    vapor: Map<string, number>;
    vaporFraction: number;
  } {
    const K = new Map<string, number>();
    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        const Psat = comp.satPressure(T);
        K.set(entries[i][0], Psat / P);
      } else {
        K.set(entries[i][0], 1);
      }
    }

    let VoverF = 0.5;
    const maxIter = 100;
    const tol = 1e-8;

    for (let iter = 0; iter < maxIter; iter++) {
      let sum_x = 0;
      let sum_y = 0;
      let dSum_dVF = 0;

      for (let i = 0; i < entries.length; i++) {
        const K_i = K.get(entries[i][0]) || 1;
        const denom = 1 + VoverF * (K_i - 1);
        const x_i = entries[i][1] / denom;
        const y_i = (K_i * entries[i][1]) / denom;
        sum_x += x_i;
        sum_y += y_i;
        dSum_dVF += -entries[i][1] * (K_i - 1) / (denom * denom);
      }

      const f = sum_x - 1;

      if (Math.abs(f) < tol) {
        const x_normalized = new Map<string, number>();
        const y_normalized = new Map<string, number>();
        let total_y = 0;

        for (let i = 0; i < entries.length; i++) {
          const K_i = K.get(entries[i][0]) || 1;
          const denom = 1 + VoverF * (K_i - 1);
          const y_i = (K_i * entries[i][1]) / denom;
          total_y += y_i;
        }

        for (let i = 0; i < entries.length; i++) {
          const K_i = K.get(entries[i][0]) || 1;
          const denom = 1 + VoverF * (K_i - 1);
          const x_i = entries[i][1] / denom;
          const y_i = (K_i * entries[i][1]) / denom / total_y;
          x_normalized.set(entries[i][0], x_i);
          y_normalized.set(entries[i][0], y_i);
        }

        return { liquid: x_normalized, vapor: y_normalized, vaporFraction: VoverF };
      }

      if (Math.abs(dSum_dVF) > 1e-12) {
        VoverF -= f / dSum_dVF;
      } else {
        VoverF += f * 0.1;
      }

      if (VoverF < 0) VoverF = 0;
      if (VoverF > 1) VoverF = 1;
    }

    return {
      liquid: composition,
      vapor: composition,
      vaporFraction: 0,
    };
  }

  adiabaticFlash(
    h_in: number,
    P: number,
    composition: Map<string, number>,
    components: Map<string, Component>
  ): {
    T: number;
    liquid: Map<string, number>;
    vapor: Map<string, number>;
    vaporFraction: number;
  } {
    let T = 300;
    const maxIter = 50;
    const tol = 0.1;

    for (let iter = 0; iter < maxIter; iter++) {
      const flash = this.isothermalFlash(T, P, composition);
      const x = flash.liquid;
      const y = flash.vapor;

      let h_liquid = 0;
      let h_vapor = 0;
      const entries = Array.from(composition.entries());

      for (let i = 0; i < entries.length; i++) {
        const comp = components.get(entries[i][0]);
        if (comp) {
          const cp = comp.idealGasHeatCapacity(T);
          h_liquid += entries[i][1] * cp * (T - 298);
          h_vapor += entries[i][1] * cp * (T - 298) + 40;
        }
      }

      const h_out = (1 - flash.vaporFraction) * h_liquid + flash.vaporFraction * h_vapor;
      const f = h_out - h_in;

      if (Math.abs(f) < tol) {
        return { T, liquid: x, vapor: y, vaporFraction: flash.vaporFraction };
      }

      T += f * 0.5;
      if (T < 100) T = 100;
      if (T > 1000) T = 1000;
    }

    return {
      T,
      liquid: composition,
      vapor: composition,
      vaporFraction: 0,
    };
  }
}
