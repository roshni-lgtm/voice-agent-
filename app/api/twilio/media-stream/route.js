import { Server } from 'socket.io';
import { getDB } from '@/lib/mongodb';

let io;

/**
 * WebSocket handler for Twilio Media Streams
 * This connects Twilio calls to ElevenLabs AI agent
 */
export default async function handler(req, res) {
  // Initialize Socket.IO if not already done
  if (!io) {
    io = new Server(res.socket.server, {
      path: '/api/twilio/media-stream',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    res.socket.server.io = io;

    // Handle WebSocket connections
    io.on('connection', (socket) => {
      console.log('Twilio Media Stream connected:', socket.id);

      let callSid = null;
      let streamSid = null;
      let elevenLabsWs = null;

      // Handle Twilio stream events
      socket.on('start', async (data) => {
        console.log('Media stream started:', data);
        callSid = data.callSid;
        streamSid = data.streamSid;

        try {
          const db = await getDB();
          await db.collection('calls').updateOne(
            { callSid },
            { 
              $set: { 
                streamSid,
                streamStatus: 'connected',
                streamStartedAt: new Date(),
                updatedAt: new Date()
              } 
            }
          );

          // TODO: Connect to ElevenLabs WebSocket here
          // For now, we'll log that the stream is ready
          console.log(`Stream ready for call ${callSid}`);
          
          // If ElevenLabs is configured, connect to it
          if (process.env.ELEVENLABS_API_KEY) {
            // Initialize ElevenLabs connection
            console.log('Connecting to ElevenLabs AI agent...');
            // Implementation would go here
          }
        } catch (error) {
          console.error('Error handling stream start:', error);
        }
      });

      socket.on('media', async (data) => {
        // Forward audio from Twilio to ElevenLabs
        if (elevenLabsWs && elevenLabsWs.readyState === 1) {
          elevenLabsWs.send(JSON.stringify({
            type: 'input_audio',
            audio: data.media.payload
          }));
        }
      });

      socket.on('stop', async (data) => {
        console.log('Media stream stopped:', data);
        
        try {
          const db = await getDB();
          await db.collection('calls').updateOne(
            { callSid },
            { 
              $set: { 
                streamStatus: 'disconnected',
                streamEndedAt: new Date(),
                updatedAt: new Date()
              } 
            }
          );

          // Close ElevenLabs connection
          if (elevenLabsWs) {
            elevenLabsWs.close();
          }
        } catch (error) {
          console.error('Error handling stream stop:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log('Media stream disconnected:', socket.id);
        if (elevenLabsWs) {
          elevenLabsWs.close();
        }
      });
    });
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};
