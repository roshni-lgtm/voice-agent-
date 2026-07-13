import OpenAI from 'openai';

let openaiClient = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not configured');
    return null;
  }
  
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return openaiClient;
}

export async function transcribeAudio(audioBuffer) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.audio.transcriptions.create({
    file: audioBuffer,
    model: 'whisper-1'
  });

  return response.text;
}

export async function analyzeSentiment(text) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a sentiment analysis expert. Analyze the sentiment of the conversation and return a JSON object with overall_sentiment, customer_sentiment, and agent_sentiment. Values should be: very_negative, negative, neutral, positive, or very_positive.'
      },
      {
        role: 'user',
        content: `Analyze the sentiment of this call transcript:\n\n${text}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateSummary(text) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a conversation summarization expert. Create a concise, clear summary of the call. Return a JSON object with: summary (string), key_points (array of strings), action_items (array of strings), and next_steps (array of strings).'
      },
      {
        role: 'user',
        content: `Summarize this call transcript:\n\n${text}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function detectIntent(text) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an intent detection expert. Detect the primary and secondary intents from the conversation. Return a JSON object with: primary_intent (string), secondary_intents (array of strings), confidence (number 0-1), and intent_description (string).'
      },
      {
        role: 'user',
        content: `Detect the intent of this call:\n\n${text}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function qualifyLead(text) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a lead qualification expert. Analyze the conversation and qualify the lead. Return a JSON object with: qualified (boolean), score (0-100), stage (new/contacted/qualified/proposal/negotiation/won/lost), budget_discussed (boolean), timeline_discussed (boolean), decision_maker_present (boolean), pain_points (array), and qualification_notes (string).'
      },
      {
        role: 'user',
        content: `Qualify this lead based on the call:\n\n${text}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function generateCRMNotes(text, sentiment, summary, intent) {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error('OpenAI not configured');
  }

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a CRM notes expert. Generate professional, actionable CRM notes based on the call transcript and analysis. Include key discussion points, next steps, and important details.'
      },
      {
        role: 'user',
        content: `Generate CRM notes for this call:\n\nTranscript: ${text}\n\nSentiment: ${JSON.stringify(sentiment)}\nSummary: ${JSON.stringify(summary)}\nIntent: ${JSON.stringify(intent)}`
      }
    ]
  });

  return response.choices[0].message.content;
}
