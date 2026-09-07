import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, writeBatch, runTransaction 
} from 'firebase/firestore';

export const getMembers = async (groupId) => {
  try {
    const q = query(
      collection(db, 'members'),
      where('group_id', '==', groupId.toString()),
      where('is_active', '==', true)
    );
    const querySnapshot = await getDocs(q);
    const members = [];
    querySnapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() });
    });
    // Sort in-memory by name to avoid requiring Firestore composite indexes
    members.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return members;
  } catch (error) {
    console.error('getMembers error:', error);
    throw error;
  }
};

export const addMember = async (groupId, name, phone, initialDeposit = 0) => {
  try {
    const memberRef = doc(collection(db, 'members'));
    const memberId = memberRef.id;
    const avatarColor = getRandomColor();

    const batch = writeBatch(db);
    
    batch.set(memberRef, {
      group_id: groupId.toString(),
      name,
      phone: phone || '',
      balance: Number(initialDeposit) || 0,
      avatar_color: avatarColor,
      is_active: true,
      created_at: new Date()
    });

    if (initialDeposit > 0) {
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, {
        group_id: groupId.toString(),
        member_id: memberId,
        type: 'deposit',
        amount: Number(initialDeposit),
        note: 'Initial deposit',
        created_at: new Date(),
        member_name: name,
        avatar_color: avatarColor
      });
    }

    await batch.commit();
    return memberId;
  } catch (error) {
    console.error('addMember error:', error);
    throw error;
  }
};

export const updateMember = async (id, name, phone) => {
  try {
    const docRef = doc(db, 'members', id.toString());
    await updateDoc(docRef, {
      name,
      phone: phone || ''
    });
  } catch (error) {
    console.error('updateMember error:', error);
    throw error;
  }
};

export const deactivateMember = async (id) => {
  try {
    const docRef = doc(db, 'members', id.toString());
    await updateDoc(docRef, {
      is_active: false
    });
  } catch (error) {
    console.error('deactivateMember error:', error);
    throw error;
  }
};

export const addDeposit = async (groupId, memberId, amount, note, type = 'deposit') => {
  try {
    const mId = memberId.toString();
    const gId = groupId.toString();
    const memberRef = doc(db, 'members', mId);
    
    await runTransaction(db, async (transaction) => {
      const memberSnap = await transaction.get(memberRef);
      if (!memberSnap.exists()) {
        throw new Error('Member does not exist!');
      }

      const memberData = memberSnap.data();
      const currentBalance = Number(memberData.balance) || 0;
      const actualAmount = type === 'deduction' ? -Math.abs(amount) : Math.abs(amount);
      const newBalance = currentBalance + actualAmount;

      // Update balance
      transaction.update(memberRef, { balance: newBalance });

      // Record transaction
      const txRef = doc(collection(db, 'transactions'));
      transaction.set(txRef, {
        group_id: gId,
        member_id: mId,
        type: type,
        amount: Math.abs(actualAmount),
        note: note || (type === 'deposit' ? 'Manual deposit' : 'Manual deduction'),
        created_at: new Date(),
        member_name: memberData.name,
        avatar_color: memberData.avatar_color
      });
    });
  } catch (error) {
    console.error('addDeposit error:', error);
    throw error;
  }
};

export const getMemberStats = async (memberId) => {
  try {
    if (!memberId) return null;
    const mId = memberId.toString();

    // Fetch all transactions for this member of type 'deposit'
    const txq = query(
      collection(db, 'transactions'), 
      where('member_id', '==', mId),
      where('type', '==', 'deposit')
    );
    const txSnap = await getDocs(txq);
    const deposits = [];
    txSnap.forEach(d => deposits.push(d.data()));

    // Fetch all trips containing this member ID in member_ids
    const tq = query(
      collection(db, 'trips'),
      where('member_ids', 'array-contains', mId)
    );
    const tSnap = await getDocs(tq);
    let spent = 0;
    let tripCount = 0;
    tSnap.forEach(doc => {
      const tripData = doc.data();
      const mObj = tripData.members?.find(m => m.member_id === mId);
      if (mObj) {
        spent += Number(mObj.cost_share) || 0;
        tripCount++;
      }
    });

    const deposited = deposits.reduce((sum, d) => sum + Number(d.amount || 0), 0);

    return {
      spent,
      deposited,
      totalSpent: spent,
      totalDeposits: deposited,
      tripCount
    };
  } catch (error) {
    console.error('getMemberStats error:', error);
    return null;
  }
};

const getRandomColor = () => {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
  return colors[Math.floor(Math.random() * colors.length)];
};
