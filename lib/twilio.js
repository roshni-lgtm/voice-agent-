import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

export function getTwilioClient() {
  if (!accountSid || !authToken) {
    console.warn('Twilio credentials not configured');
    return null;
  }
  
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export function getTwilioPhoneNumber() {
  return twilioPhoneNumber;
}

export function validateTwilioSignature(request, url, params) {
  if (!authToken) {
    return false;
  }
  
  const signature = request.headers.get('x-twilio-signature');
  if (!signature) {
    return false;
  }
  
  return twilio.validateRequest(authToken, signature, url, params);
}

export function createTwiMLResponse() {
  return new twilio.twiml.VoiceResponse();
}
