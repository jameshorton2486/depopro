
import { useState } from "react";
import { toast } from "sonner";
import { DeepgramOptions } from "@/types/deepgram";
import { supabase } from "@/lib/supabase";

export const useDeepgramAPI = () => {
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);

  const getApiKey = async () => {
    const { data: secretData, error: secretError } = await supabase.functions.invoke('test-deepgram-key');
    
    if (secretError) {
      console.error('Error fetching API key:', secretError);
      toast.error('Failed to fetch API key');
      return null;
    }

    return secretData?.key;
  };

  const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
    try {
      if (!chunk || chunk.size === 0) {
        throw new Error('Invalid audio chunk');
      }

      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Could not retrieve Deepgram API key');
      }

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
        console.error('Deepgram API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
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
        storedFileName: null
      };
    } catch (error) {
      console.error("Error processing audio:", error);
      toast.error(`Failed to process audio: ${error.message}`);
      throw error;
    }
  };

  // These are kept for compatibility but won't be used
  const handleApiKeySubmit = async () => {};

  return {
    processAudioChunk,
    showApiKeyForm: false, // Always false since we don't need the form anymore
    setShowApiKeyForm,
    handleApiKeySubmit
  };
};
