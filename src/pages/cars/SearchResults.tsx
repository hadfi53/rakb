import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Vehicle } from "@/lib/types";
import { Card } from "@/components/ui/card";
import SearchBar from "@/components/SearchBar";
import CategoryButton from "@/components/cars/CategoryButton";
import AdvancedFilters from "@/components/cars/AdvancedFilters";
import SearchResultsHeader from "@/components/cars/SearchResultsHeader";
import EnhancedSearchResultsGrid from "@/components/cars/EnhancedSearchResultsGrid";
import TrendsCard from "@/components/cars/TrendsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useVehicleSearch } from "@/hooks/use-vehicle-search";
import NoVehiclesFound from "@/components/cars/NoVehiclesFound";

const carCategories = [
  "Toutes", "SUV", "Berline", "Sportive", "Luxe", "Électrique", "Familiale"
];

const exampleVehicles: Vehicle[] = [
  {
    id: "1",
    name: "Mercedes GLC 300",
    brand: "Mercedes",
    model: "GLC",
    year: 2023,
    price: 890,
    location: "Casablanca Centre",
    description: "SUV luxueux avec intérieur cuir et toit panoramique",
    transmission: "automatic",
    fuel: "essence",
    image_url: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=800",
    owner_id: "1",
    created_at: new Date().toISOString(),
    longitude: -7.589843,
    latitude: 33.573109,
    category: "SUV",
    rating: 4.8,
    reviews_count: 24,
    isPremium: true,
    available_units: 1,
    features: ["Cuir", "GPS", "Toit ouvrant", "Bluetooth"]
  },
  {
    id: "2",
    name: "BMW Série 5",
    brand: "BMW",
    model: "530i",
    year: 2023,
    price: 950,
    location: "Marrakech Guéliz",
    description: "Berline sportive avec pack M Sport",
    transmission: "automatic",
    fuel: "essence",
    image_url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=800",
    owner_id: "2",
    created_at: new Date().toISOString(),
    longitude: -8.008889,
    latitude: 31.631794,
    category: "Berline",
    rating: 4.9,
    reviews_count: 32,
    isPremium: true,
    available_units: 2,
    features: ["Pack M Sport", "Sièges chauffants", "CarPlay", "Harman Kardon"]
  },
  {
    id: "3",
    name: "Tesla Model 3",
    brand: "Tesla",
    model: "Model 3",
    year: 2023,
    price: 780,
    location: "Rabat Agdal",
    description: "Véhicule électrique performant avec Autopilot",
    transmission: "automatic",
    fuel: "electric",
    image_url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800",
    owner_id: "3",
    created_at: new Date().toISOString(),
    longitude: -6.849813,
    latitude: 33.991589,
    category: "Électrique",
    rating: 4.7,
    reviews_count: 18,
    isPremium: true,
    available_units: 1,
    features: ["Autopilot", "Toit en verre", "Supercharge", "Premium Audio"]
  }
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedTransmission, setSelectedTransmission] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("Toutes");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [minRating, setMinRating] = useState(0);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Get search parameters from URL
  const location = searchParams.get("location") || "";
  const datesParam = searchParams.get("dates") || "";
  let startDate = "";
  let endDate = "";
  
  if (datesParam) {
    // Expect format: start|end (each may contain time with colon)
    const parts = datesParam.split("|");
    if (parts.length === 2) {
      // Extract just the date part (YYYY-MM-DD) from YYYY-MM-DDTHH:MM format
      startDate = parts[0].split('T')[0];
      endDate = parts[1].split('T')[0];
    }
  }

  // Debug logging in development
  if (import.meta.env.DEV) {
    console.log('🔍 [SearchResults] Search parameters:', {
      location,
      startDate,
      endDate,
      datesParam
    });
  }
  
  // Use our custom hook for vehicle search
  const { 
    vehicles: filteredVehicles, 
    isLoading, 
    error,
    availableBrands,
    totalCount,
    filteredCount
  } = useVehicleSearch({
    location,
    startDate,
    endDate,
    category: selectedCategory,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    transmission: selectedTransmission,
    isPremium: showPremiumOnly,
    brand: selectedBrand,
    minRating
  });

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
          <p className="text-gray-600 mb-6">Impossible de charger les résultats. Veuillez réessayer ou modifier vos filtres.</p>
          <SearchBar />
        </div>
      </div>
    );
  }

  // Function to reset all filters
  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setSelectedBrand("all");
    setSelectedTransmission("all");
    setSelectedCategory("Toutes");
    setMinRating(0);
    setShowPremiumOnly(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-white/50 backdrop-blur-lg rounded-xl w-1/4" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-white/50 backdrop-blur-lg rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 relative transform hover:scale-[1.02] transition-transform duration-300">
          <SearchBar />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl blur-xl" />
        </div>

        <SearchResultsHeader
          count={filteredVehicles.length}
          location={searchParams.get("location")}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="w-full lg:w-72 space-y-4">
            <Card className="p-4 backdrop-blur-xl bg-white/80 border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center justify-between lg:hidden mb-4">
                <h3 className="font-semibold">Filtres</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetFilters}
                >
                  Réinitialiser
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Prix par jour
                    </label>
                    <span className="text-xs font-medium text-primary">
                      {priceRange[0]} - {priceRange[1]} Dh
                    </span>
                  </div>
                  <div className="space-y-4">
                    <div className="relative py-4">
                      <div className="absolute -top-2 left-0 right-0 flex justify-between text-xs text-gray-400">
                        <span>0</span>
                        <span>1000</span>
                      </div>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        step={50}
                        className="my-2 [&_.relative]:bg-gray-100 [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_[role=slider]]:shadow-md [&_.range]:bg-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          type="number"
                          value={priceRange[0]}
                          onChange={e => {
                            const value = Math.min(Math.max(0, +e.target.value), priceRange[1]);
                            setPriceRange([value, priceRange[1]]);
                          }}
                          className="pl-8 pr-4 text-sm h-8 bg-white focus:ring-primary"
                          min={0}
                          max={priceRange[1]}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Dh</span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          value={priceRange[1]}
                          onChange={e => {
                            const value = Math.max(Math.min(1000, +e.target.value), priceRange[0]);
                            setPriceRange([priceRange[0], value]);
                          }}
                          className="pl-8 pr-4 text-sm h-8 bg-white focus:ring-primary"
                          min={priceRange[0]}
                          max={1000}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">Dh</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "≤ 300 Dh", values: [0, 300] },
                        { label: "≤ 500 Dh", values: [0, 500] },
                        { label: "≤ 800 Dh", values: [0, 800] },
                        { label: "≤ 1000 Dh", values: [0, 1000] }
                      ].map((range) => (
                        <Button
                          key={range.label}
                          variant="outline"
                          size="sm"
                          className={`h-8 text-xs font-medium transition-all ${
                            priceRange[1] === range.values[1]
                              ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                              : "hover:border-primary/50 hover:text-primary/90"
                          }`}
                          onClick={() => setPriceRange(range.values)}
                        >
                          {range.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Catégorie
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                    {carCategories.map((category) => (
                      <CategoryButton
                        key={category}
                        category={category}
                        isSelected={selectedCategory === category}
                        onClick={() => setSelectedCategory(category)}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3 text-gray-700">
                    Note minimale
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 3, 4, 4.5].map((rating) => (
                      <Button
                        key={rating}
                        variant={minRating === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setMinRating(rating)}
                        className={`h-8 text-xs transition-all ${
                          minRating === rating
                            ? "bg-primary text-white"
                            : "hover:bg-primary/5"
                        }`}
                      >
                        {rating > 0 ? (
                          <div className="flex items-center gap-1">
                            {rating}
                            <Star className="w-3 h-3 fill-current" />
                          </div>
                        ) : (
                          "Tous"
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="w-full justify-between h-8 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4" />
                      Plus de filtres
                    </div>
                    {showAdvancedFilters ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>

                  {showAdvancedFilters && (
                    <AdvancedFilters
                      selectedBrand={selectedBrand}
                      setSelectedBrand={setSelectedBrand}
                      selectedTransmission={selectedTransmission}
                      setSelectedTransmission={setSelectedTransmission}
                      showPremiumOnly={showPremiumOnly}
                      setShowPremiumOnly={setShowPremiumOnly}
                      availableBrands={availableBrands}
                    />
                  )}
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 hidden lg:flex"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            </Card>

            <TrendsCard />
          </div>

          <div className="flex-1">
            {filteredVehicles.length > 0 ? (
              viewMode === "grid" ? (
                <EnhancedSearchResultsGrid 
                  vehicles={filteredVehicles} 
                  isLoading={isLoading} 
                />
              ) : (
                <div className="bg-white rounded-xl p-4 h-[600px] flex items-center justify-center">
                  <p className="text-gray-500">Carte en cours de développement</p>
                </div>
              )
            ) : (
              <NoVehiclesFound 
                location={location} 
                onReset={resetFilters} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
