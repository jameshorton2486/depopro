
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TransCorrection = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
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

        <div className="flex items-center justify-center h-[400px]">
          <p className="text-muted-foreground">New content coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default TransCorrection;
