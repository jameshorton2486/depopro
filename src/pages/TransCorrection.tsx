
import { useDropzone, DropzoneInputProps } from "react-dropzone";
import TranscriptHeader from "@/components/transcript/TranscriptHeader";
import CorrectedTextDisplay from "@/components/transcript/CorrectedTextDisplay";
import { useTranscriptUpload } from "@/hooks/useTranscriptUpload";
import { Button } from "@/components/ui/button";
import { Upload, FileText, File } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const TransCorrection = () => {
  const {
    isProcessing,
    progress,
    uploadedFile,
    correctedText,
    onDrop,
    handleInitialFormatting,
    handleRulesFormatting,
    handleAudioUpload,
    handleTranscriptChange,
    handleJsonUpload,
    transcriptText,
    saveStatus
  } = useTranscriptUpload();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024
  }) as {
    getRootProps: () => React.HTMLAttributes<HTMLElement>;
    getInputProps: () => DropzoneInputProps;
    isDragActive: boolean;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <TranscriptHeader />

        <div className="max-w-3xl mx-auto space-y-8">
          {/* File Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Audio Upload */}
            <div className="relative">
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Upload Audio File
                </span>
              </label>
            </div>

            {/* JSON Upload */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleJsonUpload}
                className="hidden"
                id="json-upload"
              />
              <label
                htmlFor="json-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <File className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground text-center">
                  Upload JSON File
                </span>
              </label>
            </div>

            {/* Transcript Upload */}
            <div className="relative">
              <div {...getRootProps()} className="h-full">
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors h-full">
                  <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground text-center">
                    {isDragActive
                      ? "Drop the transcript here..."
                      : "Upload Transcript File"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Transcript Text Area */}
          <div>
            <h3 className="text-lg font-medium mb-2">Paste Transcript</h3>
            <Textarea
              placeholder="Paste your transcript here..."
              value={transcriptText}
              onChange={handleTranscriptChange}
              className="min-h-[200px]"
            />
          </div>

          {/* Save Status */}
          {(saveStatus?.transcriptSaved || saveStatus?.audioSaved || saveStatus?.jsonSaved) && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-2">Upload Status:</h3>
              <div className="flex gap-4">
                {saveStatus?.transcriptSaved && (
                  <span className="text-sm text-green-600">✓ Transcript saved</span>
                )}
                {saveStatus?.audioSaved && (
                  <span className="text-sm text-green-600">✓ Audio saved</span>
                )}
                {saveStatus?.jsonSaved && (
                  <span className="text-sm text-green-600">✓ JSON saved</span>
                )}
              </div>
            </div>
          )}

          {/* Corrected Text Display */}
          {correctedText && !isProcessing && (
            <CorrectedTextDisplay text={correctedText} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
