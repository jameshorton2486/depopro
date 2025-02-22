
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type APITestStatus = 'pending' | 'success' | 'error';

export interface APITestResult {
  status: APITestStatus;
  details: string;
}

export interface APITestResults {
  supabase: APITestResult;
  deepgram: APITestResult;
  transcription?: APITestResult;
}

export const testAPIs = async (includeTranscriptionTest: boolean = false): Promise<APITestResults> => {
  const results: APITestResults = {
    supabase: { status: 'pending', details: '' },
    deepgram: { status: 'pending', details: '' }
  };

  // Test Supabase Connection
  try {
    console.debug('🔍 Testing Supabase connection...');
    toast.loading('Testing Supabase connection...');
    
    const { data, error } = await supabase.from('transcripts').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      results.supabase = {
        status: 'error',
        details: `Failed to connect to Supabase: ${error.message}`
      };
      toast.error(`Supabase connection failed: ${error.message}`);
    } else {
      console.debug('✅ Supabase connection successful:', data);
      results.supabase = {
        status: 'success',
        details: 'Successfully connected to Supabase'
      };
      toast.success('Supabase connection successful');
    }
  } catch (error: any) {
    console.error('❌ Unexpected Supabase error:', error);
    results.supabase = {
      status: 'error',
      details: `Unexpected Supabase error: ${error.message}`
    };
    toast.error(`Unexpected Supabase error: ${error.message}`);
  }

  // Test Deepgram Connection
  try {
    console.debug('🔍 Testing Deepgram connection...');
    toast.loading('Testing Deepgram API connection...');
    
    const response = await supabase.functions.invoke('test-deepgram-key', {
      body: { test: true }
    });
    
    if (response.error) {
      console.error('❌ Deepgram API test error:', response.error);
      results.deepgram = {
        status: 'error',
        details: `Failed to test Deepgram API: ${response.error.message}`
      };
      toast.error(`Deepgram API test failed: ${response.error.message}`);
    } else {
      console.debug('✅ Deepgram API test successful:', response.data);
      results.deepgram = {
        status: 'success',
        details: response.data?.message || 'Successfully tested Deepgram API'
      };
      toast.success('Deepgram API key is valid');
    }
  } catch (error: any) {
    console.error('❌ Unexpected Deepgram error:', error);
    results.deepgram = {
      status: 'error',
      details: `Unexpected Deepgram error: ${error.message}`
    };
    toast.error(`Deepgram test failed: ${error.message}`);
  }

  // Optional Transcription Test
  if (includeTranscriptionTest) {
    try {
      console.debug('🔍 Testing transcription process...');
      toast.loading('Testing transcription process...');
      
      const response = await supabase.functions.invoke('test-transcription');
      
      if (response.error) {
        console.error('❌ Transcription test error:', response.error);
        results.transcription = {
          status: 'error',
          details: `Failed to test transcription: ${response.error.message}`
        };
        toast.error(`Transcription test failed: ${response.error.message}`);
      } else {
        console.debug('✅ Transcription test successful:', response.data);
        results.transcription = {
          status: 'success',
          details: `Successfully tested transcription. Sample transcript: "${response.data?.transcript?.slice(0, 100)}..."`
        };
        toast.success('Transcription test successful');
      }
    } catch (error: any) {
      console.error('❌ Unexpected transcription error:', error);
      results.transcription = {
        status: 'error',
        details: `Unexpected transcription error: ${error.message}`
      };
      toast.error(`Transcription test failed: ${error.message}`);
    }
  }

  return results;
};
