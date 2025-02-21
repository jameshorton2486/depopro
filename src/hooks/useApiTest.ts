
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
    try {
      const results = await testAPIs();
      setTestResults(results);
      
      const allSuccess = Object.values(results)
        .every((r: APITestResult) => r.status === 'success');

      if (allSuccess) {
        toast.success('All API keys are valid and working!');
      } else {
        toast.error('Some API tests failed. Check the console for details.');
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
