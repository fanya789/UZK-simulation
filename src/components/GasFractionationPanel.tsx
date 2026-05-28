import React, { useState } from 'react';
import { calculateGasFractionation, GasFractionationResult } from '../data/simulationEngine';

interface Props {
    fatGasFlow_kg_h?: number;      // можно передавать из результатов моделирования
    unstableGasoline_kg_h?: number;
}

const GasFractionationPanel: React.FC<Props> = ({ fatGasFlow_kg_h = 5000, unstableGasoline_kg_h = 8000 }) => {
    const [result, setResult] = useState<GasFractionationResult | null>(null);

    const handleCalculate = () => {
        const res = calculateGasFractionation(fatGasFlow_kg_h, unstableGasoline_kg_h, 0.35, 0.8);
        setResult(res);
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-purple-400 mb-4">🧪 Фракционирование газа</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/60 p-3 rounded">
                        <div className="text-xs text-slate-400">Расход жирного газа</div>
                        <div className="text-xl font-bold">{fatGasFlow_kg_h.toFixed(0)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded">
                        <div className="text-xs text-slate-400">Расход нестабильного бензина</div>
                        <div className="text-xl font-bold">{unstableGasoline_kg_h.toFixed(0)} кг/ч</div>
                    </div>
                </div>
                <button
                    onClick={handleCalculate}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 py-2 rounded-xl font-bold"
                >
                    Рассчитать фракционирование
                </button>

                {result && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <ProductCard label="Сухой газ (топливо)" value={result.dryGas_kg_h} unit="кг/ч" color="bg-blue-900/40 border-blue-600" />
                            <ProductCard label="Этан-этиленовая фракция" value={result.ethaneEthylene_kg_h} unit="кг/ч" color="bg-cyan-900/40 border-cyan-600" />
                            <ProductCard label="Пропан-пропиленовая фракция" value={result.propanePropylene_kg_h} unit="кг/ч" color="bg-green-900/40 border-green-600" />
                            <ProductCard label="Бутан-бутиленовая фракция" value={result.butaneButylene_kg_h} unit="кг/ч" color="bg-yellow-900/40 border-yellow-600" />
                            <ProductCard label="Газовый бензин" value={result.gasoline_kg_h} unit="кг/ч" color="bg-orange-900/40 border-orange-600" />
                            <ProductCard label="Стабильный бензин" value={result.stableGasoline_kg_h} unit="кг/ч" color="bg-red-900/40 border-red-600" />
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded text-sm">
                            <div className="text-slate-400">Удалено сероводорода: <span className="text-green-400">{result.h2sRemoved_kg_h.toFixed(1)} кг/ч</span></div>
                            <div className="text-slate-400 mt-2">Состав сухого газа: H₂ {result.dryGasComposition.H2.toFixed(1)}%, CH₄ {result.dryGasComposition.CH4.toFixed(1)}%</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard = ({ label, value, unit, color }: any) => (
    <div className={`p-3 rounded-xl border text-center ${color}`}>
        <div className="text-lg font-bold">{value.toFixed(0)}</div>
        <div className="text-xs text-slate-400">{label}</div>
        <div className="text-[10px] text-slate-500">{unit}</div>
    </div>
);

export default GasFractionationPanel;