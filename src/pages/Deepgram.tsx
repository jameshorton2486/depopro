
import DeepgramHeader from "@/components/deepgram/DeepgramHeader";
import FileUploadArea from "@/components/deepgram/FileUploadArea";
import TranscriptDisplay from "@/components/deepgram/TranscriptDisplay";
import TranscriptionControls from "@/components/deepgram/TranscriptionControls";
import TranscriptionOptions from "@/components/deepgram/TranscriptionOptions";
import { useDeepgramOptions } from "@/hooks/useDeepgramOptions";
import { useDeepgramAPI } from "@/hooks/useDeepgramAPI";
import { ApiKeyForm } from "@/components/deepgram/ApiKeyForm";

const Deepgram = () => {
  const { model, language, options, setModel, setLanguage, handleOptionsChange } =
    useDeepgramOptions();
  const { processAudioChunk, showApiKeyForm, setShowApiKeyForm, handleApiKeySubmit } = useDeepgramAPI();

  return (
    <div className="space-y-8 animate-fade-up">
      <DeepgramHeader />
      <TranscriptionOptions
        model={model}
        language={language}
        options={options}
        onModelChange={setModel}
        onLanguageChange={setLanguage}
        onOptionsChange={handleOptionsChange}
      />
      <FileUploadArea
        model={model}
        language={language}
        options={options}
        onProcess={processAudioChunk}
      />
      <TranscriptDisplay />
      <TranscriptionControls />
      <ApiKeyForm
        isOpen={showApiKeyForm}
        onClose={() => setShowApiKeyForm(false)}
        onSubmit={handleApiKeySubmit}
      />
    </div>
  );
};

export default Deepgram;
