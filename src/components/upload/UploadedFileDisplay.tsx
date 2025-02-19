
import { FileText } from "lucide-react";

interface UploadedFileDisplayProps {
  fileName: string;
}

const UploadedFileDisplay = ({ fileName }: UploadedFileDisplayProps) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <FileText className="w-8 h-8 text-green-500" />
      <p className="text-sm font-medium">{fileName}</p>
      <p className="text-sm text-muted-foreground">File uploaded successfully</p>
    </div>
  );
};

export default UploadedFileDisplay;
