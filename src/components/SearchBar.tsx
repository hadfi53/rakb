import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MapPin, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { moroccanCities } from "@/lib/data/moroccan-cities";
import { DateRange } from "react-day-picker";
import { useIsMobile } from "@/hooks/use-mobile";

const RECENT_SEARCHES_KEY = 'recent_searches';
const MAX_RECENT_SEARCHES = 5;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const SearchBar = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [location, setLocation] = useState("");
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pickupTime, setPickupTime] = useState("12");
  const [returnTime, setReturnTime] = useState("12");
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.length > 0) {
      const filtered = moroccanCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSuggestions(true);
    } else {
      setFilteredCities(moroccanCities);
      setShowSuggestions(true);
    }
  };

  const addToRecentSearches = (city: string) => {
    const updated = [city, ...recentSearches.filter(s => s !== city)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleCitySelect = (city: string) => {
    setLocation(city);
    setShowSuggestions(false);
    setShowLocationSheet(false);
    addToRecentSearches(city);
  };

  const performSearch = () => {
    // Validate required fields
    if (!location) {
      // Focus the location input if empty
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }
    
    if (!dateRange?.from || !dateRange?.to) {
      // Open date dialog if dates not selected
      setShowDateDialog(true);
      return;
    }
    
    setIsSearching(true);
    
    // Format dates for the API
    const formattedStartDate = format(dateRange.from, 'yyyy-MM-dd');
    const formattedEndDate = format(dateRange.to, 'yyyy-MM-dd');
    // Format as start|end to avoid parsing issues
    const formattedDates = `${formattedStartDate}T${pickupTime}:00|${formattedEndDate}T${returnTime}:00`;
    
    addToRecentSearches(location);
    
    // Build search params
    const searchParams = new URLSearchParams({
      location: location,
      dates: formattedDates,
    });
    
    if (import.meta.env.DEV) {
    console.log("Recherche avec les paramètres:", {
      location,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      pickupTime,
      returnTime
    });
    }
    
    // Navigate to search results page
    navigate(`/search?${searchParams.toString()}`);
    
    // Reset search state after navigation
    setIsSearching(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  const renderLocationInput = () => {
    return (
      <div className="flex-1 relative">
        <div className="flex items-center gap-3 h-14 md:h-12 px-4 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
          <MapPin className="text-primary flex-shrink-0" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Où souhaitez-vous louer ?"
            className="flex-1 border-0 focus:ring-0 p-0 h-full bg-transparent outline-none text-base"
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
          />
        </div>

        {showSuggestions && (
          <div
            ref={suggestionRef}
            className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-[300px] overflow-auto z-50"
          >
            {recentSearches.length > 0 && !location && (
              <div className="p-2">
                <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-500">
                  <Clock size={14} />
                  Recherches récentes
                </div>
                {recentSearches.map((city) => (
                  <button
                    key={`recent-${city}`}
                    type="button"
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => handleCitySelect(city)}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="text-gray-400" size={14} />
                      {city}
                    </div>
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-2"></div>
              </div>
            )}

            {filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => handleCitySelect(city)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="text-gray-400" size={14} />
                  {city}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <form onSubmit={handleSearch} className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 p-4">
          {renderLocationInput()}
          
          <div className="flex-1">
            <Button
              variant="outline"
              className="w-full flex items-center gap-3 h-14 md:h-12 px-4 border border-gray-200 rounded-xl"
              onClick={() => setShowDateDialog(true)}
            >
              <CalendarDays className="text-primary flex-shrink-0" size={20} />
              <span className="flex-grow text-left truncate">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "d MMM", { locale: fr })} -{" "}
                      {format(dateRange.to, "d MMM", { locale: fr })}
                    </>
                  ) : (
                    format(dateRange.from, "d MMM", { locale: fr })
                  )
                ) : (
                  "Sélectionnez les dates"
                )}
              </span>
            </Button>
          </div>

          <Button 
            type="submit" 
            className="w-full md:w-auto bg-primary hover:bg-primary-dark h-14 md:h-12 text-lg md:text-base font-medium rounded-xl"
            disabled={isSearching}
          >
            {isSearching ? (
              <div className="flex items-center">
                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                Recherche...
              </div>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Rechercher
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Location Sheet for Mobile */}
      <Sheet open={showLocationSheet && isMobile} onOpenChange={setShowLocationSheet}>
        <SheetContent side="bottom" className="h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <div className="sticky top-0 bg-white px-4 pt-6 pb-4 border-b border-gray-100">
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  autoFocus
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="Rechercher une ville"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-auto px-4 py-4">
              {recentSearches.length > 0 && !location && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Recherches récentes</h3>
                  {recentSearches.map((city) => (
                    <button
                      key={`recent-${city}`}
                      type="button"
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                      onClick={() => handleCitySelect(city)}
                    >
                      <Clock className="text-gray-400" size={18} />
                      <span>{city}</span>
                    </button>
                  ))}
                </div>
              )}
              {filteredCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={() => handleCitySelect(city)}
                >
                  <MapPin className="text-gray-400" size={18} />
                  <span>{city}</span>
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Date Dialog */}
      <Dialog open={showDateDialog} onOpenChange={setShowDateDialog}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogTitle className="sr-only">Sélection des dates de location</DialogTitle>
          <DialogDescription className="sr-only">Choisissez les dates et heures de prise et retour du véhicule</DialogDescription>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Heure de prise</Label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Heure de retour</Label>
                <Select value={returnTime} onValueChange={setReturnTime}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Heure" />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((hour) => (
                      <SelectItem key={hour} value={hour.toString()}>
                        {hour.toString().padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={isMobile ? 1 : 2}
              locale={fr}
              className="rounded-md mx-auto"
            />
          </div>
          <DialogFooter className="px-6 pb-6 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDateDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (dateRange?.from && dateRange?.to) {
                  setShowDateDialog(false);
                  // Si la location est déjà remplie, lancer directement la recherche
                  if (location) {
                    performSearch();
                  }
                }
              }}
              disabled={!dateRange?.from || !dateRange?.to}
              className="w-full sm:w-auto"
            >
              {location ? (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Rechercher
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SearchBar;
