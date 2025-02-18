
import { FileAudio, FileJson, FileText } from "lucide-react";

type RequiredFiles = {
  audio?: File;
  json?: File;
  docx?: File;
};

interface FileUploadStatusProps {
  requiredFiles: RequiredFiles;
}

const FileUploadStatus = ({ requiredFiles }: FileUploadStatusProps) => {
  return (
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
  );
};

export default FileUploadStatus;
