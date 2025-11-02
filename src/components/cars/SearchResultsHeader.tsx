
import { LayoutGrid, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchResultsHeaderProps {
  count: number;
  location?: string | null;
  viewMode: "grid" | "map";
  setViewMode: (mode: "grid" | "map") => void;
}

const SearchResultsHeader = ({
  count,
  location,
  viewMode,
  setViewMode,
}: SearchResultsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
      <div className="space-y-1 w-full sm:w-auto">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
          {count} véhicules trouvés
        </h1>
        {location && (
          <p className="text-sm sm:text-base text-gray-600 flex items-center gap-2">
            <span className="text-primary">📍</span>
            à {location}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm p-1 rounded-lg w-full sm:w-auto">
        <Button
          variant={viewMode === "grid" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("grid")}
          className="flex-1 sm:flex-none transition-all duration-300 hover:scale-105"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="ml-2">Grille</span>
        </Button>
        <Button
          variant={viewMode === "map" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("map")}
          className="flex-1 sm:flex-none transition-all duration-300 hover:scale-105"
        >
          <Map className="w-4 h-4" />
          <span className="ml-2">Carte</span>
        </Button>
      </div>
    </div>
  );
};

export default SearchResultsHeader;
