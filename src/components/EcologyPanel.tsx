import React from 'react';
import { EcologyResult } from '../data/simulationEngine';

interface Props {
    ecology: EcologyResult | null;
}

const EcologyPanel: React.FC<Props> = ({ ecology }) => {
    if (!ecology) {
        return (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 text-center py-12">
                <div className="text-4xl mb-3">🌍</div>
                <p className="text-slate-400">Экологический расчёт будет доступен после запуска моделирования.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Выбросы в атмосферу */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-sky-400 mb-2">🌫️ Выбросы в атмосферу</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">SO₂</div>
                        <div className="text-lg font-mono">{ecology.emissions.SO2.toFixed(2)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">CO</div>
                        <div className="text-lg font-mono">{ecology.emissions.CO.toFixed(2)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">NO₂</div>
                        <div className="text-lg font-mono">{ecology.emissions.NO2.toFixed(2)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">NO</div>
                        <div className="text-lg font-mono">{ecology.emissions.NO.toFixed(2)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">CH₄</div>
                        <div className="text-lg font-mono">{ecology.emissions.CH4.toFixed(3)} кг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center">
                        <div className="text-slate-400">Бенз(а)пирен</div>
                        <div className="text-sm font-mono">{ecology.emissions.Benzoapyrene.toFixed(6)} мг/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-2 text-center col-span-2">
                        <div className="text-slate-400">ЛОС (неорганизованные)</div>
                        <div className="text-lg font-mono">{ecology.emissions.VOC.toFixed(2)} кг/ч</div>
                    </div>
                </div>
            </div>

            {/* Сточные воды */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">💧 Сточные воды</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 rounded p-3">
                        <div className="text-slate-400">Расход сточных вод</div>
                        <div className="text-2xl font-bold">{ecology.wastewater.flow_m3_h.toFixed(1)} м³/ч</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-3">
                        <div className="text-slate-400">Концентрации (мг/л):</div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                            <div>Нефтепродукты: {ecology.wastewater.oilProducts_mg_l}</div>
                            <div>Взвешенные: {ecology.wastewater.suspended_mg_l}</div>
                            <div>Сульфиды: {ecology.wastewater.sulfides_mg_l}</div>
                            <div>Аммонийный азот: {ecology.wastewater.ammonia_mg_l}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Отходы */}
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-amber-400 mb-2">🗑️ Отходы производства</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 rounded p-3 text-center">
                        <div className="text-slate-400">Нефтешлам</div>
                        <div className="text-2xl font-bold">{ecology.waste.oilSludge_t_year.toFixed(1)} т/год</div>
                    </div>
                    <div className="bg-slate-900/60 rounded p-3 text-center">
                        <div className="text-slate-400">Отработанные фильтроэлементы</div>
                        <div className="text-2xl font-bold">{ecology.waste.spentFilters_t_year.toFixed(1)} т/год</div>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 text-center">* Расчёт выполнен на основе типовых удельных показателей регламента секции 100.</p>
            </div>
        </div>
    );
};

export default EcologyPanel;