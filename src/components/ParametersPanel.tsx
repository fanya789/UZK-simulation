import React from 'react';
import type { ProcessParameters } from '../data/simulationEngine';
import type { FeedstockProperties } from '../data/feedstockData';
import { feedstockDatabase } from '../data/feedstockData';

interface Props {
  params: ProcessParameters;
  setParams: (p: ProcessParameters) => void;
  selectedFeedstock: FeedstockProperties;
  setSelectedFeedstock: (f: FeedstockProperties) => void;
  onSimulate: () => void;
}

const ParametersPanel: React.FC<Props> = ({
  params, setParams, selectedFeedstock, setSelectedFeedstock, onSimulate
}) => {
  const updateParam = (key: keyof ProcessParameters, value: number) => {
    setParams({ ...params, [key]: value });
  };

  return (
    <div className="space-y-5">
      {/* Характеристики сырья */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-400 rounded-full" />
          Характеристики сырья
        </h3>

        <div className="mb-3">
          <label className="block text-xs text-slate-400 mb-1">Тип сырья</label>
          <select
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedFeedstock.id}
            onChange={(e) => {
              const f = feedstockDatabase.find(fd => fd.id === e.target.value);
              if (f) setSelectedFeedstock(f);
            }}
          >
            {feedstockDatabase.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Плотность:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.density} г/см³</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Коксуемость:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.cokability}%</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Сера:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.sulfur}%</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Зольность:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.ash}%</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Углерод:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.carbon}%</span>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2">
            <span className="text-slate-500">Водород:</span>
            <span className="text-slate-200 ml-1 font-medium">{selectedFeedstock.hydrogen}%</span>
          </div>
        </div>

        {/* Углеводородный состав */}
        <div className="mt-3">
          <span className="text-xs text-slate-400 font-semibold">Углеводородный состав сырья:</span>
          <div className="mt-1 flex gap-1">
            {[
              { label: 'Пар.', value: selectedFeedstock.paraffins, color: 'bg-green-500' },
              { label: 'Нафтены', value: selectedFeedstock.naphthenes, color: 'bg-blue-500' },
              { label: 'Ароматика', value: selectedFeedstock.aromatics, color: 'bg-purple-500' },
              { label: 'Смолы', value: selectedFeedstock.resins, color: 'bg-amber-500' },
              { label: 'Асфальтены', value: selectedFeedstock.asphaltenes, color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label} className="flex-1">
                <div className="h-16 bg-slate-900/60 rounded-lg flex flex-col items-center justify-end p-1 relative overflow-hidden">
                  <div
                    className={`absolute bottom-0 left-0 right-0 ${item.color} opacity-30 rounded-b-lg`}
                    style={{ height: `${item.value}%` }}
                  />
                  <span className="text-slate-200 text-xs font-bold z-10">{item.value}%</span>
                </div>
                <span className="text-[10px] text-slate-500 block text-center mt-0.5">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Параметры процесса */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-400 rounded-full" />
          Трубчатая печь
        </h3>

        <ParamSlider
          label="Температура на выходе из печи"
          value={params.furnaceOutletTemp}
          min={470} max={520} step={1} unit="°C"
          onChange={(v) => updateParam('furnaceOutletTemp', v)}
        />
        <ParamSlider
          label="Расход водяного пара"
          value={params.steamRate}
          min={0.5} max={8} step={0.1} unit="% от сырья"
          onChange={(v) => updateParam('steamRate', v)}
        />
        <ParamSlider
          label="Температура пара в печь"
          value={params.steamToPipeTemp}
          min={300} max={500} step={5} unit="°C"
          onChange={(v) => updateParam('steamToPipeTemp', v)}
        />
      </div>

      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full" />
          Коксовые камеры
        </h3>

        <ParamSlider
          label="Давление в камере"
          value={params.chamberPressure}
          min={0.15} max={0.6} step={0.01} unit="МПа"
          onChange={(v) => updateParam('chamberPressure', v)}
        />
        <ParamSlider
          label="Время коксования"
          value={params.cokingTime}
          min={12} max={48} step={1} unit="ч"
          onChange={(v) => updateParam('cokingTime', v)}
        />
      </div>

      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full" />
          Ректификационная колонна
        </h3>

        <ParamSlider
          label="Расход сырья"
          value={params.feedRate}
          min={20} max={200} step={1} unit="т/ч"
          onChange={(v) => updateParam('feedRate', v)}
        />
        <ParamSlider
          label="Температура верха К-1"
          value={params.columnTopTemp}
          min={90} max={150} step={1} unit="°C"
          onChange={(v) => updateParam('columnTopTemp', v)}
        />
        <ParamSlider
          label="Температура низа К-1"
          value={params.columnBottomTemp}
          min={370} max={410} step={1} unit="°C"
          onChange={(v) => updateParam('columnBottomTemp', v)}
        />
        <ParamSlider
          label="Коэффициент рециркуляции"
          value={params.recycleRatio}
          min={0} max={0.3} step={0.01} unit=""
          onChange={(v) => updateParam('recycleRatio', v)}
        />
      </div>

      <button
        onClick={onSimulate}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-blue-900/30"
      >
        ▶ Запустить моделирование
      </button>
    </div>
  );
};

const ParamSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, unit, onChange }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <label className="text-xs text-slate-400">{label}</label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          className="w-16 bg-slate-900 border border-slate-600 rounded px-1.5 py-0.5 text-xs text-slate-200 text-right"
        />
        <span className="text-[10px] text-slate-500 min-w-[40px]">{unit}</span>
      </div>
    </div>
    <input
      type="range"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
    />
    <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export default ParametersPanel;
