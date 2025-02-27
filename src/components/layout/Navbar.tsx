
import { Link } from "react-router-dom";
import { FileText, Edit2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="flex flex-col items-center mb-8 animate-fade-down">
      <h1 className="text-6xl font-semibold text-center mb-6 text-blue-500">
        Create Transcript
      </h1>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/deepgram">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 hover:bg-white/70 text-primary shadow-md hover:shadow-lg transition-all min-w-[140px]"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Create Transcript</span>
          </Button>
        </Link>
        <Link to="/transcorrection">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 hover:bg-white/70 text-primary shadow-md hover:shadow-lg transition-all min-w-[140px]"
          >
            <Edit2 className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Correct Transcript</span>
          </Button>
        </Link>
        <Link to="/model_training">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/90 hover:bg-white/70 text-primary shadow-md hover:shadow-lg transition-all min-w-[140px]"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span className="whitespace-nowrap">Train Model</span>
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
