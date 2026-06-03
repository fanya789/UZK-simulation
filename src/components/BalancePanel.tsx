import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import type { SimulationResults } from '../data/simulationEngine';

interface Props {
  results: SimulationResults;
}

// Общий стиль для тултипов (светлый текст на тёмном фоне)
const tooltipStyle = {
  contentStyle: { backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' },
  labelStyle: { color: '#f1f5f9' },
  itemStyle: { color: '#f1f5f9' },
};

const BalancePanel: React.FC<Props> = ({ results }) => {
  const { massBalance, heatBalance } = results;

  const massInData = [
    { name: 'Сырьё', value: massBalance.feedIn, fill: '#3b82f6' },
    { name: 'Водяной пар', value: massBalance.steamIn, fill: '#06b6d4' },
  ];

  const massOutData = [
    { name: 'Газ', value: massBalance.gasOut, fill: '#ef4444' },
    { name: 'Бензин', value: massBalance.gasolineOut, fill: '#eab308' },
    { name: 'Лёгкий газойль коксования', value: massBalance.lightGasOilOut, fill: '#22c55e' },
    { name: 'Тяжёлый газойль коксования', value: massBalance.heavyGasOilOut, fill: '#3b82f6' },
    { name: 'Кокс', value: massBalance.cokeOut, fill: '#a855f7' },
    { name: 'Потери+пар', value: massBalance.lossesOut, fill: '#6b7280' },
  ];

  const heatInData = [
    { name: 'Тепло сырья', value: heatBalance.heatInput, fill: '#f97316' },
    { name: 'Тепло печи', value: heatBalance.heatFurnace, fill: '#ef4444' },
    { name: 'Тепло пара', value: heatBalance.heatSteam, fill: '#06b6d4' },
  ];

  const heatOutData = [
    { name: 'Продукты', value: heatBalance.heatProducts, fill: '#22c55e' },
    { name: 'Реакция', value: heatBalance.heatReaction, fill: '#eab308' },
    { name: 'Потери', value: heatBalance.heatLosses, fill: '#6b7280' },
  ];

  return (
      <div className="space-y-5">
        {/* Материальный баланс */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-cyan-400 mb-4">Материальный баланс, т/ч</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2 text-center">ПРИХОД</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={massInData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" name="т/ч" radius={[0, 4, 4, 0]}>
                    {massInData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-slate-400 mt-1">
                Итого: <span className="text-slate-200 font-bold">{massBalance.totalIn.toFixed(2)} т/ч</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2 text-center">РАСХОД</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={massOutData} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" name="т/ч" radius={[0, 4, 4, 0]}>
                    {massOutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-slate-400 mt-1">
                Итого: <span className="text-slate-200 font-bold">{massBalance.totalOut.toFixed(2)} т/ч</span>
              </div>
            </div>
          </div>
        </div>

        {/* Тепловой баланс */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-orange-400 mb-4">Тепловой баланс, МВт</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2 text-center">ПРИХОД ТЕПЛА</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatInData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="value" name="МВт" radius={[4, 4, 0, 0]}>
                    {heatInData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-slate-400 mt-1">
                Итого: <span className="text-slate-200 font-bold">{heatBalance.totalHeatIn.toFixed(1)} МВт</span>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 mb-2 text-center">РАСХОД ТЕПЛА</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={heatOutData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#cbd5e1', fontSize: 10 }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="value" name="МВт" radius={[4, 4, 0, 0]}>
                    {heatOutData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-slate-400 mt-1">
                Итого: <span className="text-slate-200 font-bold">{heatBalance.totalHeatOut.toFixed(1)} МВт</span>
              </div>
            </div>
          </div>
        </div>

        {/* Сводные таблицы */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-cyan-400 mb-3">Материальный баланс (таблица)</h3>
            <table className="w-full text-xs">
              <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-1.5">Статья</th>
                <th className="text-right py-1.5">т/ч</th>
                <th className="text-right py-1.5">% масс.</th>
              </tr>
              </thead>
              <tbody>
              <tr className="border-b border-slate-800 text-cyan-300 font-semibold">
                <td className="py-1.5" colSpan={3}>Приход:</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1.5 pl-3 text-slate-200">Сырьё</td>
                <td className="text-right text-slate-200">{massBalance.feedIn.toFixed(2)}</td>
                <td className="text-right text-slate-200">{(massBalance.feedIn/massBalance.totalIn*100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-1.5 pl-3 text-slate-200">Водяной пар</td>
                <td className="text-right text-slate-200">{massBalance.steamIn.toFixed(2)}</td>
                <td className="text-right text-slate-200">{(massBalance.steamIn/massBalance.totalIn*100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700 text-slate-200 font-semibold">
                <td className="py-1.5">Итого приход</td>
                <td className="text-right">{massBalance.totalIn.toFixed(2)}</td>
                <td className="text-right">100.0</td>
              </tr>
              <tr className="border-b border-slate-800 text-green-300 font-semibold">
                <td className="py-1.5" colSpan={3}>Расход:</td>
              </tr>
              {massOutData.map((item, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-1.5 pl-3 text-slate-200">{item.name}</td>
                    <td className="text-right text-slate-200">{item.value.toFixed(2)}</td>
                    <td className="text-right text-slate-200">{(item.value/massBalance.totalOut*100).toFixed(1)}</td>
                  </tr>
              ))}
              <tr className="text-slate-200 font-semibold">
                <td className="py-1.5">Итого расход</td>
                <td className="text-right">{massBalance.totalOut.toFixed(2)}</td>
                <td className="text-right">100.0</td>
              </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-orange-400 mb-3">Тепловой баланс (таблица)</h3>
            <table className="w-full text-xs">
              <thead>
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-1.5">Статья</th>
                <th className="text-right py-1.5">МВт</th>
                <th className="text-right py-1.5">%</th>
              </tr>
              </thead>
              <tbody>
              <tr className="border-b border-slate-800 text-orange-300 font-semibold">
                <td className="py-1.5" colSpan={3}>Приход тепла:</td>
              </tr>
              {heatInData.map((item, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-1.5 pl-3 text-slate-200">{item.name}</td>
                    <td className="text-right text-slate-200">{item.value.toFixed(1)}</td>
                    <td className="text-right text-slate-200">{(item.value/heatBalance.totalHeatIn*100).toFixed(1)}</td>
                  </tr>
              ))}
              <tr className="border-b border-slate-700 text-slate-200 font-semibold">
                <td className="py-1.5">Итого</td>
                <td className="text-right">{heatBalance.totalHeatIn.toFixed(1)}</td>
                <td className="text-right">100.0</td>
              </tr>
              <tr className="border-b border-slate-800 text-red-300 font-semibold">
                <td className="py-1.5" colSpan={3}>Расход тепла:</td>
              </tr>
              {heatOutData.map((item, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-1.5 pl-3 text-slate-200">{item.name}</td>
                    <td className="text-right text-slate-200">{item.value.toFixed(1)}</td>
                    <td className="text-right text-slate-200">{(item.value/heatBalance.totalHeatOut*100).toFixed(1)}</td>
                  </tr>
              ))}
              <tr className="text-slate-200 font-semibold">
                <td className="py-1.5">Итого</td>
                <td className="text-right">{heatBalance.totalHeatOut.toFixed(1)}</td>
                <td className="text-right">100.0</td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
};

export default BalancePanel;