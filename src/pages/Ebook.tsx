
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { TableOfContents } from "@/components/ebook/TableOfContents";
import { SearchBar } from "@/components/ebook/SearchBar";
import { SearchResults } from "@/components/ebook/SearchResults";
import { ContentDisplay } from "@/components/ebook/ContentDisplay";
import { ebookContent } from "@/data/ebookContent";

type EbookContent = {
  title: string;
  content: string;
  currentPage: number;
  totalPages: number;
  chapters: { title: string; page: number }[];
};

const EbookPage = () => {
  const [ebook, setEbook] = useState<EbookContent>({
    ...ebookContent,
    currentPage: 1,
  });
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
        ...ebookContent,
        content: text,
        currentPage: 1,
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
    if (!searchQuery) return;

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
    const start = (ebook.currentPage - 1) * 2000;
    const end = start + 2000;
    return ebook.content.slice(start, end);
  };

  const changePage = (delta: number) => {
    const newPage = ebook.currentPage + delta;
    if (newPage >= 1 && newPage <= ebook.totalPages) {
      setEbook(prev => ({ ...prev, currentPage: newPage }));
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
          <TableOfContents
            chapters={ebook.chapters}
            onChapterSelect={(page) => setEbook(prev => ({ ...prev, currentPage: page }))}
          />

          <div className="space-y-6">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
            />

            <SearchResults results={searchResults} />

            <ContentDisplay
              content={getCurrentPageContent()}
              currentPage={ebook.currentPage}
              totalPages={ebook.totalPages}
              onPageChange={changePage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EbookPage;

