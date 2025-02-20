
import { useEffect, useState } from "react";
import { useTranscription } from "@/hooks/useTranscription";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Deepgram() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const transcription = useTranscription();

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

  return (
    <div className="container mx-auto px-4 py-8">
      <DeepgramHeader />
      <div className="mt-8 space-y-8">
        <FileUploadArea
          uploadedFile={transcription.uploadedFile}
          isProcessing={transcription.isProcessing}
          onDrop={transcription.onDrop}
        />
        <TranscriptionControls
          isProcessing={transcription.isProcessing}
          uploadedFile={transcription.uploadedFile}
          model={transcription.model}
          language={transcription.language}
          options={transcription.options}
          setModel={transcription.setModel}
          setLanguage={transcription.setLanguage}
          handleOptionsChange={transcription.handleOptionsChange}
          handleTranscribe={transcription.handleTranscribe}
        />
        {transcription.isProcessing && (
          <ProcessingOverlay
            progress={transcription.progress}
            status={transcription.processingStatus}
          />
        )}
        {transcription.transcript && (
          <TranscriptDisplay
            transcript={transcription.transcript}
            downloadTranscript={transcription.downloadTranscript}
          />
        )}
      </div>
    </div>
  );
}
