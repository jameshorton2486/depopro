
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TranscriptHeader = () => {
  return (
    <div className="flex items-center justify-between mb-8">
      <Link 
        to="/upload" 
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Upload
      </Link>
      <h1 className="text-2xl font-bold">Transcript Correction</h1>
    </div>
  );
};

export default TranscriptHeader;
