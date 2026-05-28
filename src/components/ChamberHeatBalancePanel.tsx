import React, { useState, useEffect } from 'react';
import { calculateChamberHeatBalance, ChamberDimensions, ChamberHeatBalanceResult } from '../data/simulationEngine';
import type { SimulationResults, ProcessParameters } from '../data/simulationEngine';
import type { FeedstockProperties } from '../data/feedstockData';

interface Props {
    results: SimulationResults | null;
    params: ProcessParameters;
    feedstock: FeedstockProperties;
}

const ChamberHeatBalancePanel: React.FC<Props> = ({ results, params, feedstock }) => {
    const [dimensions, setDimensions] = useState<ChamberDimensions>({
        diameter_m: 6.0,
        height_cyl_m: 24.0,
        height_cone_m: 1.0,
        bottom_diameter_m: 1.8,
        top_diameter_m: 6.0,
    });
    const [balanceResult, setBalanceResult] = useState<ChamberHeatBalanceResult | null>(null);

    useEffect(() => {
        if (results) {
            const res = calculateChamberHeatBalance(feedstock, params, results, dimensions);
            setBalanceResult(res);
        }
    }, [results, params, feedstock, dimensions]);

    const updateDimension = (key: keyof ChamberDimensions, value: number) => {
        setDimensions(prev => ({ ...prev, [key]: value }));
    };

    if (!results) {
        return <div className="text-center py-10 text-slate-400">Нет результатов моделирования. Выполните расчёт на вкладке «Параметры».</div>;
    }

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-amber-400 mb-4">🏭 Тепловой баланс коксовой камеры</h3>
                <p className="text-sm text-slate-400 mb-3">
                    Итерационный расчёт температуры верха камеры на основе материального баланса.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                    <DimensionInput label="Диаметр камеры, м" value={dimensions.diameter_m} onChange={(v) => updateDimension('diameter_m', v)} min={4} max={9} step={0.1} />
                    <DimensionInput label="Высота цил. части, м" value={dimensions.height_cyl_m} onChange={(v) => updateDimension('height_cyl_m', v)} min={12} max={30} step={0.5} />
                    <DimensionInput label="Высота конич. части, м" value={dimensions.height_cone_m} onChange={(v) => updateDimension('height_cone_m', v)} min={0.8} max={1.5} step={0.1} />
                    <DimensionInput label="Диам. нижнего люка, м" value={dimensions.bottom_diameter_m} onChange={(v) => updateDimension('bottom_diameter_m', v)} min={1.2} max={2.5} step={0.1} />
                    <DimensionInput label="Диам. верхнего люка, м" value={dimensions.top_diameter_m} onChange={(v) => updateDimension('top_diameter_m', v)} min={4} max={9} step={0.1} />
                </div>

                {balanceResult && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded-lg p-3">
                            <div className="text-cyan-400 font-bold mb-2">Температурный режим</div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Температура входа (из печи -5°C):</span>
                                <span className="font-mono text-white">{balanceResult.T_inlet_C} °C</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Температура верха камеры (расчётная):</span>
                                <span className="font-mono text-white font-bold">{balanceResult.T_outlet_C.toFixed(1)} °C</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Число итераций:</span>
                                <span className="font-mono">{balanceResult.iterations}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Невязка теплового баланса:</span>
                                <span className={`font-mono ${Math.abs(balanceResult.imbalance_percent) < 1 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {balanceResult.imbalance_percent.toFixed(2)} %
                </span>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-lg p-3">
                            <div className="text-cyan-400 font-bold mb-2">Тепловые потоки (кВт)</div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Приход тепла (сырьё + пар):</span>
                                <span className="font-mono">{balanceResult.heatInput_kW.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Расход тепла (продукты + реакция + потери):</span>
                                <span className="font-mono">{balanceResult.heatOutput_kW.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Теплота реакции (эндотермическая):</span>
                                <span className="font-mono text-red-300">{balanceResult.reactionHeat_kW.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Потери через стенки:</span>
                                <span className="font-mono text-orange-300">{balanceResult.wallLoss_kW.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-sm mt-1">
                                <span className="text-slate-400">Тепло, аккумулированное коксом:</span>
                                <span className="font-mono">{balanceResult.cokeHeat_kW.toFixed(0)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="font-bold text-slate-300 mb-2">📖 Примечание</h3>
                <p className="text-xs text-slate-400">
                    Расчёт выполняется итерационно: задаётся температура верха, рассчитываются энтальпии отходящих газов, паров бензина и газойлей,
                    тепло аккумуляции кокса, тепловой эффект реакции и потери. Температура корректируется до сходимости баланса с точностью 0.5%.
                    Результат показывает ожидаемую температуру верха камеры, которая обычно на 20–80°C ниже температуры входа.
                </p>
            </div>
        </div>
    );
};

const DimensionInput = ({ label, value, onChange, min, max, step }: any) => (
    <div>
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200"
        />
    </div>
);

export default ChamberHeatBalancePanel;