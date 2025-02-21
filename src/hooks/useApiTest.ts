
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useApiTest = () => {
  const [isTestingApi, setIsTestingApi] = useState(false);

  const testApiKeys = async () => {
    setIsTestingApi(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-deepgram-key');
      
      if (error) {
        console.error('API test error:', error);
        toast.error(`API test failed: ${error.message}`);
        return;
      }

      if (data.status === 'success') {
        toast.success('All API keys are valid and working!');
        console.debug('API test results:', data);
      } else {
        toast.error(`API test failed: ${data.error || 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Error testing API keys:', error);
      toast.error(`Error testing API keys: ${error.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  return {
    isTestingApi,
    testApiKeys
  };
};
