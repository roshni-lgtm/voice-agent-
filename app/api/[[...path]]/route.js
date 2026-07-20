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

// Helper function to create error response
function createErrorResponse(message, status = 500, details = null) {
  const errorResponse = {
    error: message,
    status,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    errorResponse.details = details;
  }
  
  return handleCORS(NextResponse.json(errorResponse, { status }));
}

// Helper function to create success response
function createSuccessResponse(data, status = 200) {
  return handleCORS(NextResponse.json(data, { status }));
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  try {
    return handleCORS(new NextResponse(null, { status: 200 }));
  } catch (error) {
    console.error('OPTIONS error:', error);
    return createErrorResponse('CORS preflight failed', 500);
  }
}

// Route handler function
async function handleRoute(request, { params }) {
  let db;
  
  try {
    const { path = [] } = await params;
    const route = `/${path.join('/')}`;
    const method = request.method;

    // Get database connection
    try {
      db = await getDB();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return createErrorResponse('Database connection failed', 503, {
        message: 'Unable to connect to database. Please try again later.'
      });
    }

    // ============================================
    // AUTHENTICATION ROUTES
    // ============================================

    // Register - POST /api/auth/register
    if (route === '/auth/register' && method === 'POST') {
      try {
        const body = await request.json();
        const { email, password, name, role = 'user' } = body;

        if (!email || !password || !name) {
          return createErrorResponse('Email, password, and name required', 400);
        }

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
          return createErrorResponse('User already exists', 400);
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

        return createSuccessResponse({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          accessToken,
          refreshToken
        });
      } catch (error) {
        console.error('Register error:', error);
        return createErrorResponse('Registration failed', 500, { message: error.message });
      }
    }

    // Login - POST /api/auth/login
    if (route === '/auth/login' && method === 'POST') {
      try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
          return createErrorResponse('Email and password required', 400);
        }

        const user = await db.collection('users').findOne({ email });
        if (!user) {
          return createErrorResponse('Invalid credentials', 401);
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          return createErrorResponse('Invalid credentials', 401);
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        return createSuccessResponse({
          user: { id: user.id, email: user.email, name: user.name, role: user.role },
          accessToken,
          refreshToken
        });
      } catch (error) {
        console.error('Login error:', error);
        return createErrorResponse('Login failed', 500, { message: error.message });
      }
    }

    // Get current user - GET /api/auth/me
    if (route === '/auth/me' && method === 'GET') {
      try {
        const userData = await getUserFromToken(request);
        if (!userData) {
          return createErrorResponse('Unauthorized', 401);
        }

        const user = await db.collection('users').findOne({ id: userData.userId });
        if (!user) {
          return createErrorResponse('User not found', 404);
        }

        return createSuccessResponse({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        });
      } catch (error) {
        console.error('Get user error:', error);
        return createErrorResponse('Failed to get user', 500, { message: error.message });
      }
    }

    // ============================================
    // TWILIO VOICE ROUTES
    // ============================================

    // Incoming call webhook - POST /api/twilio/voice/incoming
    if (route === '/twilio/voice/incoming' && method === 'POST') {
      try {
        const formData = await request.formData();
        const params = Object.fromEntries(formData);
        
        const callSid = params.CallSid;
        const from = params.From;
        const to = params.To;
        const callStatus = params.CallStatus;

        const call = {
          id: uuidv4(),
          callSid,
          from,
          to,
          direction: 'inbound',
          status: callStatus,
          isAI: true,
          startedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.collection('calls').insertOne(call);

        // ElevenLabs handles the AI conversation natively through Twilio
        // Just return simple TwiML to acknowledge the call
        const response = createTwiMLResponse();
        response.say({ 
          voice: 'Polly.Joanna' 
        }, 'Thank you for calling. Please hold while we connect you.');
        
        // Record the call for later transcription and analysis
        response.record({
          action: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-complete`,
          recordingStatusCallback: `${process.env.NEXT_PUBLIC_BASE_URL}/api/twilio/voice/recording-status`,
          recordingStatusCallbackEvent: ['completed'],
          maxLength: 300,
          transcribe: true
        });

        return new NextResponse(response.toString(), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        });
      } catch (error) {
        console.error('Incoming call webhook error:', error);
        const response = createTwiMLResponse();
        response.say({ voice: 'alice' }, 'We are experiencing technical difficulties. Please try again later.');
        response.hangup();
        return new NextResponse(response.toString(), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        });
      }
    }

    // Outgoing call - POST /api/twilio/voice/outgoing
    if (route === '/twilio/voice/outgoing' && method === 'POST') {
      try {
        const body = await request.json();
        const { to } = body;

        if (!to) {
          return createErrorResponse('Phone number required', 400);
        }

        // Validate E.164 format
        if (!to.startsWith('+')) {
          return createErrorResponse('Phone number must be in E.164 format (e.g., +14155552671)', 400);
        }

        // Check ElevenLabs configuration
        if (!process.env.ELEVENLABS_API_KEY) {
          return createErrorResponse('ElevenLabs not configured', 500, {
            message: 'ELEVENLABS_API_KEY is missing. Please configure it in environment variables.'
          });
        }

        if (!process.env.ELEVENLABS_AGENT_ID) {
          return createErrorResponse('ElevenLabs agent not configured', 500, {
            message: 'ELEVENLABS_AGENT_ID is missing. Please configure it in environment variables.'
          });
        }

        if (!process.env.ELEVENLABS_PHONE_NUMBER_ID) {
          return createErrorResponse('ElevenLabs phone number not configured', 500, {
            message: 'ELEVENLABS_PHONE_NUMBER_ID is missing. Please configure it in environment variables.'
          });
        }

        try {
          // Use ElevenLabs native outbound call API
          const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'xi-api-key': process.env.ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
              agent_id: process.env.ELEVENLABS_AGENT_ID,
              agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
              to_number: to,
              telephony_call_config: {
                ringing_timeout_secs: 45
              }
            })
          });

          const elevenLabsData = await elevenLabsResponse.json();

          // Create call record in database
          const callRecord = {
            id: uuidv4(),
            callSid: elevenLabsData.callSid || null,
            conversationId: elevenLabsData.conversation_id || null,
            from: process.env.TWILIO_PHONE_NUMBER,
            to,
            direction: 'outbound',
            status: elevenLabsData.success ? 'initiated' : 'failed',
            isAI: true,
            startedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            elevenLabsResponse: elevenLabsData
          };

          await db.collection('calls').insertOne(callRecord);

          if (!elevenLabsResponse.ok) {
            return createErrorResponse('ElevenLabs API call failed', elevenLabsResponse.status, {
              message: elevenLabsData.message || 'Failed to place call',
              details: elevenLabsData
            });
          }

          return createSuccessResponse({
            success: elevenLabsData.success,
            message: elevenLabsData.message,
            callSid: elevenLabsData.callSid,
            conversationId: elevenLabsData.conversation_id,
            callId: callRecord.id
          });
        } catch (apiError) {
          console.error('ElevenLabs API error:', apiError);
          return createErrorResponse('Failed to place call', 500, {
            message: apiError.message || 'ElevenLabs API call failed'
          });
        }
      } catch (error) {
        console.error('Outgoing call error:', error);
        return createErrorResponse('Failed to process outgoing call', 500, { message: error.message });
      }
    }

    // Status callback - POST /api/twilio/voice/status-callback
    if (route === '/twilio/voice/status-callback' && method === 'POST') {
      try {
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

        await db.collection('call_events').insertOne({
          id: uuidv4(),
          callSid,
          event: 'status_callback',
          status: callStatus,
          data: params,
          createdAt: new Date()
        });

        return new NextResponse('OK', { status: 200 });
      } catch (error) {
        console.error('Status callback error:', error);
        return new NextResponse('OK', { status: 200 }); // Still return 200 to Twilio
      }
    }

    // Recording complete - POST /api/twilio/voice/recording-complete
    if (route === '/twilio/voice/recording-complete' && method === 'POST') {
      try {
        const formData = await request.formData();
        const params = Object.fromEntries(formData);

        const response = createTwiMLResponse();
        response.say({ voice: 'alice' }, 'Thank you for your message. Goodbye.');
        response.hangup();

        return new NextResponse(response.toString(), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        });
      } catch (error) {
        console.error('Recording complete error:', error);
        const response = createTwiMLResponse();
        response.hangup();
        return new NextResponse(response.toString(), {
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        });
      }
    }

    // Recording status - POST /api/twilio/voice/recording-status
    if (route === '/twilio/voice/recording-status' && method === 'POST') {
      try {
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
      } catch (error) {
        console.error('Recording status error:', error);
        return new NextResponse('OK', { status: 200 }); // Still return 200 to Twilio
      }
    }

    // ============================================
    // CALL MANAGEMENT ROUTES
    // ============================================

    // Get all calls - GET /api/calls
    if (route === '/calls' && method === 'GET') {
      try {
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

        return createSuccessResponse({ calls, total, limit, skip });
      } catch (error) {
        console.error('Get calls error:', error);
        return createErrorResponse('Failed to fetch calls', 500, { message: error.message });
      }
    }

    // Get call by ID - GET /api/calls/:id
    if (route.startsWith('/calls/') && method === 'GET' && !route.includes('/analyze')) {
      try {
        const id = path[1];
        const call = await db.collection('calls').findOne({ id });

        if (!call) {
          return createErrorResponse('Call not found', 404);
        }

        let recording = null;
        if (call.recordingSid) {
          recording = await db.collection('recordings').findOne({ recordingSid: call.recordingSid });
        }

        let transcript = null;
        if (call.transcriptId) {
          transcript = await db.collection('transcripts').findOne({ id: call.transcriptId });
        }

        let analysis = null;
        if (call.analysisId) {
          analysis = await db.collection('call_analyses').findOne({ id: call.analysisId });
        }

        return createSuccessResponse({ call, recording, transcript, analysis });
      } catch (error) {
        console.error('Get call by ID error:', error);
        return createErrorResponse('Failed to fetch call details', 500, { message: error.message });
      }
    }

    // Analyze call - POST /api/calls/:id/analyze
    if (route.match(/^\/calls\/[^\/]+\/analyze$/) && method === 'POST') {
      try {
        const id = path[1];
        const call = await db.collection('calls').findOne({ id });

        if (!call) {
          return createErrorResponse('Call not found', 404);
        }

        let transcript = null;
        if (call.transcriptId) {
          transcript = await db.collection('transcripts').findOne({ id: call.transcriptId });
        } else {
          const transcriptText = 'Sample transcript text. In production, this would be generated from the recording using OpenAI Whisper.';
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

          return createSuccessResponse({ analysis });
        } catch (aiError) {
          console.error('AI analysis error:', aiError);
          return createErrorResponse('AI analysis failed', 500, {
            message: 'OpenAI API call failed. Please check your API key and credits.',
            details: aiError.message
          });
        }
      } catch (error) {
        console.error('Analyze call error:', error);
        return createErrorResponse('Failed to analyze call', 500, { message: error.message });
      }
    }

    // ============================================
    // DASHBOARD & ANALYTICS ROUTES
    // ============================================

    // Get dashboard summary - GET /api/dashboard/summary
    if (route === '/dashboard/summary' && method === 'GET') {
      try {
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

        return createSuccessResponse({
          totalCalls,
          inboundCalls,
          outboundCalls,
          answeredCalls,
          missedCalls,
          aiCalls,
          humanCalls: totalCalls - aiCalls,
          averageDuration: avgDuration[0]?.avgDuration || 0,
          activeCalls
        });
      } catch (error) {
        console.error('Dashboard summary error:', error);
        return createErrorResponse('Failed to fetch dashboard summary', 500, { message: error.message });
      }
    }

    // Get call analytics - GET /api/dashboard/analytics
    if (route === '/dashboard/analytics' && method === 'GET') {
      try {
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

        return createSuccessResponse({ analytics, period });
      } catch (error) {
        console.error('Analytics error:', error);
        return createErrorResponse('Failed to fetch analytics', 500, { message: error.message });
      }
    }

    // ============================================
    // SETTINGS ROUTES
    // ============================================

    // Get settings - GET /api/settings
    if (route === '/settings' && method === 'GET') {
      try {
        const settings = await db.collection('settings').findOne({ type: 'global' }) || {};
        
        delete settings.twilioAuthToken;
        delete settings.elevenLabsApiKey;
        delete settings.openaiApiKey;

        return createSuccessResponse({ settings });
      } catch (error) {
        console.error('Get settings error:', error);
        return createErrorResponse('Failed to fetch settings', 500, { message: error.message });
      }
    }

    // Update settings - PUT /api/settings
    if (route === '/settings' && method === 'PUT') {
      try {
        const body = await request.json();
        
        await db.collection('settings').updateOne(
          { type: 'global' },
          { $set: { ...body, updatedAt: new Date() } },
          { upsert: true }
        );

        return createSuccessResponse({ success: true });
      } catch (error) {
        console.error('Update settings error:', error);
        return createErrorResponse('Failed to update settings', 500, { message: error.message });
      }
    }

    // ============================================
    // HEALTH CHECK
    // ============================================

    if ((route === '/' || route === '/root') && method === 'GET') {
      try {
        return createSuccessResponse({ 
          message: 'AI Calling Platform API',
          version: '1.0.0',
          status: 'healthy',
          database: 'connected'
        });
      } catch (error) {
        console.error('Health check error:', error);
        return createErrorResponse('Health check failed', 500);
      }
    }

    // Route not found
    return createErrorResponse(`Route ${route} not found`, 404);

  } catch (error) {
    console.error('Unhandled API Error:', error);
    return createErrorResponse('Internal server error', 500, {
      message: error.message,
      route: error.route || 'unknown'
    });
  }
}

// Export all HTTP methods with error handling
export const GET = async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    console.error('GET handler error:', error);
    return createErrorResponse('Request failed', 500, { message: error.message });
  }
};

export const POST = async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    console.error('POST handler error:', error);
    return createErrorResponse('Request failed', 500, { message: error.message });
  }
};

export const PUT = async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    console.error('PUT handler error:', error);
    return createErrorResponse('Request failed', 500, { message: error.message });
  }
};

export const DELETE = async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    console.error('DELETE handler error:', error);
    return createErrorResponse('Request failed', 500, { message: error.message });
  }
};

export const PATCH = async (request, context) => {
  try {
    return await handleRoute(request, context);
  } catch (error) {
    console.error('PATCH handler error:', error);
    return createErrorResponse('Request failed', 500, { message: error.message });
  }
};
