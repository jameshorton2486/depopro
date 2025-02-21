
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar = ({
  searchQuery,
  onSearchChange,
  onSearch,
}: SearchBarProps) => {
  return (
    <div className="flex items-center gap-4 bg-background p-4 rounded-lg shadow">
      <Input
        type="text"
        placeholder="Search in ebook..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1"
      />
      <Button onClick={onSearch} variant="secondary">
        <Search className="w-4 h-4 mr-2" />
        Search
      </Button>
    </div>
  );
};

