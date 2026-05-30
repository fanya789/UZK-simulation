#include "feedstock_database.hpp"
#include "simulation_engine.hpp"
#include <iostream>
#include <iomanip>

void printResults(const SimulationResult& result) {
    std::cout << "\n========== РЕЗУЛЬТАТЫ МОДЕЛИРОВАНИЯ УЗК ==========" << std::endl;
    std::cout << "\n📊 ВЫХОДЫ ПРОДУКТОВ (% масс.):" << std::endl;
    std::cout << "  Газ: " << std::fixed << std::setprecision(1) << result.yields.gas << "%" << std::endl;
    std::cout << "  Бензин: " << result.yields.gasoline << "%" << std::endl;
    std::cout << "  Лёгкий газойль: " << result.yields.lightGasoil << "%" << std::endl;
    std::cout << "  Тяжёлый газойль: " << result.yields.heavyGasoil << "%" << std::endl;
    std::cout << "  Кокс: " << result.yields.coke << "%" << std::endl;
    std::cout << "  Потери: " << result.yields.losses << "%" << std::endl;
    
    std::cout << "\n🔥 ТЕПЛОВОЙ БАЛАНС (МВт):" << std::endl;
    std::cout << "  Подвод тепла: " << std::setprecision(2) << result.heatBalance.heatInput << std::endl;
    std::cout << "  Тепло реакции: " << result.heatBalance.heatReaction << std::endl;
    std::cout << "  Тепло с продуктами: " << result.heatBalance.heatProducts << std::endl;
    std::cout << "  Потери тепла: " << result.heatBalance.heatLosses << std::endl;
    std::cout << "  КПД: " << std::setprecision(1) << result.heatBalance.efficiency << "%" << std::endl;
    
    std::cout << "\n⚖️  МАТЕРИАЛЬНЫЙ БАЛАНС (т/ч):" << std::endl;
    std::cout << "  На входе: " << std::setprecision(3) << result.materialBalance.feedIn << std::endl;
    std::cout << "  Газ: " << result.materialBalance.gasOut << std::endl;
    std::cout << "  Бензин: " << result.materialBalance.gasolineOut << std::endl;
    std::cout << "  Лёгкий газойль: " << result.materialBalance.lightGasoilOut << std::endl;
    std::cout << "  Тяжёлый газойль: " << result.materialBalance.heavyGasoilOut << std::endl;
    std::cout << "  Кокс: " << result.materialBalance.cokeOut << std::endl;
    std::cout << "  Потери: " << result.materialBalance.lossesOut << std::endl;
    std::cout << "  Всего выход: " << result.materialBalance.totalOut << std::endl;
    std::cout << "  Невязка баланса: " << std::setprecision(3) << result.materialBalance.closureError << "%" << std::endl;
    
    if (!result.warnings.empty()) {
        std::cout << "\n⚠️  ПРЕДУПРЕЖДЕНИЯ:" << std::endl;
        for (const auto& warning : result.warnings) {
            std::cout << "  " << warning << std::endl;
        }
    }
    
    std::cout << "\n" << std::string(50, '=') << std::endl;
}

int main() {
    std::cout << "🏭 УЗК SIMULATOR - Моделирование установки замедленного коксования" << std::endl;
    std::cout << "=================================================================\n" << std::endl;
    
    // Получить параметры по умолчанию
    SimulationInput input = SimulationEngine::getDefaultParams();
    
    // Получить сырьё по умолчанию
    FeedstockProperties feedstock = FeedstockDatabase::getDefaultFeedstock();
    
    // Обновить параметры сырья в моделировании
    input.feedstock.density = feedstock.density;
    input.feedstock.cokability = feedstock.cokability;
    input.feedstock.sulfurContent = feedstock.sulfur;
    
    std::cout << "📋 Входные параметры:" << std::endl;
    std::cout << "  Сырьё: " << feedstock.name << std::endl;
    std::cout << "  Плотность: " << feedstock.density << " кг/м³" << std::endl;
    std::cout << "  Коксуемость: " << feedstock.cokability << "%" << std::endl;
    std::cout << "  Расход: " << input.feedstock.feedRate << " т/ч" << std::endl;
    std::cout << "  Температура печи (вход/выход): " << input.furnace.inletTemp << "/" 
              << input.furnace.outletTemp << "°C" << std::endl;
    std::cout << "  Температура реактора (низ/верх): " << input.reactor.bottomTemp << "/" 
              << input.reactor.topTemp << "°C" << std::endl;
    std::cout << "\n🔄 Запуск моделирования...\n" << std::endl;
    
    // Запустить моделирование
    SimulationResult result = SimulationEngine::runSimulation(input);
    
    // Вывести результаты
    printResults(result);
    
    // Дополнительно: вывести первые 10 точек временного ряда
    if (!result.timeSeries.empty()) {
        std::cout << "\n📈 Временной профиль (первые 10 точек):" << std::endl;
        std::cout << "Время(ч)\tТемп(°C)\tДав(МПа)\tКокс(%)\tКонверс(%)" << std::endl;
        for (size_t i = 0; i < std::min(size_t(10), result.timeSeries.size()); ++i) {
            const auto& pt = result.timeSeries[i];
            std::cout << pt.time << "\t" << pt.temperature << "\t" 
                      << pt.pressure << "\t" << pt.cokeLevel << "\t" 
                      << pt.conversionRate << std::endl;
        }
    }
    
    std::cout << "\n✅ Моделирование завершено успешно!" << std::endl;
    
    return 0;
}
