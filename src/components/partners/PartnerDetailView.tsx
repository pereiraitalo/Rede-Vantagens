import React, { useState, useEffect } from 'react';
import { Partner, PartnerStatusHistory, Activity, UserProfile, PartnerStage } from '../../types';
import { PartnerStageBadge, STAGE_CONFIG } from './PartnerStageBadge';
import { formatDate, formatDateTime, isDateOverdue, isDateToday } from '../../lib/dateUtils';
import { ORIGIN_LABELS, INTEREST_LABELS, SCOPE_LABELS } from '../../lib/exportUtils';
import { getPartnerStatusHistory, archivePartner, restorePartner } from '../../services/partnerService';
import { getActivitiesByPartner, deleteActivity } from '../../services/activityService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ToastContext';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Instagram, 
  User, 
  Calendar, 
  ArrowLeft, 
  Edit3, 
  Archive, 
  RotateCcw, 
  PlusCircle, 
  Clock, 
  FileText, 
  Gift, 
  ExternalLink, 
  ShieldCheck, 
  PhoneCall, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface PartnerDetailViewProps {
  partner: Partner;
  onBack: () => void;
  onEdit: (partner: Partner) => void;
  onChangeStage: (partner: Partner, newStage?: PartnerStage) => void;
  onAddActivity: (partner: Partner) => void;
  onRefresh: () => void;
  users: UserProfile[];
}

export const PartnerDetailView: React.FC<PartnerDetailViewProps> = ({
  partner,
  onBack,
  onEdit,
  onChangeStage,
  onAddActivity,
  onRefresh,
  users,
}) => {
  const { user, userProfile, canEdit, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'timeline' | 'details' | 'process' | 'benefit'>('timeline');
  const [historyList, setHistoryList] = useState<PartnerStatusHistory[]>([]);
  const [activitiesList, setActivitiesList] = useState<Activity[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  // Archive / Restore confirmation
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [deleteActivityId, setDeleteActivityId] = useState<string | null>(null);

  const loadData = async () => {
    if (!partner.id) return;
    setLoadingTimeline(true);
    try {
      const [hist, acts] = await Promise.all([
        getPartnerStatusHistory(partner.id),
        getActivitiesByPartner(partner.id),
      ]);
      setHistoryList(hist);
      setActivitiesList(acts);
    } catch (err) {
      console.error('Error loading timeline data:', err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [partner.id]);

  const handleArchive = async () => {
    if (!partner.id) return;
    try {
      await archivePartner(partner.id, partner.fantasyName, {
        uid: user?.uid || 'anonymous',
        displayName: userProfile?.displayName || user?.displayName || 'Usuário TJPA',
      });
      toast.success(`Parceiro "${partner.fantasyName}" arquivado com sucesso.`);
      setArchiveModalOpen(false);
      onRefresh();
      onBack();
    } catch (err) {
      toast.error('Erro ao arquivar parceiro.');
    }
  };

  const handleRestore = async () => {
    if (!partner.id) return;
    try {
      await restorePartner(partner.id, partner.fantasyName, {
        uid: user?.uid || 'anonymous',
        displayName: userProfile?.displayName || user?.displayName || 'Usuário TJPA',
      });
      toast.success(`Parceiro "${partner.fantasyName}" restaurado com sucesso.`);
      setRestoreModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error('Erro ao restaurar parceiro.');
    }
  };

  const handleDeleteActivity = async () => {
    if (!deleteActivityId || !partner.id) return;
    try {
      await deleteActivity(deleteActivityId, partner.id, partner.fantasyName, {
        uid: user?.uid || 'anonymous',
        name: userProfile?.displayName || 'Usuário TJPA',
      });
      toast.success('Atividade removida com sucesso.');
      setDeleteActivityId(null);
      loadData();
    } catch (err) {
      toast.error('Erro ao excluir atividade.');
    }
  };

  // Combine history and activities into unified chronological timeline
  const combinedTimeline = [
    ...historyList.map((h) => ({
      id: `history-${h.id || Math.random()}`,
      kind: 'stage_change' as const,
      date: h.changedAt,
      author: h.changedByName,
      previousStage: h.previousStage,
      newStage: h.newStage,
      notes: h.notes,
    })),
    ...activitiesList.map((a) => ({
      id: `activity-${a.id || Math.random()}`,
      activityId: a.id,
      kind: 'activity' as const,
      date: a.date,
      author: a.responsibleName,
      type: a.type,
      description: a.description,
      result: a.result,
      nextAction: a.nextAction,
      nextActionDate: a.nextActionDate,
    })),
  ].sort((a, b) => {
    const da = a.date?.toMillis ? a.date.toMillis() : new Date(a.date || 0).getTime();
    const dbTime = b.date?.toMillis ? b.date.toMillis() : new Date(b.date || 0).getTime();
    return dbTime - da;
  });

  const nextContactOverdue = partner.nextContactDate && isDateOverdue(partner.nextContactDate);
  const nextContactIsToday = partner.nextContactDate && isDateToday(partner.nextContactDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <>
              <button
                type="button"
                id="detail-add-activity-btn"
                onClick={() => onAddActivity(partner)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Registrar Atividade</span>
              </button>

              <button
                type="button"
                id="detail-change-stage-btn"
                onClick={() => onChangeStage(partner)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Avançar Etapa</span>
              </button>

              <button
                type="button"
                id="detail-edit-partner-btn"
                onClick={() => onEdit(partner)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
            </>
          )}

          {canEdit && !partner.isArchived && (
            <button
              type="button"
              id="detail-archive-partner-btn"
              onClick={() => setArchiveModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
              title="Arquivar parceiro"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Arquivar</span>
            </button>
          )}

          {canEdit && partner.isArchived && (
            <button
              type="button"
              id="detail-restore-partner-btn"
              onClick={() => setRestoreModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Parceiro</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <Building2 className="w-7 h-7" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {partner.fantasyName}
                </h2>
                <PartnerStageBadge stage={partner.currentStage} size="md" />
                {partner.isArchived && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                    Arquivado
                  </span>
                )}
              </div>

              {partner.corporateName && (
                <p className="text-xs text-slate-500 mt-0.5">{partner.corporateName}</p>
              )}

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600">
                {partner.document && (
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {partner.personType === 'PJ' ? 'CNPJ' : 'CPF'}: {partner.document}
                  </span>
                )}
                <span className="font-medium text-slate-700">Categoria: {partner.category}</span>
                <span className="text-slate-500">
                  {partner.city || 'Belém'} - {partner.state || 'PA'}
                </span>
                <span className="text-slate-500">
                  Responsável: <strong className="text-slate-800">{partner.assignedToName || 'Não atribuído'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick next contact alert card */}
          {partner.nextContactDate && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 lg:max-w-xs ${
                nextContactOverdue
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : nextContactIsToday
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <Calendar className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider">
                  {nextContactOverdue
                    ? '⚠️ Contato Atrasado'
                    : nextContactIsToday
                    ? '🔔 Contato Hoje'
                    : '📅 Próximo Contato'}
                </p>
                <p className="text-sm font-extrabold">{formatDate(partner.nextContactDate)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'timeline'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Linha do Tempo & Atividades ({combinedTimeline.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dados Cadastrais & Contato</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'process'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Processo & Adesão TJPA</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('benefit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'benefit'
              ? 'border-blue-700 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Benefício aos Servidores</span>
        </button>
      </div>

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Histórico Cronológico de Interações e Transições
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => onAddActivity(partner)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800"
              >
                <PlusCircle className="w-4 h-4" /> Registrar Nova Atividade
              </button>
            )}
          </div>

          {loadingTimeline ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Carregando histórico do parceiro...
            </div>
          ) : combinedTimeline.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm">Nenhum registro encontrado ainda.</p>
              <p className="text-xs text-slate-400 mt-1">
                Todas as mudanças de etapa e atividades registradas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 ml-3 sm:ml-4">
              {combinedTimeline.map((item) => {
                if (item.kind === 'stage_change') {
                  const stageCfg = STAGE_CONFIG[item.newStage] || STAGE_CONFIG.mapped;
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline node */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">Mudança de Etapa:</span>
                            <PartnerStageBadge stage={item.previousStage} size="sm" />
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <PartnerStageBadge stage={item.newStage} size="sm" />
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {formatDateTime(item.date)}
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mb-2">
                            {item.notes}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-400">
                          Registrado por: <strong className="text-slate-600">{item.author}</strong>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={item.id} className="relative group">
                      {/* Timeline node */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white shadow-xs">
                        {item.type === 'call' ? (
                          <PhoneCall className="w-3 h-3" />
                        ) : item.type === 'meeting' ? (
                          <Users className="w-3 h-3" />
                        ) : item.type === 'email' ? (
                          <Mail className="w-3 h-3" />
                        ) : item.type === 'visit' ? (
                          <MapPin className="w-3 h-3" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-sm transition-shadow">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-800 uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                              {item.type === 'call'
                                ? 'Ligação / WhatsApp'
                                : item.type === 'meeting'
                                ? 'Reunião'
                                : item.type === 'email'
                                ? 'E-mail'
                                : item.type === 'visit'
                                ? 'Visita Presencial'
                                : item.type === 'followup'
                                ? 'Compromisso de Retorno'
                                : 'Atividade'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 font-medium">
                              {formatDateTime(item.date)}
                            </span>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => setDeleteActivityId(item.activityId || null)}
                                className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                                title="Excluir atividade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 leading-relaxed font-medium mb-2">
                          {item.description}
                        </p>

                        {item.result && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-2">
                            <strong className="text-slate-700">Resultado:</strong> {item.result}
                          </div>
                        )}

                        {item.nextAction && (
                          <div className="flex items-center justify-between text-xs text-blue-900 bg-blue-50/70 p-2 rounded-lg border border-blue-100 mb-2">
                            <span>
                              <strong>Próxima ação:</strong> {item.nextAction}
                            </span>
                            {item.nextActionDate && (
                              <span className="font-semibold">{formatDate(item.nextActionDate)}</span>
                            )}
                          </div>
                        )}

                        <div className="text-[11px] text-slate-400">
                          Responsável: <strong className="text-slate-600">{item.author}</strong>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DETAILS */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identificação */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Identificação & Localização
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Nome Fantasia</dt>
                <dd className="font-bold text-slate-900 text-sm mt-0.5">{partner.fantasyName}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Razão Social</dt>
                <dd className="text-slate-800 mt-0.5">{partner.corporateName || '-'}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">{partner.personType === 'PJ' ? 'CNPJ' : 'CPF'}</dt>
                <dd className="font-mono text-slate-800 mt-0.5">{partner.document || '-'}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Categoria</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{partner.category}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-slate-400 font-medium">Endereço</dt>
                <dd className="text-slate-800 mt-0.5">
                  {partner.address ? `${partner.address}, ` : ''}
                  {partner.city || 'Belém'} - {partner.state || 'PA'}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-slate-400 font-medium">Descrição da Atividade</dt>
                <dd className="text-slate-700 leading-relaxed mt-0.5">
                  {partner.description || 'Não informada.'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Contato & Prospecção */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Contatos & Relacionamento
            </h3>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-xs">
              <div>
                <dt className="text-slate-400 font-medium">Pessoa de Contato</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">{partner.contactName || '-'}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Cargo / Função</dt>
                <dd className="text-slate-800 mt-0.5">{partner.contactRole || '-'}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Telefone / WhatsApp</dt>
                <dd className="text-slate-800 font-semibold mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.phone || '-'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">E-mail Comercial</dt>
                <dd className="text-slate-800 mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.email || '-'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Site Oficial</dt>
                <dd className="text-slate-800 mt-0.5">
                  {partner.website ? (
                    <a
                      href={partner.website.startsWith('http') ? partner.website : `https://${partner.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Visitar site
                    </a>
                  ) : (
                    '-'
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Rede Social / Instagram</dt>
                <dd className="text-slate-800 mt-0.5 flex items-center gap-1">
                  <Instagram className="w-3.5 h-3.5 text-slate-400" />
                  <span>{partner.socialMedia || '-'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Origem do Parceiro</dt>
                <dd className="text-slate-800 font-semibold mt-0.5">{ORIGIN_LABELS[partner.origin] || partner.origin}</dd>
              </div>

              <div>
                <dt className="text-slate-400 font-medium">Nível de Interesse</dt>
                <dd className="mt-0.5">
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      partner.interestLevel === 'high'
                        ? 'bg-emerald-100 text-emerald-800'
                        : partner.interestLevel === 'low'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {partner.interestLevel ? INTEREST_LABELS[partner.interestLevel] : 'Médio'}
                  </span>
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-slate-400 font-medium">Observações da Prospecção</dt>
                <dd className="text-slate-700 leading-relaxed mt-0.5">
                  {partner.prospectingNotes || 'Nenhuma observação cadastrada.'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROCESS */}
      {activeTab === 'process' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Acompanhamento do Processo de Adesão Oficial
            </h3>
            {partner.officialPlatformUrl && (
              <a
                href={partner.officialPlatformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir Processo no TJPA</span>
              </a>
            )}
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Nº do Processo / Protocolo</dt>
              <dd className="text-base font-extrabold text-slate-900 font-mono mt-1">
                {partner.processNumber || 'Ainda não submetido'}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Resultado do Pedido</dt>
              <dd className="text-base font-extrabold mt-1">
                {partner.result === 'approved' ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Deferido
                  </span>
                ) : partner.result === 'rejected' ? (
                  <span className="text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Indeferido
                  </span>
                ) : (
                  <span className="text-slate-600">Em Tramitação / Pendente</span>
                )}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Data de Submissão</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.submissionDate)}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Data de Início da Análise</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.analysisStartDate)}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Data da Decisão</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.decisionDate)}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Data do Aceite / Adesão</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.acceptanceDate)}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Início da Parceria</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.partnershipStartDate)}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Encerramento da Parceria</dt>
              <dd className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(partner.partnershipEndDate)}
              </dd>
            </div>
          </dl>

          {partner.rejectionReason && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <h4 className="text-xs font-bold text-rose-900 mb-1">Motivo do Indeferimento:</h4>
              <p className="text-xs text-rose-800 leading-relaxed">{partner.rejectionReason}</p>
            </div>
          )}

          {partner.processNotes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-1">Observações do Processo:</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{partner.processNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BENEFIT */}
      {activeTab === 'benefit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            Benefício Oferecido aos Beneficiários do TJPA
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="flex items-center gap-2 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
                <Gift className="w-4 h-4" /> Descrição do Benefício
              </div>
              <p className="text-base font-bold text-slate-900 leading-snug">
                {partner.benefitDescription || 'Benefício ainda em fase de alinhamento.'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center items-center text-center">
              <span className="text-xs font-semibold text-slate-500 uppercase">Percentual de Desconto</span>
              <span className="text-3xl font-black text-blue-700 mt-1">
                {partner.discountPercentage !== undefined && partner.discountPercentage !== null
                  ? `${partner.discountPercentage}%`
                  : 'N/A'}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Público Contemplado</dt>
              <dd className="font-bold text-slate-800 text-sm mt-1">
                {partner.targetAudience || 'Magistrados, Servidores, Dependentes e Estagiários'}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Abrangência Territorial</dt>
              <dd className="font-bold text-slate-800 text-sm mt-1">
                {partner.scope ? SCOPE_LABELS[partner.scope] || partner.scope : 'Estadual (Pará)'}
              </dd>
            </div>

            <div className="sm:col-span-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Condições para Utilização</dt>
              <dd className="text-slate-700 leading-relaxed text-sm mt-1">
                {partner.conditions || 'Apresentação de documento de identidade funcional ou crachá institucional do TJPA.'}
              </dd>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-500 font-medium">Prazo de Validade do Acordo</dt>
              <dd className="font-semibold text-slate-800 text-sm mt-1">
                {formatDate(partner.validityDate)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchive}
        title="Arquivar Parceiro"
        message={`Tem certeza que deseja arquivar o parceiro "${partner.fantasyName}"? O registro não será excluído fisicamente e poderá ser restaurado a qualquer momento.`}
        type="warning"
        confirmText="Arquivar Registro"
      />

      <ConfirmDialog
        isOpen={restoreModalOpen}
        onClose={() => setRestoreModalOpen(false)}
        onConfirm={handleRestore}
        title="Restaurar Parceiro"
        message={`Deseja restaurar o parceiro "${partner.fantasyName}" para a lista de parceiros ativos?`}
        type="info"
        confirmText="Restaurar Registro"
      />

      <ConfirmDialog
        isOpen={!!deleteActivityId}
        onClose={() => setDeleteActivityId(null)}
        onConfirm={handleDeleteActivity}
        title="Excluir Atividade"
        message="Deseja remover esta atividade do histórico do parceiro? Esta ação é auditada."
        type="danger"
        confirmText="Excluir Atividade"
      />
    </div>
  );
};
