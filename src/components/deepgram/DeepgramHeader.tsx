
import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
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
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success("Deepgram API key is valid!", {
          icon: <Check className="h-4 w-4 text-green-500" />
        });
      } else {
        throw new Error("Invalid API key");
      }
    } catch (error) {
      console.error("Error verifying API key:", error);
      toast.error("Failed to verify Deepgram API key. Please check your key in Supabase settings.", {
        icon: <X className="h-4 w-4 text-red-500" />
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
