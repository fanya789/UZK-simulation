// ========== Типы данных для моделирования УЗК ==========

export interface FeedstockParams {
  // Характеристики сырья (гудрон / мазут)
  feedRate: number;           // Расход сырья, т/ч
  density: number;            // Плотность при 20°C, кг/м³
  sulfurContent: number;      // Содержание серы, % масс.
  asphalteneContent: number;  // Содержание асфальтенов, % масс.
  cokability: number;         // Коксуемость по Конрадсону, % масс.
  viscosity: number;          // Вязкость при 100°C, сСт
  ccr: number;                // Углеродный остаток, % масс.
}

export interface FurnaceParams {
  // Параметры трубчатой печи
  inletTemp: number;          // Температура на входе в печь, °C
  outletTemp: number;         // Температура на выходе из печи, °C
  pressure: number;           // Давление в змеевике, МПа
  coilType: 'single' | 'double'; // Тип змеевика
  heatDuty: number;           // Тепловая нагрузка, МВт
  residenceTime: number;      // Время пребывания в змеевике, с
}

export interface ReactorParams {
  // Параметры коксовых камер (реакторов)
  numberOfChambers: number;   // Количество камер
  chamberDiameter: number;    // Диаметр камеры, м
  chamberHeight: number;      // Высота камеры, м
  topPressure: number;        // Давление верха камеры, МПа
  bottomTemp: number;         // Температура низа камеры, °C
  topTemp: number;            // Температура верха камеры, °C
  fillTime: number;           // Время заполнения, ч
  cycleTime: number;          // Полный цикл, ч
}

export interface FractionationParams {
  // Параметры ректификационной колонны
  numberOfTrays: number;      // Число тарелок
  topTemp: number;            // Температура верха, °C
  bottomTemp: number;         // Температура низа, °C
  pressure: number;           // Давление, МПа
  refluxRatio: number;        // Коэффициент орошения
}

export interface SimulationInput {
  feedstock: FeedstockParams;
  furnace: FurnaceParams;
  reactor: ReactorParams;
  fractionation: FractionationParams;
}

export interface ProductYields {
  gas: number;                // Газ, % масс.
  gasoline: number;           // Бензин (н.к.-180°C), % масс.
  lightGasoil: number;       // Лёгкий газойль (180-350°C), % масс.
  heavyGasoil: number;       // Тяжёлый газойль (350-500°C), % масс.
  coke: number;              // Кокс, % масс.
  losses: number;            // Потери, % масс.
}

export interface ProductProperties {
  gasDensity: number;         // Плотность газа, кг/м³
  gasolineDensity: number;    // Плотность бензина, кг/м³
  gasolineSulfur: number;     // Сера в бензине, % масс.
  lightGasoilDensity: number; // Плотность лёгкого газойля, кг/м³
  lightGasoilSulfur: number;  // Сера в ЛГ, % масс.
  heavyGasoilDensity: number; // Плотность тяжёлого газойля, кг/м³
  heavyGasoilSulfur: number;  // Сера в ТГ, % масс.
  cokeVolatiles: number;      // Летучие в коксе, % масс.
  cokeSulfur: number;         // Сера в коксе, % масс.
  cokeAsh: number;            // Зольность кокса, % масс.
}

export interface HeatBalance {
  heatInput: number;          // Подвод тепла, МВт
  heatReaction: number;       // Тепло реакции, МВт
  heatProducts: number;       // Тепло с продуктами, МВт
  heatLosses: number;         // Потери тепла, МВт
  efficiency: number;         // КПД, %
}

export interface MaterialBalance {
  feedIn: number;             // Сырьё на входе, т/ч
  gasOut: number;             // Газ, т/ч
  gasolineOut: number;        // Бензин, т/ч
  lightGasoilOut: number;     // ЛГ, т/ч
  heavyGasoilOut: number;     // ТГ, т/ч
  cokeOut: number;            // Кокс, т/ч
  lossesOut: number;          // Потери, т/ч
  totalOut: number;           // Итого выход, т/ч
  closureError: number;       // Невязка баланса, %
}

export interface TimeSeriesPoint {
  time: number;               // Время, ч
  temperature: number;        // Температура, °C
  pressure: number;           // Давление, МПа
  cokeLevel: number;          // Уровень кокса, %
  conversionRate: number;     // Степень конверсии, %
}

export interface SimulationResult {
  yields: ProductYields;
  properties: ProductProperties;
  heatBalance: HeatBalance;
  materialBalance: MaterialBalance;
  timeSeries: TimeSeriesPoint[];
  reactorProfile: { height: number; temp: number; density: number }[];
  status: 'success' | 'warning' | 'error';
  warnings: string[];
}

export type TabType = 'input' | 'results' | 'charts' | 'flowsheet' | 'report';
