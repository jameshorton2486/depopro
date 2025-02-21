
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramOptions } from "@/types/deepgram";
import { validateAudioFile } from "@/utils/audioValidation";
import { sliceArrayBuffer } from "@/utils/audioChunking";
import { processChunkWithRetry } from "@/utils/audioProcessing";

export type APITestStatus = 'pending' | 'success' | 'error';

export interface APITestResult {
  status: APITestStatus;
  details: string;
}

export interface APITestResults {
  supabase: APITestResult;
  deepgram: APITestResult;
}

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

    const chunks = sliceArrayBuffer(arrayBuffer);
    
    console.debug('📊 Processing configuration:', {
      totalChunks: chunks.length,
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

export const testAPIs = async (): Promise<APITestResults> => {
  const results: APITestResults = {
    supabase: { status: 'pending', details: '' },
    deepgram: { status: 'pending', details: '' }
  };

  // Test Supabase Connection
  try {
    console.debug('🔍 Testing Supabase connection...');
    const { data, error } = await supabase.from('transcripts').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      results.supabase = {
        status: 'error',
        details: `Failed to connect to Supabase: ${error.message}`
      };
      toast.error("Supabase connection failed");
    } else {
      console.debug('✅ Supabase connection successful:', data);
      results.supabase = {
        status: 'success',
        details: 'Successfully connected to Supabase'
      };
      toast.success("Supabase connection successful");
    }
  } catch (error: any) {
    console.error('❌ Unexpected Supabase error:', error);
    results.supabase = {
      status: 'error',
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
        status: 'error',
        details: `Failed to test Deepgram API: ${error.message}`
      };
      toast.error("Deepgram API test failed");
    } else {
      console.debug('✅ Deepgram API test successful:', data);
      results.deepgram = {
        status: 'success',
        details: data.message || 'Successfully tested Deepgram API'
      };
      toast.success("Deepgram API test successful");
    }
  } catch (error: any) {
    console.error('❌ Unexpected Deepgram error:', error);
    results.deepgram = {
      status: 'error',
      details: `Unexpected Deepgram error: ${error.message}`
    };
    toast.error("Deepgram test failed");
  }

  return results;
};
