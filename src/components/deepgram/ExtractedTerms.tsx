
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface ExtractedTerm {
  term: string;
  category: 'legal' | 'medical' | 'other';
  boost: number;
}

interface ExtractedTermsProps {
  terms: ExtractedTerm[];
}

export const ExtractedTerms = ({ terms }: ExtractedTermsProps) => {
  const getCategoryColor = (category: 'legal' | 'medical' | 'other') => {
    switch (category) {
      case 'legal':
        return 'bg-blue-500';
      case 'medical':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Extracted Terms</h3>
      {terms.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Upload documents to extract relevant terms
        </p>
      ) : (
        <ScrollArea className="h-[200px]">
          <div className="flex flex-wrap gap-2">
            {terms.map((term, index) => (
              <Badge
                key={`${term.term}-${index}`}
                variant="secondary"
                className={`${getCategoryColor(term.category)} text-white`}
              >
                {term.term} ({term.boost}x)
              </Badge>
            ))}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};
