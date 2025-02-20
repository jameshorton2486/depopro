
import { useState } from "react";
import { AlertTriangle, Check, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DeepgramHeader = () => {
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyApiKey = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-deepgram-key');
      
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to call verification endpoint: ${error.message}`);
      }

      if (!data) {
        throw new Error('No response received from verification endpoint');
      }

      if (data.error) {
        // Handle specific error cases
        let errorMessage = 'Failed to verify Deepgram API key';
        let details = data.details || data.error;

        if (data.error === 'Invalid API key') {
          errorMessage = 'Invalid or unauthorized Deepgram API key';
        } else if (data.error === 'Deepgram API key not configured') {
          errorMessage = 'Deepgram API key is not configured';
          details = 'Please set up your API key in Supabase Edge Function secrets';
        }

        toast.error(errorMessage, {
          icon: <AlertCircle className="h-4 w-4 text-red-500" />,
          description: details,
          duration: 5000
        });
        return;
      }

      if (data.success) {
        toast.success("Deepgram API key is valid!", {
          icon: <Check className="h-4 w-4 text-green-500" />,
          description: data.message,
          duration: 3000
        });
      } else {
        throw new Error("Unexpected response from verification endpoint");
      }
    } catch (error) {
      console.error("Error verifying API key:", error);
      toast.error("Failed to verify Deepgram API key", {
        icon: <X className="h-4 w-4 text-red-500" />,
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Alert className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Choose a model and language, then upload an audio file to begin transcription.
        </AlertDescription>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={verifyApiKey}
        disabled={isVerifying}
        className="ml-4"
      >
        {isVerifying ? "Verifying..." : "Verify API Key"}
      </Button>
    </Alert>
  );
};
