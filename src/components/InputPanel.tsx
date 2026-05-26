import React from 'react';
import type { SimulationInput } from '../types';
import { Flame, Thermometer, FlaskConical, Filter } from 'lucide-react';

interface InputPanelProps {
  input: SimulationInput;
  onChange: (input: SimulationInput) => void;
}

interface FieldDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

function NumberField({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-slate-400 font-medium">
        {label} <span className="text-slate-500">({unit})</span>
      </label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                   focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
                   transition-all hover:border-slate-500"
      />
    </div>
  );
}

function SectionCard({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
      <div className={`flex items-center gap-2 px-5 py-3 border-b border-slate-700/50 ${color}`}>
        {icon}
        <h3 className="font-semibold text-sm tracking-wide uppercase">{title}</h3>
      </div>
      <div className="p-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

export default function InputPanel({ input, onChange }: InputPanelProps) {
  const updateFeedstock = (key: string, value: number) => {
    onChange({ ...input, feedstock: { ...input.feedstock, [key]: value } });
  };
  const updateFurnace = (key: string, value: number) => {
    onChange({ ...input, furnace: { ...input.furnace, [key]: value } });
  };
  const updateReactor = (key: string, value: number) => {
    onChange({ ...input, reactor: { ...input.reactor, [key]: value } });
  };
  const updateFractionation = (key: string, value: number) => {
    onChange({ ...input, fractionation: { ...input.fractionation, [key]: value } });
  };

  const feedstockFields: FieldDef[] = [
    { key: 'feedRate', label: 'Расход сырья', unit: 'т/ч', min: 10, max: 500, step: 1 },
    { key: 'density', label: 'Плотность (20°C)', unit: 'кг/м³', min: 900, max: 1100, step: 1 },
    { key: 'sulfurContent', label: 'Содержание серы', unit: '% масс.', min: 0.1, max: 6, step: 0.1 },
    { key: 'asphalteneContent', label: 'Асфальтены', unit: '% масс.', min: 1, max: 25, step: 0.5 },
    { key: 'cokability', label: 'Коксуемость (Конрадсон)', unit: '% масс.', min: 5, max: 35, step: 0.5 },
    { key: 'viscosity', label: 'Вязкость (100°C)', unit: 'сСт', min: 10, max: 2000, step: 10 },
    { key: 'ccr', label: 'Углеродный остаток', unit: '% масс.', min: 3, max: 30, step: 0.5 },
  ];

  const furnaceFields: FieldDef[] = [
    { key: 'inletTemp', label: 'Т входа', unit: '°C', min: 250, max: 420, step: 5 },
    { key: 'outletTemp', label: 'Т выхода', unit: '°C', min: 460, max: 520, step: 1 },
    { key: 'pressure', label: 'Давление в змеевике', unit: 'МПа', min: 0.2, max: 1.5, step: 0.05 },
    { key: 'heatDuty', label: 'Тепловая нагрузка', unit: 'МВт', min: 10, max: 100, step: 1 },
    { key: 'residenceTime', label: 'Время пребывания', unit: 'с', min: 5, max: 60, step: 1 },
  ];

  const reactorFields: FieldDef[] = [
    { key: 'numberOfChambers', label: 'Количество камер', unit: 'шт', min: 2, max: 8, step: 1 },
    { key: 'chamberDiameter', label: 'Диаметр камеры', unit: 'м', min: 3, max: 10, step: 0.1 },
    { key: 'chamberHeight', label: 'Высота камеры', unit: 'м', min: 15, max: 40, step: 0.5 },
    { key: 'topPressure', label: 'Давление верха', unit: 'МПа', min: 0.1, max: 0.6, step: 0.01 },
    { key: 'bottomTemp', label: 'Т низа камеры', unit: '°C', min: 450, max: 510, step: 1 },
    { key: 'topTemp', label: 'Т верха камеры', unit: '°C', min: 380, max: 460, step: 1 },
    { key: 'fillTime', label: 'Время заполнения', unit: 'ч', min: 12, max: 48, step: 1 },
    { key: 'cycleTime', label: 'Полный цикл', unit: 'ч', min: 24, max: 96, step: 1 },
  ];

  const fractionationFields: FieldDef[] = [
    { key: 'numberOfTrays', label: 'Число тарелок', unit: 'шт', min: 10, max: 60, step: 1 },
    { key: 'topTemp', label: 'Т верха колонны', unit: '°C', min: 80, max: 180, step: 5 },
    { key: 'bottomTemp', label: 'Т низа колонны', unit: '°C', min: 300, max: 420, step: 5 },
    { key: 'pressure', label: 'Давление', unit: 'МПа', min: 0.05, max: 0.5, step: 0.01 },
    { key: 'refluxRatio', label: 'Коэфф. орошения', unit: '', min: 0.5, max: 5, step: 0.1 },
  ];

  return (
    <div className="space-y-5">
      <SectionCard
        title="Характеристики сырья"
        icon={<FlaskConical size={18} />}
        color="text-emerald-400"
      >
        {feedstockFields.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            value={(input.feedstock as any)[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={(v) => updateFeedstock(f.key, v)}
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Трубчатая печь"
        icon={<Flame size={18} />}
        color="text-orange-400"
      >
        {furnaceFields.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            value={(input.furnace as any)[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={(v) => updateFurnace(f.key, v)}
          />
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-400 font-medium">Тип змеевика</label>
          <select
            value={input.furnace.coilType}
            onChange={(e) =>
              onChange({
                ...input,
                furnace: { ...input.furnace, coilType: e.target.value as 'single' | 'double' },
              })
            }
            className="bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white
                       focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          >
            <option value="single">Одноходовой</option>
            <option value="double">Двухходовой</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="Коксовые камеры (реакторы)"
        icon={<Thermometer size={18} />}
        color="text-red-400"
      >
        {reactorFields.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            value={(input.reactor as any)[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={(v) => updateReactor(f.key, v)}
          />
        ))}
      </SectionCard>

      <SectionCard
        title="Ректификационная колонна"
        icon={<Filter size={18} />}
        color="text-blue-400"
      >
        {fractionationFields.map((f) => (
          <NumberField
            key={f.key}
            label={f.label}
            unit={f.unit}
            value={(input.fractionation as any)[f.key]}
            min={f.min}
            max={f.max}
            step={f.step}
            onChange={(v) => updateFractionation(f.key, v)}
          />
        ))}
      </SectionCard>
    </div>
  );
}
