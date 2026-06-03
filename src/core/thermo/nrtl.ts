import type { Component } from './component';

/**
 * NRTL модель для расчёта activity coefficient
 */
export class Nrtl {
  private components: Map<string, Component>;
  private aij: Map<string, Map<string, number>>;
  private bij: Map<string, Map<string, number>>;
  private cij: Map<string, Map<string, number>>;

  constructor(components: Map<string, Component>) {
    this.components = components;
    this.aij = new Map();
    this.bij = new Map();
    this.cij = new Map();
  }

  setInteractionParameters(i: string, j: string, a_ij: number, b_ij: number, c_ij: number): void {
    if (!this.aij.has(i)) this.aij.set(i, new Map());
    if (!this.bij.has(i)) this.bij.set(i, new Map());
    if (!this.cij.has(i)) this.cij.set(i, new Map());

    this.aij.get(i)!.set(j, a_ij);
    this.bij.get(i)!.set(j, b_ij);
    this.cij.get(i)!.set(j, c_ij);

    if (!this.aij.has(j)) this.aij.set(j, new Map());
    if (!this.bij.has(j)) this.bij.set(j, new Map());
    if (!this.cij.has(j)) this.cij.set(j, new Map());

    this.aij.get(j)!.set(i, a_ij);
    this.bij.get(j)!.set(i, b_ij);
    this.cij.get(j)!.set(i, c_ij);
  }

  private getA(i: string, j: string): number {
    return this.aij.get(i)?.get(j) ?? 0;
  }

  private getB(i: string, j: string): number {
    return this.bij.get(i)?.get(j) ?? 0;
  }

  private getC(i: string, j: string): number {
    return this.cij.get(i)?.get(j) ?? 0;
  }

  private getTau(T: number, i: string, j: string): number {
    const R = 0.008314462618;
    return this.getB(i, j) / (R * T) + this.getC(i, j);
  }

  activityCoefficient(
    T: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const R = 0.008314462618;
    const x = Array.from(composition.entries());
    const xi = composition.get(componentId) || 0;

    let sum_num = 0;
    let sum_denom = 0;

    for (let i = 0; i < x.length; i++) {
      const tau_ji = this.getTau(T, x[i][0], componentId);
      const g_ji = Math.exp(-this.getA(x[i][0], componentId) * tau_ji);
      sum_num += x[i][1] * g_ji * tau_ji;
      sum_denom += x[i][1] * g_ji;
    }

    let sum_num2 = 0;
    for (let i = 0; i < x.length; i++) {
      const tau_ji = this.getTau(T, x[i][0], componentId);
      const g_ji = Math.exp(-this.getA(x[i][0], componentId) * tau_ji);

      let sum_inner = 0;
      for (let j = 0; j < x.length; j++) {
        const tau_kj = this.getTau(T, x[j][0], x[i][0]);
        const g_kj = Math.exp(-this.getA(x[j][0], x[i][0]) * tau_kj);
        sum_inner += x[j][1] * g_kj * tau_kj;
      }

      sum_num2 += (x[i][1] * g_ji) / sum_denom * (tau_ji - sum_inner / sum_denom);
    }

    const ln_gamma = sum_num / sum_denom + sum_num2 - Math.log(sum_denom) - xi;

    return Math.exp(ln_gamma);
  }

  allActivityCoefficients(
    T: number,
    composition: Map<string, number>
  ): Map<string, number> {
    const result = new Map<string, number>();
    const ids = Array.from(composition.keys());

    for (let i = 0; i < ids.length; i++) {
      result.set(ids[i], this.activityCoefficient(T, composition, ids[i]));
    }

    return result;
  }
}

/**
 * Упрощённый NRTL для быстрых расчётов
 */
export class NrtlSimple {
  private components: Map<string, Component>;
  private alpha: number;
  private tau: Map<string, Map<string, number>>;

  constructor(components: Map<string, Component>, alpha: number = 0.3) {
    this.components = components;
    this.alpha = alpha;
    this.tau = new Map();
  }

  setTau(i: string, j: string, tau_ij: number): void {
    if (!this.tau.has(i)) this.tau.set(i, new Map());
    this.tau.get(i)!.set(j, tau_ij);
  }

  private getTau(i: string, j: string): number {
    return this.tau.get(i)?.get(j) ?? 0;
  }

  activityCoefficient(
    T: number,
    composition: Map<string, number>,
    componentId: string
  ): number {
    const x = Array.from(composition.entries());
    const xi = composition.get(componentId) || 0;

    let sum1 = 0;
    let sum2 = 0;

    let denom1 = 0;
    let denom2 = 0;

    for (let i = 0; i < x.length; i++) {
      const tau_ji = this.getTau(x[i][0], componentId);
      const tau_ij = this.getTau(componentId, x[i][0]);

      const g_ji = Math.exp(-this.alpha * tau_ji);
      const g_ij = Math.exp(-this.alpha * tau_ij);

      denom1 += x[i][1] * g_ji;
      denom2 += x[i][1] * g_ij;

      sum1 += x[i][1] * g_ji * tau_ji;
      sum2 += x[i][1] * g_ij;
    }

    const ln_gamma = sum1 / denom1 - Math.log(denom1) - xi * (sum2 / denom2 - Math.log(denom2));

    return Math.exp(ln_gamma);
  }

  allActivityCoefficients(
    T: number,
    composition: Map<string, number>
  ): Map<string, number> {
    const result = new Map<string, number>();
    const entries = Array.from(composition.entries());

    for (let i = 0; i < entries.length; i++) {
      result.set(entries[i][0], this.activityCoefficient(T, composition, entries[i][0]));
    }
    return result;
  }
}
