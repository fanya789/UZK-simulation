// === Unit Operations Core ===
// Базовые интерфейсы и классы для unit operations

import type { Mixture } from '../thermo/mixture';
import type { Component } from '../thermo/component';

/**
 * Представляет поток с составом, T, P, фазой
 */
export interface Stream {
  id: string;
  name: string;
  flowRates: Map<string, number>;
  temperature: number;
  pressure: number;
  phase: 'liquid' | 'vapor' | 'mixture';
  composition: Map<string, number>;
}

/**
 * Интерфейс Unit Operation
 */
export interface UnitOperation {
  id: string;
  name: string;
  inputStreams: Stream[];
  outputStreams: Stream[];
  calculate(state: SimulationState): void;
  validate(): ValidationError[];
}

/**
 * Ошибка валидации
 */
export interface ValidationError {
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Состояние симуляции
 */
export interface SimulationState {
  T: number;
  P: number;
  composition: Map<string, number>;
}

/**
 * Базовый класс Unit Operation
 */
export abstract class BaseUnitOperation {
  id: string = '';
  name: string = '';

  inputStreams: Stream[] = [];
  outputStreams: Stream[] = [];

  protected _parameters: Map<string, number> = new Map();

  constructor(params?: Map<string, number>) {
    if (params) {
      this._parameters = params;
    }
  }

  getParam(name: string): number | undefined {
    return this._parameters.get(name);
  }

  setParam(name: string, value: number): void {
    this._parameters.set(name, value);
  }

  validate(): ValidationError[] {
    const errors: ValidationError[] = [];

    if (this.inputStreams.length === 0) {
      errors.push({
        message: `Unit ${this.name} has no input streams`,
        severity: 'error',
      });
    }

    if (this.outputStreams.length === 0) {
      errors.push({
        message: `Unit ${this.name} has no output streams`,
        severity: 'warning',
      });
    }

    return errors;
  }

  protected massBalance(
    inputs: Stream[],
    output: Stream
  ): Map<string, number> {
    const totalFlow = new Map<string, number>();

    for (let i = 0; i < inputs.length; i++) {
      const stream = inputs[i];
      const entries = Array.from(stream.flowRates.entries());
      for (let j = 0; j < entries.length; j++) {
        const current = totalFlow.get(entries[j][0]) || 0;
        totalFlow.set(entries[j][0], current + entries[j][1]);
      }
    }

    return totalFlow;
  }

  protected energyBalance(
    inputs: Stream[],
    output: Stream,
    Q?: number
  ): number {
    let totalH = 0;
    for (let i = 0; i < inputs.length; i++) {
      const stream = inputs[i];
      const cp = 2.0;
      const flows: number[] = [];
      const flowEntries = Array.from(stream.flowRates.values());
      for (let j = 0; j < flowEntries.length; j++) {
        flows.push(flowEntries[j]);
      }
      const totalFlow = flows.reduce((a, b) => a + b, 0);
      totalH += totalFlow * cp * stream.temperature;
    }

    let totalFlowSum = 0;
    for (let i = 0; i < inputs.length; i++) {
      const stream = inputs[i];
      const flows: number[] = [];
      const flowEntries = Array.from(stream.flowRates.values());
      for (let j = 0; j < flowEntries.length; j++) {
        flows.push(flowEntries[j]);
      }
      totalFlowSum += flows.reduce((a, b) => a + b, 0);
    }

    const cp = 2.0;
    const deltaT = (Q || 0) / (totalFlowSum * cp);

    let minTemp = 300;
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i].temperature < minTemp) {
        minTemp = inputs[i].temperature;
      }
    }

    return minTemp + deltaT;
  }
}

/**
 * Feed: Входной поток
 */
export class Feed extends BaseUnitOperation {
  id = 'feed';
  name = 'Feed';

  constructor(params?: Map<string, number>) {
    super(params);
    this.outputStreams.push({
      id: 'feed_out',
      name: 'Feed Out',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'liquid',
      composition: new Map(),
    });
  }

  calculate(state: SimulationState): void {
    const output = this.outputStreams[0];
    if (output) {
      output.temperature = this.getParam('temperature') || 300;
      output.pressure = this.getParam('pressure') || 1;
      output.phase = (this.getParam('phase') || 1) > 0 ? 'liquid' : 'vapor';
      output.flowRates = new Map(state.composition.entries());
    }
  }
}

/**
 * Splitter: Разделение потока
 */
export class Splitter extends BaseUnitOperation {
  id = 'splitter';
  name = 'Splitter';

  constructor(params?: Map<string, number>) {
    super(params);
    this.outputStreams = [
      { id: 'split_1', name: 'Split 1', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'liquid', composition: new Map() },
      { id: 'split_2', name: 'Split 2', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'liquid', composition: new Map() },
    ];
  }

  calculate(state: SimulationState): void {
    const splitRatio = this.getParam('splitRatio') || 0.5;
    const input = this.inputStreams[0];

    if (input) {
      const out1 = this.outputStreams[0];
      const out2 = this.outputStreams[1];

      out1.temperature = input.temperature;
      out1.pressure = input.pressure;
      out1.phase = input.phase;
      out1.composition = new Map(input.composition.entries());
      out1.flowRates = new Map(input.flowRates.entries());

      const entries = Array.from(out1.flowRates.entries());
      for (let i = 0; i < entries.length; i++) {
        out1.flowRates.set(entries[i][0], entries[i][1] * splitRatio);
        out2.flowRates.set(entries[i][0], entries[i][1] * (1 - splitRatio));
      }
    }
  }
}

/**
 * Flash Drum: Изотермический flash
 */
export class FlashDrum extends BaseUnitOperation {
  id = 'flash';
  name = 'Flash Drum';

  constructor(params?: Map<string, number>) {
    super(params);
    this.outputStreams = [
      { id: 'flash_vapor', name: 'Flash Vapor', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'vapor', composition: new Map() },
      { id: 'flash_liquid', name: 'Flash Liquid', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'liquid', composition: new Map() },
    ];
  }

  calculate(state: SimulationState): void {
    const input = this.inputStreams[0];
    if (!input) return;

    const P = this.getParam('pressure') || input.pressure;
    const T = this.getParam('temperature') || input.temperature;

    const outputVapor = this.outputStreams[0];
    const outputLiquid = this.outputStreams[1];

    outputVapor.temperature = T;
    outputVapor.pressure = P;
    outputVapor.phase = 'vapor';

    outputLiquid.temperature = T;
    outputLiquid.pressure = P;
    outputLiquid.phase = 'liquid';

    let totalVaporFlow = 0;
    const vaporFlowRates = new Map<string, number>();
    const liquidFlowRates = new Map<string, number>();

    const entries = Array.from(input.flowRates.entries());
    for (let i = 0; i < entries.length; i++) {
      const K = this.getParam(`K_${entries[i][0]}`) || 1;
      let VoverF = (K - 1) / (K + 1);
      if (VoverF < 0) VoverF = 0;
      if (VoverF > 1) VoverF = 1;

      vaporFlowRates.set(entries[i][0], entries[i][1] * VoverF);
      liquidFlowRates.set(entries[i][0], entries[i][1] * (1 - VoverF));
      totalVaporFlow += entries[i][1] * VoverF;
    }

    outputVapor.flowRates = vaporFlowRates;
    outputLiquid.flowRates = liquidFlowRates;
  }
}

/**
 * Heater/Cooler
 */
export class Heater extends BaseUnitOperation {
  id = 'heater';
  name = 'Heater';

  constructor(params?: Map<string, number>) {
    super(params);
    this.outputStreams.push({
      id: 'heater_out',
      name: 'Heater Out',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'liquid',
      composition: new Map(),
    });
  }

  calculate(state: SimulationState): void {
    const input = this.inputStreams[0];
    const output = this.outputStreams[0];

    if (!input) return;

    const T_out = this.getParam('temperature') || input.temperature + 50;
    const Q = this.getParam('heat') || 0;

    output.temperature = T_out;
    output.pressure = input.pressure;
    output.phase = input.phase;
    output.flowRates = new Map(input.flowRates.entries());
    output.composition = new Map(input.composition.entries());

    state.T = T_out;
    state.P = output.pressure;
  }
}

/**
 * Distillation Column (stub)
 */
export class DistillationColumn extends BaseUnitOperation {
  id = 'column';
  name = 'Distillation Column';

  constructor(params?: Map<string, number>) {
    super(params);
    this.outputStreams = [
      { id: 'dist_top', name: 'Distillate', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'vapor', composition: new Map() },
      { id: 'dist_bottom', name: 'Bottoms', flowRates: new Map(), temperature: 300, pressure: 1, phase: 'liquid', composition: new Map() },
    ];
  }

  calculate(state: SimulationState): void {
    const input = this.inputStreams[0];
    if (!input) return;

    const refluxRatio = this.getParam('refluxRatio') || 1;
    const stages = this.getParam('stages') || 10;

    const outputTop = this.outputStreams[0];
    const outputBottom = this.outputStreams[1];

    outputTop.temperature = input.temperature - 20;
    outputBottom.temperature = input.temperature + 30;
    outputTop.pressure = input.pressure;
    outputBottom.pressure = input.pressure;

    outputTop.flowRates = new Map(input.flowRates.entries());
    outputBottom.flowRates = new Map(input.flowRates.entries());

    const lightKey = this.getParam('lightKey') || 'CH4';
    const heavyKey = this.getParam('heavyKey') || 'HGO';

    const entries = Array.from(input.flowRates.entries());
    for (let i = 0; i < entries.length; i++) {
      if (entries[i][0] === lightKey) {
        outputTop.flowRates.set(entries[i][0], entries[i][1] * 0.9);
        outputBottom.flowRates.set(entries[i][0], entries[i][1] * 0.1);
      } else if (entries[i][0] === heavyKey) {
        outputTop.flowRates.set(entries[i][0], entries[i][1] * 0.1);
        outputBottom.flowRates.set(entries[i][0], entries[i][1] * 0.9);
      }
    }

    state.T = outputBottom.temperature;
    state.P = outputBottom.pressure;
  }
}
