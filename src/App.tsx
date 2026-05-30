import { useState, useCallback, useEffect, useRef } from 'react';
import ParametersPanel from './components/ParametersPanel';
import ProcessFlowDiagram from './components/ProcessFlowDiagram';
import ResultsPanel from './components/ResultsPanel';
import FractionPanel from './components/FractionPanel';
import BalancePanel from './components/BalancePanel';
import ExportButton from './components/ExportButton';
import { feedstockDatabase, getDefaultFeedstock } from './data/feedstockData';
import type { FeedstockProperties } from './data/feedstockData';
import { runSimulation, getDefaultParams } from './data/simulationEngine';
import type { ProcessParameters, SimulationResults, EconomicsResult, EcologyResult } from './data/simulationEngine';
import { calculateEconomics, calculateEcology } from './data/simulationEngine';
import FurnaceCoilPanel from './components/FurnaceCoilPanel';
import ChamberHeatBalancePanel from './components/ChamberHeatBalancePanel';
import GasFractionationPanel from './components/GasFractionationPanel';
import GasDeepProcessingPanel from './components/GasDeepProcessingPanel';
import NeuralPredictorPanel from './components/NeuralPredictorPanel';
import EconomicsPanel from './components/EconomicsPanel';
import EcologyPanel from './components/EcologyPanel';
import FeedstockEditorModal from './components/FeedstockEditorModal';

type TabId = 'params' | 'scheme' | 'furnace' | 'chamber' | 'results' | 'fractions' | 'balance' | 'gasfrac' | 'gasdeep' | 'neural' | 'economics' | 'ecology';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const tabs: Tab[] = [
  { id: 'params', label: 'Параметры', icon: '⚙️' },
  { id: 'scheme', label: 'Схема', icon: '🔧' },
  { id: 'furnace', label: 'Печь', icon: '🔥' },
  { id: 'chamber', label: 'Камера', icon: '🏭' },
  { id: 'results', label: 'Результаты', icon: '📊' },
  { id: 'fractions', label: 'Фракционный состав', icon: '🧪' },
  { id: 'balance', label: 'Балансы', icon: '⚖️' },
  { id: 'gasfrac', label: 'Газофракционирование', icon: '🧪' },
  { id: 'gasdeep', label: 'Глубокая переработка', icon: '⚙️' },
  { id: 'neural', label: 'Нейросеть', icon: '🧠' },
  { id: 'economics', label: 'Экономика', icon: '💰' },
  { id: 'ecology', label: 'Экология', icon: '🌍' },
];

// Функции для работы с URL (без изменений)
function encodeParamsToURL(params: ProcessParameters, feedstockId: string, tab: TabId): string {
  const urlParams = new URLSearchParams();
  urlParams.set('feed', feedstockId);
  urlParams.set('tab', tab);
  Object.entries(params).forEach(([key, value]) => {
    urlParams.set(key, String(value));
  });
  return urlParams.toString();
}

function getInitialStateFromURL(): { params: ProcessParameters; feedstockId: string; tab: TabId } | null {
  const urlParams = new URLSearchParams(window.location.search);
  if (!urlParams.has('feed')) return null;
  try {
    const params = getDefaultParams();
    for (const key of Object.keys(params) as (keyof ProcessParameters)[]) {
      const val = urlParams.get(key);
      if (val !== null) {
        const num = parseFloat(val);
        if (!isNaN(num)) (params as any)[key] = num;
      }
    }
    const feedstockId = urlParams.get('feed') || getDefaultFeedstock().id;
    const tab = (urlParams.get('tab') as TabId) || 'params';
    return { params, feedstockId, tab };
  } catch {
    return null;
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('params');
  const [params, setParams] = useState<ProcessParameters>(getDefaultParams());
  const [selectedFeedstock, setSelectedFeedstock] = useState<FeedstockProperties>(getDefaultFeedstock());
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasSimulated, setHasSimulated] = useState(false);
  const [economics, setEconomics] = useState<EconomicsResult | null>(null);
  const [ecology, setEcology] = useState<EcologyResult | null>(null);
  const debounceTimer = useRef<number | null>(null);

  const performSimulation = useCallback((feed: FeedstockProperties, procParams: ProcessParameters) => {
    setIsSimulating(true);
    setTimeout(() => {
      const res = runSimulation(feed, procParams);
      setResults(res);
      setIsSimulating(false);
      setHasSimulated(true);
    }, 300);
  }, []);

  const debouncedSimulation = useCallback((feed: FeedstockProperties, procParams: ProcessParameters) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(() => {
      performSimulation(feed, procParams);
    }, 500);
  }, [performSimulation]);

  const handleParamsChange = useCallback((newParams: ProcessParameters) => {
    setParams(newParams);
    debouncedSimulation(selectedFeedstock, newParams);
  }, [selectedFeedstock, debouncedSimulation]);

  const handleFeedstockChange = useCallback((feed: FeedstockProperties) => {
    setSelectedFeedstock(feed);
    debouncedSimulation(feed, params);
  }, [params, debouncedSimulation]);

  const resetToDefault = useCallback(() => {
    const defaultParams = getDefaultParams();
    const defaultFeed = getDefaultFeedstock();
    setParams(defaultParams);
    setSelectedFeedstock(defaultFeed);
    performSimulation(defaultFeed, defaultParams);
    setActiveTab('params');
  }, [performSimulation]);

  useEffect(() => {
    const urlState = getInitialStateFromURL();
    if (urlState) {
      const feed = feedstockDatabase.find(f => f.id === urlState.feedstockId) || getDefaultFeedstock();
      setParams(urlState.params);
      setSelectedFeedstock(feed);
      setActiveTab(urlState.tab);
      performSimulation(feed, urlState.params);
    } else {
      performSimulation(selectedFeedstock, params);
    }
  }, []);

  useEffect(() => {
    const url = encodeParamsToURL(params, selectedFeedstock.id, activeTab);
    window.history.replaceState(null, '', `?${url}`);
  }, [params, selectedFeedstock, activeTab]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  useEffect(() => {
    if (results) {
      const feedRate_kg_s = params.feedRate * 1000 / 3600;
      const econ = calculateEconomics(selectedFeedstock.name, feedRate_kg_s, results.yields, results.keyIndicators);
      setEconomics(econ);
      const ecol = calculateEcology(feedRate_kg_s, results.yields, params, 0);
      setEcology(ecol);
    }
  }, [results, params, selectedFeedstock]);
  const [userFeedstocks, setUserFeedstocks] = useState<FeedstockProperties[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddCustomFeedstock = (newFeedstock: FeedstockProperties) => {
    setUserFeedstocks(prev => [...prev, newFeedstock]);
    // автоматически выбрать новое сырьё
    setSelectedFeedstock(newFeedstock);
    debouncedSimulation(newFeedstock, params);
  };
  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
        {/* Header (без изменений) */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-[1600px] mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-900/30">
                  УЗК
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Моделирование УЗК
                  </h1>
                  <p className="text-xs text-slate-500">Установка замедленного коксования</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton results={results} params={params} feedstockName={selectedFeedstock.name} />
                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
                  Сырьё: <span className="text-slate-300">{selectedFeedstock.name}</span>
                </span>
                  {hasSimulated && results && (
                      <span className="px-2 py-1 rounded bg-emerald-900/40 border border-emerald-800 text-emerald-400">
                    ✓ Моделирование выполнено
                  </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Основной контейнер с flex-адаптацией: меню + контент */}
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Боковое меню (вертикальное на lg+, горизонтальное на маленьких) */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden sticky top-20">
                <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible p-2 gap-1">
                  {tabs.map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${activeTab === tab.id
                              ? 'bg-blue-600/20 text-blue-400 border-l-4 border-blue-400 lg:border-l-4 lg:border-b-0 shadow-md'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                          }
                    `}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span className="hidden lg:inline">{tab.label}</span>
                        <span className="lg:hidden">{tab.label}</span>
                      </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Основной контент */}
            <div className="flex-1 min-w-0">
              {isSimulating && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-lg font-semibold text-blue-400">Выполняется моделирование...</p>
                      <p className="text-sm text-slate-500 mt-1">Расчёт параметров УЗК</p>
                    </div>
                  </div>
              )}

              {activeTab === 'params' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <ParametersPanel
                          params={params}
                          setParams={handleParamsChange}
                          selectedFeedstock={selectedFeedstock}
                          setSelectedFeedstock={handleFeedstockChange}
                          onSimulate={() => performSimulation(selectedFeedstock, params)}
                          onReset={resetToDefault}
                          userFeedstocks={userFeedstocks}
                          onAddCustomFeedstock={() => setIsModalOpen(true)}
                      />
                      <FeedstockEditorModal
                          isOpen={isModalOpen}
                          onClose={() => setIsModalOpen(false)}
                          onSave={handleAddCustomFeedstock}
                      />
                    </div>
                    <div className="space-y-4">
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">📝 О процессе</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong>Замедленное коксование</strong> — термический крекинг тяжёлых нефтяных остатков,
                          проводимый при 470–510°C и давлении 0.17–0.6 МПа. Сырьё нагревается в трубчатой печи
                          и подаётся в необогреваемые коксовые камеры, где за счёт тепла сырья происходят реакции
                          крекинга, дегидрирования, циклизации и поликонденсации.
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed mt-2">
                          Продукты: <strong>кокс</strong> (в камерах), а также газ, бензин, лёгкий и тяжёлый газойли
                          (выводятся через ректификационную колонну К-1). Цикл работы камеры ~ 48 ч.
                        </p>
                      </div>
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">🏭 Оборудование УЗК</h3>
                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">●</span>
                            <div><strong className="text-slate-300">Трубчатая печь</strong> — нагрев вторичного сырья до 490-510°C. Подача водяного пара.</div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-amber-400 mt-0.5">●</span>
                            <div><strong className="text-slate-300">Коксовые камеры Р-1..Р-4</strong> — реакторы коксования, d=7м, h=30м. Работают циклически.</div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">●</span>
                            <div><strong className="text-slate-300">Колонна К-1</strong> — основная ректификационная. Разделение продуктов коксования.</div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">●</span>
                            <div><strong className="text-slate-300">К-2, К-3</strong> — отпарные колонны для вывода лёгкого и тяжёлого газойлей.</div>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-purple-400 mt-0.5">●</span>
                            <div><strong className="text-slate-300">К-4</strong> — фракционирующий абсорбер. К-5 — стабилизация бензина.</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">📋 Сравнение сырья</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px]">
                            <thead>
                            <tr className="text-slate-500 border-b border-slate-700">
                              <th className="text-left py-1">Сырьё</th>
                              <th className="text-right py-1">ρ</th>
                              <th className="text-right py-1">Кокс.%</th>
                              <th className="text-right py-1">S,%</th>
                            </tr>
                            </thead>
                            <tbody>
                            {feedstockDatabase.map(f => (
                                <tr
                                    key={f.id}
                                    className={`border-b border-slate-800 cursor-pointer transition-colors ${
                                        f.id === selectedFeedstock.id ? 'bg-blue-900/30 text-blue-300' : 'text-slate-400 hover:bg-slate-700/30'
                                    }`}
                                    onClick={() => handleFeedstockChange(f)}
                                >
                                  <td className="py-1 truncate max-w-[120px]">{f.name}</td>
                                  <td className="text-right">{f.density}</td>
                                  <td className="text-right">{f.cokability}</td>
                                  <td className="text-right">{f.sulfur}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
              )}

              {activeTab === 'scheme' && results && (
                  <div>
                    <ProcessFlowDiagram
                        results={results}
                        params={params}
                        feedstockName={selectedFeedstock.name}
                    />
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Т печи', value: `${params.furnaceOutletTemp}°C`, color: 'text-red-400', bg: 'bg-red-900/20 border-red-800' },
                        { label: 'P камеры', value: `${params.chamberPressure} МПа`, color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800' },
                        { label: 'Расход', value: `${params.feedRate} т/ч`, color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800' },
                        { label: 'Пар', value: `${params.steamRate}%`, color: 'text-cyan-400', bg: 'bg-cyan-900/20 border-cyan-800' },
                        { label: 'Рецикл', value: `${(params.recycleRatio*100).toFixed(0)}%`, color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800' },
                      ].map(item => (
                          <div key={item.label} className={`rounded-xl p-3 border text-center ${item.bg}`}>
                            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
                            <div className="text-xs text-slate-500">{item.label}</div>
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {activeTab === 'results' && results && <ResultsPanel results={results} />}
              {activeTab === 'fractions' && results && <FractionPanel fractions={results.fractions} />}
              {activeTab === 'balance' && results && <BalancePanel results={results} />}
              {activeTab === 'furnace' && <FurnaceCoilPanel />}
              {activeTab === 'chamber' && results && (
                  <ChamberHeatBalancePanel
                      results={results}
                      params={params}
                      feedstock={selectedFeedstock}
                  />
              )}
              {activeTab === 'gasfrac' && <GasFractionationPanel fatGasFlow_kg_h={results?.massBalance.gasOut ? results.massBalance.gasOut * 1000 : 5000} />}
              {activeTab === 'gasdeep' && (
                  <GasDeepProcessingPanel
                      fatGasFlow_kg_h={results?.massBalance.gasOut ? results.massBalance.gasOut * 1000 : 5000}
                  />
              )}
              {activeTab === 'neural' && <NeuralPredictorPanel />}
              {activeTab === 'economics' && <EconomicsPanel economics={economics} feedRate_tph={params.feedRate} />}
              {activeTab === 'ecology' && <EcologyPanel ecology={ecology} />}

              {!results && activeTab !== 'params' && (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">🔬</div>
                    <h2 className="text-xl font-bold text-slate-400">Моделирование не выполнено</h2>
                    <p className="text-sm text-slate-500 mt-2">
                      Перейдите на вкладку «Параметры» и нажмите «Запустить моделирование»
                    </p>
                    <button
                        onClick={() => setActiveTab('params')}
                        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      Перейти к параметрам
                    </button>
                  </div>
              )}
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-800 bg-slate-900/50 py-4 mt-8">
          <div className="max-w-[1600px] mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-600">
            <span>УЗК — Моделирование установки замедленного коксования</span>
            <span>Автор - Арасака Дмитрий Сабурович</span>
          </div>
        </footer>
      </div>
  );
}

export default App;