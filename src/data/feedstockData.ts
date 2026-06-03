export interface FeedstockProperties {
  id: string;
  name: string;
  density: number; // г/см³ при 20°C
  cokability: number; // коксуемость, % масс.
  sulfur: number; // содержание серы, % масс.
  ash: number; // зольность, % масс.
  viscosity100: number; // вязкость при 100°С, сСт
  carbon: number; // углерод, % масс.
  hydrogen: number; // водород, % масс.
  nitrogen: number; // азот, % масс.
  vanadium: number; // ванадий, ppm
  nickel: number; // никель, ppm
  flashPoint: number; // температура вспышки, °C
  pourPoint: number; // температура застывания, °C
  // Углеводородный (групповой) состав, % масс.
  paraffins: number;
  naphthenes: number;
  aromatics: number;
  resins: number;
  asphaltenes: number;
  // Выход продуктов по умолчанию при стандартных условиях, % масс.
  defaultYields: ProductYields;
  // Фракционный состав продуктов
  fractionComposition: FractionComposition;
}

export interface ProductYields {
  gas: number; // углеводородный газ
  headStabilization: number; // головка стабилизации (пропан-бутан)
  gasoline: number; // бензин (н.к.-180°C)
  lightGasOil: number; // легкий газойль (180-350°C)
  heavyGasOil: number; // тяжелый газойль (>350°C)
  coke: number; // кокс
  losses: number; // потери
}

export interface FractionComposition {
  gas: GasComposition;
  gasoline: GasolineComposition;
  lightGasOil: LightGasOilComposition;
  heavyGasOil: HeavyGasOilComposition;
  coke: CokeComposition;
}

export interface GasComposition {
  hydrogen: number; // H2
  methane: number; // CH4
  ethane: number; // C2H6
  ethylene: number; // C2H4
  propane: number; // C3H8
  propylene: number; // C3H6
  butanes: number; // C4
  h2s: number; // H2S
}

export interface GasolineComposition {
  paraffins: number;
  naphthenes: number;
  aromatics: number;
  olefins: number;
  sulfur: number; // % масс.
  octaneRON: number; // октановое число ИМ
  octaneMON: number; // октановое число ММ
  density: number; // г/см³
  boilingStart: number; // начало кипения, °C
  boilingEnd: number; // конец кипения, °C
}

export interface LightGasOilComposition {
  paraffins: number;
  naphthenes: number;
  aromatics: number;
  sulfur: number;
  density: number;
  cetaneNumber: number;
  boilingStart: number;
  boilingEnd: number;
}

export interface HeavyGasOilComposition {
  paraffins: number;
  naphthenes: number;
  aromatics: number;
  resins: number;
  sulfur: number;
  density: number;
  cokability: number;
  boilingStart: number;
  boilingEnd: number;
}

export interface CokeComposition {
  volatiles: number; // летучие, %
  ash: number; // зольность, %
  sulfur: number; // сера, %
  moisture: number; // влажность, %
  trueDensity: number; // истинная плотность, г/см³
}

export const feedstockDatabase: FeedstockProperties[] = [
  {
    id: 'gudron_ws',
    name: 'Гудрон (Западно-Сибирская нефть)',
    density: 0.988,
    cokability: 15.9,
    sulfur: 2.33,
    ash: 0.08,
    viscosity100: 633,
    carbon: 86.2,
    hydrogen: 10.5,
    nitrogen: 0.45,
    vanadium: 140,
    nickel: 23,
    flashPoint: 310,
    pourPoint: 32,
    paraffins: 18,
    naphthenes: 22,
    aromatics: 40,
    resins: 12,
    asphaltenes: 8,
    defaultYields: {
      gas: 5.9,
      headStabilization: 2.7,
      gasoline: 13.0,
      lightGasOil: 28.5,
      heavyGasOil: 25.9,
      coke: 22.2,
      losses: 1.8,
    },
    fractionComposition: {
      gas: {
        hydrogen: 8.5,
        methane: 32.0,
        ethane: 18.5,
        ethylene: 7.0,
        propane: 12.0,
        propylene: 8.5,
        butanes: 10.5,
        h2s: 3.0,
      },
      gasoline: {
        paraffins: 30,
        naphthenes: 15,
        aromatics: 25,
        olefins: 30,
        sulfur: 0.45,
        octaneRON: 66,
        octaneMON: 58,
        density: 0.730,
        boilingStart: 38,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 25,
        naphthenes: 20,
        aromatics: 55,
        sulfur: 1.8,
        density: 0.870,
        cetaneNumber: 42,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 12,
        naphthenes: 15,
        aromatics: 55,
        resins: 18,
        sulfur: 2.1,
        density: 0.960,
        cokability: 3.5,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 8.5,
        ash: 0.3,
        sulfur: 2.8,
        moisture: 3.0,
        trueDensity: 2.08,
      },
    },
  },
  {
    id: 'gudron_ts',
    name: 'Гудрон (Татарская нефть, сернистая)',
    density: 1.015,
    cokability: 22.0,
    sulfur: 4.1,
    ash: 0.12,
    viscosity100: 920,
    carbon: 85.5,
    hydrogen: 9.8,
    nitrogen: 0.52,
    vanadium: 260,
    nickel: 45,
    flashPoint: 325,
    pourPoint: 40,
    paraffins: 12,
    naphthenes: 18,
    aromatics: 42,
    resins: 16,
    asphaltenes: 12,
    defaultYields: {
      gas: 5.2,
      headStabilization: 2.4,
      gasoline: 10.5,
      lightGasOil: 24.0,
      heavyGasOil: 26.0,
      coke: 29.5,
      losses: 2.4,
    },
    fractionComposition: {
      gas: {
        hydrogen: 7.0,
        methane: 30.0,
        ethane: 17.0,
        ethylene: 6.0,
        propane: 13.0,
        propylene: 9.0,
        butanes: 12.0,
        h2s: 6.0,
      },
      gasoline: {
        paraffins: 28,
        naphthenes: 14,
        aromatics: 27,
        olefins: 31,
        sulfur: 0.55,
        octaneRON: 64,
        octaneMON: 56,
        density: 0.738,
        boilingStart: 40,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 22,
        naphthenes: 18,
        aromatics: 60,
        sulfur: 3.2,
        density: 0.885,
        cetaneNumber: 38,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 10,
        naphthenes: 12,
        aromatics: 58,
        resins: 20,
        sulfur: 3.8,
        density: 0.975,
        cokability: 5.5,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 7.5,
        ash: 0.4,
        sulfur: 4.5,
        moisture: 2.8,
        trueDensity: 2.12,
      },
    },
  },
  {
    id: 'mazut_m100',
    name: 'Мазут М-100',
    density: 0.960,
    cokability: 10.5,
    sulfur: 1.8,
    ash: 0.05,
    viscosity100: 180,
    carbon: 86.5,
    hydrogen: 11.2,
    nitrogen: 0.35,
    vanadium: 80,
    nickel: 15,
    flashPoint: 240,
    pourPoint: 25,
    paraffins: 25,
    naphthenes: 25,
    aromatics: 35,
    resins: 10,
    asphaltenes: 5,
    defaultYields: {
      gas: 6.8,
      headStabilization: 3.0,
      gasoline: 15.5,
      lightGasOil: 32.0,
      heavyGasOil: 24.0,
      coke: 16.5,
      losses: 2.2,
    },
    fractionComposition: {
      gas: {
        hydrogen: 10.0,
        methane: 34.0,
        ethane: 19.0,
        ethylene: 8.0,
        propane: 11.0,
        propylene: 7.5,
        butanes: 8.5,
        h2s: 2.0,
      },
      gasoline: {
        paraffins: 35,
        naphthenes: 18,
        aromatics: 22,
        olefins: 25,
        sulfur: 0.30,
        octaneRON: 68,
        octaneMON: 60,
        density: 0.725,
        boilingStart: 36,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 30,
        naphthenes: 22,
        aromatics: 48,
        sulfur: 1.3,
        density: 0.860,
        cetaneNumber: 45,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 16,
        naphthenes: 18,
        aromatics: 50,
        resins: 16,
        sulfur: 1.6,
        density: 0.945,
        cokability: 2.5,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 9.5,
        ash: 0.2,
        sulfur: 2.0,
        moisture: 3.5,
        trueDensity: 2.05,
      },
    },
  },
  {
    id: 'cracking_residue',
    name: 'Крекинг-остаток',
    density: 1.020,
    cokability: 20.0,
    sulfur: 1.5,
    ash: 0.10,
    viscosity100: 800,
    carbon: 87.0,
    hydrogen: 9.5,
    nitrogen: 0.50,
    vanadium: 100,
    nickel: 30,
    flashPoint: 300,
    pourPoint: 38,
    paraffins: 10,
    naphthenes: 15,
    aromatics: 48,
    resins: 15,
    asphaltenes: 12,
    defaultYields: {
      gas: 5.0,
      headStabilization: 2.2,
      gasoline: 5.5,
      lightGasOil: 25.8,
      heavyGasOil: 28.5,
      coke: 31.0,
      losses: 2.0,
    },
    fractionComposition: {
      gas: {
        hydrogen: 7.5,
        methane: 28.0,
        ethane: 16.0,
        ethylene: 8.5,
        propane: 11.5,
        propylene: 10.0,
        butanes: 13.5,
        h2s: 5.0,
      },
      gasoline: {
        paraffins: 22,
        naphthenes: 12,
        aromatics: 32,
        olefins: 34,
        sulfur: 0.35,
        octaneRON: 70,
        octaneMON: 61,
        density: 0.745,
        boilingStart: 42,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 18,
        naphthenes: 15,
        aromatics: 67,
        sulfur: 1.2,
        density: 0.890,
        cetaneNumber: 36,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 8,
        naphthenes: 10,
        aromatics: 62,
        resins: 20,
        sulfur: 1.4,
        density: 0.980,
        cokability: 6.0,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 7.0,
        ash: 0.35,
        sulfur: 1.8,
        moisture: 2.5,
        trueDensity: 2.15,
      },
    },
  },
  {
    id: 'pyrolysis_tar',
    name: 'Тяжёлая смола пиролиза',
    density: 1.050,
    cokability: 25.0,
    sulfur: 0.5,
    ash: 0.02,
    viscosity100: 350,
    carbon: 91.0,
    hydrogen: 7.8,
    nitrogen: 0.30,
    vanadium: 10,
    nickel: 5,
    flashPoint: 180,
    pourPoint: 15,
    paraffins: 3,
    naphthenes: 5,
    aromatics: 72,
    resins: 12,
    asphaltenes: 8,
    defaultYields: {
      gas: 4.5,
      headStabilization: 1.8,
      gasoline: 4.0,
      lightGasOil: 20.0,
      heavyGasOil: 30.0,
      coke: 37.5,
      losses: 2.2,
    },
    fractionComposition: {
      gas: {
        hydrogen: 12.0,
        methane: 35.0,
        ethane: 15.0,
        ethylene: 10.0,
        propane: 9.0,
        propylene: 7.0,
        butanes: 10.5,
        h2s: 1.5,
      },
      gasoline: {
        paraffins: 12,
        naphthenes: 8,
        aromatics: 50,
        olefins: 30,
        sulfur: 0.10,
        octaneRON: 78,
        octaneMON: 68,
        density: 0.770,
        boilingStart: 45,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 10,
        naphthenes: 10,
        aromatics: 80,
        sulfur: 0.4,
        density: 0.920,
        cetaneNumber: 28,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 5,
        naphthenes: 5,
        aromatics: 75,
        resins: 15,
        sulfur: 0.5,
        density: 1.010,
        cokability: 8.0,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 5.5,
        ash: 0.05,
        sulfur: 0.6,
        moisture: 2.0,
        trueDensity: 2.22,
      },
    },
  },
  {
    id: 'gudron_light',
    name: 'Гудрон (малосернистая нефть)',
    density: 0.965,
    cokability: 12.0,
    sulfur: 0.8,
    ash: 0.04,
    viscosity100: 420,
    carbon: 86.8,
    hydrogen: 11.0,
    nitrogen: 0.30,
    vanadium: 45,
    nickel: 10,
    flashPoint: 295,
    pourPoint: 22,
    paraffins: 22,
    naphthenes: 26,
    aromatics: 36,
    resins: 10,
    asphaltenes: 6,
    defaultYields: {
      gas: 6.5,
      headStabilization: 2.9,
      gasoline: 14.5,
      lightGasOil: 30.5,
      heavyGasOil: 24.5,
      coke: 19.0,
      losses: 2.1,
    },
    fractionComposition: {
      gas: {
        hydrogen: 9.5,
        methane: 33.5,
        ethane: 19.5,
        ethylene: 7.5,
        propane: 12.0,
        propylene: 8.0,
        butanes: 9.0,
        h2s: 1.0,
      },
      gasoline: {
        paraffins: 35,
        naphthenes: 18,
        aromatics: 20,
        olefins: 27,
        sulfur: 0.15,
        octaneRON: 67,
        octaneMON: 59,
        density: 0.722,
        boilingStart: 36,
        boilingEnd: 180,
      },
      lightGasOil: {
        paraffins: 30,
        naphthenes: 24,
        aromatics: 46,
        sulfur: 0.6,
        density: 0.855,
        cetaneNumber: 47,
        boilingStart: 180,
        boilingEnd: 350,
      },
      heavyGasOil: {
        paraffins: 18,
        naphthenes: 20,
        aromatics: 48,
        resins: 14,
        sulfur: 0.7,
        density: 0.940,
        cokability: 2.0,
        boilingStart: 350,
        boilingEnd: 520,
      },
      coke: {
        volatiles: 9.0,
        ash: 0.15,
        sulfur: 1.0,
        moisture: 3.2,
        trueDensity: 2.04,
      },
    },
  },
];

export const getDefaultFeedstock = (): FeedstockProperties => feedstockDatabase[0];
// feedstockData.ts (добавить в конец файла)

export const createEmptyFeedstock = (): FeedstockProperties => ({
  id: `custom_${Date.now()}`,
  name: 'Новое сырьё',
  density: 1.0,
  cokability: 15.0,
  sulfur: 2.0,
  ash: 0.1,
  viscosity100: 500,
  carbon: 85,
  hydrogen: 10,
  nitrogen: 0.4,
  vanadium: 100,
  nickel: 20,
  flashPoint: 300,
  pourPoint: 30,
  paraffins: 20,
  naphthenes: 20,
  aromatics: 40,
  resins: 12,
  asphaltenes: 8,
  defaultYields: {
    gas: 6,
    headStabilization: 2.5,
    gasoline: 12,
    lightGasOil: 28,
    heavyGasOil: 26,
    coke: 23,
    losses: 2.5,
  },
  fractionComposition: {
    gas: { hydrogen: 9, methane: 32, ethane: 18, ethylene: 7, propane: 12, propylene: 8, butanes: 10, h2s: 4 },
    gasoline: { paraffins: 30, naphthenes: 18, aromatics: 25, olefins: 27, sulfur: 0.5, octaneRON: 68, octaneMON: 60, density: 0.73, boilingStart: 38, boilingEnd: 180 },
    lightGasOil: { paraffins: 25, naphthenes: 22, aromatics: 53, sulfur: 1.8, density: 0.87, cetaneNumber: 42, boilingStart: 180, boilingEnd: 350 },
    heavyGasOil: { paraffins: 12, naphthenes: 15, aromatics: 55, resins: 18, sulfur: 2.2, density: 0.96, cokability: 3.5, boilingStart: 350, boilingEnd: 520 },
    coke: { volatiles: 8, ash: 0.3, sulfur: 2.5, moisture: 3, trueDensity: 2.08 },
  },
});