import React, { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { generateTrainingData, TrainingSample, runSimulation } from '../data/simulationEngine';
import { getDefaultFeedstock } from '../data/feedstockData';

const NeuralPredictorPanel: React.FC = () => {
    const [model, setModel] = useState<tf.Sequential | null>(null);
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState('');
    const [prediction, setPrediction] = useState<number[] | null>(null);
    const [exactValues, setExactValues] = useState<number[] | null>(null);

    // Параметры для прогноза
    const [params, setParams] = useState({
        feedRate: 100,
        furnaceTemp: 500,
        chamberPressure: 0.35,
        steamRate: 3,
        recycleRatio: 0.1,
    });

    // Обучение нейросети
    const trainModel = async () => {
        setIsTraining(true);
        setTrainingStatus('Генерация обучающих данных...');

        const feedstock = getDefaultFeedstock();
        const samples = generateTrainingData(feedstock, 400);

        setTrainingStatus(`Сгенерировано ${samples.length} образцов. Преобразование...`);

        // Подготовка тензоров
        const inputs = samples.map(s => s.inputs);
        const outputs = samples.map(s => s.outputs);

        const inputTensor = tf.tensor2d(inputs);
        const outputTensor = tf.tensor2d(outputs);

        // Создание модели
        const sequential = tf.sequential();
        sequential.add(tf.layers.dense({
            inputShape: [5],
            units: 12,
            activation: 'relu',
        }));
        sequential.add(tf.layers.dense({
            units: 8,
            activation: 'relu',
        }));
        sequential.add(tf.layers.dense({
            units: 3,
            activation: 'linear',
        }));

        sequential.compile({
            optimizer: tf.train.adam(0.01),
            loss: 'meanSquaredError',
            metrics: ['mae'],
        });

        setTrainingStatus('Обучение модели...');

        // Обучение
        await sequential.fit(inputTensor, outputTensor, {
            epochs: 100,
            batchSize: 32,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    setTrainingStatus(`Эпоха ${epoch + 1}/100, loss: ${logs?.loss.toFixed(4)}, mae: ${logs?.mae.toFixed(4)}`);
                },
            },
        });

        setModel(sequential);
        setTrainingStatus('Обучение завершено!');
        setIsTraining(false);

        // Очистка тензоров
        inputTensor.dispose();
        outputTensor.dispose();
    };

    // Прогноз по текущим параметрам
    const predict = () => {
        if (!model) return;

        const input = [[
            params.feedRate,
            params.furnaceTemp,
            params.chamberPressure,
            params.steamRate,
            params.recycleRatio,
        ]];
        const inputTensor = tf.tensor2d(input);
        const outputTensor = model.predict(inputTensor) as tf.Tensor;
        const values = outputTensor.dataSync();
        setPrediction(Array.from(values));
        outputTensor.dispose();
        inputTensor.dispose();

        // Точный расчёт для сравнения
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
        setExactValues([exact.yields.coke, exact.keyIndicators.lightProductsYield, exact.keyIndicators.conversionDepth]);
    };

    // Сохранение модели (опционально)
    const saveModel = async () => {
        if (model) {
            await model.save('localstorage://uzk-neural-model');
            alert('Модель сохранена в localStorage');
        }
    };

    // Загрузка модели при монтировании
    useEffect(() => {
        const loadModel = async () => {
            try {
                const loaded = await tf.loadLayersModel('localstorage://uzk-neural-model');
                setModel(loaded as tf.Sequential);
                setTrainingStatus('Модель загружена из сохранения');
            } catch (e) {
                setTrainingStatus('Нет сохранённой модели, обучите новую');
            }
        };
        loadModel();
    }, []);

    return (
        <div className="space-y-5">
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700">
                <h3 className="text-lg font-bold text-green-400 mb-2">🧠 Нейросетевой предиктор</h3>
                <p className="text-sm text-slate-400 mb-4">
                    Нейронная сеть (5 входов → 3 выхода) обучена на данных точной модели. Быстрый прогноз выходов кокса, светлых и глубины конверсии.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <ParamSliderNeural
                        label="Расход сырья, т/ч"
                        value={params.feedRate}
                        min={50} max={200} step={1}
                        onChange={(v) => setParams(p => ({ ...p, feedRate: v }))}
                    />
                    <ParamSliderNeural
                        label="Температура печи, °C"
                        value={params.furnaceTemp}
                        min={470} max={520} step={1}
                        onChange={(v) => setParams(p => ({ ...p, furnaceTemp: v }))}
                    />
                    <ParamSliderNeural
                        label="Давление в камере, МПа"
                        value={params.chamberPressure}
                        min={0.15} max={0.6} step={0.01}
                        onChange={(v) => setParams(p => ({ ...p, chamberPressure: v }))}
                    />
                    <ParamSliderNeural
                        label="Расход пара, %"
                        value={params.steamRate}
                        min={0.5} max={8} step={0.1}
                        onChange={(v) => setParams(p => ({ ...p, steamRate: v }))}
                    />
                    <ParamSliderNeural
                        label="Коэф. рециркуляции"
                        value={params.recycleRatio}
                        min={0} max={0.3} step={0.01}
                        onChange={(v) => setParams(p => ({ ...p, recycleRatio: v }))}
                    />
                </div>

                <div className="flex gap-3 mb-4">
                    <button
                        onClick={trainModel}
                        disabled={isTraining}
                        className="bg-green-700 hover:bg-green-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                        {isTraining ? 'Обучение...' : '🚀 Обучить нейросеть'}
                    </button>
                    <button
                        onClick={predict}
                        disabled={!model}
                        className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                        🔮 Предсказать
                    </button>
                    <button
                        onClick={saveModel}
                        disabled={!model}
                        className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                        💾 Сохранить модель
                    </button>
                </div>

                {trainingStatus && (
                    <div className="mb-4 text-sm text-cyan-400 bg-slate-900/60 p-2 rounded">
                        {trainingStatus}
                    </div>
                )}

                {prediction && exactValues && (
                    <div className="bg-slate-900/80 rounded-lg p-4 border border-slate-600">
                        <h4 className="font-bold text-slate-200 mb-2">Результаты прогноза</h4>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                                <div className="text-xs text-slate-400">Выход кокса, %</div>
                                <div className="text-xl font-bold">{prediction[0].toFixed(1)}</div>
                                <div className="text-xs text-slate-500">точно: {exactValues[0].toFixed(1)}</div>
                                <div className={`text-xs ${Math.abs(prediction[0] - exactValues[0]) < 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    Δ = {(prediction[0] - exactValues[0]).toFixed(2)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Выход светлых, %</div>
                                <div className="text-xl font-bold">{prediction[1].toFixed(1)}</div>
                                <div className="text-xs text-slate-500">точно: {exactValues[1].toFixed(1)}</div>
                                <div className={`text-xs ${Math.abs(prediction[1] - exactValues[1]) < 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    Δ = {(prediction[1] - exactValues[1]).toFixed(2)}%
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400">Глубина конверсии, %</div>
                                <div className="text-xl font-bold">{prediction[2].toFixed(1)}</div>
                                <div className="text-xs text-slate-500">точно: {exactValues[2].toFixed(1)}</div>
                                <div className={`text-xs ${Math.abs(prediction[2] - exactValues[2]) < 0.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    Δ = {(prediction[2] - exactValues[2]).toFixed(2)}%
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 mt-3 text-center">
                            * Нейросеть обучена на 400 случайных расчётах. Точность зависит от объёма данных и архитектуры.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ParamSliderNeural = ({ label, value, min, max, step, onChange }: any) => (
    <div className="mb-2">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{label}</span>
            <span>{value.toFixed(step < 0.1 ? 2 : 0)}</span>
        </div>
        <input
            type="range"
            value={value}
            min={min} max={max} step={step}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
        />
    </div>
);

export default NeuralPredictorPanel;