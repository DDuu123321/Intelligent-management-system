<template>
  <div class="worksite-map-selector">
    <!-- Address Search Input -->
    <div class="address-search-section">
      <el-input
        v-model="addressSearch"
        :placeholder="
          $t('worksite.map.searchPlaceholder') ||
          'Search for worksite address (e.g., 123 Smith Street, Perth WA)'
        "
        clearable
        class="address-search"
        :loading="searchLoading"
        size="large"
        @input="onAddressInput"
        @clear="clearAddressSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button
            :loading="searchLoading"
            type="primary"
            @click="searchAddress"
          >
            Search
          </el-button>
        </template>
      </el-input>

      <!-- Search suggestions -->
      <div v-if="searchSuggestions.length > 0" class="search-suggestions">
        <div
          v-for="(suggestion, index) in searchSuggestions"
          :key="index"
          class="suggestion-item"
          @click="selectSuggestion(suggestion)"
        >
          <el-icon class="suggestion-icon"><Location /></el-icon>
          <span>{{ suggestion.address }}</span>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-section">
      <div
        ref="mapContainer"
        v-loading="mapLoading"
        class="map-container"
      ></div>

      <!-- Map loading error -->
      <div v-if="mapError" class="map-error">
        <el-alert
          :title="($t('worksite.map.error') || 'Map Loading Error') as string"
          :description="mapError"
          type="error"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <!-- Location Information Display -->
    <div v-if="selectedLocation" class="location-info">
      <el-card shadow="hover">
        <template #header>
          <div class="location-info-header">
            <el-icon class="header-icon"><Location /></el-icon>
            <span>{{
              $t("worksite.map.selectedLocation") || "Selected Location"
            }}</span>
          </div>
        </template>

        <div class="location-details">
          <div class="detail-item">
            <strong>{{ $t("worksite.map.address") || "Address" }}:</strong>
            <span class="address-text">{{ selectedLocation.address }}</span>
          </div>

          <div class="detail-item">
            <strong
              >{{ $t("worksite.map.coordinates") || "Coordinates" }}:</strong
            >
            <span class="coordinates-text">
              {{ selectedLocation.lat.toFixed(6) }},
              {{ selectedLocation.lng.toFixed(6) }}
            </span>
            <el-button
              text
              type="primary"
              size="small"
              class="copy-button"
              @click="copyCoordinates"
            >
              <el-icon><DocumentCopy /></el-icon>
              {{ $t("common.copy") || "Copy" }}
            </el-button>
          </div>

          <div v-if="!isValidAustralianLocation" class="detail-item">
            <el-alert
              :title="
                ($t('worksite.map.outsideAustralia') ||
                'Location Outside Australia') as string
              "
              :description="
                ($t('worksite.map.outsideAustraliaDesc') ||
                'Please select a location within Australia for this construction site.') as string
              "
              type="warning"
              show-icon
              :closable="false"
            />
          </div>
        </div>
      </el-card>
    </div>

    <!-- Map Action Buttons -->
    <div class="map-actions">
      <el-button
        :loading="locationLoading"
        :icon="Aim"
        @click="useCurrentLocation"
      >
        {{ $t("worksite.map.useCurrentLocation") || "Use Current Location" }}
      </el-button>

      <el-button :icon="RefreshRight" @click="clearSelection">
        {{ $t("worksite.map.clearSelection") || "Clear Selection" }}
      </el-button>

      <el-button
        v-if="selectedLocation"
        type="primary"
        :disabled="!isValidAustralianLocation"
        :icon="Check"
        @click="confirmSelection"
      >
        {{ $t("worksite.map.confirmLocation") || "Confirm Location" }}
      </el-button>
    </div>

    <!-- Help Text -->
    <div class="help-text">
      <el-text size="small" type="info">
        <el-icon><InfoFilled /></el-icon>
        {{
          $t("worksite.map.helpText") ||
          "Click on the map to select a location, or search for an address above. You can also drag the red marker to fine-tune the position."
        }}
      </el-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import {
  Search,
  Location,
  DocumentCopy,
  Aim,
  RefreshRight,
  Check,
  InfoFilled,
} from "@element-plus/icons-vue";
import { useGoogleMaps, type LocationData } from "@/composables/useGoogleMaps";

// Props & Emits
interface Props {
  modelValue?: LocationData | null;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: LocationData | null];
  "location-selected": [location: LocationData];
  "location-cleared": [];
}>();

// Composables
const {
  initMap,
  geocodeAddress,
  reverseGeocode,
  getCurrentLocation,
  isInAustralia,
  createDraggableMarker,
  loading: mapLoading,
  error: mapError,
} = useGoogleMaps();

// Refs
const mapContainer = ref<HTMLElement>();
const addressSearch = ref("");
const searchLoading = ref(false);
const locationLoading = ref(false);
const searchSuggestions = ref<LocationData[]>([]);

// State
let map: google.maps.Map | null = null;
let marker: google.maps.Marker | null = null;
let clickListener: google.maps.MapsEventListener | null = null;

const selectedLocation = ref<LocationData | null>(props.modelValue);

// Computed
const isValidAustralianLocation = computed(() => {
  if (!selectedLocation.value) return true;
  return isInAustralia(selectedLocation.value.lat, selectedLocation.value.lng);
});

// Watch for prop changes
watch(
  () => props.modelValue,
  (newValue) => {
    selectedLocation.value = newValue;
    if (newValue && map) {
      updateMapLocation(newValue);
    }
  },
  { immediate: true },
);

// Methods
const initializeMap = async () => {
  if (!mapContainer.value) return;

  try {
    const { map: googleMap } = await initMap(mapContainer.value);
    map = googleMap;

    // Add click listener to map
    clickListener = map.addListener("click", handleMapClick);

    // If we have initial location, show it
    if (selectedLocation.value) {
      updateMapLocation(selectedLocation.value);
    }
  } catch (error) {
    console.error("Failed to initialize map:", error);
  }
};

const handleMapClick = async (event: google.maps.MapMouseEvent) => {
  if (props.disabled || !event.latLng) return;

  const lat = event.latLng.lat();
  const lng = event.latLng.lng();

  try {
    const locationData = await reverseGeocode(lat, lng);
    if (locationData) {
      setSelectedLocation(locationData);
    }
  } catch (error) {
    console.error("Failed to get address for clicked location:", error);
    // Still allow selection even if address lookup fails
    setSelectedLocation({
      lat,
      lng,
      address: "Address not available",
    });
  }
};

const setSelectedLocation = (location: LocationData) => {
  selectedLocation.value = location;
  emit("update:modelValue", location);
  emit("location-selected", location);

  if (map) {
    updateMapLocation(location);
  }
};

const updateMapLocation = (location: LocationData) => {
  if (!map) return;

  const position = { lat: location.lat, lng: location.lng };

  // Update map center
  map.setCenter(position);
  map.setZoom(16);

  // Remove existing marker
  if (marker) {
    marker.setMap(null);
  }

  // Create new draggable marker
  marker = createDraggableMarker(map, position, (newLocation) => {
    setSelectedLocation(newLocation);
  });
};

const searchAddress = async () => {
  if (!addressSearch.value.trim()) return;

  searchLoading.value = true;
  searchSuggestions.value = [];

  try {
    const results = await geocodeAddress(addressSearch.value.trim());
    if (results.length > 0) {
      if (results.length === 1 && results[0]) {
        // If only one result, select it directly
        setSelectedLocation(results[0]);
        searchSuggestions.value = [];
      } else {
        // Show suggestions for multiple results
        searchSuggestions.value = results.slice(0, 5); // Limit to 5 suggestions
      }
    } else {
      ElMessage({
        message: "No locations found for the given address",
        type: "warning",
      });
    }
  } catch (error) {
    console.error("Geocoding error:", error);
    ElMessage({
      message: "Failed to search for address. Please try again.",
      type: "error",
    });
  } finally {
    searchLoading.value = false;
  }
};

const selectSuggestion = (suggestion: LocationData) => {
  setSelectedLocation(suggestion);
  searchSuggestions.value = [];
  addressSearch.value = suggestion.address;
};

const onAddressInput = () => {
  // Clear suggestions when user types
  searchSuggestions.value = [];
};

const clearAddressSearch = () => {
  searchSuggestions.value = [];
};

const useCurrentLocation = async () => {
  locationLoading.value = true;

  try {
    const currentPos = await getCurrentLocation();
    const locationData = await reverseGeocode(currentPos.lat, currentPos.lng);

    if (locationData) {
      setSelectedLocation(locationData);
      addressSearch.value = locationData.address;
    }
  } catch (error) {
    console.error("Failed to get current location:", error);
    ElMessage({
      message:
        "Unable to get current location. Please check browser permissions.",
      type: "error",
    });
  } finally {
    locationLoading.value = false;
  }
};

const clearSelection = () => {
  selectedLocation.value = null;
  addressSearch.value = "";
  searchSuggestions.value = [];

  if (marker) {
    marker.setMap(null);
    marker = null;
  }

  emit("update:modelValue", null);
  emit("location-cleared");
};

const confirmSelection = () => {
  if (selectedLocation.value && isValidAustralianLocation.value) {
    emit("location-selected", selectedLocation.value);
    ElMessage({ message: "Location confirmed successfully!", type: "success" });
  }
};

const copyCoordinates = async () => {
  if (!selectedLocation.value) return;

  const coords = `${selectedLocation.value.lat}, ${selectedLocation.value.lng}`;

  try {
    await navigator.clipboard.writeText(coords);
    ElMessage({ message: "Coordinates copied to clipboard!", type: "success" });
  } catch (error) {
    console.error("Failed to copy coordinates:", error);
    ElMessage({ message: "Failed to copy coordinates", type: "error" });
  }
};

// Lifecycle
onMounted(() => {
  nextTick(() => {
    initializeMap();
  });
});
</script>

<style scoped>
.worksite-map-selector {
  width: 100%;
  min-height: 500px;
}

.address-search-section {
  margin-bottom: 16px;
  position: relative;
}

.address-search {
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  border-bottom: 1px solid #f0f2f5;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #f5f7fa;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-icon {
  color: #409eff;
  flex-shrink: 0;
}

.map-section {
  margin-bottom: 16px;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e4e7ed;
  transition: border-color 0.3s;
}

.map-container:hover {
  border-color: #409eff;
}

.map-error {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.location-info {
  margin-bottom: 16px;
}

.location-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
}

.header-icon {
  color: #409eff;
}

.location-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.address-text {
  color: #606266;
  font-family: monospace;
  word-break: break-all;
}

.coordinates-text {
  color: #909399;
  font-family: "Monaco", "Consolas", monospace;
  font-size: 14px;
}

.copy-button {
  align-self: flex-start;
  margin-top: 4px;
}

.map-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.help-text {
  padding: 12px 16px;
  background: #f8f9fc;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.help-text .el-text {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }

  .map-actions {
    flex-direction: column;
  }

  .detail-item {
    align-items: flex-start;
  }
}
</style>
