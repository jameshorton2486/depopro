import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TranscriptPlayer from "@/components/TranscriptPlayer";
import FileUploadStatus from "@/components/upload/FileUploadStatus";
import FileList from "@/components/upload/FileList";
import TrainingRulesComponent from "@/components/upload/TrainingRules";
import ResultsComparison from "@/components/upload/ResultsComparison";
import ModelTraining from "@/components/upload/ModelTraining";
import SingleTextInput from "@/components/upload/SingleTextInput";
import TextComparison from "@/components/upload/TextComparison";
import FileUploader from "@/components/upload/FileUploader";
import { openAIService, type TrainingRules, type TrainingRule } from "@/services/openai";

type TimestampedWord = {
  start_time: string;
  end_time: string;
  word: string;
  confidence: number;
};

type FileWithPreview = {
  name: string;
  size: number;
  type: string;
  preview: string;
  text: string;
  audioUrl?: string;
  words?: TimestampedWord[];
  correctedText?: string;
  status: 'pending' | 'processing' | 'corrected' | 'approved' | 'rejected';
};

type RequiredFiles = {
  audio?: File;
  json?: File;
  docx?: File;
};

const UploadPage = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [requiredFiles, setRequiredFiles] = useState<RequiredFiles>({});
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [trainingRules, setTrainingRules] = useState<TrainingRules | null>(null);
  const [originalCompareText, setOriginalCompareText] = useState('');
  const [correctedCompareText, setCorrectedCompareText] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(`[${new Date().toISOString()}] Processing uploaded files`, {
      fileCount: acceptedFiles.length,
      fileTypes: acceptedFiles.map(f => f.type)
    });

    acceptedFiles.forEach(file => {
      if (file.type.includes('audio')) {
        setRequiredFiles(prev => ({ ...prev, audio: file }));
        toast.success("Audio file uploaded successfully");
      } else if (file.type === 'application/json') {
        setRequiredFiles(prev => ({ ...prev, json: file }));
        toast.success("JSON transcript file uploaded successfully");
      } else if (file.type.includes('document')) {
        setRequiredFiles(prev => ({ ...prev, docx: file }));
        toast.success("DOCX file uploaded successfully");
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (file.type === 'application/json') {
          try {
            const data = JSON.parse(reader.result as string);
            const words = data.words;
            const text = words?.map((w: TimestampedWord) => w.word).join(' ') || '';
            
            setFiles(prevFiles => [...prevFiles, {
              name: file.name,
              size: file.size,
              type: file.type,
              preview: URL.createObjectURL(file),
              text,
              words,
              status: 'pending'
            }]);
          } catch (e) {
            console.error('Error parsing JSON:', e);
            toast.error("Error parsing JSON file");
          }
        } else if (!file.type.includes('audio')) {
          setFiles(prevFiles => [...prevFiles, {
            name: file.name,
            size: file.size,
            type: file.type,
            preview: URL.createObjectURL(file),
            text: reader.result as string,
            status: 'pending'
          }]);
        }
      };

      if (file.type.includes('audio')) {
        const audioUrl = URL.createObjectURL(file);
        setFiles(prevFiles => [...prevFiles, {
          name: file.name,
          size: file.size,
          type: file.type,
          preview: audioUrl,
          text: '',
          audioUrl,
          status: 'pending'
        }]);
      } else {
        reader.readAsText(file);
      }
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleTimeUpdate = (time: number) => {
    if (selectedFile?.words) {
      const newIndex = selectedFile.words.findIndex(
        word => {
          const startTime = timeToSeconds(word.start_time);
          const endTime = timeToSeconds(word.end_time);
          return time >= startTime && time <= endTime;
        }
      );
      if (newIndex !== currentWordIndex) {
        setCurrentWordIndex(newIndex);
      }
    }
  };

  const timeToSeconds = (timeStr: string) => {
    const [minutes, seconds] = timeStr.split(':').map(Number);
    return minutes * 60 + seconds;
  };

  const removeFile = (name: string) => {
    if (name === "") {
      setFiles([]);
      setSelectedFile(null);
      return;
    }
    console.log(`Removing file: ${name}`);
    setFiles(files => files.filter(file => file.name !== name));
    if (selectedFile?.name === name) {
      setSelectedFile(null);
    }
    toast.info(`Removed file: ${name}`);
  };

  const processFile = async (file: FileWithPreview) => {
    console.log(`[${new Date().toISOString()}] Starting file processing:`, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    try {
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.name === file.name
            ? { ...f, status: 'processing' }
            : f
        )
      );

      const trainingContext = trainingRules ? {
        rules: trainingRules.rules.map(rule => ({
          pattern: rule.pattern,
          correction: rule.correction,
          type: rule.type
        })),
        instructions: trainingRules.general_instructions
      } : null;

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
              content: `You are a professional transcript corrector. Apply these specific rules and instructions:
                ${JSON.stringify(trainingContext, null, 2)}`
            },
            {
              role: "user",
              content: file.text
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`API response received for ${file.name}`, {
        status: response.status,
        timestamp: new Date().toISOString()
      });

      const data = await response.json();
      const correctedText = data.choices[0].message.content;

      console.log('Text correction completed', {
        fileName: file.name,
        originalLength: file.text.length,
        correctedLength: correctedText.length,
        trainingRulesApplied: trainingRules ? trainingRules.rules.length : 0
      });

      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.name === file.name 
            ? { ...f, correctedText, status: 'corrected' }
            : f
        )
      );

      if (selectedFile?.name === file.name) {
        setSelectedFile(prev => prev ? { ...prev, correctedText, status: 'corrected' } : null);
      }

      toast.success(`Training completed for ${file.name}`);
    } catch (error) {
      console.error('Error processing file:', {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.name === file.name
            ? { ...f, status: 'pending' }
            : f
        )
      );
      
      toast.error(`Error processing ${file.name}`);
    }
  };

  const checkRequiredFiles = () => {
    const missing = [];
    if (!requiredFiles.audio) missing.push('Audio');
    if (!requiredFiles.json) missing.push('JSON transcript');
    if (!requiredFiles.docx) missing.push('DOCX');
    
    if (missing.length > 0) {
      toast.error(`Missing required files: ${missing.join(', ')}`);
      return false;
    }
    return true;
  };

  const processFiles = async () => {
    if (!checkRequiredFiles()) return;

    if (!trainingRules) {
      toast.error("Please upload training rules before processing files");
      return;
    }

    console.log(`[${new Date().toISOString()}] Starting batch processing`, {
      totalFiles: files.length,
      pendingFiles: files.filter(f => f.status === 'pending').length,
      trainingRules: trainingRules.rules.length
    });

    setProcessing(true);
    try {
      for (const file of files) {
        if (file.status === 'pending') {
          await processFile(file);
        }
      }
    } catch (error) {
      console.error('Batch processing error:', error);
      toast.error("Error during batch processing");
    } finally {
      setProcessing(false);
      console.log('Batch processing completed');
    }
  };

  const handleApprove = (file: FileWithPreview) => {
    console.log(`Approving changes for file: ${file.name}`);
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.name === file.name
          ? { ...f, status: 'approved' }
          : f
      )
    );
    if (selectedFile?.name === file.name) {
      setSelectedFile(prev => prev ? { ...prev, status: 'approved' } : null);
    }
    toast.success("Changes approved");
  };

  const handleTrainingRulesGenerated = (newRules: TrainingRules) => {
    if (!trainingRules) {
      setTrainingRules(newRules);
      return;
    }

    setTrainingRules(prevRules => ({
      ...prevRules,
      rules: [...prevRules.rules, ...newRules.rules]
    }));
  };

  const generateRulesFromComparison = async () => {
    if (!originalCompareText || !correctedCompareText) {
      toast.error("Please provide both original and corrected text");
      return;
    }

    try {
      const newRules = await openAIService.generateRulesFromComparison(
        originalCompareText,
        correctedCompareText
      );

      handleTrainingRulesGenerated(newRules);
      setOriginalCompareText('');
      setCorrectedCompareText('');
      toast.success("New rules generated and added to training rules");
    } catch (error) {
      console.error("Error in comparison flow:", error);
    }
  };

  const generateRulesFromFiles = async () => {
    if (!requiredFiles.docx) {
      toast.error("Please upload a document file first");
      return;
    }

    const documentFile = files.find(f => f.type.includes('document'));
    if (!documentFile?.text) {
      toast.error("Document content not found");
      return;
    }

    try {
      const newRules = await openAIService.generateRulesFromDocument(documentFile.text);
      handleTrainingRulesGenerated(newRules);
      toast.success("New rules generated from document and added to training rules");
    } catch (error) {
      console.error("Error in document flow:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <div className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Transcript Processing and Training
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div>
            <h1 className="text-3xl font-bold mb-4">Upload Transcripts</h1>
            <p className="text-muted-foreground mb-4">
              Upload the original transcript and the corrected transcript to generate training rules.
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <ModelTraining onRulesGenerated={handleTrainingRulesGenerated} />
          </div>
        </motion.div>

        {!selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-background border rounded-lg p-6 mt-8"
          >
            <h2 className="text-xl font-semibold mb-4">Training Rules</h2>
            <div className="space-y-6">
              <SingleTextInput 
                onRulesGenerated={(newRules) => {
                  setTrainingRules(prevRules => {
                    if (!prevRules) {
                      return {
                        rules: newRules.rules,
                        general_instructions: {
                          capitalization: "Follow standard capitalization rules",
                          formatting: "Maintain consistent formatting",
                          punctuation: "Use appropriate punctuation"
                        }
                      };
                    }
                    return {
                      ...prevRules,
                      rules: [...prevRules.rules, ...newRules.rules]
                    };
                  });
                }}
              />

              <TextComparison
                originalText={originalCompareText}
                correctedText={correctedCompareText}
                onOriginalTextChange={setOriginalCompareText}
                onCorrectedTextChange={setCorrectedCompareText}
                onGenerateRules={generateRulesFromComparison}
              />

              <FileUploader onGenerateRules={generateRulesFromFiles} />

              <TrainingRulesComponent
                trainingRules={trainingRules}
                onTrainingRulesChange={setTrainingRules}
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
