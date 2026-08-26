import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, AppRole, UserRole } from '../types';
import { logAuditEvent } from './auditService';
import { sanitizeForFirestore } from '../lib/firestoreUtils';

const USERS_COLLECTION = 'users';

export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<UserProfile> {
  const userRef = doc(db, USERS_COLLECTION, user.uid);

  const fallbackProfile: UserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || 'Usuário TJPA',
    photoURL: user.photoURL || '',
    role: 'manager',
    department: 'Programa Rede+ Vantagens TJPA',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      if (data.displayName !== user.displayName || data.photoURL !== user.photoURL) {
        updateDoc(userRef, {
          displayName: user.displayName || 'Usuário TJPA',
          photoURL: user.photoURL || '',
          updatedAt: serverTimestamp(),
        }).catch((err) => console.warn('Background profile update deferred:', err?.message));
      }
      return { ...data, uid: user.uid };
    } else {
      // Check if first user
      let isFirstUser = false;
      try {
        const usersSnap = await getDocs(collection(db, USERS_COLLECTION));
        isFirstUser = usersSnap.empty;
      } catch {
        isFirstUser = false;
      }

      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Usuário TJPA',
        photoURL: user.photoURL || '',
        role: isFirstUser ? 'admin' : 'manager', // Default to manager so logged-in users can operate immediately
        department: 'Programa Rede+ Vantagens TJPA',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(userRef, sanitizeForFirestore(newProfile));
      } catch (err: any) {
        console.warn('Deferred setDoc for new user profile:', err?.message);
      }

      return newProfile;
    }
  } catch (err: any) {
    console.warn('User profile sync operating in offline/resilient mode:', err?.message || err);
    return fallbackProfile;
  }
}

export async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, USERS_COLLECTION), orderBy('displayName', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
  } catch (err) {
    console.warn('Notice getting users list (offline fallback active):', err);
    return [];
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
  actingUser?: { uid: string; displayName: string }
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const cleanUpdates = sanitizeForFirestore({
    ...updates,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(userRef, cleanUpdates);

  if (actingUser) {
    await logAuditEvent({
      action: 'user_update_role',
      entityId: uid,
      entityName: `Usuário UID: ${uid}`,
      userUid: actingUser.uid,
      userName: actingUser.displayName,
      details: updates,
    });
  }
}

export async function updateUserRole(
  uid: string, 
  role: UserRole | AppRole, 
  isActive: boolean, 
  department?: string
): Promise<void> {
  return updateUserProfile(uid, { role: role as any, isActive, department });
}
