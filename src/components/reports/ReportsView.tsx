import React, { useState, useMemo } from 'react';
import { Partner, PartnerStage, PartnerOrigin, InterestLevel, Category, UserProfile, PartnerFilters } from '../../types';
import { PartnerStageBadge, STAGE_CONFIG } from '../partners/PartnerStageBadge';
import { formatDate, toDate, daysBetween, dateToInputString } from '../../lib/dateUtils';
import { exportPartnersToCSV, ORIGIN_LABELS, INTEREST_LABELS, SCOPE_LABELS } from '../../lib/exportUtils';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface ReportsViewProps {
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  categories: Category[];
  users: UserProfile[];
  cities: string[];
}

type DateTypeOption = 'createdAt' | 'identificationDate' | 'firstContactDate' | 'submissionDate' | 'decisionDate' | 'acceptanceDate';

export const ReportsView: React.FC<ReportsViewProps> = ({
  partners,
  onSelectPartner,
  categories,
  users,
  cities,
}) => {
  const [dateType, setDateType] = useState<DateTypeOption>('createdAt');
  const [periodPreset, setPeriodPreset] = useState<string>('year');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-01-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return dateToInputString(d);
  });

  // Secondary Filters
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [originFilter, setOriginFilter] = useState<string>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [includeArchived, setIncludeArchived] = useState<boolean>(false);

  const applyPreset = (preset: string) => {
    setPeriodPreset(preset);
    const now = new Date();
    const todayStr = dateToInputString(now);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      const d7 = new Date();
      d7.setDate(now.getDate() - 7);
      setStartDate(dateToInputString(d7));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d30 = new Date();
      d30.setDate(now.getDate() - 30);
      setStartDate(dateToInputString(d30));
      setEndDate(todayStr);
    } else if (preset === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(dateToInputString(startOfMonth));
      setEndDate(todayStr);
    } else if (preset === 'quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      const startQuarter = new Date(now.getFullYear(), quarterMonth, 1);
      setStartDate(dateToInputString(startQuarter));
      setEndDate(todayStr);
    } else if (preset === 'year') {
      const startYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(dateToInputString(startYear));
      setEndDate(todayStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleResetFilters = () => {
    applyPreset('year');
    setStageFilter('all');
    setCategoryFilter('all');
    setOriginFilter('all');
    setInterestFilter('all');
    setCityFilter('all');
    setResponsibleFilter('all');
    setIncludeArchived(false);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : null;
    const end = endDate ? new Date(endDate + 'T23:59:59') : null;

    return partners.filter((p) => {
      if (!includeArchived && p.isArchived) return false;

      // Date Range Filter
      if (start || end) {
        const rawVal = (p as any)[dateType];
        const d = toDate(rawVal);
        if (!d) return false;
        if (start && d < start) return false;
        if (end && d > end) return false;
      }

      if (stageFilter !== 'all' && p.currentStage !== stageFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (originFilter !== 'all' && p.origin !== originFilter) return false;
      if (interestFilter !== 'all' && p.interestLevel !== interestFilter) return false;
      if (cityFilter !== 'all' && (p.city || '').toLowerCase() !== cityFilter.toLowerCase()) return false;
      if (responsibleFilter !== 'all' && p.assignedToUid !== responsibleFilter) return false;

      return true;
    });
  }, [
    partners,
    dateType,
    startDate,
    endDate,
    stageFilter,
    categoryFilter,
    originFilter,
    interestFilter,
    cityFilter,
    responsibleFilter,
    includeArchived,
  ]);

  // Aggregate Metrics for Filtered Set
  const reportMetrics = useMemo(() => {
    const total = filteredData.length;
    const approved = filteredData.filter((p) => p.currentStage === 'approved').length;
    const inAnalysis = filteredData.filter((p) => p.currentStage === 'in_analysis').length;
    const rejected = filteredData.filter((p) => p.currentStage === 'rejected').length;
    const rate = total > 0 ? ((approved / total) * 100).toFixed(1) : '0.0';

    let totalProspectDays = 0;
    let prospectSamples = 0;

    filteredData.forEach((p) => {
      if (p.firstContactDate && p.acceptanceDate) {
        const diff = daysBetween(p.firstContactDate, p.acceptanceDate);
        if (diff !== null && diff >= 0) {
          totalProspectDays += diff;
          prospectSamples++;
        }
      }
    });

    const avgDays = prospectSamples > 0 ? Math.round(totalProspectDays / prospectSamples) : null;

    return {
      total,
      approved,
      inAnalysis,
      rejected,
      rate,
      avgDays,
    };
  }, [filteredData]);

  const handleExport = () => {
    const dateLabel = dateType === 'createdAt' ? 'cadastro' : dateType;
    exportPartnersToCSV(
      filteredData,
      `relatorio_parceiros_tjpa_${dateLabel}_${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Relatórios & Indicadores Gerenciais
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Geração de relatórios com múltiplos recortes temporais, filtros estratégicos e exportação oficial em formato CSV.
          </p>
        </div>

        <button
          type="button"
          id="report-export-csv-btn"
          onClick={handleExport}
          disabled={filteredData.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* Filter Control Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Configuração do Recorte Temporal</span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrão</span>
          </button>
        </div>

        {/* Date Type Selector and Preset Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Campo de Data Base para o Relatório
            </label>
            <select
              value={dateType}
              onChange={(e) => setDateType(e.target.value as DateTypeOption)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 font-semibold text-slate-800 bg-slate-50"
            >
              <option value="createdAt">Data de Cadastro no Sistema</option>
              <option value="identificationDate">Data de Identificação do Parceiro</option>
              <option value="firstContactDate">Data da 1ª Prospecção</option>
              <option value="submissionDate">Data de Submissão da Documentação</option>
              <option value="decisionDate">Data da Decisão Oficial</option>
              <option value="acceptanceDate">Data do Aceite / Adesão</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Atalhos de Período</label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'today', label: 'Hoje' },
                { id: '7days', label: 'Últimos 7 dias' },
                { id: '30days', label: 'Últimos 30 dias' },
                { id: 'month', label: 'Mês Atual' },
                { id: 'quarter', label: 'Trimestre Atual' },
                { id: 'year', label: 'Ano Atual' },
                { id: 'all', label: 'Todo o Histórico' },
              ].map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    periodPreset === preset.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Inputs Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPeriodPreset('custom');
              }}
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Filtrar Etapa</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">Todas as Etapas</option>
              {Object.entries(STAGE_CONFIG).map(([k, cfg]) => (
                <option key={k} value={k}>
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Filtrar Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Additional Filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-slate-500 font-medium mb-1">Origem</label>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="all">Todas as origens</option>
              {Object.entries(ORIGIN_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Município</label>
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="all">Todos os municípios</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Responsável</label>
            <select
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value="all">Todos os responsáveis</option>
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 select-none">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
              <span className="font-medium">Incluir arquivados</span>
            </label>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Summary of the Filtered Set */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Parceiros no Recorte
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {reportMetrics.total}
          </div>
          <span className="text-[11px] text-slate-500">Total filtrado</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Deferidos / Ativos
          </span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            {reportMetrics.approved}
          </div>
          <span className="text-[11px] text-slate-500">Parcerias firmadas</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Taxa de Conversão
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-700 mt-1">
            {reportMetrics.rate}%
          </div>
          <span className="text-[11px] text-slate-500">No período selecionado</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            Tempo Médio Aceite
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-700 mt-1">
            {reportMetrics.avgDays !== null ? `${reportMetrics.avgDays} dias` : '-'}
          </div>
          <span className="text-[11px] text-slate-500">Prospecção ao aceite</span>
        </div>
      </div>

      {/* Detailed Result Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
            Detalhamento dos Parceiros Selecionados ({filteredData.length})
          </h3>
          <span className="text-xs text-slate-500">
            {startDate ? formatDate(startDate) : 'Início'} até {endDate ? formatDate(endDate) : 'Hoje'}
          </span>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">Nenhum registro encontrado para este recorte</p>
            <p className="text-xs text-slate-400 mt-1">
              Ajuste as datas ou os filtros acima para visualizar os dados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                <tr className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Parceiro</th>
                  <th className="p-3.5">CNPJ / CPF</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Etapa</th>
                  <th className="p-3.5">Município</th>
                  <th className="p-3.5">Responsável</th>
                  <th className="p-3.5">Data Relevante</th>
                  <th className="p-3.5">Benefício</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((partner) => {
                  const relevantDate = (partner as any)[dateType];

                  return (
                    <tr
                      key={partner.id}
                      onClick={() => onSelectPartner(partner)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 hover:text-blue-700">
                          {partner.fantasyName}
                        </div>
                        {partner.corporateName && (
                          <div className="text-[11px] text-slate-400 line-clamp-1">
                            {partner.corporateName}
                          </div>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {partner.document || '-'}
                      </td>

                      <td className="p-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {partner.category}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        <PartnerStageBadge stage={partner.currentStage} size="sm" />
                      </td>

                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {partner.city || 'Belém'} - {partner.state || 'PA'}
                      </td>

                      <td className="p-3.5 text-slate-700 whitespace-nowrap">
                        {partner.assignedToName || '-'}
                      </td>

                      <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDate(relevantDate)}
                      </td>

                      <td className="p-3.5 text-slate-700 max-w-xs truncate">
                        {partner.benefitDescription ? (
                          <span>
                            {partner.discountPercentage ? `[${partner.discountPercentage}%] ` : ''}
                            {partner.benefitDescription}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
