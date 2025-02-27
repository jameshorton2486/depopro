
import { FileUploadArea } from "@/components/deepgram/FileUploadArea";
import { TranscriptDisplay } from "@/components/deepgram/TranscriptDisplay";
import { TranscriptionControls } from "@/components/deepgram/TranscriptionControls";
import { ProcessingOverlay } from "@/components/deepgram/ProcessingOverlay";
import { DeepgramHeader } from "@/components/deepgram/DeepgramHeader";
import { ExtractedTerms } from "@/components/deepgram/ExtractedTerms";
import { useTranscription } from "@/hooks/useTranscription";
import { KeytermManagement } from "@/components/deepgram/KeytermManagement";
import { UrlInput } from "@/components/deepgram/UrlInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Deepgram() {
  const {
    uploadedFile,
    audioUrl,
    handleUrlChange,
    isYouTubeUrl,
    currentSource,
    setCurrentSource,
    transcript,
    transcriptionResult,
    isProcessing,
    processingStatus,
    progress,
    options,
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
          <Tabs 
            defaultValue="file" 
            value={currentSource || "file"}
            onValueChange={(value) => setCurrentSource(value as "file" | "url" | null)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">Upload File</TabsTrigger>
              <TabsTrigger value="url">Use URL</TabsTrigger>
            </TabsList>
            <TabsContent value="file">
              <FileUploadArea
                onDrop={onDrop}
                uploadedFile={uploadedFile}
                isProcessing={isProcessing}
                processingStatus={processingStatus}
                progress={progress}
              />
            </TabsContent>
            <TabsContent value="url">
              <UrlInput
                audioUrl={audioUrl}
                handleUrlChange={handleUrlChange}
                isYouTubeUrl={isYouTubeUrl}
                disabled={isProcessing}
              />
            </TabsContent>
          </Tabs>
          
          <TranscriptionControls
            model={options.model || 'nova-2'}
            options={options}
            onModelChange={onModelChange}
            onOptionsChange={handleOptionsChange}
            handleTranscribe={handleTranscribe}
            isProcessing={isProcessing}
            progress={progress}
          />
          
          {options.keyterms && options.keyterms.length > 0 && (
            <ExtractedTerms terms={options.keyterms.map(term => ({
              term: term.term,
              boost: term.boost,
              category: term.category || 'other'
            }))} />
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
