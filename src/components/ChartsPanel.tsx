import type { SimulationResult } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface ChartsPanelProps {
  result: SimulationResult;
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-5">
      <h4 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">{title}</h4>
      <div className="h-72">
        {children}
      </div>
    </div>
  );
}

const COLORS = ['#38bdf8', '#fbbf24', '#4ade80', '#fb923c', '#ef4444', '#94a3b8'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tooltipStyle: any = { backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: 8 };
const labelStyle = { color: '#94a3b8' };

export default function ChartsPanel({ result }: ChartsPanelProps) {
  const { timeSeries, reactorProfile, yields } = result;

  const pieData = [
    { name: 'Газ', value: yields.gas },
    { name: 'Бензин', value: yields.gasoline },
    { name: 'Лёгкий ГО', value: yields.lightGasoil },
    { name: 'Тяжёлый ГО', value: yields.heavyGasoil },
    { name: 'Кокс', value: yields.coke },
    { name: 'Потери', value: yields.losses },
  ];

  const barData = [
    { name: 'Газ', value: yields.gas, fill: '#38bdf8' },
    { name: 'Бензин', value: yields.gasoline, fill: '#fbbf24' },
    { name: 'ЛГО', value: yields.lightGasoil, fill: '#4ade80' },
    { name: 'ТГО', value: yields.heavyGasoil, fill: '#fb923c' },
    { name: 'Кокс', value: yields.coke, fill: '#ef4444' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-lg font-bold text-white">
        <BarChart3 size={22} className="text-amber-400" />
        Графический анализ
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Распределение продуктов — круговая */}
        <ChartCard title="Распределение продуктов (% масс.)">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
                labelLine={false}
              >
                {pieData.map((_entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Выходы продуктов — столбчатая */}
        <ChartCard title="Выходы продуктов">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" />
              <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Температурный профиль камеры vs время */}
        <ChartCard title="Температура в камере (время заполнения)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" ч" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="°C" domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Время: ${l} ч`}
              />
              <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} name="Температура, °C" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Давление vs время */}
        <ChartCard title="Давление верха камеры (время заполнения)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" ч" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" МПа" domain={['dataMin - 0.01', 'dataMax + 0.01']} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Время: ${l} ч`}
              />
              <Line type="monotone" dataKey="pressure" stroke="#38bdf8" strokeWidth={2} dot={false} name="Давление, МПа" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Уровень кокса */}
        <ChartCard title="Заполнение камеры коксом">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" ч" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Время: ${l} ч`}
              />
              <Area type="monotone" dataKey="cokeLevel" stroke="#ef4444" fill="#ef444433" strokeWidth={2} name="Уровень кокса, %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Степень конверсии */}
        <ChartCard title="Степень конверсии сырья">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" ч" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Время: ${l} ч`}
              />
              <Area type="monotone" dataKey="conversionRate" stroke="#4ade80" fill="#4ade8033" strokeWidth={2} name="Конверсия, %" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Температурный профиль по высоте реактора */}
        <ChartCard title="Температурный профиль по высоте камеры">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reactorProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="height" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" м" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit="°C" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Высота: ${l} м`}
              />
              <Line type="monotone" dataKey="temp" stroke="#a855f7" strokeWidth={2} dot={false} name="Температура, °C" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Профиль плотности по высоте */}
        <ChartCard title="Профиль плотности среды по высоте камеры">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reactorProfile}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="height" tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" м" />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} unit=" кг/м³" />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                labelFormatter={(l) => `Высота: ${l} м`}
              />
              <Area type="monotone" dataKey="density" stroke="#ec4899" fill="#ec489933" strokeWidth={2} name="Плотность, кг/м³" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
