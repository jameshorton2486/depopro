
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { useTranscription } from "@/hooks/useTranscription";

const DeepgramPage = () => {
  const {
    uploadedFile,
    isProcessing,
    progress,
    transcript,
    processingStatus,
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
    handleTranscribe,
    onDrop,
    downloadTranscript,
  } = useTranscription();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
          aria-live="polite"
        >
          <div className="bg-background border rounded-lg p-6">
            <DeepgramHeader />
            <TranscriptionControls
              model={model}
              language={language}
              options={options}
              onModelChange={setModel}
              onLanguageChange={setLanguage}
              onOptionsChange={handleOptionsChange}
            />
            <FileUploadArea
              uploadedFile={uploadedFile}
              isProcessing={isProcessing}
              processingStatus={processingStatus}
              progress={progress}
              onDrop={onDrop}
            />
            {uploadedFile && (
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  onClick={handleTranscribe}
                  disabled={isProcessing}
                  aria-busy={isProcessing}
                >
                  {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />}
                  {isProcessing ? "Transcribing..." : "Transcribe Audio"}
                </Button>
              </div>
            )}
            <ProcessingOverlay
              isProcessing={isProcessing}
              processingStatus={processingStatus}
            />
            <TranscriptDisplay
              transcript={transcript}
              onDownload={downloadTranscript}
            />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DeepgramPage;
