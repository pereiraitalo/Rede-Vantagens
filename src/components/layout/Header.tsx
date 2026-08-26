import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User as UserIcon, Shield, Menu, Building2 } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onNewPartnerClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  activeView,
  onNavigate,
  onNewPartnerClick,
}) => {
  const { userProfile, logout, canEdit, isAdmin } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 border border-purple-200">
            <Shield className="w-3 h-3" /> Administrador
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
            Gestor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            Consulta
          </span>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Painel de Gestão & Indicadores';
      case 'kanban':
        return 'Funil de Prospecção (Kanban)';
      case 'partners':
        return 'Gestão de Parceiros';
      case 'categories':
        return 'Categorias & Ramos de Atuação';
      case 'reports':
        return 'Relatórios Gerenciais';
      case 'admin':
        return 'Administração & Usuários';
      default:
        return 'Rede+ Gestão';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-400">
                TJPA • Rede+ Vantagens
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right side: User info & actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {canEdit && onNewPartnerClick && (
            <button
              type="button"
              id="header-new-partner-btn"
              onClick={onNewPartnerClick}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Novo Parceiro</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User profile capsule */}
          <div className="flex items-center gap-3 pl-1">
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[160px]">
                {userProfile?.displayName || 'Usuário'}
              </span>
              <div className="mt-0.5">{getRoleBadge(userProfile?.role)}</div>
            </div>

            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                className="w-9 h-9 rounded-full ring-2 ring-blue-600/20 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                <UserIcon className="w-4 h-4" />
              </div>
            )}

            <button
              type="button"
              id="header-logout-btn"
              onClick={logout}
              title="Sair do sistema"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
