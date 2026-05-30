import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import {
    generateTrainingData, TrainingSample, runSimulation, normalizeData, NormalizationParams,
} from '../data/simulationEngine';
import { getDefaultFeedstock } from '../data/feedstockData';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const targetOptions = [
    { id: 'coke', label: 'Выход кокса, %' },
    { id: 'lightProducts', label: 'Выход светлых, %' },
    { id: 'conversion', label: 'Глубина конверсии, %' },
    { id: 'gasoline', label: 'Бензин, %' },
    { id: 'lightGasOil', label: 'Лёгкий газойль, %' },
    { id: 'heavyGasOil', label: 'Тяжёлый газойль, %' },
];

const NeuralPredictorPanel: React.FC = () => {
    const [model, setModel] = useState<tf.Sequential | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [stopTraining, setStopTraining] = useState(false);
    const [trainingProgress, setTrainingProgress] = useState('');
    const [selectedTargets, setSelectedTargets] = useState<string[]>(['coke', 'lightProducts', 'conversion']);
    const [inputNormParams, setInputNormParams] = useState<NormalizationParams | null>(null);
    const [outputNormParams, setOutputNormParams] = useState<NormalizationParams | null>(null);
    const [trainingData, setTrainingData] = useState<TrainingSample[]>([]);
    const [historyData, setHistoryData] = useState<{ epoch: number; loss: number; valLoss: number }[]>([]);
    const [currentEpoch, setCurrentEpoch] = useState(0);
    const [totalEpochs] = useState(200);

    const [params, setParams] = useState({
        feedRate: 100,
        furnaceTemp: 500,
        chamberPressure: 0.35,
        steamRate: 3,
        recycleRatio: 0.1,
    });

    const [prediction, setPrediction] = useState<{ mean: number[]; std: number[] } | null>(null);
    const [exactValues, setExactValues] = useState<number[] | null>(null);
    const [sensitivityData, setSensitivityData] = useState<any[]>([]);
    const [sensitivityParam, setSensitivityParam] = useState<string>('furnaceTemp');
    const [sensitivityTarget, setSensitivityTarget] = useState<string>('coke');

    // Генерация данных
    const generateDataset = async (samples: number = 500) => {
        const feedstock = getDefaultFeedstock();
        const data = generateTrainingData(feedstock, samples);
        setTrainingData(data);
        return data;
    };

    // Создание одной модели
    const createModel = (inputDim: number, outputDim: number): tf.Sequential => {
        const m = tf.sequential();
        m.add(tf.layers.dense({ inputShape: [inputDim], units: 48, activation: 'relu', kernelInitializer: 'glorotNormal' }));
        m.add(tf.layers.batchNormalization());
        m.add(tf.layers.dropout({ rate: 0.2 }));
        m.add(tf.layers.dense({ units: 32, activation: 'relu' }));
        m.add(tf.layers.batchNormalization());
        m.add(tf.layers.dropout({ rate: 0.2 }));
        m.add(tf.layers.dense({ units: 24, activation: 'relu' }));
        m.add(tf.layers.dense({ units: outputDim, activation: 'linear' }));
        m.compile({ optimizer: tf.train.adam(0.001), loss: 'meanSquaredError', metrics: ['mae'] });
        return m;
    };

    // Обучение с прогрессом и возможностью остановки
    const trainModel = async () => {
        setIsTraining(true);
        setStopTraining(false);
        setTrainingProgress('Генерация данных...');
        let data = trainingData;
        if (data.length === 0) data = await generateDataset(600);

        // Подготовка входов/выходов
        const inputs = data.map(s => s.inputs);
        const outputIndices = selectedTargets.map(t => {
            switch (t) {
                case 'coke': return 0;
                case 'lightProducts': return 1;
                case 'conversion': return 2;
                case 'gasoline': return 3;
                case 'lightGasOil': return 4;
                case 'heavyGasOil': return 5;
                default: return 0;
            }
        });
        const outputs = data.map(s => outputIndices.map(idx => s.outputs[idx]));

        // Нормализация
        const { normalized: normInputs, params: inParams } = normalizeData(inputs);
        const { normalized: normOutputs, params: outParams } = normalizeData(outputs);
        setInputNormParams(inParams);
        setOutputNormParams(outParams);

        // Разделение
        const splitIdx = Math.floor(normInputs.length * 0.8);
        const xTrain = tf.tensor2d(normInputs.slice(0, splitIdx));
        const yTrain = tf.tensor2d(normOutputs.slice(0, splitIdx));
        const xVal = tf.tensor2d(normInputs.slice(splitIdx));
        const yVal = tf.tensor2d(normOutputs.slice(splitIdx));

        const newModel = createModel(5, selectedTargets.length);
        setModel(newModel);
        setHistoryData([]);

        setTrainingProgress('Обучение модели...');
        for (let epoch = 0; epoch < totalEpochs; epoch++) {
            if (stopTraining) break;
            setCurrentEpoch(epoch + 1);
            const history = await newModel.fit(xTrain, yTrain, {
                epochs: 1,
                batchSize: 32,
                validationData: [xVal, yVal],
                verbose: 0,
            });
            const loss = history.history.loss[0];
            const valLoss = history.history.val_loss[0];
            setTrainingProgress(`Эпоха ${epoch+1}/${totalEpochs}, loss: ${loss.toFixed(4)}, val_loss: ${valLoss.toFixed(4)}`);
            setHistoryData(prev => [...prev, { epoch: epoch+1, loss, valLoss }]);
            await tf.nextFrame(); // не блокируем UI
        }

        setTrainingProgress(stopTraining ? 'Обучение остановлено' : 'Обучение завершено!');
        setIsTraining(false);

        xTrain.dispose(); yTrain.dispose(); xVal.dispose(); yVal.dispose();
    };

    // MC Dropout прогноз (10 прогонов с активным dropout)
    const predictWithUncertainty = (input: number[][]): { mean: number[]; std: number[] } => {
        if (!model || !inputNormParams || !outputNormParams) return { mean: [], std: [] };
        const normInput = input.map(row => row.map((v, i) => (v - inputNormParams.mean[i]) / inputNormParams.std[i]));
        const inputTensor = tf.tensor2d(normInput);
        const nRuns = 15;
        const allPredictions: number[][] = [];
        for (let i = 0; i < nRuns; i++) {
            const predTensor = model.predict(inputTensor) as tf.Tensor;
            const pred = predTensor.arraySync() as number[][];
            allPredictions.push(pred[0]);
            predTensor.dispose();
        }
        inputTensor.dispose();
        const mean = allPredictions[0].map((_, idx) => allPredictions.reduce((sum, p) => sum + p[idx], 0) / nRuns);
        const std = allPredictions[0].map((_, idx) => {
            const avg = mean[idx];
            const variance = allPredictions.reduce((sum, p) => sum + Math.pow(p[idx] - avg, 2), 0) / nRuns;
            return Math.sqrt(variance);
        });
        // Денормализация
        const denormMean = mean.map((v, i) => v * outputNormParams.std[i] + outputNormParams.mean[i]);
        const denormStd = std.map((v, i) => v * outputNormParams.std[i]);
        return { mean: denormMean, std: denormStd };
    };

    const predict = () => {
        if (!model) return;
        const input = [[params.feedRate, params.furnaceTemp, params.chamberPressure, params.steamRate, params.recycleRatio]];
        const { mean, std } = predictWithUncertainty(input);
        setPrediction({ mean, std });

        const feedstock = getDefaultFeedstock();
        const exact = runSimulation(feedstock, {
            feedRate: params.feedRate,
            furnaceOutletTemp: params.furnaceTemp,
            chamberPressure: params.chamberPressure,
            steamRate: params.steamRate,
            recycleRatio: params.recycleRatio,
            columnTopTemp: 110,
            columnBottomTemp: 390,
            cokingTime: 24,
            steamToPipeTemp: 400,
        });
        const exactTargets = selectedTargets.map(t => {
            switch (t) {
                case 'coke': return exact.yields.coke;
                case 'lightProducts': return exact.keyIndicators.lightProductsYield;
                case 'conversion': return exact.keyIndicators.conversionDepth;
                case 'gasoline': return exact.yields.gasoline;
                case 'lightGasOil': return exact.yields.lightGasOil;
                case 'heavyGasOil': return exact.yields.heavyGasOil;
                default: return 0;
            }
        });
        setExactValues(exactTargets);
    };

    const computeSensitivity = () => {
        if (!model || !inputNormParams || !outputNormParams) return;
        let min = 0, max = 0, step = 0;
        switch (sensitivityParam) {
            case 'feedRate': min = 50; max = 200; step = 10; break;
            case 'furnaceTemp': min = 470; max = 520; step = 5; break;
            case 'chamberPressure': min = 0.15; max = 0.6; step = 0.05; break;
            case 'steamRate': min = 0.5; max = 8; step = 0.5; break;
            case 'recycleRatio': min = 0; max = 0.3; step = 0.02; break;
            default: return;
        }
        const targetIdx = selectedTargets.indexOf(sensitivityTarget);
        if (targetIdx === -1) return;
        const data = [];
        for (let val = min; val <= max + 0.001; val += step) {
            const tempParams = { ...params, [sensitivityParam]: val };
            const input = [[tempParams.feedRate, tempParams.furnaceTemp, tempParams.chamberPressure, tempParams.steamRate, tempParams.recycleRatio]];
            const { mean } = predictWithUncertainty(input);
            data.push({ x: val, y: mean[targetIdx] });
        }
        setSensitivityData(data);
    };

    const addCurrentSample = () => {
        if (!exactValues) return;
        const newSample: TrainingSample = {
            inputs: [params.feedRate, params.furnaceTemp, params.chamberPressure, params.steamRate, params.recycleRatio],
            outputs: exactValues,
        };
        setTrainingData(prev => [...prev, newSample]);
        alert('Текущий режим добавлен в выборку. Для дообучения нажмите «Дообучить».');
    };

    const fineTune = async () => {
        if (!model || trainingData.length === 0) return;
        setIsTraining(true);
        setStopTraining(false);
        setTrainingProgress('Дообучение модели...');
        const inputs = trainingData.map(s => s.inputs);
        const outputIndices = selectedTargets.map(t => {
            switch (t) {
                case 'coke': return 0; case 'lightProducts': return 1; case 'conversion': return 2;
                case 'gasoline': return 3; case 'lightGasOil': return 4; case 'heavyGasOil': return 5;
                default: return 0;
            }
        });
        const outputs = trainingData.map(s => outputIndices.map(idx => s.outputs[idx]));
        const { normalized: normInputs } = normalizeData(inputs, inputNormParams);
        const { normalized: normOutputs } = normalizeData(outputs, outputNormParams);
        const xTrain = tf.tensor2d(normInputs);
        const yTrain = tf.tensor2d(normOutputs);
        for (let epoch = 0; epoch < 30; epoch++) {
            if (stopTraining) break;
            await model.fit(xTrain, yTrain, { epochs: 1, batchSize: 32, verbose: 0 });
            setTrainingProgress(`Дообучение: эпоха ${epoch+1}/30`);
            await tf.nextFrame();
        }
        setTrainingProgress('Дообучение завершено');
        setIsTraining(false);
        xTrain.dispose(); yTrain.dispose();
    };

    const exportModel = async () => {
        if (!model) return;
        await model.save('downloads://uzk-model');
        alert('Модель экспортирована.');
    };

    const importModel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const loaded = await tf.loadLayersModel(tf.io.browserFiles([file]));
        setModel(loaded as tf.Sequential);
        alert('Модель загружена.');
    };

    useEffect(() => {
        if (sensitivityParam && sensitivityTarget && model) computeSensitivity();
    }, [sensitivityParam, sensitivityTarget, params, model]);

    return (
        <div className="space-y-6">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-green-400 mb-2">🧠 Нейросетевой предиктор (MC Dropout)</h3>
                <p className="text-xs text-slate-400 mb-4">Одна модель, обучение 30–60 секунд, доверительный интервал через 15 прогонов с dropout.</p>

                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Целевые переменные</label>
                    <div className="flex flex-wrap gap-2">
                        {targetOptions.map(opt => (
                            <label key={opt.id} className="flex items-center gap-1 text-sm">
                                <input type="checkbox" checked={selectedTargets.includes(opt.id)} onChange={(e) => {
                                    if (e.target.checked) setSelectedTargets(prev => [...prev, opt.id]);
                                    else setSelectedTargets(prev => prev.filter(t => t !== opt.id));
                                }} className="accent-blue-500" />
                                {opt.label}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <ParamSlider label="Расход сырья, т/ч" value={params.feedRate} min={50} max={200} step={1} onChange={(v) => setParams(p => ({ ...p, feedRate: v }))} />
                    <ParamSlider label="Температура печи, °C" value={params.furnaceTemp} min={470} max={520} step={1} onChange={(v) => setParams(p => ({ ...p, furnaceTemp: v }))} />
                    <ParamSlider label="Давление в камере, МПа" value={params.chamberPressure} min={0.15} max={0.6} step={0.01} onChange={(v) => setParams(p => ({ ...p, chamberPressure: v }))} />
                    <ParamSlider label="Расход пара, %" value={params.steamRate} min={0.5} max={8} step={0.1} onChange={(v) => setParams(p => ({ ...p, steamRate: v }))} />
                    <ParamSlider label="Коэф. рециркуляции" value={params.recycleRatio} min={0} max={0.3} step={0.01} onChange={(v) => setParams(p => ({ ...p, recycleRatio: v }))} />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    <button onClick={trainModel} disabled={isTraining} className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg disabled:opacity-50">🚀 Обучить модель</button>
                    {isTraining && <button onClick={() => setStopTraining(true)} className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded-lg">⏹️ Остановить</button>}
                    <button onClick={predict} disabled={!model} className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg disabled:opacity-50">🔮 Предсказать</button>
                    <button onClick={addCurrentSample} disabled={!exactValues} className="bg-yellow-700 hover:bg-yellow-600 px-4 py-2 rounded-lg">➕ Добавить текущий режим</button>
                    <button onClick={fineTune} disabled={trainingData.length === 0 || !model} className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg">🔄 Дообучить</button>
                    <button onClick={exportModel} disabled={!model} className="bg-indigo-700 hover:bg-indigo-600 px-4 py-2 rounded-lg">💾 Экспорт модели</button>
                    <label className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg cursor-pointer">
                        📂 Импорт модели
                        <input type="file" accept=".json" onChange={importModel} className="hidden" />
                    </label>
                </div>

                {trainingProgress && (
                    <div className="mb-4">
                        <div className="text-sm text-cyan-400 bg-slate-900/60 p-2 rounded">{trainingProgress}</div>
                        {isTraining && currentEpoch > 0 && (
                            <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(currentEpoch / totalEpochs) * 100}%` }} />
                            </div>
                        )}
                    </div>
                )}

                {historyData.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-slate-300 mb-2">Кривая обучения</h4>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={historyData}>
                                <CartesianGrid stroke="#334155" />
                                <XAxis dataKey="epoch" tick={{ fill: '#94a3b8' }} />
                                <YAxis tick={{ fill: '#94a3b8' }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                                <Legend />
                                <Line type="monotone" dataKey="loss" stroke="#f97316" name="train loss" />
                                <Line type="monotone" dataKey="valLoss" stroke="#3b82f6" name="val loss" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {prediction && exactValues && (
                    <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-600 mb-4">
                        <h4 className="font-bold text-slate-200 mb-2">Результаты прогноза (MC Dropout, 15 прогонов)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {selectedTargets.map((target, idx) => (
                                <div key={target} className="text-center">
                                    <div className="text-xs text-slate-400">{targetOptions.find(t => t.id === target)?.label}</div>
                                    <div className="text-xl font-bold">{prediction.mean[idx].toFixed(2)} ± {prediction.std[idx].toFixed(2)}</div>
                                    <div className="text-xs text-slate-500">точно: {exactValues[idx].toFixed(2)}</div>
                                    <div className="text-xs text-emerald-400">Δ = {(prediction.mean[idx] - exactValues[idx]).toFixed(2)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-indigo-400 mb-2">📈 Анализ чувствительности</h3>
                <div className="flex flex-wrap gap-3 mb-3">
                    <div>
                        <label className="block text-xs text-slate-400">Параметр</label>
                        <select value={sensitivityParam} onChange={(e) => setSensitivityParam(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm">
                            <option value="feedRate">Расход сырья, т/ч</option>
                            <option value="furnaceTemp">Температура печи, °C</option>
                            <option value="chamberPressure">Давление в камере, МПа</option>
                            <option value="steamRate">Расход пара, %</option>
                            <option value="recycleRatio">Коэф. рециркуляции</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400">Целевой показатель</label>
                        <select value={sensitivityTarget} onChange={(e) => setSensitivityTarget(e.target.value)} className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm">
                            {selectedTargets.map(t => <option key={t} value={t}>{targetOptions.find(o=>o.id===t)?.label}</option>)}
                        </select>
                    </div>
                    <button onClick={computeSensitivity} className="bg-indigo-700 hover:bg-indigo-600 px-3 py-1 rounded-lg text-sm self-end">Рассчитать</button>
                </div>
                {sensitivityData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={sensitivityData}>
                            <CartesianGrid stroke="#334155" />
                            <XAxis dataKey="x" tick={{ fill: '#94a3b8' }} />
                            <YAxis tick={{ fill: '#94a3b8' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b' }} />
                            <Line type="monotone" dataKey="y" stroke="#f97316" name="Прогноз" />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="text-xs text-slate-500 text-center">MC Dropout – 15 прогонов с активным dropout для оценки неопределённости | Обучение ≈ 30–60 секунд</div>
        </div>
    );
};

const ParamSlider = ({ label, value, min, max, step, onChange }: any) => (
    <div>
        <div className="flex justify-between text-xs text-slate-400"><span>{label}</span><span>{value.toFixed(step<0.1?2:0)}</span></div>
        <input type="range" value={value} min={min} max={max} step={step} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-700 rounded-lg accent-green-500" />
    </div>
);

export default NeuralPredictorPanel;