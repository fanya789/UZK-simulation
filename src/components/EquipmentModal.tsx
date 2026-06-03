import React from 'react';

interface EquipmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    equipmentType: string;
    data: any;
}

const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, equipmentType, data }) => {
    if (!isOpen) return null;

    const renderContent = () => {
        switch (equipmentType) {
            case 'furnace':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Температура на выходе:</span> <span className="text-white font-bold">{data.temp} °C</span></p>
                        <p><span className="text-slate-400">Расход топливного газа:</span> <span className="text-white">{data.fuelGas} кг/ч</span></p>
                        <p><span className="text-slate-400">Расход водяного пара:</span> <span className="text-white">{data.steam} % от сырья</span></p>
                        <p><span className="text-slate-400">КПД:</span> <span className="text-white">{data.efficiency} %</span></p>
                    </div>
                );
            case 'chamber':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Давление в камере:</span> <span className="text-white font-bold">{data.pressure} МПа</span></p>
                        <p><span className="text-slate-400">Температура входа (из печи -5°C):</span> <span className="text-white">{data.inletTemp} °C</span></p>
                        <p><span className="text-slate-400">Температура верха (расчётная):</span> <span className="text-white">{data.topTemp} °C</span></p>
                        <p><span className="text-slate-400">Время коксования:</span> <span className="text-white">{data.cycleTime} ч</span></p>
                        <p><span className="text-slate-400">Выход кокса:</span> <span className="text-white">{data.cokeOut} т/ч</span></p>
                    </div>
                );
            case 'column_k1':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Тип:</span> <span className="text-white">Ректификационная колонна</span></p>
                        <p><span className="text-slate-400">Температура верха:</span> <span className="text-white">{data.topTemp} °C</span></p>
                        <p><span className="text-slate-400">Температура низа:</span> <span className="text-white">{data.bottomTemp} °C</span></p>
                        <p><span className="text-slate-400">Число тарелок (теоретических):</span> <span className="text-white">24</span></p>
                        <p><span className="text-slate-400">Флегмовое число:</span> <span className="text-white">2.5</span></p>
                    </div>
                );
            case 'absorber':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Аппарат:</span> <span className="text-white">Фракционирующий абсорбер К-4</span></p>
                        <p><span className="text-slate-400">Давление:</span> <span className="text-white">{data.pressure} МПа</span></p>
                        <p><span className="text-slate-400">Температура верха:</span> <span className="text-white">{data.topTemp} °C</span></p>
                        <p><span className="text-slate-400">Количество тарелок:</span> <span className="text-white">20</span></p>
                    </div>
                );
            case 'stabilizer':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Аппарат:</span> <span className="text-white">Колонна стабилизации К-5</span></p>
                        <p><span className="text-slate-400">Температура верха:</span> <span className="text-white">{data.topTemp} °C</span></p>
                        <p><span className="text-slate-400">Температура низа:</span> <span className="text-white">{data.bottomTemp} °C</span></p>
                        <p><span className="text-slate-400">Давление:</span> <span className="text-white">{data.pressure} МПа</span></p>
                    </div>
                );
            case 'separator':
                return (
                    <div className="space-y-2">
                        <p><span className="text-slate-400">Аппарат:</span> <span className="text-white">Сепаратор С-1</span></p>
                        <p><span className="text-slate-400">Давление:</span> <span className="text-white">{data.pressure} МПа</span></p>
                        <p><span className="text-slate-400">Температура:</span> <span className="text-white">{data.temp} °C</span></p>
                    </div>
                );
            default:
                return <p>Нет данных для отображения</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-blue-400">{data.name || equipmentType}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-4">{renderContent()}</div>
            </div>
        </div>
    );
};

export default EquipmentModal;