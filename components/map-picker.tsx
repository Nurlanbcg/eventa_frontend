"use client"

/**
 * MapPicker Component - Interactive Google Maps Location Selector
 * 
 * SECURITY NOTE: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is intentionally exposed to the client.
 * This is REQUIRED for Google Maps JavaScript API to function - there's no alternative.
 * 
 * This is SAFE when you configure these restrictions in Google Cloud Console:
 * 1. API Restrictions: Limit to Maps JavaScript API, Places API, Geocoding API only
 * 2. Application Restrictions: Set HTTP referrers (your domains only)
 * 3. Usage Quotas: Set daily limits to prevent abuse
 * 
 * Reference: https://developers.google.com/maps/api-security-best-practices
 */

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Locate, Search, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { google } from "google-maps"

interface MapPickerProps {
  initialAddress?: string
  onLocationSelect: (address: string, lat: number, lng: number) => void
  onCancel?: () => void
  className?: string
}

export function MapPicker({ initialAddress = "", onLocationSelect, onCancel, className }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isLocating, setIsLocating] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState(initialAddress)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [searchValue, setSearchValue] = useState("")

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const loadGoogleMaps = () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        initializeMap()
        return
      }

      // Load Google Maps script
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&language=az`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => {
        setIsLoading(false)
      }
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!mapRef.current || !window.google) return

      // Default center (Baku, Azerbaijan)
      const defaultCenter = { lat: 40.4093, lng: 49.8671 }

      // Create map
      const map = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "on" }],
          },
        ],
      })

      mapInstanceRef.current = map

      // Create marker
      const marker = new window.google.maps.Marker({
        map,
        position: defaultCenter,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
      })

      markerRef.current = marker

      // Handle marker drag
      marker.addListener("dragend", () => {
        const position = marker.getPosition()
        if (position) {
          updateLocationFromCoords(position.lat(), position.lng())
        }
      })

      // Handle map clicks
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          marker.setPosition(e.latLng)
          updateLocationFromCoords(e.latLng.lat(), e.latLng.lng())
        }
      })

      // Initialize autocomplete
      if (searchInputRef.current) {
        const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          componentRestrictions: { country: "az" },
        })

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace()

          if (place.geometry?.location) {
            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const address = place.formatted_address || place.name || ""

            map.setCenter({ lat, lng })
            map.setZoom(16)
            marker.setPosition({ lat, lng })
            marker.setAnimation(window.google.maps.Animation.BOUNCE)
            setTimeout(() => marker.setAnimation(null), 750)

            setSelectedAddress(address)
            setSelectedCoords({ lat, lng })
            setSearchValue(address)
          }
        })

        autocompleteRef.current = autocomplete
      }

      setIsLoading(false)

      // If initial address provided, geocode it
      if (initialAddress) {
        geocodeAddress(initialAddress)
      }
    }

    loadGoogleMaps()
  }, [])

  // Update location from coordinates using reverse geocoding
  const updateLocationFromCoords = async (lat: number, lng: number) => {
    if (!window.google) return

    const geocoder = new window.google.maps.Geocoder()
    try {
      const response = await geocoder.geocode({ location: { lat, lng } })
      if (response.results[0]) {
        const address = response.results[0].formatted_address
        setSelectedAddress(address)
        setSelectedCoords({ lat, lng })
        setSearchValue(address)
      }
    } catch (error) {
      // Silently handle geocoding errors
    }
  }

  // Geocode address to coordinates
  const geocodeAddress = async (address: string) => {
    if (!window.google || !mapInstanceRef.current || !markerRef.current) return

    const geocoder = new window.google.maps.Geocoder()
    try {
      const response = await geocoder.geocode({ address })
      if (response.results[0]?.geometry.location) {
        const location = response.results[0].geometry.location
        const lat = location.lat()
        const lng = location.lng()

        mapInstanceRef.current.setCenter(location)
        mapInstanceRef.current.setZoom(16)
        markerRef.current.setPosition(location)

        setSelectedAddress(address)
        setSelectedCoords({ lat, lng })
      }
    } catch (error) {
      console.error("[v0] Geocoding error:", error)
    }
  }

  // Get current location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    setIsLocating(true)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude

        if (mapInstanceRef.current && markerRef.current) {
          const location = { lat, lng }
          mapInstanceRef.current.setCenter(location)
          mapInstanceRef.current.setZoom(16)
          markerRef.current.setPosition(location)
          markerRef.current.setAnimation(window.google.maps.Animation.BOUNCE)
          setTimeout(() => markerRef.current?.setAnimation(null), 750)

          updateLocationFromCoords(lat, lng)
        }

        setIsLocating(false)
      },
      (error) => {
        alert("Sizin yerinizi müəyyən etmək mümkün olmadı. Brauzer icazələrini yoxlayın.")
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    )
  }

  // Handle save
  const handleSave = () => {
    if (selectedAddress && selectedCoords) {
      onLocationSelect(selectedAddress, selectedCoords.lat, selectedCoords.lng)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="place-search" className="text-sm font-medium">
          Yer axtar
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              id="place-search"
              type="text"
              placeholder="Məkan adı və ya ünvan daxil edin..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleGetCurrentLocation}
            disabled={isLocating || isLoading}
            title="Cari yeri tap"
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden border-2 border-border bg-muted">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">Xəritə yüklənir...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Selected Address Display */}
      {selectedAddress && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Seçilmiş ünvan</Label>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm flex-1">{selectedAddress}</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSave}
          disabled={!selectedAddress || !selectedCoords}
          className="flex-1"
        >
          <MapPin className="h-4 w-4 mr-2" />
          Yeri yadda saxla
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Ləğv et
          </Button>
        )}
      </div>
    </div>
  )
}
