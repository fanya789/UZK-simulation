// === Модель установки УЗК ===
// Связывает unit operations в единую схему

import type { Stream } from '../core/unitops';
import { Feed, Heater, FlashDrum, DistillationColumn } from '../core/unitops';

export interface UZKConfig {
  feedRate: number;
  furnaceOutletTemp: number;
  chamberPressure: number;
  steamRate: number;
  columnTopTemp: number;
  columnBottomTemp: number;
  refluxRatio: number;
  stages: number;
}

export interface UZKResult {
  feed: Stream;
  furnaceOut: Stream;
  chamberOut: Stream;
  columnTop: Stream;
  columnBottom: Stream;
  yields: {
    gas: number;
    headStabilization: number;
    gasoline: number;
    lightGasOil: number;
    heavyGasOil: number;
    coke: number;
    losses: number;
  };
  energyBalance: {
    heatInput: number;
    heatOutput: number;
    imbalance: number;
  };
}

export class UZKProcess {
  private feedUnit: Feed;
  private furnace: Heater;
  private chamber: FlashDrum;
  private column: DistillationColumn;

  private feedStream: Stream;
  private furnaceOutStream: Stream;
  private chamberOutStream: Stream;
  private columnTopStream: Stream;
  private columnBottomStream: Stream;

  constructor() {
    this.feedUnit = new Feed();
    this.furnace = new Heater();
    this.chamber = new FlashDrum();
    this.column = new DistillationColumn();

    this.feedStream = {
      id: 'feed',
      name: 'Feed',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'liquid',
      composition: new Map(),
    };

    this.furnaceOutStream = {
      id: 'furnace_out',
      name: 'Furnace Out',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'vapor',
      composition: new Map(),
    };

    this.chamberOutStream = {
      id: 'chamber_out',
      name: 'Chamber Out',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'mixture',
      composition: new Map(),
    };

    this.columnTopStream = {
      id: 'column_top',
      name: 'Column Top',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'vapor',
      composition: new Map(),
    };

    this.columnBottomStream = {
      id: 'column_bottom',
      name: 'Column Bottom',
      flowRates: new Map(),
      temperature: 300,
      pressure: 1,
      phase: 'liquid',
      composition: new Map(),
    };

    this.feedUnit.outputStreams[0] = this.feedStream;
    this.furnace.inputStreams.push(this.feedStream);
    this.furnace.outputStreams[0] = this.furnaceOutStream;
    this.chamber.inputStreams.push(this.furnaceOutStream);
    // Исправлено: не перезаписываем, а используем существующие выходные потоки
    this.chamber.outputStreams[0] = this.columnTopStream;
    this.chamber.outputStreams[1] = this.columnBottomStream;
    this.column.inputStreams.push(this.chamberOutStream);
    this.column.outputStreams[0] = this.columnTopStream;
    this.column.outputStreams[1] = this.columnBottomStream;
  }

  run(config: UZKConfig): UZKResult {
    this.initializeStreams(config);
    const yields = this.calculateYields(config);
    const energyBalance = this.calculateEnergyBalance(config);

    return {
      feed: this.feedStream,
      furnaceOut: this.furnaceOutStream,
      chamberOut: this.chamberOutStream,
      columnTop: this.columnTopStream,
      columnBottom: this.columnBottomStream,
      yields,
      energyBalance,
    };
  }

  private initializeStreams(config: UZKConfig): void {
    this.feedStream.flowRates.set('TOTAL', config.feedRate);
    this.feedStream.temperature = 300;
    this.feedStream.pressure = 1;
    this.feedStream.phase = 'liquid';
    this.feedStream.composition.set('feed', 100);

    this.furnaceOutStream.flowRates.set('TOTAL', config.feedRate);
    this.furnaceOutStream.temperature = config.furnaceOutletTemp;
    this.furnaceOutStream.pressure = config.chamberPressure;
    this.furnaceOutStream.phase = 'vapor';
    this.furnaceOutStream.composition.set('feed', 100);

    this.chamberOutStream.flowRates.set('TOTAL', config.feedRate);
    this.chamberOutStream.temperature = config.furnaceOutletTemp - 50;
    this.chamberOutStream.pressure = config.chamberPressure;
    this.chamberOutStream.phase = 'mixture';
    this.chamberOutStream.composition.set('feed', 100);

    this.columnTopStream.flowRates.set('TOTAL', config.feedRate * 0.45);
    this.columnTopStream.temperature = config.columnTopTemp;
    this.columnTopStream.pressure = config.chamberPressure;
    this.columnTopStream.phase = 'vapor';
    this.columnTopStream.composition.set('light', 100);

    this.columnBottomStream.flowRates.set('TOTAL', config.feedRate * 0.55);
    this.columnBottomStream.temperature = config.columnBottomTemp;
    this.columnBottomStream.pressure = config.chamberPressure;
    this.columnBottomStream.phase = 'liquid';
    this.columnBottomStream.composition.set('heavy', 100);
  }

  private calculateYields(config: UZKConfig): UZKResult['yields'] {
    const feedRate = config.feedRate;
    const temp = config.furnaceOutletTemp;

    let gas = 5.9;
    let headStabilization = 2.7;
    let gasoline = 13.0;
    let lightGasOil = 28.5;
    let heavyGasOil = 25.9;
    let coke = 22.2;

    // Корректировка на температуру
    const tempDelta = temp - 500;
    gas += tempDelta * 0.04;
    gasoline += tempDelta * 0.025;
    lightGasOil += tempDelta * 0.015;
    heavyGasOil -= tempDelta * 0.035;
    coke -= tempDelta * 0.03;
    headStabilization += tempDelta * 0.01;

    // Корректировка на давление
    const pressureDelta = config.chamberPressure - 0.35;
    gas -= pressureDelta * 1.5;
    gasoline -= pressureDelta * 1.0;
    coke += pressureDelta * 2.0;
    heavyGasOil += pressureDelta * 1.0;
    lightGasOil -= pressureDelta * 0.5;

    // Корректировка на рециркуляцию
    const recycleFactor = config.refluxRatio / 0.1;
    coke += recycleFactor * 5.0;
    heavyGasOil -= recycleFactor * 3.0;
    lightGasOil += recycleFactor * 1.0;
    gasoline += recycleFactor * 0.5;
    gas += recycleFactor * 1.0;

    // Нормализация (без потерь)
    let sum = gas + headStabilization + gasoline + lightGasOil + heavyGasOil + coke;
    const normFactor = 100 / sum;
    gas = Math.max(0.5, gas * normFactor);
    headStabilization = Math.max(0.3, headStabilization * normFactor);
    gasoline = Math.max(1, gasoline * normFactor);
    lightGasOil = Math.max(5, lightGasOil * normFactor);
    heavyGasOil = Math.max(5, heavyGasOil * normFactor);
    coke = Math.max(5, coke * normFactor);

    const newSum = gas + headStabilization + gasoline + lightGasOil + heavyGasOil + coke;
    let losses = Math.max(0, 100 - newSum);
    losses = parseFloat(losses.toFixed(2));

    return {
      gas: parseFloat(gas.toFixed(2)),
      headStabilization: parseFloat(headStabilization.toFixed(2)),
      gasoline: parseFloat(gasoline.toFixed(2)),
      lightGasOil: parseFloat(lightGasOil.toFixed(2)),
      heavyGasOil: parseFloat(heavyGasOil.toFixed(2)),
      coke: parseFloat(coke.toFixed(2)),
      losses,
    };
  }

  private calculateEnergyBalance(config: UZKConfig): UZKResult['energyBalance'] {
    const feedRate = config.feedRate;
    const heatInput = feedRate * 2.1 * (config.columnBottomTemp - 300) / 3600;
    const heatOutput = feedRate * 2.1 * (config.columnBottomTemp - 300) / 3600 * 0.55;
    const imbalance = ((heatInput - heatOutput) / heatInput) * 100;

    return {
      heatInput,
      heatOutput,
      imbalance,
    };
  }

  validate(): string[] {
    const errors: string[] = [];
    if (this.feedUnit.outputStreams.length === 0) errors.push('Feed unit has no output');
    if (this.furnace.inputStreams.length === 0) errors.push('Furnace has no input');
    if (this.column.outputStreams.length === 0) errors.push('Column has no output');
    return errors;
  }
}