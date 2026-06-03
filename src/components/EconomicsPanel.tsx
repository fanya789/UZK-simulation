import React, { useState } from 'react';
import type { SimulationResults } from '../data/simulationEngine';
import type { FeedstockProperties } from '../data/feedstockData';

interface Props {
    feedRate_tph: number;
    results: SimulationResults;
    selectedFeedstock: FeedstockProperties;
    courseRubToUsd?: number;
}

// Сопоставление названий сырья с ценой в USD за тонну (среднее из таблицы)
const feedstockPriceMap: Record<string, number> = {
    'Гудрон (Западно-Сибирская нефть)': 245,
    'Гудрон (Татарская нефть, сернистая)': 231,
    'Мазут М-100': 239,
    'Крекинг-остаток': 216,
    'Тяжёлая смола пиролиза': 189,
    'Гудрон (малосернистая нефть)': 255,
};

const EconomicsPanel: React.FC<Props> = ({
                                             feedRate_tph,
                                             results,
                                             selectedFeedstock,
                                             courseRubToUsd: propCourseRubToUsd = 80,
                                         }) => {
    const [localCourse, setLocalCourse] = useState(propCourseRubToUsd);
    const [editMode, setEditMode] = useState(false);
    const [tempCourse, setTempCourse] = useState(localCourse.toString());

    const HOURS_PER_YEAR = 8760;
    const HOURS_PER_MONTH = 720;

    // Цена сырья в USD (из маппинга)
    const feedstockPrice = feedstockPriceMap[selectedFeedstock.name] || 300;

    // Цены продуктов (USD за тонну) – обновлены по заданию
    const productPrices: Record<string, number> = {
        gas: 150,
        headStabilization: 500,      // головка стабилизации
        gasoline: 312.5,              // бензин
        lightGasOil: 375,             // лёгкий газойль
        heavyGasOil: 350,             // тяжёлый газойль
        coke: 400,                    // кокс
        losses: 0,
    };

    // Русские названия продуктов
    const productNames: Record<string, string> = {
        gas: 'Газ',
        headStabilization: 'Головка стабилизации',
        gasoline: 'Бензин',
        lightGasOil: 'Лёгкий газойль',
        heavyGasOil: 'Тяжёлый газойль',
        coke: 'Кокс',
        losses: 'Потери',
    };

    const { yields } = results;

    // Выручка
    const monthlyRevenueUSD = Object.entries(yields).reduce((sum, [product, yieldPercent]) => {
        const flow_tph = feedRate_tph * (yieldPercent / 100);
        const price = productPrices[product] || 0;
        const monthlyFlow = flow_tph * HOURS_PER_MONTH;
        return sum + monthlyFlow * price;
    }, 0);
    const annualRevenueUSD = monthlyRevenueUSD * (HOURS_PER_YEAR / HOURS_PER_MONTH);

    // Затраты
    const feedstockCostUSD = feedRate_tph * HOURS_PER_MONTH * feedstockPrice;
    const annualFeedstockCostUSD = feedstockCostUSD * (HOURS_PER_YEAR / HOURS_PER_MONTH);

    const fuelGas_tph = feedRate_tph * 0.03;
    const fuelPriceUSD = 50;
    const monthlyFuelCost = fuelGas_tph * HOURS_PER_MONTH * fuelPriceUSD;

    const electricity_kW = 2500;
    const electricityPrice = 0.08;
    const monthlyElectricity = electricity_kW * HOURS_PER_MONTH * electricityPrice;

    const steam_tph = feedRate_tph * 0.05;
    const steamPrice = 20;
    const monthlySteamCost = steam_tph * HOURS_PER_MONTH * steamPrice;

    const water_m3h = feedRate_tph * 0.2;
    const waterPrice = 0.05;
    const monthlyWaterCost = water_m3h * HOURS_PER_MONTH * waterPrice;

    const monthlyEnergyCostUSD = monthlyFuelCost + monthlyElectricity + monthlySteamCost + monthlyWaterCost;
    const annualEnergyCostUSD = monthlyEnergyCostUSD * (HOURS_PER_YEAR / HOURS_PER_MONTH);

    const monthlyOtherCost = feedstockCostUSD * 0.05;
    const annualOtherCost = annualFeedstockCostUSD * 0.05;

    const monthlyTotalCostUSD = feedstockCostUSD + monthlyEnergyCostUSD + monthlyOtherCost;
    const annualTotalCostUSD = annualFeedstockCostUSD + annualEnergyCostUSD + annualOtherCost;

    const monthlyProfitUSD = monthlyRevenueUSD - monthlyTotalCostUSD;
    const annualProfitUSD = annualRevenueUSD - annualTotalCostUSD;

    const monthlyMargin = monthlyRevenueUSD ? (monthlyProfitUSD / monthlyRevenueUSD) * 100 : 0;
    const annualMargin = annualRevenueUSD ? (annualProfitUSD / annualRevenueUSD) * 100 : 0;

    const monthlyRevenueRUB = monthlyRevenueUSD * localCourse;
    const annualRevenueRUB = annualRevenueUSD * localCourse;
    const monthlyProfitRUB = monthlyProfitUSD * localCourse;
    const annualProfitRUB = annualProfitUSD * localCourse;

    const handleCourseSave = () => {
        const newCourse = parseFloat(tempCourse);
        if (!isNaN(newCourse) && newCourse > 0) {
            setLocalCourse(newCourse);
        }
        setEditMode(false);
    };

    if (!results) {
        return (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 text-center py-12">
                <div className="text-4xl mb-3">💰</div>
                <p className="text-slate-400">Экономический расчёт будет доступен после запуска моделирования.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                    <h3 className="text-lg font-bold text-emerald-400">💰 Экономические показатели</h3>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400">Курс USD → RUB:</span>
                        {editMode ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={tempCourse}
                                    onChange={(e) => setTempCourse(e.target.value)}
                                    className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-right"
                                    step="1"
                                />
                                <button onClick={handleCourseSave} className="bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded text-white">✓</button>
                                <button onClick={() => setEditMode(false)} className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded">✗</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setEditMode(true)}
                                className="bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded inline-flex items-center gap-1"
                            >
                                {localCourse} ₽ <span className="text-xs">✎</span>
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-xs text-slate-500 mb-4">
                    Расчёт при загрузке {feedRate_tph.toFixed(0)} т/ч, {HOURS_PER_YEAR} ч/год, цикл 48 ч (4 камеры).
                    Сырьё: {selectedFeedstock.name}, цена: {feedstockPrice} $/т. Курс: {localCourse} ₽/$.
                </p>

                {/* Таблица продуктов */}
                <div className="overflow-x-auto mb-6">
                    <table className="w-full text-sm">
                        <thead>
                        <tr className="text-slate-400 border-b border-slate-700">
                            <th className="text-left py-2">Продукт</th>
                            <th className="text-right">Выход, %</th>
                            <th className="text-right">т/ч</th>
                            <th className="text-right">Цена, $/т</th>
                            <th className="text-right">Выручка, $/мес</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.entries(yields).map(([product, yieldPercent]) => {
                            const flow_tph = feedRate_tph * (yieldPercent / 100);
                            const price = productPrices[product] || 0;
                            const monthlyFlow = flow_tph * HOURS_PER_MONTH;
                            const revenue = monthlyFlow * price;
                            const productName = productNames[product] || product;
                            return (
                                <tr key={product} className="border-b border-slate-800">
                                    <td className="py-1">{productName}</td>
                                    <td className="text-right">{yieldPercent.toFixed(1)}%</td>
                                    <td className="text-right">{flow_tph.toFixed(2)}</td>
                                    <td className="text-right">{price}</td>
                                    <td className="text-right">{revenue.toFixed(0)}</td>
                                </tr>
                            );
                        })}
                        <tr className="font-bold text-slate-200 border-t border-slate-700">
                            <td colSpan={4} className="text-right py-2">Итого выручка, $/мес:</td>
                            <td className="text-right">{monthlyRevenueUSD.toFixed(0)}</td>
                        </tr>
                        <tr className="text-slate-400">
                            <td colSpan={4} className="text-right py-1 text-xs">Итого выручка, ₽/мес:</td>
                            <td className="text-right text-xs">{monthlyRevenueRUB.toFixed(0)} ₽</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* Затраты и прибыль - улучшенный дизайн */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Карточка затрат */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                <span className="text-red-400 text-lg">📉</span>
                            </div>
                            <h4 className="text-base font-semibold text-red-300">Затраты</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-400">Сырьё ({selectedFeedstock.name}):</span>
                                <span className="font-mono text-slate-200">${feedstockCostUSD.toFixed(0)} <span className="text-xs text-slate-500">/мес</span></span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-400">Энергоресурсы:</span>
                                <span className="font-mono text-slate-200">${monthlyEnergyCostUSD.toFixed(0)} <span className="text-xs text-slate-500">/мес</span></span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-400">Прочие (реагенты, ремонт):</span>
                                <span className="font-mono text-slate-200">${monthlyOtherCost.toFixed(0)} <span className="text-xs text-slate-500">/мес</span></span>
                            </div>
                            <div className="flex justify-between items-center py-2 mt-2 bg-slate-900/60 rounded-lg px-2">
                                <span className="font-semibold text-slate-300">Итого в месяц:</span>
                                <span className="font-bold font-mono text-red-400">${monthlyTotalCostUSD.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs text-slate-500">Годовые затраты:</span>
                                <span className="text-xs font-mono text-slate-400">${annualTotalCostUSD.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Карточка прибыли */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800/80 rounded-xl p-4 border border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <span className="text-green-400 text-lg">💰</span>
                            </div>
                            <h4 className="text-base font-semibold text-green-300">Прибыль</h4>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-400">Выручка в месяц:</span>
                                <span className="font-mono text-slate-200">${monthlyRevenueUSD.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 border-b border-slate-800">
                                <span className="text-slate-400">Затраты в месяц:</span>
                                <span className="font-mono text-slate-200">${monthlyTotalCostUSD.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 mt-2 bg-slate-900/60 rounded-lg px-2">
                                <span className="font-semibold text-slate-300">Чистая прибыль, $/мес:</span>
                                <span className={`font-bold font-mono ${monthlyProfitUSD >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${monthlyProfitUSD.toFixed(0)}
                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Чистая прибыль, ₽/мес:</span>
                                <span className="font-mono text-green-400/80">{monthlyProfitRUB.toFixed(0)} ₽</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs text-slate-500">Годовая прибыль:</span>
                                <span className="text-xs font-mono text-green-400/70">${annualProfitUSD.toFixed(0)} / {annualProfitRUB.toFixed(0)} ₽</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700 mt-1">
                                <span className="text-slate-400">Рентабельность:</span>
                                <span className={`font-bold ${monthlyMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {monthlyMargin.toFixed(1)}% (мес) / {annualMargin.toFixed(1)}% (год)
                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Примечания */}
                <div className="mt-5 text-xs text-slate-500 border-t border-slate-700 pt-3">
                    <p className="mb-1">⚙️ Примечания:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                        <li>Цены продуктов: газ – 150 $/т, головка стабилизации – 500 $/т, бензин – 312.5 $/т, лёгкий газойль – 375 $/т, тяжёлый – 350 $/т, кокс – 400 $/т.</li>
                        <li>Данные ориентировочные и могут меняться в зависимости от ситуации на бирже</li>
                        <li>Расход топливного газа – 3% от сырья, электроэнергия – 2500 кВт, пар – 5%, вода – 20% от расхода сырья.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default EconomicsPanel;