import twilio from 'twilio';

import { SMS_CONFIG } from '@/config/sms';

const accountSid = SMS_CONFIG.twilio.accountSid;
const authToken = SMS_CONFIG.twilio.authToken;

const getTwilioClient = () => {
  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not found');
    return null;
  }
  return twilio(accountSid, authToken);
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
