
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";

type FileUploaderProps = {
  onGenerateRules: () => void;
};

const FileUploader = ({ onGenerateRules }: FileUploaderProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      toast.error("Please upload a valid document file");
      return;
    }

    const file = acceptedFiles[0];
    if (!file.type.includes('document')) {
      toast.error("Please upload a document file (PDF or DOCX)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      // File is successfully loaded
      toast.success("Document uploaded successfully");
    };
    reader.onerror = () => {
      toast.error("Error reading document file");
    };
    reader.readAsText(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  });

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium mb-2">Upload Document</h3>
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg h-[280px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50"
      >
        <input {...getInputProps()} />
        <UploadIcon className="w-8 h-8 mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive 
            ? "Drop the document here..."
            : "Upload PDF or Document files"
          }
        </p>
      </div>
      <div className="flex justify-end mt-4">
        <button
          onClick={onGenerateRules}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Generate Rules from Files
        </button>
      </div>
    </div>
  );
};

export default FileUploader;
