import { Partner, PartnerStage } from '../types';
import { formatDate } from './dateUtils';

export const STAGE_LABELS: Record<PartnerStage, string> = {
  mapped: 'Mapeado',
  prospecting: 'Em prospecção',
  waiting_docs: 'Aguardando documentação',
  in_analysis: 'Em análise',
  approved: 'Deferido',
  rejected: 'Indeferido',
  gave_up: 'Desistiu',
  inactive: 'Inativo',
};

export const ORIGIN_LABELS: Record<string, string> = {
  active: 'Prospecção ativa',
  spontaneous: 'Solicitação espontânea',
  referral: 'Indicação',
  event: 'Evento',
  other: 'Outro',
};

export const INTEREST_LABELS: Record<string, string> = {
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
};

export const SCOPE_LABELS: Record<string, string> = {
  municipal: 'Municipal',
  regional: 'Regional',
  statewide: 'Estadual',
  national: 'Nacional',
  online: 'Online',
};

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportPartnersToCSV(partners: Partner[], filename = 'relatorio-parceiros.csv') {
  const headers = [
    'Nome Fantasia',
    'Razão Social',
    'CNPJ / CPF',
    'Tipo Pessoa',
    'Categoria',
    'Etapa Atual',
    'Status Registro',
    'Município',
    'Estado',
    'Responsável Interno',
    'Origem',
    'Nível de Interesse',
    'Data Identificação',
    'Data 1ª Prospecção',
    'Data Último Contato',
    'Próximo Contato',
    'Nº Processo / Protocolo',
    'Data Submissão',
    'Data Início Análise',
    'Data Decisão',
    'Resultado Adesão',
    'Motivo Indeferimento',
    'Data Aceite / Adesão',
    'Data Início Parceria',
    'Benefício Oferecido',
    'Desconto (%)',
    'Público Contemplado',
    'Abrangência',
    'Pessoa de Contato',
    'Cargo do Contato',
    'Telefone',
    'E-mail',
    'Site',
    'Criado em',
    'Criado por',
  ];

  const rows = partners.map(p => [
    escapeCSV(p.fantasyName),
    escapeCSV(p.corporateName || ''),
    escapeCSV(p.document || ''),
    escapeCSV(p.personType === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'),
    escapeCSV(p.category || ''),
    escapeCSV(STAGE_LABELS[p.currentStage] || p.currentStage),
    escapeCSV(p.isArchived ? 'Arquivado' : 'Ativo'),
    escapeCSV(p.city || ''),
    escapeCSV(p.state || 'PA'),
    escapeCSV(p.assignedToName || 'Não atribuído'),
    escapeCSV(ORIGIN_LABELS[p.origin] || p.origin),
    escapeCSV(p.interestLevel ? INTEREST_LABELS[p.interestLevel] || p.interestLevel : ''),
    escapeCSV(formatDate(p.identificationDate)),
    escapeCSV(formatDate(p.firstContactDate)),
    escapeCSV(formatDate(p.lastContactDate)),
    escapeCSV(formatDate(p.nextContactDate)),
    escapeCSV(p.processNumber || ''),
    escapeCSV(formatDate(p.submissionDate)),
    escapeCSV(formatDate(p.analysisStartDate)),
    escapeCSV(formatDate(p.decisionDate)),
    escapeCSV(p.result === 'approved' ? 'Deferido' : p.result === 'rejected' ? 'Indeferido' : 'Pendente / Não decidido'),
    escapeCSV(p.rejectionReason || ''),
    escapeCSV(formatDate(p.acceptanceDate)),
    escapeCSV(formatDate(p.partnershipStartDate)),
    escapeCSV(p.benefitDescription || ''),
    escapeCSV(p.discountPercentage !== undefined && p.discountPercentage !== null ? `${p.discountPercentage}%` : ''),
    escapeCSV(p.targetAudience || ''),
    escapeCSV(p.scope ? SCOPE_LABELS[p.scope] || p.scope : ''),
    escapeCSV(p.contactName || ''),
    escapeCSV(p.contactRole || ''),
    escapeCSV(p.phone || ''),
    escapeCSV(p.email || ''),
    escapeCSV(p.website || ''),
    escapeCSV(formatDate(p.createdAt)),
    escapeCSV(p.createdByName || ''),
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
