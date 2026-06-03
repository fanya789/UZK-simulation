// === Интеграционные адаптеры ===
// Используют новую архитектуру (core/) для совместимости со старым UI

import type { ProcessParameters, SimulationResults, ProductYields } from '../data/simulationEngine';
import type { FeedstockProperties } from '../data/feedstockData';
import { UZKProcess, UZKConfig } from '../models/uzkProcess';
import { PhaseEq } from '../core/thermo';
import { components } from '../core/thermo/components';

/**
 * Адаптер для запуска симуляции через новую архитектуру
 */
export function runSimulationWithCore(
  feedstock: FeedstockProperties,
  params: ProcessParameters
): SimulationResults {
  // 1. Подготовить компоненты на основе feedstock
  const feedComposition = prepareFeedComposition(feedstock);

  // 2. Создать конфигурацию
  const config: UZKConfig = {
    feedRate: params.feedRate,
    furnaceOutletTemp: params.furnaceOutletTemp + 273.15, // °C -> K
    chamberPressure: params.chamberPressure * 10, // MPa -> bar
    steamRate: params.steamRate,
    columnTopTemp: params.columnTopTemp + 273.15,
    columnBottomTemp: params.columnBottomTemp + 273.15,
    refluxRatio: params.recycleRatio * 2, // приблизительно
    stages: 10,
  };

  // 3. Запустить симуляцию
  const process = new UZKProcess();
  const result = process.run(config);

  // 4. Преобразовать результат в старый формат
  return convertToLegacyResult(result, params.feedRate);
}

/**
 * Подготовка состава feedstock для новой архитектуры
 */
function prepareFeedComposition(feedstock: FeedstockProperties): Map<string, number> {
  const composition = new Map<string, number>();

  // Парифины
  if (feedstock.paraffins > 0) composition.set('PARAFFIN', feedstock.paraffins);
  // Нафтены
  if (feedstock.naphthenes > 0) composition.set('NAPHTHENE', feedstock.naphthenes);
  // Ароматики
  if (feedstock.aromatics > 0) composition.set('AROMATIC', feedstock.aromatics);
  // Смолы
  if (feedstock.resins > 0) composition.set('RESIN', feedstock.resins);
  // Асфальтены
  if (feedstock.asphaltenes > 0) composition.set('ASPHALTENE', feedstock.asphaltenes);

  return composition;
}

/**
 * Преобразование результата в старый формат
 */
function convertToLegacyResult(
  result: any,
  feedRate: number
): SimulationResults {
  // Упрощённо - пока возвращаем заглушки
  const yields: ProductYields = {
    gas: 5,
    headStabilization: 2.5,
    gasoline: 15,
    lightGasOil: 28,
    heavyGasOil: 26,
    coke: 22,
    losses: 1.5,
  };

  return {
    yields,
    fractions: {
      gas: { hydrogen: 10, methane: 30, ethane: 15, ethylene: 5, propane: 10, propylene: 8, butanes: 12, h2s: 5 },
      gasoline: { paraffins: 30, naphthenes: 15, aromatics: 25, olefins: 30, sulfur: 0.5, octaneRON: 68, octaneMON: 60, density: 0.73, boilingStart: 38, boilingEnd: 180 },
      lightGasOil: { paraffins: 25, naphthenes: 20, aromatics: 55, sulfur: 1.8, density: 0.87, cetaneNumber: 42, boilingStart: 180, boilingEnd: 350 },
      heavyGasOil: { paraffins: 12, naphthenes: 15, aromatics: 55, resins: 18, sulfur: 2.2, density: 0.96, cokability: 3.5, boilingStart: 350, boilingEnd: 520 },
      coke: { volatiles: 8, ash: 0.3, sulfur: 2.5, moisture: 3, trueDensity: 2.08 },
    },
    massBalance: {
      feedIn: feedRate,
      steamIn: feedRate * 0.03,
      totalIn: feedRate * 1.03,
      gasOut: feedRate * 0.05,
      gasolineOut: feedRate * 0.15,
      lightGasOilOut: feedRate * 0.28,
      heavyGasOilOut: feedRate * 0.26,
      cokeOut: feedRate * 0.22,
      lossesOut: feedRate * 0.02,
      totalOut: feedRate,
    },
    heatBalance: {
      heatInput: 10000,
      heatFurnace: 8000,
      heatSteam: 2000,
      totalHeatIn: 12000,
      heatProducts: 6600,
      heatReaction: 3000,
      heatLosses: 2400,
      totalHeatOut: 12000,
    },
    keyIndicators: {
      conversionDepth: 75,
      lightProductsYield: 65,
      cokeYield: 22,
      thermalCrackingSeverity: 1.15,
      specificEnergyConsumption: 2500,
    },
  };
}
