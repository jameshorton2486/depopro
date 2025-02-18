import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload as UploadIcon, FileText, X, Download, Check, FileAudio, FileJson, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import TranscriptPlayer from "@/components/TranscriptPlayer";

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

  const handleAudioDrop = useCallback((audioFile: File) => {
    console.log('Processing audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    });

    if (selectedFile) {
      setSelectedFile({
        ...selectedFile,
        audioUrl: URL.createObjectURL(audioFile)
      });
      console.log('Audio file attached to selected file:', selectedFile.name);
    }
  }, [selectedFile]);

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
              content: "You are a professional editor specializing in legal and medical transcripts. Correct any spelling, grammar, or formatting issues while preserving the original meaning. Pay special attention to medical and legal terminology, ensuring proper capitalization and formatting of terms like 'HIPAA' and legal citations."
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
        correctedLength: correctedText.length
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

      toast.success("Text correction completed");
    } catch (error) {
      console.error('Error processing file:', {
        fileName: file.name,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
      toast.error("Error processing file");
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

    console.log(`[${new Date().toISOString()}] Starting batch processing`, {
      totalFiles: files.length,
      pendingFiles: files.filter(f => f.status === 'pending').length
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

  const handleReject = (file: FileWithPreview) => {
    console.log(`Rejecting changes for file: ${file.name}`);
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.name === file.name
          ? { ...f, status: 'rejected', correctedText: undefined }
          : f
      )
    );
    if (selectedFile?.name === file.name) {
      setSelectedFile(prev => prev ? { ...prev, status: 'rejected', correctedText: undefined } : null);
    }
    toast.error("Changes rejected");
  };

  const handleTrainingRulesUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rules = JSON.parse(e.target?.result as string);
        setTrainingRules(rules);
        toast.success("Training rules uploaded successfully");
        console.log("Training rules loaded:", rules);
      } catch (error) {
        console.error("Error parsing training rules:", error);
        toast.error("Error parsing training rules JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16 animate-fade-down">
          <div className="text-xl font-semibold">Deepgram Transcript Corrector</div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-4">Transcript Processing</h1>
            <p className="text-muted-foreground mb-4">
              Upload all required files to process your transcript:
            </p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`p-4 rounded-lg border ${requiredFiles.audio ? 'border-green-500 bg-green-50/10' : 'border-border'}`}>
                <FileAudio className="w-6 h-6 mb-2" />
                <p className="font-medium">Audio File</p>
                <p className="text-sm text-muted-foreground">{requiredFiles.audio?.name || 'Not uploaded'}</p>
              </div>
              <div className={`p-4 rounded-lg border ${requiredFiles.json ? 'border-green-500 bg-green-50/10' : 'border-border'}`}>
                <FileJson className="w-6 h-6 mb-2" />
                <p className="font-medium">JSON Transcript</p>
                <p className="text-sm text-muted-foreground">{requiredFiles.json?.name || 'Not uploaded'}</p>
              </div>
              <div className={`p-4 rounded-lg border ${requiredFiles.docx ? 'border-green-500 bg-green-50/10' : 'border-border'}`}>
                <FileText className="w-6 h-6 mb-2" />
                <p className="font-medium">DOCX File</p>
                <p className="text-sm text-muted-foreground">{requiredFiles.docx?.name || 'Not uploaded'}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              >
                <input {...getInputProps()} />
                <div className="text-muted-foreground">
                  <UploadIcon className="w-12 h-12 mb-4 mx-auto" />
                </div>
                <p className="text-lg mb-2">
                  {isDragActive ? 'Drop your files here' : 'Drag & drop files here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Or click to select files
                </p>
              </div>

              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8"
                >
                  <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div
                        key={file.name}
                        onClick={() => setSelectedFile(file)}
                        className={`flex items-center justify-between p-3 rounded-lg border 
                          ${selectedFile?.name === file.name ? 'bg-primary/5 border-primary' : 'bg-background hover:bg-secondary/50'}
                          cursor-pointer transition-colors`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB · {file.status}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(file.name);
                          }}
                          className="p-1 hover:bg-secondary rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-4">
                    <button
                      onClick={() => setFiles([])}
                      className="px-4 py-2 text-sm hover:text-primary/80 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={processFiles}
                      disabled={processing || !files.some(f => f.status === 'pending')}
                      className="px-6 py-2 rounded-full bg-primary text-primary-foreground 
                        flex items-center gap-2 hover-up disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? 'Processing...' : (
                        <>
                          Process Files
                          <Download className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-background border rounded-lg p-6 space-y-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Text Preview</h3>
                  {selectedFile.status === 'corrected' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(selectedFile)}
                        className="p-2 rounded-full bg-green-500/10 text-green-500 hover:bg-green-500/20"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(selectedFile)}
                        className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {selectedFile.audioUrl && (
                  <TranscriptPlayer
                    audioUrl={selectedFile.audioUrl}
                    words={selectedFile.words || []}
                    onTimeUpdate={handleTimeUpdate}
                  />
                )}

                <div className="space-y-4">
                  {selectedFile.status === 'corrected' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Original Text</label>
                        <div className="p-4 rounded-lg bg-secondary/50 text-sm whitespace-pre-wrap">
                          {selectedFile.text}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Corrected Text</label>
                        <div className="p-4 rounded-lg bg-primary/5 text-sm whitespace-pre-wrap">
                          {selectedFile.correctedText}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-lg bg-secondary/50 text-sm">
                      {selectedFile.words ? (
                        <div className="space-y-1">
                          {selectedFile.words.map((word, index) => (
                            <span
                              key={index}
                              className={`inline-block mr-1 ${
                                index === currentWordIndex ? 'bg-primary/20' : ''
                              } ${
                                word.confidence < 0.9 ? 'bg-yellow-200/50' : ''
                              }`}
                              title={`Confidence: ${(word.confidence * 100).toFixed(1)}%`}
                            >
                              {word.word}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{selectedFile.text}</div>
                      )}
                    </div>
                  )}
                </div>

                {selectedFile.status === 'pending' && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => processFile(selectedFile)}
                      disabled={processing}
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground 
                        flex items-center gap-2 text-sm hover-up disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Process Text
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-background border rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Training Configuration</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload Training Rules</label>
                <div className={`p-4 rounded-lg border border-dashed ${
                  trainingRules ? 'border-green-500 bg-green-50/10' : 'border-border'
                }`}>
                  <div className="flex items-center gap-4">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Training Rules JSON</p>
                      <p className="text-sm text-muted-foreground">
                        {trainingRules 
                          ? `${trainingRules.rules.length} rules loaded` 
                          : 'Upload a JSON file with training rules'}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleTrainingRulesUpload}
                      className="hidden"
                      id="training-rules-upload"
                    />
                    <label
                      htmlFor="training-rules-upload"
                      className="px-4 py-2 rounded-full bg-primary text-primary-foreground 
                        flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Rules
                    </label>
                  </div>
                </div>
              </div>

              {trainingRules && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Loaded Rules</h3>
                  <div className="space-y-2">
                    {trainingRules.rules.map((rule, index) => (
                      <div key={index} className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{rule.type}</p>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                          <button
                            onClick={() => {
                              setTrainingRules(prev => prev ? {
                                ...prev,
                                rules: prev.rules.filter((_, i) => i !== index)
                              } : null);
                              toast.info("Rule removed");
                            }}
                            className="p-1 hover:bg-secondary rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="p-2 rounded bg-background">
                            <span className="text-muted-foreground">Pattern: </span>
                            {rule.pattern}
                          </div>
                          <div className="p-2 rounded bg-background">
                            <span className="text-muted-foreground">Correction: </span>
                            {rule.correction}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 space-y-2">
                    <h4 className="font-medium">General Instructions</h4>
                    <div className="grid gap-2 text-sm">
                      <p><span className="text-muted-foreground">Capitalization: </span>
                        {trainingRules.general_instructions.capitalization}</p>
                      <p><span className="text-muted-foreground">Formatting: </span>
                        {trainingRules.general_instructions.formatting}</p>
                      <p><span className="text-muted-foreground">Punctuation: </span>
                        {trainingRules.general_instructions.punctuation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
