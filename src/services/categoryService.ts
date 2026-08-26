import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  doc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Category } from '../types';
import { logAuditEvent } from './auditService';
import { sanitizeForFirestore } from '../lib/firestoreUtils';

const CATEGORIES_COLLECTION = 'categories';

export const INITIAL_CATEGORIES = [
  { name: 'Saúde e Odontologia', description: 'Clínicas, consultórios, laboratórios e planos de saúde.' },
  { name: 'Educação e Cursos', description: 'Faculdades, escolas de idiomas, cursos preparatórios e técnicos.' },
  { name: 'Alimentação e Gastronomia', description: 'Restaurantes, cafeterias, buffets e confeitarias.' },
  { name: 'Lazer, Turismo e Hotelaria', description: 'Hotéis, pousadas, agências de viagens e parques.' },
  { name: 'Beleza, Estética e Bem-Estar', description: 'Academias, spas, salões de beleza e barbearias.' },
  { name: 'Comércio e Varejo', description: 'Lojas de vestuário, calçados, óticas, eletrônicos e livrarias.' },
  { name: 'Serviços Automotivos', description: 'Oficinas, concessionárias, autoescolas e postos.' },
  { name: 'Serviços Profissionais e Financeiros', description: 'Consultorias, advocacia, contabilidade e seguros.' },
  { name: 'Tecnologia e Informática', description: 'Lojas de informática, assistência técnica e software.' },
  { name: 'Outros', description: 'Demais segmentos de produtos ou serviços.' },
];

/**
 * Helper to deduplicate category list by case-insensitive name
 */
export function deduplicateCategories(categories: Category[]): Category[] {
  const seen = new Set<string>();
  const result: Category[] = [];

  for (const cat of categories) {
    const normalized = (cat.name || '').trim().toLowerCase();
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(cat);
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}

export async function getCategories(): Promise<Category[]> {
  try {
    const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'));
    const snap = await getDocs(q);

    if (snap.empty) {
      return INITIAL_CATEGORIES.map((c, i) => ({
        id: `default-${i}`,
        name: c.name,
        description: c.description,
        active: true,
        isActive: true,
        createdAt: new Date(),
      }));
    }

    const list = snap.docs.map(d => ({ ...d.data(), id: d.id } as Category));
    return deduplicateCategories(list);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return INITIAL_CATEGORIES.map((c, i) => ({
      id: `fallback-${i}`,
      name: c.name,
      description: c.description,
      active: true,
      isActive: true,
      createdAt: new Date(),
    }));
  }
}

export const getAllCategories = getCategories;

export function onCategoriesSnapshot(
  callback: (categories: Category[]) => void,
  onError?: (error: any) => void
) {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(
          INITIAL_CATEGORIES.map((c, i) => ({
            id: `default-${i}`,
            name: c.name,
            description: c.description,
            active: true,
            isActive: true,
            createdAt: new Date(),
          }))
        );
      } else {
        const list: Category[] = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Category)
        );
        callback(deduplicateCategories(list));
      }
    },
    (err) => {
      console.warn('onCategoriesSnapshot notice:', err);
      if (onError) onError(err);
      // Fallback
      callback(
        INITIAL_CATEGORIES.map((c, i) => ({
          id: `default-${i}`,
          name: c.name,
          description: c.description,
          active: true,
          isActive: true,
          createdAt: new Date(),
        }))
      );
    }
  );
}

export async function createCategory(
  categoryOrName: string | { name: string; description?: string; isActive?: boolean },
  actingUserOrDesc?: string | { uid: string; displayName: string },
  active = true
): Promise<string> {
  let name = '';
  let description = '';
  let isActive = active;
  let actingUser: { uid: string; displayName: string } | undefined;

  if (typeof categoryOrName === 'string') {
    name = categoryOrName;
    if (typeof actingUserOrDesc === 'string') {
      description = actingUserOrDesc;
    }
  } else {
    name = categoryOrName.name;
    description = categoryOrName.description || '';
    isActive = categoryOrName.isActive !== undefined ? categoryOrName.isActive : true;
    if (typeof actingUserOrDesc === 'object') {
      actingUser = actingUserOrDesc;
    }
  }

  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('O nome da categoria é obrigatório.');
  }

  // Create document reference with a slug-based or auto ID
  const docRef = await addDoc(
    collection(db, CATEGORIES_COLLECTION),
    sanitizeForFirestore({
      name: cleanName,
      description: description.trim(),
      active: isActive,
      isActive: isActive,
      createdAt: serverTimestamp(),
    })
  );

  if (actingUser) {
    // Non-blocking audit log
    logAuditEvent({
      action: 'category_create',
      entity: 'category',
      entityId: docRef.id,
      entityName: cleanName,
      userUid: actingUser.uid,
      userName: actingUser.displayName,
      details: `Categoria "${cleanName}" criada.`,
    }).catch((e) => console.warn('Audit log write notice:', e));
  }

  return docRef.id;
}

export async function updateCategory(
  id: string,
  categoryOrName: string | { name?: string; description?: string; isActive?: boolean },
  actingUserOrDesc?: string | { uid: string; displayName: string },
  active = true
): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  const updates: Record<string, any> = {};
  let actingUser: { uid: string; displayName: string } | undefined;

  if (typeof categoryOrName === 'string') {
    updates.name = categoryOrName.trim();
    if (typeof actingUserOrDesc === 'string') {
      updates.description = actingUserOrDesc.trim();
    }
    updates.active = active;
    updates.isActive = active;
  } else {
    if (categoryOrName.name) updates.name = categoryOrName.name.trim();
    if (categoryOrName.description !== undefined) updates.description = categoryOrName.description.trim();
    if (categoryOrName.isActive !== undefined) {
      updates.active = categoryOrName.isActive;
      updates.isActive = categoryOrName.isActive;
    }
    if (typeof actingUserOrDesc === 'object') {
      actingUser = actingUserOrDesc;
    }
  }

  await updateDoc(docRef, sanitizeForFirestore(updates));

  if (actingUser) {
    logAuditEvent({
      action: 'category_update',
      entity: 'category',
      entityId: id,
      entityName: updates.name || id,
      userUid: actingUser.uid,
      userName: actingUser.displayName,
      details: updates,
    }).catch((e) => console.warn('Audit log write notice:', e));
  }
}

export async function deleteCategory(
  id: string,
  actingUser?: { uid: string; displayName: string }
): Promise<void> {
  // If it's a simulated default ID, no need to call Firestore deleteDoc
  if (id.startsWith('default-') || id.startsWith('fallback-')) {
    return;
  }

  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await deleteDoc(docRef);

  if (actingUser) {
    logAuditEvent({
      action: 'category_delete',
      entity: 'category',
      entityId: id,
      entityName: `Categoria ID: ${id}`,
      userUid: actingUser.uid,
      userName: actingUser.displayName,
      details: 'Categoria removida do sistema.',
    }).catch((e) => console.warn('Audit log write notice:', e));
  }
}

export async function seedDefaultCategories(actingUser?: { uid: string; displayName: string }): Promise<void> {
  // Check existing categories to avoid duplicates
  const existingSnap = await getDocs(collection(db, CATEGORIES_COLLECTION));
  const existingNames = new Set(
    existingSnap.docs.map((d) => (d.data().name || '').trim().toLowerCase())
  );

  for (const cat of INITIAL_CATEGORIES) {
    if (!existingNames.has(cat.name.trim().toLowerCase())) {
      await addDoc(collection(db, CATEGORIES_COLLECTION), {
        name: cat.name,
        description: cat.description,
        active: true,
        isActive: true,
        createdAt: serverTimestamp(),
      });
      existingNames.add(cat.name.trim().toLowerCase());
    }
  }

  if (actingUser) {
    logAuditEvent({
      action: 'category_seed',
      entity: 'category',
      entityId: 'all',
      entityName: 'Categorias Padrão TJPA',
      userUid: actingUser.uid,
      userName: actingUser.displayName,
      details: 'Carga das categorias institucionais do TJPA.',
    }).catch((e) => console.warn('Audit log write notice:', e));
  }
}

/**
 * Utility to clean up duplicate categories in the database
 */
export async function cleanupDuplicateCategories(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const seen = new Map<string, string>(); // name -> first docId
    const toDelete: string[] = [];

    for (const d of snap.docs) {
      const name = (d.data().name || '').trim().toLowerCase();
      if (!name) continue;

      if (seen.has(name)) {
        toDelete.push(d.id);
      } else {
        seen.set(name, d.id);
      }
    }

    for (const id of toDelete) {
      await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
    }

    return toDelete.length;
  } catch (err) {
    console.error('Error cleaning up duplicate categories:', err);
    return 0;
  }
}
