
import { useState } from 'react';
import { testAPIs } from './useDeepgramAPI';
import { toast } from "sonner";

type APITestStatus = 'pending' | 'success' | 'error';

interface APITestResult {
  status: APITestStatus;
  details: string;
}

interface APITestResults {
  supabase: APITestResult;
  deepgram: APITestResult;
}

export const useApiTest = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResults, setTestResults] = useState<APITestResults | null>(null);

  const testApiKeys = async () => {
    setIsTestingApi(true);
    toast.loading('Testing API connections...');
    
    try {
      const results = await testAPIs();
      setTestResults(results);
      
      // Check Supabase connection
      if (results.supabase.status === 'success') {
        toast.success('Supabase connection successful');
      } else {
        toast.error(`Supabase connection failed: ${results.supabase.details}`);
      }

      // Check Deepgram connection
      if (results.deepgram.status === 'success') {
        toast.success('Deepgram API key is valid');
      } else {
        toast.error(`Deepgram API key test failed: ${results.deepgram.details}`);
      }
      
      console.debug('API test results:', results);
    } catch (error: any) {
      console.error('Error testing APIs:', error);
      toast.error(`Error testing APIs: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  return {
    isTestingApi,
    testResults,
    testApiKeys
  };
};
