import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuditLog, AuditAction, AuditEntity } from '../types';
import { sanitizeForFirestore } from '../lib/firestoreUtils';

const AUDIT_COLLECTION = 'auditLogs';

export async function logAuditEvent(params: {
  action: AuditAction;
  entity?: AuditEntity;
  entityId: string;
  entityName?: string;
  performedByUid?: string;
  performedByName?: string;
  userUid?: string;
  userName?: string;
  details?: any;
}): Promise<void> {
  try {
    const formattedDetails = typeof params.details === 'object' 
      ? JSON.stringify(params.details) 
      : (params.details || '');

    await addDoc(
      collection(db, AUDIT_COLLECTION),
      sanitizeForFirestore({
        action: params.action,
        entity: params.entity || 'partner',
        entityId: params.entityId,
        entityName: params.entityName || '',
        performedByUid: params.performedByUid || params.userUid || '',
        performedByName: params.performedByName || params.userName || '',
        userUid: params.userUid || params.performedByUid || '',
        userName: params.userName || params.performedByName || '',
        details: formattedDetails,
        timestamp: serverTimestamp(),
      })
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function getRecentAuditLogs(maxCount = 100): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy('timestamp', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    return [];
  }
}
