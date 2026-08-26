import React from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  Building2, 
  Tags,
  FileText, 
  ShieldCheck, 
  PlusCircle, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onNewPartnerClick?: () => void;
  partnerCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onNavigate,
  isOpenMobile,
  onCloseMobile,
  onNewPartnerClick,
  partnerCount = 0,
}) => {
  const { canEdit, userProfile } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Indicadores e visão geral',
    },
    {
      id: 'kanban',
      label: 'Funil de Prospecção',
      icon: KanbanSquare,
      description: 'Etapas de adesão (Kanban)',
    },
    {
      id: 'partners',
      label: 'Parceiros',
      icon: Building2,
      badge: partnerCount > 0 ? partnerCount : undefined,
      description: 'Lista e filtros completos',
    },
    {
      id: 'categories',
      label: 'Categorias & Ramos',
      icon: Tags,
      description: 'Cadastrar e gerenciar segmentos',
    },
    {
      id: 'reports',
      label: 'Relatórios & Exportação',
      icon: FileText,
      description: 'Consultas e indicadores em CSV',
    },
    {
      id: 'admin',
      label: 'Administração',
      icon: ShieldCheck,
      description: 'Usuários, perfis e auditoria',
    },
  ];

  const handleNavClick = (viewId: string) => {
    onNavigate(viewId);
    onCloseMobile();
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Rede+</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Gestão
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">
              Programa Rede+ Vantagens TJPA
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Action Button for Managers/Admins */}
      {canEdit && onNewPartnerClick && (
        <div className="p-4 pb-2">
          <button
            type="button"
            id="sidebar-new-partner-btn"
            onClick={() => {
              onNewPartnerClick();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-900/40 hover:shadow-blue-600/30 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Cadastrar Parceiro</span>
          </button>
        </div>
      )}

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Principal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60">
        <div className="text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span>Poder Judiciário</span>
            <span className="font-semibold text-slate-300">TJPA</span>
          </div>
          <p className="text-[10px] text-slate-300">
            Perfil ativo:{' '}
            <span className="font-bold text-blue-400 capitalize">
              {userProfile?.role === 'admin' ? 'Administrador' : userProfile?.role === 'manager' ? 'Gestor' : 'Consulta'}
            </span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-40 border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
