import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../database/firebase';
import { getGroups } from '../database/groupDao';
import { Colors } from '../theme/colors';

// Configure notification behavior for when the app is OPEN
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidImportance.MAX,
  }),
});

async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted.');
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) {
      console.log('No EAS project ID found.');
      return null;
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (error) {
    console.warn('Error getting Expo push token:', error);
    return null;
  }
}

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [role, setRole] = useState('viewer'); 
  const [groupId, setGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [deviceUserName, setDeviceUserName] = useState('');

  const lastNotifId = useRef(null);
  const isFirstRun = useRef(true);

  useEffect(() => {
    loadSettings();
    
    // Register Push Token in Firestore
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        try {
          const tokenRef = doc(db, 'push_tokens', token);
          await setDoc(tokenRef, {
            token,
            updated_at: new Date()
          });
          console.log('Push token registered successfully:', token);
        } catch (e) {
          console.log('Error saving push token to Firestore:', e);
        }
      }
    });

    // Set up real-time listener on the notifications collection
    const q = query(
      collection(db, 'notifications'),
      orderBy('created_at', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        setNotification(null);
        return;
      }

      const docSnap = snapshot.docs[0];
      const docId = docSnap.id;
      const data = docSnap.data();

      // Deduplicate: If this is the same document ID, ignore
      if (lastNotifId.current === docId) {
        return;
      }
      lastNotifId.current = docId;

      let createdAt = data.created_at;
      if (createdAt && typeof createdAt.toDate === 'function') {
        createdAt = createdAt.toDate().toISOString();
      } else if (createdAt) {
        createdAt = new Date(createdAt).toISOString();
      }

      const latest = {
        id: docId,
        ...data,
        created_at: createdAt
      };

      // Check if this notification has been dismissed previously by the user
      const dismissedId = await AsyncStorage.getItem('lastDismissedNotificationId');
      if (dismissedId === docId) {
        setNotification(null);
      } else {
        setNotification(latest);
      }

      // Trigger local push notification on new messages (not initial fetch)
      if (!isFirstRun.current) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "📢 Broadcast Message",
            body: data.message || "",
            sound: true,
            priority: Notifications.AndroidImportance.MAX,
          },
          trigger: null,
        });
      }

      isFirstRun.current = false;
    }, (error) => {
      console.error("Notifications onSnapshot error:", error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!deviceId) return;

    // Register or update device info in Firestore
    const deviceRef = doc(db, 'devices', deviceId);
    setDoc(deviceRef, {
      deviceId,
      os: Platform.OS,
      osVersion: Platform.Version ? Platform.Version.toString() : 'unknown',
      lastActive: new Date(),
      userName: deviceUserName || (Platform.OS === 'android' ? 'Android User' : 'iOS User')
    }, { merge: true }).catch(err => console.log('Device registration error:', err));

    // Listen to changes on the device document to enforce real-time ban/unban
    const unsubscribeDevice = onSnapshot(deviceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIsBanned(!!data.isBanned);
      }
    }, (error) => {
      console.error("Device listener error:", error);
    });

    return () => {
      unsubscribeDevice();
    };
  }, [deviceId, deviceUserName]);

  const loadSettings = async () => {
    try {
      let savedDeviceId = await AsyncStorage.getItem('deviceId');
      if (!savedDeviceId) {
        savedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
        await AsyncStorage.setItem('deviceId', savedDeviceId);
      }
      setDeviceId(savedDeviceId);

      let savedDeviceUserName = await AsyncStorage.getItem('deviceUserName');
      if (!savedDeviceUserName) {
        savedDeviceUserName = Platform.OS === 'android' ? 'Android User' : 'iOS User';
        await AsyncStorage.setItem('deviceUserName', savedDeviceUserName);
      }
      setDeviceUserName(savedDeviceUserName);

      const savedRole = await AsyncStorage.getItem('userRole');
      const savedGroupId = await AsyncStorage.getItem('activeGroupId');
      
      if (savedRole) setRole(savedRole);
      if (savedGroupId) {
        setGroupId(savedGroupId);
      } else {
        const groups = await getGroups();
        if (groups && groups.length > 0) {
          const id = groups[0].id;
          setGroupId(id);
          await AsyncStorage.setItem('activeGroupId', id);
        }
      }
    } catch (e) {
      console.log('Error loading settings', e);
      Alert.alert('Settings Load Error', e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (newRole) => {
    setRole(newRole);
    await AsyncStorage.setItem('userRole', newRole);
  };

  const updateGroupId = async (newId) => {
    if (newId) {
      setGroupId(newId);
      await AsyncStorage.setItem('activeGroupId', newId);
    }
  };

  const updateDeviceUserName = async (name) => {
    try {
      const trimmed = name.trim();
      setDeviceUserName(trimmed);
      await AsyncStorage.setItem('deviceUserName', trimmed);
      if (deviceId) {
        const deviceRef = doc(db, 'devices', deviceId);
        await setDoc(deviceRef, { userName: trimmed }, { merge: true });
      }
    } catch (e) {
      console.log('Error updating device user name:', e);
    }
  };

  const clearNotification = async () => {
    if (notification) {
      try {
        await AsyncStorage.setItem('lastDismissedNotificationId', notification.id);
      } catch (e) {
        console.log('Error saving dismissed notification ID:', e);
      }
    }
    setNotification(null);
  };

  return (
    <UserContext.Provider value={{ 
      role, groupId, updateRole, updateGroupId, 
      loading, notification, clearNotification,
      isBanned, deviceId, deviceUserName, updateDeviceUserName
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
