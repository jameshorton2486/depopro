
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";

const CHUNK_SIZE = 1 * 1024 * 1024; // 1MB chunks
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB max file size
const TIMEOUT = 30000; // 30 second timeout
const MAX_RETRIES = 3;

interface ProcessAudioResponse {
  transcript: string;
  metadata?: {
    duration?: number;
    channels?: number;
    model?: string;
    processed_at?: string;
  };
}

const validateAudioFile = (file: Blob) => {
  console.debug('🔍 Validating audio file:', {
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
    timestamp: new Date().toISOString()
  });

  const supportedTypes = [
    'audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/aac',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
  ];

  if (!supportedTypes.includes(file.type)) {
    console.error('❌ Unsupported file type:', {
      provided: file.type,
      supported: supportedTypes
    });
    throw new Error(`Unsupported file type: ${file.type}. Supported types: ${supportedTypes.join(', ')}`);
  }

  if (file.size > MAX_FILE_SIZE) {
    console.error('❌ File too large:', {
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      maxSize: `${(MAX_FILE_SIZE / (1024 * 1024))}MB`
    });
    throw new Error(`File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds limit of ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }

  if (file.size === 0) {
    console.error('❌ Empty file detected');
    throw new Error('File is empty');
  }

  console.debug('✅ File validation passed');
};

const sliceArrayBuffer = (buffer: ArrayBuffer, chunkSize: number): ArrayBuffer[] => {
  console.debug('📦 Slicing array buffer:', {
    totalSize: `${(buffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
    chunkSize: `${(chunkSize / (1024 * 1024)).toFixed(2)}MB`
  });

  const chunks: ArrayBuffer[] = [];
  let offset = 0;
  
  while (offset < buffer.byteLength) {
    const chunk = buffer.slice(offset, offset + chunkSize);
    chunks.push(chunk);
    offset += chunkSize;
  }
  
  console.debug(`✅ Buffer sliced into ${chunks.length} chunks`);
  return chunks;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processChunkWithRetry = async (
  chunkBuffer: ArrayBuffer,
  mimeType: string,
  options: DeepgramOptions,
  chunkIndex: number,
  totalChunks: number
): Promise<string> => {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRIES) {
    try {
      console.debug(`🎯 Processing chunk ${chunkIndex + 1}/${totalChunks}:`, {
        attempt: attempts + 1,
        maxRetries: MAX_RETRIES,
        chunkSize: `${(chunkBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`,
        mimeType,
        options
      });

      const audioData = Array.from(new Uint8Array(chunkBuffer));
      
      if (audioData.length === 0) {
        console.error('❌ Empty audio chunk detected');
        throw new Error('Empty audio chunk');
      }

      console.debug('📤 Sending request to process-audio function:', {
        dataLength: audioData.length,
        timestamp: new Date().toISOString()
      });

      const startTime = Date.now();
      const { data, error } = await Promise.race([
        supabase.functions.invoke<ProcessAudioResponse>('process-audio', {
          body: {
            audio: audioData,
            mime_type: mimeType,
            options: {
              ...options,
              diarize_version: options.diarize ? "3" : undefined
            }
          }
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), TIMEOUT)
        )
      ]);

      const processingTime = Date.now() - startTime;
      console.debug(`⏱️ Chunk ${chunkIndex + 1} processing time:`, {
        ms: processingTime,
        seconds: (processingTime / 1000).toFixed(2)
      });

      if (error) {
        console.error(`❌ Function error (attempt ${attempts + 1}):`, {
          error,
          statusCode: error.status,
          message: error.message,
          details: error.details
        });
        throw error;
      }

      if (!data?.transcript) {
        console.error('❌ No transcript in response:', { data });
        throw new Error('No transcript received');
      }

      console.debug(`✅ Chunk ${chunkIndex + 1} processed successfully:`, {
        transcriptLength: data.transcript.length,
        metadata: data.metadata
      });

      return data.transcript;

    } catch (error) {
      lastError = error;
      attempts++;
      
      console.warn(`⚠️ Chunk ${chunkIndex + 1} failed:`, {
        attempt: attempts,
        error: error.message,
        stack: error.stack,
        status: error.status
      });
      
      if (attempts === MAX_RETRIES) {
        console.error(`❌ All ${MAX_RETRIES} attempts failed for chunk ${chunkIndex + 1}:`, {
          error: lastError,
          finalAttempt: attempts
        });
        throw new Error(`Failed to process chunk ${chunkIndex + 1} after ${MAX_RETRIES} attempts: ${lastError.message}`);
      }

      // Exponential backoff with jitter
      const backoffTime = Math.min(1000 * Math.pow(2, attempts), 8000);
      const jitter = Math.random() * 1000;
      const waitTime = backoffTime + jitter;
      
      console.debug(`⏳ Retrying in ${(waitTime / 1000).toFixed(2)}s...`, {
        attempt: attempts,
        backoffTime,
        jitter
      });
      
      await delay(waitTime);
    }
  }

  throw lastError || new Error('Unexpected error in retry loop');
};

export const processAudioChunk = async (chunk: Blob, options: DeepgramOptions) => {
  try {
    console.debug('🎬 Starting audio processing:', {
      timestamp: new Date().toISOString(),
      chunkInfo: {
        size: `${(chunk.size / (1024 * 1024)).toFixed(2)}MB`,
        type: chunk.type
      },
      options: JSON.stringify(options, null, 2)
    });

    validateAudioFile(chunk);

    console.debug('🔄 Converting blob to array buffer...');
    const arrayBuffer = await chunk.arrayBuffer();
    console.debug('✅ Array buffer created:', {
      size: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`
    });

    const chunks = sliceArrayBuffer(arrayBuffer, CHUNK_SIZE);
    
    console.debug('📊 Processing configuration:', {
      totalChunks: chunks.length,
      chunkSize: `${(CHUNK_SIZE / (1024 * 1024)).toFixed(2)}MB`,
      totalSize: `${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB`
    });

    let allTranscripts = '';
    let completedChunks = 0;
    
    // Process chunks with controlled concurrency
    const batchSize = 3;
    console.debug(`🚀 Starting batch processing with concurrency of ${batchSize}`);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.debug(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}:`, {
        batchSize: batch.length,
        startIndex: i
      });

      const batchPromises = batch.map((chunkBuffer, batchIndex) => 
        processChunkWithRetry(
          chunkBuffer,
          chunk.type,
          options,
          i + batchIndex,
          chunks.length
        )
      );

      const results = await Promise.all(batchPromises);
      allTranscripts += results.join(' ');
      completedChunks += batch.length;

      console.debug('📈 Processing progress:', {
        completedChunks,
        totalChunks: chunks.length,
        percent: Math.round((completedChunks / chunks.length) * 100),
        transcriptLength: allTranscripts.length
      });
    }

    console.debug('🎉 Processing completed successfully:', {
      finalTranscriptLength: allTranscripts.length,
      chunksProcessed: chunks.length
    });

    return {
      transcript: allTranscripts.trim(),
      metadata: { chunksProcessed: chunks.length }
    };
  } catch (error) {
    console.error('❌ Error processing audio:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });
    throw error;
  }
};

// Add API testing functionality
export const testAPIs = async () => {
  const results = {
    supabase: { status: 'pending' as const, details: '' },
    deepgram: { status: 'pending' as const, details: '' }
  };

  // Test Supabase Connection
  try {
    console.debug('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('transcripts').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      results.supabase = {
        status: 'error' as const,
        details: `Failed to connect to Supabase: ${error.message}`
      };
      toast.error("Supabase connection failed");
    } else {
      console.debug('✅ Supabase connection successful:', data);
      results.supabase = {
        status: 'success' as const,
        details: 'Successfully connected to Supabase'
      };
      toast.success("Supabase connection successful");
    }
  } catch (error) {
    console.error('❌ Unexpected Supabase error:', error);
    results.supabase = {
      status: 'error' as const,
      details: `Unexpected Supabase error: ${error.message}`
    };
    toast.error("Supabase test failed");
  }

  // Test Deepgram Connection
  try {
    console.debug('🔍 Testing Deepgram connection...');
    const { data, error } = await supabase.functions.invoke('test-deepgram-key');
    
    if (error) {
      console.error('❌ Deepgram API test error:', error);
      results.deepgram = {
        status: 'error' as const,
        details: `Failed to test Deepgram API: ${error.message}`
      };
      toast.error("Deepgram API test failed");
    } else {
      console.debug('✅ Deepgram API test successful:', data);
      results.deepgram = {
        status: 'success' as const,
        details: data.message || 'Successfully tested Deepgram API'
      };
      toast.success("Deepgram API test successful");
    }
  } catch (error) {
    console.error('❌ Unexpected Deepgram error:', error);
    results.deepgram = {
      status: 'error' as const,
      details: `Unexpected Deepgram error: ${error.message}`
    };
    toast.error("Deepgram test failed");
  }

  return results;
};
