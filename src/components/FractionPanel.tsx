import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import type { FractionComposition } from '../data/feedstockData';

interface Props {
  fractions: FractionComposition;
}

type TabType = 'gas' | 'gasoline' | 'lightGasOil' | 'heavyGasOil' | 'coke';

const tabLabels: Record<TabType, string> = {
  gas: 'Газ',
  gasoline: 'Бензин',
  lightGasOil: 'Лёгкий газойль',
  heavyGasOil: 'Тяжёлый газойль',
  coke: 'Кокс',
};

const tabColors: Record<TabType, string> = {
  gas: 'border-red-500 text-red-400',
  gasoline: 'border-amber-500 text-amber-400',
  lightGasOil: 'border-green-500 text-green-400',
  heavyGasOil: 'border-blue-500 text-blue-400',
  coke: 'border-purple-500 text-purple-400',
};

const tabBgActive: Record<TabType, string> = {
  gas: 'bg-red-500/20',
  gasoline: 'bg-amber-500/20',
  lightGasOil: 'bg-green-500/20',
  heavyGasOil: 'bg-blue-500/20',
  coke: 'bg-purple-500/20',
};

const FractionPanel: React.FC<Props> = ({ fractions }) => {
  const [activeTab, setActiveTab] = useState<TabType>('gas');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(tabLabels) as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              activeTab === tab
                ? `${tabColors[tab]} ${tabBgActive[tab]} border-current`
                : 'border-slate-600 text-slate-400 hover:border-slate-500'
            }`}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'gas' && <GasContent data={fractions.gas} />}
      {activeTab === 'gasoline' && <GasolineContent data={fractions.gasoline} />}
      {activeTab === 'lightGasOil' && <LightGasOilContent data={fractions.lightGasOil} />}
      {activeTab === 'heavyGasOil' && <HeavyGasOilContent data={fractions.heavyGasOil} />}
      {activeTab === 'coke' && <CokeContent data={fractions.coke} />}
    </div>
  );
};

const GasContent: React.FC<{ data: FractionComposition['gas'] }> = ({ data }) => {
  const chartData = [
    { name: 'H₂', value: data.hydrogen, fill: '#ef4444' },
    { name: 'CH₄', value: data.methane, fill: '#f97316' },
    { name: 'C₂H₆', value: data.ethane, fill: '#eab308' },
    { name: 'C₂H₄', value: data.ethylene, fill: '#22c55e' },
    { name: 'C₃H₈', value: data.propane, fill: '#3b82f6' },
    { name: 'C₃H₆', value: data.propylene, fill: '#8b5cf6' },
    { name: 'C₄', value: data.butanes, fill: '#ec4899' },
    { name: 'H₂S', value: data.h2s, fill: '#6b7280' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-red-400 mb-3">Состав газа коксования, % об.</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-red-400 mb-3">Компоненты газа</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700">
              <th className="text-left py-1.5">Компонент</th>
              <th className="text-right py-1.5">Формула</th>
              <th className="text-right py-1.5">Содержание, %</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Водород', 'H₂', data.hydrogen],
              ['Метан', 'CH₄', data.methane],
              ['Этан', 'C₂H₆', data.ethane],
              ['Этилен', 'C₂H₄', data.ethylene],
              ['Пропан', 'C₃H₈', data.propane],
              ['Пропилен', 'C₃H₆', data.propylene],
              ['Бутаны', 'C₄H₁₀', data.butanes],
              ['Сероводород', 'H₂S', data.h2s],
            ].map(([name, formula, val], i) => (
              <tr key={i} className="border-b border-slate-800 text-slate-300">
                <td className="py-1.5">{name as string}</td>
                <td className="text-right text-slate-400">{formula as string}</td>
                <td className="text-right font-medium">{(val as number).toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const GasolineContent: React.FC<{ data: FractionComposition['gasoline'] }> = ({ data }) => {
  const hcData = [
    { name: 'Парафины', value: data.paraffins, fill: '#22c55e' },
    { name: 'Нафтены', value: data.naphthenes, fill: '#3b82f6' },
    { name: 'Ароматика', value: data.aromatics, fill: '#a855f7' },
    { name: 'Олефины', value: data.olefins, fill: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-amber-400 mb-3">Углеводородный состав бензина, %</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hcData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
              {hcData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-amber-400 mb-3">Характеристики бензиновой фракции</h4>
        <div className="space-y-2">
          <PropRow label="Фракционный состав" value={`${data.boilingStart}–${data.boilingEnd} °C`} />
          <PropRow label="Плотность" value={`${data.density} г/см³`} />
          <PropRow label="Октановое число (ИМ)" value={`${data.octaneRON.toFixed(0)}`} />
          <PropRow label="Октановое число (ММ)" value={`${data.octaneMON.toFixed(0)}`} />
          <PropRow label="Содержание серы" value={`${data.sulfur.toFixed(2)} % масс.`} />
          <PropRow label="Парафины" value={`${data.paraffins.toFixed(1)}%`} />
          <PropRow label="Нафтены" value={`${data.naphthenes.toFixed(1)}%`} />
          <PropRow label="Ароматика" value={`${data.aromatics.toFixed(1)}%`} />
          <PropRow label="Олефины" value={`${data.olefins.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
};

const LightGasOilContent: React.FC<{ data: FractionComposition['lightGasOil'] }> = ({ data }) => {
  const hcData = [
    { name: 'Парафины', value: data.paraffins, fill: '#22c55e' },
    { name: 'Нафтены', value: data.naphthenes, fill: '#3b82f6' },
    { name: 'Ароматика', value: data.aromatics, fill: '#a855f7' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-green-400 mb-3">Углеводородный состав лёгкого газойля, %</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hcData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
              {hcData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-green-400 mb-3">Характеристики лёгкого газойля</h4>
        <div className="space-y-2">
          <PropRow label="Фракционный состав" value={`${data.boilingStart}–${data.boilingEnd} °C`} />
          <PropRow label="Плотность" value={`${data.density} г/см³`} />
          <PropRow label="Цетановое число" value={`${data.cetaneNumber}`} />
          <PropRow label="Содержание серы" value={`${data.sulfur.toFixed(2)} % масс.`} />
          <PropRow label="Парафины" value={`${data.paraffins.toFixed(1)}%`} />
          <PropRow label="Нафтены" value={`${data.naphthenes.toFixed(1)}%`} />
          <PropRow label="Ароматика" value={`${data.aromatics.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
};

const HeavyGasOilContent: React.FC<{ data: FractionComposition['heavyGasOil'] }> = ({ data }) => {
  const hcData = [
    { name: 'Парафины', value: data.paraffins, fill: '#22c55e' },
    { name: 'Нафтены', value: data.naphthenes, fill: '#3b82f6' },
    { name: 'Ароматика', value: data.aromatics, fill: '#a855f7' },
    { name: 'Смолы', value: data.resins, fill: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-blue-400 mb-3">Углеводородный состав тяжёлого газойля, %</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={hcData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
              {hcData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-blue-400 mb-3">Характеристики тяжёлого газойля</h4>
        <div className="space-y-2">
          <PropRow label="Фракционный состав" value={`${data.boilingStart}–${data.boilingEnd} °C`} />
          <PropRow label="Плотность" value={`${data.density} г/см³`} />
          <PropRow label="Коксуемость" value={`${data.cokability} %`} />
          <PropRow label="Содержание серы" value={`${data.sulfur.toFixed(2)} % масс.`} />
          <PropRow label="Парафины" value={`${data.paraffins.toFixed(1)}%`} />
          <PropRow label="Нафтены" value={`${data.naphthenes.toFixed(1)}%`} />
          <PropRow label="Ароматика" value={`${data.aromatics.toFixed(1)}%`} />
          <PropRow label="Смолы" value={`${data.resins.toFixed(1)}%`} />
        </div>
      </div>
    </div>
  );
};

const CokeContent: React.FC<{ data: FractionComposition['coke'] }> = ({ data }) => {
  const chartData = [
    { name: 'Летучие', value: data.volatiles, fill: '#ef4444' },
    { name: 'Зольность', value: data.ash, fill: '#6b7280' },
    { name: 'Сера', value: data.sulfur, fill: '#eab308' },
    { name: 'Влажность', value: data.moisture, fill: '#3b82f6' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-purple-400 mb-3">Характеристики кокса, %</h4>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }} />
            <Bar dataKey="value" name="%" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
        <h4 className="text-sm font-bold text-purple-400 mb-3">Качество нефтяного кокса</h4>
        <div className="space-y-2">
          <PropRow label="Содержание летучих" value={`${data.volatiles.toFixed(1)} %`} />
          <PropRow label="Зольность" value={`${data.ash.toFixed(2)} %`} />
          <PropRow label="Содержание серы" value={`${data.sulfur.toFixed(2)} %`} />
          <PropRow label="Влажность" value={`${data.moisture.toFixed(1)} %`} />
          <PropRow label="Истинная плотность" value={`${data.trueDensity} г/см³`} />
          <div className="mt-4 p-3 bg-slate-900/60 rounded-lg">
            <span className="text-xs text-slate-500">Примечание: </span>
            <span className="text-xs text-slate-400">
              Кокс после прокаливания (1200-1400°C) используется для производства
              анодной массы (Al-промышленность) и графитированных электродов.
              Гранулометрический состав: фр. &gt;25 мм и фр. &lt;25 мм.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-slate-700/50">
    <span className="text-xs text-slate-400">{label}</span>
    <span className="text-xs text-slate-200 font-medium">{value}</span>
  </div>
);

export default FractionPanel;
