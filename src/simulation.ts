import type {
  SimulationInput,
  SimulationResult,
  ProductYields,
  ProductProperties,
  HeatBalance,
  MaterialBalance,
  TimeSeriesPoint,
} from './types';

// ========== Движок моделирования процесса УЗК ==========

/**
 * Корреляция для расчёта выхода кокса
 * Основана на коксуемости сырья и температуре коксования
 */
function calcCokeYield(cokability: number, temp: number, pressure: number): number {
  // Эмпирическая корреляция (модифицированная формула Эллиса-Джонса)
  const tempFactor = 1 - 0.0012 * (temp - 490);
  const pressureFactor = 1 + 0.15 * (pressure - 0.2);
  const baseYield = 1.6 * cokability;
  return Math.max(15, Math.min(35, baseYield * tempFactor * pressureFactor));
}

/**
 * Корреляция для расчёта выхода газа
 */
function calcGasYield(temp: number, cokability: number, residenceTime: number): number {
  const tempFactor = 1 + 0.003 * (temp - 490);
  const timeFactor = 1 + 0.001 * (residenceTime - 20);
  const base = 5 + 0.3 * cokability;
  return Math.max(5, Math.min(18, base * tempFactor * timeFactor));
}

/**
 * Корреляция для расчёта выхода бензина
 */
function calcGasolineYield(temp: number, cokability: number): number {
  const base = 18 - 0.4 * cokability;
  const tempFactor = 1 + 0.002 * (temp - 490);
  return Math.max(8, Math.min(25, base * tempFactor));
}

/**
 * Расчёт свойств продуктов
 */
function calcProductProperties(input: SimulationInput, _yields: ProductYields): ProductProperties {
  const s = input.feedstock.sulfurContent;
  
  return {
    gasDensity: 1.1 + 0.05 * s,
    gasolineDensity: 720 + 10 * s,
    gasolineSulfur: s * 0.15,
    lightGasoilDensity: 850 + 15 * s,
    lightGasoilSulfur: s * 0.5,
    heavyGasoilDensity: 940 + 10 * s,
    heavyGasoilSulfur: s * 0.8,
    cokeVolatiles: Math.max(6, 15 - 0.02 * input.reactor.bottomTemp),
    cokeSulfur: s * (_yields.coke / 100) * 3.5,
    cokeAsh: 0.1 + 0.05 * input.feedstock.asphalteneContent,
  };
}

/**
 * Расчёт теплового баланса
 */
function calcHeatBalance(input: SimulationInput, _yields: ProductYields): HeatBalance {
  const feedRate = input.feedstock.feedRate;
  const cp = 2.1; // кДж/(кг·°C) — средняя теплоёмкость
  
  // Подвод тепла (печь)
  const deltaT = input.furnace.outletTemp - input.furnace.inletTemp;
  const heatInput = (feedRate * 1000 * cp * deltaT) / 3600; // кВт -> МВт
  const heatInputMW = heatInput / 1000;
  
  // Тепло эндотермических реакций крекинга (~15-20% от подведённого)
  const heatReaction = heatInputMW * 0.18;
  
  // Тепло уносимое продуктами
  const heatProducts = heatInputMW * 0.72;
  
  // Потери
  const heatLosses = heatInputMW - heatReaction - heatProducts;
  
  // КПД
  const efficiency = ((heatInputMW - heatLosses) / heatInputMW) * 100;
  
  return {
    heatInput: +heatInputMW.toFixed(2),
    heatReaction: +heatReaction.toFixed(2),
    heatProducts: +heatProducts.toFixed(2),
    heatLosses: +heatLosses.toFixed(2),
    efficiency: +efficiency.toFixed(1),
  };
}

/**
 * Расчёт материального баланса
 */
function calcMaterialBalance(input: SimulationInput, yields: ProductYields): MaterialBalance {
  const feedIn = input.feedstock.feedRate;
  const gasOut = +(feedIn * yields.gas / 100).toFixed(3);
  const gasolineOut = +(feedIn * yields.gasoline / 100).toFixed(3);
  const lightGasoilOut = +(feedIn * yields.lightGasoil / 100).toFixed(3);
  const heavyGasoilOut = +(feedIn * yields.heavyGasoil / 100).toFixed(3);
  const cokeOut = +(feedIn * yields.coke / 100).toFixed(3);
  const lossesOut = +(feedIn * yields.losses / 100).toFixed(3);
  const totalOut = +(gasOut + gasolineOut + lightGasoilOut + heavyGasoilOut + cokeOut + lossesOut).toFixed(3);
  const closureError = +((totalOut - feedIn) / feedIn * 100).toFixed(3);
  
  return { feedIn, gasOut, gasolineOut, lightGasoilOut, heavyGasoilOut, cokeOut, lossesOut, totalOut, closureError };
}

/**
 * Генерация временных профилей процесса в камере коксования
 */
function calcTimeSeries(input: SimulationInput): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const fillTime = input.reactor.fillTime;
  const steps = 50;
  
  for (let i = 0; i <= steps; i++) {
    const t = (fillTime * i) / steps;
    const fraction = t / fillTime;
    
    // Температура растёт и стабилизируется
    const temp = input.reactor.bottomTemp - 20 * Math.exp(-3 * fraction) + 5 * Math.sin(fraction * Math.PI);
    
    // Давление немного растёт с заполнением
    const pressure = input.reactor.topPressure + 0.05 * fraction + 0.02 * Math.sin(fraction * 2 * Math.PI);
    
    // Уровень кокса растёт
    const cokeLevel = 85 * (1 - Math.exp(-2.5 * fraction));
    
    // Степень конверсии
    const conversionRate = 95 * (1 - Math.exp(-3 * fraction));
    
    points.push({
      time: +t.toFixed(2),
      temperature: +temp.toFixed(1),
      pressure: +pressure.toFixed(3),
      cokeLevel: +cokeLevel.toFixed(1),
      conversionRate: +conversionRate.toFixed(1),
    });
  }
  
  return points;
}

/**
 * Генерация профиля по высоте реактора
 */
function calcReactorProfile(input: SimulationInput): { height: number; temp: number; density: number }[] {
  const profile: { height: number; temp: number; density: number }[] = [];
  const H = input.reactor.chamberHeight;
  const steps = 30;
  
  for (let i = 0; i <= steps; i++) {
    const h = (H * i) / steps;
    const fraction = h / H;
    
    // Температура убывает снизу вверх
    const temp = input.reactor.bottomTemp - (input.reactor.bottomTemp - input.reactor.topTemp) * Math.pow(fraction, 0.7);
    
    // Плотность паров увеличивается (условно — масса/объём зоны)
    const density = input.feedstock.density * (1 - 0.7 * fraction) * (1 - 0.3 * Math.pow(fraction, 2));
    
    profile.push({
      height: +h.toFixed(1),
      temp: +temp.toFixed(1),
      density: +density.toFixed(0),
    });
  }
  
  return profile;
}

/**
 * Главная функция моделирования
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const warnings: string[] = [];
  
  // Валидация
  if (input.furnace.outletTemp > 510) {
    warnings.push('⚠ Температура на выходе печи > 510°C: высокий риск закоксовывания змеевика!');
  }
  if (input.furnace.outletTemp < 470) {
    warnings.push('⚠ Температура на выходе печи < 470°C: недостаточная глубина крекинга.');
  }
  if (input.reactor.topPressure > 0.4) {
    warnings.push('⚠ Давление верха камеры > 0.4 МПа: увеличен выход кокса.');
  }
  if (input.feedstock.cokability > 25) {
    warnings.push('⚠ Коксуемость сырья > 25%: возможно образование «shot coke».');
  }
  if (input.feedstock.sulfurContent > 4) {
    warnings.push('⚠ Высокое содержание серы > 4%: кокс будет высокосернистым.');
  }
  if (input.reactor.fillTime < 18) {
    warnings.push('⚠ Время заполнения камеры < 18 ч: короткий цикл может ухудшить качество кокса.');
  }
  
  // Расчёт выходов продуктов
  const cokeYield = calcCokeYield(
    input.feedstock.cokability,
    input.furnace.outletTemp,
    input.reactor.topPressure
  );
  const gasYield = calcGasYield(
    input.furnace.outletTemp,
    input.feedstock.cokability,
    input.furnace.residenceTime
  );
  const gasolineYield = calcGasolineYield(
    input.furnace.outletTemp,
    input.feedstock.cokability
  );
  
  const remaining = 100 - cokeYield - gasYield - gasolineYield;
  const lightGasoilYield = remaining * 0.55;
  const heavyGasoilYield = remaining * 0.40;
  const lossesYield = remaining * 0.05;
  
  const yields: ProductYields = {
    gas: +gasYield.toFixed(1),
    gasoline: +gasolineYield.toFixed(1),
    lightGasoil: +lightGasoilYield.toFixed(1),
    heavyGasoil: +heavyGasoilYield.toFixed(1),
    coke: +cokeYield.toFixed(1),
    losses: +lossesYield.toFixed(1),
  };
  
  // Корректировка для закрытия баланса
  const total = yields.gas + yields.gasoline + yields.lightGasoil + yields.heavyGasoil + yields.coke + yields.losses;
  if (Math.abs(total - 100) > 0.1) {
    yields.losses = +(100 - yields.gas - yields.gasoline - yields.lightGasoil - yields.heavyGasoil - yields.coke).toFixed(1);
  }
  
  const properties = calcProductProperties(input, yields);
  const heatBalance = calcHeatBalance(input, yields);
  const materialBalance = calcMaterialBalance(input, yields);
  const timeSeries = calcTimeSeries(input);
  const reactorProfile = calcReactorProfile(input);
  
  return {
    yields,
    properties,
    heatBalance,
    materialBalance,
    timeSeries,
    reactorProfile,
    status: warnings.length > 2 ? 'warning' : 'success',
    warnings,
  };
}

// ========== Значения по умолчанию ==========

export const defaultInput: SimulationInput = {
  feedstock: {
    feedRate: 120,
    density: 1010,
    sulfurContent: 2.5,
    asphalteneContent: 8.0,
    cokability: 18.0,
    viscosity: 350,
    ccr: 16.0,
  },
  furnace: {
    inletTemp: 350,
    outletTemp: 500,
    pressure: 0.6,
    coilType: 'double',
    heatDuty: 35,
    residenceTime: 25,
  },
  reactor: {
    numberOfChambers: 4,
    chamberDiameter: 7.0,
    chamberHeight: 27.0,
    topPressure: 0.18,
    bottomTemp: 495,
    topTemp: 430,
    fillTime: 24,
    cycleTime: 48,
  },
  fractionation: {
    numberOfTrays: 30,
    topTemp: 120,
    bottomTemp: 390,
    pressure: 0.15,
    refluxRatio: 2.5,
  },
};
