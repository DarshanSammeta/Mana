import twilio from 'twilio';

import { SMS_CONFIG } from '@/config/sms';

let twilioInstance: any = null;

const getTwilioClient = () => {
  if (typeof window !== "undefined") return null;

  const accountSid = SMS_CONFIG.twilio.accountSid;
  const authToken = SMS_CONFIG.twilio.authToken;

  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not found');
    return null;
  }

  if (!twilioInstance) {
    twilioInstance = twilio(accountSid, authToken);
  }
  return twilioInstance;
};

export const sendSMS = async (to: string, message: string) => {
  try {
    const client = getTwilioClient();
    if (!client) {
      console.error('Twilio client not initialized - check environment variables');
      return null;
    }

    const response = await client.messages.create({
      body: message,
      from: SMS_CONFIG.twilio.phoneNumber,
      to: to
    });
    return response.sid;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return null;
  }
};

export const sendOTP = async (to: string, otp: string) => {
  const message = `Your Mana Events verification code is: ${otp}. Do not share this with anyone.`;
  return sendSMS(to, message);
};
