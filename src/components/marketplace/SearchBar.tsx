"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDebounce } from "@/hooks/useDebounce"

export const SearchBar = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [query, setQuery] = useState(searchParams?.get("query") || "")
  const [city, setCity] = useState(searchParams?.get("city") || "")
  const _debouncedQuery = useDebounce(query, 500)

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (query) params.set("query", query)
    else params.delete("query")
    if (city) params.set("city", city)
    else params.delete("city")

    router.push(`/marketplace?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full max-w-4xl mx-auto bg-background p-2 rounded-xl border shadow-sm">
      <div className="flex-1 flex items-center px-3 gap-2">
        <Search className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search vendors, services, or packages..."
          className="border-none shadow-none focus-visible:ring-0"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="hidden md:block w-px h-8 bg-border self-center" />
      <div className="flex-1 flex items-center px-3 gap-2">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="City (e.g. Mumbai)"
          className="border-none shadow-none focus-visible:ring-0"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </div>
      <Button onClick={handleSearch} className="rounded-lg px-8">
        Search
      </Button>
    </div>
  )
}
