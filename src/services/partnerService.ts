import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  limit,
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Partner, PartnerStage, PartnerStatusHistory, PartnerFilters } from '../types';
import { logAuditEvent } from './auditService';
import { toDate } from '../lib/dateUtils';
import { sanitizeForFirestore } from '../lib/firestoreUtils';

const PARTNERS_COLLECTION = 'partners';
const HISTORY_COLLECTION = 'partnerStatusHistory';

export async function checkDocumentDuplicate(docNumber?: string, currentPartnerId?: string): Promise<boolean> {
  if (!docNumber || !docNumber.trim()) return false;
  const cleanDoc = docNumber.replace(/\D/g, '');
  if (!cleanDoc) return false;

  try {
    const q = query(
      collection(db, PARTNERS_COLLECTION),
      where('isArchived', '==', false),
      limit(50)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (currentPartnerId && d.id === currentPartnerId) continue;
      const data = d.data();
      const existingDoc = (data.document || '').replace(/\D/g, '');
      if (existingDoc && existingDoc === cleanDoc) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Duplicate doc check notice:', err);
  }
  return false;
}

export async function checkProcessNumberDuplicate(processNum?: string, currentPartnerId?: string): Promise<boolean> {
  if (!processNum || !processNum.trim()) return false;
  const cleanNum = processNum.trim().toLowerCase();

  try {
    const q = query(
      collection(db, PARTNERS_COLLECTION),
      where('isArchived', '==', false),
      limit(50)
    );
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      if (currentPartnerId && d.id === currentPartnerId) continue;
      const data = d.data();
      const existingProcess = (data.processNumber || '').trim().toLowerCase();
      if (existingProcess && existingProcess === cleanNum) {
        return true;
      }
    }
  } catch (err) {
    console.warn('Duplicate process check notice:', err);
  }
  return false;
}

export async function getPartners(filters?: PartnerFilters): Promise<Partner[]> {
  try {
    const snap = await getDocs(collection(db, PARTNERS_COLLECTION));
    let partners: Partner[] = snap.docs.map(d => ({
      ...d.data(),
      id: d.id,
    } as Partner));

    // Client-side robust filtering for instant and multi-criteria reactivity
    if (filters) {
      if (typeof filters.isArchived === 'boolean') {
        partners = partners.filter(p => !!p.isArchived === filters.isArchived);
      } else {
        partners = partners.filter(p => !p.isArchived);
      }

      if (filters.stage && filters.stage !== 'all') {
        partners = partners.filter(p => p.currentStage === filters.stage);
      }

      if (filters.category && filters.category !== 'all') {
        partners = partners.filter(p => p.category === filters.category);
      }

      if (filters.origin && filters.origin !== 'all') {
        partners = partners.filter(p => p.origin === filters.origin);
      }

      if (filters.interestLevel && filters.interestLevel !== 'all') {
        partners = partners.filter(p => p.interestLevel === filters.interestLevel);
      }

      if (filters.city && filters.city !== 'all') {
        partners = partners.filter(p => (p.city || '').toLowerCase() === filters.city!.toLowerCase());
      }

      if (filters.responsibleUid && filters.responsibleUid !== 'all') {
        partners = partners.filter(p => p.assignedToUid === filters.responsibleUid);
      }

      // Date Range filtering
      if (filters.startDate || filters.endDate) {
        const dateKey = filters.dateType || 'createdAt';
        const start = filters.startDate ? new Date(filters.startDate + 'T00:00:00') : null;
        const end = filters.endDate ? new Date(filters.endDate + 'T23:59:59') : null;

        partners = partners.filter(p => {
          const rawDate = (p as any)[dateKey];
          const d = toDate(rawDate);
          if (!d) return false;
          if (start && d < start) return false;
          if (end && d > end) return false;
          return true;
        });
      }

      // Free text search
      if (filters.search && filters.search.trim()) {
        const term = filters.search.toLowerCase().trim();
        partners = partners.filter(p => {
          return (
            (p.fantasyName || '').toLowerCase().includes(term) ||
            (p.corporateName || '').toLowerCase().includes(term) ||
            (p.document || '').includes(term) ||
            (p.processNumber || '').toLowerCase().includes(term) ||
            (p.contactName || '').toLowerCase().includes(term) ||
            (p.city || '').toLowerCase().includes(term) ||
            (p.category || '').toLowerCase().includes(term)
          );
        });
      }
    }

    // Default sort by updatedAt desc
    return partners.sort((a, b) => {
      const da = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
      const dbTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
      return dbTime - da;
    });
  } catch (err) {
    console.error('Error fetching partners:', err);
    return [];
  }
}

export const getAllPartners = getPartners;

export function onPartnersSnapshot(
  callback: (partners: Partner[]) => void,
  onError?: (err: any) => void
) {
  const collRef = collection(db, PARTNERS_COLLECTION);
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Partner[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Partner));

      // Sort by updatedAt desc
      list.sort((a, b) => {
        const da = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
        const dbTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
        return dbTime - da;
      });

      callback(list);
    },
    (err) => {
      console.warn('onPartnersSnapshot error:', err);
      if (onError) onError(err);
    }
  );
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  try {
    const docRef = doc(db, PARTNERS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as Partner;
  } catch (err) {
    console.error('Error fetching partner by id:', err);
    return null;
  }
}

export async function createPartner(
  partnerData: Omit<Partner, 'id' | 'createdAt' | 'updatedAt' | 'createdByUid' | 'createdByName' | 'updatedByUid' | 'updatedByName'>,
  user: { uid: string; displayName: string }
): Promise<string> {
  // Validate duplicate document
  if (partnerData.document) {
    const isDup = await checkDocumentDuplicate(partnerData.document);
    if (isDup) {
      throw new Error(`O CNPJ/CPF ${partnerData.document} já está cadastrado em outro parceiro ativo.`);
    }
  }

  // Validate duplicate process
  if (partnerData.processNumber) {
    const isDupProcess = await checkProcessNumberDuplicate(partnerData.processNumber);
    if (isDupProcess) {
      throw new Error(`O número de processo ${partnerData.processNumber} já está cadastrado em outro parceiro ativo.`);
    }
  }

  const newDoc = sanitizeForFirestore({
    ...partnerData,
    isArchived: false,
    createdAt: serverTimestamp(),
    createdByUid: user.uid,
    createdByName: user.displayName,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });

  const docRef = await addDoc(collection(db, PARTNERS_COLLECTION), newDoc);

  // Register initial status history entry (deferred non-blocking)
  addDoc(
    collection(db, HISTORY_COLLECTION),
    sanitizeForFirestore({
      partnerId: docRef.id,
      partnerName: partnerData.fantasyName || '',
      previousStage: partnerData.currentStage,
      newStage: partnerData.currentStage,
      changedAt: serverTimestamp(),
      changedByUid: user.uid,
      changedByName: user.displayName,
      notes: 'Cadastro inicial do parceiro.',
    })
  ).catch((err) => console.warn('Deferred status history creation:', err));

  // Audit log (deferred non-blocking)
  logAuditEvent({
    action: 'partner_create',
    entityId: docRef.id,
    entityName: partnerData.fantasyName,
    userUid: user.uid,
    userName: user.displayName,
    details: `Parceiro cadastrado com etapa inicial "${partnerData.currentStage}".`,
  }).catch((err) => console.warn('Deferred audit log:', err));

  return docRef.id;
}

export async function updatePartner(
  id: string,
  partnerData: Partial<Partner>,
  user: { uid: string; displayName: string }
): Promise<void> {
  if (partnerData.document) {
    const isDup = await checkDocumentDuplicate(partnerData.document, id);
    if (isDup) {
      throw new Error(`O CNPJ/CPF ${partnerData.document} já está em uso por outro parceiro ativo.`);
    }
  }

  if (partnerData.processNumber) {
    const isDupProcess = await checkProcessNumberDuplicate(partnerData.processNumber, id);
    if (isDupProcess) {
      throw new Error(`O número de processo ${partnerData.processNumber} já está em uso por outro parceiro ativo.`);
    }
  }

  const partnerRef = doc(db, PARTNERS_COLLECTION, id);
  const cleanData = sanitizeForFirestore({
    ...partnerData,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });
  await updateDoc(partnerRef, cleanData);

  // Audit log (deferred non-blocking)
  logAuditEvent({
    action: 'partner_update',
    entityId: id,
    entityName: partnerData.fantasyName || 'Parceiro',
    userUid: user.uid,
    userName: user.displayName,
    details: `Dados cadastrais atualizados.`,
  }).catch((err) => console.warn('Deferred audit log:', err));
}

export async function changePartnerStage(
  id: string,
  newStage: PartnerStage,
  notes: string,
  extraFields: Partial<Partner>,
  user: { uid: string; displayName: string }
): Promise<void> {
  const current = await getPartnerById(id);
  if (!current) throw new Error('Parceiro não encontrado.');

  const previousStage = current.currentStage;
  if (previousStage === newStage && !notes && Object.keys(extraFields).length === 0) {
    return;
  }

  const partnerRef = doc(db, PARTNERS_COLLECTION, id);
  const updatePayload: Record<string, any> = sanitizeForFirestore({
    ...extraFields,
    currentStage: newStage,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });

  // Sync result field if stage is approved / rejected
  if (newStage === 'approved') {
    updatePayload.result = 'approved';
  } else if (newStage === 'rejected') {
    updatePayload.result = 'rejected';
  }

  await updateDoc(partnerRef, updatePayload);

  // Add Status History (deferred non-blocking)
  addDoc(
    collection(db, HISTORY_COLLECTION),
    sanitizeForFirestore({
      partnerId: id,
      partnerName: current.fantasyName || '',
      previousStage,
      newStage,
      changedAt: serverTimestamp(),
      changedByUid: user.uid,
      changedByName: user.displayName,
      notes: notes || 'Mudança de etapa realizada.',
    })
  ).catch((err) => console.warn('Deferred status history update:', err));

  // Audit log (deferred non-blocking)
  logAuditEvent({
    action: 'partner_stage_change',
    entityId: id,
    entityName: current.fantasyName,
    userUid: user.uid,
    userName: user.displayName,
    details: `Etapa alterada de "${previousStage}" para "${newStage}". Observação: ${notes || 'Nenhuma'}`,
  }).catch((err) => console.warn('Deferred audit log:', err));
}

export async function archivePartner(
  id: string,
  partnerName: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const partnerRef = doc(db, PARTNERS_COLLECTION, id);
  await updateDoc(partnerRef, {
    isArchived: true,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });

  await logAuditEvent({
    action: 'partner_archive',
    entityId: id,
    entityName: partnerName,
    userUid: user.uid,
    userName: user.displayName,
    details: `Parceiro arquivado.`,
  });
}

export async function restorePartner(
  id: string,
  partnerName: string,
  user: { uid: string; displayName: string }
): Promise<void> {
  const partnerRef = doc(db, PARTNERS_COLLECTION, id);
  await updateDoc(partnerRef, {
    isArchived: false,
    updatedAt: serverTimestamp(),
    updatedByUid: user.uid,
    updatedByName: user.displayName,
  });

  await logAuditEvent({
    action: 'partner_restore',
    entityId: id,
    entityName: partnerName,
    userUid: user.uid,
    userName: user.displayName,
    details: `Parceiro restaurado do arquivo.`,
  });
}

export async function getPartnerStatusHistory(partnerId: string): Promise<PartnerStatusHistory[]> {
  try {
    const q = query(
      collection(db, HISTORY_COLLECTION),
      where('partnerId', '==', partnerId),
      orderBy('changedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as PartnerStatusHistory));
  } catch (err) {
    console.error('Error fetching partner history:', err);
    try {
      const qFallback = query(collection(db, HISTORY_COLLECTION), where('partnerId', '==', partnerId));
      const snapFallback = await getDocs(qFallback);
      const list = snapFallback.docs.map(d => ({ ...d.data(), id: d.id } as PartnerStatusHistory));
      return list.sort((a, b) => {
        const da = a.changedAt?.toMillis ? a.changedAt.toMillis() : new Date(a.changedAt).getTime();
        const dbTime = b.changedAt?.toMillis ? b.changedAt.toMillis() : new Date(b.changedAt).getTime();
        return dbTime - da;
      });
    } catch (e2) {
      return [];
    }
  }
}
