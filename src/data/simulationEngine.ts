import type { FeedstockProperties, ProductYields, FractionComposition } from './feedstockData';
import { UZKProcess } from '../models/uzkProcess';
export interface ProcessParameters {
  feedRate: number;
  furnaceOutletTemp: number;
  chamberPressure: number;
  steamRate: number;
  recycleRatio: number;
  columnTopTemp: number;
  columnBottomTemp: number;
  cokingTime: number;
  steamToPipeTemp: number;
}

export interface SimulationResults {
  yields: ProductYields;
  fractions: FractionComposition;
  massBalance: MassBalance;
  heatBalance: HeatBalance;
  keyIndicators: KeyIndicators;
}

export interface MassBalance {
  feedIn: number;
  steamIn: number;
  totalIn: number;
  gasOut: number;
  gasolineOut: number;
  lightGasOilOut: number;
  heavyGasOilOut: number;
  cokeOut: number;
  lossesOut: number;
  totalOut: number;
}

export interface HeatBalance {
  heatInput: number;
  heatFurnace: number;
  heatSteam: number;
  totalHeatIn: number;
  heatProducts: number;
  heatReaction: number;
  heatLosses: number;
  totalHeatOut: number;
}

export interface KeyIndicators {
  conversionDepth: number;
  lightProductsYield: number;
  cokeYield: number;
  thermalCrackingSeverity: number;
  specificEnergyConsumption: number;
}

// === Основная функция моделирования ===
// Использует новую архитектуру UZKProcess
export function runSimulation(feedstock: FeedstockProperties, params: ProcessParameters): SimulationResults {
  const process = new UZKProcess();

  // Подготовка конфигурации
  const config = {
    feedRate: params.feedRate,
    furnaceOutletTemp: params.furnaceOutletTemp + 273.15, // °C -> K
    chamberPressure: params.chamberPressure * 10, // MPa -> bar
    steamRate: params.steamRate,
    columnTopTemp: params.columnTopTemp + 273.15,
    columnBottomTemp: params.columnBottomTemp + 273.15,
    refluxRatio: params.recycleRatio * 2,
    stages: 10,
  };

  const result = process.run(config as any);

  // Преобразование результата в старый формат
  return convertToLegacyResult(result, params);
}

// Преобразование результата UZKProcess в legacy SimulationResults
function convertToLegacyResult(result: any, params: ProcessParameters): SimulationResults {
  const yields = result.yields;

  // Фракции (упрощённо на основе defaultYields)
  const fractions: FractionComposition = {
    gas: { hydrogen: 10, methane: 30, ethane: 15, ethylene: 5, propane: 10, propylene: 8, butanes: 12, h2s: 5 },
    gasoline: { paraffins: 30, naphthenes: 15, aromatics: 25, olefins: 30, sulfur: 0.5, octaneRON: 68, octaneMON: 60, density: 0.73, boilingStart: 38, boilingEnd: 180 },
    lightGasOil: { paraffins: 25, naphthenes: 20, aromatics: 55, sulfur: 1.8, density: 0.87, cetaneNumber: 42, boilingStart: 180, boilingEnd: 350 },
    heavyGasOil: { paraffins: 12, naphthenes: 15, aromatics: 55, resins: 18, sulfur: 2.2, density: 0.96, cokability: 3.5, boilingStart: 350, boilingEnd: 520 },
    coke: { volatiles: 8, ash: 0.3, sulfur: 2.5, moisture: 3, trueDensity: 2.08 },
  };

  const feedIn = params.feedRate;
  const steamIn = feedIn * params.steamRate / 100;

  const massBalance: MassBalance = {
    feedIn,
    steamIn,
    totalIn: feedIn + steamIn,
    gasOut: feedIn * (yields.gas + yields.headStabilization) / 100,
    gasolineOut: feedIn * yields.gasoline / 100,
    lightGasOilOut: feedIn * yields.lightGasOil / 100,
    heavyGasOilOut: feedIn * yields.heavyGasOil / 100,
    cokeOut: feedIn * yields.coke / 100,
    lossesOut: feedIn * yields.losses / 100 + steamIn,
    totalOut: feedIn,
  };

  const heatFurnace = massBalance.feedIn * 1000 * 2.1 * (params.furnaceOutletTemp - params.columnBottomTemp) / 3600;
  const heatSteam = massBalance.steamIn * 1000 * 2.0 * params.steamToPipeTemp / 3600;
  const heatInput = massBalance.feedIn * 1000 * 2.1 * params.columnBottomTemp / 3600;
  const totalHeatIn = heatInput + heatFurnace + heatSteam;
  const heatReaction = massBalance.feedIn * 1000 * 300 / 3600;
  const heatProducts = totalHeatIn * 0.55;
  const heatLosses = totalHeatIn - heatProducts - heatReaction;

  const heatBalance: HeatBalance = {
    heatInput,
    heatFurnace,
    heatSteam,
    totalHeatIn,
    heatProducts,
    heatReaction,
    heatLosses,
    totalHeatOut: totalHeatIn,
  };

  const lightProductsYield = yields.gas + yields.headStabilization + yields.gasoline + yields.lightGasOil;
  const conversionDepth = 100 - yields.heavyGasOil - yields.losses;
  const thermalCrackingSeverity = conversionDepth / 100 * 1.5;
  const specificEnergyConsumption = (heatFurnace * 3600) / (massBalance.feedIn * 1000);

  const keyIndicators: KeyIndicators = {
    conversionDepth,
    lightProductsYield,
    cokeYield: yields.coke,
    thermalCrackingSeverity,
    specificEnergyConsumption,
  };

  return {
    yields,
    fractions,
    massBalance,
    heatBalance,
    keyIndicators,
  };
}

// === Вспомогательные функции ===
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

// ========== РАСЧЁТ РАДИАНТНОГО ЗМЕЕВИКА ПЕЧИ ==========
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
  const rho_oil_20 = 1045;
  const temp_coeff = 0.0007;
  const rho_oil_in = rho_oil_20 - temp_coeff * (T_in_C - 20);
  const rho_oil_out = rho_oil_20 - temp_coeff * (T_out_C - 20);

  const R_steam = 461.5;
  const rho_steam_in = (P_in_MPa * 1e6) / (R_steam * (T_in_C + 273.15));
  const rho_steam_out = (P_out_MPa * 1e6) / (R_steam * (T_out_C + 273.15));

  const steamRate_kg_s = oilRate_kg_s * (steamRate_wt_percent / 100);
  const mass_frac_oil = oilRate_kg_s / (oilRate_kg_s + steamRate_kg_s);
  const mass_frac_steam = 1 - mass_frac_oil;
  const rho_mix_in = 1 / (mass_frac_oil / rho_oil_in + mass_frac_steam / rho_steam_in);
  const rho_mix_out = 1 / (mass_frac_oil / rho_oil_out + mass_frac_steam / rho_steam_out);

  const A = Math.PI * Math.pow(diameter_m / 2, 2);
  const G_mix = oilRate_kg_s + steamRate_kg_s;
  const vel_in = (G_mix / rho_mix_in) / A;
  const vel_out = (G_mix / rho_mix_out) / A;

  const vel_avg = (vel_in + vel_out) / 2;
  const target_residence_time = 20;
  const length_m = vel_avg * target_residence_time;

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

// ========== ТЕПЛОВОЙ БАЛАНС КОКСОВОЙ КАМЕРЫ ==========
export interface ChamberDimensions {
  diameter_m: number;
  height_cyl_m: number;
  height_cone_m: number;
  bottom_diameter_m: number;
  top_diameter_m: number;
}

export interface ChamberHeatBalanceResult {
  T_inlet_C: number;
  T_outlet_C: number;
  heatInput_kW: number;
  heatOutput_kW: number;
  imbalance_percent: number;
  iterations: number;
  wallLoss_kW: number;
  reactionHeat_kW: number;
  cokeHeat_kW: number;
}

export function calculateChamberHeatBalance(
    _feedstock: FeedstockProperties,
    params: ProcessParameters,
    results: SimulationResults,
    dims: ChamberDimensions,
    T_guess_initial?: number
): ChamberHeatBalanceResult {
  const T_inlet = params.furnaceOutletTemp - 5;
  let T_guess = T_guess_initial !== undefined ? T_guess_initial : T_inlet - 40;

  const enthalpySteam = (T: number) => 1.89 * T + 2500;
  const enthalpyLiquid = (T: number) => 2.1 * T;
  const enthalpyVapor = (T: number) => 1.8 * T + 350;
  const c_coke = 1.2;
  const q_reaction = 300;

  const G_feed = results.massBalance.feedIn;
  const G_steam = results.massBalance.steamIn;
  const G_gas = results.massBalance.gasOut;
  const G_gasoline = results.massBalance.gasolineOut;
  const G_gasoil_light = results.massBalance.lightGasOilOut;
  const G_gasoil_heavy = results.massBalance.heavyGasOilOut;
  const G_coke = results.massBalance.cokeOut;

  const feedRate_kg_s = G_feed * 1000 / 3600;
  const steamRate_kg_s = G_steam * 1000 / 3600;
  const gasRate_kg_s = G_gas * 1000 / 3600;
  const gasolineRate_kg_s = G_gasoline * 1000 / 3600;
  const lightGORate_kg_s = G_gasoil_light * 1000 / 3600;
  const heavyGORate_kg_s = G_gasoil_heavy * 1000 / 3600;
  const cokeRate_kg_s = G_coke * 1000 / 3600;

  const vaporRate_kg_s = gasRate_kg_s + gasolineRate_kg_s + lightGORate_kg_s + heavyGORate_kg_s;

  const A_cyl = Math.PI * dims.diameter_m * dims.height_cyl_m;
  const slant_height = Math.sqrt(Math.pow((dims.diameter_m - dims.bottom_diameter_m) / 2, 2) + Math.pow(dims.height_cone_m, 2));
  const A_cone = Math.PI * (dims.diameter_m / 2 + dims.bottom_diameter_m / 2) * slant_height;
  const A_top_lid = Math.PI * Math.pow(dims.top_diameter_m / 2, 2);
  const A_bottom_lid = Math.PI * Math.pow(dims.bottom_diameter_m / 2, 2);
  const A_total = A_cyl + A_cone + A_top_lid + A_bottom_lid;

  const alpha = 60 / 3600;
  const deltaT_wall = 50;

  let imbalance = 1.0;
  let iter = 0;
  const maxIter = 50;
  let T_out = T_guess;

  while (Math.abs(imbalance) > 0.005 && iter < maxIter) {
    const Q_feed = feedRate_kg_s * enthalpyLiquid(T_inlet);
    const Q_steam_in = steamRate_kg_s * enthalpySteam(T_inlet);
    const totalHeatIn = Q_feed + Q_steam_in;

    const Q_vapor = vaporRate_kg_s * enthalpyVapor(T_out);
    const Q_steam_out = steamRate_kg_s * enthalpySteam(T_out);
    const Q_coke = cokeRate_kg_s * c_coke * ((T_inlet + T_out) / 2);
    const Q_reaction = feedRate_kg_s * q_reaction;
    const Q_loss = alpha * A_total * deltaT_wall;

    const totalHeatOut = Q_vapor + Q_steam_out + Q_coke + Q_reaction + Q_loss;
    imbalance = (totalHeatIn - totalHeatOut) / totalHeatIn;
    T_out += imbalance * 15;
    iter++;
    if (T_out < 300) T_out = 300;
    if (T_out > 520) T_out = 520;
  }

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

// ========== ФРАКЦИОНИРОВАНИЕ ГАЗА ==========
export interface GasFractionationResult {
  dryGas_kg_h: number;
  ethaneEthylene_kg_h: number;
  propanePropylene_kg_h: number;
  butaneButylene_kg_h: number;
  gasoline_kg_h: number;
  stableGasoline_kg_h: number;
  dryGasComposition: { H2: number; CH4: number };
  c2FractionComposition: { C2H6: number; C2H4: number };
  c3FractionComposition: { C3H8: number; C3H6: number };
  c4FractionComposition: { C4H10: number; C4H8: number };
  h2sRemoved_kg_h: number;
}

export function calculateGasFractionation(
    fatGasFlow_kg_h: number,
    unstableGasoline_kg_h: number,
    _paramPressure_MPa: number,
    _columnEfficiency: number = 0.8
): GasFractionationResult {
  const h2_in = fatGasFlow_kg_h * 0.10;
  const ch4_in = fatGasFlow_kg_h * 0.32;
  const c2h6_in = fatGasFlow_kg_h * 0.18;
  const c2h4_in = fatGasFlow_kg_h * 0.07;
  const c3h8_in = fatGasFlow_kg_h * 0.12;
  const c3h6_in = fatGasFlow_kg_h * 0.08;
  const c4_in = fatGasFlow_kg_h * 0.10;
  const h2s_in = fatGasFlow_kg_h * 0.03;

  const c3_abs_eff = 0.92;
  const c4_abs_eff = 0.96;

  const dryGas_kg_h = h2_in + ch4_in + c2h6_in * (1 - 0.15) + c2h4_in * (1 - 0.10) +
      c3h8_in * (1 - c3_abs_eff) + c3h6_in * (1 - c3_abs_eff) + c4_in * (1 - c4_abs_eff);

  const stableGasoline_kg_h = unstableGasoline_kg_h + (c3h8_in + c3h6_in) * c3_abs_eff * 0.02 +
      c4_in * c4_abs_eff * 0.03 + 100;

  const ethaneEthylene_kg_h = (c2h6_in + c2h4_in) * 0.70;
  const propanePropylene_kg_h = (c3h8_in + c3h6_in) * c3_abs_eff * 0.90;
  const butaneButylene_kg_h = c4_in * c4_abs_eff * 0.92;

  const finalDryGas = dryGas_kg_h + ethaneEthylene_kg_h * 0.3 + propanePropylene_kg_h * 0.1 + butaneButylene_kg_h * 0.08;
  const h2sRemoved_kg_h = h2s_in * 0.95;

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
    gasoline_kg_h: stableGasoline_kg_h,
    stableGasoline_kg_h,
    dryGasComposition,
    c2FractionComposition,
    c3FractionComposition,
    c4FractionComposition,
    h2sRemoved_kg_h,
  };
}

// ========== ГЛУБОКАЯ ПЕРЕРАБОТКА ГАЗА ==========
export interface DeepGasProcessingResult {
  fatGas_kg_h: number;
  semiDryGas_kg_h: number;
  dryGas_kg_h: number;
  ethaneEthylene_kg_h: number;
  propanePropylene_kg_h: number;
  butaneButylene_kg_h: number;
  h2sRemoved_kg_h: number;
  waterRemoved_kg_h: number;
  powerConsumption_kW: number;
}

export function calculateDeepGasProcessing(
    fatGas_kg_h: number,
    fatGasComposition: { H2: number; CH4: number; C2H6: number; C2H4: number; C3H8: number; C3H6: number; C4: number; H2S: number },
    absorberEfficiency: number = 0.85,
    h2sRemovalEfficiency: number = 0.98,
    dryingEfficiency: number = 0.99,
    deethanizerEfficiency: number = 0.90
): DeepGasProcessingResult {
  const c3_in = (fatGasComposition.C3H8 + fatGasComposition.C3H6) * fatGas_kg_h / 100;
  const c4_in = fatGasComposition.C4 * fatGas_kg_h / 100;
  const c3Absorbed = c3_in * absorberEfficiency;
  const c4Absorbed = c4_in * absorberEfficiency;
  const semiDryGas_kg_h = fatGas_kg_h - c3Absorbed - c4Absorbed;

  const h2s_in = fatGasComposition.H2S * fatGas_kg_h / 100;
  const h2sRemoved_kg_h = h2s_in * h2sRemovalEfficiency;
  const gasAfterH2S = semiDryGas_kg_h - h2sRemoved_kg_h;

  const moisture_in = gasAfterH2S * 0.004;
  const waterRemoved_kg_h = moisture_in * dryingEfficiency;

  const c2_in = (fatGasComposition.C2H6 + fatGasComposition.C2H4) * fatGas_kg_h / 100;
  const c2Recovered = c2_in * deethanizerEfficiency;
  const h2_ch4_in = (fatGasComposition.H2 + fatGasComposition.CH4) * fatGas_kg_h / 100;
  const dryGas_kg_h = h2_ch4_in + (c2_in - c2Recovered) * 0.2;
  const ethaneEthylene_kg_h = c2Recovered;

  const c3_recovered = c3Absorbed * 0.90;
  const c4_recovered = c4Absorbed * 0.92;
  const propanePropylene_kg_h = c3_recovered;
  const butaneButylene_kg_h = c4_recovered;

  const powerConsumption_kW = fatGas_kg_h * 0.05;

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

// ========== ЭКОНОМИКА ==========
export interface EconomicsResult {
  feedstockCost_rub_h: number;
  energyCost_rub_h: number;
  utilitiesCost_rub_h: number;
  totalCost_rub_h: number;
  revenue_rub_h: number;
  productsValue: Record<string, number>;
  profit_rub_h: number;
  profit_rub_tonFeed: number;
  profitMargin_percent: number;
  annualProfit_rub: number;
  annualRevenue_rub: number;
}

export function calculateEconomics(
    feedstockName: string,
    feedRate_kg_s: number,
    yields: ProductYields,
    _keyIndicators: KeyIndicators,
    energyConsumption_kW: number = 2500
): EconomicsResult {
  const hoursPerYear = 8400;
  const feedRate_kg_h = feedRate_kg_s * 3600;

  const prices: Record<string, number> = {
    'Гудрон (Западно-Сибирская нефть)': 18000,
    'Гудрон (Татарская нефть, сернистая)': 16500,
    'Мазут М-100': 22000,
    'Крекинг-остаток': 15000,
    'Тяжёлая смола пиролиза': 12000,
    'Гудрон (малосернистая нефть)': 20000,
    default: 17000,
    gas: 5000,
    headStabilization: 25000,
    gasoline: 38000,
    lightGasOil: 32000,
    heavyGasOil: 28000,
    coke: 12000,
    losses: 0,
  };

  const feedstockPrice = prices[feedstockName] || prices.default;
  const feedstockCost_rub_h = (feedRate_kg_h / 1000) * feedstockPrice;

  const electricityCost_rub_kWh = 0.8;
  const fuelGasPrice_rub_kg = 2.0;
  const fuelGas_kg_h = feedRate_kg_h * 0.05;
  const fuelCost_rub_h = fuelGas_kg_h * fuelGasPrice_rub_kg;
  const electricityCost_rub_h = energyConsumption_kW * electricityCost_rub_kWh;
  const steam_kg_h = feedRate_kg_h * 0.03;
  const steamCost_rub_h = steam_kg_h * 1.2;
  const energyCost_rub_h = fuelCost_rub_h + electricityCost_rub_h + steamCost_rub_h;

  const utilitiesCost_rub_h = (feedRate_kg_h / 1000) * 50;
  const totalCost_rub_h = feedstockCost_rub_h + energyCost_rub_h + utilitiesCost_rub_h;

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

// ========== ЭКОЛОГИЯ ==========
export interface EcologyResult {
  emissions: {
    SO2: number;
    CO: number;
    NO2: number;
    NO: number;
    CH4: number;
    Benzoapyrene: number;
    VOC: number;
  };
  wastewater: {
    flow_m3_h: number;
    oilProducts_mg_l: number;
    suspended_mg_l: number;
    sulfides_mg_l: number;
    ammonia_mg_l: number;
  };
  waste: {
    oilSludge_t_year: number;
    spentFilters_t_year: number;
  };
}

export function calculateEcology(
    feedRate_kg_s: number,
    yields: ProductYields,
    _params: ProcessParameters,
    _h2sRemoved_kg_h: number = 0
): EcologyResult {
  const feedRate_kg_h = feedRate_kg_s * 3600;
  const gasFlow_kg_h = feedRate_kg_h * yields.gas / 100;

  const emissionsPerTonFeed = {
    SO2: 0.066,
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
    VOC: gasFlow_kg_h * 0.1,
  };

  const wastewaterFlow_m3_h = feedRate_t_h * 0.05 + 0.5;
  const wastewater = {
    flow_m3_h: wastewaterFlow_m3_h,
    oilProducts_mg_l: 100,
    suspended_mg_l: 100,
    sulfides_mg_l: 50,
    ammonia_mg_l: 100,
  };

  const oilSludge_t_year = feedRate_t_h * 8400 * 0.000015;
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
