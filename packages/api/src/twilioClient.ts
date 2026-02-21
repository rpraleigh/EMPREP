import Twilio from 'twilio';

export interface TwilioSendResult {
  sid: string;
  status: string;
}

export interface TwilioClientWrapper {
  sendSms(to: string, body: string): Promise<TwilioSendResult>;
}

export function createTwilioClient(): TwilioClientWrapper {
  const accountSid = process.env['TWILIO_ACCOUNT_SID'];
  const authToken  = process.env['TWILIO_AUTH_TOKEN'];
  const fromNumber = process.env['TWILIO_FROM_NUMBER'];

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Missing Twilio env vars (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)');
  }

  const client = Twilio(accountSid, authToken);

  return {
    async sendSms(to: string, body: string): Promise<TwilioSendResult> {
      const msg = await client.messages.create({ from: fromNumber, to, body });
      return { sid: msg.sid, status: msg.status };
    },
  };
}
