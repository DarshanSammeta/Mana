"use client";

import { useState, useEffect, useRef } from "react";
import { Search, History, TrendingUp, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { marketplaceService } from "@/services/client";

export function SearchInput({
  initialValue = "",
  category = "All Categories"
}: {
  initialValue?: string;
  category?: string;
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Sync with initialValue when URL changes externally
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const saved = localStorage.getItem("recent_searches");
    if (saved) setRecent(JSON.parse(saved));

    // Fetch trending
    marketplaceService.getTrendingSearches().then(setTrending).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const timer = setTimeout(() => {
        marketplaceService.getSearchSuggestions(query)
          .then(setSuggestions)
          .catch(() => {});
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("query", searchQuery.trim());
      // Save to recent
      const newRecent = [searchQuery.trim(), ...recent.filter(r => r !== searchQuery.trim())].slice(0, 5);
      setRecent(newRecent);
      localStorage.setItem("recent_searches", JSON.stringify(newRecent));
    }

    if (category && category !== "All Categories") {
      params.set("category", category);
    }

    setIsOpen(false);
    const searchString = params.toString();
    router.push(`/marketplace${searchString ? `?${searchString}` : ""}`);
  };

  return (
    <div className="relative flex-1 flex items-center" ref={containerRef}>
      <div className="relative flex-1 group">
        <input
          id="navbar-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder="Search for photographers, venues, decorators..."
          className="w-full pl-6 pr-10 py-3 bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 placeholder:text-gray-400 outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-slate-400" />
          </button>
        )}
      </div>

      {/* Search Button integrated here for cohesive logic */}
      <div className="pr-1">
        <button
          onClick={() => handleSearch(query)}
          className="bg-yellow-400 hover:bg-yellow-500 text-[#1B2533] h-9 w-12 rounded-r-[2rem] rounded-l-md transition-all flex items-center justify-center group shadow-sm"
        >
          <Search className="h-5 w-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-[100]">
          {query.length < 2 && (
            <>
              {recent.length > 0 && (
                <div className="p-4 border-b border-slate-50">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <History className="h-3 w-3" />
                    Recent Searches
                  </div>
                  <div className="space-y-2">
                    {recent.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSearch(item)}
                        className="block w-full text-left text-sm font-bold text-slate-600 hover:text-orange-500 transition-colors"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {trending.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                    <TrendingUp className="h-3 w-3" />
                    Trending Searches
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trending.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSearch(item)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-orange-50 text-slate-600 hover:text-orange-600 rounded-full text-xs font-bold transition-all"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(s.text)}
                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Search className="h-4 w-4 text-slate-300 group-hover:text-orange-500" />
                    <span className="text-sm font-bold text-slate-700">{s.text}</span>
                  </div>
                  {s.category && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.category}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
