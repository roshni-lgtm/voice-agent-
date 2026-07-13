const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;

export function getElevenLabsConfig() {
  return {
    apiKey: ELEVENLABS_API_KEY,
    agentId: ELEVENLABS_AGENT_ID,
    baseUrl: 'https://api.elevenlabs.io/v1'
  };
}

export async function generateSpeech(text, voiceId = 'EXAVITQu4vr4xnSDxMaL') {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate speech');
  }

  return response.arrayBuffer();
}
