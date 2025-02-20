
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
    utterances,
    processingStatus,
    model,
    language,
    options,
    setModel,
    setLanguage,
    handleOptionsChange,
    testApiKey,
    handleTranscribe,
    onDrop,
    downloadTranscript,
  } = useTranscription();

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <h1 className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Deepgram Integration
          </h1>
          <a 
            href="/" 
            className="text-sm hover:text-primary/80 transition-colors"
            aria-label="Back to Home"
          >
            Back to Home
          </a>
        </nav>

        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
          aria-live="polite"
        >
          <div className="bg-background border rounded-lg p-6">
            <DeepgramHeader onTestApiKey={testApiKey} />
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
              utterances={utterances}
              onDownload={downloadTranscript}
            />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DeepgramPage;
