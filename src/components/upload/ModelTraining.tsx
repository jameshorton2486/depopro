
import { useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";

interface ModelTrainingProps {
  onRulesGenerated: (newRules: any) => void;
}

const ModelTraining = ({ onRulesGenerated }: ModelTrainingProps) => {
  const [originalTranscript, setOriginalTranscript] = useState<string | null>(null);
  const [correctedTranscript, setCorrectedTranscript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFileUpload = async (files: File[], type: 'original' | 'corrected') => {
    if (files.length === 0) return;

    const file = files[0];
    if (file.type !== 'text/plain') {
      toast.error('Please upload a text file');
      return;
    }

    const text = await file.text();
    if (type === 'original') {
      setOriginalTranscript(text);
    } else {
      setCorrectedTranscript(text);
    }
    toast.success(`${type} transcript uploaded successfully`);
  };

  const { getRootProps: getOriginalRootProps, getInputProps: getOriginalInputProps } = useDropzone({
    onDrop: (files) => handleFileUpload(files, 'original'),
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1
  });

  const { getRootProps: getCorrectedRootProps, getInputProps: getCorrectedInputProps } = useDropzone({
    onDrop: (files) => handleFileUpload(files, 'corrected'),
    accept: { 'text/plain': ['.txt'] },
    maxFiles: 1
  });

  const analyzeTranscripts = async () => {
    if (!originalTranscript || !correctedTranscript) {
      toast.error('Please upload both transcripts');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "Analyze the original and corrected transcripts to identify patterns and generate training rules. Focus on spelling, grammar, punctuation, and formatting differences."
            },
            {
              role: "user",
              content: `Original transcript:\n${originalTranscript}\n\nCorrected transcript:\n${correctedTranscript}`
            }
          ]
        })
      });

      const data = await response.json();
      const generatedRules = data.choices[0].message.content;
      onRulesGenerated(generatedRules);
      toast.success('New training rules generated successfully');
    } catch (error) {
      console.error('Error generating rules:', error);
      toast.error('Failed to generate training rules');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-background border rounded-lg p-6 space-y-6"
    >
      <h2 className="text-xl font-semibold mb-4">Model Training</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Original Transcript</h3>
          <div
            {...getOriginalRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              hover:border-primary/50 ${originalTranscript ? 'bg-primary/5 border-primary' : ''}`}
          >
            <input {...getOriginalInputProps()} />
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {originalTranscript ? (
              <div className="text-sm">
                <p className="font-medium">File uploaded</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOriginalTranscript(null);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drop original transcript or click to upload
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Corrected Transcript</h3>
          <div
            {...getCorrectedRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
              hover:border-primary/50 ${correctedTranscript ? 'bg-primary/5 border-primary' : ''}`}
          >
            <input {...getCorrectedInputProps()} />
            <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {correctedTranscript ? (
              <div className="text-sm">
                <p className="font-medium">File uploaded</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCorrectedTranscript(null);
                  }}
                  className="text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drop corrected transcript or click to upload
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={analyzeTranscripts}
          disabled={!originalTranscript || !correctedTranscript || isGenerating}
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground 
            flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            'Generating rules...'
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Generate Training Rules
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default ModelTraining;
