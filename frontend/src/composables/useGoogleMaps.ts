// src/composables/useGoogleMaps.ts
import { ref } from "vue";
import { Loader } from "@googlemaps/js-api-loader";

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
}

export const useGoogleMaps = () => {
  const isLoaded = ref(false);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Initialize Google Maps
  const initMap = async (
    container: HTMLElement,
    options?: google.maps.MapOptions,
  ) => {
    loading.value = true;
    error.value = null;

    try {
      const loader = new Loader({
        apiKey: import.meta.env["VITE_GOOGLE_MAPS_API_KEY"] || "",
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      const google = await loader.load();

      // Default options for Australian construction sites
      const defaultOptions: google.maps.MapOptions = {
        center: { lat: -31.9505, lng: 115.8605 }, // Perth, WA
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.HYBRID,
        streetViewControl: true,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        ...options,
      };

      const map = new google.maps.Map(container, defaultOptions);
      isLoaded.value = true;

      return { map, google };
    } catch (err) {
      error.value = "Failed to load Google Maps. Please check your API key.";
      console.error("Google Maps loading error:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Geocoding: Convert address to coordinates
  const geocodeAddress = async (address: string): Promise<LocationData[]> => {
    if (!window.google) {
      throw new Error("Google Maps not loaded");
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        {
          address,
          region: "AU", // Restrict to Australia
          componentRestrictions: { country: "AU" },
        },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus,
        ) => {
          if (status === "OK" && results) {
            const locations: LocationData[] = results.map(
              (result: google.maps.GeocoderResult) => ({
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
                address: result.formatted_address,
                placeId: result.place_id,
              }),
            );
            resolve(locations);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        },
      );
    });
  };

  // Reverse geocoding: Convert coordinates to address
  const reverseGeocode = async (
    lat: number,
    lng: number,
  ): Promise<LocationData | null> => {
    if (!window.google) {
      throw new Error("Google Maps not loaded");
    }

    const geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (
          results: google.maps.GeocoderResult[] | null,
          status: google.maps.GeocoderStatus,
        ) => {
          if (status === "OK" && results && results[0]) {
            const result = results[0];
            resolve({
              lat,
              lng,
              address: result.formatted_address,
              placeId: result.place_id,
            });
          } else {
            reject(new Error(`Reverse geocoding failed: ${status}`));
          }
        },
      );
    });
  };

  // Get user's current location
  const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          reject(new Error(`Location error: ${err.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      );
    });
  };

  // Validate if coordinates are within Australia
  const isInAustralia = (lat: number, lng: number): boolean => {
    // Basic bounding box for Australia (including Tasmania)
    return lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154;
  };

  // Create a draggable marker
  const createDraggableMarker = (
    map: google.maps.Map,
    position: google.maps.LatLngLiteral,
    onDragEnd?: (location: LocationData) => void,
  ) => {
    const marker = new google.maps.Marker({
      position,
      map,
      draggable: true,
      title: "Worksite Location",
      icon: {
        url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        scaledSize: new google.maps.Size(32, 32),
      },
    });

    if (onDragEnd) {
      marker.addListener("dragend", async () => {
        const newPosition = marker.getPosition();
        if (newPosition) {
          const lat = newPosition.lat();
          const lng = newPosition.lng();

          try {
            const locationData = await reverseGeocode(lat, lng);
            if (locationData) {
              onDragEnd(locationData);
            }
          } catch (error) {
            console.error("Failed to get address for new position:", error);
            onDragEnd({ lat, lng, address: "Address not available" });
          }
        }
      });
    }

    return marker;
  };

  return {
    isLoaded,
    loading,
    error,
    initMap,
    geocodeAddress,
    reverseGeocode,
    getCurrentLocation,
    isInAustralia,
    createDraggableMarker,
  };
};
