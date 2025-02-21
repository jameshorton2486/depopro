
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface ContentDisplayProps {
  content: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (delta: number) => void;
}

export const ContentDisplay = ({
  content,
  currentPage,
  totalPages,
  onPageChange,
}: ContentDisplayProps) => {
  return (
    <div className="bg-background p-6 rounded-lg shadow">
      <ScrollArea className="h-[600px] mb-4">
        <div className="prose max-w-none">
          {content}
        </div>
      </ScrollArea>

      <Separator className="my-4" />

      <div className="flex justify-between items-center">
        <Button
          onClick={() => onPageChange(-1)}
          disabled={currentPage === 1}
          variant="outline"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <Button
          onClick={() => onPageChange(1)}
          disabled={currentPage === totalPages}
          variant="outline"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

