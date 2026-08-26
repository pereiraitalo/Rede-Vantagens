import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Partner, PartnerStage } from '../../types';
import { STAGE_CONFIG, PartnerStageBadge } from './PartnerStageBadge';
import { dateToInputString, parseInputDate } from '../../lib/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ToastContext';
import { changePartnerStage } from '../../services/partnerService';
import { ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface StageChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  targetStage: PartnerStage | null;
  onSuccess: () => void;
}

export const StageChangeModal: React.FC<StageChangeModalProps> = ({
  isOpen,
  onClose,
  partner,
  targetStage,
  onSuccess,
}) => {
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [notes, setNotes] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [decisionDate, setDecisionDate] = useState('');
  const [acceptanceDate, setAcceptanceDate] = useState('');
  const [partnershipStartDate, setPartnershipStartDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && partner) {
      const todayStr = dateToInputString(new Date());
      setNotes('');
      setSubmissionDate(dateToInputString(partner.submissionDate) || (targetStage === 'in_analysis' ? todayStr : ''));
      setDecisionDate(dateToInputString(partner.decisionDate) || ((targetStage === 'approved' || targetStage === 'rejected') ? todayStr : ''));
      setAcceptanceDate(dateToInputString(partner.acceptanceDate) || (targetStage === 'approved' ? todayStr : ''));
      setPartnershipStartDate(dateToInputString(partner.partnershipStartDate) || '');
      setRejectionReason(partner.rejectionReason || '');
      setErrors({});
    }
  }, [isOpen, partner, targetStage]);

  if (!partner || !targetStage) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (targetStage === 'in_analysis' && !submissionDate) {
      errs.submissionDate = 'A data de submissão da documentação é obrigatória para a etapa "Em análise".';
    }

    if (targetStage === 'approved') {
      if (!decisionDate) {
        errs.decisionDate = 'A data da decisão é obrigatória para deferimento.';
      }
      if (!acceptanceDate) {
        errs.acceptanceDate = 'A data de aceite/adesão é obrigatória para deferimento.';
      }
    }

    if (targetStage === 'rejected') {
      if (!decisionDate) {
        errs.decisionDate = 'A data da decisão é obrigatória para indeferimento.';
      }
      if (!rejectionReason.trim()) {
        errs.rejectionReason = 'O motivo do indeferimento é obrigatório.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) {
      toast.error('Preencha os campos obrigatórios da nova etapa.');
      return;
    }

    setLoading(true);
    try {
      const extraFields: Partial<Partner> = {};

      if (submissionDate) {
        extraFields.submissionDate = parseInputDate(submissionDate);
      }
      if (decisionDate) {
        extraFields.decisionDate = parseInputDate(decisionDate);
      }
      if (acceptanceDate) {
        extraFields.acceptanceDate = parseInputDate(acceptanceDate);
      }
      if (partnershipStartDate) {
        extraFields.partnershipStartDate = parseInputDate(partnershipStartDate);
      }
      if (rejectionReason) {
        extraFields.rejectionReason = rejectionReason.trim();
      }

      const savePromise = changePartnerStage(
        partner.id!,
        targetStage,
        notes.trim(),
        extraFields,
        {
          uid: user?.uid || 'anonymous',
          displayName: userProfile?.displayName || user?.displayName || 'Usuário TJPA',
        }
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      try {
        await Promise.race([savePromise, timeoutPromise]);
        toast.success(`Etapa do parceiro "${partner.fantasyName}" atualizada com sucesso!`);
      } catch (raceErr: any) {
        if (raceErr?.message === 'timeout') {
          toast.success(`Transição enviada com sucesso!`);
        } else {
          throw raceErr;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao alterar etapa do parceiro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Transição de Etapa"
      subtitle={partner.fantasyName}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Stage change transition banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Etapa Atual</span>
            <PartnerStageBadge stage={partner.currentStage} size="sm" />
          </div>

          <div className="px-2 text-slate-400">
            <ArrowRight className="w-5 h-5" />
          </div>

          <div className="flex flex-col items-center sm:items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">Nova Etapa</span>
            <PartnerStageBadge stage={targetStage} size="sm" />
          </div>
        </div>

        {/* Dynamic Required Fields depending on targetStage */}
        {targetStage === 'in_analysis' && (
          <div className="p-4 bg-purple-50/50 border border-purple-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>Campos obrigatórios para "Em Análise"</span>
            </h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data de Submissão da Documentação <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm rounded-xl border ${
                  errors.submissionDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                } bg-white`}
              />
              {errors.submissionDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.submissionDate}</p>
              )}
            </div>
          </div>
        )}

        {targetStage === 'approved' && (
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Campos obrigatórios para "Deferido"</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data da Decisão <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm rounded-xl border ${
                    errors.decisionDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  } bg-white`}
                />
                {errors.decisionDate && (
                  <p className="text-xs text-rose-600 mt-1">{errors.decisionDate}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data do Aceite / Adesão <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={acceptanceDate}
                  onChange={(e) => setAcceptanceDate(e.target.value)}
                  className={`w-full px-3 py-1.5 text-sm rounded-xl border ${
                    errors.acceptanceDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                  } bg-white`}
                />
                {errors.acceptanceDate && (
                  <p className="text-xs text-rose-600 mt-1">{errors.acceptanceDate}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Início da Parceria (Opcional)
                </label>
                <input
                  type="date"
                  value={partnershipStartDate}
                  onChange={(e) => setPartnershipStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {targetStage === 'rejected' && (
          <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Campos obrigatórios para "Indeferido"</span>
            </h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Data da Decisão <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={decisionDate}
                onChange={(e) => setDecisionDate(e.target.value)}
                className={`w-full px-3 py-1.5 text-sm rounded-xl border ${
                  errors.decisionDate ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                } bg-white`}
              />
              {errors.decisionDate && (
                <p className="text-xs text-rose-600 mt-1">{errors.decisionDate}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo do Indeferimento <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva fundamentadamente o motivo do indeferimento..."
                className={`w-full px-3 py-1.5 text-sm rounded-xl border ${
                  errors.rejectionReason ? 'border-rose-400 bg-rose-50' : 'border-slate-300'
                } bg-white`}
              />
              {errors.rejectionReason && (
                <p className="text-xs text-rose-600 mt-1">{errors.rejectionReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Status history note */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Observações para o Histórico Auditável
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Contato telefônico realizado; parceiro concordou com os termos e encaminhou processo..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Esta nota será registrada de forma permanente na linha do tempo do parceiro.
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-5 py-2 text-sm font-bold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>Confirmar Alteração</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
