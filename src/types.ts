import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'manager' | 'viewer';
export type AppRole = UserRole;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  department?: string;
  isActive: boolean;
  createdAt: Timestamp | Date | any;
  updatedAt: Timestamp | Date | any;
}

export type PersonType = 'PJ' | 'PF';

export type PartnerStage =
  | 'mapped'           // 1. Mapeado
  | 'prospecting'      // 2. Em prospecção
  | 'waiting_docs'     // 3. Aguardando documentação
  | 'in_analysis'      // 4. Em análise
  | 'approved'         // 5. Deferido
  | 'rejected'         // 6. Indeferido
  | 'gave_up'          // 7. Desistiu
  | 'inactive';        // 8. Inativo

export type PartnerOrigin =
  | 'active'
  | 'active_search'
  | 'spontaneous'
  | 'referral'
  | 'indication'
  | 'magistrate_request'
  | 'server_suggestion'
  | 'event'
  | 'other';

export type InterestLevel = 'low' | 'medium' | 'high';

export type ProcessResult = 'pending' | 'approved' | 'rejected';

export type BenefitScope = 'municipal' | 'regional' | 'statewide' | 'national' | 'online';

export interface Partner {
  id?: string;

  // 1. Identificação
  fantasyName: string;
  corporateName?: string;
  document?: string; // CNPJ or CPF
  personType: PersonType;
  category: string;
  description?: string;
  website?: string;
  socialMedia?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  contactName?: string;
  contactRole?: string;

  // 2. Prospecção
  origin: PartnerOrigin;
  assignedToUid?: string;
  assignedToName?: string;
  identificationDate?: Timestamp | Date | any;
  firstContactDate?: Timestamp | Date | any;
  lastContactDate?: Timestamp | Date | any;
  nextContactDate?: Timestamp | Date | any;
  firstContactChannel?: string;
  interestLevel?: InterestLevel;
  prospectingNotes?: string;

  // 3. Processo de adesão
  processNumber?: string;
  officialPlatformUrl?: string;
  submissionDate?: Timestamp | Date | any;
  analysisStartDate?: Timestamp | Date | any;
  decisionDate?: Timestamp | Date | any;
  result?: ProcessResult;
  rejectionReason?: string;
  acceptanceDate?: Timestamp | Date | any;
  partnershipStartDate?: Timestamp | Date | any;
  partnershipEndDate?: Timestamp | Date | any;
  processNotes?: string;

  // 4. Benefício oferecido
  benefitDescription?: string;
  discountPercentage?: number;
  targetAudience?: string;
  conditions?: string;
  validityDate?: Timestamp | Date | any;
  scope?: BenefitScope;

  // 5. Controle & Auditoria
  currentStage: PartnerStage;
  isArchived: boolean;
  createdAt?: Timestamp | Date | any;
  createdByUid?: string;
  createdByName?: string;
  updatedAt?: Timestamp | Date | any;
  updatedByUid?: string;
  updatedByName?: string;
}

export interface PartnerStatusHistory {
  id?: string;
  partnerId: string;
  partnerName: string;
  previousStage: PartnerStage;
  newStage: PartnerStage;
  changedAt: Timestamp | Date | any;
  changedByUid: string;
  changedByName: string;
  notes?: string;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'visit' | 'followup' | 'other';

export interface Activity {
  id?: string;
  partnerId: string;
  partnerName: string;
  type: ActivityType;
  date: Timestamp | Date | any;
  responsibleUid: string;
  responsibleName: string;
  description: string;
  result?: string;
  nextAction?: string;
  nextActionDate?: Timestamp | Date | any;
  createdAt?: Timestamp | Date | any;
}

export interface Category {
  id?: string;
  name: string;
  description?: string;
  active?: boolean;
  isActive?: boolean;
  createdAt?: Timestamp | Date | any;
}

export type AuditAction = 
  | 'create' 
  | 'update' 
  | 'archive' 
  | 'restore' 
  | 'stage_change' 
  | 'delete'
  | 'category_create'
  | 'category_update'
  | 'category_delete'
  | 'category_seed'
  | 'partner_create'
  | 'partner_update'
  | 'partner_stage_change'
  | 'partner_archive'
  | 'partner_restore'
  | 'user_update_role'
  | 'system_seed_data'
  | string;

export type AuditEntity = 'partner' | 'user' | 'category' | 'activity' | 'setting' | string;

export interface AuditLog {
  id?: string;
  action: AuditAction;
  entity?: AuditEntity;
  entityId: string;
  entityName?: string;
  performedByUid?: string;
  performedByName?: string;
  userUid?: string;
  userName?: string;
  userEmail?: string;
  details?: any;
  timestamp: Timestamp | Date | any;
}

export interface PartnerFilters {
  search?: string;
  stage?: PartnerStage | 'all';
  category?: string | 'all';
  origin?: PartnerOrigin | 'all';
  interestLevel?: InterestLevel | 'all';
  city?: string | 'all';
  responsibleUid?: string | 'all';
  isArchived?: boolean;
  dateType?: 'identificationDate' | 'firstContactDate' | 'submissionDate' | 'decisionDate' | 'acceptanceDate' | 'createdAt';
  startDate?: string;
  endDate?: string;
}
