
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranscription } from "@/hooks/useTranscription";
import { useApiTest } from "@/hooks/useApiTest";
import { supabase } from "@/integrations/supabase/client";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Deepgram() {
  const navigate = useNavigate();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const transcription = useTranscription();
  const { isTestingApi, testApiKeys } = useApiTest();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const testSupabaseConnection = async () => {
    try {
      setIsTestingConnection(true);
      const { data, error } = await supabase
        .from('transcripts')
        .select('id')
        .limit(1);

      if (error) {
        console.error("Supabase connection error:", error);
        toast.error("Failed to connect to Supabase: " + error.message);
      } else {
        console.debug("Supabase connection successful:", data);
        toast.success("Successfully connected to Supabase!");
      }
    } catch (err) {
      console.error("Unexpected error testing Supabase connection:", err);
      toast.error("Unexpected error testing Supabase connection");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <DeepgramHeader />
        <Button variant="outline" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
      
      <div className="flex justify-end mb-4">
        <Button 
          variant="outline"
          onClick={testApiKeys}
          disabled={isTestingApi}
        >
          {isTestingApi ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing API Keys...
            </>
          ) : (
            'Test API Keys'
          )}
        </Button>
      </div>

      <div className="space-y-8">
        <FileUploadArea
          uploadedFile={transcription.uploadedFile}
          isProcessing={transcription.isProcessing}
          processingStatus={transcription.processingStatus}
          progress={transcription.progress}
          onDrop={transcription.onDrop}
        />
        <TranscriptionControls
          model={transcription.model}
          language={transcription.language}
          options={transcription.options}
          onModelChange={transcription.setModel}
          onLanguageChange={transcription.setLanguage}
          onOptionsChange={transcription.handleOptionsChange}
          handleTranscribe={transcription.handleTranscribe}
          isProcessing={transcription.isProcessing}
        />
        {transcription.isProcessing && (
          <ProcessingOverlay
            processingStatus={transcription.processingStatus}
          />
        )}
        {transcription.transcript && (
          <TranscriptDisplay
            transcript={transcription.transcript}
            onDownload={() => transcription.handleDownload(transcription.transcript)}
          />
        )}
      </div>
    </div>
  );
}
