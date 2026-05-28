import React from 'react';
import { EconomicsResult } from '../data/simulationEngine';

interface Props {
    economics: EconomicsResult | null;
    feedRate_tph: number;
}

const EconomicsPanel: React.FC<Props> = ({ economics, feedRate_tph }) => {
    if (!economics) {
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
                <h3 className="text-lg font-bold text-emerald-400 mb-2">💰 Экономические показатели</h3>
                <p className="text-xs text-slate-500 mb-4">Расчёт при загрузке {feedRate_tph.toFixed(0)} т/ч, 8400 ч/год</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Затраты */}
                    <div className="bg-slate-900/60 rounded-lg p-3">
                        <div className="text-sm font-semibold text-slate-300 mb-2">📉 Затраты (руб/ч)</div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Сырьё:</span><span>{economics.feedstockCost_rub_h.toFixed(0)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Энергия (топливо+эл.+пар):</span><span>{economics.energyCost_rub_h.toFixed(0)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Вода, воздух:</span><span>{economics.utilitiesCost_rub_h.toFixed(0)}</span></div>
                            <div className="flex justify-between font-bold border-t border-slate-700 pt-1 mt-1"><span>Итого затрат:</span><span>{economics.totalCost_rub_h.toFixed(0)}</span></div>
                        </div>
                    </div>

                    {/* Выручка */}
                    <div className="bg-slate-900/60 rounded-lg p-3">
                        <div className="text-sm font-semibold text-slate-300 mb-2">📈 Выручка от продуктов (руб/ч)</div>
                        <div className="space-y-1 text-sm">
                            {Object.entries(economics.productsValue).map(([key, val]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                                    <span>{val.toFixed(0)}</span>
                                </div>
                            ))}
                            <div className="flex justify-between font-bold border-t border-slate-700 pt-1 mt-1"><span>Итого выручка:</span><span>{economics.revenue_rub_h.toFixed(0)}</span></div>
                        </div>
                    </div>
                </div>

                {/* Прибыль */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">Прибыль, руб/ч</div>
                        <div className={`text-xl font-bold ${economics.profit_rub_h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {economics.profit_rub_h.toFixed(0)}
                        </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">на тонну сырья</div>
                        <div className={`text-lg font-bold ${economics.profit_rub_tonFeed >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {economics.profit_rub_tonFeed.toFixed(0)} руб/т
                        </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">Рентабельность</div>
                        <div className={`text-xl font-bold ${economics.profitMargin_percent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {economics.profitMargin_percent.toFixed(1)}%
                        </div>
                    </div>
                    <div className="bg-slate-900/60 rounded-lg p-3 text-center">
                        <div className="text-xs text-slate-400">Годовая прибыль</div>
                        <div className="text-lg font-bold text-emerald-400">
                            {(economics.annualProfit_rub / 1e6).toFixed(0)} млн руб
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EconomicsPanel;