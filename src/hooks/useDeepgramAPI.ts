
import { toast } from "sonner";
import { DeepgramOptions } from "@/types/deepgram";

const getStoredApiKey = () => localStorage.getItem('deepgram_api_key');
const setStoredApiKey = (key: string) => localStorage.setItem('deepgram_api_key', key);

const validateApiKey = async (): Promise<string> => {
  let apiKey = getStoredApiKey();
  
  while (!apiKey) {
    const userKey = prompt('Please enter your Deepgram API key:');
    if (!userKey) {
      throw new Error('Deepgram API key is required');
    }
    
    // Test the API key with a simple request
    try {
      const response = await fetch('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${userKey}`,
        }
      });
      
      if (response.ok) {
        setStoredApiKey(userKey);
        apiKey = userKey;
        toast.success('API key validated successfully');
      } else {
        toast.error('Invalid API key. Please try again.');
        localStorage.removeItem('deepgram_api_key');
      }
    } catch (error) {
      console.error('Error validating API key:', error);
      toast.error('Failed to validate API key. Please try again.');
      localStorage.removeItem('deepgram_api_key');
    }
  }
  
  return apiKey;
};

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    if (!chunk || chunk.size === 0) {
      throw new Error('Invalid audio chunk');
    }

    // Validate API key before proceeding
    const apiKey = await validateApiKey();

    console.debug('Sending audio chunk to Deepgram:', {
      size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
      type: chunk.type,
      options: JSON.stringify(options, null, 2)
    });

    const arrayBuffer = await chunk.arrayBuffer();

    // Prepare Deepgram options
    const deepgramOptions = new URLSearchParams({
      model: options.model || "nova-3",
      language: options.language || "en-US",
      smart_format: String(options.smart_format ?? true),
      punctuate: String(options.punctuate ?? true),
      diarize: String(options.diarize ?? true),
      filler_words: String(options.filler_words ?? true),
      detect_language: String(options.detect_language ?? true)
    });

    if (options.diarize) {
      deepgramOptions.append('diarize_version', '3');
    }

    console.debug('Using Deepgram options:', Object.fromEntries(deepgramOptions));

    const response = await fetch(`https://api.deepgram.com/v1/listen?${deepgramOptions}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': chunk.type
      },
      body: arrayBuffer
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram API error:', errorText);
      
      // If unauthorized, clear the stored API key
      if (response.status === 401) {
        localStorage.removeItem('deepgram_api_key');
      }
      
      throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.results?.channels?.[0]?.alternatives?.[0]) {
      throw new Error('Invalid response structure from Deepgram API');
    }

    const result = data.results.channels[0].alternatives[0];
    console.debug('Received response:', {
      transcriptLength: result.transcript.length,
      confidence: result.confidence,
      metadata: data.metadata
    });

    return {
      transcript: result.transcript,
      metadata: data.metadata,
      storedFileName: null // This was previously used for Supabase storage
    };
  } catch (error) {
    console.error("Error processing audio:", error);
    toast.error(`Failed to process audio: ${error.message}`);
    throw error;
  }
};
