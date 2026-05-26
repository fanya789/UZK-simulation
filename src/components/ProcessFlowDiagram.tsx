import React from 'react';
import type { SimulationResults, ProcessParameters } from '../data/simulationEngine';

interface Props {
  results: SimulationResults;
  params: ProcessParameters;
  feedstockName: string;
}

const ProcessFlowDiagram: React.FC<Props> = ({ results, params, feedstockName }) => {
  const { massBalance } = results;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 1200 700" className="w-full min-w-[900px]" style={{ maxHeight: '600px' }}>
        <defs>
          <marker id="arrowRight" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
          <marker id="arrowDown" markerWidth="7" markerHeight="10" refX="3.5" refY="10" orient="auto">
            <polygon points="0 0, 7 0, 3.5 10" fill="#3b82f6" />
          </marker>
          <marker id="arrowUp" markerWidth="7" markerHeight="10" refX="3.5" refY="0" orient="auto">
            <polygon points="0 10, 3.5 0, 7 10" fill="#ef4444" />
          </marker>
          <linearGradient id="furnaceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
          <linearGradient id="chamberGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          <linearGradient id="columnGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>

        {/* Background */}
        <rect width="1200" height="700" fill="#0f172a" rx="12" />

        {/* Title */}
        <text x="600" y="30" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="bold">
          Принципиальная технологическая схема УЗК
        </text>
        <text x="600" y="48" textAnchor="middle" fill="#94a3b8" fontSize="11">
          Сырьё: {feedstockName} | Расход: {params.feedRate} т/ч
        </text>

        {/* === СЫРЬЁ (вход) === */}
        <rect x="30" y="280" width="100" height="50" rx="8" fill="#1e40af" stroke="#60a5fa" strokeWidth="1.5" />
        <text x="80" y="300" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">Сырьё</text>
        <text x="80" y="315" textAnchor="middle" fill="#93c5fd" fontSize="9">{massBalance.feedIn} т/ч</text>
        <text x="80" y="325" textAnchor="middle" fill="#93c5fd" fontSize="8">I</text>

        {/* Линия от сырья к теплообменнику */}
        <line x1="130" y1="305" x2="160" y2="305" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowRight)" />

        {/* === ТЕПЛООБМЕННИК === */}
        <rect x="165" y="280" width="80" height="50" rx="6" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="205" y="298" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">Тепло-</text>
        <text x="205" y="310" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="bold">обменник</text>
        <text x="205" y="323" textAnchor="middle" fill="#7dd3fc" fontSize="8">Т={params.columnBottomTemp-10}°C</text>

        {/* Линия от теплообменника к колонне К-1 */}
        <line x1="245" y1="305" x2="280" y2="305" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowRight)" />

        {/* === КОЛОННА К-1 (Ректификационная) === */}
        <rect x="285" y="100" width="70" height="360" rx="10" fill="url(#columnGrad)" stroke="#60a5fa" strokeWidth="2" />
        <text x="320" y="125" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">К-1</text>
        <text x="320" y="140" textAnchor="middle" fill="#bfdbfe" fontSize="8">Ректифи-</text>
        <text x="320" y="152" textAnchor="middle" fill="#bfdbfe" fontSize="8">кационная</text>
        <text x="320" y="164" textAnchor="middle" fill="#bfdbfe" fontSize="8">колонна</text>

        {/* Полуглухая тарелка */}
        <line x1="290" y1="290" x2="350" y2="290" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4" />
        <text x="320" y="284" textAnchor="middle" fill="#fbbf24" fontSize="7">полуглухая</text>

        {/* Температуры на колонне */}
        <text x="320" y="190" textAnchor="middle" fill="#fca5a5" fontSize="8">Т верх={params.columnTopTemp}°C</text>
        <text x="320" y="440" textAnchor="middle" fill="#fca5a5" fontSize="8">Т низ={params.columnBottomTemp}°C</text>

        {/* === ТРУБЧАТАЯ ПЕЧЬ === */}
        <rect x="430" y="380" width="120" height="70" rx="8" fill="url(#furnaceGrad)" stroke="#f87171" strokeWidth="2" />
        <text x="490" y="405" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">Трубчатая</text>
        <text x="490" y="420" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">печь</text>
        <text x="490" y="438" textAnchor="middle" fill="#fecaca" fontSize="9">Т={params.furnaceOutletTemp}°C</text>

        {/* Водяной пар в печь */}
        <rect x="430" y="480" width="80" height="35" rx="5" fill="#164e63" stroke="#22d3ee" strokeWidth="1" />
        <text x="470" y="496" textAnchor="middle" fill="#cffafe" fontSize="8" fontWeight="bold">Водяной пар</text>
        <text x="470" y="508" textAnchor="middle" fill="#67e8f9" fontSize="7">{massBalance.steamIn.toFixed(1)} т/ч</text>
        <text x="470" y="518" textAnchor="middle" fill="#67e8f9" fontSize="7">IX</text>
        <line x1="470" y1="480" x2="470" y2="455" stroke="#22d3ee" strokeWidth="1.5" markerEnd="url(#arrowUp)" />

        {/* Линия от низа К-1 к печи */}
        <path d="M 355 430 L 380 430 L 380 415 L 430 415" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrowRight)" />
        <text x="390" y="408" fill="#94a3b8" fontSize="7">Вторичное сырьё</text>

        {/* Линия от печи к коксовым камерам */}
        <path d="M 550 415 L 610 415 L 610 300" fill="none" stroke="#f87171" strokeWidth="2.5" />

        {/* === КОКСОВЫЕ КАМЕРЫ === */}
        {/* Камера 1 */}
        <rect x="580" y="120" width="60" height="180" rx="8" fill="url(#chamberGrad)" stroke="#9ca3af" strokeWidth="2" />
        <text x="610" y="150" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Р-1</text>
        <text x="610" y="170" textAnchor="middle" fill="#d1d5db" fontSize="7">Коксовая</text>
        <text x="610" y="182" textAnchor="middle" fill="#d1d5db" fontSize="7">камера</text>
        <text x="610" y="200" textAnchor="middle" fill="#fbbf24" fontSize="8">P={params.chamberPressure} МПа</text>

        {/* Кокс в камере (заполнение) */}
        <rect x="584" y="220" width="52" height="76" rx="4" fill="#78350f" opacity="0.6" />
        <text x="610" y="265" textAnchor="middle" fill="#fbbf24" fontSize="8">Кокс</text>

        {/* Камера 2 */}
        <rect x="660" y="120" width="60" height="180" rx="8" fill="url(#chamberGrad)" stroke="#9ca3af" strokeWidth="2" />
        <text x="690" y="150" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Р-2</text>
        <text x="690" y="170" textAnchor="middle" fill="#d1d5db" fontSize="7">Коксовая</text>
        <text x="690" y="182" textAnchor="middle" fill="#d1d5db" fontSize="7">камера</text>

        {/* Подготовка */}
        <rect x="664" y="220" width="52" height="76" rx="4" fill="#1e3a5f" opacity="0.4" />
        <text x="690" y="265" textAnchor="middle" fill="#94a3b8" fontSize="7">Подготовка</text>

        {/* Пары из камер в К-1 */}
        <path d="M 580 140 L 520 140 L 520 250 L 355 250" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="6,3" markerEnd="url(#arrowRight)" />
        <text x="460" y="238" fill="#fca5a5" fontSize="7">Пары продуктов коксования</text>
        <text x="460" y="248" fill="#fca5a5" fontSize="7">VIII</text>

        {/* Выход кокса */}
        <line x1="610" y1="300" x2="610" y2="340" stroke="#a16207" strokeWidth="2" />
        <rect x="565" y="340" width="90" height="30" rx="5" fill="#78350f" stroke="#d97706" strokeWidth="1" />
        <text x="610" y="355" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">Кокс: {massBalance.cokeOut.toFixed(1)} т/ч</text>
        <text x="610" y="365" textAnchor="middle" fill="#fcd34d" fontSize="7">VII</text>

        {/* === ПРОДУКТЫ ИЗ КОЛОННЫ К-1 === */}

        {/* Газ + бензин сверху через сепаратор */}
        <line x1="320" y1="100" x2="320" y2="70" stroke="#3b82f6" strokeWidth="2" />
        <rect x="280" y="55" width="80" height="25" rx="5" fill="#1e3a5f" stroke="#38bdf8" strokeWidth="1" />
        <text x="320" y="71" textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="bold">Сепаратор С-1</text>

        {/* К абсорберу К-4 */}
        <line x1="360" y1="67" x2="820" y2="67" stroke="#3b82f6" strokeWidth="1.5" />

        {/* === К-2 (отпарная колонна - легкий газойль) === */}
        <rect x="180" y="170" width="50" height="90" rx="6" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
        <text x="205" y="195" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">К-2</text>
        <text x="205" y="210" textAnchor="middle" fill="#bfdbfe" fontSize="7">Отпарная</text>
        <line x1="285" y1="210" x2="230" y2="210" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Выход легкого газойля */}
        <line x1="180" y1="215" x2="100" y2="215" stroke="#22c55e" strokeWidth="1.5" markerEnd="url(#arrowRight)" />
        <rect x="30" y="200" width="75" height="30" rx="5" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
        <text x="67" y="213" textAnchor="middle" fill="#86efac" fontSize="8" fontWeight="bold">Лёгкий г/о</text>
        <text x="67" y="224" textAnchor="middle" fill="#86efac" fontSize="7">{massBalance.lightGasOilOut.toFixed(1)} т/ч (III)</text>

        {/* === К-3 (отпарная колонна - тяжёлый газойль) === */}
        <rect x="180" y="350" width="50" height="90" rx="6" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.5" />
        <text x="205" y="375" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">К-3</text>
        <text x="205" y="390" textAnchor="middle" fill="#bfdbfe" fontSize="7">Отпарная</text>
        <line x1="285" y1="390" x2="230" y2="390" stroke="#3b82f6" strokeWidth="1.5" />
        {/* Выход тяжёлого газойля */}
        <line x1="180" y1="395" x2="100" y2="395" stroke="#eab308" strokeWidth="1.5" markerEnd="url(#arrowRight)" />
        <rect x="30" y="380" width="75" height="30" rx="5" fill="#422006" stroke="#eab308" strokeWidth="1" />
        <text x="67" y="393" textAnchor="middle" fill="#fde047" fontSize="8" fontWeight="bold">Тяжёлый г/о</text>
        <text x="67" y="404" textAnchor="middle" fill="#fde047" fontSize="7">{massBalance.heavyGasOilOut.toFixed(1)} т/ч (IV)</text>

        {/* === К-4 Фракционирующий абсорбер === */}
        <rect x="820" y="40" width="55" height="160" rx="8" fill="#7c3aed" stroke="#a78bfa" strokeWidth="1.5" />
        <text x="847" y="65" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">К-4</text>
        <text x="847" y="80" textAnchor="middle" fill="#c4b5fd" fontSize="7">Абсорбер</text>

        {/* Сухой газ из К-4 */}
        <line x1="847" y1="40" x2="847" y2="15" stroke="#f87171" strokeWidth="1.5" />
        <rect x="810" y="3" width="75" height="20" rx="4" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
        <text x="847" y="16" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="bold">Сухой газ (VI)</text>

        {/* Нестабильный бензин из К-4 к К-5 */}
        <line x1="847" y1="200" x2="847" y2="250" stroke="#3b82f6" strokeWidth="1.5" />

        {/* === К-5 Стабилизация бензина === */}
        <rect x="820" y="255" width="55" height="140" rx="8" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="847" y="280" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">К-5</text>
        <text x="847" y="295" textAnchor="middle" fill="#bae6fd" fontSize="7">Стабили-</text>
        <text x="847" y="307" textAnchor="middle" fill="#bae6fd" fontSize="7">зация</text>

        {/* Головка стабилизации (пропан-бутан) */}
        <line x1="875" y1="280" x2="950" y2="280" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#arrowRight)" />
        <rect x="955" y="265" width="95" height="30" rx="4" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
        <text x="1002" y="279" textAnchor="middle" fill="#fbbf24" fontSize="8" fontWeight="bold">Головка стаб.</text>
        <text x="1002" y="290" textAnchor="middle" fill="#fbbf24" fontSize="7">{massBalance.gasOut.toFixed(1)} т/ч (V)</text>

        {/* Стабильный бензин */}
        <line x1="847" y1="395" x2="847" y2="430" stroke="#22c55e" strokeWidth="1.5" />
        <rect x="800" y="435" width="95" height="30" rx="5" fill="#052e16" stroke="#22c55e" strokeWidth="1" />
        <text x="847" y="449" textAnchor="middle" fill="#86efac" fontSize="8" fontWeight="bold">Стаб. бензин</text>
        <text x="847" y="460" textAnchor="middle" fill="#86efac" fontSize="7">{massBalance.gasolineOut.toFixed(1)} т/ч (II)</text>

        {/* === ДОПОЛНИТЕЛЬНЫЕ ОБОЗНАЧЕНИЯ === */}

        {/* Время коксования */}
        <rect x="570" y="390" width="100" height="35" rx="5" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
        <text x="620" y="406" textAnchor="middle" fill="#a5b4fc" fontSize="8">Время цикла:</text>
        <text x="620" y="419" textAnchor="middle" fill="#c7d2fe" fontSize="9" fontWeight="bold">{params.cokingTime} ч</text>

        {/* Рециркуляция */}
        <path d="M 490 380 L 490 350 L 400 350 L 400 410 L 430 410" fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="4,2" />
        <text x="445" y="345" fill="#fdba74" fontSize="7">Рецикл: {(params.recycleRatio*100).toFixed(0)}%</text>

        {/* Показатели справа */}
        <rect x="960" y="90" width="220" height="160" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <text x="1070" y="112" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">Материальный баланс</text>
        <line x1="970" y1="120" x2="1170" y2="120" stroke="#334155" strokeWidth="1" />

        <text x="975" y="137" fill="#94a3b8" fontSize="8">Газ + головка:</text>
        <text x="1150" y="137" textAnchor="end" fill="#fca5a5" fontSize="9" fontWeight="bold">{massBalance.gasOut.toFixed(1)} т/ч</text>

        <text x="975" y="153" fill="#94a3b8" fontSize="8">Бензин:</text>
        <text x="1150" y="153" textAnchor="end" fill="#86efac" fontSize="9" fontWeight="bold">{massBalance.gasolineOut.toFixed(1)} т/ч</text>

        <text x="975" y="169" fill="#94a3b8" fontSize="8">Лёгкий газойль:</text>
        <text x="1150" y="169" textAnchor="end" fill="#86efac" fontSize="9" fontWeight="bold">{massBalance.lightGasOilOut.toFixed(1)} т/ч</text>

        <text x="975" y="185" fill="#94a3b8" fontSize="8">Тяжёлый газойль:</text>
        <text x="1150" y="185" textAnchor="end" fill="#fde047" fontSize="9" fontWeight="bold">{massBalance.heavyGasOilOut.toFixed(1)} т/ч</text>

        <text x="975" y="201" fill="#94a3b8" fontSize="8">Кокс:</text>
        <text x="1150" y="201" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="bold">{massBalance.cokeOut.toFixed(1)} т/ч</text>

        <text x="975" y="217" fill="#94a3b8" fontSize="8">Потери + пар:</text>
        <text x="1150" y="217" textAnchor="end" fill="#6b7280" fontSize="9">{massBalance.lossesOut.toFixed(1)} т/ч</text>

        <line x1="970" y1="225" x2="1170" y2="225" stroke="#334155" strokeWidth="1" />
        <text x="975" y="242" fill="#e2e8f0" fontSize="9" fontWeight="bold">ИТОГО:</text>
        <text x="1150" y="242" textAnchor="end" fill="#e2e8f0" fontSize="10" fontWeight="bold">{massBalance.totalOut.toFixed(1)} т/ч</text>

        {/* Легенда потоков */}
        <rect x="960" y="500" width="220" height="170" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
        <text x="1070" y="520" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="bold">Обозначения потоков</text>
        <line x1="970" y1="528" x2="1170" y2="528" stroke="#334155" strokeWidth="1" />
        {[
          { label: 'I — Сырьё', color: '#60a5fa' },
          { label: 'II — Стабильный бензин', color: '#86efac' },
          { label: 'III — Лёгкий газойль', color: '#86efac' },
          { label: 'IV — Тяжёлый газойль', color: '#fde047' },
          { label: 'V — Головка стабилизации', color: '#fbbf24' },
          { label: 'VI — Сухой газ', color: '#fca5a5' },
          { label: 'VII — Кокс', color: '#fcd34d' },
          { label: 'VIII — Пары отпарки камер', color: '#fca5a5' },
          { label: 'IX — Водяной пар', color: '#67e8f9' },
        ].map((item, i) => (
          <React.Fragment key={i}>
            <rect x="975" y={535 + i * 15} width="8" height="8" fill={item.color} rx="2" />
            <text x="990" y={543 + i * 15} fill="#cbd5e1" fontSize="8">{item.label}</text>
          </React.Fragment>
        ))}
      </svg>
    </div>
  );
};

export default ProcessFlowDiagram;
