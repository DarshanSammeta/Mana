import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    console.error("Firebase admin initialization error", error);
  }
}

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    const message = {
      notification: { title, body },
      token,
      data: data ? { ...data, timestamp: String(Date.now()) } : { timestamp: String(Date.now()) },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          priority: "high" as const,
          channelId: "booking_alerts",
        },
      },
    };
    return await admin.messaging().send(message);
  } catch (error) {
    console.error("Error sending push notification:", error);
    return null;
  }
};
