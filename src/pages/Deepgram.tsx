
import { useState } from "react";
import { useTranscription } from "@/hooks/useTranscription";
import { useApiTest } from "@/hooks/useApiTest";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Deepgram() {
  const [includeTranscriptionTest, setIncludeTranscriptionTest] = useState(false);
  const transcription = useTranscription();
  const { isTestingApi, testResults, testApiKeys } = useApiTest();

  const handleTestClick = () => {
    testApiKeys(includeTranscriptionTest);
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <X className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center mb-8">
        <DeepgramHeader />
      </div>
      
      <div className="flex flex-col gap-4">
        <div className="flex justify-end space-x-4 items-center">
          <div className="flex items-center space-x-2">
            <Switch 
              id="test-transcription"
              checked={includeTranscriptionTest}
              onCheckedChange={setIncludeTranscriptionTest}
            />
            <Label htmlFor="test-transcription">Include transcription test</Label>
          </div>
          <Button 
            variant="outline"
            onClick={handleTestClick}
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

        {testResults && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-2">API Test Results</h3>
            <ScrollArea className="h-[100px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.supabase.status)}
                  <span className="font-medium">Supabase:</span> 
                  <span className="text-sm text-muted-foreground">{testResults.supabase.details}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.deepgram.status)}
                  <span className="font-medium">Deepgram:</span> 
                  <span className="text-sm text-muted-foreground">{testResults.deepgram.details}</span>
                </div>
                {testResults.transcription && (
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.transcription.status)}
                    <span className="font-medium">Transcription:</span> 
                    <span className="text-sm text-muted-foreground">{testResults.transcription.details}</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
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
          options={transcription.options}
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
