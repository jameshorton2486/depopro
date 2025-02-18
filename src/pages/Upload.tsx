
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload as UploadIcon, FileText, X, Download, Check, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface FileWithPreview extends File {
  preview?: string;
  text?: string;
  correctedText?: string;
  status?: 'pending' | 'processing' | 'corrected' | 'approved' | 'rejected';
}

const UploadPage = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileWithPreview | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    Promise.all(
      acceptedFiles.map(file => {
        return new Promise<FileWithPreview>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(Object.assign(file, {
              preview: URL.createObjectURL(file),
              text: reader.result as string,
              status: 'pending'
            }));
          };
          reader.readAsText(file);
        });
      })
    ).then(files => {
      setFiles(prevFiles => [...prevFiles, ...files]);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const removeFile = (name: string) => {
    setFiles(files => files.filter(file => file.name !== name));
    if (selectedFile?.name === name) {
      setSelectedFile(null);
    }
  };

  const processFile = async (file: FileWithPreview) => {
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
              content: "You are a professional editor specializing in legal and medical transcripts. Correct any spelling, grammar, or formatting issues while preserving the original meaning."
            },
            {
              role: "user",
              content: file.text
            }
          ]
        })
      });

      const data = await response.json();
      const correctedText = data.choices[0].message.content;

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
      console.error('Error processing file:', error);
      toast.error("Error processing file");
    }
  };

  const processFiles = async () => {
    setProcessing(true);
    try {
      for (const file of files) {
        if (file.status === 'pending') {
          await processFile(file);
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = (file: FileWithPreview) => {
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16 animate-fade-down">
          <div className="text-xl font-semibold">CaseCat</div>
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
            <h1 className="text-3xl font-bold mb-4">Text Processing</h1>
            <p className="text-muted-foreground">
              Upload your documents for AI-powered correction and validation.
              Supported formats: .txt, .doc, .docx
            </p>
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
                className="bg-background border rounded-lg p-6"
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
                    <div className="p-4 rounded-lg bg-secondary/50 text-sm whitespace-pre-wrap">
                      {selectedFile.text}
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
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
