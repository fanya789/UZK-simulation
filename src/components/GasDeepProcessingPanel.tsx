import React, { useState } from 'react';
import { calculateDeepGasProcessing, DeepGasProcessingResult } from '../data/simulationEngine';

interface Props {
    fatGasFlow_kg_h?: number;
    fatGasComposition?: {
        H2: number; CH4: number; C2H6: number; C2H4: number;
        C3H8: number; C3H6: number; C4: number; H2S: number;
    };
}

const GasDeepProcessingPanel: React.FC<Props> = ({
                                                     fatGasFlow_kg_h = 5000,
                                                     fatGasComposition = {
                                                         H2: 8.5, CH4: 32, C2H6: 18.5, C2H4: 7,
                                                         C3H8: 12, C3H6: 8.5, C4: 10.5, H2S: 3,
                                                     }
                                                 }) => {
    const [result, setResult] = useState<DeepGasProcessingResult | null>(null);

    const handleCalculate = () => {
        const res = calculateDeepGasProcessing(fatGasFlow_kg_h, fatGasComposition);
        setResult(res);
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-indigo-400 mb-4">⚙️ Глубокая переработка газа</h3>
                <p className="text-sm text-slate-400 mb-3">Абсорбция С3/С4 → хемосорбция H₂S → адсорбционная осушка → низкотемпературная деэтанизация → ректификация С3/С4</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-900/60 p-3 rounded">
                        <div className="text-xs text-slate-400">Расход жирного газа</div>
                        <div className="text-xl font-bold">{fatGasFlow_kg_h.toFixed(0)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded">
                        <div className="text-xs text-slate-400">Содержание H₂S в газе</div>
                        <div className="text-xl font-bold">{fatGasComposition.H2S} % масс.</div>
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-2 rounded-xl font-bold transition-all"
                >
                    Запустить глубокую переработку
                </button>

                {result && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <ProductCard label="Сухой газ (топливо)" value={result.dryGas_kg_h} unit="кг/ч" color="bg-blue-900/40 border-blue-600" />
                            <ProductCard label="Этан-этиленовая фракция" value={result.ethaneEthylene_kg_h} unit="кг/ч" color="bg-cyan-900/40 border-cyan-600" />
                            <ProductCard label="Пропан-пропиленовая фракция" value={result.propanePropylene_kg_h} unit="кг/ч" color="bg-green-900/40 border-green-600" />
                            <ProductCard label="Бутан-бутиленовая фракция" value={result.butaneButylene_kg_h} unit="кг/ч" color="bg-yellow-900/40 border-yellow-600" />
                        </div>
                        <div className="bg-slate-900/60 p-3 rounded text-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>Полусухой газ (после абсорбции): <span className="text-indigo-300">{result.semiDryGas_kg_h.toFixed(0)} кг/ч</span></div>
                                <div>Удалено H₂S: <span className="text-green-400">{result.h2sRemoved_kg_h.toFixed(1)} кг/ч</span></div>
                                <div>Удалено воды: <span className="text-cyan-400">{result.waterRemoved_kg_h.toFixed(1)} кг/ч</span></div>
                                <div>Энергопотребление: <span className="text-orange-400">{result.powerConsumption_kW.toFixed(0)} кВт</span></div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2 mt-2">
                            ℹ️ Давление в колонне деэтанизации ≥4,0 МПа, температура верха ≈ -46°С. Адсорбент – цеолит NaA, регенерация при 190–320°С.
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

export default GasDeepProcessingPanel;