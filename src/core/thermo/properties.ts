import type { Component } from './component';
import { R_GAS_KJ } from './units';

/**
 * Расчёт термодинамических свойств смесей
 */
export class Properties {
  private components: Map<string, Component>;

  constructor(components: Map<string, Component>) {
    this.components = components;
  }

  liquidDensity(
    T: number,
    composition: Map<string, number>
  ): number {
    let sum_ni_Vi = 0;
    let total_n = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (!comp) continue;

      const Vc = this.criticalVolume(comp);
      const Tr = T / comp.Tc;
      const V_liq = Vc * (0.285 - 0.087 * Tr);

      sum_ni_Vi += entries[i][1] * V_liq;
      total_n += entries[i][1];
    }

    if (total_n === 0) return 0;

    const Mw = this.averageMw(composition);
    return Mw / (sum_ni_Vi * 1000);
  }

  vaporDensity(
    T: number,
    P: number,
    composition: Map<string, number>,
    Z: number
  ): number {
    const R = 0.08314;
    const Mw = this.averageMw(composition);
    return (P * Mw) / (Z * R * T * 1000);
  }

  private criticalVolume(comp: Component): number {
    const R = 83.14;
    return 0.285 * R * comp.Tc / comp.Pc;
  }

  averageMw(composition: Map<string, number>): number {
    let Mw = 0;
    let total = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        Mw += entries[i][1] * comp.Mw;
        total += entries[i][1];
      }
    }

    return total > 0 ? Mw / total : 0;
  }

  idealHeatCapacity(
    T: number,
    composition: Map<string, number>
  ): number {
    let cp = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        cp += entries[i][1] * comp.idealGasHeatCapacity(T);
      }
    }

    return cp;
  }

  enthalpy(
    T: number,
    P: number,
    composition: Map<string, number>,
    phase: 'liquid' | 'vapor'
  ): number {
    const cp = this.idealHeatCapacity(T, composition);
    const cp_298 = this.idealHeatCapacity(298, composition);
    const H_ig = (cp + cp_298) / 2 * (T - 298);
    const H_dep = this.enthalpyDeparture(T, P, composition, phase);

    return H_ig + H_dep;
  }

  enthalpyDeparture(
    T: number,
    P: number,
    composition: Map<string, number>,
    phase: 'liquid' | 'vapor'
  ): number {
    if (phase === 'vapor') {
      let H_dep = 0;
      const entries = Array.from(composition.entries());
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          const Tr = T / comp.Tc;
          const Pr = P / comp.Pc;
          const omega = comp.omega;
          const Z0 = 1 + 0.083 - 0.422 / Tr ** 1.6;
          const Z1 = 0.139 - 0.172 / Tr ** 4.2;
          const Z = Z0 + omega * Z1;
          const H_dep_i = R_GAS_KJ * T * (Z - 1) * (1 - 1.5 * Tr);
          H_dep += entries[i][1] * H_dep_i;
        }
      }
      return H_dep;
    } else {
      return -P * this.excessVolume(T, composition);
    }
  }

  excessVolume(
    T: number,
    composition: Map<string, number>
  ): number {
    return 0;
  }

  entropy(
    T: number,
    P: number,
    composition: Map<string, number>,
    phase: 'liquid' | 'vapor'
  ): number {
    const cp = this.idealHeatCapacity(T, composition);
    const cp_298 = this.idealHeatCapacity(298, composition);
    const S_ig = (cp + cp_298) / 2 * Math.log(T / 298);

    let S_mix = 0;
    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][1] > 0) {
        S_mix -= entries[i][1] * Math.log(entries[i][1]);
      }
    }
    S_mix *= R_GAS_KJ;

    const S_dep = this.entropyDeparture(T, P, composition, phase);
    return S_ig + S_mix + S_dep;
  }

  entropyDeparture(
    T: number,
    P: number,
    composition: Map<string, number>,
    phase: 'vapor' | 'liquid'
  ): number {
    if (phase === 'vapor') {
      let S_dep = 0;
      const entries = Array.from(composition.entries());
      for (let i = 0; i < entries.length; i++) {
        const comp = this.components.get(entries[i][0]);
        if (comp) {
          const Tr = T / comp.Tc;
          const Pr = P / comp.Pc;
          const omega = comp.omega;
          const Z0 = 1 + 0.083 - 0.422 / Tr ** 1.6;
          const Z1 = 0.139 - 0.172 / Tr ** 4.2;
          const Z = Z0 + omega * Z1;
          const S_dep_i = R_GAS_KJ * (-0.5 * (Z - 1) * (1 - 1.5 * Tr));
          S_dep += entries[i][1] * S_dep_i;
        }
      }
      return S_dep;
    } else {
      return 0;
    }
  }

  viscosity(
    T: number,
    composition: Map<string, number>
  ): number {
    let num = 0;
    let denom = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        const mu_i = this.viscosityPure(comp, T);
        num += entries[i][1] * mu_i ** 0.5;
        denom += entries[i][1] * mu_i ** 0.5 * comp.Mw ** 0.5;
      }
    }

    if (denom === 0) return 0;
    return (num / denom) ** 2;
  }

  private viscosityPure(comp: Component, T: number): number {
    const Ea = 10000;
    const A = 1e-3;
    return A * Math.exp(Ea / (8.314 * T));
  }

  thermalConductivity(
    T: number,
    composition: Map<string, number>
  ): number {
    let num = 0;
    let denom = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        const k_i = this.thermalConductivityPure(comp, T);
        num += entries[i][1] * k_i ** 0.5;
        denom += entries[i][1] * k_i ** 0.5;
      }
    }

    if (denom === 0) return 0;
    return (num / denom) ** 2;
  }

  private thermalConductivityPure(comp: Component, T: number): number {
    return 0.15 * (300 / T) ** 0.5;
  }

  surfaceTension(
    T: number,
    composition: Map<string, number>
  ): number {
    let sum = 0;
    let total_x = 0;

    const entries = Array.from(composition.entries());
    for (let i = 0; i < entries.length; i++) {
      const comp = this.components.get(entries[i][0]);
      if (comp) {
        const sigma_c = this.criticalSurfaceTension(comp);
        const Tr = T / comp.Tc;
        const sigma_i = sigma_c * (1 - Tr) ** (11 / 9);
        sum += entries[i][1] * sigma_i ** 0.5;
        total_x += entries[i][1];
      }
    }

    return (sum / total_x) ** 2;
  }

  private criticalSurfaceTension(comp: Component): number {
    const k = 2.1e-7;
    const Vc = this.criticalVolume(comp);
    return k * R_GAS_KJ * 1000 * comp.Tc / Vc ** (2 / 3);
  }
}
