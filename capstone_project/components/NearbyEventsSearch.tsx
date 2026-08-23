"use client";

import { useState, useEffect, useRef, useMemo } from "react";

/**
 * NearbyEventsSearch - A search component with location autocomplete
 * Features a city/address input with autocomplete dropdown and location button
 */
export default function NearbyEventsSearch() {
  // State for storing user's location coordinates from geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  
  // State for geocoding results (city/address search)
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [geocodedLatitude, setGeocodedLatitude] = useState<number | null>(null);
  const [geocodedLongitude, setGeocodedLongitude] = useState<number | null>(null);
  
  // State for input field value
  const [searchInput, setSearchInput] = useState("");
  
  // State for autocomplete suggestions
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // State for loading indicators
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  
  // State for error messages
  const [error, setError] = useState<string | null>(null);
  
  // State for storing nearby events from API
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  
  // State for sorting option
  const [sortBy, setSortBy] = useState<string>("nearest");
  
  // Filter state
  const [filters, setFilters] = useState({
    category: "all",
    minPrice: "",
    maxPrice: "",
    verifiedOnly: false,
    dateFilter: "any",
    availableOnly: true,
  });
  
  // State for showing/hiding advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Ref for dropdown container (for click outside detection)
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Debounce hook - delays execution until user stops typing
   * @param value - The value to debounce
   * @param delay - Delay in milliseconds (default 500ms)
   * @returns Debounced value
   */
  const useDebounce = (value: string, delay: number = 500) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      // Set up timer to update debounced value after delay
      const timer = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cleanup: clear timer if value changes before delay
      return () => {
        clearTimeout(timer);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Use debounce on search input (500ms delay)
  const debouncedSearchInput = useDebounce(searchInput, 500);

  /**
   * Fetches location suggestions from Nominatim API
   * Called when debounced input changes
   */
  useEffect(() => {
    // Only search if input has at least 3 characters
    if (debouncedSearchInput.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Fetch suggestions from Nominatim API
    const fetchSuggestions = async () => {
      setIsSearchingSuggestions(true);
      setError(null);

      try {
        // Nominatim API request for autocomplete
        // Parameters:
        // - q: search query
        // - format: json response
        // - limit: max 5 results
        // - addressdetails: include address components
        const apiUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(debouncedSearchInput)}&format=json&limit=5&addressdetails=1`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        
        // Update suggestions
        if (data && data.length > 0) {
          setSuggestions(data);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchInput]);

  /**
   * Handles click outside dropdown to close it
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the dropdown container
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup: remove event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /**
   * Handles Escape key press to close dropdown
   */
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleEscapeKey);

    // Cleanup: remove event listener
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  /**
   * Handles selecting a location from the autocomplete dropdown
   * @param location - Selected location object from Nominatim
   */
  const handleLocationSelect = (location: any) => {
    // Extract coordinates
    const lat = parseFloat(location.lat);
    const lon = parseFloat(location.lon);

    // Store selected location in state
    setGeocodedLatitude(lat);
    setGeocodedLongitude(lon);
    setDisplayName(location.display_name);
    
    // Update input with selected location name
    setSearchInput(location.display_name);
    
    // Close dropdown
    setShowSuggestions(false);
    
    // Clear any errors
    setError(null);
    
    // Fetch nearby events using selected coordinates
    fetchNearbyEvents(lat, lon);
  };

  /**
   * Filters events based on selected filter criteria
   * Creates a copy of the array to avoid modifying the original
   */
  const getFilteredEvents = () => {
    // Create a copy of the sorted events to filter
    let filtered = [...sortedEvents];

    // Filter by category
    if (filters.category !== "all") {
      filtered = filtered.filter((event) => event.category === filters.category.toUpperCase());
    }

    // Filter by price range
    if (filters.minPrice !== "") {
      const minPrice = parseFloat(filters.minPrice);
      filtered = filtered.filter((event) => event.price >= minPrice);
    }
    if (filters.maxPrice !== "") {
      const maxPrice = parseFloat(filters.maxPrice);
      filtered = filtered.filter((event) => event.price <= maxPrice);
    }

    // Filter by verified tickets only
    if (filters.verifiedOnly) {
      filtered = filtered.filter((event) => event.isVerified === true);
    }

    // Filter by event date
    if (filters.dateFilter !== "any") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthFromNow = new Date(today);
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.eventDate);
        
        switch (filters.dateFilter) {
          case "today":
            return eventDate >= today && eventDate < tomorrow;
          case "tomorrow":
            return eventDate >= tomorrow && eventDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
          case "this-week":
            return eventDate >= today && eventDate < weekFromNow;
          case "this-month":
            return eventDate >= today && eventDate < monthFromNow;
          default:
            return true;
        }
      });
    }

    // Filter by available tickets only
    if (filters.availableOnly) {
      filtered = filtered.filter((event) => event.status === "ACTIVE");
    }

    return filtered;
  };

  /**
   * Sorts events based on the selected sort option
   * Creates a copy of the array to avoid mutating the original
   */
  const getSortedEvents = () => {
    // Create a copy of the array to avoid modifying the original
    const sorted = [...nearbyEvents];

    switch (sortBy) {
      case "nearest":
        // Sort by distance ascending (nearest first)
        sorted.sort((a, b) => a.distance - b.distance);
        break;

      case "price-low":
        // Sort by price ascending (lowest first)
        sorted.sort((a, b) => a.price - b.price);
        break;

      case "price-high":
        // Sort by price descending (highest first)
        sorted.sort((a, b) => b.price - a.price);
        break;

      case "date-earliest":
        // Sort by event date ascending (earliest first)
        sorted.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
        break;

      case "date-latest":
        // Sort by event date descending (latest first)
        sorted.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
        break;

      case "verified":
        // Sort by verified status (verified first), maintain order within groups
        sorted.sort((a, b) => {
          if (a.isVerified && !b.isVerified) return -1;
          if (!a.isVerified && b.isVerified) return 1;
          return 0; // Maintain original order
        });
        break;

      default:
        // Default: sort by nearest
        sorted.sort((a, b) => a.distance - b.distance);
    }

    return sorted;
  };

  // Memoize sorted events to avoid recalculating on every render
  const sortedEvents = useMemo(() => getSortedEvents(), [nearbyEvents, sortBy]);
  
  // Memoize filtered events to avoid recalculating on every render
  const filteredEvents = useMemo(() => getFilteredEvents(), [sortedEvents, filters]);

  /**
   * Resets all filters to default values
   */
  const resetFilters = () => {
    setFilters({
      category: "all",
      minPrice: "",
      maxPrice: "",
      verifiedOnly: false,
      dateFilter: "any",
      availableOnly: true,
    });
  };

  /**
   * Fetches nearby events from the API using coordinates
   * @param lat - Latitude
   * @param lng - Longitude
   */
  const fetchNearbyEvents = async (lat: number, lng: number) => {
    setIsLoadingEvents(true);
    setError(null);
    setNearbyEvents([]);

    try {
      // API request to get nearby events
      // Uses the /api/events/nearby endpoint with latitude, longitude, and radius
      const response = await fetch(
        `/api/events/nearby?latitude=${lat}&longitude=${lng}&radius=25`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch nearby events");
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Store events in state (original array from API)
        setNearbyEvents(data.data);
      } else {
        setError(data.message || "Unable to load nearby events. Please try again.");
      }
    } catch (err) {
      // Handle network errors or other issues
      setError("Unable to load nearby events. Please try again.");
    } finally {
      // Always stop loading
      setIsLoadingEvents(false);
    }
  };

  /**
   * Handles the "Use My Location" button click
   * Requests browser geolocation permission and retrieves coordinates
   */
  const handleUseMyLocation = async () => {
    // Reset previous states
    setError(null);
    setLatitude(null);
    setLongitude(null);
    setDisplayName(null);
    setGeocodedLatitude(null);
    setGeocodedLongitude(null);
    setNearbyEvents([]);
    setSortBy("nearest"); // Reset sort to default
    resetFilters(); // Reset filters to default
    setSearchInput("");
    setSuggestions([]);
    setIsLoadingLocation(true);

    // Check if browser supports geolocation
    if (!navigator.geolocation) {
      setError("Your browser does not support geolocation. Please enter your city manually.");
      setIsLoadingLocation(false);
      return;
    }

    // Request current position from browser
    navigator.geolocation.getCurrentPosition(
      // Success callback - user granted permission
      async (position) => {
        // Extract latitude and longitude from position object
        const { latitude: lat, longitude: lng } = position.coords;
        
        // Store coordinates in state
        setLatitude(lat);
        setLongitude(lng);
        setIsLoadingLocation(false);
        
        // Fetch nearby events using the obtained coordinates
        await fetchNearbyEvents(lat, lng);
      },
      
      // Error callback - permission denied or other errors
      (err) => {
        setIsLoadingLocation(false);
        
        // Handle different error types with user-friendly messages
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enter your city manually.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please enter your city manually.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again or enter your city manually.");
            break;
          default:
            setError("An unknown error occurred. Please enter your city manually.");
            break;
        }
      },
      
      // Optional: Configure geolocation options
      {
        enableHighAccuracy: true, // Request high accuracy (GPS if available)
        timeout: 10000, // 10 second timeout
        maximumAge: 0 // Don't use cached position
      }
    );
  };

  // Get display text for current sort option
  const getSortLabel = (value: string): string => {
    switch (value) {
      case "nearest":
        return "Nearest";
      case "price-low":
        return "Lowest Price";
      case "price-high":
        return "Highest Price";
      case "date-earliest":
        return "Earliest Event Date";
      case "date-latest":
        return "Latest Event Date";
      case "verified":
        return "Verified Tickets First";
      default:
        return "Nearest";
    }
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.category !== "all" ||
      filters.minPrice !== "" ||
      filters.maxPrice !== "" ||
      filters.verifiedOnly ||
      filters.dateFilter !== "any" ||
      !filters.availableOnly
    );
  };

  return (
    // Main card container with modern styling
    <div className="w-full max-w-7xl mx-auto">
      <div className="rounded-lg border border-hairline bg-surface-1 p-6 shadow-sm sm:p-8">
        {/* Heading section */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Find Nearby Events
          </h2>
          <p className="mt-3 text-base text-ink-muted sm:text-lg">
            Enter your city or use your current location.
          </p>
        </div>

        {/* Search input with autocomplete and Use My Location button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          {/* Location search input with autocomplete dropdown */}
          <div className="relative flex-1" ref={dropdownRef}>
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Search city, locality or address..."
              className="h-12 w-full rounded-md border border-hairline bg-surface-0 px-4 text-base text-ink placeholder:text-ink-tertiary outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
            />

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 mt-2 w-full rounded-lg border border-hairline bg-surface-1 shadow-lg overflow-hidden">
                {/* Searching indicator */}
                {isSearchingSuggestions && (
                  <div className="flex items-center gap-3 p-4 text-ink-muted">
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <p className="text-sm">Searching locations...</p>
                  </div>
                )}

                {/* No results message */}
                {!isSearchingSuggestions && suggestions.length === 0 && debouncedSearchInput.length >= 3 && (
                  <div className="p-4 text-center text-sm text-ink-muted">
                    No locations found.
                  </div>
                )}

                {/* Suggestions list */}
                {!isSearchingSuggestions && suggestions.length > 0 && (
                  <div className="max-h-80 overflow-y-auto">
                    {suggestions.map((location, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleLocationSelect(location)}
                        className="flex items-start gap-3 w-full p-3 text-left transition hover:bg-surface-0 border-b border-hairline last:border-b-0"
                      >
                        {/* Location icon */}
                        <svg
                          className="h-5 w-5 text-primary flex-shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>

                        {/* Location name */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">
                            {location.display_name.split(',')[0]}
                          </p>
                          <p className="text-xs text-ink-muted line-clamp-2">
                            {location.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Use My Location button */}
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLoadingLocation || isLoadingEvents}
            className="h-12 rounded-md border border-hairline bg-surface-0 px-6 text-base font-semibold text-ink transition hover:bg-surface-1 hover:border-hairline-strong focus:outline-none focus:ring-2 focus:ring-primary-focus/50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isLoadingLocation ? "Getting Location..." : "Use My Location"}
          </button>
        </div>

        {/* Advanced Filters Toggle Button */}
        {!isLoadingEvents && !error && nearbyEvents.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-focus transition"
            >
              <svg
                className={`h-5 w-5 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
            </button>
          </div>
        )}

        {/* Advanced Filters Section */}
        {showAdvancedFilters && !isLoadingEvents && !error && (
          <div className="mt-6 rounded-lg border border-hairline bg-surface-0 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Event Category Filter */}
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-ink mb-2">
                  Event Category
                </label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full h-10 rounded-md border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                >
                  <option value="all">All Categories</option>
                  <option value="music">Music</option>
                  <option value="sports">Sports</option>
                  <option value="theatre">Theatre</option>
                  <option value="comedy">Comedy</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Event Date Filter */}
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-ink mb-2">
                  Event Date
                </label>
                <select
                  id="date-filter"
                  value={filters.dateFilter}
                  onChange={(e) => setFilters({ ...filters, dateFilter: e.target.value })}
                  className="w-full h-10 rounded-md border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                >
                  <option value="any">Any Date</option>
                  <option value="today">Today</option>
                  <option value="tomorrow">Tomorrow</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                </select>
              </div>

              {/* Minimum Price */}
              <div>
                <label htmlFor="min-price" className="block text-sm font-medium text-ink mb-2">
                  Minimum Price ($)
                </label>
                <input
                  id="min-price"
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  placeholder="0"
                  min="0"
                  className="w-full h-10 rounded-md border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                />
              </div>

              {/* Maximum Price */}
              <div>
                <label htmlFor="max-price" className="block text-sm font-medium text-ink mb-2">
                  Maximum Price ($)
                </label>
                <input
                  id="max-price"
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="No limit"
                  min="0"
                  className="w-full h-10 rounded-md border border-hairline bg-surface-1 px-3 text-sm text-ink outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                />
              </div>

              {/* Verified Tickets Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="verified-only"
                  type="checkbox"
                  checked={filters.verifiedOnly}
                  onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-hairline text-primary focus:ring-2 focus:ring-primary-focus/50"
                />
                <label htmlFor="verified-only" className="text-sm font-medium text-ink cursor-pointer">
                  Show Verified Tickets Only
                </label>
              </div>

              {/* Available Tickets Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  id="available-only"
                  type="checkbox"
                  checked={filters.availableOnly}
                  onChange={(e) => setFilters({ ...filters, availableOnly: e.target.checked })}
                  className="h-4 w-4 rounded border-hairline text-primary focus:ring-2 focus:ring-primary-focus/50"
                />
                <label htmlFor="available-only" className="text-sm font-medium text-ink cursor-pointer">
                  Show Available Tickets Only
                </label>
              </div>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t border-hairline">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-primary hover:text-primary-focus transition"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator for geolocation */}
        {isLoadingLocation && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-3 text-ink-muted">
              {/* Spinner icon */}
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-base">Getting your location...</p>
            </div>
          </div>
        )}

        {/* Loading indicator for fetching events */}
        {isLoadingEvents && (
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-3 text-ink-muted">
              {/* Spinner icon */}
              <svg
                className="h-5 w-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-base">Finding nearby events...</p>
            </div>
          </div>
        )}

        {/* Error message display */}
        {error && !isLoadingEvents && (
          <div className="mt-6 rounded-md border border-semantic-error/30 bg-semantic-error/10 p-4">
            <div className="flex items-start gap-3">
              {/* Error icon */}
              <svg
                className="h-5 w-5 text-semantic-error flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm text-semantic-error">{error}</p>
            </div>
          </div>
        )}

        {/* Display geocoded location when search is successful */}
        {geocodedLatitude && geocodedLongitude && displayName && !isLoadingEvents && !error && (
          <div className="mt-6 rounded-md border border-hairline bg-surface-0 p-4">
            <h4 className="text-base font-semibold text-ink mb-2">
              Location Found
            </h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-ink-muted">Address: </span>
                <span className="text-ink">{displayName}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-ink-muted">Latitude: </span>
                  <span className="font-mono text-ink">{geocodedLatitude.toFixed(4)}</span>
                </div>
                <div>
                  <span className="text-ink-muted">Longitude: </span>
                  <span className="font-mono text-ink">{geocodedLongitude.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display current coordinates from geolocation when successfully retrieved */}
        {latitude && longitude && !isLoadingLocation && !error && !geocodedLatitude && !isLoadingEvents && (
          <div className="mt-6 rounded-md border border-hairline bg-surface-0 p-4">
            <h4 className="text-base font-semibold text-ink mb-2">
              Current Location
            </h4>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-ink-muted">Latitude: </span>
                <span className="font-mono text-ink">{latitude.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-ink-muted">Longitude: </span>
                <span className="font-mono text-ink">{longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Display nearby events or empty state */}
        {!isLoadingEvents && !error && (
          <div className="mt-8 pt-8 border-t border-hairline">
            {/* Results header with count and sort dropdown */}
            {nearbyEvents.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h3 className="text-xl font-semibold text-ink">
                  Showing {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
                </h3>
                
                {/* Sort By dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-by" className="text-sm text-ink-muted whitespace-nowrap">
                    Sorted by:
                  </label>
                  <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-10 rounded-md border border-hairline bg-surface-0 px-3 text-sm text-ink outline-none transition focus:border-primary-focus focus:ring-2 focus:ring-primary-focus/50"
                  >
                    <option value="nearest">Nearest</option>
                    <option value="price-low">Lowest Price</option>
                    <option value="price-high">Highest Price</option>
                    <option value="date-earliest">Earliest Event Date</option>
                    <option value="date-latest">Latest Event Date</option>
                    <option value="verified">Verified Tickets First</option>
                  </select>
                </div>
              </div>
            )}

            {/* Results summary with active filters */}
            {filteredEvents.length > 0 && hasActiveFilters() && (
              <div className="mb-4 p-3 rounded-md bg-surface-0 border border-hairline text-sm text-ink-muted">
                <p className="font-medium text-ink mb-1">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {filters.category !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-1 text-xs">
                      Category: {filters.category.charAt(0).toUpperCase() + filters.category.slice(1)}
                    </span>
                  )}
                  {(filters.minPrice !== "" || filters.maxPrice !== "") && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-1 text-xs">
                      Price: {filters.minPrice !== "" ? `$${filters.minPrice}` : "$0"} - {filters.maxPrice !== "" ? `$${filters.maxPrice}` : "Any"}
                    </span>
                  )}
                  {filters.verifiedOnly && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-1 text-xs">
                      Verified Only
                    </span>
                  )}
                  {filters.dateFilter !== "any" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-1 text-xs">
                      Date: {filters.dateFilter.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </span>
                  )}
                  {!filters.availableOnly && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-surface-1 text-xs">
                      Including Unavailable
                    </span>
                  )}
                </div>
              </div>
            )}

            {filteredEvents.length > 0 ? (
              /* Event cards grid - responsive layout */
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Render filtered and sorted events */}
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-lg border border-hairline bg-surface-0 overflow-hidden transition-all hover:border-hairline-strong hover:shadow-md"
                  >
                    {/* Event Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-surface-1">
                      <img
                        src={event.imageUrl}
                        alt={event.eventName}
                        className="h-full w-full object-cover"
                      />
                      {/* Distance badge */}
                      <div className="absolute top-3 right-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white">
                        {event.distance} km away
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="p-4">
                      {/* Event name and title */}
                      <h4 className="text-lg font-semibold text-ink mb-1 line-clamp-1">
                        {event.eventName}
                      </h4>
                      <p className="text-sm text-ink-muted mb-3 line-clamp-1">
                        {event.title}
                      </p>

                      {/* Event info */}
                      <div className="space-y-2 text-sm text-ink-muted mb-4">
                        <div className="flex items-start gap-2">
                          <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-1">
                            {event.eventVenue}, {event.city}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            {new Date(event.eventDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Price and action */}
                      <div className="flex items-center justify-between pt-3 border-t border-hairline">
                        <div>
                          <p className="text-xs text-ink-muted">Selling Price</p>
                          <p className="text-xl font-semibold text-ink">
                            ${event.price}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.isVerified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-semantic-success/10 px-2 py-1 text-xs font-medium text-semantic-success">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </span>
                          )}
                          <a
                            href={`/tickets/${event._id || event.id}`}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-focus"
                          >
                            View Details
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state when no events match filters */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg
                  className="h-16 w-16 text-ink-tertiary mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <h4 className="text-lg font-semibold text-ink mb-2">
                  No events match your filters
                </h4>
                <p className="text-sm text-ink-muted mb-6 max-w-md">
                  Try adjusting your filters or searching in a different location.
                </p>
                <button
                  onClick={resetFilters}
                  className="rounded-md bg-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-primary-focus"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}