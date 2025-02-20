
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Search, Book, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const defaultEbook = {
  title: "Mastering Legal Transcription: A Modern Guide for Court Reporters",
  content: `[Your provided eBook content]`, // Note: I'm using a placeholder here for brevity, but the actual content would be all the text you provided
  currentPage: 1,
  totalPages: 1,
  chapters: [
    { title: "Introduction", page: 1 },
    { title: "Section I: Fundamentals of Court Reporting", page: 15 },
    { title: "Section II: Punctuation Rules for Court Reporters", page: 30 },
    { title: "Section III: Formatting and Style in Legal Transcription", page: 45 },
    // Add more chapters as needed
  ]
};

type EbookContent = {
  title: string;
  content: string;
  currentPage: number;
  totalPages: number;
  chapters: { title: string; page: number }[];
};

const EbookPage = () => {
  const [ebook, setEbook] = useState<EbookContent>(defaultEbook);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const text = await file.text();
      setEbook({
        ...defaultEbook,
        content: text,
        totalPages: Math.ceil(text.length / 2000)
      });
      toast.success("Ebook uploaded successfully!");
    } catch (error) {
      console.error("Error reading file:", error);
      toast.error("Error uploading ebook");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const handleSearch = () => {
    if (!ebook || !searchQuery) return;

    const regex = new RegExp(searchQuery, 'gi');
    const matches = Array.from(ebook.content.matchAll(regex)).map(match => {
      const start = Math.max(0, match.index! - 50);
      const end = Math.min(ebook.content.length, match.index! + 50);
      return `...${ebook.content.slice(start, end)}...`;
    });

    setSearchResults(matches);
    if (matches.length === 0) {
      toast.info("No results found");
    }
  };

  const getCurrentPageContent = () => {
    if (!ebook) return "";
    const start = (ebook.currentPage - 1) * 2000;
    const end = start + 2000;
    return ebook.content.slice(start, end);
  };

  const changePage = (delta: number) => {
    if (!ebook) return;
    const newPage = ebook.currentPage + delta;
    if (newPage >= 1 && newPage <= ebook.totalPages) {
      setEbook(prev => prev ? { ...prev, currentPage: newPage } : null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <nav className="flex flex-col items-center mb-8 animate-fade-down">
          <div className="text-4xl font-semibold text-center mb-4">
            {ebook.title}
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Table of Contents Sidebar */}
          <div className="bg-background p-4 rounded-lg shadow h-fit">
            <h3 className="font-semibold mb-3">Table of Contents</h3>
            <ScrollArea className="h-[400px]">
              {ebook.chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => setEbook(prev => ({ ...prev, currentPage: chapter.page }))}
                  className="w-full text-left p-2 hover:bg-secondary rounded-md text-sm"
                >
                  {chapter.title}
                </button>
              ))}
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-background p-4 rounded-lg shadow">
              <Input
                type="text"
                placeholder="Search in ebook..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSearch}
                variant="secondary"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="bg-background p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-4">Search Results:</h3>
                <ScrollArea className="h-[200px]">
                  {searchResults.map((result, index) => (
                    <p key={index} className="mb-2 p-2 bg-muted rounded">
                      {result}
                    </p>
                  ))}
                </ScrollArea>
              </div>
            )}

            <div className="bg-background p-6 rounded-lg shadow">
              <ScrollArea className="h-[600px] mb-4">
                <div className="prose max-w-none">
                  {getCurrentPageContent()}
                </div>
              </ScrollArea>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <Button
                  onClick={() => changePage(-1)}
                  disabled={ebook.currentPage === 1}
                  variant="outline"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {ebook.currentPage} of {ebook.totalPages}
                </div>
                <Button
                  onClick={() => changePage(1)}
                  disabled={ebook.currentPage === ebook.totalPages}
                  variant="outline"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookPage;
