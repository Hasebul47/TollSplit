import { db as firestoreDb } from './firebase';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

async function clearCollection(collectionName) {
  try {
    const qSnapshot = await getDocs(collection(firestoreDb, collectionName));
    const batch = writeBatch(firestoreDb);
    let count = 0;
    qSnapshot.forEach((document) => {
      batch.delete(doc(firestoreDb, collectionName, document.id));
      count++;
    });
    if (count > 0) {
      await batch.commit();
    }
  } catch (err) {
    console.error(`Error clearing collection ${collectionName}:`, err);
  }
}

export async function resetDatabase() {
  try {
    // 1. Clear Firestore collections
    await clearCollection('transactions');
    await clearCollection('trips');
    await clearCollection('notifications');
    await clearCollection('members');
    await clearCollection('groups');
    
    // 2. Re-insert default group in Firestore
    const defaultGroupRef = doc(firestoreDb, 'groups', '1');
    await setDoc(defaultGroupRef, {
      name: 'Default Group',
      description: 'My expressway group',
      default_toll: 80,
      default_deposit: 300,
      created_at: new Date()
    });

    return true;
  } catch (error) {
    console.error('Reset database error:', error);
    throw error;
  }
}
