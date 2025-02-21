
import { ScrollArea } from "@/components/ui/scroll-area";

type Chapter = {
  title: string;
  page: number;
};

interface TableOfContentsProps {
  chapters: Chapter[];
  onChapterSelect: (page: number) => void;
}

export const TableOfContents = ({
  chapters,
  onChapterSelect,
}: TableOfContentsProps) => {
  return (
    <div className="bg-background p-4 rounded-lg shadow h-fit sticky top-4">
      <h3 className="font-semibold mb-3">Table of Contents</h3>
      <ScrollArea className="h-[600px]">
        {chapters.map((chapter, index) => (
          <button
            key={index}
            onClick={() => onChapterSelect(chapter.page)}
            className="w-full text-left p-2 hover:bg-secondary rounded-md text-sm mb-1"
          >
            {chapter.title}
          </button>
        ))}
      </ScrollArea>
    </div>
  );
};

