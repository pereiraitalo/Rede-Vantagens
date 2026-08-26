import React, { useState } from 'react';
import { Partner, PartnerStage, UserProfile } from '../../types';
import { STAGE_CONFIG, PartnerStageBadge } from '../partners/PartnerStageBadge';
import { formatDate, isDateOverdue, isDateToday } from '../../lib/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { StageLegendModal } from './StageLegendModal';
import { 
  PlusCircle, 
  Search, 
  Building2, 
  Calendar, 
  User, 
  ArrowRight, 
  MoreVertical,
  AlertCircle,
  HelpCircle,
  Info
} from 'lucide-react';

interface KanbanBoardProps {
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onRequestStageChange: (partner: Partner, targetStage: PartnerStage) => void;
  onNewPartnerInStage?: (stage: PartnerStage) => void;
  users: UserProfile[];
}

const STAGES_ORDER: PartnerStage[] = [
  'mapped',
  'prospecting',
  'waiting_docs',
  'in_analysis',
  'approved',
  'rejected',
  'gave_up',
  'inactive',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  partners,
  onSelectPartner,
  onEditPartner,
  onRequestStageChange,
  onNewPartnerInStage,
  users,
}) => {
  const { canEdit } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedPartnerId, setDraggedPartnerId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<PartnerStage | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [activeTooltipStage, setActiveTooltipStage] = useState<PartnerStage | null>(null);

  const filteredPartners = partners.filter((p) => {
    if (p.isArchived) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.fantasyName.toLowerCase().includes(term) ||
      (p.corporateName || '').toLowerCase().includes(term) ||
      (p.document || '').includes(term) ||
      (p.contactName || '').toLowerCase().includes(term) ||
      (p.city || '').toLowerCase().includes(term) ||
      (p.category || '').toLowerCase().includes(term)
    );
  });

  const handleDragStart = (e: React.DragEvent, partner: Partner) => {
    if (!canEdit || !partner.id) return;
    setDraggedPartnerId(partner.id);
    e.dataTransfer.setData('text/plain', partner.id);
  };

  const handleDragOver = (e: React.DragEvent, stage: PartnerStage) => {
    e.preventDefault();
    if (dragOverColumn !== stage) {
      setDragOverColumn(stage);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: PartnerStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const partnerId = e.dataTransfer.getData('text/plain') || draggedPartnerId;
    if (!partnerId) return;

    const partner = partners.find((p) => p.id === partnerId);
    if (partner && partner.currentStage !== targetStage) {
      onRequestStageChange(partner, targetStage);
    }
    setDraggedPartnerId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header controls: Search & Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar parceiros no funil..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLegendOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Clique para ver o significado e regras de todas as etapas"
          >
            <HelpCircle className="w-4 h-4 text-blue-700" />
            <span>Legendas das Etapas</span>
          </button>
          
          <span className="hidden lg:inline-block text-xs text-slate-500 pl-1">
            • Arraste os cartões para transição de etapa
          </span>
        </div>
      </div>

      {/* Kanban Columns Row */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start min-h-[calc(100vh-280px)]">
        {STAGES_ORDER.map((stage) => {
          const stageConfig = STAGE_CONFIG[stage];
          const stagePartners = filteredPartners.filter((p) => p.currentStage === stage);
          const isDragOver = dragOverColumn === stage;
          const isTooltipVisible = activeTooltipStage === stage;
          const Icon = stageConfig.icon;

          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage)}
              className={`flex-shrink-0 w-80 bg-slate-100/90 rounded-2xl border flex flex-col max-h-[80vh] transition-all ${
                isDragOver
                  ? 'border-blue-500 ring-2 ring-blue-400/30 bg-blue-50/50'
                  : 'border-slate-200 shadow-2xs'
              }`}
            >
              {/* Column Header with Hover Tooltip Popover */}
              <div 
                className="relative p-3.5 border-b border-slate-200/80 bg-white/80 rounded-t-2xl flex items-center justify-between"
                onMouseEnter={() => setActiveTooltipStage(stage)}
                onMouseLeave={() => setActiveTooltipStage(null)}
              >
                <div 
                  className="flex items-center gap-2 cursor-help group/header"
                  title={`${stageConfig.label}: ${stageConfig.description}`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${stageConfig.dot}`} />
                  <h3 className="text-xs font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                    {stageConfig.label}
                    <Info className="w-3.5 h-3.5 text-slate-400 group-hover/header:text-blue-600 transition-colors" />
                  </h3>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {stagePartners.length}
                  </span>
                  {canEdit && onNewPartnerInStage && (
                    <button
                      type="button"
                      onClick={() => onNewPartnerInStage(stage)}
                      title={`Cadastrar parceiro em ${stageConfig.label}`}
                      className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Floating Interactive Tooltip on hover */}
                {isTooltipVisible && (
                  <div className="absolute top-full left-2 right-2 mt-1 z-30 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="flex items-center gap-1.5 font-bold text-sky-300">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{stageConfig.label}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-[11px]">
                      {stageConfig.description}
                    </p>
                    <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400">
                      <strong className="text-slate-300">Ação:</strong> {stageConfig.actionHint}
                    </div>
                  </div>
                )}
              </div>

              {/* Cards Container */}
              <div className="p-3 overflow-y-auto space-y-3 flex-1">
                {stagePartners.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    Nenhum parceiro nesta etapa
                  </div>
                ) : (
                  stagePartners.map((partner) => {
                    const isOverdue = partner.nextContactDate && isDateOverdue(partner.nextContactDate);
                    const isToday = partner.nextContactDate && isDateToday(partner.nextContactDate);

                    return (
                      <div
                        key={partner.id}
                        draggable={canEdit}
                        onDragStart={(e) => handleDragStart(e, partner)}
                        onClick={() => onSelectPartner(partner)}
                        className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group select-none space-y-2.5"
                      >
                        {/* Title & Category */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                            {partner.fantasyName}
                          </h4>
                        </div>

                        {/* Category & City */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                            {partner.category}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">
                            {partner.city || 'Belém'}
                          </span>
                        </div>

                        {/* Contact Person */}
                        {partner.contactName && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                            <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="line-clamp-1">{partner.contactName}</span>
                          </div>
                        )}

                        {/* Next Contact Date Badge */}
                        {partner.nextContactDate && (
                          <div
                            className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg font-semibold ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                                : isToday
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-50 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>
                              {isOverdue ? 'Atrasado: ' : isToday ? 'Hoje: ' : 'Próx: '}
                              {formatDate(partner.nextContactDate)}
                            </span>
                          </div>
                        )}

                        {/* Footer info: Responsible & Quick move */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="truncate max-w-[140px]">
                            {partner.assignedToName || 'Sem responsável'}
                          </span>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentIndex = STAGES_ORDER.indexOf(partner.currentStage);
                                const nextStage = STAGES_ORDER[currentIndex + 1] || 'approved';
                                onRequestStageChange(partner, nextStage);
                              }}
                              className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Avançar para próxima etapa"
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Legend Full Modal */}
      <StageLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />
    </div>
  );
};
