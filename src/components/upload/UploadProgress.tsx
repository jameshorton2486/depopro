
import { Progress } from "@/components/ui/progress";

interface UploadProgressProps {
  progress: number;
}

const UploadProgress = ({ progress }: UploadProgressProps) => {
  return (
    <div className="w-full max-w-xs mt-4">
      <Progress value={progress} />
    </div>
  );
};

export default UploadProgress;
