# AI Calling Platform - Complete Setup Guide

## \ud83d\ude80 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd /app
yarn install
```

### Step 2: Configure API Keys

Edit `/app/.env` and replace the placeholder values:

```env
# Required: Get these API keys first!

# Twilio (Sign up at https://www.twilio.com/try-twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# ElevenLabs (Sign up at https://elevenlabs.io)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id_here

# OpenAI (Sign up at https://platform.openai.com)
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Step 3: Start the Application
```bash
yarn dev
```

### Step 4: Access the Dashboard
Open your browser and navigate to:
- **Homepage**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard

---

## \ud83d\udd11 Getting API Keys

### 1. Twilio Setup (Voice Calling)

#### Sign Up
1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account
3. You'll get $15 credit for testing

#### Get Credentials
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Copy these to your `.env` file

#### Buy a Phone Number
1. In Twilio Console, go to **Phone Numbers** > **Buy a Number**
2. Choose a number with **Voice** capability
3. Buy the number (costs ~$1/month)
4. Copy the phone number (in E.164 format: +1234567890) to `.env`

#### Configure Webhooks (Important!)
1. Go to **Phone Numbers** > **Manage** > **Active Numbers**
2. Click on your phone number
3. Scroll to **Voice Configuration**:
   - **A Call Comes In**: 
     - Webhook: `https://your-domain.com/api/twilio/voice/incoming`
     - HTTP POST
   - **Call Status Changes**:
     - Webhook: `https://your-domain.com/api/twilio/voice/status-callback`  
     - HTTP POST

**For Local Development with ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Update your .env:
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io

# Use this URL in Twilio webhooks:
# https://abc123.ngrok.io/api/twilio/voice/incoming
```

---

### 2. ElevenLabs Setup (AI Voice Agent)

#### Sign Up
1. Go to https://elevenlabs.io
2. Sign up for an account
3. Free tier includes 10,000 characters/month

#### Get API Key
1. Click on your profile (top right)
2. Go to **Settings** > **API Keys**
3. Click **Generate New Key**
4. Copy the key to `.env` as `ELEVENLABS_API_KEY`

#### Create Conversational Agent (Optional)
1. Go to **Conversational AI** section
2. Click **Create New Agent**
3. Configure:
   - Name: "AI Sales Agent"
   - Voice: Choose a voice
   - Language: English/Hindi
   - System Prompt: "You are a helpful AI assistant..."
4. Copy the **Agent ID** to `.env` as `ELEVENLABS_AGENT_ID`

**Note**: For basic text-to-speech without conversational AI, you only need the API key.

---

### 3. OpenAI Setup (AI Intelligence)

#### Sign Up
1. Go to https://platform.openai.com
2. Sign up or log in
3. Add payment method (required for API access)

#### Get API Key
1. Go to **API Keys** section
2. Click **Create New Secret Key**
3. Name it "AI Calling Platform"
4. Copy the key (starts with `sk-`)
5. Paste in `.env` as `OPENAI_API_KEY`

#### Add Credits
1. Go to **Billing** > **Payment Methods**
2. Add a payment method
3. Set up auto-recharge or add credits
4. Minimum: $5 recommended for testing

**API Usage Estimates:**
- Transcription (Whisper): ~$0.006 per minute
- GPT-4o-mini analysis: ~$0.001 per call
- Total: ~$0.01 per analyzed call

---

## \ud83d\udcca Database Setup

The platform uses MongoDB, which should already be configured.

### Verify MongoDB Connection
```bash
# Check if MongoDB is running
curl http://localhost:27017

# Test database connection
curl http://localhost:3000/api/root
```

Expected response:
```json
{
  "message": "AI Calling Platform API",
  "version": "1.0.0", 
  "status": "healthy"
}
```

---

## \u2705 Testing the Setup

### 1. Test API Health
```bash
curl http://localhost:3000/api/root
```

### 2. Test Dashboard Summary
```bash
curl http://localhost:3000/api/dashboard/summary
```

### 3. Make a Test Call (After Twilio Setup)
```bash
curl -X POST http://localhost:3000/api/twilio/voice/outgoing \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890"}'
```

### 4. Test in Browser
1. Go to http://localhost:3000/dashboard
2. Click "Make Call" button
3. Enter a phone number
4. Check call appears in the dashboard

---

## \ud83d\udd27 Configuration Checklist

Before going live, ensure:

- [ ] All API keys are configured in `.env`
- [ ] Twilio phone number is purchased
- [ ] Twilio webhooks are configured correctly
- [ ] MongoDB is connected and running
- [ ] Application starts without errors
- [ ] Dashboard loads at http://localhost:3000/dashboard
- [ ] Test call can be made successfully
- [ ] Call recording works
- [ ] AI analysis works (after adding OpenAI key)

---

## \ud83d\ude80 Production Deployment

### Environment Variables for Production

Copy your `.env` file and update:
- `NEXT_PUBLIC_BASE_URL` - Your production domain
- `MONGO_URL` - Production MongoDB connection string
- All API keys (same as development)
- `JWT_SECRET` - Change to a strong random string
- `JWT_REFRESH_SECRET` - Change to a different strong random string

### Deployment Steps

1. **Build the application**:
```bash
yarn build
yarn start
```

2. **Update Twilio Webhooks**:
   - Change all webhook URLs to your production domain
   - Format: `https://your-domain.com/api/twilio/voice/incoming`

3. **Set up SSL**:
   - Twilio requires HTTPS for webhooks
   - Use Let's Encrypt or your hosting provider's SSL

4. **Monitor Logs**:
   - Check application logs for errors
   - Monitor Twilio Debugger for webhook issues
   - Track OpenAI usage in dashboard

---

## \ud83d\udc1e Common Issues & Solutions

### Issue: Twilio webhooks not working
**Solution**: 
- Verify webhook URLs in Twilio Console
- Ensure ngrok is running for local dev
- Check Twilio Debugger for error messages
- Verify `NEXT_PUBLIC_BASE_URL` is correct

### Issue: Calls not recording
**Solution**:
- Check Twilio Console > Voice > Settings
- Verify recording webhooks are configured
- Check MongoDB connection
- Ensure disk space available

### Issue: AI analysis fails
**Solution**:
- Verify OpenAI API key is valid
- Check OpenAI account has credits
- Ensure call has a transcript
- Check API rate limits

### Issue: "OpenAI not configured" error
**Solution**:
- Add OpenAI API key to `.env`
- Restart the application
- Verify key starts with `sk-`

### Issue: Can't access dashboard
**Solution**:
- Check if server is running: `curl http://localhost:3000`
- Clear browser cache
- Check console for JavaScript errors
- Verify port 3000 is not blocked

---

## \ud83d\udcda API Documentation

### Authentication
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Making Calls
```bash
# Outbound call
curl -X POST http://localhost:3000/api/twilio/voice/outgoing \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Hello from AI"}'
```

### Analytics
```bash
# Dashboard summary
curl http://localhost:3000/api/dashboard/summary

# Analytics by period
curl "http://localhost:3000/api/dashboard/analytics?period=daily"

# Get all calls
curl "http://localhost:3000/api/calls?limit=50"

# Analyze specific call
curl -X POST http://localhost:3000/api/calls/CALL_ID/analyze
```

---

## \ud83d\udcac Support

If you encounter issues:

1. Check the logs: `tail -f /var/log/supervisor/nextjs.out.log`
2. Restart services: `sudo supervisorctl restart all`
3. Review Twilio Debugger: https://www.twilio.com/console/debugger
4. Check OpenAI usage: https://platform.openai.com/usage
5. Verify MongoDB: `curl http://localhost:27017`

---

## \ud83c\udf93 Next Steps

After setup is complete:

1. **Customize AI Agent**:
   - Edit prompts in `/app/lib/openai-client.js`
   - Configure voice in ElevenLabs dashboard
   - Adjust sentiment analysis parameters

2. **Add Users**:
   - Use `/api/auth/register` to create users
   - Assign roles (user, admin)
   - Configure permissions

3. **Monitor Performance**:
   - Check Dashboard > Analytics daily
   - Review call quality
   - Monitor API costs
   - Track conversion rates

4. **Scale Up**:
   - Add more phone numbers
   - Enable auto-scaling
   - Set up monitoring alerts
   - Configure backups

---

**\ud83c\udf89 Congratulations! Your AI Calling Platform is ready!**

Visit http://localhost:3000/dashboard to start making AI-powered calls.
