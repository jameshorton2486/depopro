
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY') || '';

// Validates the request body
function validateRequest(req: any) {
  if (!req) {
    throw new Error('Missing request body');
  }
  
  // Check for at least one audio source
  if (!req.audioData && !req.audioUrl) {
    throw new Error('Missing audio source: provide either audioData or audioUrl');
  }

  // Options validation
  if (!req.options) {
    req.options = {};
  }
}

// Utility to extract base64 data from data URLs
function extractBase64FromDataUrl(dataUrl: string): string {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid data URL format');
  }
  return matches[2];
}

// Handle audio transcription from a URL
async function transcribeFromUrl(url: string, options: Record<string, any>) {
  console.log(`Transcribing from URL: ${url}`);
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && typeof value !== 'object') {
      queryParams.append(key, String(value));
    }
  });
  
  // For YouTube URLs, we need to add a special parameter
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    console.log('YouTube URL detected, adding youtube parameter');
    queryParams.append('youtube', 'true');
  }
  
  // Construct the API URL with query parameters
  const apiUrl = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;
  
  // Make the request to Deepgram API
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Deepgram API error (URL):', error);
    throw new Error(`Deepgram API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Handle audio transcription from file data
async function transcribeFromData(base64Data: string, options: Record<string, any>) {
  console.log('Transcribing from file data');
  
  // Decode base64 data to binary
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null && typeof value !== 'object') {
      queryParams.append(key, String(value));
    }
  });
  
  // Construct the API URL with query parameters
  const apiUrl = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;
  
  // Make the request to Deepgram API
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${DEEPGRAM_API_KEY}`,
      'Content-Type': 'audio/mpeg',
    },
    body: binaryData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Deepgram API error (File):', error);
    throw new Error(`Deepgram API error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

serve(async (req) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    if (!DEEPGRAM_API_KEY) {
      throw new Error('DEEPGRAM_API_KEY is not set');
    }

    // Parse the request body
    const requestBody = await req.json();
    
    // Validate the request
    validateRequest(requestBody);
    
    // Transcribe based on the source type
    let result;
    if (requestBody.audioUrl) {
      // URL-based transcription
      result = await transcribeFromUrl(requestBody.audioUrl, requestBody.options);
    } else {
      // File-based transcription
      const base64Data = extractBase64FromDataUrl(requestBody.audioData);
      result = await transcribeFromData(base64Data, requestBody.options);
    }

    // Return transcription result
    return new Response(JSON.stringify(result), {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  }
});
