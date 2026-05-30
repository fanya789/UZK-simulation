#pragma once

#include "types.hpp"
#include <cmath>
#include <algorithm>
#include <iomanip>
#include <sstream>

// ========== Движок моделирования процесса УЗК ==========

class SimulationEngine {
public:
    /**
     * Главная функция моделирования
     */
    static SimulationResult runSimulation(const SimulationInput& input);
    
    /**
     * Получить параметры по умолчанию
     */
    static SimulationInput getDefaultParams();

private:
    /**
     * Корреляция для расчёта выхода кокса
     * Основана на коксуемости сырья и температуре коксования
     */
    static double calcCokeYield(double cokability, double temp, double pressure);
    
    /**
     * Корреляция для расчёта выхода газа
     */
    static double calcGasYield(double temp, double cokability, double residenceTime);
    
    /**
     * Корреляция для расчёта выхода бензина
     */
    static double calcGasolineYield(double temp, double cokability);
    
    /**
     * Расчёт свойств продуктов
     */
    static ProductProperties calcProductProperties(const SimulationInput& input, const ProductYields& yields);
    
    /**
     * Расчёт теплового баланса
     */
    static HeatBalance calcHeatBalance(const SimulationInput& input, const ProductYields& yields);
    
    /**
     * Расчёт материального баланса
     */
    static MaterialBalance calcMaterialBalance(const SimulationInput& input, const ProductYields& yields);
    
    /**
     * Генерация временных профилей процесса в камере коксования
     */
    static std::vector<TimeSeriesPoint> calcTimeSeries(const SimulationInput& input);
    
    /**
     * Генерация профиля по высоте реактора
     */
    static std::vector<ReactorProfilePoint> calcReactorProfile(const SimulationInput& input);
    
    /**
     * Вспомогательная функция для округления до N знаков
     */
    static double roundTo(double value, int decimals);
};
