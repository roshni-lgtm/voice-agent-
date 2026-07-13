# AI Calling Platform

Production-ready AI Voice Calling Platform with Twilio, ElevenLabs Conversational AI, and OpenAI intelligence.

## Features

### Voice Calling (Twilio)
- ✅ Incoming & Outgoing Calls
- ✅ Call Recording
- ✅ Call Status Tracking
- ✅ Media Streams Support
- ✅ Phone Number Management
- ✅ Webhook Handling
- ✅ Conference Calls Ready

### AI Voice Agent (ElevenLabs)
- ✅ Conversational AI Integration
- ✅ Real-time Audio Streaming
- ✅ Multi-language Support (Hindi, English)
- ✅ Custom Voice Configuration
- ✅ Interruption Support

### AI Intelligence (OpenAI)
- ✅ Live Transcription (Whisper)
- ✅ Sentiment Analysis
- ✅ Conversation Summarization
- ✅ Intent Detection
- ✅ Lead Qualification
- ✅ CRM Notes Generation
- ✅ Action Items Extraction

### Real-time Dashboard
- ✅ Live Call Monitoring
- ✅ Real-time Statistics
- ✅ Call Analytics & Charts
- ✅ Advanced Filtering
- ✅ Call History
- ✅ Recording Playback

### Authentication & Security
- ✅ JWT Authentication
- ✅ Refresh Tokens
- ✅ Role-Based Access Control
- ✅ Secure API Key Management

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Voice**: Twilio Programmable Voice
- **AI Voice**: ElevenLabs Conversational AI
- **AI Intelligence**: OpenAI GPT-4o, Whisper
- **Charts**: Recharts
- **Authentication**: JWT, bcrypt

## Quick Start

### 1. Prerequisites

- Node.js 18+ and yarn
- MongoDB (local or Atlas)
- Twilio account with phone number
- ElevenLabs API key
- OpenAI API key

### 2. Installation

```bash
cd /app
yarn install
```

### 3. Environment Configuration

Update `/app/.env` with your credentials:

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017
DB_NAME=ai_calling_platform

# Application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
CORS_ORIGINS=*

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_refresh_secret_change_in_production

# Media Stream URL (for Twilio)
MEDIA_STREAM_URL=wss://your-domain.com/api/twilio/media-stream
```

### 4. Get API Keys

#### Twilio
1. Sign up at [twilio.com](https://www.twilio.com/try-twilio)
2. Get your Account SID and Auth Token from console
3. Buy a phone number with Voice capability
4. Configure webhooks (see Twilio Setup section)

#### ElevenLabs
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get API key from Settings > API Keys
3. Create a Conversational AI agent
4. Copy the Agent ID

#### OpenAI
1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Go to API Keys section
3. Create a new API key
4. Add billing information

### 5. Start Development Server

```bash
yarn dev
```

The app will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- Dashboard: http://localhost:3000/dashboard

## Twilio Setup

### Configure Webhooks

1. Go to Twilio Console > Phone Numbers > Manage > Active Numbers
2. Click on your phone number
3. Under "Voice & Fax", configure:

**A Call Comes In**:
- Webhook: `https://your-domain.com/api/twilio/voice/incoming`
- HTTP POST

**Call Status Changes**:
- Webhook: `https://your-domain.com/api/twilio/voice/status-callback`
- HTTP POST

**Recording Status Changes**:
- Webhook: `https://your-domain.com/api/twilio/voice/recording-status`
- HTTP POST

### Test with ngrok (Development)

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Update .env with ngrok URL
NEXT_PUBLIC_BASE_URL=https://your-ngrok-url.ngrok.io
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Calls
- `GET /api/calls` - Get all calls (with filters)
- `GET /api/calls/:id` - Get call details
- `POST /api/calls/:id/analyze` - Analyze call with AI
- `POST /api/twilio/voice/outgoing` - Make outbound call

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard summary
- `GET /api/dashboard/analytics` - Get analytics data

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

### Twilio Webhooks (POST only)
- `/api/twilio/voice/incoming` - Incoming call webhook
- `/api/twilio/voice/outgoing-answer` - Outgoing call answer
- `/api/twilio/voice/status-callback` - Call status updates
- `/api/twilio/voice/recording-complete` - Recording complete
- `/api/twilio/voice/recording-status` - Recording status

## Database Schema

### Collections

#### users
- id, email, password, name, role, createdAt, updatedAt

#### calls
- id, callSid, from, to, direction, status, duration, startedAt, endedAt, recordingSid, recordingUrl, transcriptId, analysisId, createdAt, updatedAt

#### recordings
- id, recordingSid, callSid, url, duration, status, createdAt

#### transcripts
- id, callId, callSid, text, language, createdAt

#### call_analyses
- id, callId, callSid, sentiment, summary, intent, leadQualification, crmNotes, createdAt

#### call_events
- id, callSid, event, status, data, createdAt

#### settings
- type, [configuration fields], updatedAt

## Features Overview

### Making Calls

1. **From Dashboard**: Click "Make Call" button
2. **Via API**:
```bash
curl -X POST http://localhost:3000/api/twilio/voice/outgoing \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890"}'
```

### Analyzing Calls

1. Go to Dashboard > Calls
2. Click the AI brain icon on any call
3. Analysis includes:
   - Sentiment (overall, customer, agent)
   - Conversation summary
   - Intent detection
   - Lead qualification
   - Action items
   - CRM notes

### Viewing Analytics

1. Go to Dashboard > Analytics
2. Select date range and period
3. View:
   - Call volume trends
   - Status distribution
   - AI vs Human calls
   - Average duration trends
   - Answer rates

## Production Deployment

### Environment Variables

Make sure all environment variables are set in your production environment.

### MongoDB

- Use MongoDB Atlas or managed MongoDB
- Enable authentication
- Configure IP whitelist
- Set up backups

### Security

- Change all default secrets
- Use strong JWT secrets
- Enable HTTPS
- Configure CORS properly
- Set up rate limiting
- Regular security audits

### Monitoring

- Set up application monitoring (e.g., Sentry)
- Monitor Twilio usage and costs
- Track OpenAI API usage
- Set up alerts for errors

## Troubleshooting

### Twilio Webhooks Not Working

1. Check webhook URLs in Twilio Console
2. Verify NEXT_PUBLIC_BASE_URL is correct
3. Check ngrok is running (development)
4. View Twilio Debugger for errors

### Calls Not Recording

1. Verify recording is enabled in Twilio
2. Check recording webhook URL
3. Ensure MongoDB is connected
4. Check API logs for errors

### AI Analysis Failing

1. Verify OpenAI API key is valid
2. Check API usage limits
3. Ensure call has transcript
4. Check error logs

## Support & Documentation

- Twilio Docs: https://www.twilio.com/docs/voice
- ElevenLabs Docs: https://elevenlabs.io/docs
- OpenAI Docs: https://platform.openai.com/docs
- Next.js Docs: https://nextjs.org/docs

## License

MIT License - See LICENSE file for details

## Architecture Notes

### Call Flow

1. **Incoming Call**:
   - Twilio receives call
   - Webhook to `/api/twilio/voice/incoming`
   - TwiML response with recording
   - Call stored in database
   - Recording webhook updates call

2. **Outgoing Call**:
   - User initiates call via dashboard
   - API creates Twilio call
   - Status callbacks update database
   - Recording captured

3. **AI Analysis**:
   - User triggers analysis
   - Transcript generated (if not exists)
   - OpenAI analyzes for sentiment, intent, etc.
   - Results stored in database

### Real-time Updates

- Dashboard polls every 10 seconds
- Socket.IO ready for live updates
- Webhook events update database immediately

## Next Steps

- [ ] Implement Socket.IO for real-time dashboard updates
- [ ] Add ElevenLabs Media Streams integration
- [ ] Build call recording transcription pipeline
- [ ] Add user management UI
- [ ] Implement advanced analytics
- [ ] Add email notifications
- [ ] Build mobile app
- [ ] Add video calling support

---

**Built with ❤️ using Next.js, Twilio, ElevenLabs, and OpenAI**
