import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export const getTransactions = async (groupId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('group_id', '==', groupId.toString())
    );
    const querySnapshot = await getDocs(q);
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAt = data.created_at;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      }
      transactions.push({ 
        id: doc.id, 
        ...data,
        created_at: createdAt,
        member_name: data.member_name || 'Unknown',
        avatar_color: data.avatar_color || '#ccc'
      });
    });

    // Sort in-memory by created_at descending to avoid Firestore index requirements
    transactions.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    });

    // Apply limit manually
    return transactions.slice(0, limitCount);
  } catch (error) {
    console.error('getTransactions error:', error);
    throw error;
  }
};

export const getRecentTransactions = async (groupId, limitCount = 10) => {
  return getTransactions(groupId, limitCount);
};
