import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc, writeBatch, runTransaction 
} from 'firebase/firestore';

export const getTrips = async (groupId) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('group_id', '==', groupId.toString())
    );
    const querySnapshot = await getDocs(q);
    const trips = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAt = data.created_at;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      }
      trips.push({ 
        id: doc.id, 
        ...data,
        created_at: createdAt
      });
    });

    // Sort in-memory by trip_date descending, then created_at descending to bypass Firestore index requirements
    trips.sort((a, b) => {
      const dateCompare = (b.trip_date || '').localeCompare(a.trip_date || '');
      if (dateCompare !== 0) return dateCompare;
      const createdA = a.created_at ? new Date(a.created_at) : new Date(0);
      const createdB = b.created_at ? new Date(b.created_at) : new Date(0);
      return createdB - createdA;
    });

    return trips;
  } catch (error) {
    console.error('getTrips error:', error);
    throw error;
  }
};

export const getTripMembers = async (tripId) => {
  try {
    if (!tripId) return [];
    const docRef = doc(db, 'trips', tripId.toString());
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return [];
    const data = docSnap.data();
    return data.members || [];
  } catch (error) {
    console.error('getTripMembers error:', error);
    throw error;
  }
};

export const createTrip = async (groupId, date, totalToll, memberIds, note) => {
  try {
    const gId = groupId.toString();
    const perPersonCost = Math.round((totalToll / memberIds.length) * 100) / 100;
    
    const tripRef = doc(collection(db, 'trips'));
    const tripId = tripRef.id;

    await runTransaction(db, async (transaction) => {
      // 1. Fetch all members involved to get their current balance, name, and avatar color
      const memberInfos = [];
      for (const memberId of memberIds) {
        const mId = memberId.toString();
        const memberRef = doc(db, 'members', mId);
        const memberSnap = await transaction.get(memberRef);
        if (!memberSnap.exists()) {
          throw new Error(`Member ${mId} does not exist!`);
        }
        memberInfos.push({
          id: mId,
          ref: memberRef,
          data: memberSnap.data()
        });
      }

      // 2. Map embedded members array for the trip document
      const embeddedMembers = memberInfos.map(mInfo => ({
        member_id: mInfo.id,
        cost_share: perPersonCost,
        member_name: mInfo.data.name,
        avatar_color: mInfo.data.avatar_color
      }));

      // 3. Write trip document
      transaction.set(tripRef, {
        group_id: gId,
        trip_date: date,
        total_toll: Number(totalToll),
        traveler_count: memberIds.length,
        per_person_cost: perPersonCost,
        note: note || '',
        created_at: new Date(),
        members: embeddedMembers,
        member_ids: memberIds.map(id => id.toString())
      });

      // 4. Update each member's balance and record transaction
      for (const mInfo of memberInfos) {
        const currentBalance = Number(mInfo.data.balance) || 0;
        const newBalance = currentBalance - perPersonCost;
        
        // Update member balance
        transaction.update(mInfo.ref, { balance: newBalance });

        // Add transaction doc
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          group_id: gId,
          member_id: mInfo.id,
          type: 'trip',
          amount: perPersonCost,
          note: note || `Trip on ${date}`,
          created_at: new Date(),
          member_name: mInfo.data.name,
          avatar_color: mInfo.data.avatar_color,
          trip_id: tripId
        });
      }
    });

    return {
      id: tripId,
      travelerCount: memberIds.length,
      perPersonCost
    };
  } catch (error) {
    console.error('createTrip error:', error);
    throw error;
  }
};

export const deleteTrip = async (tripId) => {
  try {
    const tId = tripId.toString();
    const tripRef = doc(db, 'trips', tId);

    await runTransaction(db, async (transaction) => {
      const tripSnap = await transaction.get(tripRef);
      if (!tripSnap.exists()) {
        throw new Error('Trip not found!');
      }
      
      const tripData = tripSnap.data();
      const perPersonCost = Number(tripData.per_person_cost) || 0;
      
      // 1. Fetch all member documents (Reads) first
      const memberSnaps = [];
      if (tripData.members && Array.isArray(tripData.members)) {
        for (const m of tripData.members) {
          const memberRef = doc(db, 'members', m.member_id);
          const memberSnap = await transaction.get(memberRef);
          memberSnaps.push({ ref: memberRef, snap: memberSnap });
        }
      }

      // 2. Reverse balances for each member (Writes)
      for (const mObj of memberSnaps) {
        if (mObj.snap.exists()) {
          const currentBalance = Number(mObj.snap.data().balance) || 0;
          const newBalance = currentBalance + perPersonCost;
          transaction.update(mObj.ref, { balance: newBalance });
        }
      }

      // 3. Delete trip document (Write)
      transaction.delete(tripRef);
    });

    // 3. Delete transactions related to this trip_id
    const txq = query(collection(db, 'transactions'), where('trip_id', '==', tId));
    const txSnap = await getDocs(txq);
    const batch = writeBatch(db);
    txSnap.forEach(d => {
      batch.delete(doc(db, 'transactions', d.id));
    });
    await batch.commit();

  } catch (error) {
    console.error('deleteTrip error:', error);
    throw error;
  }
};

export const getReportByDateRange = async (groupId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'trips'),
      where('group_id', '==', groupId.toString())
    );
    const querySnapshot = await getDocs(q);
    const trips = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.trip_date >= startDate && data.trip_date <= endDate) {
        trips.push({ id: doc.id, ...data });
      }
    });

    const totalToll = trips.reduce((sum, t) => sum + parseFloat(t.total_toll || 0), 0);
    const tripCount = trips.length;

    // Group spending by member
    const spendingMap = {};
    for (const trip of trips) {
      if (trip.members && Array.isArray(trip.members)) {
        for (const m of trip.members) {
          const mId = m.member_id;
          if (!spendingMap[mId]) {
            spendingMap[mId] = {
              id: mId,
              name: m.member_name || 'Unknown',
              avatar_color: m.avatar_color || '#ccc',
              total_spent: 0,
              trip_count: 0
            };
          }
          spendingMap[mId].total_spent += Number(m.cost_share) || 0;
          spendingMap[mId].trip_count += 1;
        }
      }
    }

    const memberSpending = Object.values(spendingMap).sort((a, b) => b.total_spent - a.total_spent);

    return {
      totalToll,
      tripCount,
      trips,
      memberSpending
    };
  } catch (error) {
    console.error('getReportByDateRange error:', error);
    throw error;
  }
};

export const getMonthlyReport = async (groupId, month, year) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  return getReportByDateRange(groupId, startDate, endDate);
};
