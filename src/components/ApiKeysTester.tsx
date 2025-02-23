
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ApiTestResult {
  status: 'success' | 'error';
  message: string;
}

interface TestResults {
  deepgram?: ApiTestResult;
  openai?: ApiTestResult;
}

export function ApiKeysTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<TestResults | null>(null);

  const testApiKeys = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-api-keys');
      
      if (error) throw error;
      
      setResults(data.results);
      
      // Show overall status toast
      const allSuccess = Object.values(data.results).every(
        (result: ApiTestResult) => result.status === 'success'
      );
      
      if (allSuccess) {
        toast.success('All API keys are valid and working!');
      } else {
        toast.error('Some API keys are invalid or not configured');
      }
      
    } catch (error) {
      console.error('Error testing API keys:', error);
      toast.error('Failed to test API keys');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 border rounded-lg bg-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">API Keys Status</h2>
        <Button 
          onClick={testApiKeys}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test API Keys'
          )}
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {Object.entries(results).map(([key, result]) => (
            <div 
              key={key}
              className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="font-medium capitalize">{key}</h3>
              <p className={`text-sm ${
                result.status === 'success' 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {result.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
