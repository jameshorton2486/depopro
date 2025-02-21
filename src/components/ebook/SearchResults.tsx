
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResultsProps {
  results: string[];
}

export const SearchResults = ({ results }: SearchResultsProps) => {
  if (results.length === 0) return null;

  return (
    <div className="bg-background p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-4">Search Results:</h3>
      <ScrollArea className="h-[200px]">
        {results.map((result, index) => (
          <p key={index} className="mb-2 p-2 bg-muted rounded">
            {result}
          </p>
        ))}
      </ScrollArea>
    </div>
  );
};

