import React, { useState, useEffect } from 'react';
import { calculateGasFractionation, calculateDeepGasProcessing } from '../data/simulationEngine';

interface Props {
    fatGasFlow_kg_h?: number;
    unstableGasoline_kg_h?: number;
}

const GasProcessingIntegrated: React.FC<Props> = ({
                                                      fatGasFlow_kg_h = 5000,
                                                      unstableGasoline_kg_h = 8000
                                                  }) => {
    // Используем пропсы напрямую, без внутреннего состояния
    const [fractionationResult, setFractionationResult] = useState<any>(null);
    const [deepProcessingResult, setDeepProcessingResult] = useState<any>(null);

    const defaultFatGasComposition = {
        H2: 8.5, CH4: 32, C2H6: 18.5, C2H4: 7,
        C3H8: 12, C3H6: 8.5, C4: 10.5, H2S: 3,
    };

    useEffect(() => {
        const fracRes = calculateGasFractionation(fatGasFlow_kg_h, unstableGasoline_kg_h, 0.35, 0.8);
        setFractionationResult(fracRes);

        const deepRes = calculateDeepGasProcessing(fatGasFlow_kg_h, defaultFatGasComposition, 0.85, 0.98, 0.99, 0.90);
        setDeepProcessingResult(deepRes);
    }, [fatGasFlow_kg_h, unstableGasoline_kg_h]);

    return (
        <div className="space-y-6">
            {/* Панель ввода параметров (только для информации, значения не редактируются) */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-md font-bold text-slate-300 mb-3">⚙️ Входные параметры</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Расход газа коксования, кг/ч</label>
                        <input
                            type="number"
                            value={fatGasFlow_kg_h}
                            disabled
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 opacity-70"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Расход нестабильного бензина, кг/ч</label>
                        <input
                            type="number"
                            value={unstableGasoline_kg_h}
                            disabled
                            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 opacity-70"
                        />
                    </div>
                </div>
            </div>

            {/* Газофракционирование (ГФУ) */}
            {fractionationResult && (
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-md font-bold text-purple-400 mb-3">🧪 Газофракционирование (ГФУ)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 text-slate-400 font-medium">Статья</th>
                                <th className="text-right py-2 text-slate-400 font-medium">Расход, кг/ч</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr className="border-b border-slate-800 bg-slate-900/30">
                                <td className="py-2 font-semibold text-cyan-300">Приход:</td>
                                <td className="text-right"></td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Жирный газ</td>
                                <td className="text-right text-slate-300">{fatGasFlow_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Нестабильный бензин</td>
                                <td className="text-right text-slate-300">{unstableGasoline_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-700">
                                <td className="py-2 font-semibold text-slate-300">Расход (продукты):</td>
                                <td className="text-right"></td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Сухой газ (топливо)</td>
                                <td className="text-right text-slate-300">{fractionationResult.dryGas_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Этан-этиленовая фракция</td>
                                <td className="text-right text-slate-300">{fractionationResult.ethaneEthylene_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Пропан-пропиленовая фракция</td>
                                <td className="text-right text-slate-300">{fractionationResult.propanePropylene_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Бутан-бутиленовая фракция</td>
                                <td className="text-right text-slate-300">{fractionationResult.butaneButylene_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Газовый бензин</td>
                                <td className="text-right text-slate-300">{fractionationResult.gasoline_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Стабильный бензин</td>
                                <td className="text-right text-slate-300">{fractionationResult.stableGasoline_kg_h.toFixed(0)}</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4 text-red-300">Удалено H₂S</td>
                                <td className="text-right text-red-300">{fractionationResult.h2sRemoved_kg_h.toFixed(1)}</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 italic">
                        Классическая схема ГФУ: последовательная ректификация с получением товарных фракций.
                    </div>
                </div>
            )}

            {/* Глубокая переработка газа (нефтехимия) */}
            {deepProcessingResult && (
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-md font-bold text-indigo-400 mb-3">⚙️ Глубокая переработка газа (нефтехимия)(альтернатива)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                            <tr className="border-b border-slate-700">
                                <th className="text-left py-2 text-slate-400 font-medium">Статья</th>
                                <th className="text-right py-2 text-slate-400 font-medium">Значение</th>
                            </tr>
                            </thead>
                            <tbody>
                            <tr className="border-b border-slate-800 bg-slate-900/30">
                                <td className="py-2 font-semibold text-cyan-300">Приход:</td>
                                <td className="text-right"></td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Жирный газ</td>
                                <td className="text-right text-slate-300">{fatGasFlow_kg_h.toFixed(0)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-700">
                                <td className="py-2 font-semibold text-slate-300">Расход (продукты и параметры):</td>
                                <td className="text-right"></td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Сухой газ</td>
                                <td className="text-right text-slate-300">{deepProcessingResult.dryGas_kg_h.toFixed(0)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Этан-этиленовая фракция</td>
                                <td className="text-right text-slate-300">{deepProcessingResult.ethaneEthylene_kg_h.toFixed(0)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Пропан-пропиленовая фракция</td>
                                <td className="text-right text-slate-300">{deepProcessingResult.propanePropylene_kg_h.toFixed(0)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Бутан-бутиленовая фракция</td>
                                <td className="text-right text-slate-300">{deepProcessingResult.butaneButylene_kg_h.toFixed(0)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4 text-red-300">Удалено H₂S</td>
                                <td className="text-right text-red-300">{deepProcessingResult.h2sRemoved_kg_h.toFixed(1)} кг/ч</td>
                            </tr>
                            <tr className="border-b border-slate-800">
                                <td className="py-2 text-slate-200 pl-4">Энергопотребление</td>
                                <td className="text-right text-slate-300">{deepProcessingResult.powerConsumption_kW.toFixed(0)} кВт</td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 italic">
                        Глубокая переработка (абсорбция С3/С4 → хемосорбция H₂S → адсорбционная осушка → низкотемпературная деэтанизация → ректификация С3/С4).
                    </div>
                </div>
            )}

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">📘 О технологиях переработки газа</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                    <strong>Газофракционирование (ГФУ)</strong> — классический метод разделения газа на индивидуальные фракции
                    (сухой газ, этан, пропан, бутан, газовый бензин) путём последовательной ректификации под давлением.
                    Используется для получения топливных газов и сырья для нефтехимии.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    <strong>Глубокая переработка газа (нефтехимический вариант)(альтернатива)</strong> — включает абсорбцию C3/C4 фракций,
                    хемосорбцию сероводорода (аминная очистка), адсорбционную осушку и низкотемпературную деэтанизацию.
                    Позволяет получить высокочистые олефиновые и парафиновые углеводороды для дальнейшего пиролиза или полимеризации. Газ идёт не на ГФУ, а на глубокую переработку газов
                </p>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    ✅ По технологической схеме УЗК: <strong>стабильный бензин</strong> (выходит из колонны стабилизации К-5)
                    является товарным продуктом. В случае, если нет блока стабилизации бензина, то в блоке ГФУ или Глубокой переработки газа из нестабильного бензина отгоняются легкие газы, после чего он
                    становится <strong>стабильным бензином</strong>.
                </p>
            </div>
        </div>
    );
};

export default GasProcessingIntegrated;