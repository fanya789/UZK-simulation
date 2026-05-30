// src/components/FeedstockEditorModal.tsx
import React, { useState } from 'react';
import { FeedstockProperties, createEmptyFeedstock } from '../data/feedstockData';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (feedstock: FeedstockProperties) => void;
}

const FeedstockEditorModal: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
    const [feedstock, setFeedstock] = useState<FeedstockProperties>(createEmptyFeedstock());

    if (!isOpen) return null;

    const handleChange = (field: keyof FeedstockProperties, value: any) => {
        setFeedstock(prev => ({ ...prev, [field]: value }));
    };

    const handleYieldChange = (product: keyof FeedstockProperties['defaultYields'], value: number) => {
        setFeedstock(prev => ({
            ...prev,
            defaultYields: { ...prev.defaultYields, [product]: value },
        }));
    };

    const handleGasChange = (component: keyof FeedstockProperties['fractionComposition']['gas'], value: number) => {
        setFeedstock(prev => ({
            ...prev,
            fractionComposition: {
                ...prev.fractionComposition,
                gas: { ...prev.fractionComposition.gas, [component]: value },
            },
        }));
    };

    const handleSave = () => {
        onSave(feedstock);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-slate-800 px-6 py-4 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-blue-400">➕ Новое сырьё</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-6 space-y-6">
                    {/* Основные параметры */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputField label="Название" value={feedstock.name} onChange={(v) => handleChange('name', v)} />
                        <InputField label="Плотность, г/см³" type="number" value={feedstock.density} onChange={(v) => handleChange('density', parseFloat(v))} step="0.001" />
                        <InputField label="Коксуемость, %" type="number" value={feedstock.cokability} onChange={(v) => handleChange('cokability', parseFloat(v))} step="0.1" />
                        <InputField label="Сера, %" type="number" value={feedstock.sulfur} onChange={(v) => handleChange('sulfur', parseFloat(v))} step="0.01" />
                        <InputField label="Углерод, %" type="number" value={feedstock.carbon} onChange={(v) => handleChange('carbon', parseFloat(v))} step="0.1" />
                        <InputField label="Водород, %" type="number" value={feedstock.hydrogen} onChange={(v) => handleChange('hydrogen', parseFloat(v))} step="0.1" />
                        <InputField label="Ванадий, ppm" type="number" value={feedstock.vanadium} onChange={(v) => handleChange('vanadium', parseFloat(v))} step="1" />
                        <InputField label="Никель, ppm" type="number" value={feedstock.nickel} onChange={(v) => handleChange('nickel', parseFloat(v))} step="1" />
                    </div>
                    {/* Углеводородный состав */}
                    <div>
                        <h3 className="text-sm font-semibold text-cyan-400 mb-2">Углеводородный состав, %</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <InputField label="Парафины" value={feedstock.paraffins} onChange={(v) => handleChange('paraffins', parseFloat(v))} step="0.1" />
                            <InputField label="Нафтены" value={feedstock.naphthenes} onChange={(v) => handleChange('naphthenes', parseFloat(v))} step="0.1" />
                            <InputField label="Ароматика" value={feedstock.aromatics} onChange={(v) => handleChange('aromatics', parseFloat(v))} step="0.1" />
                            <InputField label="Смолы" value={feedstock.resins} onChange={(v) => handleChange('resins', parseFloat(v))} step="0.1" />
                            <InputField label="Асфальтены" value={feedstock.asphaltenes} onChange={(v) => handleChange('asphaltenes', parseFloat(v))} step="0.1" />
                        </div>
                    </div>
                    {/* Выходы продуктов (базовые) */}
                    <div>
                        <h3 className="text-sm font-semibold text-cyan-400 mb-2">Базовые выходы продуктов, % масс.</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <InputField label="Газ" value={feedstock.defaultYields.gas} onChange={(v) => handleYieldChange('gas', parseFloat(v))} step="0.1" />
                            <InputField label="Головка стаб." value={feedstock.defaultYields.headStabilization} onChange={(v) => handleYieldChange('headStabilization', parseFloat(v))} step="0.1" />
                            <InputField label="Бензин" value={feedstock.defaultYields.gasoline} onChange={(v) => handleYieldChange('gasoline', parseFloat(v))} step="0.1" />
                            <InputField label="Лёгкий г/о" value={feedstock.defaultYields.lightGasOil} onChange={(v) => handleYieldChange('lightGasOil', parseFloat(v))} step="0.1" />
                            <InputField label="Тяжёлый г/о" value={feedstock.defaultYields.heavyGasOil} onChange={(v) => handleYieldChange('heavyGasOil', parseFloat(v))} step="0.1" />
                            <InputField label="Кокс" value={feedstock.defaultYields.coke} onChange={(v) => handleYieldChange('coke', parseFloat(v))} step="0.1" />
                            <InputField label="Потери" value={feedstock.defaultYields.losses} onChange={(v) => handleYieldChange('losses', parseFloat(v))} step="0.1" />
                        </div>
                    </div>
                    {/* Состав газа (пример) – можно добавить аналогично для других фракций, но для краткости оставим газ */}
                    <div>
                        <h3 className="text-sm font-semibold text-cyan-400 mb-2">Состав газа коксования, % об.</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <InputField label="H₂" value={feedstock.fractionComposition.gas.hydrogen} onChange={(v) => handleGasChange('hydrogen', parseFloat(v))} step="0.1" />
                            <InputField label="CH₄" value={feedstock.fractionComposition.gas.methane} onChange={(v) => handleGasChange('methane', parseFloat(v))} step="0.1" />
                            <InputField label="C₂H₆" value={feedstock.fractionComposition.gas.ethane} onChange={(v) => handleGasChange('ethane', parseFloat(v))} step="0.1" />
                            <InputField label="C₂H₄" value={feedstock.fractionComposition.gas.ethylene} onChange={(v) => handleGasChange('ethylene', parseFloat(v))} step="0.1" />
                            <InputField label="C₃H₈" value={feedstock.fractionComposition.gas.propane} onChange={(v) => handleGasChange('propane', parseFloat(v))} step="0.1" />
                            <InputField label="C₃H₆" value={feedstock.fractionComposition.gas.propylene} onChange={(v) => handleGasChange('propylene', parseFloat(v))} step="0.1" />
                            <InputField label="C₄" value={feedstock.fractionComposition.gas.butanes} onChange={(v) => handleGasChange('butanes', parseFloat(v))} step="0.1" />
                            <InputField label="H₂S" value={feedstock.fractionComposition.gas.h2s} onChange={(v) => handleGasChange('h2s', parseFloat(v))} step="0.1" />
                        </div>
                    </div>
                </div>
                <div className="sticky bottom-0 bg-slate-800 px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600">Отмена</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500">Сохранить</button>
                </div>
            </div>
        </div>
    );
};

const InputField = ({ label, value, onChange, type = 'text', step = 'any' }: any) => (
    <div>
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            step={step}
            className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-white"
        />
    </div>
);

export default FeedstockEditorModal;