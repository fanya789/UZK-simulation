import type { SimulationResult } from '../types';
import { AlertTriangle, CheckCircle, TrendingUp, Droplets, Zap, Scale } from 'lucide-react';

interface ResultsPanelProps {
  result: SimulationResult;
}

function StatCard({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className={`bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold">
        {value}
        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
      </div>
    </div>
  );
}

export default function ResultsPanel({ result }: ResultsPanelProps) {
  const { yields, properties, heatBalance, materialBalance, warnings } = result;

  return (
    <div className="space-y-6">
      {/* Предупреждения */}
      {warnings.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <AlertTriangle size={16} />
            Предупреждения ({warnings.length})
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-amber-300/80 text-sm pl-6">{w}</p>
          ))}
        </div>
      )}

      {warnings.length === 0 && (
        <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle size={16} />
            Расчёт выполнен успешно. Параметры в допустимых пределах.
          </div>
        </div>
      )}

      {/* Выходы продуктов */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp size={20} className="text-amber-400" />
          Выходы продуктов (% масс.)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Газ" value={yields.gas} unit="%" color="text-sky-300" />
          <StatCard label="Бензин (н.к.-180°C)" value={yields.gasoline} unit="%" color="text-yellow-300" />
          <StatCard label="Лёгкий газойль" value={yields.lightGasoil} unit="%" color="text-green-300" />
          <StatCard label="Тяжёлый газойль" value={yields.heavyGasoil} unit="%" color="text-orange-300" />
          <StatCard label="Кокс" value={yields.coke} unit="%" color="text-red-300" />
          <StatCard label="Потери" value={yields.losses} unit="%" color="text-slate-300" />
        </div>
        {/* Yield bar */}
        <div className="mt-3 h-6 rounded-full overflow-hidden flex bg-slate-700/50">
          <div style={{ width: `${yields.gas}%` }} className="bg-sky-500 transition-all" title={`Газ: ${yields.gas}%`} />
          <div style={{ width: `${yields.gasoline}%` }} className="bg-yellow-500 transition-all" title={`Бензин: ${yields.gasoline}%`} />
          <div style={{ width: `${yields.lightGasoil}%` }} className="bg-green-500 transition-all" title={`ЛГ: ${yields.lightGasoil}%`} />
          <div style={{ width: `${yields.heavyGasoil}%` }} className="bg-orange-500 transition-all" title={`ТГ: ${yields.heavyGasoil}%`} />
          <div style={{ width: `${yields.coke}%` }} className="bg-red-500 transition-all" title={`Кокс: ${yields.coke}%`} />
          <div style={{ width: `${yields.losses}%` }} className="bg-slate-500 transition-all" title={`Потери: ${yields.losses}%`} />
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-500 inline-block" /> Газ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Бензин</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> ЛГ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-500 inline-block" /> ТГ</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> Кокс</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-500 inline-block" /> Потери</span>
        </div>
      </div>

      {/* Свойства продуктов */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Droplets size={20} className="text-blue-400" />
          Свойства продуктов
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2 px-3">Продукт</th>
                <th className="py-2 px-3">Плотность</th>
                <th className="py-2 px-3">Сера, % масс.</th>
                <th className="py-2 px-3">Доп. характеристика</th>
              </tr>
            </thead>
            <tbody className="text-white">
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-sky-300">Газ</td>
                <td className="py-2 px-3">{properties.gasDensity.toFixed(2)} кг/м³</td>
                <td className="py-2 px-3">—</td>
                <td className="py-2 px-3">—</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-yellow-300">Бензин</td>
                <td className="py-2 px-3">{properties.gasolineDensity.toFixed(0)} кг/м³</td>
                <td className="py-2 px-3">{properties.gasolineSulfur.toFixed(3)}</td>
                <td className="py-2 px-3">—</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-green-300">Лёгкий газойль</td>
                <td className="py-2 px-3">{properties.lightGasoilDensity.toFixed(0)} кг/м³</td>
                <td className="py-2 px-3">{properties.lightGasoilSulfur.toFixed(3)}</td>
                <td className="py-2 px-3">—</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-orange-300">Тяжёлый газойль</td>
                <td className="py-2 px-3">{properties.heavyGasoilDensity.toFixed(0)} кг/м³</td>
                <td className="py-2 px-3">{properties.heavyGasoilSulfur.toFixed(3)}</td>
                <td className="py-2 px-3">—</td>
              </tr>
              <tr className="hover:bg-slate-700/20">
                <td className="py-2 px-3 text-red-300">Кокс</td>
                <td className="py-2 px-3">—</td>
                <td className="py-2 px-3">{properties.cokeSulfur.toFixed(3)}</td>
                <td className="py-2 px-3">
                  Летучие: {properties.cokeVolatiles.toFixed(1)}%, Зольность: {properties.cokeAsh.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Тепловой баланс */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Zap size={20} className="text-yellow-400" />
          Тепловой баланс
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard label="Подвод тепла" value={heatBalance.heatInput} unit="МВт" color="text-orange-300" icon={<Zap size={16} className="text-orange-400" />} />
          <StatCard label="Тепло реакции" value={heatBalance.heatReaction} unit="МВт" color="text-red-300" />
          <StatCard label="Тепло продуктов" value={heatBalance.heatProducts} unit="МВт" color="text-green-300" />
          <StatCard label="Потери тепла" value={heatBalance.heatLosses} unit="МВт" color="text-slate-300" />
          <StatCard label="КПД установки" value={heatBalance.efficiency} unit="%" color="text-emerald-300" icon={<TrendingUp size={16} className="text-emerald-400" />} />
        </div>
      </div>

      {/* Материальный баланс */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Scale size={20} className="text-purple-400" />
          Материальный баланс
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2 px-3">Поток</th>
                <th className="py-2 px-3 text-right">Расход, т/ч</th>
                <th className="py-2 px-3 text-right">Доля, %</th>
              </tr>
            </thead>
            <tbody className="text-white">
              <tr className="border-b border-slate-700/50 bg-slate-700/10 font-semibold">
                <td className="py-2 px-3">▶ Сырьё (вход)</td>
                <td className="py-2 px-3 text-right">{materialBalance.feedIn.toFixed(2)}</td>
                <td className="py-2 px-3 text-right">100.0</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-sky-300">  Газ</td>
                <td className="py-2 px-3 text-right">{materialBalance.gasOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.gasOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-yellow-300">  Бензин</td>
                <td className="py-2 px-3 text-right">{materialBalance.gasolineOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.gasolineOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-green-300">  Лёгкий газойль</td>
                <td className="py-2 px-3 text-right">{materialBalance.lightGasoilOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.lightGasoilOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-orange-300">  Тяжёлый газойль</td>
                <td className="py-2 px-3 text-right">{materialBalance.heavyGasoilOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.heavyGasoilOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-red-300">  Кокс</td>
                <td className="py-2 px-3 text-right">{materialBalance.cokeOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.cokeOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="border-b border-slate-700/50 hover:bg-slate-700/20">
                <td className="py-2 px-3 text-slate-400">  Потери</td>
                <td className="py-2 px-3 text-right">{materialBalance.lossesOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.lossesOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
              <tr className="bg-slate-700/20 font-semibold">
                <td className="py-2 px-3">◀ Итого (выход)</td>
                <td className="py-2 px-3 text-right">{materialBalance.totalOut.toFixed(3)}</td>
                <td className="py-2 px-3 text-right">{((materialBalance.totalOut / materialBalance.feedIn) * 100).toFixed(1)}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-slate-500 mt-2 px-3">
            Невязка баланса: {materialBalance.closureError.toFixed(3)}%
          </p>
        </div>
      </div>
    </div>
  );
}
