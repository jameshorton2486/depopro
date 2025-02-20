
import { useState } from "react";
import { AlertTriangle, Check, X, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DeepgramHeader = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  const clearAllData = async () => {
    if (!confirm("Warning: This will clear all saved preferences and cached data. This action cannot be undone. Are you sure?")) {
      return;
    }

    setIsClearing(true);
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear IndexedDB if used
      const databases = await window.indexedDB.databases();
      databases.forEach(db => {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      });

      // Clear session storage
      sessionStorage.clear();

      // Clear any cache storage
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(key => caches.delete(key)));
      }

      toast.success("All data cleared successfully", {
        icon: <Check className="h-4 w-4 text-green-500" />,
        description: "Application cache and storage have been cleared",
        duration: 3000
      });
    } catch (error) {
      console.error("Error clearing data:", error);
      toast.error("Failed to clear some data", {
        icon: <X className="h-4 w-4 text-red-500" />,
        description: error.message,
        duration: 5000
      });
    } finally {
      setIsClearing(false);
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
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllData}
          disabled={isClearing}
          className="text-destructive hover:bg-destructive/10"
        >
          {isClearing ? (
            "Clearing..."
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Data
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={verifyApiKey}
          disabled={isVerifying}
        >
          {isVerifying ? "Verifying..." : "Verify API Key"}
        </Button>
      </div>
    </Alert>
  );
};
