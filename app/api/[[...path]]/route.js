import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/mongodb';
import { getTwilioClient, getTwilioPhoneNumber, validateTwilioSignature, createTwiMLResponse } from '@/lib/twilio';
import { getOpenAIClient, analyzeSentiment, generateSummary, detectIntent, qualifyLead, generateCRMNotes } from '@/lib/openai-client';
import { generateAccessToken, generateRefreshToken, hashPassword, verifyPassword, getUserFromToken } from '@/lib/auth';

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }));
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = await params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    const db = await getDB();

    // ============================================
    // AUTHENTICATION ROUTES
    // ============================================

    // Register - POST /api/auth/register
    if (route === '/auth/register' && method === 'POST') {
      const body = await request.json();
      const { email, password, name, role = 'user' } = body;

      if (!email || !password || !name) {
        return handleCORS(NextResponse.json({ error: 'Email, password, and name required' }, { status: 400 }));
      }

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return handleCORS(NextResponse.json({ error: 'User already exists' }, { status: 400 }));
      }

      const hashedPassword = await hashPassword(password);
      const user = {
        id: uuidv4(),
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').insertOne(user);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return handleCORS(NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken
      }));
    }

    // Login - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json();
      const { email, password } = body;

      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }));
      }

      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }));
      }

      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }));
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      return handleCORS(NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
        refreshToken
      }));
    }

    // Get current user - GET /api/auth/me
    if (route === '/auth/me' && method === 'GET') {
      const userData = await getUserFromToken(request);
      if (!userData) {
        return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
      }

      const user = await db.collection('users').findOne({ id: userData.userId });
      if (!user) {
        return handleCORS(NextResponse.json({ error: 'User not found' }, { status: 404 }));
      }

      return handleCORS(NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }));
    }

    // ============================================
    // TWILIO VOICE ROUTES
    // ============================================

    // Incoming call webhook - POST /api/twilio/voice/incoming
    if (route === '/twilio/voice/incoming' && method === 'POST') {
      const formData = await request.formData();
      const params = Object.fromEntries(formData);
      
      const callSid = params.CallSid;
      const from = params.From;
      const to = params.To;
      const callStatus = params.CallStatus;

      // Store call in database
      const call = {
        id: uuidv4(),
        callSid,
        from,
        to,
        direction: 'inbound',
        status: callStatus,
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('calls').insertOne(call);

      // Create TwiML response
      const response = createTwiMLResponse();
      response.say({ voice: 'alice' }, 'Thank you for calling. This is an AI-powered assistant. How may I help you today?');
      
      // Start recording
      response.record({
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-complete`,
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-status`,
        recordingStatusCallbackEvent: ['completed'],
        maxLength: 300,
        playBeep: true
      });

      return new NextResponse(response.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Outgoing call - POST /api/twilio/voice/outgoing
    if (route === '/twilio/voice/outgoing' && method === 'POST') {
      const body = await request.json();
      const { to, message = 'Hello, this is an AI-powered call.' } = body;

      if (!to) {
        return handleCORS(NextResponse.json({ error: 'Phone number required' }, { status: 400 }));
      }

      const twilioClient = getTwilioClient();
      if (!twilioClient) {
        return handleCORS(NextResponse.json({ error: 'Twilio not configured' }, { status: 500 }));
      }

      const from = getTwilioPhoneNumber();
      
      try {
        const call = await twilioClient.calls.create({
          from,
          to,
          url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/outgoing-answer`,
          statusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/status-callback`,
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
          record: true
        });

        // Store call in database
        const callRecord = {
          id: uuidv4(),
          callSid: call.sid,
          from,
          to,
          direction: 'outbound',
          status: call.status,
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('calls').insertOne(callRecord);

        return handleCORS(NextResponse.json({
          callSid: call.sid,
          status: call.status,
          callId: callRecord.id
        }));
      } catch (error) {
        console.error('Twilio call error:', error);
        return handleCORS(NextResponse.json({ error: 'Failed to initiate call' }, { status: 500 }));
      }
    }

    // Outgoing call answer - POST /api/twilio/voice/outgoing-answer
    if (route === '/twilio/voice/outgoing-answer' && method === 'POST') {
      const formData = await request.formData();
      const params = Object.fromEntries(formData);
      const callSid = params.CallSid;

      // Update call status
      await db.collection('calls').updateOne(
        { callSid },
        { $set: { status: params.CallStatus, updatedAt: new Date() } }
      );

      const response = createTwiMLResponse();
      response.say({ voice: 'alice' }, 'Hello, this is an AI-powered assistant calling. I hope I am reaching you at a good time.');
      response.pause({ length: 2 });
      response.say({ voice: 'alice' }, 'Please leave your message after the beep.');
      
      response.record({
        action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-complete`,
        recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-status`,
        maxLength: 300,
        playBeep: true
      });

      return new NextResponse(response.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Status callback - POST /api/twilio/voice/status-callback
    if (route === '/twilio/voice/status-callback' && method === 'POST') {
      const formData = await request.formData();
      const params = Object.fromEntries(formData);
      
      const callSid = params.CallSid;
      const callStatus = params.CallStatus;
      const duration = params.CallDuration;

      await db.collection('calls').updateOne(
        { callSid },
        {
          $set: {
            status: callStatus,
            duration: parseInt(duration) || 0,
            updatedAt: new Date(),
            ...(callStatus === 'completed' && { endedAt: new Date() })
          }
        }
      );

      // Store webhook event
      await db.collection('call_events').insertOne({
        id: uuidv4(),
        callSid,
        event: 'status_callback',
        status: callStatus,
        data: params,
        createdAt: new Date()
      });

      return new NextResponse('OK', { status: 200 });
    }

    // Recording complete - POST /api/twilio/voice/recording-complete
    if (route === '/twilio/voice/recording-complete' && method === 'POST') {
      const formData = await request.formData();
      const params = Object.fromEntries(formData);

      const response = createTwiMLResponse();
      response.say({ voice: 'alice' }, 'Thank you for your message. Goodbye.');
      response.hangup();

      return new NextResponse(response.toString(), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      });
    }

    // Recording status - POST /api/twilio/voice/recording-status
    if (route === '/twilio/voice/recording-status' && method === 'POST') {
      const formData = await request.formData();
      const params = Object.fromEntries(formData);
      
      const recordingSid = params.RecordingSid;
      const callSid = params.CallSid;
      const recordingUrl = params.RecordingUrl;
      const recordingDuration = params.RecordingDuration;

      const recording = {
        id: uuidv4(),
        recordingSid,
        callSid,
        url: recordingUrl,
        duration: parseInt(recordingDuration) || 0,
        status: params.RecordingStatus,
        createdAt: new Date()
      };

      await db.collection('recordings').insertOne(recording);

      // Update call with recording info
      await db.collection('calls').updateOne(
        { callSid },
        {
          $set: {
            recordingSid,
            recordingUrl,
            recordingDuration: parseInt(recordingDuration) || 0,
            hasRecording: true,
            updatedAt: new Date()
          }
        }
      );

      return new NextResponse('OK', { status: 200 });
    }

    // ============================================
    // CALL MANAGEMENT ROUTES
    // ============================================

    // Get all calls - GET /api/calls
    if (route === '/calls' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const limit = parseInt(searchParams.get('limit')) || 50;
      const skip = parseInt(searchParams.get('skip')) || 0;
      const direction = searchParams.get('direction');
      const status = searchParams.get('status');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const query = {};
      if (direction) query.direction = direction;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const calls = await db.collection('calls')
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      const total = await db.collection('calls').countDocuments(query);

      return handleCORS(NextResponse.json({ calls, total, limit, skip }));
    }

    // Get call by ID - GET /api/calls/:id
    if (route.startsWith('/calls/') && method === 'GET') {
      const id = path[1];
      const call = await db.collection('calls').findOne({ id });

      if (!call) {
        return handleCORS(NextResponse.json({ error: 'Call not found' }, { status: 404 }));
      }

      // Get recording if exists
      let recording = null;
      if (call.recordingSid) {
        recording = await db.collection('recordings').findOne({ recordingSid: call.recordingSid });
      }

      // Get transcript if exists
      let transcript = null;
      if (call.transcriptId) {
        transcript = await db.collection('transcripts').findOne({ id: call.transcriptId });
      }

      // Get analysis if exists
      let analysis = null;
      if (call.analysisId) {
        analysis = await db.collection('call_analyses').findOne({ id: call.analysisId });
      }

      return handleCORS(NextResponse.json({ call, recording, transcript, analysis }));
    }

    // Analyze call - POST /api/calls/:id/analyze
    if (route.match(/^\/calls\/[^\/]+\/analyze$/) && method === 'POST') {
      const id = path[1];
      const call = await db.collection('calls').findOne({ id });

      if (!call) {
        return handleCORS(NextResponse.json({ error: 'Call not found' }, { status: 404 }));
      }

      // Get or create transcript
      let transcript = null;
      if (call.transcriptId) {
        transcript = await db.collection('transcripts').findOne({ id: call.transcriptId });
      } else {
        // For now, use a placeholder. In production, you'd transcribe the recording
        const transcriptText = 'Sample transcript text. Replace with actual transcription.';
        transcript = {
          id: uuidv4(),
          callId: call.id,
          callSid: call.callSid,
          text: transcriptText,
          language: 'en',
          createdAt: new Date()
        };
        await db.collection('transcripts').insertOne(transcript);
        await db.collection('calls').updateOne({ id }, { $set: { transcriptId: transcript.id } });
      }

      // Perform AI analysis
      try {
        const [sentiment, summary, intent, leadQualification] = await Promise.all([
          analyzeSentiment(transcript.text),
          generateSummary(transcript.text),
          detectIntent(transcript.text),
          qualifyLead(transcript.text)
        ]);

        const crmNotes = await generateCRMNotes(transcript.text, sentiment, summary, intent);

        const analysis = {
          id: uuidv4(),
          callId: call.id,
          callSid: call.callSid,
          sentiment,
          summary,
          intent,
          leadQualification,
          crmNotes,
          createdAt: new Date()
        };

        await db.collection('call_analyses').insertOne(analysis);
        await db.collection('calls').updateOne({ id }, { $set: { analysisId: analysis.id, analyzed: true } });

        return handleCORS(NextResponse.json({ analysis }));
      } catch (error) {
        console.error('Analysis error:', error);
        return handleCORS(NextResponse.json({ error: 'Analysis failed', message: error.message }, { status: 500 }));
      }
    }

    // ============================================
    // DASHBOARD & ANALYTICS ROUTES
    // ============================================

    // Get dashboard summary - GET /api/dashboard/summary
    if (route === '/dashboard/summary' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const dateQuery = {};
      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      const [
        totalCalls,
        inboundCalls,
        outboundCalls,
        answeredCalls,
        missedCalls,
        aiCalls,
        avgDuration,
        activeCalls
      ] = await Promise.all([
        db.collection('calls').countDocuments(dateQuery),
        db.collection('calls').countDocuments({ ...dateQuery, direction: 'inbound' }),
        db.collection('calls').countDocuments({ ...dateQuery, direction: 'outbound' }),
        db.collection('calls').countDocuments({ ...dateQuery, status: { $in: ['completed', 'answered'] } }),
        db.collection('calls').countDocuments({ ...dateQuery, status: { $in: ['no-answer', 'busy', 'failed'] } }),
        db.collection('calls').countDocuments({ ...dateQuery, isAI: true }),
        db.collection('calls').aggregate([
          { $match: { ...dateQuery, duration: { $exists: true, $gt: 0 } } },
          { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
        ]).toArray(),
        db.collection('calls').countDocuments({ status: { $in: ['in-progress', 'ringing'] } })
      ]);

      return handleCORS(NextResponse.json({
        totalCalls,
        inboundCalls,
        outboundCalls,
        answeredCalls,
        missedCalls,
        aiCalls,
        humanCalls: totalCalls - aiCalls,
        averageDuration: avgDuration[0]?.avgDuration || 0,
        activeCalls
      }));
    }

    // Get call analytics - GET /api/dashboard/analytics
    if (route === '/dashboard/analytics' && method === 'GET') {
      const { searchParams } = new URL(request.url);
      const period = searchParams.get('period') || 'daily';
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const dateQuery = {};
      if (startDate || endDate) {
        dateQuery.createdAt = {};
        if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
        if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
      }

      let groupBy;
      switch (period) {
        case 'hourly':
          groupBy = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } };
          break;
        case 'daily':
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
          break;
        case 'weekly':
          groupBy = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
          break;
        case 'monthly':
          groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
          break;
        default:
          groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      }

      const analytics = await db.collection('calls').aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: groupBy,
            total: { $sum: 1 },
            inbound: { $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] } },
            outbound: { $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $in: ['$status', ['completed', 'answered']] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $in: ['$status', ['failed', 'busy', 'no-answer']] }, 1, 0] } },
            avgDuration: { $avg: '$duration' }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();

      return handleCORS(NextResponse.json({ analytics, period }));
    }

    // ============================================
    // SETTINGS ROUTES
    // ============================================

    // Get settings - GET /api/settings
    if (route === '/settings' && method === 'GET') {
      const settings = await db.collection('settings').findOne({ type: 'global' }) || {};
      
      // Remove sensitive data
      delete settings.twilioAuthToken;
      delete settings.elevenLabsApiKey;
      delete settings.openaiApiKey;

      return handleCORS(NextResponse.json({ settings }));
    }

    // Update settings - PUT /api/settings
    if (route === '/settings' && method === 'PUT') {
      const body = await request.json();
      
      await db.collection('settings').updateOne(
        { type: 'global' },
        { $set: { ...body, updatedAt: new Date() } },
        { upsert: true }
      );

      return handleCORS(NextResponse.json({ success: true }));
    }

    // ============================================
    // HEALTH CHECK
    // ============================================

    if ((route === '/' || route === '/root') && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: 'AI Calling Platform API',
        version: '1.0.0',
        status: 'healthy'
      }));
    }

    // Route not found
    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }));

  } catch (error) {
    console.error('API Error:', error);
    return handleCORS(NextResponse.json({ error: 'Internal server error', message: error.message }, { status: 500 }));
  }
}

// Export all HTTP methods
export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
