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
// ========== РАСЧЁТ РАДИАНТНОГО ЗМЕЕВИКА ПЕЧИ (по методичке ЛР №02) ==========

export interface CoilCalcResult {
  success: boolean;
  errors: string[];
  diameter_m: number;
  steamRate_kg_s: number;
  steamRate_wt_percent: number;
  velocityInlet_m_s: number;
  velocityOutlet_m_s: number;
  residenceTime_s: number;
  length_m: number;
  recommendations: string[];
}
export function calculateRadiantCoil(
    oilRate_kg_s: number,
    T_in_C: number,
    T_out_C: number,
    P_in_MPa: number,
    P_out_MPa: number,
    steamRate_wt_percent: number,
    diameter_m: number
): CoilCalcResult {
  // 1. Плотность углеводородного сырья при 20°C (из табл.2 методички)
  const rho_oil_20 = 1045; // кг/м³
  const temp_coeff = 0.0007; // температурная поправка для остатка
  const rho_oil_in = rho_oil_20 - temp_coeff * (T_in_C - 20);
  const rho_oil_out = rho_oil_20 - temp_coeff * (T_out_C - 20);

  // 2. Плотность водяного пара (идеальный газ)
  const R_steam = 461.5; // Дж/(кг·К)
  const rho_steam_in = (P_in_MPa * 1e6) / (R_steam * (T_in_C + 273.15));
  const rho_steam_out = (P_out_MPa * 1e6) / (R_steam * (T_out_C + 273.15));

  // 3. Массовый расход пара
  const steamRate_kg_s = oilRate_kg_s * (steamRate_wt_percent / 100);

  // 4. Плотность смеси (аддитивность)
  const mass_frac_oil = oilRate_kg_s / (oilRate_kg_s + steamRate_kg_s);
  const mass_frac_steam = 1 - mass_frac_oil;
  const rho_mix_in = 1 / (mass_frac_oil/rho_oil_in + mass_frac_steam/rho_steam_in);
  const rho_mix_out = 1 / (mass_frac_oil/rho_oil_out + mass_frac_steam/rho_steam_out);

  // 5. Скорости
  const A = Math.PI * Math.pow(diameter_m / 2, 2);
  const G_mix = oilRate_kg_s + steamRate_kg_s;
  const vel_in = (G_mix / rho_mix_in) / A;
  const vel_out = (G_mix / rho_mix_out) / A;

  // 6. Длина змеевика (при постоянном сечении, средняя скорость)
  const vel_avg = (vel_in + vel_out) / 2;
  const target_residence_time = 20; // секунд
  const length_m = vel_avg * target_residence_time;

  // 7. Проверка условий
  const errors: string[] = [];
  if (vel_in < 2.0) errors.push(`Скорость на входе ${vel_in.toFixed(2)} м/с (должна быть ≥ 2 м/с)`);
  if (vel_out > 30.0) errors.push(`Скорость на выходе ${vel_out.toFixed(2)} м/с (должна быть ≤ 30 м/с)`);
  if (length_m > 500) errors.push(`Длина змеевика ${length_m.toFixed(0)} м (слишком большая)`);

  const recommendations: string[] = [];
  if (vel_in < 1.5) recommendations.push('Увеличьте расход пара или уменьшите диаметр труб');
  if (vel_out > 32) recommendations.push('Уменьшите расход пара или увеличьте диаметр труб');
  if (Math.abs(vel_out - 30) > 5) recommendations.push('Подберите диаметр и расход пара так, чтобы скорость на выходе была около 30 м/с');

  return {
    success: errors.length === 0,
    errors,
    diameter_m,
    steamRate_kg_s,
    steamRate_wt_percent,
    velocityInlet_m_s: vel_in,
    velocityOutlet_m_s: vel_out,
    residenceTime_s: target_residence_time,
    length_m,
    recommendations,
  };
}
export interface ChamberDimensions {
  diameter_m: number;        // диаметр цилиндрической части, м
  height_cyl_m: number;      // высота цилиндрической части, м
  height_cone_m: number;     // высота конической части, м
  bottom_diameter_m: number; // диаметр нижнего люка (для конуса), м
  top_diameter_m: number;    // диаметр верхнего люка, м
}

export interface ChamberHeatBalanceResult {
  T_inlet_C: number;                // температура входа (из печи - 5°C)
  T_outlet_C: number;               // подобранная температура верха, °С
  heatInput_kW: number;             // общий приход тепла, кВт
  heatOutput_kW: number;            // общий расход тепла, кВт
  imbalance_percent: number;        // невязка, %
  iterations: number;               // число итераций
  wallLoss_kW: number;              // потери через стенки, кВт
  reactionHeat_kW: number;          // теплота реакции, кВт
  cokeHeat_kW: number;              // тепло, аккумулированное коксом, кВт
}

/**
 * Расчёт теплового баланса коксовой камеры (итерационный подбор температуры верха)
 * @param feedstock свойства сырья
 * @param params технологические параметры процесса
 * @param results текущие результаты моделирования (выходы продуктов)
 * @param dims размеры камеры (из лабораторной работы)
 * @param T_guess_initial начальное приближение температуры верха, °С (опционально)
 */
export function calculateChamberHeatBalance(
    feedstock: FeedstockProperties,
    params: ProcessParameters,
    results: SimulationResults,
    dims: ChamberDimensions,
    T_guess_initial?: number
): ChamberHeatBalanceResult {
  // Температура входа в камеру (принимаем на 5°С ниже температуры выхода из печи)
  const T_inlet = params.furnaceOutletTemp - 5;
  let T_guess = T_guess_initial !== undefined ? T_guess_initial : T_inlet - 40;

  // Константы для энтальпий (кДж/кг)
  // Энтальпия водяного пара: h = 1.89 * T + 2500 (приближённо для диапазона 400-500°C)
  const enthalpySteam = (T: number) => 1.89 * T + 2500;
  // Энтальпия жидких углеводородов: h = 2.1 * T (средняя теплоёмкость 2.1 кДж/(кг·К))
  const enthalpyLiquid = (T: number) => 2.1 * T;
  // Энтальпия паров углеводородов: h = 1.8 * T + 350 (упрощённая корреляция)
  const enthalpyVapor = (T: number) => 1.8 * T + 350;

  // Теплоёмкость кокса ~1.2 кДж/(кг·К)
  const c_coke = 1.2;

  // Тепловой эффект реакции коксования (кДж/кг сырья) по формуле К. = 850 - 1.21·К
  // Характеристический фактор К = 1.216 * (T_50_К^(1/3) / ρ_15)
  // Упрощённо для нашего сырья примем K ≈ 11.5, тогда q ≈ 850 - 1.21*11.5 = 836 кДж/кг
  // Но в методичке дана формула q = 850 - 1.21·K, где K = (1.216 * T_50^(1/3)) / ρ_15
  // Для простоты используем эмпирическое значение 300 кДж/кг (как в текущем тепловом балансе), но можно уточнить.
  // Оставим значение из текущего simulationEngine:
  const q_reaction = 300; // кДж/кг сырья (умеренно эндотермическая реакция)

  // Расходы (кг/с) берём из massBalance
  const G_feed = results.massBalance.feedIn;        // т/ч -> пересчёт в кг/с
  const G_steam = results.massBalance.steamIn;
  const G_gas = results.massBalance.gasOut;
  const G_gasoline = results.massBalance.gasolineOut;
  const G_gasoil_light = results.massBalance.lightGasOilOut;
  const G_gasoil_heavy = results.massBalance.heavyGasOilOut;
  const G_coke = results.massBalance.cokeOut;

  // Переводим т/ч в кг/с
  const feedRate_kg_s = G_feed * 1000 / 3600;
  const steamRate_kg_s = G_steam * 1000 / 3600;
  const gasRate_kg_s = G_gas * 1000 / 3600;
  const gasolineRate_kg_s = G_gasoline * 1000 / 3600;
  const lightGORate_kg_s = G_gasoil_light * 1000 / 3600;
  const heavyGORate_kg_s = G_gasoil_heavy * 1000 / 3600;
  const cokeRate_kg_s = G_coke * 1000 / 3600;

  // Суммарный расход углеводородных паров (газ + бензин + лёгкий газойль + тяжёлый газойль)
  const vaporRate_kg_s = gasRate_kg_s + gasolineRate_kg_s + lightGORate_kg_s + heavyGORate_kg_s;

  // Площадь поверхности камеры для потерь тепла (цилиндрическая + коническая + верхний/нижний люки)
  const A_cyl = Math.PI * dims.diameter_m * dims.height_cyl_m;
  const slant_height = Math.sqrt(Math.pow((dims.diameter_m - dims.bottom_diameter_m)/2, 2) + Math.pow(dims.height_cone_m, 2));
  const A_cone = Math.PI * (dims.diameter_m/2 + dims.bottom_diameter_m/2) * slant_height;
  const A_top_lid = Math.PI * Math.pow(dims.top_diameter_m/2, 2);
  const A_bottom_lid = Math.PI * Math.pow(dims.bottom_diameter_m/2, 2);
  const A_total = A_cyl + A_cone + A_top_lid + A_bottom_lid;

  // Коэффициент теплоотдачи α = 60 кДж/(м²·ч·К) = 60/3600 = 0.016667 кДж/(м²·с·К)
  const alpha = 60 / 3600; // кДж/(м²·с·К)
  const deltaT_wall = 50; // К (разность температур стенки и воздуха)

  // Итерационный подбор T_out
  let imbalance = 1.0;
  let iter = 0;
  const maxIter = 50;
  let T_out = T_guess;

  while (Math.abs(imbalance) > 0.005 && iter < maxIter) {
    // Приход тепла
    // Q_сырьё (жидкое) – для упрощения считаем, что всё сырьё жидкое, хотя часть может испаряться
    const Q_feed = feedRate_kg_s * enthalpyLiquid(T_inlet);
    const Q_steam_in = steamRate_kg_s * enthalpySteam(T_inlet);
    const totalHeatIn = Q_feed + Q_steam_in;

    // Расход тепла
    const Q_vapor = vaporRate_kg_s * enthalpyVapor(T_out);
    const Q_steam_out = steamRate_kg_s * enthalpySteam(T_out);
    const Q_coke = cokeRate_kg_s * c_coke * ((T_inlet + T_out) / 2); // средняя температура кокса
    const Q_reaction = feedRate_kg_s * q_reaction;
    const Q_loss = alpha * A_total * deltaT_wall; // кВт (так как alpha уже в кДж/(м²·с·К))

    const totalHeatOut = Q_vapor + Q_steam_out + Q_coke + Q_reaction + Q_loss;

    imbalance = (totalHeatIn - totalHeatOut) / totalHeatIn;
    // Корректировка T_out: если приход больше расхода, увеличиваем T_out (увеличиваем отвод)
    T_out += imbalance * 15;
    iter++;

    // Защита от выхода за разумные пределы
    if (T_out < 300) T_out = 300;
    if (T_out > 520) T_out = 520;
  }

  // Повторно вычисляем фактические значения при найденной T_out
  const Q_feed_final = feedRate_kg_s * enthalpyLiquid(T_inlet);
  const Q_steam_in_final = steamRate_kg_s * enthalpySteam(T_inlet);
  const totalHeatIn_final = Q_feed_final + Q_steam_in_final;

  const Q_vapor_final = vaporRate_kg_s * enthalpyVapor(T_out);
  const Q_steam_out_final = steamRate_kg_s * enthalpySteam(T_out);
  const Q_coke_final = cokeRate_kg_s * c_coke * ((T_inlet + T_out) / 2);
  const Q_reaction_final = feedRate_kg_s * q_reaction;
  const Q_loss_final = alpha * A_total * deltaT_wall;
  const totalHeatOut_final = Q_vapor_final + Q_steam_out_final + Q_coke_final + Q_reaction_final + Q_loss_final;
  const imbalance_final = (totalHeatIn_final - totalHeatOut_final) / totalHeatIn_final * 100;

  return {
    T_inlet_C: T_inlet,
    T_outlet_C: T_out,
    heatInput_kW: totalHeatIn_final,
    heatOutput_kW: totalHeatOut_final,
    imbalance_percent: imbalance_final,
    iterations: iter,
    wallLoss_kW: Q_loss_final,
    reactionHeat_kW: Q_reaction_final,
    cokeHeat_kW: Q_coke_final,
  };
}
export interface GasFractionationResult {
  // Продукты (кг/ч)
  dryGas_kg_h: number;          // сухой газ (C1+H2)
  ethaneEthylene_kg_h: number;  // этан-этиленовая фракция (C2)
  propanePropylene_kg_h: number;// пропан-пропиленовая (C3)
  butaneButylene_kg_h: number;  // бутан-бутиленовая (C4)
  gasoline_kg_h: number;        // газовый бензин (C5+)
  stableGasoline_kg_h: number;  // стабильный бензин (C5+ после стабилизации)

  // Составы (масс. %)
  dryGasComposition: { H2: number; CH4: number };
  c2FractionComposition: { C2H6: number; C2H4: number };
  c3FractionComposition: { C3H8: number; C3H6: number };
  c4FractionComposition: { C4H10: number; C4H8: number };

  // Эффективность очистки от H2S
  h2sRemoved_kg_h: number;
}

/**
 * Расчёт секции 200 (фракционирование жирного газа и стабилизация бензина)
 * @param fatGasFlow_kg_h расход жирного газа из секции 100, кг/ч
 * @param unstableGasoline_kg_h расход нестабильного бензина из секции 100, кг/ч
 * @param paramPressure МПа (давление в системе)
 * @param columnEfficiency эффективность тарелок (0.7–0.9)
 */
export function calculateGasFractionation(
    fatGasFlow_kg_h: number,
    unstableGasoline_kg_h: number,
    paramPressure_MPa: number,
    columnEfficiency: number = 0.8
): GasFractionationResult {
  // 1. Типовой состав жирного газа (данные из регламента секции 100)
  //    В реальности нужно брать из results.fractions.gas, но для автономности используем константы
  const h2_in = fatGasFlow_kg_h * 0.10;   // 10% H2
  const ch4_in = fatGasFlow_kg_h * 0.32;  // 32% CH4
  const c2h6_in = fatGasFlow_kg_h * 0.18;
  const c2h4_in = fatGasFlow_kg_h * 0.07;
  const c3h8_in = fatGasFlow_kg_h * 0.12;
  const c3h6_in = fatGasFlow_kg_h * 0.08;
  const c4_in = fatGasFlow_kg_h * 0.10;
  const h2s_in = fatGasFlow_kg_h * 0.03;

  // 2. Абсорбция C3+ в бензиновом абсорбере (коэффициенты извлечения)
  const c3_abs_eff = 0.92;    // 92% C3 переходит в жидкую фазу
  const c4_abs_eff = 0.96;    // 96% C4
  const c5plus_abs_eff = 0.99;

  // 3. Сухой газ (то, что не абсорбировалось)
  const dryGas_kg_h = h2_in + ch4_in + c2h6_in * (1 - 0.15) + c2h4_in * (1 - 0.10) +
      c3h8_in * (1 - c3_abs_eff) + c3h6_in * (1 - c3_abs_eff) +
      c4_in * (1 - c4_abs_eff);

  // 4. Жидкая фаза после абсорбера (насыщенный абсорбент) – направляется в колонну стабилизации
  const richAbsorbent_kg_h = (c3h8_in + c3h6_in) * c3_abs_eff + c4_in * c4_abs_eff +
      unstableGasoline_kg_h + c5plus_abs_eff * 100; // условно C5+ из газа

  // 5. Колонна стабилизации К-202: разделение на головку стабилизации (C3–C4) и стабильный бензин (C5+)
  const stabilizationOverhead = (c3h8_in + c3h6_in) * c3_abs_eff * 0.98 + c4_in * c4_abs_eff * 0.97;
  const stableGasoline_kg_h = unstableGasoline_kg_h + (c3h8_in + c3h6_in) * c3_abs_eff * 0.02 +
      c4_in * c4_abs_eff * 0.03 + 100; // C5+ из газа

  // 6. Газофракционирование (депропанизатор + дебутанизатор)
  //    Распределение головки стабилизации на C3, C4, C2 (этан-этилен) – упрощённо
  const ethaneEthylene_kg_h = (c2h6_in + c2h4_in) * 0.70; // 70% C2 уходит в спец. фракцию
  const propanePropylene_kg_h = (c3h8_in + c3h6_in) * c3_abs_eff * 0.90; // 90% C3
  const butaneButylene_kg_h = c4_in * c4_abs_eff * 0.92;

  // 7. Остаток газа после извлечения C2–C4 идёт как топливный газ (сухой газ)
  const remainingToDryGas = dryGas_kg_h + ethaneEthylene_kg_h * 0.3 + propanePropylene_kg_h * 0.1 + butaneButylene_kg_h * 0.08;
  const finalDryGas = remainingToDryGas;

  // 8. Удаление сероводорода (хемосорбция)
  const h2sRemoved_kg_h = h2s_in * 0.95; // 95% удаляется
  const h2sLeft = h2s_in * 0.05;

  // 9. Составы продуктов (типовые)
  const dryGasComposition = {
    H2: (h2_in / finalDryGas) * 100,
    CH4: (ch4_in / finalDryGas) * 100,
  };
  const c2FractionComposition = { C2H6: 75, C2H4: 25 };
  const c3FractionComposition = { C3H8: 65, C3H6: 35 };
  const c4FractionComposition = { C4H10: 55, C4H8: 45 };

  return {
    dryGas_kg_h: finalDryGas,
    ethaneEthylene_kg_h,
    propanePropylene_kg_h,
    butaneButylene_kg_h,
    gasoline_kg_h: stableGasoline_kg_h,      // газовый бензин
    stableGasoline_kg_h,
    dryGasComposition,
    c2FractionComposition,
    c3FractionComposition,
    c4FractionComposition,
    h2sRemoved_kg_h,
  };
}
// ========== ЭТАП 4: ГЛУБОКАЯ ПЕРЕРАБОТКА ГАЗА ==========

export interface DeepGasProcessingResult {
  // Входные потоки
  fatGas_kg_h: number;              // жирный газ на входе
  // Промежуточные
  semiDryGas_kg_h: number;          // полусухой газ после абсорбции С3/С4
  // Продукты
  dryGas_kg_h: number;              // сухой газ (метан+водород)
  ethaneEthylene_kg_h: number;      // этан-этиленовая фракция
  propanePropylene_kg_h: number;    // пропан-пропиленовая фракция
  butaneButylene_kg_h: number;      // бутан-бутиленовая фракция
  // Потери и отходы
  h2sRemoved_kg_h: number;          // удалено сероводорода
  waterRemoved_kg_h: number;        // удалено воды при осушке
  // Энергопотребление (ориентировочное, кВт)
  powerConsumption_kW: number;
}
export function calculateDeepGasProcessing(
    fatGas_kg_h: number,               // жирный газ с верха К-101 (после сепарации)
    fatGasComposition: {               // типовой состав, можно передавать из results
      H2: number; CH4: number; C2H6: number; C2H4: number;
      C3H8: number; C3H6: number; C4: number; H2S: number;
    },
    absorberEfficiency: number = 0.85, // эффективность абсорбции (0.7-0.95)
    h2sRemovalEfficiency: number = 0.98,
    dryingEfficiency: number = 0.99,
    deethanizerEfficiency: number = 0.90
): DeepGasProcessingResult {

  // 1. Абсорбционное извлечение С3 и С4 из жирного газа
  //    Используем два абсорбера: первый – фракционирующий (абсорбент – стабильный и нестабильный бензин),
  //    второй – абсорбент – легкий газойль (упрощённо считаем суммарную эффективность)
  const c3_in = (fatGasComposition.C3H8 + fatGasComposition.C3H6) * fatGas_kg_h / 100;
  const c4_in = fatGasComposition.C4 * fatGas_kg_h / 100;
  const c3Absorbed = c3_in * absorberEfficiency;
  const c4Absorbed = c4_in * absorberEfficiency;
  // Полусухой газ – после абсорбции С3/С4
  const semiDryGas_kg_h = fatGas_kg_h - c3Absorbed - c4Absorbed;

  // 2. Хемосорбционная очистка полусухого газа от сероводорода (40% МДЭА)
  const h2s_in = fatGasComposition.H2S * fatGas_kg_h / 100;
  const h2sRemoved_kg_h = h2s_in * h2sRemovalEfficiency;
  const gasAfterH2S = semiDryGas_kg_h - h2sRemoved_kg_h;

  // 3. Адсорбционная осушка на цеолите NaA
  //    Типичное содержание влаги в газе – 0.4% масс. (из документа)
  const moisture_in = gasAfterH2S * 0.004;
  const waterRemoved_kg_h = moisture_in * dryingEfficiency;
  const driedGas_kg_h = gasAfterH2S - waterRemoved_kg_h;

  // 4. Низкотемпературное фракционирование (колонна деэтанизации) – выделение этан-этиленовой фракции
  //    Давление не менее 4,0 МПа, температура верха около -46°C.
  const c2_in = (fatGasComposition.C2H6 + fatGasComposition.C2H4) * fatGas_kg_h / 100;
  const c2Recovered = c2_in * deethanizerEfficiency;
  // Сухой газ (метан+водород) и остатки
  const h2_ch4_in = (fatGasComposition.H2 + fatGasComposition.CH4) * fatGas_kg_h / 100;
  const dryGas_kg_h = h2_ch4_in + (c2_in - c2Recovered) * 0.2; // часть C2 уходит в сухой газ
  const ethaneEthylene_kg_h = c2Recovered;

  // 5. Ректификация С3/С4 на пропан-пропиленовую и бутан-бутиленовую фракции
  //    (колонна с 35 теоретическими тарелками, температура верха 49°C, низа 107°C)
  const c3_recovered = c3Absorbed * 0.90;
  const c4_recovered = c4Absorbed * 0.92;
  const propanePropylene_kg_h = c3_recovered;
  const butaneButylene_kg_h = c4_recovered;

  // 6. Ориентировочное энергопотребление (компрессоры, насосы, холодильники)
  const powerConsumption_kW = fatGas_kg_h * 0.05; // 0.05 кВт на кг/ч газа – грубая оценка

  return {
    fatGas_kg_h,
    semiDryGas_kg_h,
    dryGas_kg_h,
    ethaneEthylene_kg_h,
    propanePropylene_kg_h,
    butaneButylene_kg_h,
    h2sRemoved_kg_h,
    waterRemoved_kg_h,
    powerConsumption_kW,
  };
}
// ========== НЕЙРОСЕТЕВОЙ ПРЕДИКТОР ==========

export interface TrainingSample {
  inputs: number[];   // [feedRate, furnaceTemp, chamberPressure, steamRate, recycleRatio]
  outputs: number[];  // [cokeYield, lightFractionYield, conversionDepth]
}

/**
 * Генерирует обучающую выборку, варьируя параметры процесса.
 * @param feedstock сырьё (фиксированное для обучения, можно использовать текущее)
 * @param samples количество образцов
 */
export function generateTrainingData(
    feedstock: FeedstockProperties,
    samples: number = 300
): TrainingSample[] {
  const data: TrainingSample[] = [];

  // Диапазоны варьирования параметров
  const ranges = {
    feedRate: [50, 200],          // т/ч
    furnaceTemp: [470, 520],      // °C
    chamberPressure: [0.15, 0.6], // МПа
    steamRate: [0.5, 8.0],        // %
    recycleRatio: [0, 0.3],       // доли
  };

  for (let i = 0; i < samples; i++) {
    // Случайные параметры
    const params: ProcessParameters = {
      feedRate: ranges.feedRate[0] + Math.random() * (ranges.feedRate[1] - ranges.feedRate[0]),
      furnaceOutletTemp: ranges.furnaceTemp[0] + Math.random() * (ranges.furnaceTemp[1] - ranges.furnaceTemp[0]),
      chamberPressure: ranges.chamberPressure[0] + Math.random() * (ranges.chamberPressure[1] - ranges.chamberPressure[0]),
      steamRate: ranges.steamRate[0] + Math.random() * (ranges.steamRate[1] - ranges.steamRate[0]),
      recycleRatio: ranges.recycleRatio[0] + Math.random() * (ranges.recycleRatio[1] - ranges.recycleRatio[0]),
      columnTopTemp: 110,
      columnBottomTemp: 390,
      cokingTime: 24,
      steamToPipeTemp: 400,
    };

    // Запуск симуляции
    const results = runSimulation(feedstock, params);

    // Целевые показатели (можно добавить и другие)
    const cokeYield = results.yields.coke;
    const lightFractionYield = results.keyIndicators.lightProductsYield;
    const conversionDepth = results.keyIndicators.conversionDepth;

    data.push({
      inputs: [params.feedRate, params.furnaceOutletTemp, params.chamberPressure, params.steamRate, params.recycleRatio],
      outputs: [cokeYield, lightFractionYield, conversionDepth],
    });
  }

  return data;
}
// ========== ЭТАП 6: ЭКОНОМИКА И ЭКОЛОГИЯ ==========

export interface EconomicsResult {
  // Входные затраты
  feedstockCost_rub_h: number;      // стоимость сырья в час
  energyCost_rub_h: number;         // энергозатраты (топливо, пар, эл/энергия)
  utilitiesCost_rub_h: number;      // вода, воздух и пр.
  totalCost_rub_h: number;

  // Выручка
  revenue_rub_h: number;            // от продажи всей продукции
  productsValue: Record<string, number>; // ценность каждого продукта

  // Прибыль и рентабельность
  profit_rub_h: number;
  profit_rub_tonFeed: number;       // прибыль на тонну сырья
  profitMargin_percent: number;     // рентабельность продаж, %

  // Годовые показатели (при 8400 часах работы)
  annualProfit_rub: number;
  annualRevenue_rub: number;
}

/**
 * Экономический расчёт установки.
 * @param feedstockName название сырья (для подбора цены)
 * @param feedRate_kg_s расход сырья, кг/с
 * @param yields выходы продуктов, % масс.
 * @param keyIndicators ключевые показатели (для корректировки)
 * @param energyConsumption_kW ориентировочное энергопотребление, кВт
 */
export function calculateEconomics(
    feedstockName: string,
    feedRate_kg_s: number,
    yields: ProductYields,
    keyIndicators: KeyIndicators,
    energyConsumption_kW: number = 2500
): EconomicsResult {
  // Часы работы в году (типично 8400 для непрерывных процессов)
  const hoursPerYear = 8400;
  const feedRate_kg_h = feedRate_kg_s * 3600;

  // Цены (руб/т) – ориентировочные для 2025 года
  const prices: Record<string, number> = {
    // Сырьё (разное)
    'Гудрон (Западно-Сибирская нефть)': 18000,
    'Гудрон (Татарская нефть, сернистая)': 16500,
    'Мазут М-100': 22000,
    'Крекинг-остаток': 15000,
    'Тяжёлая смола пиролиза': 12000,
    'Гудрон (малосернистая нефть)': 20000,
    default: 17000,
    // Продукты
    gas: 5000,                  // газ (как топливо)
    headStabilization: 25000,   // сжиженный газ (С3-С4)
    gasoline: 38000,            // бензин
    lightGasOil: 32000,         // лёгкий газойль (дизельное топливо)
    heavyGasOil: 28000,         // тяжёлый газойль (мазут)
    coke: 12000,                // нефтяной кокс (электродный)
    losses: 0,
  };

  // Стоимость сырья
  const feedstockPrice = prices[feedstockName] || prices.default;
  const feedstockCost_rub_h = (feedRate_kg_h / 1000) * feedstockPrice;

  // Энергозатраты (топливный газ + электроэнергия + пар)
  // Упрощённо: 0.8 руб/кВт·ч электроэнергия, 2 руб/кг топливного газа (условно)
  const electricityCost_rub_kWh = 0.8;
  const fuelGasPrice_rub_kg = 2.0;
  // Оценка расхода топливного газа: 0.05 кг на 1 кг сырья
  const fuelGas_kg_h = feedRate_kg_h * 0.05;
  const fuelCost_rub_h = fuelGas_kg_h * fuelGasPrice_rub_kg;
  const electricityCost_rub_h = energyConsumption_kW * electricityCost_rub_kWh;
  // Пар: 0.03 кг на кг сырья, цена 1.2 руб/кг
  const steam_kg_h = feedRate_kg_h * 0.03;
  const steamCost_rub_h = steam_kg_h * 1.2;
  const energyCost_rub_h = fuelCost_rub_h + electricityCost_rub_h + steamCost_rub_h;

  // Водо- и воздухоснабжение (приближённо 50 руб/т сырья)
  const utilitiesCost_rub_h = (feedRate_kg_h / 1000) * 50;

  const totalCost_rub_h = feedstockCost_rub_h + energyCost_rub_h + utilitiesCost_rub_h;

  // Выручка от продуктов (расчёт по каждому)
  const productFlows_kg_h = {
    gas: feedRate_kg_h * yields.gas / 100,
    headStabilization: feedRate_kg_h * yields.headStabilization / 100,
    gasoline: feedRate_kg_h * yields.gasoline / 100,
    lightGasOil: feedRate_kg_h * yields.lightGasOil / 100,
    heavyGasOil: feedRate_kg_h * yields.heavyGasOil / 100,
    coke: feedRate_kg_h * yields.coke / 100,
  };
  const revenue_rub_h =
      (productFlows_kg_h.gas / 1000) * prices.gas +
      (productFlows_kg_h.headStabilization / 1000) * prices.headStabilization +
      (productFlows_kg_h.gasoline / 1000) * prices.gasoline +
      (productFlows_kg_h.lightGasOil / 1000) * prices.lightGasOil +
      (productFlows_kg_h.heavyGasOil / 1000) * prices.heavyGasOil +
      (productFlows_kg_h.coke / 1000) * prices.coke;

  const profit_rub_h = revenue_rub_h - totalCost_rub_h;
  const profit_rub_tonFeed = profit_rub_h / (feedRate_kg_h / 1000);
  const profitMargin_percent = (profit_rub_h / revenue_rub_h) * 100;

  const annualProfit_rub = profit_rub_h * hoursPerYear;
  const annualRevenue_rub = revenue_rub_h * hoursPerYear;

  // Детализация ценности продуктов
  const productsValue: Record<string, number> = {};
  for (const [key, flow] of Object.entries(productFlows_kg_h)) {
    productsValue[key] = (flow / 1000) * (prices[key as keyof typeof prices] || 0);
  }

  return {
    feedstockCost_rub_h,
    energyCost_rub_h,
    utilitiesCost_rub_h,
    totalCost_rub_h,
    revenue_rub_h,
    productsValue,
    profit_rub_h,
    profit_rub_tonFeed,
    profitMargin_percent,
    annualProfit_rub,
    annualRevenue_rub,
  };
}

// ========== ЭКОЛОГИЧЕСКИЙ РАСЧЁТ ==========

export interface EcologyResult {
  // Выбросы в атмосферу (кг/ч)
  emissions: {
    SO2: number;       // диоксид серы
    CO: number;        // оксид углерода
    NO2: number;       // диоксид азота
    NO: number;        // оксид азота
    CH4: number;       // метан
    Benzoapyrene: number; // бенз(а)пирен (мг/ч)
    VOC: number;       // летучие органические соединения (бензин, углеводороды)
  };
  // Сточные воды (м³/ч, загрязнения в мг/л)
  wastewater: {
    flow_m3_h: number;
    oilProducts_mg_l: number;   // нефтепродукты
    suspended_mg_l: number;     // взвешенные вещества
    sulfides_mg_l: number;      // сульфиды
    ammonia_mg_l: number;       // аммонийный азот
  };
  // Отходы (т/год)
  waste: {
    oilSludge_t_year: number;   // нефтешлам
    spentFilters_t_year: number; // отработанные фильтроэлементы
  };
}

/**
 * Экологический расчёт на основе материального баланса и параметров.
 */
export function calculateEcology(
    feedRate_kg_s: number,
    yields: ProductYields,
    params: ProcessParameters,
    h2sRemoved_kg_h: number = 0   // из глубокой переработки газа
): EcologyResult {
  const feedRate_kg_h = feedRate_kg_s * 3600;
  const gasFlow_kg_h = feedRate_kg_h * yields.gas / 100;

  // Выбросы от печей (на основе расхода топливного газа и параметров)
  // Ориентировочные удельные выбросы (кг/т сырья) из регламентов
  const emissionsPerTonFeed = {
    SO2: 0.066,      // из регламента секции 100
    CO: 0.32,
    NO2: 2.36,
    NO: 1.22,
    CH4: 0.171,
    Benzoapyrene_mg: 0.0000037,
  };
  const feedRate_t_h = feedRate_kg_h / 1000;
  const emissions = {
    SO2: emissionsPerTonFeed.SO2 * feedRate_t_h,
    CO: emissionsPerTonFeed.CO * feedRate_t_h,
    NO2: emissionsPerTonFeed.NO2 * feedRate_t_h,
    NO: emissionsPerTonFeed.NO * feedRate_t_h,
    CH4: emissionsPerTonFeed.CH4 * feedRate_t_h,
    Benzoapyrene: emissionsPerTonFeed.Benzoapyrene_mg * feedRate_t_h,
    VOC: gasFlow_kg_h * 0.1,   // 10% от газа – неорганизованные выбросы (упрощённо)
  };

  // Сточные воды (ориентировочно 0.05 м³/т сырья + ливневые)
  const wastewaterFlow_m3_h = feedRate_t_h * 0.05 + 0.5;
  const wastewater = {
    flow_m3_h: wastewaterFlow_m3_h,
    oilProducts_mg_l: 100,
    suspended_mg_l: 100,
    sulfides_mg_l: 50,
    ammonia_mg_l: 100,
  };

  // Отходы (шлам и фильтры)
  const oilSludge_t_year = feedRate_t_h * 8400 * 0.000015; // 0.0015% от сырья
  const spentFilters_t_year = feedRate_t_h * 8400 * 0.000001;

  return {
    emissions,
    wastewater,
    waste: {
      oilSludge_t_year,
      spentFilters_t_year,
    },
  };
}