import React from 'react';
import { Partner, PartnerStage } from '../../types';
import { Modal } from '../common/Modal';
import { STAGE_CONFIG, PartnerStageBadge } from '../partners/PartnerStageBadge';
import { formatDate } from '../../lib/dateUtils';
import { 
  Building2, 
  MapPin, 
  Tag, 
  ArrowRight, 
  User, 
  ExternalLink, 
  Percent, 
  Phone, 
  Mail,
  TableProperties
} from 'lucide-react';

export type DrilldownType = 'category' | 'city' | 'stage' | 'all' | 'approved' | 'custom';

interface DashboardDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DrilldownType;
  filterValue: string;
  title: string;
  subtitle?: string;
  partners: Partner[];
  customPartners?: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onNavigateToTable: (filterKey: string, val: string) => void;
}

export const DashboardDrilldownModal: React.FC<DashboardDrilldownModalProps> = ({
  isOpen,
  onClose,
  type,
  filterValue,
  title,
  subtitle,
  partners,
  customPartners,
  onSelectPartner,
  onNavigateToTable,
}) => {
  const filtered = React.useMemo(() => {
    if (type === 'custom' && customPartners) {
      return customPartners;
    }
    return partners.filter((p) => {
      if (p.isArchived) return false;
      if (type === 'category') {
        return (p.category || 'Outros') === filterValue;
      }
      if (type === 'city') {
        return (p.city || 'Belém').toLowerCase() === filterValue.toLowerCase();
      }
      if (type === 'stage') {
        return p.currentStage === filterValue;
      }
      if (type === 'approved') {
        return p.currentStage === 'approved';
      }
      return true;
    });
  }, [partners, customPartners, type, filterValue]);

  const handleOpenFullTable = () => {
    onClose();
    if (type === 'category') {
      onNavigateToTable('category', filterValue);
    } else if (type === 'city') {
      onNavigateToTable('city', filterValue);
    } else if (type === 'stage') {
      onNavigateToTable('stage', filterValue);
    } else if (type === 'approved') {
      onNavigateToTable('stage', 'approved');
    } else {
      onNavigateToTable('stage', 'all');
    }
  };

  const handleCardClick = (partner: Partner) => {
    onClose();
    onSelectPartner(partner);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle || `${filtered.length} parceiro(s) encontrado(s)`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Header bar with Count and CTA */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="font-bold text-slate-900">Total listado:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-xs">
              {filtered.length} {filtered.length === 1 ? 'parceiro' : 'parceiros'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleOpenFullTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
          >
            <TableProperties className="w-3.5 h-3.5" />
            <span>Abrir todos na Tabela de Parceiros</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* Partners list cards */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhum parceiro ativo encontrado para este filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map((partner) => {
              return (
                <div
                  key={partner.id}
                  onClick={() => handleCardClick(partner)}
                  className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {partner.fantasyName}
                        </h4>
                        {partner.corporateName && partner.corporateName !== partner.fantasyName && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                            {partner.corporateName}
                          </p>
                        )}
                      </div>
                      <PartnerStageBadge stage={partner.currentStage} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 pt-1">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {partner.category || 'Outros'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {partner.city || 'Belém'}/{partner.state || 'PA'}
                      </span>
                      {partner.assignedToName && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {partner.assignedToName}
                        </span>
                      )}
                    </div>

                    {partner.benefitDescription && (
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {partner.benefitDescription}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {partner.discountPercentage ? (
                        <strong className="text-emerald-700 font-extrabold">
                          {partner.discountPercentage}% de desconto
                        </strong>
                      ) : (
                        'Benefício / Convênio'
                      )}
                    </span>

                    <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Ver detalhes
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Clique em qualquer parceiro para visualizar o cadastro completo.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
