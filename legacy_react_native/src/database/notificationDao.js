import { db } from './firebase';
import { collection, doc, setDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';

export const sendNotification = async (message) => {
  try {
    const notifRef = doc(collection(db, 'notifications'));
    const notifId = notifRef.id;
    const notifData = {
      message,
      created_at: new Date()
    };
    await setDoc(notifRef, notifData);

    // Send push notification to all registered tokens via Expo's Push API
    try {
      const tokensSnap = await getDocs(collection(db, 'push_tokens'));
      const tokens = [];
      tokensSnap.forEach((d) => {
        const t = d.data().token;
        if (t) tokens.push(t);
      });

      if (tokens.length > 0) {
        const messages = tokens.map((token) => ({
          to: token,
          sound: 'default',
          title: '📢 TollSplit Broadcast',
          body: message,
          data: { notificationId: notifId }
        }));

        // Send notifications in chunks of 100 (Expo API limit)
        for (let i = 0; i < messages.length; i += 100) {
          const chunk = messages.slice(i, i + 100);
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chunk)
          });
        }
        console.log(`Pushed notification to ${tokens.length} tokens.`);
      }
    } catch (pushError) {
      console.warn('Push notification failed:', pushError);
    }

    return { id: notifId, ...notifData };
  } catch (error) {
    console.error('sendNotification error:', error);
    throw error;
  }
};

export const getLatestNotification = async () => {
  try {
    const q = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    
    let result = null;
    querySnapshot.forEach(doc => {
      const data = doc.data();
      let createdAt = data.created_at;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      }
      result = { id: doc.id, ...data, created_at: createdAt };
    });
    return result;
  } catch (error) {
    console.error('getLatestNotification error:', error);
    throw error;
  }
};
