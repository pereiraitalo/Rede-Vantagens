import React from 'react';
import { PartnerStage } from '../../types';
import { 
  Compass, 
  PhoneCall, 
  FileClock, 
  SearchCheck, 
  CheckCircle2, 
  XCircle, 
  UserMinus, 
  Archive 
} from 'lucide-react';

interface StageBadgeProps {
  stage: PartnerStage;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const STAGE_CONFIG: Record<
  PartnerStage,
  { 
    label: string; 
    bg: string; 
    text: string; 
    border: string; 
    dot: string; 
    icon: React.FC<any>;
    description: string;
    actionHint: string;
  }
> = {
  mapped: {
    label: 'Mapeado',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    icon: Compass,
    description: 'Parceiro em potencial identificado e cadastrado para futuro contato e alinhamento de interesse.',
    actionHint: 'Inicie a abordagem e agende o primeiro contato para sondagem de interesse.',
  },
  prospecting: {
    label: 'Em prospecção',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    icon: PhoneCall,
    description: 'Contato inicial em andamento, apresentação do programa Rede+ Vantagens TJPA e sondagem de contrapartidas.',
    actionHint: 'Apresente as diretrizes da parceria e envie a relação de documentos necessários.',
  },
  waiting_docs: {
    label: 'Aguardando docs',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
    icon: FileClock,
    description: 'Proposta pré-alinhada; aguardando envio da documentação de habilitação jurídica, fiscal e formulário de adesão.',
    actionHint: 'Acompanhe o prazo de recebimento dos documentos e verifique pendências.',
  },
  in_analysis: {
    label: 'Em análise',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    icon: SearchCheck,
    description: 'Processo instaurado e documentação em análise técnica/jurídica pela comissão e instâncias do TJPA.',
    actionHint: 'Acompanhe a tramitação interna e registro do parecer administrativo.',
  },
  approved: {
    label: 'Deferido',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
    description: 'Convênio aprovado oficialmente, termo firmado e benefício ativo para magistrados, servidores e dependentes.',
    actionHint: 'Parceria ativa. Divulgue nos canais oficiais e monitore a vigência do termo.',
  },
  rejected: {
    label: 'Indeferido',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: XCircle,
    description: 'Solicitação indeferida ou inviabilidade técnica/jurídica verificada (com registro obrigatório do motivo).',
    actionHint: 'Notifique formalmente a empresa com a justificativa do indeferimento.',
  },
  gave_up: {
    label: 'Desistiu',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    icon: UserMinus,
    description: 'Parceiro optou por não prosseguir com a proposta ou cancelou a adesão durante a negociação.',
    actionHint: 'Registre o motivo da desistência no histórico para consultas futuras.',
  },
  inactive: {
    label: 'Inativo',
    bg: 'bg-zinc-100',
    text: 'text-zinc-600',
    border: 'border-zinc-300',
    dot: 'bg-zinc-400',
    icon: Archive,
    description: 'Parceria encerrada, suspensa temporariamente ou com prazo de vigência do convênio expirado.',
    actionHint: 'Avalie possibilidade de renovação ou arquivamento definitivo.',
  },
};

export const PartnerStageBadge: React.FC<StageBadgeProps> = ({
  stage,
  size = 'md',
  showIcon = true,
}) => {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.mapped;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border whitespace-nowrap ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      {showIcon ? (
        <Icon className={`${iconSizes} flex-shrink-0`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};
