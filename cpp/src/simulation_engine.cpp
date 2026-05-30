#include "simulation_engine.hpp"
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <sstream>

double SimulationEngine::roundTo(double value, int decimals) {
    double multiplier = std::pow(10.0, decimals);
    return std::round(value * multiplier) / multiplier;
}

double SimulationEngine::calcCokeYield(double cokability, double temp, double pressure) {
    // Эмпирическая корреляция (модифицированная формула Эллиса-Джонса)
    double tempFactor = 1.0 - 0.0012 * (temp - 490.0);
    double pressureFactor = 1.0 + 0.15 * (pressure - 0.2);
    double baseYield = 1.6 * cokability;
    return std::max(15.0, std::min(35.0, baseYield * tempFactor * pressureFactor));
}

double SimulationEngine::calcGasYield(double temp, double cokability, double residenceTime) {
    double tempFactor = 1.0 + 0.003 * (temp - 490.0);
    double timeFactor = 1.0 + 0.001 * (residenceTime - 20.0);
    double base = 5.0 + 0.3 * cokability;
    return std::max(5.0, std::min(18.0, base * tempFactor * timeFactor));
}

double SimulationEngine::calcGasolineYield(double temp, double cokability) {
    double base = 18.0 - 0.4 * cokability;
    double tempFactor = 1.0 + 0.002 * (temp - 490.0);
    return std::max(8.0, std::min(25.0, base * tempFactor));
}

ProductProperties SimulationEngine::calcProductProperties(const SimulationInput& input, const ProductYields& yields) {
    double s = input.feedstock.sulfurContent;
    
    ProductProperties props;
    props.gasDensity = 1.1 + 0.05 * s;
    props.gasolineDensity = 720.0 + 10.0 * s;
    props.gasolineSulfur = s * 0.15;
    props.lightGasoilDensity = 850.0 + 15.0 * s;
    props.lightGasoilSulfur = s * 0.5;
    props.heavyGasoilDensity = 940.0 + 10.0 * s;
    props.heavyGasoilSulfur = s * 0.8;
    props.cokeVolatiles = std::max(6.0, 15.0 - 0.02 * input.reactor.bottomTemp);
    props.cokeSulfur = s * (yields.coke / 100.0) * 3.5;
    props.cokeAsh = 0.1 + 0.05 * input.feedstock.asphalteneContent;
    
    return props;
}

HeatBalance SimulationEngine::calcHeatBalance(const SimulationInput& input, const ProductYields& yields) {
    double feedRate = input.feedstock.feedRate;
    double cp = 2.1; // кДж/(кг·°C) — средняя теплоёмкость
    
    // Подвод тепла (печь)
    double deltaT = input.furnace.outletTemp - input.furnace.inletTemp;
    double heatInput = (feedRate * 1000.0 * cp * deltaT) / 3600.0; // кВт
    double heatInputMW = heatInput / 1000.0; // МВт
    
    // Тепло эндотермических реакций крекинга (~15-20% от подведённого)
    double heatReaction = heatInputMW * 0.18;
    
    // Тепло уносимое продуктами
    double heatProducts = heatInputMW * 0.72;
    
    // Потери
    double heatLosses = heatInputMW - heatReaction - heatProducts;
    
    // КПД
    double efficiency = ((heatInputMW - heatLosses) / heatInputMW) * 100.0;
    
    HeatBalance balance;
    balance.heatInput = roundTo(heatInputMW, 2);
    balance.heatReaction = roundTo(heatReaction, 2);
    balance.heatProducts = roundTo(heatProducts, 2);
    balance.heatLosses = roundTo(heatLosses, 2);
    balance.efficiency = roundTo(efficiency, 1);
    
    return balance;
}

MaterialBalance SimulationEngine::calcMaterialBalance(const SimulationInput& input, const ProductYields& yields) {
    double feedIn = input.feedstock.feedRate;
    double gasOut = roundTo(feedIn * yields.gas / 100.0, 3);
    double gasolineOut = roundTo(feedIn * yields.gasoline / 100.0, 3);
    double lightGasoilOut = roundTo(feedIn * yields.lightGasoil / 100.0, 3);
    double heavyGasoilOut = roundTo(feedIn * yields.heavyGasoil / 100.0, 3);
    double cokeOut = roundTo(feedIn * yields.coke / 100.0, 3);
    double lossesOut = roundTo(feedIn * yields.losses / 100.0, 3);
    double totalOut = roundTo(gasOut + gasolineOut + lightGasoilOut + heavyGasoilOut + cokeOut + lossesOut, 3);
    double closureError = roundTo((totalOut - feedIn) / feedIn * 100.0, 3);
    
    MaterialBalance balance;
    balance.feedIn = feedIn;
    balance.gasOut = gasOut;
    balance.gasolineOut = gasolineOut;
    balance.lightGasoilOut = lightGasoilOut;
    balance.heavyGasoilOut = heavyGasoilOut;
    balance.cokeOut = cokeOut;
    balance.lossesOut = lossesOut;
    balance.totalOut = totalOut;
    balance.closureError = closureError;
    
    return balance;
}

std::vector<TimeSeriesPoint> SimulationEngine::calcTimeSeries(const SimulationInput& input) {
    std::vector<TimeSeriesPoint> points;
    double fillTime = input.reactor.fillTime;
    int steps = 50;
    
    for (int i = 0; i <= steps; ++i) {
        double t = (fillTime * i) / steps;
        double fraction = t / fillTime;
        
        // Температура растёт и стабилизируется
        double temp = input.reactor.bottomTemp - 20.0 * std::exp(-3.0 * fraction) + 
                      5.0 * std::sin(fraction * M_PI);
        
        // Давление немного растёт с заполнением
        double pressure = input.reactor.topPressure + 0.05 * fraction + 
                         0.02 * std::sin(fraction * 2.0 * M_PI);
        
        // Уровень кокса растёт
        double cokeLevel = 85.0 * (1.0 - std::exp(-2.5 * fraction));
        
        // Степень конверсии
        double conversionRate = 95.0 * (1.0 - std::exp(-3.0 * fraction));
        
        TimeSeriesPoint point;
        point.time = roundTo(t, 2);
        point.temperature = roundTo(temp, 1);
        point.pressure = roundTo(pressure, 3);
        point.cokeLevel = roundTo(cokeLevel, 1);
        point.conversionRate = roundTo(conversionRate, 1);
        
        points.push_back(point);
    }
    
    return points;
}

std::vector<ReactorProfilePoint> SimulationEngine::calcReactorProfile(const SimulationInput& input) {
    std::vector<ReactorProfilePoint> profile;
    double H = input.reactor.chamberHeight;
    int steps = 30;
    
    for (int i = 0; i <= steps; ++i) {
        double h = (H * i) / steps;
        double fraction = h / H;
        
        // Температура убывает снизу вверх
        double temp = input.reactor.bottomTemp - 
                     (input.reactor.bottomTemp - input.reactor.topTemp) * std::pow(fraction, 0.7);
        
        // Плотность паров увеличивается (условно — масса/объём зоны)
        double density = input.feedstock.density * (1.0 - 0.7 * fraction) * 
                        (1.0 - 0.3 * std::pow(fraction, 2.0));
        
        ReactorProfilePoint point;
        point.height = roundTo(h, 1);
        point.temp = roundTo(temp, 1);
        point.density = roundTo(density, 0);
        
        profile.push_back(point);
    }
    
    return profile;
}

SimulationResult SimulationEngine::runSimulation(const SimulationInput& input) {
    SimulationResult result;
    result.status = "success";
    
    // Валидация
    if (input.furnace.outletTemp > 510.0) {
        result.warnings.push_back("⚠ Температура на выходе печи > 510°C: высокий риск закоксовывания змеевика!");
    }
    if (input.furnace.outletTemp < 470.0) {
        result.warnings.push_back("⚠ Температура на выходе печи < 470°C: недостаточная глубина крекинга.");
    }
    if (input.reactor.topPressure > 0.4) {
        result.warnings.push_back("⚠ Давление верха камеры > 0.4 МПа: увеличен выход кокса.");
    }
    if (input.feedstock.cokability > 25.0) {
        result.warnings.push_back("⚠ Коксуемость сырья > 25%: возможно образование «shot coke».");
    }
    if (input.feedstock.sulfurContent > 4.0) {
        result.warnings.push_back("⚠ Высокое содержание серы > 4%: кокс будет высокосернистым.");
    }
    if (input.reactor.fillTime < 18.0) {
        result.warnings.push_back("⚠ Время заполнения камеры < 18 ч: короткий цикл может ухудшить качество кокса.");
    }
    
    // Расчёт выходов продуктов
    double cokeYield = calcCokeYield(
        input.feedstock.cokability,
        input.furnace.outletTemp,
        input.reactor.topPressure
    );
    double gasYield = calcGasYield(
        input.furnace.outletTemp,
        input.feedstock.cokability,
        input.furnace.residenceTime
    );
    double gasolineYield = calcGasolineYield(
        input.furnace.outletTemp,
        input.feedstock.cokability
    );
    
    double remaining = 100.0 - cokeYield - gasYield - gasolineYield;
    double lightGasoilYield = remaining * 0.55;
    double heavyGasoilYield = remaining * 0.40;
    double lossesYield = remaining * 0.05;
    
    result.yields.gas = roundTo(gasYield, 1);
    result.yields.gasoline = roundTo(gasolineYield, 1);
    result.yields.lightGasoil = roundTo(lightGasoilYield, 1);
    result.yields.heavyGasoil = roundTo(heavyGasoilYield, 1);
    result.yields.coke = roundTo(cokeYield, 1);
    result.yields.losses = roundTo(lossesYield, 1);
    
    // Корректировка для закрытия баланса
    double total = result.yields.gas + result.yields.gasoline + result.yields.lightGasoil + 
                  result.yields.heavyGasoil + result.yields.coke + result.yields.losses;
    if (std::abs(total - 100.0) > 0.1) {
        result.yields.losses = roundTo(100.0 - result.yields.gas - result.yields.gasoline - 
                                       result.yields.lightGasoil - result.yields.heavyGasoil - 
                                       result.yields.coke, 1);
    }
    
    result.properties = calcProductProperties(input, result.yields);
    result.heatBalance = calcHeatBalance(input, result.yields);
    result.materialBalance = calcMaterialBalance(input, result.yields);
    result.timeSeries = calcTimeSeries(input);
    result.reactorProfile = calcReactorProfile(input);
    
    if (result.warnings.size() > 2) {
        result.status = "warning";
    }
    
    return result;
}

SimulationInput SimulationEngine::getDefaultParams() {
    SimulationInput input;
    
    input.feedstock.feedRate = 120.0;
    input.feedstock.density = 1010.0;
    input.feedstock.sulfurContent = 2.5;
    input.feedstock.asphalteneContent = 8.0;
    input.feedstock.cokability = 18.0;
    input.feedstock.viscosity = 350.0;
    input.feedstock.ccr = 16.0;
    
    input.furnace.inletTemp = 350.0;
    input.furnace.outletTemp = 500.0;
    input.furnace.pressure = 0.6;
    input.furnace.coilType = "double";
    input.furnace.heatDuty = 35.0;
    input.furnace.residenceTime = 25.0;
    
    input.reactor.numberOfChambers = 4;
    input.reactor.chamberDiameter = 7.0;
    input.reactor.chamberHeight = 27.0;
    input.reactor.topPressure = 0.18;
    input.reactor.bottomTemp = 495.0;
    input.reactor.topTemp = 430.0;
    input.reactor.fillTime = 24.0;
    input.reactor.cycleTime = 48.0;
    
    input.fractionation.numberOfTrays = 30;
    input.fractionation.topTemp = 120.0;
    input.fractionation.bottomTemp = 390.0;
    input.fractionation.pressure = 0.15;
    input.fractionation.refluxRatio = 2.5;
    
    return input;
}
