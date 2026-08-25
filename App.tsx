import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { getMessaging, requestPermission, getToken, subscribeToTopic, onMessage, AuthorizationStatus } from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  useEffect(() => {
    const requestUserPermission = async () => {
      try {
        if (Platform.OS === 'android' && Platform.Version >= 33) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        }
        
        const msg = getMessaging();
        const authStatus = await requestPermission(msg);
        
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          const token = await getToken(msg);
          console.log('FCM Token:', token);
          
          await subscribeToTopic(msg, 'DEALER_ALL');

          // Fetch user session to subscribe to specific dealer topic
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const sessionStr = await AsyncStorage.getItem('user_session');
            if (sessionStr) {
              const session = JSON.parse(sessionStr);
              if (session.email) {
                const specificTopic = 'dealer_' + session.email.replace(/[^a-zA-Z0-9]/g, '_');
                await subscribeToTopic(msg, specificTopic);
                console.log('Subscribed to specific topic:', specificTopic);
              }
            }
          } catch (e) {
            console.log('Could not subscribe to specific dealer topic', e);
          }
        }
      } catch (error) {
        console.error('Firebase setup error:', error);
      }
    };

    requestUserPermission();

    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      console.log('FCM Received in foreground:', remoteMessage);

      // Show system notification when app is OPEN
      const channelId = await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      await notifee.displayNotification({
        title: remoteMessage.notification?.title || 'New Bidding Notification!',
        body: remoteMessage.notification?.body || 'You have a new message.',
        android: {
          channelId,
          smallIcon: 'ic_launcher',
          pressAction: {
            id: 'default',
          },
        },
      });
    });

    return unsubscribe;
  }, []);

  return <AppNavigator />;
}

export default App;
