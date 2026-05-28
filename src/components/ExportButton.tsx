import React from 'react';
import type { SimulationResults, ProcessParameters } from '../data/simulationEngine';

interface Props {
    results: SimulationResults | null;
    params: ProcessParameters;
    feedstockName: string;
}

const ExportButton: React.FC<Props> = ({ results, params, feedstockName }) => {
    const handleExport = () => {
        if (!results) {
            alert('Нет результатов для экспорта. Выполните моделирование.');
            return;
        }

        const { yields, massBalance, heatBalance, keyIndicators, fractions } = results;

        // Формируем CSV строки
        const rows: string[][] = [];

        // Заголовок
        rows.push(['Экспорт результатов моделирования УЗК']);
        rows.push(['Дата', new Date().toLocaleString()]);
        rows.push(['Сырьё', feedstockName]);
        rows.push([]);

        // Параметры процесса
        rows.push(['Параметры процесса']);
        rows.push(['Температура печи, °C', params.furnaceOutletTemp]);
        rows.push(['Давление в камере, МПа', params.chamberPressure]);
        rows.push(['Расход сырья, т/ч', params.feedRate]);
        rows.push(['Расход пара, %', params.steamRate]);
        rows.push(['Рециркуляция, доли', params.recycleRatio]);
        rows.push(['Температура верха К-1, °C', params.columnTopTemp]);
        rows.push(['Температура низа К-1, °C', params.columnBottomTemp]);
        rows.push(['Время коксования, ч', params.cokingTime]);
        rows.push([]);

        // Выходы продуктов
        rows.push(['Выходы продуктов, % масс.']);
        rows.push(['Газ', yields.gas]);
        rows.push(['Головка стабилизации', yields.headStabilization]);
        rows.push(['Бензин', yields.gasoline]);
        rows.push(['Лёгкий газойль', yields.lightGasOil]);
        rows.push(['Тяжёлый газойль', yields.heavyGasOil]);
        rows.push(['Кокс', yields.coke]);
        rows.push(['Потери', yields.losses]);
        rows.push([]);

        // Материальный баланс, т/ч
        rows.push(['Материальный баланс, т/ч']);
        rows.push(['Приход: сырьё', massBalance.feedIn]);
        rows.push(['Приход: пар', massBalance.steamIn]);
        rows.push(['Приход: итого', massBalance.totalIn]);
        rows.push(['Расход: газ', massBalance.gasOut]);
        rows.push(['Расход: бензин', massBalance.gasolineOut]);
        rows.push(['Расход: лёгкий газойль', massBalance.lightGasOilOut]);
        rows.push(['Расход: тяжёлый газойль', massBalance.heavyGasOilOut]);
        rows.push(['Расход: кокс', massBalance.cokeOut]);
        rows.push(['Расход: потери+пар', massBalance.lossesOut]);
        rows.push(['Расход: итого', massBalance.totalOut]);
        rows.push([]);

        // Тепловой баланс, МВт
        rows.push(['Тепловой баланс, МВт']);
        rows.push(['Приход: тепло сырья', heatBalance.heatInput]);
        rows.push(['Приход: тепло печи', heatBalance.heatFurnace]);
        rows.push(['Приход: тепло пара', heatBalance.heatSteam]);
        rows.push(['Приход: итого', heatBalance.totalHeatIn]);
        rows.push(['Расход: продукты', heatBalance.heatProducts]);
        rows.push(['Расход: реакция', heatBalance.heatReaction]);
        rows.push(['Расход: потери', heatBalance.heatLosses]);
        rows.push(['Расход: итого', heatBalance.totalHeatOut]);
        rows.push([]);

        // Ключевые показатели
        rows.push(['Ключевые показатели']);
        rows.push(['Глубина конверсии, %', keyIndicators.conversionDepth]);
        rows.push(['Выход светлых, %', keyIndicators.lightProductsYield]);
        rows.push(['Выход кокса, %', keyIndicators.cokeYield]);
        rows.push(['Жёсткость крекинга', keyIndicators.thermalCrackingSeverity]);
        rows.push(['Уд. расход энергии, кДж/кг', keyIndicators.specificEnergyConsumption]);
        rows.push([]);

        // Фракционный состав (кратко)
        rows.push(['Фракционный состав (избранное)']);
        rows.push(['Газ: H₂, %', fractions.gas.hydrogen]);
        rows.push(['Газ: CH₄, %', fractions.gas.methane]);
        rows.push(['Бензин: октан (ИМ)', fractions.gasoline.octaneRON]);
        rows.push(['Бензин: плотность, г/см³', fractions.gasoline.density]);
        rows.push(['Лёгкий газойль: цетановое число', fractions.lightGasOil.cetaneNumber]);
        rows.push(['Тяжёлый газойль: коксуемость, %', fractions.heavyGasOil.cokability]);
        rows.push(['Кокс: летучие, %', fractions.coke.volatiles]);
        rows.push(['Кокс: сера, %', fractions.coke.sulfur]);

        // Преобразуем в CSV
        const csvContent = rows.map(row => row.join(';')).join('\n');
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `UZK_results_${new Date().toISOString().slice(0,19)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <button
            onClick={handleExport}
            className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            title="Экспортировать результаты в CSV"
        >
            📎 Экспорт CSV
        </button>
    );
};

export default ExportButton;