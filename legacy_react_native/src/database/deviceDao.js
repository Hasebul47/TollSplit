import { db } from './firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const getDevices = async () => {
  try {
    const q = query(
      collection(db, 'devices'),
      orderBy('lastActive', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const devices = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let lastActive = data.lastActive;
      if (lastActive && typeof lastActive.toDate === 'function') {
        lastActive = lastActive.toDate().toISOString();
      }
      devices.push({
        id: doc.id,
        ...data,
        lastActive
      });
    });
    return devices;
  } catch (error) {
    console.error('getDevices error:', error);
    throw error;
  }
};

export const updateDeviceBanStatus = async (deviceId, isBanned) => {
  try {
    const deviceRef = doc(db, 'devices', deviceId.toString());
    await updateDoc(deviceRef, {
      isBanned: Boolean(isBanned)
    });
    return true;
  } catch (error) {
    console.error('updateDeviceBanStatus error:', error);
    throw error;
  }
};

export const deleteDevice = async (deviceId) => {
  try {
    const deviceRef = doc(db, 'devices', deviceId.toString());
    await deleteDoc(deviceRef);
    return true;
  } catch (error) {
    console.error('deleteDevice error:', error);
    throw error;
  }
};
