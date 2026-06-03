import type { Component } from './component';
export class Mixture {
  readonly components: Map<string, number>;

  constructor(components: Map<string, number>) {
    let total = 0;
    const values = Array.from(components.values());
    for (const frac of values) {
      total += frac;
    }

    if (Math.abs(total - 1) > 0.001) {
      const normalized = new Map<string, number>();
      const entries = Array.from(components.entries());
      for (let i = 0; i < entries.length; i++) {
        normalized.set(entries[i][0], entries[i][1] / total);
      }
      this.components = normalized;
    } else {
      this.components = components;
    }
  }

  getFraction(componentId: string): number {
    return this.components.get(componentId) || 0;
  }

  getComponentIds(): string[] {
    return Array.from(this.components.keys());
  }

  getNumComponents(): number {
    return this.components.size;
  }

  getAverageMw(componentsMap: Map<string, Component>): number {
    let Mw = 0;
    const entries = Array.from(this.components.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = componentsMap.get(entries[i][0]);
      if (comp) {
        Mw += entries[i][1] * comp.Mw;
      }
    }
    return Mw;
  }

  bubblePressure(componentsMap: Map<string, Component>, T: number): number {
    let Psat = 0;
    const entries = Array.from(this.components.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = componentsMap.get(entries[i][0]);
      if (comp) {
        Psat += entries[i][1] * comp.satPressure(T);
      }
    }
    return Psat;
  }

  dewTemperature(
    componentsMap: Map<string, Component>,
    P: number,
    initialGuess?: number
  ): number {
    let T = initialGuess || 300;
    const maxIter = 100;
    const tol = 0.01;

    const entries = Array.from(this.components.entries());
    for (let iter = 0; iter < maxIter; iter++) {
      let sum_y = 0;
      let dSum_dT = 0;

      for (let i = 0; i < entries.length; i++) {
        const comp = componentsMap.get(entries[i][0]);
        if (comp) {
          const Psat = comp.satPressure(T);
          const y = (entries[i][1] * Psat) / P;
          sum_y += y;
          const dPsat_dT = Psat * (comp.antoine.B / Math.pow(comp.antoine.C + T - 273.15, 2) / Math.log(10));
          dSum_dT += (entries[i][1] / P) * dPsat_dT;
        }
      }

      const f = sum_y - 1;
      if (Math.abs(f) < tol) return T;

      if (Math.abs(dSum_dT) > 1e-10) {
        T -= f / dSum_dT;
      } else {
        T += f * 0.1;
      }

      if (T < 100) T = 100;
      if (T > 1000) T = 1000;
    }
    return T;
  }

  bubbleTemperature(
    componentsMap: Map<string, Component>,
    P: number,
    initialGuess?: number
  ): number {
    let T = initialGuess || 300;
    const maxIter = 100;
    const tol = 0.01;

    const entries = Array.from(this.components.entries());
    for (let iter = 0; iter < maxIter; iter++) {
      let sum_x_Psat = 0;

      for (let i = 0; i < entries.length; i++) {
        const comp = componentsMap.get(entries[i][0]);
        if (comp) {
          sum_x_Psat += entries[i][1] * comp.satPressure(T);
        }
      }

      const f = sum_x_Psat - P;
      if (Math.abs(f) < tol) return T;

      let dSum_dT = 0;
      for (let i = 0; i < entries.length; i++) {
        const comp = componentsMap.get(entries[i][0]);
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
        T += f * 0.1;
      }

      if (T < 100) T = 100;
      if (T > 1000) T = 1000;
    }
    return T;
  }

  isothermalFlash(
    componentsMap: Map<string, Component>,
    T: number,
    P: number,
    z: Map<string, number>
  ): {
    x: Map<string, number>;
    y: Map<string, number>;
    VoverF: number;
  } {
    const K = new Map<string, number>();
    const zEntries = Array.from(z.entries());
    for (let i = 0; i < zEntries.length; i++) {
      const comp = componentsMap.get(zEntries[i][0]);
      if (comp) {
        const Psat = comp.satPressure(T);
        K.set(zEntries[i][0], Psat / P);
      } else {
        K.set(zEntries[i][0], 1);
      }
    }

    let VoverF = 0.5;
    const maxIter = 100;
    const tol = 1e-6;

    for (let iter = 0; iter < maxIter; iter++) {
      let sum_x = 0;
      let sum_y = 0;
      let dSum_dVF = 0;

      for (let i = 0; i < zEntries.length; i++) {
        const K_i = K.get(zEntries[i][0]) || 1;
        const denom = 1 + VoverF * (K_i - 1);
        const x_i = zEntries[i][1] / denom;
        const y_i = (K_i * zEntries[i][1]) / denom;

        sum_x += x_i;
        sum_y += y_i;
        dSum_dVF += -zEntries[i][1] * (K_i - 1) / (denom * denom);
      }

      const f = sum_x - 1;

      if (Math.abs(f) < tol) {
        const x_normalized = new Map<string, number>();
        const y_normalized = new Map<string, number>();

        let total_y = 0;
        for (let i = 0; i < zEntries.length; i++) {
          const K_i = K.get(zEntries[i][0]) || 1;
          const denom = 1 + VoverF * (K_i - 1);
          const y_i = (K_i * zEntries[i][1]) / denom;
          total_y += y_i;
        }

        for (let i = 0; i < zEntries.length; i++) {
          const K_i = K.get(zEntries[i][0]) || 1;
          const denom = 1 + VoverF * (K_i - 1);
          const x_i = zEntries[i][1] / denom;
          const y_i = (K_i * zEntries[i][1]) / denom / total_y;
          x_normalized.set(zEntries[i][0], x_i);
          y_normalized.set(zEntries[i][0], y_i);
        }

        return { x: x_normalized, y: y_normalized, VoverF };
      }

      if (Math.abs(dSum_dVF) > 1e-12) {
        VoverF -= f / dSum_dVF;
      } else {
        VoverF += f * 0.1;
      }

      if (VoverF < 0) VoverF = 0;
      if (VoverF > 1) VoverF = 1;
    }

    const x = new Map<string, number>();
    const y = new Map<string, number>();
    for (let i = 0; i < zEntries.length; i++) {
      x.set(zEntries[i][0], zEntries[i][1]);
      y.set(zEntries[i][0], zEntries[i][1]);
    }
    return { x, y, VoverF: 0 };
  }

  idealGasHeatCapacity(
    componentsMap: Map<string, Component>,
    T: number
  ): number {
    let cp = 0;
    const entries = Array.from(this.components.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = componentsMap.get(entries[i][0]);
      if (comp) {
        cp += entries[i][1] * comp.idealGasHeatCapacity(T);
      }
    }
    return cp;
  }

  getCriticalProperties(
    componentsMap: Map<string, Component>
  ): { Tc: number; Pc: number; omega: number } {
    let Tc = 0;
    let Pc = 0;
    let omega = 0;
    let totalMole = 0;

    const entries = Array.from(this.components.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = componentsMap.get(entries[i][0]);
      if (comp) {
        Tc += entries[i][1] * comp.Tc;
        Pc += entries[i][1] * comp.Pc;
        omega += entries[i][1] * comp.omega;
        totalMole += entries[i][1];
      }
    }

    return {
      Tc: Tc / totalMole,
      Pc: Pc / totalMole,
      omega: omega / totalMole,
    };
  }
}
