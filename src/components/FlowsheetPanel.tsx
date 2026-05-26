import type { SimulationResult, SimulationInput } from '../types';

interface FlowsheetPanelProps {
  result: SimulationResult;
  input: SimulationInput;
}

export default function FlowsheetPanel({ result, input }: FlowsheetPanelProps) {
  const { yields, materialBalance } = result;

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-white">Принципиальная технологическая схема УЗК</h3>

      <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-6 overflow-x-auto">
        <svg viewBox="0 0 1100 620" className="w-full min-w-[800px]" style={{ maxHeight: '600px' }}>
          {/* Background */}
          <defs>
            <linearGradient id="furnaceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="reactorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="columnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.6" />
            </linearGradient>
            <marker id="arrowRight" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
            </marker>
          </defs>

          {/* === СЫРЬЁ === */}
          <rect x="20" y="250" width="120" height="60" rx="8" fill="#065f46" stroke="#10b981" strokeWidth="1.5" />
          <text x="80" y="275" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">СЫРЬЁ</text>
          <text x="80" y="295" textAnchor="middle" fill="#6ee7b7" fontSize="9">{input.feedstock.feedRate} т/ч</text>
          <text x="80" y="325" textAnchor="middle" fill="#94a3b8" fontSize="8">ρ={input.feedstock.density} кг/м³</text>
          <text x="80" y="337" textAnchor="middle" fill="#94a3b8" fontSize="8">S={input.feedstock.sulfurContent}%</text>

          {/* Линия: Сырьё → Печь */}
          <line x1="140" y1="280" x2="200" y2="280" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowRight)" />

          {/* === ТРУБЧАТАЯ ПЕЧЬ === */}
          <rect x="200" y="230" width="140" height="100" rx="10" fill="url(#furnaceGrad)" stroke="#f97316" strokeWidth="1.5" />
          <text x="270" y="260" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">ТРУБЧАТАЯ</text>
          <text x="270" y="275" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">ПЕЧЬ</text>
          <text x="270" y="298" textAnchor="middle" fill="#fef3c7" fontSize="9">
            {input.furnace.inletTemp}→{input.furnace.outletTemp}°C
          </text>
          <text x="270" y="313" textAnchor="middle" fill="#fef3c7" fontSize="9">P={input.furnace.pressure} МПа</text>

          {/* Линия: Печь → Реактор */}
          <line x1="340" y1="280" x2="430" y2="280" stroke="#f97316" strokeWidth="2.5" markerEnd="url(#arrowRight)" />
          <text x="385" y="272" textAnchor="middle" fill="#f97316" fontSize="8">{input.furnace.outletTemp}°C</text>

          {/* === КОКСОВЫЕ КАМЕРЫ === */}
          {/* Камера 1 */}
          <rect x="430" y="170" width="90" height="180" rx="8" fill="url(#reactorGrad)" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Уровень кокса */}
          <rect x="432" y={350 - (180 * yields.coke / 100 * 0.85)} width="86" height={180 * yields.coke / 100 * 0.85} rx="0" fill="#dc262644" />
          <text x="475" y="210" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">КАМЕРА</text>
          <text x="475" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">К-1</text>
          <text x="475" y="250" textAnchor="middle" fill="#fca5a5" fontSize="8">
            T={input.reactor.bottomTemp}°C
          </text>
          <text x="475" y="265" textAnchor="middle" fill="#fca5a5" fontSize="8">
            P={input.reactor.topPressure} МПа
          </text>
          <text x="475" y="290" textAnchor="middle" fill="#94a3b8" fontSize="8">
            Ø{input.reactor.chamberDiameter}×{input.reactor.chamberHeight}м
          </text>

          {/* Камера 2 */}
          <rect x="540" y="170" width="90" height="180" rx="8" fill="url(#reactorGrad)" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="542" y={350 - (180 * yields.coke / 100 * 0.4)} width="86" height={180 * yields.coke / 100 * 0.4} rx="0" fill="#dc262622" />
          <text x="585" y="210" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">КАМЕРА</text>
          <text x="585" y="225" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">К-2</text>
          <text x="585" y="265" textAnchor="middle" fill="#94a3b8" fontSize="8">(резерв)</text>

          {/* Линия пары: Реактор → Колонна */}
          <line x1="520" y1="170" x2="520" y2="120" stroke="#94a3b8" strokeWidth="2" />
          <line x1="520" y1="120" x2="720" y2="120" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <text x="620" y="112" textAnchor="middle" fill="#94a3b8" fontSize="8">Пары коксования</text>

          {/* Линия кокс выход */}
          <line x1="475" y1="350" x2="475" y2="420" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <rect x="420" y="420" width="110" height="45" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
          <text x="475" y="440" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">КОКС</text>
          <text x="475" y="455" textAnchor="middle" fill="#fca5a5" fontSize="8">{yields.coke}% ({materialBalance.cokeOut.toFixed(1)} т/ч)</text>

          {/* === РЕКТИФИКАЦИОННАЯ КОЛОННА === */}
          <rect x="720" y="60" width="100" height="320" rx="10" fill="url(#columnGrad)" stroke="#38bdf8" strokeWidth="1.5" />
          {/* Тарелки */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={i} x1="730" y1={95 + i * 35} x2="810" y2={95 + i * 35} stroke="#ffffff33" strokeWidth="1" />
          ))}
          <text x="770" y="85" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">РЕКТИФ.</text>
          <text x="770" y="100" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">КОЛОННА</text>
          <text x="770" y="125" textAnchor="middle" fill="#bae6fd" fontSize="8">
            Тарелок: {input.fractionation.numberOfTrays}
          </text>
          <text x="770" y="140" textAnchor="middle" fill="#bae6fd" fontSize="8">
            Верх: {input.fractionation.topTemp}°C
          </text>
          <text x="770" y="155" textAnchor="middle" fill="#bae6fd" fontSize="8">
            Низ: {input.fractionation.bottomTemp}°C
          </text>

          {/* === ВЫХОДНЫЕ ПОТОКИ === */}
          {/* Газ (верх) */}
          <line x1="820" y1="80" x2="900" y2="80" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <rect x="900" y="60" width="160" height="40" rx="6" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />
          <text x="980" y="78" textAnchor="middle" fill="#7dd3fc" fontSize="10" fontWeight="bold">ГАЗ</text>
          <text x="980" y="93" textAnchor="middle" fill="#7dd3fc" fontSize="8">{yields.gas}% ({materialBalance.gasOut.toFixed(1)} т/ч)</text>

          {/* Бензин */}
          <line x1="820" y1="160" x2="900" y2="160" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <rect x="900" y="140" width="160" height="40" rx="6" fill="#713f12" stroke="#fbbf24" strokeWidth="1" />
          <text x="980" y="158" textAnchor="middle" fill="#fde68a" fontSize="10" fontWeight="bold">БЕНЗИН (н.к.-180°C)</text>
          <text x="980" y="173" textAnchor="middle" fill="#fde68a" fontSize="8">{yields.gasoline}% ({materialBalance.gasolineOut.toFixed(1)} т/ч)</text>

          {/* Лёгкий газойль */}
          <line x1="820" y1="240" x2="900" y2="240" stroke="#4ade80" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <rect x="900" y="220" width="160" height="40" rx="6" fill="#14532d" stroke="#4ade80" strokeWidth="1" />
          <text x="980" y="238" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="bold">ЛЁГКИЙ ГАЗОЙЛЬ</text>
          <text x="980" y="253" textAnchor="middle" fill="#86efac" fontSize="8">{yields.lightGasoil}% ({materialBalance.lightGasoilOut.toFixed(1)} т/ч)</text>

          {/* Тяжёлый газойль */}
          <line x1="820" y1="320" x2="900" y2="320" stroke="#fb923c" strokeWidth="2" markerEnd="url(#arrowRight)" />
          <rect x="900" y="300" width="160" height="40" rx="6" fill="#7c2d12" stroke="#fb923c" strokeWidth="1" />
          <text x="980" y="318" textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="bold">ТЯЖЁЛЫЙ ГАЗОЙЛЬ</text>
          <text x="980" y="333" textAnchor="middle" fill="#fdba74" fontSize="8">{yields.heavyGasoil}% ({materialBalance.heavyGasoilOut.toFixed(1)} т/ч)</text>

          {/* Рецикл (низ колонны → печь) */}
          <line x1="770" y1="380" x2="770" y2="550" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="770" y1="550" x2="270" y2="550" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" />
          <line x1="270" y1="550" x2="270" y2="330" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="5 3" markerEnd="url(#arrowRight)" />
          <text x="520" y="565" textAnchor="middle" fill="#a78bfa" fontSize="8">Рецикл (тяжёлый остаток)</text>

          {/* Заголовок */}
          <text x="550" y="600" textAnchor="middle" fill="#64748b" fontSize="10">
            УЗК — Установка замедленного коксования • Камер: {input.reactor.numberOfChambers} • Загрузка: {input.feedstock.feedRate} т/ч
          </text>
        </svg>
      </div>

      {/* Легенда */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="text-orange-400 font-semibold mb-1">🔥 Трубчатая печь</div>
          <div className="text-slate-400">
            Нагрев сырья до {input.furnace.outletTemp}°C.<br />
            Время пребывания: {input.furnace.residenceTime} с
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="text-red-400 font-semibold mb-1">🏗 Коксовые камеры</div>
          <div className="text-slate-400">
            {input.reactor.numberOfChambers} шт. Ø{input.reactor.chamberDiameter}×{input.reactor.chamberHeight}м.<br />
            Цикл: {input.reactor.cycleTime} ч
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="text-blue-400 font-semibold mb-1">🗼 Ректификация</div>
          <div className="text-slate-400">
            {input.fractionation.numberOfTrays} тарелок.<br />
            Верх: {input.fractionation.topTemp}°C, Низ: {input.fractionation.bottomTemp}°C
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
          <div className="text-purple-400 font-semibold mb-1">♻ Рецикл</div>
          <div className="text-slate-400">
            Тяжёлый остаток колонны возвращается на вход печи.
            Коэфф. орошения: {input.fractionation.refluxRatio}
          </div>
        </div>
      </div>
    </div>
  );
}
