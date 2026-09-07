import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, query, orderBy, where, setDoc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { getToday } from '../utils/dateUtils';

export const getGroups = async () => {
  try {
    const q = query(collection(db, 'groups'), orderBy('name'));
    const querySnapshot = await getDocs(q);
    const groups = [];
    querySnapshot.forEach((doc) => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    return groups;
  } catch (error) {
    console.error('getGroups error:', error);
    throw error;
  }
};

export const getGroupById = async (id) => {
  try {
    if (!id) return null;
    const docRef = doc(db, 'groups', id.toString());
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('getGroupById error:', error);
    throw error;
  }
};

export const addGroup = async (name, description, defaultToll = 80, defaultDeposit = 300) => {
  try {
    const groupRef = doc(collection(db, 'groups'));
    await setDoc(groupRef, {
      name,
      description: description || '',
      default_toll: Number(defaultToll) || 80,
      default_deposit: Number(defaultDeposit) || 300,
      created_at: new Date()
    });
    return groupRef.id;
  } catch (error) {
    console.error('addGroup error:', error);
    throw error;
  }
};

export const updateGroup = async (id, name, description, defaultToll, defaultDeposit) => {
  try {
    const docRef = doc(db, 'groups', id.toString());
    await updateDoc(docRef, {
      name,
      description: description || '',
      default_toll: Number(defaultToll) || 80,
      default_deposit: Number(defaultDeposit) || 300
    });
  } catch (error) {
    console.error('updateGroup error:', error);
    throw error;
  }
};

export const deleteGroup = async (id) => {
  try {
    const docRef = doc(db, 'groups', id.toString());
    await deleteDoc(docRef);
  } catch (error) {
    console.error('deleteGroup error:', error);
    throw error;
  }
};

// For compatibility with old code
export const getActiveGroupId = async () => {
  return 1;
};

export const setActiveGroupId = async (id) => {
  // Now managed in UserContext
};

export const getGroupStats = async (groupId) => {
  try {
    if (!groupId) return null;
    const gId = groupId.toString();

    // 1. Fetch active members
    const mq = query(
      collection(db, 'members'), 
      where('group_id', '==', gId), 
      where('is_active', '==', true)
    );
    const mSnap = await getDocs(mq);
    const members = [];
    mSnap.forEach(d => members.push({ id: d.id, ...d.data() }));

    // 2. Fetch trips
    const tq = query(collection(db, 'trips'), where('group_id', '==', gId));
    const tSnap = await getDocs(tq);
    const trips = [];
    tSnap.forEach(d => trips.push({ id: d.id, ...d.data() }));

    // 3. Fetch deposits
    const txq = query(
      collection(db, 'transactions'), 
      where('group_id', '==', gId), 
      where('type', '==', 'deposit')
    );
    const txSnap = await getDocs(txq);
    const deposits = [];
    txSnap.forEach(d => deposits.push(d.data()));

    const totalBalance = members.reduce((sum, m) => sum + parseFloat(m.balance || 0), 0);
    const totalSpent = trips.reduce((sum, t) => sum + parseFloat(t.total_toll || 0), 0);
    const totalDeposited = deposits.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

    const today = getToday();
    const todayTrips = trips.filter(t => t.trip_date === today).length;

    return {
      totalBalance,
      totalSpent,
      totalDeposited,
      memberCount: members.length,
      tripCount: trips.length,
      todayTrips
    };
  } catch (error) {
    console.error('getGroupStats error:', error);
    return null;
  }
};
