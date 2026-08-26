import React, { useState, useMemo } from 'react';
import { Partner, PartnerStage, UserProfile } from '../../types';
import { MetricCard } from './MetricCard';
import { STAGE_CONFIG, PartnerStageBadge } from '../partners/PartnerStageBadge';
import { formatDate, isDateOverdue, isDateToday, daysBetween, toDate } from '../../lib/dateUtils';
import { DashboardDrilldownModal, DrilldownType } from './DashboardDrilldownModal';
import { AdhesionEvolutionChart } from './AdhesionEvolutionChart';
import { 
  Building2, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  Layers, 
  PieChart, 
  Compass, 
  PhoneCall, 
  FileClock, 
  SearchCheck, 
  XCircle, 
  UserMinus, 
  ArrowRight,
  Sparkles,
  Award,
  Filter,
  ExternalLink
} from 'lucide-react';

interface DashboardViewProps {
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onNavigateToPartnersWithFilter?: (filterKey: string, val: string) => void;
  users: UserProfile[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  partners,
  onSelectPartner,
  onNavigateToPartnersWithFilter,
  users,
}) => {
  const activePartners = useMemo(() => partners.filter((p) => !p.isArchived), [partners]);

  // Drilldown modal state
  const [drilldownState, setDrilldownState] = useState<{
    isOpen: boolean;
    type: DrilldownType;
    filterValue: string;
    title: string;
    subtitle?: string;
    customPartners?: Partner[];
  }>({
    isOpen: false,
    type: 'all',
    filterValue: '',
    title: '',
  });

  const handleOpenDrilldown = (
    type: DrilldownType,
    filterValue: string,
    title: string,
    subtitle?: string
  ) => {
    setDrilldownState({
      isOpen: true,
      type,
      filterValue,
      title,
      subtitle,
      customPartners: undefined,
    });
  };

  const handleOpenMonthDrilldown = (monthLabel: string, partnersInMonth: Partner[]) => {
    setDrilldownState({
      isOpen: true,
      type: 'custom',
      filterValue: monthLabel,
      title: `Adesões em ${monthLabel}`,
      subtitle: `${partnersInMonth.length} parceiro(s) deferido(s) neste período`,
      customPartners: partnersInMonth,
    });
  };

  const handleCloseDrilldown = () => {
    setDrilldownState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleNavigateToTable = (key: string, val: string) => {
    if (onNavigateToPartnersWithFilter) {
      onNavigateToPartnersWithFilter(key, val);
    }
  };

  // Stage counters
  const counts = useMemo(() => {
    const stageMap: Record<PartnerStage, number> = {
      mapped: 0,
      prospecting: 0,
      waiting_docs: 0,
      in_analysis: 0,
      approved: 0,
      rejected: 0,
      gave_up: 0,
      inactive: 0,
    };

    activePartners.forEach((p) => {
      if (stageMap[p.currentStage] !== undefined) {
        stageMap[p.currentStage]++;
      }
    });

    return stageMap;
  }, [activePartners]);

  // Conversions and Time Averages
  const {
    monthlyApprovedCount,
    yearlyApprovedCount,
    conversionRate,
    avgProspectToAcceptDays,
    avgAnalysisDays,
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthAppr = 0;
    let yearAppr = 0;

    let totalProspectToAcceptDays = 0;
    let prospectToAcceptSamples = 0;

    let totalAnalysisDays = 0;
    let analysisSamples = 0;

    activePartners.forEach((p) => {
      // Check monthly / yearly approval
      if (p.currentStage === 'approved' && p.acceptanceDate) {
        const accDate = toDate(p.acceptanceDate);
        if (accDate) {
          if (accDate.getFullYear() === currentYear) {
            yearAppr++;
            if (accDate.getMonth() === currentMonth) {
              monthAppr++;
            }
          }
        }
      }

      // Time from first contact to acceptance
      if (p.firstContactDate && p.acceptanceDate) {
        const diff = daysBetween(p.firstContactDate, p.acceptanceDate);
        if (diff !== null && diff >= 0) {
          totalProspectToAcceptDays += diff;
          prospectToAcceptSamples++;
        }
      }

      // Time in analysis (submission to decision)
      if (p.submissionDate && p.decisionDate) {
        const diff = daysBetween(p.submissionDate, p.decisionDate);
        if (diff !== null && diff >= 0) {
          totalAnalysisDays += diff;
          analysisSamples++;
        }
      }
    });

    const totalConcludedOrInPipeline = activePartners.length;
    const approvedCount = counts.approved;
    const rate =
      totalConcludedOrInPipeline > 0
        ? ((approvedCount / totalConcludedOrInPipeline) * 100).toFixed(1)
        : '0.0';

    return {
      monthlyApprovedCount: monthAppr,
      yearlyApprovedCount: yearAppr,
      conversionRate: rate,
      avgProspectToAcceptDays:
        prospectToAcceptSamples > 0
          ? Math.round(totalProspectToAcceptDays / prospectToAcceptSamples)
          : null,
      avgAnalysisDays:
        analysisSamples > 0 ? Math.round(totalAnalysisDays / analysisSamples) : null,
    };
  }, [activePartners, counts]);

  // Overdue and upcoming contacts
  const { overdueContacts, upcomingContacts } = useMemo(() => {
    const overdue: Partner[] = [];
    const upcoming: Partner[] = [];

    activePartners.forEach((p) => {
      if (p.nextContactDate) {
        if (isDateOverdue(p.nextContactDate)) {
          overdue.push(p);
        } else {
          upcoming.push(p);
        }
      }
    });

    overdue.sort((a, b) => {
      const da = toDate(a.nextContactDate)?.getTime() || 0;
      const db = toDate(b.nextContactDate)?.getTime() || 0;
      return da - db;
    });

    upcoming.sort((a, b) => {
      const da = toDate(a.nextContactDate)?.getTime() || 0;
      const db = toDate(b.nextContactDate)?.getTime() || 0;
      return da - db;
    });

    return { overdueContacts: overdue, upcomingContacts: upcoming.slice(0, 5) };
  }, [activePartners]);

  // Category and Municipality aggregations
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    activePartners.forEach((p) => {
      const cat = p.category || 'Outros';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activePartners]);

  const cityStats = useMemo(() => {
    const map: Record<string, number> = {};
    activePartners.forEach((p) => {
      const c = p.city || 'Belém';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [activePartners]);

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Institutional Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Painel Executivo • Rede+ Vantagens TJPA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestão Estratégica & CRM de Parcerias
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Monitoramento centralizado do pipeline de prospecção, status das análises documentais e métricas de conversão de parceiros conveniados para magistrados e servidores do TJPA.
          </p>
        </div>
      </div>

      {/* Primary Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => handleOpenDrilldown('all', '', 'Todos os Parceiros Ativos', 'Listagem geral de parceiros cadastrados no sistema')}
          className="cursor-pointer group"
          title="Clique para ver todos os parceiros ativos"
        >
          <MetricCard
            title="Total de Parceiros"
            value={activePartners.length}
            subtitle="Registros ativos no sistema • Clique para ver"
            icon={Building2}
            color="blue"
          />
        </div>

        <div 
          onClick={() => handleOpenDrilldown('approved', '', 'Parceiros Deferidos / Ativos', 'Convênios aprovados com benefícios vigentes')}
          className="cursor-pointer group"
          title="Clique para ver parceiros deferidos"
        >
          <MetricCard
            title="Adesões no Ano"
            value={yearlyApprovedCount}
            subtitle={`${monthlyApprovedCount} deferidas este mês • Clique para ver`}
            icon={Award}
            color="emerald"
          />
        </div>

        <MetricCard
          title="Taxa de Conversão"
          value={`${conversionRate}%`}
          subtitle="Deferidos / Total no pipeline"
          icon={TrendingUp}
          color="indigo"
        />

        <MetricCard
          title="Tempo Médio até Aceite"
          value={avgProspectToAcceptDays !== null ? `${avgProspectToAcceptDays} dias` : 'Em apuração'}
          subtitle={avgAnalysisDays !== null ? `Média análise: ${avgAnalysisDays} dias` : 'Da prospecção à adesão'}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Pipeline Stages Breakdown (8 Etapas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Evolução do Funil por Etapa</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            {activePartners.length} parceiros distribuídos • <span className="text-blue-700 font-bold">Clique em uma etapa para ver parceiros</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'mapped', 'Etapa 1: Mapeado', 'Parceiros em potencial identificados')}
            className="text-left p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100/90 border border-sky-200 hover:border-sky-300 text-sky-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros mapeados"
          >
            <span className="text-[11px] font-bold text-sky-700 flex items-center justify-between">
              <span>1. Mapeado</span>
              <ArrowRight className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-sky-900 mt-2">{counts.mapped}</div>
            <span className="text-[10px] text-sky-600 mt-1">Identificados</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'prospecting', 'Etapa 2: Em Prospecção', 'Contato inicial e sondagem em andamento')}
            className="text-left p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100/90 border border-amber-200 hover:border-amber-300 text-amber-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros em prospecção"
          >
            <span className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
              <span>2. Prospecção</span>
              <ArrowRight className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-amber-900 mt-2">{counts.prospecting}</div>
            <span className="text-[10px] text-amber-600 mt-1">Contato inicial</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'waiting_docs', 'Etapa 3: Aguardando Documentos', 'Aguardando documentação e termo de adesão')}
            className="text-left p-3.5 rounded-2xl bg-orange-50 hover:bg-orange-100/90 border border-orange-200 hover:border-orange-300 text-orange-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros aguardando documentação"
          >
            <span className="text-[11px] font-bold text-orange-700 flex items-center justify-between">
              <span>3. Aguard. Docs</span>
              <ArrowRight className="w-3 h-3 text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-orange-900 mt-2">{counts.waiting_docs}</div>
            <span className="text-[10px] text-orange-600 mt-1">Interesse</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'in_analysis', 'Etapa 4: Em Análise', 'Documentação em análise jurídica e técnica pelo TJPA')}
            className="text-left p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100/90 border border-purple-200 hover:border-purple-300 text-purple-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros em análise"
          >
            <span className="text-[11px] font-bold text-purple-700 flex items-center justify-between">
              <span>4. Em Análise</span>
              <ArrowRight className="w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-purple-900 mt-2">{counts.in_analysis}</div>
            <span className="text-[10px] text-purple-600 mt-1">Doc submetida</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'approved', 'Etapa 5: Deferido', 'Convênio deferido e ativo')}
            className="text-left p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200 hover:border-emerald-300 text-emerald-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros deferidos"
          >
            <span className="text-[11px] font-bold text-emerald-700 flex items-center justify-between">
              <span>5. Deferido</span>
              <ArrowRight className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-emerald-900 mt-2">{counts.approved}</div>
            <span className="text-[10px] text-emerald-600 mt-1">Aprovados</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'rejected', 'Etapa 6: Indeferido', 'Solicitações indeferidas pelo TJPA')}
            className="text-left p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100/90 border border-rose-200 hover:border-rose-300 text-rose-950 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros indeferidos"
          >
            <span className="text-[11px] font-bold text-rose-700 flex items-center justify-between">
              <span>6. Indeferido</span>
              <ArrowRight className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-rose-900 mt-2">{counts.rejected}</div>
            <span className="text-[10px] text-rose-600 mt-1">Rejeitados</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'gave_up', 'Etapa 7: Desistiu', 'Parceiros que optaram por não prosseguir')}
            className="text-left p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/90 border border-slate-300 hover:border-slate-400 text-slate-900 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver desistências"
          >
            <span className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>7. Desistiu</span>
              <ArrowRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2">{counts.gave_up}</div>
            <span className="text-[10px] text-slate-500 mt-1">Não prosseguiu</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenDrilldown('stage', 'inactive', 'Etapa 8: Inativo', 'Parcerias encerradas ou suspensas')}
            className="text-left p-3.5 rounded-2xl bg-zinc-100 hover:bg-zinc-200/90 border border-zinc-300 hover:border-zinc-400 text-zinc-800 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
            title="Clique para ver parceiros inativos"
          >
            <span className="text-[11px] font-bold text-zinc-600 flex items-center justify-between">
              <span>8. Inativo</span>
              <ArrowRight className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <div className="text-2xl font-extrabold text-zinc-700 mt-2">{counts.inactive}</div>
            <span className="text-[10px] text-zinc-500 mt-1">Encerrados</span>
          </button>
        </div>
      </div>

      {/* Adhesion Evolution Chart (Approved Partners Over Time) */}
      <AdhesionEvolutionChart
        partners={partners}
        onSelectPartner={onSelectPartner}
        onOpenMonthDrilldown={handleOpenMonthDrilldown}
      />

      {/* Dual Section: Overdue/Upcoming Contacts & Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contatos Atrasados e Próximos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Agenda de Contatos</span>
            </h3>
            {overdueContacts.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                {overdueContacts.length} atrasado(s)
              </span>
            )}
          </div>

          {/* Overdue list */}
          {overdueContacts.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Contatos Vencidos / Atrasados:
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {overdueContacts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPartner(p)}
                    className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100/70 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">{p.fantasyName}</h4>
                      <p className="text-[11px] text-rose-700">Resp: {p.assignedToName || 'Equipe'}</p>
                    </div>
                    <span className="text-xs font-extrabold text-rose-800 whitespace-nowrap">
                      {formatDate(p.nextContactDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming list */}
          <div className="space-y-2 flex-1">
            <span className="text-xs font-bold text-slate-700">Próximos Contatos Agendados:</span>
            {upcomingContacts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Nenhum contato futuro agendado.
              </div>
            ) : (
              <div className="space-y-1.5">
                {upcomingContacts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPartner(p)}
                    className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{p.fantasyName}</h4>
                      <p className="text-[11px] text-slate-500">{p.category} • {p.city || 'Belém'}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-700 whitespace-nowrap">
                      {formatDate(p.nextContactDate)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Por Categoria</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">{categoryStats.length} segmentos</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-72 flex-1 pr-1">
            {categoryStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Nenhuma categoria cadastrada.</div>
            ) : (
              categoryStats.map(([cat, total]) => {
                const pct = ((total / (activePartners.length || 1)) * 100).toFixed(0);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      handleOpenDrilldown(
                        'category',
                        cat,
                        `Parceiros: ${cat}`,
                        `Segmento "${cat}" • ${total} parceiro(s) cadastrado(s)`
                      )
                    }
                    className="w-full text-left p-2.5 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200/80 transition-all cursor-pointer group space-y-1.5"
                    title={`Clique para ver todos os ${total} parceiro(s) do segmento ${cat}`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold group-hover:text-blue-700 transition-colors flex items-center gap-1.5 truncate">
                        <span>{cat}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </span>
                      <span className="text-slate-500 font-bold group-hover:text-blue-700 text-xs flex-shrink-0">
                        {total} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 group-hover:bg-blue-700 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            <span>Clique em qualquer categoria para abrir a lista de parceiros</span>
          </div>
        </div>

        {/* Municipalities Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Top Municípios (PA)</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">Comarcas</span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-72 flex-1 pr-1">
            {cityStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Nenhum município cadastrado.</div>
            ) : (
              cityStats.map(([city, total]) => {
                const pct = ((total / (activePartners.length || 1)) * 100).toFixed(0);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() =>
                      handleOpenDrilldown(
                        'city',
                        city,
                        `Parceiros em ${city}`,
                        `Comarca de ${city} / PA • ${total} parceiro(s) cadastrado(s)`
                      )
                    }
                    className="w-full text-left p-2.5 rounded-xl hover:bg-indigo-50/80 border border-transparent hover:border-indigo-200/80 transition-all cursor-pointer group space-y-1.5"
                    title={`Clique para ver todos os ${total} parceiro(s) na comarca de ${city}`}
                  >
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold group-hover:text-indigo-700 transition-colors flex items-center gap-1.5 truncate">
                        <span>{city}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                      </span>
                      <span className="text-slate-500 font-bold group-hover:text-indigo-700 text-xs flex-shrink-0">
                        {total} parceiro(s)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 group-hover:bg-indigo-700 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            <span>Clique em qualquer município para abrir os resultados</span>
          </div>
        </div>
      </div>

      {/* Drilldown Modal with Instant Results and Navigation */}
      <DashboardDrilldownModal
        isOpen={drilldownState.isOpen}
        onClose={handleCloseDrilldown}
        type={drilldownState.type}
        filterValue={drilldownState.filterValue}
        title={drilldownState.title}
        subtitle={drilldownState.subtitle}
        partners={partners}
        customPartners={drilldownState.customPartners}
        onSelectPartner={onSelectPartner}
        onNavigateToTable={handleNavigateToTable}
      />
    </div>
  );
};
