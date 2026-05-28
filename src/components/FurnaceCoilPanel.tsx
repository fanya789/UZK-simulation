import React, { useState } from 'react';
import { calculateRadiantCoil, CoilCalcResult } from '../data/simulationEngine';

const FurnaceCoilPanel: React.FC = () => {
    const [oilRate_tph, setOilRate_tph] = useState(100);
    const [T_in, setT_in] = useState(410);
    const [T_out, setT_out] = useState(500);
    const [P_in, setP_in] = useState(0.6);
    const [P_out, setP_out] = useState(0.5);
    const [steamPct, setSteamPct] = useState(3.0);
    const [diamCm, setDiamCm] = useState(15);
    const [result, setResult] = useState<CoilCalcResult | null>(null);

    const handleCalculate = () => {
        const oilRate_kg_s = oilRate_tph * 1000 / 3600;
        const diam_m = diamCm / 100;
        const res = calculateRadiantCoil(
            oilRate_kg_s, T_in, T_out, P_in, P_out, steamPct, diam_m
        );
        setResult(res);
    };

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-orange-400 mb-4">🔥 Расчёт радиантного змеевика печи</h3>
                <p className="text-sm text-slate-400 mb-4">
                    Подбор диаметра труб и расхода водяного пара для обеспечения скоростей на входе ≥2 м/с, на выходе ≈30 м/с.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ParamInput label="Расход сырья, т/ч" value={oilRate_tph} onChange={setOilRate_tph} min={20} max={500} step={5} />
                    <ParamInput label="Температура входа, °C" value={T_in} onChange={setT_in} min={380} max={430} step={1} />
                    <ParamInput label="Температура выхода, °C" value={T_out} onChange={setT_out} min={470} max={520} step={1} />
                    <ParamInput label="Давление на входе, МПа" value={P_in} onChange={setP_in} min={0.3} max={0.7} step={0.01} />
                    <ParamInput label="Давление на выходе, МПа" value={P_out} onChange={setP_out} min={0.2} max={0.6} step={0.01} />
                    <ParamInput label="Расход водяного пара, % от сырья" value={steamPct} onChange={setSteamPct} min={1} max={5} step={0.1} />
                    <ParamInput label="Внутренний диаметр труб, см" value={diamCm} onChange={setDiamCm} min={10} max={20} step={1} />
                </div>

                <button
                    onClick={handleCalculate}
                    className="mt-4 w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2 px-4 rounded-xl transition-all"
                >
                    Рассчитать змеевик
                </button>

                {result && (
                    <div className="mt-4 p-4 bg-slate-900 rounded-xl border border-slate-700">
                        <h4 className="font-bold text-cyan-400 mb-2">Результаты расчёта</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-400">Внутренний диаметр:</span>
                            <span className="font-mono">{result.diameter_m * 1000} мм</span>

                            <span className="text-slate-400">Расход пара:</span>
                            <span className="font-mono">{result.steamRate_kg_s.toFixed(2)} кг/с ({ (result.steamRate_kg_s * 3600).toFixed(0)} кг/ч)</span>

                            <span className="text-slate-400">Скорость на входе:</span>
                            <span className={`font-mono ${result.velocityInlet_m_s >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                {result.velocityInlet_m_s.toFixed(2)} м/с {result.velocityInlet_m_s >= 2 ? '✓' : '✗ (норма ≥2)'}
              </span>

                            <span className="text-slate-400">Скорость на выходе:</span>
                            <span className={`font-mono ${result.velocityOutlet_m_s <= 30 ? 'text-green-400' : 'text-red-400'}`}>
                {result.velocityOutlet_m_s.toFixed(2)} м/с {result.velocityOutlet_m_s <= 30 ? '✓' : '✗ (норма ≤30)'}
              </span>

                            <span className="text-slate-400">Длина змеевика:</span>
                            <span className="font-mono">{result.length_m.toFixed(0)} м</span>

                            <span className="text-slate-400">Время пребывания:</span>
                            <span className="font-mono">{result.residenceTime_s} с (норма 120 с)</span>
                        </div>

                        {result.errors.length > 0 && (
                            <div className="mt-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">
                                ⚠️ {result.errors.join('; ')}
                            </div>
                        )}
                        {result.recommendations.map((rec, idx) => (
                            <div key={idx} className="mt-1 text-yellow-400 text-sm">💡 {rec}</div>
                        ))}
                        {result.success && <div className="mt-2 text-green-400 text-sm">✅ Все параметры в допустимых пределах</div>}
                    </div>
                )}
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="font-bold text-slate-300 mb-2">📐 Рекомендации по выбору</h3>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                    <li>Скорость на входе должна быть не менее 2 м/с для предотвращения отложений кокса.</li>
                    <li>Скорость на выходе рекомендуется около 30 м/с, но не выше, чтобы избежать эрозии.</li>
                    <li>Диаметр труб обычно выбирают в диапазоне 10–20 см (100–200 мм).</li>
                    <li>Расход пара 1–5 % мас. от сырья – типичная практика УЗК.</li>
                    <li>При невыполнении условий измените диаметр или расход пара и пересчитайте.</li>
                </ul>
            </div>
        </div>
    );
};

const ParamInput = ({ label, value, onChange, min, max, step }: any) => (
    <div>
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            min={min}
            max={max}
            step={step}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
    </div>
);

export default FurnaceCoilPanel;