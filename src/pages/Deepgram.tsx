
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { useTranscription } from "@/hooks/useTranscription";

export default function Deepgram() {
  const {
    uploadedFile,
    transcript,
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
        </div>

        <div className="relative min-h-[400px] border rounded-lg p-4">
          {isProcessing ? (
            <ProcessingOverlay status={processingStatus} progress={progress} />
          ) : (
            <TranscriptDisplay
              transcript={transcript}
              onDownload={handleDownload}
            />
          )}
        </div>
      </div>
    </div>
  );
}
