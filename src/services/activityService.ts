import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Activity, ActivityType } from '../types';
import { logAuditEvent } from './auditService';
import { sanitizeForFirestore } from '../lib/firestoreUtils';

const ACTIVITIES_COLLECTION = 'activities';

export async function getActivitiesByPartner(partnerId: string): Promise<Activity[]> {
  try {
    const q = query(
      collection(db, ACTIVITIES_COLLECTION),
      where('partnerId', '==', partnerId),
      orderBy('date', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Activity));
  } catch (err) {
    console.error('Error fetching partner activities:', err);
    // Fallback without compound index if needed
    try {
      const qFallback = query(collection(db, ACTIVITIES_COLLECTION), where('partnerId', '==', partnerId));
      const snapFallback = await getDocs(qFallback);
      const list = snapFallback.docs.map(d => ({ ...d.data(), id: d.id } as Activity));
      return list.sort((a, b) => {
        const da = a.date?.toMillis ? a.date.toMillis() : new Date(a.date).getTime();
        const dbTime = b.date?.toMillis ? b.date.toMillis() : new Date(b.date).getTime();
        return dbTime - da;
      });
    } catch (e2) {
      return [];
    }
  }
}

export async function createActivity(activity: Omit<Activity, 'id' | 'createdAt'>): Promise<string> {
  const cleanActivity = sanitizeForFirestore({
    ...activity,
    createdAt: serverTimestamp(),
  });
  const docRef = await addDoc(collection(db, ACTIVITIES_COLLECTION), cleanActivity);

  // Also update partner's lastContactDate and nextContactDate if set
  try {
    const partnerRef = doc(db, 'partners', activity.partnerId);
    const updatePayload: Record<string, any> = sanitizeForFirestore({
      lastContactDate: activity.date,
      updatedAt: serverTimestamp(),
      updatedByUid: activity.responsibleUid,
      updatedByName: activity.responsibleName,
      nextContactDate: activity.nextActionDate || null,
    });
    await updateDoc(partnerRef, updatePayload);
  } catch (e) {
    console.warn('Could not auto-update partner contact dates:', e);
  }

  await logAuditEvent({
    action: 'create',
    entity: 'activity',
    entityId: docRef.id,
    entityName: `${activity.partnerName} (${activity.type})`,
    performedByUid: activity.responsibleUid,
    performedByName: activity.responsibleName,
    details: `Atividade "${activity.type}" registrada: ${activity.description}`,
  });

  return docRef.id;
}

export async function deleteActivity(activityId: string, partnerId: string, partnerName: string, user: { uid: string; name: string }): Promise<void> {
  await deleteDoc(doc(db, ACTIVITIES_COLLECTION, activityId));
  await logAuditEvent({
    action: 'delete',
    entity: 'activity',
    entityId: activityId,
    entityName: partnerName,
    performedByUid: user.uid,
    performedByName: user.name,
    details: `Atividade removida`,
  });
}
