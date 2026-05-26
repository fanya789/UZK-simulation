import type { SimulationResult, SimulationInput } from '../types';
import { FileText, Download } from 'lucide-react';

interface ReportPanelProps {
  result: SimulationResult;
  input: SimulationInput;
}

export default function ReportPanel({ result, input }: ReportPanelProps) {
  const { yields, properties, heatBalance, materialBalance, warnings } = result;

  const now = new Date().toLocaleString('ru-RU');

  const generateTextReport = () => {
    const lines = [
      '═══════════════════════════════════════════════════════════════',
      '     ОТЧЁТ О МОДЕЛИРОВАНИИ УСТАНОВКИ ЗАМЕДЛЕННОГО КОКСОВАНИЯ',
      '═══════════════════════════════════════════════════════════════',
      `Дата расчёта: ${now}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '1. ИСХОДНЫЕ ДАННЫЕ',
      '───────────────────────────────────────────────────────────────',
      '',
      '1.1 Характеристики сырья:',
      `  Расход сырья:           ${input.feedstock.feedRate} т/ч`,
      `  Плотность (20°C):       ${input.feedstock.density} кг/м³`,
      `  Содержание серы:        ${input.feedstock.sulfurContent} % масс.`,
      `  Асфальтены:             ${input.feedstock.asphalteneContent} % масс.`,
      `  Коксуемость:            ${input.feedstock.cokability} % масс.`,
      `  Вязкость (100°C):       ${input.feedstock.viscosity} сСт`,
      `  Углеродный остаток:     ${input.feedstock.ccr} % масс.`,
      '',
      '1.2 Трубчатая печь:',
      `  Т входа:                ${input.furnace.inletTemp} °C`,
      `  Т выхода:               ${input.furnace.outletTemp} °C`,
      `  Давление змеевика:      ${input.furnace.pressure} МПа`,
      `  Тип змеевика:           ${input.furnace.coilType === 'double' ? 'Двухходовой' : 'Одноходовой'}`,
      `  Тепловая нагрузка:      ${input.furnace.heatDuty} МВт`,
      `  Время пребывания:       ${input.furnace.residenceTime} с`,
      '',
      '1.3 Коксовые камеры:',
      `  Количество камер:       ${input.reactor.numberOfChambers} шт.`,
      `  Диаметр × Высота:       ${input.reactor.chamberDiameter} × ${input.reactor.chamberHeight} м`,
      `  Давление верха:         ${input.reactor.topPressure} МПа`,
      `  Т низа:                 ${input.reactor.bottomTemp} °C`,
      `  Т верха:                ${input.reactor.topTemp} °C`,
      `  Время заполнения:       ${input.reactor.fillTime} ч`,
      `  Полный цикл:            ${input.reactor.cycleTime} ч`,
      '',
      '1.4 Ректификационная колонна:',
      `  Число тарелок:          ${input.fractionation.numberOfTrays}`,
      `  Т верха:                ${input.fractionation.topTemp} °C`,
      `  Т низа:                 ${input.fractionation.bottomTemp} °C`,
      `  Давление:               ${input.fractionation.pressure} МПа`,
      `  Коэфф. орошения:        ${input.fractionation.refluxRatio}`,
      '',
      '───────────────────────────────────────────────────────────────',
      '2. РЕЗУЛЬТАТЫ РАСЧЁТА',
      '───────────────────────────────────────────────────────────────',
      '',
      '2.1 Выходы продуктов (% масс.):',
      `  Газ:                    ${yields.gas} %`,
      `  Бензин (н.к.-180°C):    ${yields.gasoline} %`,
      `  Лёгкий газойль:         ${yields.lightGasoil} %`,
      `  Тяжёлый газойль:        ${yields.heavyGasoil} %`,
      `  Кокс:                   ${yields.coke} %`,
      `  Потери:                 ${yields.losses} %`,
      `  ────────────────────────────`,
      `  ИТОГО:                  ${(yields.gas + yields.gasoline + yields.lightGasoil + yields.heavyGasoil + yields.coke + yields.losses).toFixed(1)} %`,
      '',
      '2.2 Свойства продуктов:',
      `  Бензин:    ρ=${properties.gasolineDensity.toFixed(0)} кг/м³, S=${properties.gasolineSulfur.toFixed(3)}%`,
      `  ЛГ:       ρ=${properties.lightGasoilDensity.toFixed(0)} кг/м³, S=${properties.lightGasoilSulfur.toFixed(3)}%`,
      `  ТГ:       ρ=${properties.heavyGasoilDensity.toFixed(0)} кг/м³, S=${properties.heavyGasoilSulfur.toFixed(3)}%`,
      `  Кокс:     Летучие=${properties.cokeVolatiles.toFixed(1)}%, S=${properties.cokeSulfur.toFixed(3)}%, Зола=${properties.cokeAsh.toFixed(2)}%`,
      '',
      '2.3 Материальный баланс:',
      `  Вход (сырьё):           ${materialBalance.feedIn.toFixed(2)} т/ч`,
      `  Выход (всего):          ${materialBalance.totalOut.toFixed(3)} т/ч`,
      `  Невязка:                ${materialBalance.closureError.toFixed(3)} %`,
      '',
      '2.4 Тепловой баланс:',
      `  Подвод тепла:           ${heatBalance.heatInput} МВт`,
      `  Тепло реакции:          ${heatBalance.heatReaction} МВт`,
      `  Тепло с продуктами:     ${heatBalance.heatProducts} МВт`,
      `  Потери тепла:           ${heatBalance.heatLosses} МВт`,
      `  КПД:                    ${heatBalance.efficiency} %`,
      '',
    ];

    if (warnings.length > 0) {
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('3. ПРЕДУПРЕЖДЕНИЯ');
      lines.push('───────────────────────────────────────────────────────────────');
      lines.push('');
      warnings.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));
      lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    КОНЕЦ ОТЧЁТА');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
  };

  const handleDownload = () => {
    const text = generateTextReport();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `УЗК_Отчёт_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileText size={22} className="text-amber-400" />
          Полный отчёт о моделировании
        </h3>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} />
          Скачать .txt
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl border border-slate-700/50 p-6 overflow-x-auto">
        <pre className="text-slate-300 text-xs leading-relaxed font-mono whitespace-pre">
          {generateTextReport()}
        </pre>
      </div>
    </div>
  );
}
