import React, { useState, useMemo } from 'react';
import { Partner, PartnerStage, UserProfile } from '../../types';
import { PartnerStageBadge } from './PartnerStageBadge';
import { formatDate, isDateOverdue, isDateToday } from '../../lib/dateUtils';
import { exportPartnersToCSV } from '../../lib/exportUtils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building2, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  Edit3, 
  ArrowRight, 
  PlusCircle, 
  Columns, 
  Phone, 
  Calendar,
  AlertCircle
} from 'lucide-react';

interface PartnerTableProps {
  partners: Partner[];
  onSelectPartner: (partner: Partner) => void;
  onEditPartner: (partner: Partner) => void;
  onChangeStage: (partner: Partner) => void;
  onAddActivity: (partner: Partner) => void;
  users: UserProfile[];
}

type SortField = 'fantasyName' | 'category' | 'currentStage' | 'city' | 'assignedToName' | 'nextContactDate' | 'updatedAt';

export const PartnerTable: React.FC<PartnerTableProps> = ({
  partners,
  onSelectPartner,
  onEditPartner,
  onChangeStage,
  onAddActivity,
  users,
}) => {
  const { canEdit } = useAuth();

  // Sorting
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortAsc, setSortAsc] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    document: true,
    category: true,
    stage: true,
    city: true,
    assignedTo: true,
    nextContact: true,
    updatedAt: true,
    actions: true,
  });
  const [colMenuOpen, setColMenuOpen] = useState(false);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedPartners = useMemo(() => {
    return [...partners].sort((a, b) => {
      let valA: any = a[sortField as keyof Partner];
      let valB: any = b[sortField as keyof Partner];

      if (valA?.toMillis) valA = valA.toMillis();
      if (valB?.toMillis) valB = valB.toMillis();
      if (valA instanceof Date) valA = valA.getTime();
      if (valB instanceof Date) valB = valB.getTime();

      if (!valA && valB) return sortAsc ? 1 : -1;
      if (valA && !valB) return sortAsc ? -1 : 1;
      if (!valA && !valB) return 0;

      if (typeof valA === 'string') {
        const res = valA.localeCompare(valB || '', 'pt-BR');
        return sortAsc ? res : -res;
      }

      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [partners, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedPartners.length / pageSize) || 1;
  const paginatedPartners = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedPartners.slice(start, start + pageSize);
  }, [sortedPartners, page, pageSize]);

  const handleExport = () => {
    exportPartnersToCSV(sortedPartners, `parceiros_tjpa_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header controls: Counter, Column Toggle, Export */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold text-slate-800">
            {partners.length} {partners.length === 1 ? 'parceiro listado' : 'parceiros listados'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Toggle Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setColMenuOpen(!colMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Columns className="w-3.5 h-3.5 text-slate-500" />
              <span>Colunas</span>
            </button>

            {colMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-20 space-y-1.5">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Exibir Colunas
                </p>
                {Object.entries({
                  document: 'CNPJ / CPF',
                  category: 'Categoria',
                  stage: 'Etapa',
                  city: 'Município',
                  assignedTo: 'Responsável',
                  nextContact: 'Próximo Contato',
                  updatedAt: 'Atualizado em',
                }).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-xs text-slate-700 px-1 py-0.5 cursor-pointer hover:bg-slate-50 rounded">
                    <input
                      type="checkbox"
                      checked={visibleColumns[k]}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({ ...prev, [k]: e.target.checked }))
                      }
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export CSV */}
          <button
            type="button"
            id="export-partners-table-btn"
            onClick={handleExport}
            disabled={partners.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Table Body */}
      {partners.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          <Building2 className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">Nenhum parceiro encontrado</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Tente ajustar os termos de pesquisa ou remover os filtros aplicados.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th
                  onClick={() => toggleSort('fantasyName')}
                  className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Parceiro / Razão Social</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {visibleColumns.document && <th className="p-3.5">CNPJ / CPF</th>}

                {visibleColumns.category && (
                  <th
                    onClick={() => toggleSort('category')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Categoria</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.stage && (
                  <th
                    onClick={() => toggleSort('currentStage')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Etapa Atual</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.city && (
                  <th
                    onClick={() => toggleSort('city')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Município</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.assignedTo && (
                  <th
                    onClick={() => toggleSort('assignedToName')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Responsável</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.nextContact && (
                  <th
                    onClick={() => toggleSort('nextContactDate')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Próximo Contato</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.updatedAt && (
                  <th
                    onClick={() => toggleSort('updatedAt')}
                    className="p-3.5 cursor-pointer hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Última Alteração</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                )}

                {visibleColumns.actions && (
                  <th className="p-3.5 text-right">Ações</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {paginatedPartners.map((partner) => {
                const isOverdue = partner.nextContactDate && isDateOverdue(partner.nextContactDate);
                const isToday = partner.nextContactDate && isDateToday(partner.nextContactDate);

                return (
                  <tr
                    key={partner.id}
                    onClick={() => onSelectPartner(partner)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Partner Name & Details */}
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {partner.fantasyName}
                      </div>
                      {partner.corporateName && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{partner.corporateName}</div>
                      )}
                      {partner.contactName && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Contato: {partner.contactName} {partner.phone ? `• ${partner.phone}` : ''}
                        </div>
                      )}
                    </td>

                    {/* Document */}
                    {visibleColumns.document && (
                      <td className="p-3.5 font-mono text-slate-700 whitespace-nowrap">
                        {partner.document || '-'}
                      </td>
                    )}

                    {/* Category */}
                    {visibleColumns.category && (
                      <td className="p-3.5 font-medium text-slate-800 whitespace-nowrap">
                        {partner.category}
                      </td>
                    )}

                    {/* Stage Badge */}
                    {visibleColumns.stage && (
                      <td className="p-3.5 whitespace-nowrap">
                        <PartnerStageBadge stage={partner.currentStage} size="sm" />
                      </td>
                    )}

                    {/* City */}
                    {visibleColumns.city && (
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {partner.city || 'Belém'} - {partner.state || 'PA'}
                      </td>
                    )}

                    {/* Assigned Responsible */}
                    {visibleColumns.assignedTo && (
                      <td className="p-3.5 text-slate-700 font-medium whitespace-nowrap">
                        {partner.assignedToName || '-'}
                      </td>
                    )}

                    {/* Next Contact */}
                    {visibleColumns.nextContact && (
                      <td className="p-3.5 whitespace-nowrap">
                        {partner.nextContactDate ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : isToday
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-slate-700'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDate(partner.nextContactDate)}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    )}

                    {/* Updated At */}
                    {visibleColumns.updatedAt && (
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {formatDate(partner.updatedAt)}
                      </td>
                    )}

                    {/* Actions buttons */}
                    {visibleColumns.actions && (
                      <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onSelectPartner(partner)}
                            title="Ver detalhes"
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => onAddActivity(partner)}
                                title="Registrar atividade"
                                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onChangeStage(partner)}
                                title="Avançar etapa"
                                className="p-1.5 text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <ArrowRight className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => onEditPartner(partner)}
                                title="Editar dados"
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {partners.length > 0 && (
        <div className="p-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-500">
            <span>Linhas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Mostrando {Math.min((page - 1) * pageSize + 1, sortedPartners.length)} a{' '}
              {Math.min(page * pageSize, sortedPartners.length)} de {sortedPartners.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-slate-700 px-2">
              Página {page} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
