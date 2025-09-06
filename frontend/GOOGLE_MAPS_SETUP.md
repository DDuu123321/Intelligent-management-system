# 🗺️ Google Maps Integration Setup Guide

This guide explains how to set up Google Maps integration for the worksite management system.

## 🔑 Getting Google Maps API Key

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### Step 2: Enable Required APIs
Enable the following APIs for your project:
- **Maps JavaScript API** (for displaying maps)
- **Places API** (for address search and autocomplete)
- **Geocoding API** (for converting addresses to coordinates)

Navigate to: `APIs & Services` → `Library` → Search and enable each API

### Step 3: Create API Key
1. Go to `APIs & Services` → `Credentials`
2. Click `+ CREATE CREDENTIALS` → `API key`
3. Copy the generated API key
4. Click on the key to configure it

### Step 4: Configure API Key Restrictions (Recommended)
For security, restrict your API key:

**Application Restrictions:**
- Choose "HTTP referrers (web sites)"
- Add your domains:
  - `http://localhost:5173/*` (for development)
  - `https://yourdomain.com/*` (for production)

**API Restrictions:**
- Restrict key to specific APIs:
  - Maps JavaScript API
  - Places API  
  - Geocoding API

## ⚙️ Environment Configuration

### Step 1: Update Environment File
Edit `apps/frontend/.env` file:

```env
# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

**Important:** Replace `YOUR_ACTUAL_API_KEY_HERE` with your actual API key from Google Cloud Console.

### Step 2: Restart Development Server
```bash
npm run dev
```

## 💰 Pricing Information

Google Maps has generous free usage limits:
- **$200 USD free credit** per month
- **Maps loads:** $7 per 1,000 requests (after free tier)
- **Geocoding:** $5 per 1,000 requests (after free tier)  
- **Places search:** $32 per 1,000 requests (after free tier)

**For typical worksite management usage (adding ~10-20 sites per month):**
- Monthly cost: **$0** (within free tier)
- Estimated annual cost: **$0-$50 AUD**

## 🚀 Features Included

### Interactive Map Selector
- **Click to select location** - Click anywhere on the map to set worksite location
- **Drag marker** - Fine-tune position by dragging the red marker
- **Address search** - Search for addresses and automatically locate on map
- **Current location** - Use GPS to get current location (with permission)
- **Australian focus** - Default view centered on Australian cities
- **Coordinate validation** - Ensures selected locations are within Australia

### User Experience Improvements
- **No more manual coordinate lookup** - Automatic coordinate generation
- **Visual location selection** - See exactly where the worksite is located
- **Address auto-fill** - Address field auto-populated when location is selected
- **Coordinate display** - Shows precise coordinates for reference
- **Copy coordinates** - Easy copy-paste of coordinates if needed

## 🛠️ Technical Implementation

### Components Created
- `WorksiteMapSelector.vue` - Main map selector component
- `useGoogleMaps.ts` - Composable function for map operations

### Key Features
- **TypeScript support** - Full type safety for map operations
- **Vue 3 composition API** - Modern reactive patterns
- **Error handling** - Graceful fallbacks if maps fail to load
- **Mobile responsive** - Works on desktop and mobile devices
- **Accessibility** - Keyboard navigation and screen reader support

## 🔧 Troubleshooting

### Map Not Loading
1. **Check API key** - Ensure `VITE_GOOGLE_MAPS_API_KEY` is set correctly
2. **Verify APIs enabled** - Make sure all required APIs are enabled
3. **Check browser console** - Look for error messages
4. **Test API key** - Visit Google Cloud Console to test key

### Common Error Messages

**"This page can't load Google Maps correctly"**
- API key missing or invalid
- Required APIs not enabled
- Domain restrictions preventing access

**"Geocoding failed"**
- Geocoding API not enabled
- Network connectivity issues
- Invalid search query

### Getting Support
1. **Check browser console** for detailed error messages
2. **Google Cloud Console** → `APIs & Services` → `Quotas` to check usage
3. **Google Maps Platform documentation** at https://developers.google.com/maps

## 📍 Usage Instructions

### Adding a New Worksite
1. Click "Add Worksite" button
2. Fill in basic information (name, etc.)
3. In the **Location** section:
   - **Option A:** Type an address in the search box and click "Search"
   - **Option B:** Click directly on the map where the worksite is located
   - **Option C:** Click "Use Current Location" (requires location permission)
4. Fine-tune the position by dragging the red marker
5. Verify the address and coordinates are correct
6. Click "Confirm Location" and then "Save"

### Editing Existing Worksite
1. Click "Edit" on any worksite
2. The map will show the current location with a marker
3. Adjust location using any of the methods above
4. Save changes

## 🌏 Australian Construction Focus

The system is optimized for Australian construction sites:
- **Default map center:** Perth, WA (-31.9505, 115.8605)
- **Location validation:** Ensures coordinates are within Australia
- **Address format:** Australian address formatting
- **Time zones:** Australian time zone options
- **Satellite imagery:** High-resolution imagery for construction sites

## 📊 Next Steps

After setup is complete, you can:
1. **Test the integration** by adding a new worksite
2. **Train your team** on the new location selection process
3. **Monitor usage** in Google Cloud Console
4. **Set up billing alerts** to track costs (optional)

---

🎉 **Congratulations!** Your worksite management system now has powerful map integration that will save time and improve accuracy when adding new construction sites.