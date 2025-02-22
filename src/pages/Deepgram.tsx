
import { useState } from "react";
import { useTranscription } from "@/hooks/useTranscription";
import { useApiTest } from "@/hooks/useApiTest";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function Deepgram() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const transcription = useTranscription();
  const { isTestingApi, testApiKeys } = useApiTest();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <DeepgramHeader />
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
