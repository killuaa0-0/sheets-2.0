import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { Document, SheetData, CellData, PresenceData, User } from './types';

// Mock data for demo mode
let mockDocuments: Document[] = [];
let mockSheetData: { [docId: string]: SheetData } = {};
let mockPresence: { [docId: string]: PresenceData[] } = {};
let documentListeners: ((docs: Document[]) => void)[] = [];
let sheetListeners: { [docId: string]: ((data: SheetData) => void)[] } = {};
let presenceListeners: { [docId: string]: ((users: PresenceData[]) => void)[] } = {};

// Documents
export const subscribeToDocuments = (
  callback: (docs: Document[]) => void
): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    documentListeners.push(callback);
    callback(mockDocuments);
    return () => {
      documentListeners = documentListeners.filter(l => l !== callback);
    };
  }

  const q = query(collection(db, 'documents'), orderBy('lastModified', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        authorId: data.authorId,
        authorName: data.authorName,
        createdAt: data.createdAt?.toDate() || new Date(),
        lastModified: data.lastModified?.toDate() || new Date(),
      } as Document;
    });
    callback(docs);
  });
};

export const createDocument = async (
  title: string,
  user: User
): Promise<string> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    const id = `demo_${Date.now()}`;
    const newDoc: Document = {
      id,
      title,
      authorId: user.id,
      authorName: user.displayName,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    mockDocuments = [newDoc, ...mockDocuments];
    mockSheetData[id] = {};
    documentListeners.forEach(l => l(mockDocuments));
    return id;
  }

  const docRef = doc(collection(db, 'documents'));
  await setDoc(docRef, {
    title,
    authorId: user.id,
    authorName: user.displayName,
    createdAt: serverTimestamp(),
    lastModified: serverTimestamp(),
  });
  return docRef.id;
};

export const getDocument = async (docId: string): Promise<Document | null> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    return mockDocuments.find(d => d.id === docId) || null;
  }

  const docRef = doc(db, 'documents', docId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    title: data.title,
    authorId: data.authorId,
    authorName: data.authorName,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastModified: data.lastModified?.toDate() || new Date(),
  };
};

// Sheet Data
export const subscribeToSheetData = (
  docId: string,
  callback: (data: SheetData) => void
): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    if (!sheetListeners[docId]) sheetListeners[docId] = [];
    sheetListeners[docId].push(callback);
    callback(mockSheetData[docId] || {});
    return () => {
      sheetListeners[docId] = sheetListeners[docId].filter(l => l !== callback);
    };
  }

  const cellsRef = collection(db, 'documents', docId, 'cells');

  return onSnapshot(cellsRef, (snapshot) => {
    const data: SheetData = {};
    snapshot.docs.forEach((doc) => {
      data[doc.id] = doc.data() as CellData;
    });
    callback(data);
  });
};

export const updateCell = async (
  docId: string,
  cellId: string,
  cellData: CellData
): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    if (!mockSheetData[docId]) mockSheetData[docId] = {};
    mockSheetData[docId][cellId] = cellData;
    sheetListeners[docId]?.forEach(l => l(mockSheetData[docId]));
    return;
  }

  const cellRef = doc(db, 'documents', docId, 'cells', cellId);
  await setDoc(cellRef, cellData);

  // Update document's lastModified
  const docRef = doc(db, 'documents', docId);
  await updateDoc(docRef, { lastModified: serverTimestamp() });
};

// Presence
export const subscribeToPresence = (
  docId: string,
  callback: (users: PresenceData[]) => void
): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    if (!presenceListeners[docId]) presenceListeners[docId] = [];
    presenceListeners[docId].push(callback);
    callback(mockPresence[docId] || []);
    return () => {
      presenceListeners[docId] = presenceListeners[docId].filter(l => l !== callback);
    };
  }

  const presenceRef = collection(db, 'presence', docId, 'users');

  return onSnapshot(presenceRef, (snapshot) => {
    const users = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          odId: doc.id,
          displayName: data.displayName,
          color: data.color,
          lastSeen: data.lastSeen?.toDate() || new Date(),
        } as PresenceData;
      })
      .filter((user) => {
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        return user.lastSeen > thirtySecondsAgo;
      });
    callback(users);
  });
};

export const joinDocument = async (
  docId: string,
  user: User
): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    if (!mockPresence[docId]) mockPresence[docId] = [];
    const existing = mockPresence[docId].find(p => p.odId === user.id);
    if (!existing) {
      mockPresence[docId].push({
        odId: user.id,
        displayName: user.displayName,
        color: user.color,
        lastSeen: new Date(),
      });
    }
    presenceListeners[docId]?.forEach(l => l(mockPresence[docId]));
    return;
  }

  const presenceRef = doc(db, 'presence', docId, 'users', user.id);
  await setDoc(presenceRef, {
    displayName: user.displayName,
    color: user.color,
    lastSeen: serverTimestamp(),
  });
};

export const updatePresence = async (
  docId: string,
  userId: string
): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    const user = mockPresence[docId]?.find(p => p.odId === userId);
    if (user) user.lastSeen = new Date();
    return;
  }

  const presenceRef = doc(db, 'presence', docId, 'users', userId);
  await updateDoc(presenceRef, {
    lastSeen: serverTimestamp(),
  });
};

export const leaveDocument = async (
  docId: string,
  userId: string
): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // Demo mode
    mockPresence[docId] = mockPresence[docId]?.filter(p => p.odId !== userId) || [];
    presenceListeners[docId]?.forEach(l => l(mockPresence[docId]));
    return;
  }

  const presenceRef = doc(db, 'presence', docId, 'users', userId);
  await deleteDoc(presenceRef);
};
