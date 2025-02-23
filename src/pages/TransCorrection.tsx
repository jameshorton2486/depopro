
import { useDropzone, DropzoneInputProps } from "react-dropzone";
import TranscriptHeader from "@/components/transcript/TranscriptHeader";
import UploadSection from "@/components/transcript/UploadSection";
import UploadArea from "@/components/transcript/UploadArea";
import FormattingButtons from "@/components/transcript/FormattingButtons";
import CorrectedTextDisplay from "@/components/transcript/CorrectedTextDisplay";
import { useTranscriptUpload } from "@/hooks/useTranscriptUpload";

const TransCorrection = () => {
  const {
    isProcessing,
    progress,
    uploadedFile,
    correctedText,
    onDrop,
    handleInitialFormatting,
    handleRulesFormatting
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

        <div className="max-w-2xl mx-auto">
          <UploadSection>
            <UploadArea
              getRootProps={getRootProps}
              getInputProps={getInputProps}
              isDragActive={isDragActive}
              uploadedFile={uploadedFile}
              isProcessing={isProcessing}
              progress={progress}
            />
          </UploadSection>

          {uploadedFile && !isProcessing && (
            <FormattingButtons transcript={correctedText || ""} />
          )}

          {correctedText && !isProcessing && (
            <CorrectedTextDisplay text={correctedText} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
