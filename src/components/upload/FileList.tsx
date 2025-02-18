
import { FileText, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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

interface FileListProps {
  files: FileWithPreview[];
  selectedFile: FileWithPreview | null;
  onSelectFile: (file: FileWithPreview) => void;
  onRemoveFile: (name: string) => void;
  onProcessFiles: () => void;
  processing: boolean;
}

const FileList = ({ 
  files, 
  selectedFile, 
  onSelectFile, 
  onRemoveFile, 
  onProcessFiles, 
  processing 
}: FileListProps) => {
  return (
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
            onClick={() => onSelectFile(file)}
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
                onRemoveFile(file.name);
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
          onClick={() => onRemoveFile("")}
          className="px-4 py-2 text-sm hover:text-primary/80 transition-colors"
        >
          Clear All
        </button>
        <button
          onClick={onProcessFiles}
          disabled={processing || !files.some(f => f.status === 'pending')}
          className="px-6 py-2 rounded-full bg-primary text-primary-foreground 
            flex items-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? 'Processing...' : 'Process Files'}
        </button>
      </div>
    </motion.div>
  );
};

export default FileList;
