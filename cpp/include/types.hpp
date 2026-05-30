#pragma once

#include <string>
#include <vector>
#include <map>

// ========== Типы данных для моделирования УЗК ==========

struct FeedstockParams {
    double feedRate;           // Расход сырья, т/ч
    double density;            // Плотность при 20°C, кг/м³
    double sulfurContent;      // Содержание серы, % масс.
    double asphalteneContent;  // Содержание асфальтенов, % масс.
    double cokability;         // Коксуемость по Конрадсону, % масс.
    double viscosity;          // Вязкость при 100°C, сСт
    double ccr;                // Углеродный остаток, % масс.
};

struct FurnaceParams {
    double inletTemp;          // Температура на входе в печь, °C
    double outletTemp;         // Температура на выходе из печи, °C
    double pressure;           // Давление в змеевике, МПа
    std::string coilType;      // Тип змеевика: "single" или "double"
    double heatDuty;           // Тепловая нагрузка, МВт
    double residenceTime;      // Время пребывания в змеевике, с
};

struct ReactorParams {
    int numberOfChambers;      // Количество камер
    double chamberDiameter;    // Диаметр камеры, м
    double chamberHeight;      // Высота камеры, м
    double topPressure;        // Давление верха камеры, МПа
    double bottomTemp;         // Температура низа камеры, °C
    double topTemp;            // Температура верха камеры, °C
    double fillTime;           // Время заполнения, ч
    double cycleTime;          // Полный цикл, ч
};

struct FractionationParams {
    int numberOfTrays;         // Число тарелок
    double topTemp;            // Температура верха, °C
    double bottomTemp;         // Температура низа, °C
    double pressure;           // Давление, МПа
    double refluxRatio;        // Коэффициент орошения
};

struct SimulationInput {
    FeedstockParams feedstock;
    FurnaceParams furnace;
    ReactorParams reactor;
    FractionationParams fractionation;
};

struct ProductYields {
    double gas;                // Газ, % масс.
    double gasoline;           // Бензин (н.к.-180°C), % масс.
    double lightGasoil;        // Лёгкий газойль (180-350°C), % масс.
    double heavyGasoil;        // Тяжёлый газойль (350-500°C), % масс.
    double coke;               // Кокс, % масс.
    double losses;             // Потери, % масс.
};

struct ProductProperties {
    double gasDensity;         // Плотность газа, кг/м³
    double gasolineDensity;    // Плотность бензина, кг/м³
    double gasolineSulfur;     // Сера в бензине, % масс.
    double lightGasoilDensity; // Плотность лёгкого газойля, кг/м³
    double lightGasoilSulfur;  // Сера в ЛГ, % масс.
    double heavyGasoilDensity; // Плотность тяжёлого газойля, кг/м³
    double heavyGasoilSulfur;  // Сера в ТГ, % масс.
    double cokeVolatiles;      // Летучие в коксе, % масс.
    double cokeSulfur;         // Сера в коксе, % масс.
    double cokeAsh;            // Зольность кокса, % масс.
};

struct HeatBalance {
    double heatInput;          // Подвод тепла, МВт
    double heatReaction;       // Тепло реакции, МВт
    double heatProducts;       // Тепло с продуктами, МВт
    double heatLosses;         // Потери тепла, МВт
    double efficiency;         // КПД, %
};

struct MaterialBalance {
    double feedIn;             // Сырьё на входе, т/ч
    double gasOut;             // Газ, т/ч
    double gasolineOut;        // Бензин, т/ч
    double lightGasoilOut;     // ЛГ, т/ч
    double heavyGasoilOut;     // ТГ, т/ч
    double cokeOut;            // Кокс, т/ч
    double lossesOut;          // Потери, т/ч
    double totalOut;           // Итого выход, т/ч
    double closureError;       // Невязка баланса, %
};

struct TimeSeriesPoint {
    double time;               // Время, ч
    double temperature;        // Температура, °C
    double pressure;           // Давление, МПа
    double cokeLevel;          // Уровень кокса, %
    double conversionRate;     // Степень конверсии, %
};

struct ReactorProfilePoint {
    double height;             // Высота, м
    double temp;               // Температура, °C
    double density;            // Плотность, кг/м³
};

struct SimulationResult {
    ProductYields yields;
    ProductProperties properties;
    HeatBalance heatBalance;
    MaterialBalance materialBalance;
    std::vector<TimeSeriesPoint> timeSeries;
    std::vector<ReactorProfilePoint> reactorProfile;
    std::string status;        // "success" или "warning"
    std::vector<std::string> warnings;
};
