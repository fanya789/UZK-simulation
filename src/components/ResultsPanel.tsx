import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import type { SimulationResults } from '../data/simulationEngine';

interface Props {
  results: SimulationResults;
}

const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#6b7280', '#ec4899'];

const ResultsPanel: React.FC<Props> = ({ results }) => {
  const { yields, keyIndicators } = results;

  const yieldData = [
    { name: 'Газ', value: yields.gas, fill: '#ef4444' },
    { name: 'Головка стаб.', value: yields.headStabilization, fill: '#f97316' },
    { name: 'Бензин', value: yields.gasoline, fill: '#eab308' },
    { name: 'Лёгкий г/о', value: yields.lightGasOil, fill: '#22c55e' },
    { name: 'Тяжёлый г/о', value: yields.heavyGasOil, fill: '#3b82f6' },
    { name: 'Кокс', value: yields.coke, fill: '#a855f7' },
    { name: 'Потери', value: yields.losses, fill: '#6b7280' },
  ];

  const radarData = [
    { subject: 'Глубина конверсии', A: keyIndicators.conversionDepth, fullMark: 100 },
    { subject: 'Выход светлых', A: keyIndicators.lightProductsYield, fullMark: 80 },
    { subject: 'Выход кокса', A: keyIndicators.cokeYield, fullMark: 40 },
    { subject: 'Жёсткость крекинга', A: keyIndicators.thermalCrackingSeverity * 100, fullMark: 200 },
    { subject: 'Уд. расход энергии', A: keyIndicators.specificEnergyConsumption / 5, fullMark: 100 },
  ];

  return (
    <div className="space-y-5">
      {/* Ключевые показатели */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Глубина конверсии" value={`${keyIndicators.conversionDepth}%`} color="text-green-400" />
        <KpiCard label="Выход светлых" value={`${keyIndicators.lightProductsYield}%`} color="text-cyan-400" />
        <KpiCard label="Выход кокса" value={`${keyIndicators.cokeYield}%`} color="text-amber-400" />
        <KpiCard label="Уд. расход энергии" value={`${keyIndicators.specificEnergyConsumption} кДж/кг`} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Диаграмма выхода продуктов — столбчатая */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Выход продуктов, % масс.</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={yieldData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                labelStyle={{ color: '#e2e8f0' }}
                itemStyle={{ color: '#94a3b8' }}
              />
              <Bar dataKey="value" name="% масс." radius={[6, 6, 0, 0]}>
                {yieldData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Круговая диаграмма */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Распределение продуктов</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={yieldData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {yieldData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Радарная диаграмма */}
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Показатели эффективности процесса</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 9 }} />
              <Radar name="Показатели" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 text-center">
    <div className={`text-lg font-bold ${color}`}>{value}</div>
    <div className="text-xs text-slate-500 mt-1">{label}</div>
  </div>
);

export default ResultsPanel;
