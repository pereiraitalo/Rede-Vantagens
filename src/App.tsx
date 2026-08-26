import React, { useState, useEffect, useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './components/common/ToastContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { KanbanBoard } from './components/kanban/KanbanBoard';
import { PartnerFilterBar } from './components/partners/PartnerFilterBar';
import { PartnerTable } from './components/partners/PartnerTable';
import { PartnerDetailView } from './components/partners/PartnerDetailView';
import { PartnerFormModal } from './components/partners/PartnerFormModal';
import { StageChangeModal } from './components/partners/StageChangeModal';
import { ActivityFormModal } from './components/partners/ActivityFormModal';
import { ReportsView } from './components/reports/ReportsView';
import { AdminView } from './components/admin/AdminView';

import { Partner, PartnerStage, Category, UserProfile, PartnerFilters } from './types';
import { onPartnersSnapshot, getAllPartners } from './services/partnerService';
import { onCategoriesSnapshot, getAllCategories } from './services/categoryService';
import { getAllUsers } from './services/userService';
import { checkAndSeedInitialData } from './services/seedService';
import { PlusCircle, RefreshCw } from 'lucide-react';

export function MainContent() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const toast = useToast();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Application Data States
  const [partners, setPartners] = useState<Partner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Selected Partner for 360° Detail View
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Modals Management
  const [partnerFormModalOpen, setPartnerFormModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);
  const [defaultStageForNewPartner, setDefaultStageForNewPartner] = useState<PartnerStage | undefined>();

  const [stageChangeModalOpen, setStageChangeModalOpen] = useState(false);
  const [stageChangePartner, setStageChangePartner] = useState<Partner | null>(null);
  const [stageChangeTarget, setStageChangeTarget] = useState<PartnerStage | null>(null);

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityPartner, setActivityPartner] = useState<Partner | null>(null);

  // Partner List Filters State
  const [partnerFilters, setPartnerFilters] = useState<PartnerFilters>({
    search: '',
    stage: 'all',
    category: 'all',
    origin: 'all',
    interestLevel: 'all',
    city: 'all',
    responsibleUid: 'all',
    isArchived: false,
  });

  // Unique cities list for filters
  const citiesList = useMemo(() => {
    const set = new Set<string>();
    partners.forEach((p) => {
      if (p.city?.trim()) set.add(p.city.trim());
    });
    return Array.from(set).sort();
  }, [partners]);

  // Load Initial Data & Snapshot Subscriptions
  useEffect(() => {
    if (!user) return;

    // Trigger initial seed if empty
    checkAndSeedInitialData({
      uid: user.uid,
      displayName: userProfile?.displayName || user.displayName || 'Gestor TJPA',
    }).catch(console.error);

    // Subscribe to Partners
    const unsubPartners = onPartnersSnapshot(
      (data) => {
        setPartners(data);
        setLoadingData(false);
        // If current selected partner is open, update reference
        setSelectedPartner((prev) => {
          if (!prev) return null;
          return data.find((p) => p.id === prev.id) || prev;
        });
      },
      (err) => {
        console.error('Snapshot error on partners:', err);
        // Fallback to fetch
        getAllPartners().then(setPartners).catch(console.error);
        setLoadingData(false);
      }
    );

    // Subscribe to Categories
    const unsubCats = onCategoriesSnapshot(
      (data) => setCategories(data),
      (err) => {
        console.error('Snapshot error on categories:', err);
        getAllCategories().then(setCategories).catch(console.error);
      }
    );

    // Fetch team users
    getAllUsers()
      .then(setUsers)
      .catch((err) => console.error('Error fetching users:', err));

    return () => {
      unsubPartners();
      unsubCats();
    };
  }, [user, userProfile]);

  // Handle opening New Partner Modal
  const handleOpenNewPartner = (initialStage?: PartnerStage) => {
    setPartnerToEdit(null);
    setDefaultStageForNewPartner(initialStage);
    setPartnerFormModalOpen(true);
  };

  // Handle Edit Partner
  const handleOpenEditPartner = (partner: Partner) => {
    setPartnerToEdit(partner);
    setDefaultStageForNewPartner(partner.currentStage);
    setPartnerFormModalOpen(true);
  };

  // Handle Stage Change Request
  const handleRequestStageChange = (partner: Partner, targetStage?: PartnerStage) => {
    setStageChangePartner(partner);
    if (targetStage) {
      setStageChangeTarget(targetStage);
    } else {
      // Default to next logical stage
      const order: PartnerStage[] = [
        'mapped',
        'prospecting',
        'waiting_docs',
        'in_analysis',
        'approved',
        'rejected',
        'gave_up',
        'inactive',
      ];
      const curIdx = order.indexOf(partner.currentStage);
      const next = order[curIdx + 1] || 'approved';
      setStageChangeTarget(next);
    }
    setStageChangeModalOpen(true);
  };

  // Handle Add Activity Request
  const handleOpenAddActivity = (partner: Partner) => {
    setActivityPartner(partner);
    setActivityModalOpen(true);
  };

  // Navigate to Detail View
  const handleSelectPartner = (partner: Partner) => {
    setSelectedPartner(partner);
    setCurrentView('partner_detail');
  };

  // Filtered partners list for the Table view
  const filteredPartnersList = useMemo(() => {
    return partners.filter((p) => {
      if (!partnerFilters.isArchived && p.isArchived) return false;
      if (partnerFilters.isArchived && !p.isArchived) return false;

      if (partnerFilters.search) {
        const q = partnerFilters.search.toLowerCase();
        const matches =
          p.fantasyName.toLowerCase().includes(q) ||
          (p.corporateName || '').toLowerCase().includes(q) ||
          (p.document || '').includes(q) ||
          (p.contactName || '').toLowerCase().includes(q) ||
          (p.city || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.processNumber || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (partnerFilters.stage && partnerFilters.stage !== 'all' && p.currentStage !== partnerFilters.stage) {
        return false;
      }

      if (partnerFilters.category && partnerFilters.category !== 'all' && p.category !== partnerFilters.category) {
        return false;
      }

      if (partnerFilters.origin && partnerFilters.origin !== 'all' && p.origin !== partnerFilters.origin) {
        return false;
      }

      if (
        partnerFilters.interestLevel &&
        partnerFilters.interestLevel !== 'all' &&
        p.interestLevel !== partnerFilters.interestLevel
      ) {
        return false;
      }

      if (
        partnerFilters.city &&
        partnerFilters.city !== 'all' &&
        (p.city || '').toLowerCase() !== partnerFilters.city.toLowerCase()
      ) {
        return false;
      }

      if (
        partnerFilters.responsibleUid &&
        partnerFilters.responsibleUid !== 'all' &&
        p.assignedToUid !== partnerFilters.responsibleUid
      ) {
        return false;
      }

      return true;
    });
  }, [partners, partnerFilters]);

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-bold text-sm tracking-wide">Iniciando Rede+ Gestão TJPA...</p>
      </div>
    );
  }

  // Unauthenticated -> Login View
  if (!user) {
    return <LoginView />;
  }

  return (
    <AppLayout
      activeView={currentView}
      onNavigate={(v) => {
        setCurrentView(v);
        if (v !== 'partner_detail') {
          setSelectedPartner(null);
        }
      }}
      onNewPartner={() => handleOpenNewPartner()}
    >
      {/* 1. DASHBOARD VIEW */}
      {currentView === 'dashboard' && (
        <DashboardView
          partners={partners}
          onSelectPartner={handleSelectPartner}
          onNavigateToPartnersWithFilter={(key, val) => {
            setPartnerFilters((prev) => ({ ...prev, [key]: val }));
            setCurrentView('partners');
          }}
          users={users}
        />
      )}

      {/* 2. KANBAN / FUNIL VIEW */}
      {currentView === 'kanban' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Funil de Prospecção & Adesão
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Visualização de pipeline interativo. Arraste ou clique para mover parceiros entre as 8 etapas regimentais.
              </p>
            </div>
          </div>

          <KanbanBoard
            partners={partners}
            onSelectPartner={handleSelectPartner}
            onEditPartner={handleOpenEditPartner}
            onRequestStageChange={handleRequestStageChange}
            onNewPartnerInStage={(stage) => handleOpenNewPartner(stage)}
            users={users}
          />
        </div>
      )}

      {/* 3. PARTNERS LIST & TABLE VIEW */}
      {currentView === 'partners' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Gestão de Parceiros Conveniados
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Base centralizada de parceiros potenciais e ativos do Programa Rede+ Vantagens TJPA.
              </p>
            </div>

            <button
              type="button"
              id="new-partner-table-btn"
              onClick={() => handleOpenNewPartner()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Cadastrar Novo Parceiro</span>
            </button>
          </div>

          <PartnerFilterBar
            filters={partnerFilters}
            onChange={setPartnerFilters}
            onReset={() =>
              setPartnerFilters({
                search: '',
                stage: 'all',
                category: 'all',
                origin: 'all',
                interestLevel: 'all',
                city: 'all',
                responsibleUid: 'all',
                isArchived: false,
              })
            }
            categories={categories}
            users={users}
            cities={citiesList}
          />

          <PartnerTable
            partners={filteredPartnersList}
            onSelectPartner={handleSelectPartner}
            onEditPartner={handleOpenEditPartner}
            onChangeStage={(p) => handleRequestStageChange(p)}
            onAddActivity={handleOpenAddActivity}
            users={users}
          />
        </div>
      )}

      {/* 4. PARTNER 360° DETAIL VIEW */}
      {currentView === 'partner_detail' && selectedPartner && (
        <PartnerDetailView
          partner={selectedPartner}
          onBack={() => setCurrentView('partners')}
          onEdit={handleOpenEditPartner}
          onChangeStage={(p, next) => handleRequestStageChange(p, next)}
          onAddActivity={handleOpenAddActivity}
          onRefresh={() => {
            getAllPartners().then(setPartners).catch(console.error);
          }}
          users={users}
        />
      )}

      {/* 5. REPORTS & INDICATORS VIEW */}
      {currentView === 'reports' && (
        <ReportsView
          partners={partners}
          onSelectPartner={handleSelectPartner}
          categories={categories}
          users={users}
          cities={citiesList}
        />
      )}

      {/* 6. CATEGORIES VIEW */}
      {currentView === 'categories' && (
        <AdminView
          initialTab="categories"
          onRefreshPartners={() => {
            getAllPartners().then(setPartners).catch(console.error);
            getAllCategories().then(setCategories).catch(console.error);
          }}
        />
      )}

      {/* 7. ADMIN & AUDIT VIEW */}
      {currentView === 'admin' && (
        <AdminView
          initialTab="users"
          onRefreshPartners={() => {
            getAllPartners().then(setPartners).catch(console.error);
            getAllCategories().then(setCategories).catch(console.error);
          }}
        />
      )}

      {/* MODALS */}
      <PartnerFormModal
        isOpen={partnerFormModalOpen}
        onClose={() => {
          setPartnerFormModalOpen(false);
          setPartnerToEdit(null);
        }}
        partnerToEdit={partnerToEdit}
        initialStage={defaultStageForNewPartner}
        categories={categories}
        users={users}
        onSuccess={() => {
          getAllPartners().then(setPartners).catch(console.error);
        }}
      />

      <StageChangeModal
        isOpen={stageChangeModalOpen}
        onClose={() => {
          setStageChangeModalOpen(false);
          setStageChangePartner(null);
          setStageChangeTarget(null);
        }}
        partner={stageChangePartner}
        targetStage={stageChangeTarget}
        onSuccess={() => {
          getAllPartners().then(setPartners).catch(console.error);
        }}
      />

      <ActivityFormModal
        isOpen={activityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setActivityPartner(null);
        }}
        partner={activityPartner}
        users={users}
        onSuccess={() => {
          getAllPartners().then(setPartners).catch(console.error);
        }}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ToastProvider>
  );
}
