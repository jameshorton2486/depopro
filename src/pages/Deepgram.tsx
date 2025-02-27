
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { ExtractedTerms } from "@/components/deepgram/ExtractedTerms";
import { useTranscription } from "@/hooks/useTranscription";
import { KeytermManagement } from "@/components/deepgram/KeytermManagement";

export default function Deepgram() {
  const {
    uploadedFile,
    transcript,
    transcriptionResult,
    isProcessing,
    processingStatus,
    progress,
    options,
    model,
    onDrop,
    handleOptionsChange,
    onModelChange,
    handleTranscribe,
    handleDownload,
  } = useTranscription();

  return (
    <div className="container relative mx-auto p-4 space-y-8">
      <DeepgramHeader />
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <FileUploadArea
            onDrop={onDrop}
            uploadedFile={uploadedFile}
            isProcessing={isProcessing}
            processingStatus={processingStatus}
            progress={progress}
          />
          
          <TranscriptionControls
            model={model}
            options={options}
            onModelChange={onModelChange}
            onOptionsChange={handleOptionsChange}
            handleTranscribe={handleTranscribe}
            isProcessing={isProcessing}
            progress={progress}
          />
          
          {options.keyterms && options.keyterms.length > 0 && (
            <ExtractedTerms terms={options.keyterms} />
          )}
        </div>

        <div className="relative min-h-[400px] border rounded-lg p-4">
          <TranscriptDisplay
            transcript={transcript}
            transcriptionResult={transcriptionResult}
            onDownload={handleDownload}
          />
          {isProcessing && (
            <ProcessingOverlay
              processingStatus={processingStatus}
              progress={progress}
            />
          )}
        </div>
      </div>
    </div>
  );
}
