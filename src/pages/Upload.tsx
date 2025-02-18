import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon, Check } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TranscriptPlayer from "@/components/TranscriptPlayer";
import FileUploadStatus from "@/components/upload/FileUploadStatus";
import FileList from "@/components/upload/FileList";
import TrainingRulesComponent from "@/components/upload/TrainingRules";
import ResultsComparison from "@/components/upload/ResultsComparison";
import ModelTraining from "@/components/upload/ModelTraining";

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

type TrainingRule = {
  type: string;
  pattern: string;
  correction: string;
  description: string;
};

type TrainingRules = {
  rules: TrainingRule[];
  general_instructions: {
    capitalization: string;
    formatting: string;
    punctuation: string;
  };
};

const UploadPage = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [requiredFiles, setRequiredFiles] = useState<RequiredFiles>({});
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [trainingRules, setTrainingRules] = useState<TrainingRules | null>(null);

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

  const handleTrainingRulesGenerated = (newRules: any) => {
    if (!trainingRules) return;

    const updatedRules = {
      ...trainingRules,
      rules: [...trainingRules.rules, ...newRules]
    };
    setTrainingRules(updatedRules);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16 animate-fade-down">
          <div className="text-xl font-semibold">Transcript Processing and Training</div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <div className="max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold mb-4">Transcript Processing</h1>
              <p className="text-muted-foreground mb-4">
                Upload all required files to process your transcript:
              </p>
              <FileUploadStatus requiredFiles={requiredFiles} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-4 h-[140px] flex flex-col items-center justify-center cursor-pointer transition-colors
                      ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-muted-foreground">
                      <UploadIcon className="w-8 h-8 mb-2 mx-auto" />
                    </div>
                    <p className="text-base mb-1">
                      {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Or click to select files
                    </p>
                  </div>
                </motion.div>

                {files.length > 0 && (
                  <FileList
                    files={files}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                    onRemoveFile={removeFile}
                    onProcessFiles={processFiles}
                    processing={processing}
                  />
                )}
              </div>

              <div className="space-y-8">
                {selectedFile ? (
                  <>
                    {selectedFile.audioUrl && (
                      <TranscriptPlayer
                        audioUrl={selectedFile.audioUrl}
                        words={selectedFile.words || []}
                        onTimeUpdate={handleTimeUpdate}
                      />
                    )}
                    <ResultsComparison
                      originalText={selectedFile.text}
                      correctedText={selectedFile.correctedText}
                      status={selectedFile.status}
                      onApprove={() => handleApprove(selectedFile)}
                      audioUrl={selectedFile.audioUrl}
                      words={selectedFile.words}
                      currentWordIndex={currentWordIndex}
                    />
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-background border rounded-lg p-6"
                  >
                    <h2 className="text-xl font-semibold mb-4">Training Rules</h2>
                    <TrainingRulesComponent
                      trainingRules={trainingRules}
                      onTrainingRulesChange={setTrainingRules}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-bold mb-4">Model Training with Transcripts</h1>
              <p className="text-muted-foreground mb-4">
                Upload the original transcript and the corrected transcript to generate training rules.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ModelTraining onRulesGenerated={handleTrainingRulesGenerated} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
