import { useState, useMemo, useCallback } from 'react';
import type { SimulationInput, SimulationResult, TabType } from './types';
import { runSimulation, defaultInput } from './simulation';
import InputPanel from './components/InputPanel';
import ResultsPanel from './components/ResultsPanel';
import ChartsPanel from './components/ChartsPanel';
import FlowsheetPanel from './components/FlowsheetPanel';
import ReportPanel from './components/ReportPanel';
import {
  Play,
  Settings,
  BarChart3,
  LineChart,
  Workflow,
  FileText,
  RotateCcw,
  Flame,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'input', label: 'Параметры', icon: <Settings size={16} /> },
  { id: 'results', label: 'Результаты', icon: <BarChart3 size={16} /> },
  { id: 'charts', label: 'Графики', icon: <LineChart size={16} /> },
  { id: 'flowsheet', label: 'Тех. схема', icon: <Workflow size={16} /> },
  { id: 'report', label: 'Отчёт', icon: <FileText size={16} /> },
];

const getFractionalComposition = (material: string) => {
  const compositions = {
    mazut: { gas: '5%', gasoline: '15%', diesel: '30%' },
    gudron: { gas: '2%', gasoline: '5%', diesel: '10%' },
    neft: { gas: '10%', gasoline: '25%', diesel: '35%' },
  };
  return compositions[material as keyof typeof compositions];
};

export default function App() {
  const [input, setInput] = useState<SimulationInput>(defaultInput);
  const [activeTab, setActiveTab] = useState<TabType>('input');
  const [hasRun, setHasRun] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [rawMaterial, setRawMaterial] = useState('mazut');
  const [steamRate, setSteamRate] = useState(0);
  const handleRun = useCallback(() => {
    setIsRunning(true);
    // Имитация вычислений
    setTimeout(() => {
      const res = runSimulation(input);
      setResult(res);
      setHasRun(true);
      setIsRunning(false);
      setActiveTab('results');
    }, 600);
  }, [input]);

  const handleReset = useCallback(() => {
    setInput(defaultInput);
    setResult(null);
    setHasRun(false);
    setActiveTab('input');
  }, []);

  // Быстрый предпросмотр выходов (без полного моделирования)
  const quickPreview = useMemo(() => {
    try {
      return runSimulation(input);
    } catch {
      return null;
    }
  }, [input]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Flame size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  УЗК <span className="text-amber-400">Simulator</span>
                </h1>
                <p className="text-xs text-slate-400">Моделирование установки замедленного коксования</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Статус */}
              {hasRun && result && (
                <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                  ${result.warnings.length > 0
                    ? 'bg-amber-900/30 text-amber-400 border border-amber-700/50'
                    : 'bg-emerald-900/30 text-emerald-400 border border-emerald-700/50'
                  }`}
                >
                  {result.warnings.length > 0
                    ? <><AlertCircle size={12} /> {result.warnings.length} предупр.</>
                    : <><CheckCircle2 size={12} /> OK</>
                  }
                </div>
              )}

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg
                           hover:bg-slate-700/50 transition-colors"
              >
                <RotateCcw size={14} />
                Сброс
              </button>

              <button
                onClick={handleRun}
                disabled={isRunning}
                className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500
                           text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20
                           hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                           text-sm"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Расчёт...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Рассчитать
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-3 -mb-px">
            {tabs.map((tab) => {
              const disabled = tab.id !== 'input' && !hasRun;
              return (
                <button
                  key={tab.id}
                  onClick={() => !disabled && setActiveTab(tab.id)}
                  disabled={disabled}
                  className={`flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-lg transition-all
                    ${activeTab === tab.id
                      ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-400'
                      : disabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InputPanel input={input} onChange={setInput} />
            </div>

            {/* Быстрый предпросмотр */}
            <div className="lg:col-span-1">
              <div className="sticky top-36 space-y-4">
                <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                    ⚡ Предпросмотр выходов
                  </h3>
                  {quickPreview && (
                    <div className="space-y-3">
                      {[
                        { label: 'Газ', value: quickPreview.yields.gas, color: 'bg-sky-500' },
                        { label: 'Бензин', value: quickPreview.yields.gasoline, color: 'bg-yellow-500' },
                        { label: 'Лёгкий ГО', value: quickPreview.yields.lightGasoil, color: 'bg-green-500' },
                        { label: 'Тяжёлый ГО', value: quickPreview.yields.heavyGasoil, color: 'bg-orange-500' },
                        { label: 'Кокс', value: quickPreview.yields.coke, color: 'bg-red-500' },
                        { label: 'Потери', value: quickPreview.yields.losses, color: 'bg-slate-500' },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                            <span>{item.label}</span>
                            <span className="text-white font-medium">{item.value}%</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${item.color} rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min(item.value * 2.5, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {quickPreview && quickPreview.warnings.length > 0 && (
                  <div className="bg-amber-900/20 border border-amber-700/50 rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-amber-400 mb-2">⚠ Предупреждения</h4>
                    {quickPreview.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-amber-300/70 mb-1">{w}</p>
                    ))}
                  </div>
                )}

                <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                    📐 Объём камеры
                  </h3>
                  <div className="text-2xl font-bold text-white">
                    {(
                      Math.PI *
                      Math.pow(input.reactor.chamberDiameter / 2, 2) *
                      input.reactor.chamberHeight
                    ).toFixed(0)}
                    <span className="text-sm font-normal text-slate-400 ml-1">м³</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ø{input.reactor.chamberDiameter} × H{input.reactor.chamberHeight} м
                  </p>
                </div>

                <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                    ⏱ Производительность
                  </h3>
                  <div className="text-2xl font-bold text-white">
                    {(input.feedstock.feedRate * 24 * 365 / 1000).toFixed(0)}
                    <span className="text-sm font-normal text-slate-400 ml-1">тыс. т/год</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    при загрузке {input.feedstock.feedRate} т/ч
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && result && <ResultsPanel result={result} />}
        {activeTab === 'charts' && result && <ChartsPanel result={result} />}
        {activeTab === 'flowsheet' && result && <FlowsheetPanel result={result} input={input} />}
        {activeTab === 'report' && result && <ReportPanel result={result} input={input} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-600">
          УЗК Simulator — Моделирование процесса замедленного коксования • Учебно-инженерный инструмент
        </div>
      </footer>
    </div>
  );
}
