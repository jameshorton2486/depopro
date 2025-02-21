
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const defaultEbook = {
  title: "Mastering Legal Transcription: A Modern Guide for Court Reporters",
  content: `The Critical Role of Precision in Modern Legal Documentation

A. The Importance of Precise Language and Verbatim Transcription in Court Reporting
Legal proceedings hinge on the unassailable accuracy of their records. Verbatim transcription—the practice of capturing every spoken word, hesitation, and nonverbal utterance—serves as the bedrock of judicial integrity...

[Your provided content continues here...]`,
  currentPage: 1,
  totalPages: 1,
  chapters: [
    { title: "Introduction", page: 1 },
    { title: "A. The Importance of Precise Language and Verbatim Transcription", page: 2 },
    { title: "B. Overview of the Book's Purpose and Structure", page: 3 },
    { title: "C. Ensuring Accuracy, Clarity, and Legal Admissibility", page: 4 },
    { title: "Section I: Fundamentals of Court Reporting", page: 5 },
    { title: "1.1 The Role of Court Reporters", page: 6 },
    { title: "1.2 Legal Documentation and Standards", page: 7 },
    { title: "1.3 The Role of Punctuation in Legal Transcription", page: 8 },
    { title: "Section II: Punctuation Rules for Court Reporters", page: 9 },
    { title: "2.1 End Marks", page: 10 },
    { title: "2.2 Internal Punctuation", page: 11 },
    { title: "2.3 Quotation Marks and Apostrophes", page: 12 },
    { title: "2.4 Hyphens, Dashes, and Slashes", page: 13 },
    { title: "2.5 Ellipsis and Brackets", page: 14 },
    { title: "Section III: Formatting and Style", page: 15 },
    { title: "Section IV: Proofreading and Quality Control", page: 16 },
    { title: "Section V: Digital Production & Industry Trends", page: 17 },
    { title: "Section VI: Templates & Quick References", page: 18 },
    { title: "Appendices & Bonus Resources", page: 19 }
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
      <div className="container mx-auto px-4 max-w-6xl">
        <nav className="flex flex-col items-center mb-8 animate-fade-down">
          <div className="text-4xl font-semibold text-center mb-4">
            {ebook.title}
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-6">
          {/* Table of Contents Sidebar */}
          <div className="bg-background p-4 rounded-lg shadow h-fit sticky top-4">
            <h3 className="font-semibold mb-3">Table of Contents</h3>
            <ScrollArea className="h-[600px]">
              {ebook.chapters.map((chapter, index) => (
                <button
                  key={index}
                  onClick={() => setEbook(prev => ({ ...prev, currentPage: chapter.page }))}
                  className="w-full text-left p-2 hover:bg-secondary rounded-md text-sm mb-1"
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
