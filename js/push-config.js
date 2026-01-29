/**
 * Push Notification Configuration
 * VAPID Keys for Web Push Notifications
 */

// VAPID Public Key (used client-side)
export const VAPID_PUBLIC_KEY = 'BHBSxbyFPud6kHeLav2_BZTxSKXwrowJ2quZ50F4Fa4miNKveWF1W7zQWcnJxBhb8Rk4Drg2mYMzAQM5dd_5wQc';

// VAPID Private Key (KEEP SECRET - only use server-side)
// This should NOT be in client code in production
// Store in environment variables or Firebase Functions
const VAPID_PRIVATE_KEY = 'dNpfpDs-iU6DxRTis3aXj_1jOQewbU-uOMnd-0WvuGA';

/**
 * Request notification permission from user
 * @returns {Promise<NotificationPermission>}
 */
export async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        console.log('Notification permission already granted');
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        return permission;
    }

    return Notification.permission;
}

/**
 * Subscribe user to push notifications
 * @param {ServiceWorkerRegistration} registration
 * @returns {Promise<PushSubscription>}
 */
export async function subscribeToPush(registration) {
    try {
        const permission = await requestNotificationPermission();

        if (permission !== 'granted') {
            throw new Error('Notification permission not granted');
        }

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            console.log('Already subscribed to push notifications');
            return subscription;
        }

        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        console.log('Subscribed to push notifications:', subscription);
        return subscription;
    } catch (error) {
        console.error('Error subscribing to push:', error);
        throw error;
    }
}

/**
 * Unsubscribe from push notifications
 * @param {ServiceWorkerRegistration} registration
 */
export async function unsubscribeFromPush(registration) {
    try {
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('Unsubscribed from push notifications');
        }
    } catch (error) {
        console.error('Error unsubscribing from push:', error);
        throw error;
    }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 * @param {string} base64String
 * @returns {Uint8Array}
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Save push subscription to Firestore
 * @param {PushSubscription} subscription
 * @param {string} userId
 * @param {object} db - Firestore database manager
 */
export async function savePushSubscription(subscription, userId, db) {
    try {
        const subscriptionData = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
                auth: arrayBufferToBase64(subscription.getKey('auth'))
            },
            userId: userId,
            createdAt: new Date().toISOString()
        };

        // Save to Firestore (you'll need to implement this in db-firestore.js)
        // await db.savePushSubscription(subscriptionData);

        console.log('Push subscription saved:', subscriptionData);
        return subscriptionData;
    } catch (error) {
        console.error('Error saving push subscription:', error);
        throw error;
    }
}

/**
 * Convert ArrayBuffer to base64
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Show a test notification
 */
export async function showTestNotification() {
    if (Notification.permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('EventFlow Test', {
            body: 'Push notifications are working! 🎉',
            icon: 'https://cdn-icons-png.flaticon.com/512/3176/3176396.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3176/3176396.png',
            vibrate: [200, 100, 200],
            tag: 'test-notification'
        });
    }
}
