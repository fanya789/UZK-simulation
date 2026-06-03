import type { Component } from './component';
import { R_GAS_BAR_L } from './units';

/**
 * Основной класс для уравнений состояния
 */
export abstract class Eos {
  protected components: Map<string, Component>;

  constructor(components: Map<string, Component>) {
    this.components = components;
  }

  abstract computeZ(T: number, P: number, composition: Map<string, number>): number;
  abstract pressure(T: number, V: number, n: number, z: Map<string, number>): number;
  abstract fugacityCoefficient(
    T: number,
    P: number,
    composition: Map<string, number>,
    componentId: string
  ): number;

  kValue(T: number, P: number, composition: Map<string, number>, componentId: string): number {
    const phi = this.fugacityCoefficient(T, P, composition, componentId);
    const comp = this.components.get(componentId);
    if (!comp) return 1;

    const Psat = comp.satPressure(T);
    const phi_sat = this.fugacityCoefficient(T, Psat, composition, componentId);

    const omega = 0.37464 + 1.54226 * comp.omega - 0.26992 * comp.omega ** 2;
    const alpha = (1 + omega * (1 - Math.sqrt(T / comp.Tc))) ** 2;

    const f_sat = phi_sat * Psat;
    const f_gas = phi * P;

    return (f_sat / f_gas) * (comp.Mw / 100) ** 0.5;
  }
}

/**
 * Peng-Robinson EOS
 */
export class PengRobinson extends Eos {
  private mixParams(
    T: number,
    composition: Map<string, number>
  ): { a: number; b: number } {
    let a = 0;
    let b = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id1, x1] = entries[i];
      const comp1 = this.components.get(id1);
      if (!comp1) continue;

      const Tc = comp1.Tc;
      const Pc = comp1.Pc;
      const omega = comp1.omega;

      const Tr = T / Tc;
      const alpha = (1 + (0.37464 + 1.54226 * omega - 0.26992 * omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
      const a_i = 0.45724 * (R_GAS_BAR_L * Tc) ** 2 / Pc * alpha;
      const b_i = 0.07780 * (R_GAS_BAR_L * Tc) / Pc;

      b += x1 * b_i;

      for (let j = i + 1; j < entries.length; j++) {
        const [id2, x2] = entries[j];
        const comp2 = this.components.get(id2);
        if (!comp2) continue;

        const Tc2 = comp2.Tc;
        const Pc2 = comp2.Pc;
        const omega2 = comp2.omega;

        const Tr2 = T / Tc2;
        const alpha2 =
          (1 + (0.37464 + 1.54226 * omega2 - 0.26992 * omega2 ** 2) * (1 - Math.sqrt(Tr2))) ** 2;
        const a_j = 0.45724 * (R_GAS_BAR_L * Tc2) ** 2 / Pc2 * alpha2;

        const k_ij = 0;
        const a_ij = Math.sqrt(a_i * a_j) * (1 - k_ij);

        a += x1 * x2 * a_ij;
      }
    }

    return { a, b };
  }

  computeZ(T: number, P: number, composition: Map<string, number>): number {
    const { a, b } = this.mixParams(T, composition);

    const c2 = -1;
    const c1 = (a * P) / (R_GAS_BAR_L * R_GAS_BAR_L * T * T) - 3 * b * b * P / (R_GAS_BAR_L * T) - b * b * P / (R_GAS_BAR_L * T);
    const c0 = -b * b * b * P / (R_GAS_BAR_L * T) + a * b * P / (R_GAS_BAR_L * R_GAS_BAR_L * T * T);

    return this.solveCubic(1, c2, c1, c0, P, T, composition);
  }

  pressure(T: number, V: number, n: number, z: Map<string, number>): number {
    const { a, b } = this.mixParams(T, z);

    const R = R_GAS_BAR_L;
    return (R * T) / (V - n * b) - (n * a) / (V * V + 2 * n * b * V - n * n * b * b);
  }

  fugacityCoefficient(
    T: number,
    P: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const { a, b } = this.mixParams(T, composition);
    const comp = this.components.get(componentId);
    if (!comp) return 1;

    const Tc = comp.Tc;
    const Pc = comp.Pc;
    const omega = comp.omega;

    const Tr = T / Tc;
    const alpha = (1 + (0.37464 + 1.54226 * omega - 0.26992 * omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
    const a_i = 0.45724 * (R_GAS_BAR_L * Tc) ** 2 / Pc * alpha;
    const b_i = 0.07780 * (R_GAS_BAR_L * Tc) / Pc;

    const Z = this.computeZ(T, P, composition);
    const R = R_GAS_BAR_L;

    let amix_i = 0;
    const entries = Array.from(composition.entries());
    for (const [id, x] of entries) {
      const compj = this.components.get(id);
      if (!compj) continue;

      const Tcj = compj.Tc;
      const Pcj = compj.Pc;
      const omegaj = compj.omega;

      const Trj = T / Tcj;
      const alphaj =
        (1 + (0.37464 + 1.54226 * omegaj - 0.26992 * omegaj ** 2) * (1 - Math.sqrt(Trj))) ** 2;
      const a_j = 0.45724 * (R_GAS_BAR_L * Tcj) ** 2 / Pcj * alphaj;

      const k_ij = 0;
      amix_i += x * Math.sqrt(a_i * a_j) * (1 - k_ij);
    }

    const B = b * P / (R * T);
    const A = a * P / (R * T) ** 2;

    const term1 = (b_i / b) * (Z - 1);
    const term2 = Math.log(Z - B);
    const term3 = (A / (2 * Math.sqrt(2) * B)) * (2 * amix_i / a) * Math.log((Z + 2.414 * B) / (Z - 0.414 * B));

    return Math.exp(term1 - term2 - term3);
  }

  private solveCubic(
    a0: number,
    a1: number,
    a2: number,
    a3: number,
    P: number,
    T: number,
    composition: Map<string, number>
  ): number {
    const d0 = a1 * a1 - 3 * a0 * a2;
    const d1 = 2 * a1 * a1 * a1 - 9 * a0 * a1 * a2 + 27 * a0 * a0 * a3;

    let C;
    if (d1 > 0) {
      C = Math.pow((d1 + Math.sqrt(d1 * d1 - 4 * d0 * d0 * d0)) / 2, 1 / 3);
    } else {
      C = Math.pow((d1 - Math.sqrt(d1 * d1 - 4 * d0 * d0 * d0)) / 2, 1 / 3);
    }

    const u1 = 1;
    const sqrt3 = Math.sqrt(3);
    const u2 = -0.5 + (sqrt3 / 2);
    const u3 = -0.5 - (sqrt3 / 2);

    const term1 = -a1 / (3 * a0);

    const z1 = term1 + (u1 * C + d0 / (u1 * C)) / 3;
    const z2 = term1 + (u2 * C + d0 / (u2 * C)) / 3;
    const z3 = term1 + (u3 * C + d0 / (u3 * C)) / 3;

    const roots = [z1, z2, z3].filter((z) => !isNaN(z) && z > 0);
    if (roots.length === 0) return P / (R_GAS_BAR_L * T);

    return Math.max(...roots);
  }
}

/**
 * Soave-Redlich-Kwong EOS
 */
export class SoaveRedlichKwong extends Eos {
  computeZ(T: number, P: number, composition: Map<string, number>): number {
    const { a, b } = this.mixParams(T, composition);

    const R = R_GAS_BAR_L;
    const A = a * P / (R * T) ** 2;
    const B = b * P / (R * T);

    const c2 = -1;
    const c1 = A - 2 * B - 3 * B * B;
    const c0 = -(A * B - B * B - B * B * B);

    return this.solveCubic(1, c2, c1, c0);
  }

  pressure(T: number, V: number, n: number, z: Map<string, number>): number {
    const { a, b } = this.mixParams(T, z);

    const R = R_GAS_BAR_L;
    return (R * T) / (V - n * b) - (n * a) / (V * (V + n * b));
  }

  fugacityCoefficient(
    T: number,
    P: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const { a, b } = this.mixParams(T, composition);
    const comp = this.components.get(componentId);
    if (!comp) return 1;

    const Tc = comp.Tc;
    const Pc = comp.Pc;
    const omega = comp.omega;

    const Tr = T / Tc;
    const alpha = (1 + (0.480 + 1.574 * omega - 0.176 * omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
    const a_i = 0.42748 * (R_GAS_BAR_L * Tc) ** 2 / Pc * alpha;
    const b_i = 0.08664 * (R_GAS_BAR_L * Tc) / Pc;

    const R = R_GAS_BAR_L;
    const Z = this.computeZ(T, P, composition);
    const B = b * P / (R * T);
    const A = a * P / (R * T) ** 2;

    let amix_i = 0;
    const entries = Array.from(composition.entries());
    for (const [id, x] of entries) {
      const compj = this.components.get(id);
      if (!compj) continue;

      const Tcj = compj.Tc;
      const Pcj = compj.Pc;
      const omegaj = compj.omega;

      const Trj = T / Tcj;
      const alphaj =
        (1 + (0.480 + 1.574 * omegaj - 0.176 * omegaj ** 2) * (1 - Math.sqrt(Trj))) ** 2;
      const a_j = 0.42748 * (R_GAS_BAR_L * Tcj) ** 2 / Pcj * alphaj;

      amix_i += x * Math.sqrt(a_i * a_j);
    }

    const term1 = b_i / b * (Z - 1);
    const term2 = Math.log(Z - B);
    const term3 = A / B * (amix_i / a) * Math.log((Z + B) / Z);

    return Math.exp(term1 - term2 - term3);
  }

  private mixParams(
    T: number,
    composition: Map<string, number>
  ): { a: number; b: number } {
    let a = 0;
    let b = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, x] = entries[i];
      const comp = this.components.get(id);
      if (!comp) continue;

      const Tc = comp.Tc;
      const Pc = comp.Pc;
      const omega = comp.omega;

      const Tr = T / Tc;
      const alpha = (1 + (0.480 + 1.574 * omega - 0.176 * omega ** 2) * (1 - Math.sqrt(Tr))) ** 2;
      const a_i = 0.42748 * (R_GAS_BAR_L * Tc) ** 2 / Pc * alpha;
      const b_i = 0.08664 * (R_GAS_BAR_L * Tc) / Pc;

      b += x * b_i;

      for (let j = i + 1; j < entries.length; j++) {
        const [id2, x2] = entries[j];
        const comp2 = this.components.get(id2);
        if (!comp2) continue;

        const Tc2 = comp2.Tc;
        const Pc2 = comp2.Pc;
        const omega2 = comp2.omega;

        const Tr2 = T / Tc2;
        const alpha2 =
          (1 + (0.480 + 1.574 * omega2 - 0.176 * omega2 ** 2) * (1 - Math.sqrt(Tr2))) ** 2;
        const a_j = 0.42748 * (R_GAS_BAR_L * Tc2) ** 2 / Pc2 * alpha2;

        const k_ij = 0;
        a += x * x2 * Math.sqrt(a_i * a_j) * (1 - k_ij);
      }
    }

    return { a, b };
  }

  private solveCubic(a0: number, a1: number, a2: number, a3: number): number {
    const d0 = a1 * a1 - 3 * a0 * a2;
    const d1 = 2 * a1 * a1 * a1 - 9 * a0 * a1 * a2 + 27 * a0 * a0 * a3;

    let C;
    if (d1 > 0) {
      C = Math.pow((d1 + Math.sqrt(d1 * d1 - 4 * d0 * d0 * d0)) / 2, 1 / 3);
    } else {
      C = Math.pow((d1 - Math.sqrt(d1 * d1 - 4 * d0 * d0 * d0)) / 2, 1 / 3);
    }

    const term1 = -a1 / (3 * a0);

    const z1 = term1 + (C + d0 / C) / 3;

    if (z1 > 0) return z1;
    return 1;
  }
}
