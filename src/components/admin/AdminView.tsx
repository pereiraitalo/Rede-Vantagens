import React, { useState, useEffect } from 'react';
import { UserProfile, Category, AuditLog, AppRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ToastContext';
import { getAllUsers, updateUserProfile } from '../../services/userService';
import { 
  getAllCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  seedDefaultCategories,
  cleanupDuplicateCategories,
  onCategoriesSnapshot
} from '../../services/categoryService';
import { getRecentAuditLogs } from '../../services/auditService';
import { formatDateTime } from '../../lib/dateUtils';
import { 
  Users, 
  Tags, 
  ShieldCheck, 
  History, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Sparkles,
  Layers,
  Loader2,
  Wand2
} from 'lucide-react';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface AdminViewProps {
  initialTab?: 'users' | 'categories' | 'audit';
  onRefreshPartners?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ initialTab = 'users', onRefreshPartners }) => {
  const { user, userProfile, isAdmin, canEdit } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'audit'>(initialTab);

  // Users Management
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Categories Management
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [submittingCat, setSubmittingCat] = useState(false);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Real-time listener for categories
  useEffect(() => {
    const unsub = onCategoriesSnapshot(
      (data) => {
        setCategoriesList(data);
      },
      (err) => {
        console.warn('Real-time categories error:', err);
      }
    );
    return () => unsub();
  }, []);

  const loadAllAdminData = async () => {
    setLoadingUsers(true);
    setLoadingAudit(true);
    try {
      const [u, a] = await Promise.all([
        getAllUsers(),
        getRecentAuditLogs(60),
      ]);
      setUsersList(u);
      setAuditLogs(a);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoadingUsers(false);
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Update user role
  const handleRoleChange = async (targetUser: UserProfile, newRole: AppRole) => {
    if (!isAdmin) {
      toast.error('Apenas administradores podem alterar perfis de acesso.');
      return;
    }
    try {
      await updateUserProfile(
        targetUser.uid,
        { role: newRole },
        { uid: user?.uid || '', displayName: userProfile?.displayName || 'Admin TJPA' }
      );
      toast.success(`Perfil de ${targetUser.displayName} alterado para ${newRole.toUpperCase()}.`);
      loadAllAdminData();
    } catch (err) {
      toast.error('Erro ao atualizar perfil do usuário.');
    }
  };

  // Toggle user active status
  const handleToggleUserActive = async (targetUser: UserProfile) => {
    if (!isAdmin) return;
    try {
      await updateUserProfile(
        targetUser.uid,
        { isActive: !targetUser.isActive },
        { uid: user?.uid || '', displayName: userProfile?.displayName || 'Admin TJPA' }
      );
      toast.success(`Usuário ${targetUser.isActive ? 'desativado' : 'ativado'} com sucesso.`);
      loadAllAdminData();
    } catch (err) {
      toast.error('Erro ao alterar status do usuário.');
    }
  };

  // Add Category with Timeout safety
  const handleAddCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newCatName.trim();
    if (!trimmedName) {
      toast.error('Por favor, informe o nome da categoria.');
      return;
    }

    setSubmittingCat(true);

    try {
      // Race createCategory with a 5-second timeout to prevent button getting stuck
      const createPromise = createCategory(
        { name: trimmedName, description: newCatDesc.trim(), isActive: true },
        { uid: user?.uid || '', displayName: userProfile?.displayName || 'Gestor TJPA' }
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 6000)
      );

      await Promise.race([createPromise, timeoutPromise]);
      toast.success(`Categoria "${trimmedName}" cadastrada com sucesso!`);
      setNewCatName('');
      setNewCatDesc('');
      if (onRefreshPartners) onRefreshPartners();
    } catch (err: any) {
      if (err?.message === 'timeout') {
        // Offline / optimistic completion: reset UI
        toast.info(`Categoria "${trimmedName}" enviada para gravação.`);
        setNewCatName('');
        setNewCatDesc('');
      } else {
        console.error('Category creation error:', err);
        toast.error(err?.message || 'Erro ao criar categoria.');
      }
    } finally {
      setSubmittingCat(false);
    }
  };

  // Update Category with Timeout safety
  const handleSaveEditCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingCat || !editingCat.id) return;
    setSubmittingCat(true);
    try {
      const updatePromise = updateCategory(
        editingCat.id,
        { name: editingCat.name, description: editingCat.description, isActive: editingCat.isActive },
        { uid: user?.uid || '', displayName: userProfile?.displayName || 'Gestor TJPA' }
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 6000)
      );

      await Promise.race([updatePromise, timeoutPromise]);
      toast.success('Categoria atualizada com sucesso!');
      setEditingCat(null);
      if (onRefreshPartners) onRefreshPartners();
    } catch (err: any) {
      if (err?.message === 'timeout') {
        toast.info('Alteração enviada para gravação.');
        setEditingCat(null);
      } else {
        console.error('Category update error:', err);
        toast.error(err?.message || 'Erro ao atualizar categoria.');
      }
    } finally {
      setSubmittingCat(false);
    }
  };

  // Delete Category
  const handleConfirmDeleteCat = async () => {
    if (!deleteCatId) return;
    try {
      await deleteCategory(deleteCatId, {
        uid: user?.uid || '',
        displayName: userProfile?.displayName || 'Gestor TJPA',
      });
      toast.success('Categoria removida com sucesso!');
      setDeleteCatId(null);
      if (onRefreshPartners) onRefreshPartners();
    } catch (err: any) {
      console.error('Category delete error:', err);
      toast.error('Erro ao excluir categoria.');
    }
  };

  // Seed standard TJPA categories (duplicate-safe)
  const handleSeedCategories = async () => {
    try {
      setSubmittingCat(true);
      await seedDefaultCategories({
        uid: user?.uid || '',
        displayName: userProfile?.displayName || 'Gestor TJPA',
      });
      toast.success('Categorias institucionais carregadas sem duplicidades!');
      if (onRefreshPartners) onRefreshPartners();
    } catch (err: any) {
      console.error('Seed categories error:', err);
      toast.error('Erro ao inicializar categorias.');
    } finally {
      setSubmittingCat(false);
    }
  };

  // Clean duplicate categories from database
  const handleCleanupDuplicates = async () => {
    try {
      setCleaningDuplicates(true);
      const removedCount = await cleanupDuplicateCategories();
      if (removedCount > 0) {
        toast.success(`${removedCount} categoria(s) duplicada(s) unificada(s) com sucesso!`);
      } else {
        toast.info('Nenhuma duplicidade encontrada na base de dados.');
      }
      if (onRefreshPartners) onRefreshPartners();
    } catch (err) {
      toast.error('Erro ao unificar duplicidades.');
    } finally {
      setCleaningDuplicates(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {activeTab === 'categories' ? 'Categorias & Ramos de Atuação' : 'Administração & Governança do Sistema'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {activeTab === 'categories'
            ? 'Cadastre e gerencie os segmentos e ramos de atividade dos parceiros conveniados do TJPA.'
            : 'Gerenciamento de usuários, permissões de acesso (RBAC), categorias de convênio e trilha de auditoria imutável.'}
        </p>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Categorias & Segmentos ({categoriesList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários e Perfis ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-700 text-blue-700 bg-blue-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Trilha de Auditoria TJPA ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add / Edit Category Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Tags className="w-4 h-4 text-blue-600" />
              <span>{editingCat ? 'Editar Categoria' : 'Cadastrar Nova Categoria'}</span>
            </h3>

            <form 
              onSubmit={editingCat ? handleSaveEditCategory : handleAddCategory} 
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome do Segmento / Categoria <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="category-name-input"
                  value={editingCat ? editingCat.name : newCatName}
                  onChange={(e) =>
                    editingCat
                      ? setEditingCat({ ...editingCat, name: e.target.value })
                      : setNewCatName(e.target.value)
                  }
                  placeholder="Ex: Alimentação, Odontologia, Educação..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição / Exemplos de Estabelecimentos</label>
                <textarea
                  rows={3}
                  id="category-desc-input"
                  value={editingCat ? editingCat.description || '' : newCatDesc}
                  onChange={(e) =>
                    editingCat
                      ? setEditingCat({ ...editingCat, description: e.target.value })
                      : setNewCatDesc(e.target.value)
                  }
                  placeholder="Ex: Clínicas odontológicas, consultórios médicos e laboratórios de análises."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {editingCat && (
                  <button
                    type="button"
                    onClick={() => setEditingCat(null)}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}

                <button
                  type="submit"
                  id="btn-cadastrar-categoria"
                  disabled={submittingCat || (!editingCat && !newCatName.trim())}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {submittingCat ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gravando...</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      <span>{editingCat ? 'Salvar Alterações' : 'Cadastrar Categoria'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
              <button
                type="button"
                id="btn-seed-categories"
                disabled={submittingCat}
                onClick={handleSeedCategories}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Restaurar / Inicializar Categorias TJPA</span>
              </button>

              <button
                type="button"
                id="btn-cleanup-duplicates"
                disabled={cleaningDuplicates || submittingCat}
                onClick={handleCleanupDuplicates}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
              >
                {cleaningDuplicates ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>Limpar e Unificar Duplicidades</span>
              </button>
            </div>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Segmentos Disponíveis ({categoriesList.length})
                </h3>
              </div>
              <span className="text-[11px] font-medium text-slate-400">
                Sincronizado com Firestore
              </span>
            </div>

            <div className="divide-y divide-slate-100 flex-1 overflow-y-auto max-h-[550px]">
              {categoriesList.map((cat) => (
                <div key={cat.id || cat.name} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      {cat.name}
                    </h4>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-1 pl-4">{cat.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCat(cat)}
                      className="p-2 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="Editar Categoria"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {(isAdmin || canEdit) && (
                      <button
                        type="button"
                        onClick={() => setDeleteCatId(cat.id || null)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Excluir Categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {categoriesList.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Nenhuma categoria cadastrada ainda. Utilize o formulário ao lado ou carregue as categorias oficiais do TJPA.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
            <div>
              <strong className="font-bold">Controle de Acesso Baseado em Funções (RBAC):</strong>
              <p className="mt-0.5 text-blue-800">
                <strong>Administrador:</strong> Acesso total, alteração de usuários e configurações. •{' '}
                <strong>Gestor:</strong> Criação, edição, avanço de etapas e atividades. •{' '}
                <strong>Visualizador:</strong> Consulta de dados, métricas e relatórios sem permissão de escrita.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Nome / Identificação</th>
                    <th className="p-3.5">E-mail Institucional</th>
                    <th className="p-3.5">Função no TJPA</th>
                    <th className="p-3.5">Perfil de Acesso</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900">
                        {u.displayName}
                        {u.uid === user?.uid && (
                          <span className="ml-2 text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                            Você
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 font-mono text-slate-600">{u.email}</td>

                      <td className="p-3.5 text-slate-700">{u.jobTitle || 'Equipe Rede+'}</td>

                      <td className="p-3.5">
                        <select
                          disabled={!isAdmin || u.uid === user?.uid}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u, e.target.value as AppRole)}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-800 disabled:opacity-60 cursor-pointer"
                        >
                          <option value="admin">Administrador</option>
                          <option value="manager">Gestor</option>
                          <option value="viewer">Visualizador</option>
                        </select>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        {isAdmin && u.uid !== user?.uid && (
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                              u.isActive
                                ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Desativar' : 'Reativar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center justify-between">
            <div>
              <strong className="font-bold">Trilha de Auditoria Imutável do Tribunal de Justiça do Pará:</strong>
              <p className="mt-0.5 text-slate-600">
                Todos os registros de criação, edição, avanço de etapa e exclusões de atividades são gravados em logs seguros e não podem ser apagados por nenhum usuário.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Data / Hora</th>
                    <th className="p-3.5">Ação Realizada</th>
                    <th className="p-3.5">Usuário Responsável</th>
                    <th className="p-3.5">Alvo / Parceiro</th>
                    <th className="p-3.5">Detalhes da Alteração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>

                      <td className="p-3.5 font-sans font-bold text-slate-800 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 border border-slate-200">
                          {log.action}
                        </span>
                      </td>

                      <td className="p-3.5 font-sans font-medium text-slate-900 whitespace-nowrap">
                        {log.userName || log.userEmail || 'Sistema'}
                      </td>

                      <td className="p-3.5 font-sans font-semibold text-blue-700 whitespace-nowrap">
                        {log.entityName || log.entityId}
                      </td>

                      <td className="p-3.5 font-sans text-slate-600 max-w-md truncate">
                        {typeof log.details === 'string'
                          ? log.details
                          : JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteCatId}
        onClose={() => setDeleteCatId(null)}
        onConfirm={handleConfirmDeleteCat}
        title="Excluir Categoria"
        message="Tem certeza que deseja remover esta categoria de parceiros? Esta ação é auditada."
        type="danger"
        confirmText="Excluir Categoria"
      />
    </div>
  );
};
