import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { 
  Partner, 
  PartnerStage, 
  PartnerOrigin, 
  PersonType, 
  InterestLevel, 
  ProcessResult, 
  BenefitScope,
  Category,
  UserProfile
} from '../../types';
import { dateToInputString, parseInputDate } from '../../lib/dateUtils';
import { sanitizeForFirestore } from '../../lib/firestoreUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ToastContext';
import { createPartner, updatePartner } from '../../services/partnerService';
import { createCategory } from '../../services/categoryService';
import { 
  Building2, 
  User, 
  FileText, 
  Gift, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  ExternalLink,
  PlusCircle
} from 'lucide-react';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerToEdit?: Partner | null;
  onSuccess: (savedPartnerId: string) => void;
  categories: Category[];
  users: UserProfile[];
  initialStage?: PartnerStage;
}

export const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  partnerToEdit,
  onSuccess,
  categories,
  users,
  initialStage = 'mapped',
}) => {
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'identification' | 'prospecting' | 'process' | 'benefit'>('identification');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Form State
  const [fantasyName, setFantasyName] = useState('');
  const [corporateName, setCorporateName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [personType, setPersonType] = useState<PersonType>('PJ');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Belém');
  const [state, setState] = useState('PA');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');

  // Prospecção
  const [origin, setOrigin] = useState<PartnerOrigin>('active');
  const [assignedToUid, setAssignedToUid] = useState('');
  const [identificationDate, setIdentificationDate] = useState('');
  const [firstContactDate, setFirstContactDate] = useState('');
  const [lastContactDate, setLastContactDate] = useState('');
  const [nextContactDate, setNextContactDate] = useState('');
  const [firstContactChannel, setFirstContactChannel] = useState('WhatsApp');
  const [interestLevel, setInterestLevel] = useState<InterestLevel>('medium');
  const [prospectingNotes, setProspectingNotes] = useState('');

  // Processo
  const [currentStage, setCurrentStage] = useState<PartnerStage>('mapped');
  const [processNumber, setProcessNumber] = useState('');
  const [officialPlatformUrl, setOfficialPlatformUrl] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [analysisStartDate, setAnalysisStartDate] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [result, setResult] = useState<ProcessResult>('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [partnershipStartDate, setPartnershipStartDate] = useState('');
  const [partnershipEndDate, setPartnershipEndDate] = useState('');
  const [processNotes, setProcessNotes] = useState('');

  // Benefício
  const [benefitDescription, setBenefitDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [targetAudience, setTargetAudience] = useState('Magistrados, Servidores, Dependentes e Estagiários');
  const [conditions, setConditions] = useState('Apresentação de documento de identidade funcional ou crachá institucional do TJPA.');
  const [validityDate, setValidityDate] = useState('');
  const [scope, setScope] = useState<BenefitScope>('statewide');

  // Quick category creation
  const [showQuickCategoryInput, setShowQuickCategoryInput] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const handleCreateQuickCategory = async () => {
    if (!quickCategoryName.trim()) return;
    try {
      setCreatingCategory(true);
      const newName = quickCategoryName.trim();
      await createCategory(
        { name: newName, description: 'Criada via cadastro de parceiro', isActive: true },
        { uid: user?.uid || '', displayName: userProfile?.displayName || 'Gestor TJPA' }
      );
      toast.success(`Categoria "${newName}" cadastrada com sucesso!`);
      setCategory(newName);
      setQuickCategoryName('');
      setShowQuickCategoryInput(false);
      setIsDirty(true);
    } catch (err) {
      toast.error('Erro ao cadastrar categoria.');
    } finally {
      setCreatingCategory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      setIsDirty(false);
      if (partnerToEdit) {
        setFantasyName(partnerToEdit.fantasyName || '');
        setCorporateName(partnerToEdit.corporateName || '');
        setDocumentNumber(partnerToEdit.document || '');
        setPersonType(partnerToEdit.personType || 'PJ');
        setCategory(partnerToEdit.category || (categories[0]?.name || 'Outros'));
        setDescription(partnerToEdit.description || '');
        setWebsite(partnerToEdit.website || '');
        setSocialMedia(partnerToEdit.socialMedia || '');
        setPhone(partnerToEdit.phone || '');
        setEmail(partnerToEdit.email || '');
        setAddress(partnerToEdit.address || '');
        setCity(partnerToEdit.city || 'Belém');
        setState(partnerToEdit.state || 'PA');
        setContactName(partnerToEdit.contactName || '');
        setContactRole(partnerToEdit.contactRole || '');

        setOrigin(partnerToEdit.origin || 'active');
        setAssignedToUid(partnerToEdit.assignedToUid || '');
        setIdentificationDate(dateToInputString(partnerToEdit.identificationDate));
        setFirstContactDate(dateToInputString(partnerToEdit.firstContactDate));
        setLastContactDate(dateToInputString(partnerToEdit.lastContactDate));
        setNextContactDate(dateToInputString(partnerToEdit.nextContactDate));
        setFirstContactChannel(partnerToEdit.firstContactChannel || 'WhatsApp');
        setInterestLevel(partnerToEdit.interestLevel || 'medium');
        setProspectingNotes(partnerToEdit.prospectingNotes || '');

        setCurrentStage(partnerToEdit.currentStage || 'mapped');
        setProcessNumber(partnerToEdit.processNumber || '');
        setOfficialPlatformUrl(partnerToEdit.officialPlatformUrl || '');
        setSubmissionDate(dateToInputString(partnerToEdit.submissionDate));
        setAnalysisStartDate(dateToInputString(partnerToEdit.analysisStartDate));
        setDecisionDate(dateToInputString(partnerToEdit.decisionDate));
        setResult(partnerToEdit.result || 'pending');
        setRejectionReason(partnerToEdit.rejectionReason || '');
        setAcceptanceDate(dateToInputString(partnerToEdit.acceptanceDate));
        setPartnershipStartDate(dateToInputString(partnerToEdit.partnershipStartDate));
        setPartnershipEndDate(dateToInputString(partnerToEdit.partnershipEndDate));
        setProcessNotes(partnerToEdit.processNotes || '');

        setBenefitDescription(partnerToEdit.benefitDescription || '');
        setDiscountPercentage(partnerToEdit.discountPercentage !== undefined && partnerToEdit.discountPercentage !== null ? String(partnerToEdit.discountPercentage) : '');
        setTargetAudience(partnerToEdit.targetAudience || 'Magistrados, Servidores, Dependentes e Estagiários');
        setConditions(partnerToEdit.conditions || 'Apresentação de documento funcional do TJPA.');
        setValidityDate(dateToInputString(partnerToEdit.validityDate));
        setScope(partnerToEdit.scope || 'statewide');
      } else {
        // Reset to initial empty form
        const todayStr = dateToInputString(new Date());
        setFantasyName('');
        setCorporateName('');
        setDocumentNumber('');
        setPersonType('PJ');
        setCategory(categories[0]?.name || 'Outros');
        setDescription('');
        setWebsite('');
        setSocialMedia('');
        setPhone('');
        setEmail('');
        setAddress('');
        setCity('Belém');
        setState('PA');
        setContactName('');
        setContactRole('');

        setOrigin('active');
        setAssignedToUid(user?.uid || '');
        setIdentificationDate(todayStr);
        setFirstContactDate('');
        setLastContactDate('');
        setNextContactDate('');
        setFirstContactChannel('WhatsApp');
        setInterestLevel('medium');
        setProspectingNotes('');

        setCurrentStage(initialStage);
        setProcessNumber('');
        setOfficialPlatformUrl('');
        setSubmissionDate('');
        setAnalysisStartDate('');
        setDecisionDate('');
        setResult('pending');
        setRejectionReason('');
        setAcceptanceDate('');
        setPartnershipStartDate('');
        setPartnershipEndDate('');
        setProcessNotes('');

        setBenefitDescription('');
        setDiscountPercentage('');
        setTargetAudience('Magistrados, Servidores, Dependentes e Estagiários');
        setConditions('Apresentação de documento de identidade funcional ou crachá institucional do TJPA.');
        setValidityDate('');
        setScope('statewide');
      }
    }
  }, [isOpen, partnerToEdit, categories, user, initialStage]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!fantasyName.trim()) {
      errs.fantasyName = 'Nome Fantasia ou Razão Social é obrigatório.';
    }

    if (!currentStage) {
      errs.currentStage = 'Etapa atual é obrigatória.';
    }

    // Regra: Data da primeira prospecção não pode ser posterior à data da decisão
    if (firstContactDate && decisionDate) {
      const dFirst = new Date(firstContactDate);
      const dDec = new Date(decisionDate);
      if (dFirst > dDec) {
        errs.firstContactDate = 'A data da 1ª prospecção não pode ser posterior à data da decisão.';
      }
    }

    // Regra: "Em análise" deve exigir a data de submissão da documentação
    if (currentStage === 'in_analysis' && !submissionDate) {
      errs.submissionDate = 'A situação "Em análise" exige informar a data de submissão da documentação.';
    }

    // Regra: "Deferido" deve exigir a data da decisão e a data do aceite
    if (currentStage === 'approved') {
      if (!decisionDate) {
        errs.decisionDate = 'A situação "Deferido" exige informar a data da decisão.';
      }
      if (!acceptanceDate) {
        errs.acceptanceDate = 'A situação "Deferido" exige informar a data do aceite/adesão.';
      }
    }

    // Regra: "Indeferido" deve exigir a data da decisão e o motivo do indeferimento
    if (currentStage === 'rejected') {
      if (!decisionDate) {
        errs.decisionDate = 'A situação "Indeferido" exige informar a data da decisão.';
      }
      if (!rejectionReason.trim()) {
        errs.rejectionReason = 'A situação "Indeferido" exige o motivo do indeferimento.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleClose = () => {
    if (isDirty) {
      if (window.confirm('Existem alterações não salvas no formulário. Deseja realmente sair?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Por favor, corrija os campos obrigatórios destacados.');
      return;
    }

    setLoading(true);
    try {
      const assignedUser = users.find((u) => u.uid === assignedToUid);
      const assignedName = assignedUser ? assignedUser.displayName : userProfile?.displayName || 'Equipe TJPA';

      const partnerPayload: any = sanitizeForFirestore({
        fantasyName: fantasyName.trim(),
        corporateName: corporateName.trim() || null,
        document: documentNumber.trim() || null,
        personType,
        category: category || 'Outros',
        description: description.trim() || null,
        website: website.trim() || null,
        socialMedia: socialMedia.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || 'Belém',
        state: state.trim() || 'PA',
        contactName: contactName.trim() || null,
        contactRole: contactRole.trim() || null,

        origin,
        assignedToUid: assignedToUid || user?.uid || '',
        assignedToName: assignedName,
        identificationDate: parseInputDate(identificationDate),
        firstContactDate: parseInputDate(firstContactDate),
        lastContactDate: parseInputDate(lastContactDate),
        nextContactDate: parseInputDate(nextContactDate),
        firstContactChannel: firstContactChannel || null,
        interestLevel,
        prospectingNotes: prospectingNotes.trim() || null,

        currentStage,
        processNumber: processNumber.trim() || null,
        officialPlatformUrl: officialPlatformUrl.trim() || null,
        submissionDate: parseInputDate(submissionDate),
        analysisStartDate: parseInputDate(analysisStartDate),
        decisionDate: parseInputDate(decisionDate),
        result: currentStage === 'approved' ? 'approved' : currentStage === 'rejected' ? 'rejected' : result,
        rejectionReason: rejectionReason.trim() || null,
        acceptanceDate: parseInputDate(acceptanceDate),
        partnershipStartDate: parseInputDate(partnershipStartDate),
        partnershipEndDate: parseInputDate(partnershipEndDate),
        processNotes: processNotes.trim() || null,

        benefitDescription: benefitDescription.trim() || null,
        discountPercentage: discountPercentage ? parseFloat(discountPercentage) : null,
        targetAudience: targetAudience.trim() || null,
        conditions: conditions.trim() || null,
        validityDate: parseInputDate(validityDate),
        scope,
      });

      const actingUser = {
        uid: user?.uid || 'anonymous',
        displayName: userProfile?.displayName || user?.displayName || 'Usuário TJPA',
      };

      const savePromise = (async () => {
        if (partnerToEdit && partnerToEdit.id) {
          await updatePartner(partnerToEdit.id, partnerPayload, actingUser);
          return partnerToEdit.id;
        } else {
          return await createPartner(partnerPayload, actingUser);
        }
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      let savedId = '';
      try {
        savedId = await Promise.race([savePromise, timeoutPromise]);
        toast.success(
          partnerToEdit
            ? `Parceiro "${fantasyName}" atualizado com sucesso!`
            : `Parceiro "${fantasyName}" cadastrado com sucesso!`
        );
      } catch (raceErr: any) {
        if (raceErr?.message === 'timeout') {
          // Optimistic local fallback: Firestore SDK will sync write in background
          toast.success(`Parceiro "${fantasyName}" salvo com sucesso!`);
        } else {
          throw raceErr;
        }
      }

      setIsDirty(false);
      onSuccess(savedId || 'temp-id');
      onClose();
    } catch (err: any) {
      console.error('Error saving partner:', err);
      toast.error(err?.message || 'Erro ao salvar informações do parceiro.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (setter: any, val: any) => {
    setter(val);
    setIsDirty(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={partnerToEdit ? `Editar Parceiro: ${partnerToEdit.fantasyName}` : 'Cadastrar Novo Parceiro'}
      subtitle="Programa Rede+ Vantagens • Tribunal de Justiça do Pará"
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
          <button
            type="button"
            onClick={() => setActiveTab('identification')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'identification'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Identificação</span>
            {errors.fantasyName && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prospecting')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'prospecting'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>2. Prospecção & Contato</span>
            {errors.firstContactDate && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('process')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'process'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>3. Processo & Adesão</span>
            {(errors.submissionDate || errors.decisionDate || errors.acceptanceDate || errors.rejectionReason) && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('benefit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'benefit'
                ? 'border-blue-700 text-blue-700 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>4. Benefício Oferecido</span>
          </button>
        </div>

        {/* TAB 1: IDENTIFICAÇÃO */}
        {activeTab === 'identification' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia / Nome do Parceiro <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fantasyName}
                  onChange={(e) => handleFieldChange(setFantasyName, e.target.value)}
                  placeholder="Ex: Clínica Sorriso Perfeito / Restaurante do Bosque"
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.fantasyName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600`}
                />
                {errors.fantasyName && <p className="text-xs text-rose-600 mt-1">{errors.fantasyName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Pessoa</label>
                <select
                  value={personType}
                  onChange={(e) => handleFieldChange(setPersonType, e.target.value as PersonType)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="PJ">Pessoa Jurídica (PJ)</option>
                  <option value="PF">Pessoa Física (PF)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Razão Social</label>
                <input
                  type="text"
                  value={corporateName}
                  onChange={(e) => handleFieldChange(setCorporateName, e.target.value)}
                  placeholder="Ex: Sorriso Perfeito Serviços Odontológicos LTDA"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {personType === 'PJ' ? 'CNPJ' : 'CPF'}
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => handleFieldChange(setDocumentNumber, e.target.value)}
                  placeholder={personType === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Categoria / Ramo</label>
                  <button
                    type="button"
                    onClick={() => setShowQuickCategoryInput(!showQuickCategoryInput)}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{showQuickCategoryInput ? 'Cancelar' : '+ Nova Categoria'}</span>
                  </button>
                </div>

                {showQuickCategoryInput ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quickCategoryName}
                      onChange={(e) => setQuickCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateQuickCategory();
                        }
                      }}
                      placeholder="Nome do novo segmento..."
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      autoFocus
                    />
                    <button
                      type="button"
                      disabled={creatingCategory || !quickCategoryName.trim()}
                      onClick={handleCreateQuickCategory}
                      className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {creatingCategory ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => handleFieldChange(setCategory, e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {categories.length === 0 && <option value="Outros">Outros</option>}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handleFieldChange(setPhone, e.target.value)}
                  placeholder="(91) 98888-0000"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleFieldChange(setEmail, e.target.value)}
                  placeholder="contato@parceiro.com.br"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Site</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => handleFieldChange(setWebsite, e.target.value)}
                  placeholder="https://www.parceiro.com.br"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Instagram / Rede Social</label>
                <input
                  type="text"
                  value={socialMedia}
                  onChange={(e) => handleFieldChange(setSocialMedia, e.target.value)}
                  placeholder="@parceiro.oficial"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Endereço Completo</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => handleFieldChange(setAddress, e.target.value)}
                  placeholder="Av. Nazaré, 1000 - Nazaré"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Município</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => handleFieldChange(setCity, e.target.value)}
                  placeholder="Belém, Ananindeua, Santarém..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pessoa de Contato</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => handleFieldChange(setContactName, e.target.value)}
                  placeholder="Ex: Dra. Maria Santos"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Função do Contato</label>
                <input
                  type="text"
                  value={contactRole}
                  onChange={(e) => handleFieldChange(setContactRole, e.target.value)}
                  placeholder="Diretor Comercial / Gerente"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Resumida da Atividade
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => handleFieldChange(setDescription, e.target.value)}
                  placeholder="Breve descrição dos produtos ou serviços prestados pelo parceiro..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROSPECÇÃO */}
        {activeTab === 'prospecting' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Origem do Parceiro</label>
                <select
                  value={origin}
                  onChange={(e) => handleFieldChange(setOrigin, e.target.value as PartnerOrigin)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="active">Prospecção ativa</option>
                  <option value="spontaneous">Solicitação espontânea</option>
                  <option value="referral">Indicação</option>
                  <option value="event">Evento</option>
                  <option value="other">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsável Interno</label>
                <select
                  value={assignedToUid}
                  onChange={(e) => handleFieldChange(setAssignedToUid, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="">Não atribuído</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.displayName} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nível de Interesse</label>
                <select
                  value={interestLevel}
                  onChange={(e) => handleFieldChange(setInterestLevel, e.target.value as InterestLevel)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="low">Baixo</option>
                  <option value="medium">Médio</option>
                  <option value="high">Alto</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data de Identificação</label>
                <input
                  type="date"
                  value={identificationDate}
                  onChange={(e) => handleFieldChange(setIdentificationDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data da 1ª Prospecção</label>
                <input
                  type="date"
                  value={firstContactDate}
                  onChange={(e) => handleFieldChange(setFirstContactDate, e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.firstContactDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white`}
                />
                {errors.firstContactDate && <p className="text-xs text-rose-600 mt-1">{errors.firstContactDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Canal do 1º Contato</label>
                <select
                  value={firstContactChannel}
                  onChange={(e) => handleFieldChange(setFirstContactChannel, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telefone">Ligação Telefônica</option>
                  <option value="E-mail">E-mail Institucional</option>
                  <option value="Reunião presencial">Reunião Presencial</option>
                  <option value="Reunião online">Reunião Online (Meet / Teams)</option>
                  <option value="Ofício">Ofício / Correspondência</option>
                  <option value="Outro">Outro Canal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data do Último Contato</label>
                <input
                  type="date"
                  value={lastContactDate}
                  onChange={(e) => handleFieldChange(setLastContactDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Próximo Contato Previsto</label>
                <input
                  type="date"
                  value={nextContactDate}
                  onChange={(e) => handleFieldChange(setNextContactDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Prospecção</label>
                <textarea
                  rows={3}
                  value={prospectingNotes}
                  onChange={(e) => handleFieldChange(setProspectingNotes, e.target.value)}
                  placeholder="Anotações gerais sobre o diálogo inicial, interesses manifestados ou alinhamentos..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PROCESSO & ADESÃO */}
        {activeTab === 'process' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Etapa Atual do Parceiro <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentStage}
                  onChange={(e) => handleFieldChange(setCurrentStage, e.target.value as PartnerStage)}
                  className="w-full px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-slate-50"
                >
                  <option value="mapped">1. Mapeado (Potencial parceiro identificado)</option>
                  <option value="prospecting">2. Em prospecção (Contato iniciado)</option>
                  <option value="waiting_docs">3. Aguardando documentação (Interesse demonstrado)</option>
                  <option value="in_analysis">4. Em análise (Documentação submetida)</option>
                  <option value="approved">5. Deferido (Aprovado)</option>
                  <option value="rejected">6. Indeferido (Rejeitado)</option>
                  <option value="gave_up">7. Desistiu (Interessado não prosseguiu)</option>
                  <option value="inactive">8. Inativo (Parceria encerrada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nº do Processo / Protocolo</label>
                <input
                  type="text"
                  value={processNumber}
                  onChange={(e) => handleFieldChange(setProcessNumber, e.target.value)}
                  placeholder="Ex: TJPA-PRO-2026/00123"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Link de Consulta na Plataforma Oficial do TJPA
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={officialPlatformUrl}
                    onChange={(e) => handleFieldChange(setOfficialPlatformUrl, e.target.value)}
                    placeholder="https://sistemas.tjpa.jus.br/processo/..."
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                  {officialPlatformUrl && (
                    <a
                      href={officialPlatformUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1 text-xs font-semibold"
                    >
                      <ExternalLink className="w-4 h-4" /> Abrir
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Submissão dos Documentos {currentStage === 'in_analysis' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="date"
                  value={submissionDate}
                  onChange={(e) => handleFieldChange(setSubmissionDate, e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.submissionDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white`}
                />
                {errors.submissionDate && <p className="text-xs text-rose-600 mt-1">{errors.submissionDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data Início da Análise</label>
                <input
                  type="date"
                  value={analysisStartDate}
                  onChange={(e) => handleFieldChange(setAnalysisStartDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data da Decisão {(currentStage === 'approved' || currentStage === 'rejected') && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => handleFieldChange(setDecisionDate, e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.decisionDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white`}
                />
                {errors.decisionDate && <p className="text-xs text-rose-600 mt-1">{errors.decisionDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data do Aceite / Adesão {currentStage === 'approved' && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="date"
                  value={acceptanceDate}
                  onChange={(e) => handleFieldChange(setAcceptanceDate, e.target.value)}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                    errors.acceptanceDate ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  } focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white`}
                />
                {errors.acceptanceDate && <p className="text-xs text-rose-600 mt-1">{errors.acceptanceDate}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data Início da Parceria</label>
                <input
                  type="date"
                  value={partnershipStartDate}
                  onChange={(e) => handleFieldChange(setPartnershipStartDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data Encerramento (se houver)</label>
                <input
                  type="date"
                  value={partnershipEndDate}
                  onChange={(e) => handleFieldChange(setPartnershipEndDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              {currentStage === 'rejected' && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-rose-800 mb-1">
                    Motivo do Indeferimento <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => handleFieldChange(setRejectionReason, e.target.value)}
                    placeholder="Descreva a fundamentação da decisão de indeferimento..."
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      errors.rejectionReason ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    } focus:outline-none focus:ring-2 focus:ring-rose-600/30 focus:border-rose-600`}
                  />
                  {errors.rejectionReason && <p className="text-xs text-rose-600 mt-1">{errors.rejectionReason}</p>}
                </div>
              )}

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Processo</label>
                <textarea
                  rows={2}
                  value={processNotes}
                  onChange={(e) => handleFieldChange(setProcessNotes, e.target.value)}
                  placeholder="Informações adicionais da tramitação..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BENEFÍCIO OFERECIDO */}
        {activeTab === 'benefit' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição do Benefício</label>
                <input
                  type="text"
                  value={benefitDescription}
                  onChange={(e) => handleFieldChange(setBenefitDescription, e.target.value)}
                  placeholder="Ex: 20% de desconto em consultas e 15% em procedimentos"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Percentual de Desconto Médio (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={discountPercentage}
                  onChange={(e) => handleFieldChange(setDiscountPercentage, e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Abrangência Territorial</label>
                <select
                  value={scope}
                  onChange={(e) => handleFieldChange(setScope, e.target.value as BenefitScope)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                >
                  <option value="municipal">Municipal (Comarca local)</option>
                  <option value="regional">Regional (Polo / Região Judiciária)</option>
                  <option value="statewide">Estadual (Todo o Estado do Pará)</option>
                  <option value="national">Nacional</option>
                  <option value="online">Online / E-commerce</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prazo de Validade do Acordo</label>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => handleFieldChange(setValidityDate, e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Público Contemplado</label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => handleFieldChange(setTargetAudience, e.target.value)}
                  placeholder="Magistrados, Servidores, Dependentes e Estagiários"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Condições para Utilização</label>
                <textarea
                  rows={3}
                  value={conditions}
                  onChange={(e) => handleFieldChange(setConditions, e.target.value)}
                  placeholder="Ex: Apresentação de identidade funcional, crachá institucional ou declaração de vínculo emitida pelo TJPA..."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-slate-400" />
            <span>Campos com * são de preenchimento obrigatório.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="save-partner-btn"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{partnerToEdit ? 'Atualizar Dados' : 'Salvar Parceiro'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
