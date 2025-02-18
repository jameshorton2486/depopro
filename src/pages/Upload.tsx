
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Download } from "lucide-react";
import { motion } from "framer-motion";

interface FileWithPreview extends File {
  preview?: string;
}

const Upload = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [processing, setProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles.map(file => 
      Object.assign(file, {
        preview: URL.createObjectURL(file)
      })
    ));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'text/xml': ['.xml', '.sgxml'],
      'audio/opus': ['.opus'],
      'application/octet-stream': ['.sgstn', '.sgngl', '.DRA']
    }
  });

  const removeFile = (name: string) => {
    setFiles(files => files.filter(file => file.name !== name));
  };

  const processFiles = async () => {
    setProcessing(true);
    // Here we would implement the actual file processing logic
    // For now, we'll just simulate processing with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
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

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-4">File Upload</h1>
            <p className="text-muted-foreground">
              Upload your Case Catalyst deposition files for processing.
              Supported formats: .zip, .sgxml, .sgstn, .sgngl, .opus, .DRA
            </p>
          </motion.div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mb-4 mx-auto text-muted-foreground" />
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
                    className="flex items-center justify-between p-3 rounded-lg bg-background border"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
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
                  disabled={processing}
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
      </div>
    </div>
  );
};

export default Upload;
