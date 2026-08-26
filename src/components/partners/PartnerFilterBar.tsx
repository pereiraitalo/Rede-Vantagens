import React from 'react';
import { PartnerFilters, PartnerStage, PartnerOrigin, InterestLevel, Category, UserProfile } from '../../types';
import { STAGE_CONFIG } from './PartnerStageBadge';
import { ORIGIN_LABELS, INTEREST_LABELS } from '../../lib/exportUtils';
import { Search, Filter, RotateCcw, Building2, User, MapPin } from 'lucide-react';

interface PartnerFilterBarProps {
  filters: PartnerFilters;
  onChange: (newFilters: PartnerFilters) => void;
  onReset: () => void;
  categories: Category[];
  users: UserProfile[];
  cities: string[];
}

export const PartnerFilterBar: React.FC<PartnerFilterBarProps> = ({
  filters,
  onChange,
  onReset,
  categories,
  users,
  cities,
}) => {
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, stage: e.target.value as any });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, category: e.target.value });
  };

  const handleOriginChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, origin: e.target.value as any });
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, interestLevel: e.target.value as any });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, city: e.target.value });
  };

  const handleResponsibleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filters, responsibleUid: e.target.value });
  };

  const handleArchiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, isArchived: e.target.checked });
  };

  const isFiltered =
    !!filters.search ||
    (filters.stage && filters.stage !== 'all') ||
    (filters.category && filters.category !== 'all') ||
    (filters.origin && filters.origin !== 'all') ||
    (filters.interestLevel && filters.interestLevel !== 'all') ||
    (filters.city && filters.city !== 'all') ||
    (filters.responsibleUid && filters.responsibleUid !== 'all') ||
    !!filters.isArchived;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Search and primary filters row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Bar */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={handleTextChange}
            placeholder="Pesquisar por nome, CNPJ/CPF, processo, contato, cidade..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
          />
        </div>

        {/* Stage Filter */}
        <div>
          <select
            value={filters.stage || 'all'}
            onChange={handleStageChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white text-slate-700 font-medium"
          >
            <option value="all">Todas as Etapas</option>
            {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category || 'all'}
            onChange={handleCategoryChange}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white text-slate-700 font-medium"
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

      {/* Secondary filter chips and toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Origin filter */}
          <select
            value={filters.origin || 'all'}
            onChange={handleOriginChange}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-white"
          >
            <option value="all">Origem: Todas</option>
            {Object.entries(ORIGIN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                Origem: {v}
              </option>
            ))}
          </select>

          {/* Interest level */}
          <select
            value={filters.interestLevel || 'all'}
            onChange={handleInterestChange}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-white"
          >
            <option value="all">Interesse: Todos</option>
            {Object.entries(INTEREST_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                Interesse: {v}
              </option>
            ))}
          </select>

          {/* City filter */}
          {cities.length > 0 && (
            <select
              value={filters.city || 'all'}
              onChange={handleCityChange}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-white"
            >
              <option value="all">Município: Todos</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          )}

          {/* Responsible */}
          <select
            value={filters.responsibleUid || 'all'}
            onChange={handleResponsibleChange}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-slate-50 hover:bg-white"
          >
            <option value="all">Responsável: Todos</option>
            {users.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.displayName}
              </option>
            ))}
          </select>
        </div>

        {/* Right side: Archived toggle & Clear */}
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 cursor-pointer text-slate-600 select-none">
            <input
              type="checkbox"
              checked={!!filters.isArchived}
              onChange={handleArchiveToggle}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <span className="font-medium">Exibir arquivados</span>
          </label>

          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
