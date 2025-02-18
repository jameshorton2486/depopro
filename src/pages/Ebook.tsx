
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Search, Book, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

type EbookContent = {
  title: string;
  content: string;
  currentPage: number;
  totalPages: number;
};

const EbookPage = () => {
  const [ebook, setEbook] = useState<EbookContent | null>(null);
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
        title: file.name,
        content: text,
        currentPage: 1,
        totalPages: Math.ceil(text.length / 2000) // Approximate 2000 characters per page
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
        <nav className="flex flex-col items-center mb-16 animate-fade-down">
          <div className="text-6xl font-semibold text-center mb-4 text-blue-500">
            Court Reporter's eBook
          </div>
          <a href="/" className="text-sm hover:text-primary/80 transition-colors">
            Back to Home
          </a>
        </nav>

        {!ebook ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background border rounded-lg p-8"
          >
            <div
              {...getRootProps()}
              className="border-2 border-dashed rounded-lg h-[280px] flex flex-col items-center justify-center cursor-pointer hover:border-primary/50"
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-12 h-12 mb-4 text-muted-foreground" />
              <p className="text-lg text-center text-muted-foreground">
                {isDragActive
                  ? "Drop the ebook here..."
                  : "Drag and drop your ebook here, or click to select"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Supported formats: PDF, TXT, DOCX
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
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
                className="bg-blue-500 text-white hover:bg-blue-600"
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
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <Book className="w-5 h-5 mr-2" />
                  {ebook.title}
                </h2>
                <div className="text-sm text-muted-foreground">
                  Page {ebook.currentPage} of {ebook.totalPages}
                </div>
              </div>

              <ScrollArea className="h-[500px] mb-4">
                <div className="prose max-w-none">
                  {getCurrentPageContent()}
                </div>
              </ScrollArea>

              <div className="flex justify-between mt-4">
                <Button
                  onClick={() => changePage(-1)}
                  disabled={ebook.currentPage === 1}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Previous Page
                </Button>
                <Button
                  onClick={() => changePage(1)}
                  disabled={ebook.currentPage === ebook.totalPages}
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  Next Page
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default EbookPage;
