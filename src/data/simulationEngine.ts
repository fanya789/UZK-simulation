import type { FeedstockProperties, ProductYields, FractionComposition } from './feedstockData';

export interface ProcessParameters {
  feedRate: number; // расход сырья, т/ч
  furnaceOutletTemp: number; // температура на выходе из печи, °C (490-510)
  chamberPressure: number; // давление в камере, МПа (0.17-0.6)
  steamRate: number; // расход водяного пара, % от сырья
  recycleRatio: number; // коэффициент рециркуляции (0-0.3)
  columnTopTemp: number; // температура верха колонны К-1, °C (100-130)
  columnBottomTemp: number; // температура низа колонны К-1, °C (380-400)
  cokingTime: number; // время коксования, ч (14-36)
  steamToPipeTemp: number; // температура водяного пара в печь, °C
}

export interface SimulationResults {
  yields: ProductYields;
  fractions: FractionComposition;
  massBalance: MassBalance;
  heatBalance: HeatBalance;
  keyIndicators: KeyIndicators;
}

export interface MassBalance {
  feedIn: number; // сырье на входе, т/ч
  steamIn: number; // пар на входе, т/ч
  totalIn: number; // всего на входе, т/ч
  gasOut: number; // газ, т/ч
  gasolineOut: number; // бензин, т/ч
  lightGasOilOut: number; // легкий газойль, т/ч
  heavyGasOilOut: number; // тяжелый газойль, т/ч
  cokeOut: number; // кокс, т/ч
  lossesOut: number; // потери, т/ч
  totalOut: number; // всего на выходе, т/ч
}

export interface HeatBalance {
  heatInput: number; // теплота входящего сырья, МВт
  heatFurnace: number; // теплота печи, МВт
  heatSteam: number; // теплота пара, МВт
  totalHeatIn: number;
  heatProducts: number; // теплота продуктов, МВт
  heatReaction: number; // теплота реакции, МВт
  heatLosses: number; // потери тепла, МВт
  totalHeatOut: number;
}

export interface KeyIndicators {
  conversionDepth: number; // глубина превращения, %
  lightProductsYield: number; // выход светлых, %
  cokeYield: number; // выход кокса, %
  thermalCrackingSeverity: number; // жёсткость термического крекинга
  specificEnergyConsumption: number; // удельный расход энергии, МДж/т
}

// Основная функция моделирования
export function runSimulation(
  feedstock: FeedstockProperties,
  params: ProcessParameters
): SimulationResults {
  // Расчёт влияния параметров на выход продуктов
  const yields = calculateYields(feedstock, params);
  const fractions = calculateFractions(feedstock, params);
  const massBalance = calculateMassBalance(yields, params);
  const heatBalance = calculateHeatBalance(feedstock, params, massBalance);
  const keyIndicators = calculateKeyIndicators(yields, massBalance, heatBalance);

  return { yields, fractions, massBalance, heatBalance, keyIndicators };
}

function calculateYields(
  feedstock: FeedstockProperties,
  params: ProcessParameters
): ProductYields {
  const base = { ...feedstock.defaultYields };

  // Влияние температуры печи (базовая 500°C)
  // При повышении температуры: увеличивается выход газа и бензина, уменьшается выход газойлей и кокса
  const tempDelta = params.furnaceOutletTemp - 500;
  const tempFactor = tempDelta / 10;

  base.gas += tempFactor * 0.4;
  base.gasoline += tempFactor * 0.25;
  base.lightGasOil += tempFactor * 0.15;
  base.heavyGasOil -= tempFactor * 0.35;
  base.coke -= tempFactor * 0.3;
  base.headStabilization += tempFactor * 0.1;

  // Влияние давления (базовое 0.35 МПа)
  // При повышении давления: увеличивается выход кокса и газойлей, уменьшается газ
  const pressureDelta = params.chamberPressure - 0.35;
  const pressureFactor = pressureDelta / 0.1;

  base.gas -= pressureFactor * 0.15;
  base.gasoline -= pressureFactor * 0.1;
  base.coke += pressureFactor * 0.2;
  base.heavyGasOil += pressureFactor * 0.1;
  base.lightGasOil -= pressureFactor * 0.05;

  // Влияние коэффициента рециркуляции
  // Увеличение рецикла увеличивает выход кокса и снижает газойли
  const recycleFactor = params.recycleRatio / 0.1;

  base.coke += recycleFactor * 0.5;
  base.heavyGasOil -= recycleFactor * 0.3;
  base.lightGasOil += recycleFactor * 0.1;
  base.gasoline += recycleFactor * 0.05;
  base.gas += recycleFactor * 0.1;

  // Влияние водяного пара
  // Пар снижает парциальное давление → снижает выход кокса
  const steamFactor = params.steamRate / 5;

  base.gas += steamFactor * 0.2;
  base.gasoline += steamFactor * 0.1;
  base.coke -= steamFactor * 0.3;
  base.lightGasOil += steamFactor * 0.1;

  // Влияние времени коксования (базовое 24 ч)
  const timeDelta = params.cokingTime - 24;
  const timeFactor = timeDelta / 6;

  base.coke += timeFactor * 0.3;
  base.heavyGasOil -= timeFactor * 0.15;
  base.gas += timeFactor * 0.05;

  // Нормализация до 100%
  const sum = base.gas + base.headStabilization + base.gasoline +
    base.lightGasOil + base.heavyGasOil + base.coke + base.losses;

  const normFactor = 100 / sum;
  base.gas = Math.max(0.5, +(base.gas * normFactor).toFixed(2));
  base.headStabilization = Math.max(0.3, +(base.headStabilization * normFactor).toFixed(2));
  base.gasoline = Math.max(1, +(base.gasoline * normFactor).toFixed(2));
  base.lightGasOil = Math.max(5, +(base.lightGasOil * normFactor).toFixed(2));
  base.heavyGasOil = Math.max(5, +(base.heavyGasOil * normFactor).toFixed(2));
  base.coke = Math.max(5, +(base.coke * normFactor).toFixed(2));

  // Пересчёт потерь
  const newSum = base.gas + base.headStabilization + base.gasoline +
    base.lightGasOil + base.heavyGasOil + base.coke;
  base.losses = +(100 - newSum).toFixed(2);
  if (base.losses < 0) {
    base.coke += base.losses;
    base.losses = 0;
  }

  return base;
}

function calculateFractions(
  feedstock: FeedstockProperties,
  params: ProcessParameters
): FractionComposition {
  const base = JSON.parse(JSON.stringify(feedstock.fractionComposition)) as FractionComposition;

  const tempDelta = params.furnaceOutletTemp - 500;

  // Газ: при повышении температуры увеличивается доля водорода и метана
  base.gas.hydrogen += tempDelta * 0.02;
  base.gas.methane += tempDelta * 0.03;
  base.gas.ethylene += tempDelta * 0.01;
  base.gas.propane -= tempDelta * 0.02;
  base.gas.butanes -= tempDelta * 0.04;

  // Нормализация газа
  const gasSum = Object.values(base.gas).reduce((s, v) => s + v, 0);
  (Object.keys(base.gas) as (keyof typeof base.gas)[]).forEach(k => {
    base.gas[k] = +((base.gas[k] / gasSum) * 100).toFixed(1);
  });

  // Бензин: при повышении температуры увеличивается ароматика и олефины
  base.gasoline.aromatics += tempDelta * 0.08;
  base.gasoline.olefins += tempDelta * 0.05;
  base.gasoline.paraffins -= tempDelta * 0.08;
  base.gasoline.naphthenes -= tempDelta * 0.05;
  base.gasoline.octaneRON += tempDelta * 0.05;
  base.gasoline.octaneMON += tempDelta * 0.04;

  // Нормализация бензина
  const gasolineHC = base.gasoline.paraffins + base.gasoline.naphthenes +
    base.gasoline.aromatics + base.gasoline.olefins;
  base.gasoline.paraffins = +(base.gasoline.paraffins / gasolineHC * 100).toFixed(1);
  base.gasoline.naphthenes = +(base.gasoline.naphthenes / gasolineHC * 100).toFixed(1);
  base.gasoline.aromatics = +(base.gasoline.aromatics / gasolineHC * 100).toFixed(1);
  base.gasoline.olefins = +(base.gasoline.olefins / gasolineHC * 100).toFixed(1);

  // Легкий газойль
  base.lightGasOil.aromatics += tempDelta * 0.06;
  base.lightGasOil.paraffins -= tempDelta * 0.04;
  base.lightGasOil.naphthenes -= tempDelta * 0.02;

  const lgHC = base.lightGasOil.paraffins + base.lightGasOil.naphthenes + base.lightGasOil.aromatics;
  base.lightGasOil.paraffins = +(base.lightGasOil.paraffins / lgHC * 100).toFixed(1);
  base.lightGasOil.naphthenes = +(base.lightGasOil.naphthenes / lgHC * 100).toFixed(1);
  base.lightGasOil.aromatics = +(base.lightGasOil.aromatics / lgHC * 100).toFixed(1);

  // Кокс: при повышении температуры уменьшаются летучие
  base.coke.volatiles -= tempDelta * 0.03;
  base.coke.volatiles = Math.max(3, base.coke.volatiles);

  return base;
}

function calculateMassBalance(
  yields: ProductYields,
  params: ProcessParameters
): MassBalance {
  const feedIn = params.feedRate;
  const steamIn = feedIn * params.steamRate / 100;
  const totalIn = feedIn + steamIn;

  const gasOut = +(feedIn * (yields.gas + yields.headStabilization) / 100).toFixed(2);
  const gasolineOut = +(feedIn * yields.gasoline / 100).toFixed(2);
  const lightGasOilOut = +(feedIn * yields.lightGasOil / 100).toFixed(2);
  const heavyGasOilOut = +(feedIn * yields.heavyGasOil / 100).toFixed(2);
  const cokeOut = +(feedIn * yields.coke / 100).toFixed(2);
  const lossesOut = +(feedIn * yields.losses / 100 + steamIn).toFixed(2);
  const totalOut = +(gasOut + gasolineOut + lightGasOilOut + heavyGasOilOut + cokeOut + lossesOut).toFixed(2);

  return {
    feedIn, steamIn, totalIn,
    gasOut, gasolineOut, lightGasOilOut, heavyGasOilOut, cokeOut, lossesOut,
    totalOut,
  };
}

function calculateHeatBalance(
  _feedstock: FeedstockProperties,
  params: ProcessParameters,
  massBalance: MassBalance
): HeatBalance {
  // Упрощённый тепловой баланс
  const cp_feed = 2.1; // кДж/(кг·°C) средняя теплоёмкость сырья
  const cp_steam = 2.0; // кДж/(кг·°C) теплоёмкость пара

  const heatInput = +(massBalance.feedIn * 1000 * cp_feed * params.columnBottomTemp / 3600).toFixed(1); // МВт
  const heatFurnace = +(massBalance.feedIn * 1000 * cp_feed *
    (params.furnaceOutletTemp - params.columnBottomTemp) / 3600).toFixed(1);
  const heatSteam = +(massBalance.steamIn * 1000 * cp_steam *
    params.steamToPipeTemp / 3600).toFixed(1);
  const totalHeatIn = +(heatInput + heatFurnace + heatSteam).toFixed(1);

  // Эндотермическая теплота реакции коксования ~250-350 кДж/кг сырья
  const heatReaction = +(massBalance.feedIn * 1000 * 300 / 3600).toFixed(1);
  const heatProducts = +(totalHeatIn * 0.55).toFixed(1);
  const heatLosses = +(totalHeatIn - heatProducts - heatReaction).toFixed(1);
  const totalHeatOut = +(heatProducts + heatReaction + heatLosses).toFixed(1);

  return {
    heatInput, heatFurnace, heatSteam, totalHeatIn,
    heatProducts, heatReaction, heatLosses, totalHeatOut,
  };
}

function calculateKeyIndicators(
  yields: ProductYields,
  massBalance: MassBalance,
  heatBalance: HeatBalance
): KeyIndicators {
  const lightProductsYield = +(yields.gas + yields.headStabilization + yields.gasoline + yields.lightGasOil).toFixed(1);
  const conversionDepth = +(100 - yields.heavyGasOil - yields.losses).toFixed(1);
  const cokeYield = +yields.coke.toFixed(1);
  const thermalCrackingSeverity = +(conversionDepth / 100 * 1.5).toFixed(3);
  const specificEnergyConsumption = +((heatBalance.heatFurnace * 3600) / (massBalance.feedIn * 1000)).toFixed(1);

  return {
    conversionDepth,
    lightProductsYield,
    cokeYield,
    thermalCrackingSeverity,
    specificEnergyConsumption,
  };
}

export function getDefaultParams(): ProcessParameters {
  return {
    feedRate: 100,
    furnaceOutletTemp: 500,
    chamberPressure: 0.35,
    steamRate: 3.0,
    recycleRatio: 0.1,
    columnTopTemp: 110,
    columnBottomTemp: 390,
    cokingTime: 24,
    steamToPipeTemp: 400,
  };
}
