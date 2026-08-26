import React, { useState, useMemo } from 'react';
import { Partner } from '../../types';
import { toDate, formatDate } from '../../lib/dateUtils';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  Award, 
  BarChart3, 
  Layers, 
  ArrowUpRight, 
  Building2, 
  Sparkles,
  Info
} from 'lucide-react';

interface AdhesionEvolutionChartProps {
  partners: Partner[];
  onSelectPartner?: (partner: Partner) => void;
  onOpenMonthDrilldown?: (monthLabel: string, partnersInMonth: Partner[]) => void;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const FULL_MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function getPartnerApprovalDate(p: Partner): Date | null {
  if (p.acceptanceDate) {
    const d = toDate(p.acceptanceDate);
    if (d) return d;
  }
  if (p.decisionDate && (p.currentStage === 'approved' || p.result === 'approved')) {
    const d = toDate(p.decisionDate);
    if (d) return d;
  }
  if (p.partnershipStartDate) {
    const d = toDate(p.partnershipStartDate);
    if (d) return d;
  }
  if (p.currentStage === 'approved') {
    if (p.updatedAt) {
      const d = toDate(p.updatedAt);
      if (d) return d;
    }
    if (p.createdAt) {
      const d = toDate(p.createdAt);
      if (d) return d;
    }
  }
  return null;
}

export const AdhesionEvolutionChart: React.FC<AdhesionEvolutionChartProps> = ({
  partners,
  onSelectPartner,
  onOpenMonthDrilldown,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [chartMode, setChartMode] = useState<'mixed' | 'monthly' | 'cumulative'>('mixed');

  // Filter approved partners
  const approvedPartners = useMemo(() => {
    return partners
      .filter((p) => !p.isArchived && (p.currentStage === 'approved' || p.result === 'approved'))
      .map((p) => ({
        partner: p,
        approvalDate: getPartnerApprovalDate(p),
      }));
  }, [partners]);

  // Extract available years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);

    approvedPartners.forEach(({ approvalDate }) => {
      if (approvalDate) {
        yearsSet.add(approvalDate.getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [approvedPartners, currentYear]);

  // Build Monthly Chart Data
  const { chartData, totalApprovedInPeriod, peakMonth, avgPerMonth, partnerMapByMonth } = useMemo(() => {
    const partnerMap: Record<number, Partner[]> = {};
    for (let m = 0; m < 12; m++) {
      partnerMap[m] = [];
    }

    let totalInPeriod = 0;
    const targetYearNum = selectedYear === 'all' ? null : Number(selectedYear);

    // Cumulative base before selected year (if specific year selected)
    let cumulativeCount = 0;
    if (targetYearNum) {
      approvedPartners.forEach(({ partner, approvalDate }) => {
        if (approvalDate && approvalDate.getFullYear() < targetYearNum) {
          cumulativeCount++;
        }
      });
    }

    // Populate months
    approvedPartners.forEach(({ partner, approvalDate }) => {
      if (!approvalDate) return;

      const pYear = approvalDate.getFullYear();
      const pMonth = approvalDate.getMonth();

      if (targetYearNum === null || pYear === targetYearNum) {
        partnerMap[pMonth].push(partner);
        totalInPeriod++;
      }
    });

    let maxInMonth = 0;
    let maxMonthIndex = 0;

    const data = MONTH_NAMES.map((name, idx) => {
      const count = partnerMap[idx].length;
      cumulativeCount += count;

      if (count > maxInMonth) {
        maxInMonth = count;
        maxMonthIndex = idx;
      }

      return {
        monthIndex: idx,
        month: name,
        fullMonth: FULL_MONTH_NAMES[idx],
        novos: count,
        acumulado: cumulativeCount,
        partners: partnerMap[idx],
      };
    });

    const average = (totalInPeriod / 12).toFixed(1);

    return {
      chartData: data,
      totalApprovedInPeriod: totalInPeriod,
      peakMonth: {
        name: FULL_MONTH_NAMES[maxMonthIndex],
        count: maxInMonth,
      },
      avgPerMonth: average,
      partnerMapByMonth: partnerMap,
    };
  }, [approvedPartners, selectedYear]);

  // Handle clicking on bar/point
  const handleChartClick = (entry: any) => {
    if (!entry || !entry.activePayload || entry.activePayload.length === 0) return;
    const payload = entry.activePayload[0].payload;
    if (onOpenMonthDrilldown) {
      const yearLabel = selectedYear === 'all' ? 'Histórico Geral' : selectedYear;
      onOpenMonthDrilldown(
        `${payload.fullMonth} de ${yearLabel}`,
        payload.partners || []
      );
    }
  };

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const monthPartners: Partner[] = dataPoint.partners || [];

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 max-w-xs text-xs space-y-2 backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2">
            <span className="font-bold text-sky-300 text-sm">{dataPoint.fullMonth}</span>
            <span className="text-[10px] text-slate-400">
              {selectedYear === 'all' ? 'Todos os anos' : selectedYear}
            </span>
          </div>

          <div className="space-y-1 py-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Novas adesões no mês:</span>
              <span className="font-extrabold text-emerald-400 text-sm">
                +{dataPoint.novos}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Total acumulado:</span>
              <span className="font-extrabold text-blue-400 text-sm">
                {dataPoint.acumulado}
              </span>
            </div>
          </div>

          {monthPartners.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Parceiros Deferidos ({monthPartners.length}):
              </span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {monthPartners.map((p) => (
                  <div key={p.id} className="text-[11px] text-slate-200 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="truncate font-medium">{p.fantasyName}</span>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-sky-300 pt-1">
                💡 Clique na barra para abrir a lista completa
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header with Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Evolução Histórica de Adesões (Convênios Deferidos)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Acompanhamento mensal de novos termos firmados e crescimento acumulado da Rede+ Vantagens TJPA.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100/90 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200">
            <button
              type="button"
              onClick={() => setChartMode('mixed')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                chartMode === 'mixed'
                  ? 'bg-white text-blue-700 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Misto
            </button>
            <button
              type="button"
              onClick={() => setChartMode('monthly')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                chartMode === 'monthly'
                  ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Mês a Mês
            </button>
            <button
              type="button"
              onClick={() => setChartMode('cumulative')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                chartMode === 'cumulative'
                  ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Acumulado
            </button>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={String(yr)}>
                  Ano {yr}
                </option>
              ))}
              <option value="all">Histórico Completo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Deferidos no Período
          </span>
          <div className="text-2xl font-black text-emerald-950 mt-1">
            {totalApprovedInPeriod}
          </div>
          <span className="text-[10px] text-emerald-700 mt-0.5">
            {selectedYear === 'all' ? 'Total acumulado' : `Em ${selectedYear}`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            Média Mensal
          </span>
          <div className="text-2xl font-black text-blue-950 mt-1">
            {avgPerMonth}
          </div>
          <span className="text-[10px] text-blue-700 mt-0.5">
            Novas adesões / mês
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-indigo-800 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-indigo-600" />
            Mês de Destaque
          </span>
          <div className="text-lg font-black text-indigo-950 mt-1 truncate">
            {peakMonth.count > 0 ? `${peakMonth.name} (+${peakMonth.count})` : '-'}
          </div>
          <span className="text-[10px] text-indigo-700 mt-0.5">
            Maior pico de adesão
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            Total Rede+ Ativa
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {approvedPartners.length}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Parceiros conveniados
          </span>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="w-full h-72 sm:h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            onClick={handleChartClick}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            className="cursor-pointer"
          >
            <defs>
              <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis 
              dataKey="month" 
              tickLine={false} 
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
            />

            <YAxis 
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend 
              verticalAlign="top" 
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
            />

            {(chartMode === 'mixed' || chartMode === 'cumulative') && (
              <Area
                type="monotone"
                dataKey="acumulado"
                name="Total Acumulado (Vigentes)"
                fill="url(#colorAcumulado)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ fill: '#2563eb', r: 3 }}
                activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#fff', strokeWidth: 2 }}
              />
            )}

            {(chartMode === 'mixed' || chartMode === 'monthly') && (
              <Bar
                dataKey="novos"
                name="Novas Adesões (Mês)"
                fill="url(#colorNovos)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Helper Footer */}
      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>
            <strong>Dica de navegação:</strong> Clique nas barras ou pontos do gráfico para ver a lista de parceiros deferidos naquele mês.
          </span>
        </div>

        <span className="text-[11px] text-slate-400">
          Dados extraídos de termos deferidos e datas de aceite
        </span>
      </div>
    </div>
  );
};
