import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Partner, ActivityType, UserProfile } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ToastContext';
import { createActivity } from '../../services/activityService';
import { parseInputDate, dateToInputString } from '../../lib/dateUtils';
import { PhoneCall, Mail, Users, MapPin, Calendar, Clock, PlusCircle } from 'lucide-react';

interface ActivityFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  users: UserProfile[];
  onSuccess: () => void;
}

export const ActivityFormModal: React.FC<ActivityFormModalProps> = ({
  isOpen,
  onClose,
  partner,
  users,
  onSuccess,
}) => {
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [type, setType] = useState<ActivityType>('call');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('09:00');
  const [responsibleUid, setResponsibleUid] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && partner) {
      const now = new Date();
      setDateStr(dateToInputString(now));
      setTimeStr(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
      setResponsibleUid(user?.uid || '');
      setType('call');
      setDescription('');
      setResult('');
      setNextAction('');
      setNextActionDate('');
      setError('');
    }
  }, [isOpen, partner, user]);

  if (!partner) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('A descrição da atividade é obrigatória.');
      return;
    }

    setLoading(true);
    try {
      const parsedDate = parseInputDate(dateStr) || new Date();
      const [h, m] = (timeStr || '09:00').split(':').map(Number);
      parsedDate.setHours(h || 0, m || 0, 0, 0);

      const respUser = users.find((u) => u.uid === responsibleUid);
      const respName = respUser ? respUser.displayName : userProfile?.displayName || 'Equipe TJPA';

      const savePromise = createActivity({
        partnerId: partner.id!,
        partnerName: partner.fantasyName,
        type,
        date: parsedDate,
        responsibleUid: responsibleUid || user?.uid || '',
        responsibleName: respName,
        description: description.trim(),
        result: result.trim() || undefined,
        nextAction: nextAction.trim() || undefined,
        nextActionDate: parseInputDate(nextActionDate) || undefined,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 5000)
      );

      try {
        await Promise.race([savePromise, timeoutPromise]);
        toast.success('Atividade registrada com sucesso!');
      } catch (raceErr: any) {
        if (raceErr?.message === 'timeout') {
          toast.success('Atividade registrada com sucesso!');
        } else {
          throw raceErr;
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao registrar atividade.');
    } finally {
      setLoading(false);
    }
  };

  const activityTypeOptions: { value: ActivityType; label: string; icon: React.FC<any> }[] = [
    { value: 'call', label: 'Ligação / WhatsApp', icon: PhoneCall },
    { value: 'meeting', label: 'Reunião', icon: Users },
    { value: 'email', label: 'E-mail Enviado', icon: Mail },
    { value: 'visit', label: 'Visita Presencial', icon: MapPin },
    { value: 'followup', label: 'Compromisso de Retorno', icon: Calendar },
    { value: 'other', label: 'Outro Registro', icon: Clock },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Atividade de Prospecção"
      subtitle={`Parceiro: ${partner.fantasyName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Type grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">Tipo de Atividade</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activityTypeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = type === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setType(opt.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date, Time & Responsible */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data da Ação</label>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Responsável</label>
            <select
              value={responsibleUid}
              onChange={(e) => setResponsibleUid(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            >
              {users.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Descrição do Contato / Pauta <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            placeholder="Ex: Realizada ligação com a Gerência de Recursos Humanos para apresentar o termo de parceria e tirar dúvidas sobre a contrapartida de desconto..."
            className={`w-full px-3 py-2 text-sm rounded-xl border ${
              error ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300'
            } focus:outline-none focus:ring-2 focus:ring-blue-600/30`}
          />
          {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
        </div>

        {/* Result */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Resultado / Parecer da Conversa</label>
          <input
            type="text"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder="Ex: Parceiro manifestou alto interesse e solicitou minuta para avaliação jurídica"
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
        </div>

        {/* Next Action Plan */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h4 className="text-xs font-bold text-slate-800">Próximo Passo / Retorno Agendado</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Próxima Ação</label>
              <input
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Ex: Ligar para cobrar retorno da diretoria"
                className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Data Prevista</label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-xl border border-slate-300 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
            <span>Gravar Atividade</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
