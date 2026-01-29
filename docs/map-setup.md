# Google Maps Setup Guide

## Overview
The application uses Google Maps JavaScript API for interactive location selection with autocomplete search and current location detection.

## Required API Key

### 1. Get a Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key (optional but recommended):
   - Set HTTP referrer restrictions to your domain
   - Restrict API key to only the required APIs

### 2. Add Environment Variable
Add the following to your `.env.local` file:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

**Important**: The variable must be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

## Features

### Interactive Map
- Click anywhere on the map to select a location
- Drag the marker to fine-tune the position
- Automatic address resolution via reverse geocoding

### Place Search with Autocomplete
- Type in the search box to get predictive suggestions
- Results are filtered to Azerbaijan (can be customized)
- Selecting a suggestion automatically updates the map and address

### Current Location Detection
- Click the location button (target icon) to detect your current position
- Requires browser permission for geolocation
- Automatically centers the map and updates the address

### Address Integration
- Selected address is automatically inserted into the event form
- Coordinates are logged for potential future use (database storage)
- Real-time address updates as you interact with the map

## Customization

### Change Default Location
Edit the `defaultCenter` in `/components/map-picker.tsx`:

```typescript
const defaultCenter = { lat: 40.4093, lng: 49.8671 } // Baku, Azerbaijan
```

### Change Country Restriction
Modify the `componentRestrictions` in the autocomplete configuration:

```typescript
componentRestrictions: { country: "az" } // Use ISO 3166-1 alpha-2 country codes
```

### Adjust Map Styling
Modify the `styles` array in the map configuration to customize appearance.

## Troubleshooting

### Map not loading
- Verify the API key is correctly set in `.env.local`
- Check browser console for API errors
- Ensure required APIs are enabled in Google Cloud Console

### Search not working
- Verify Places API is enabled
- Check API key restrictions aren't blocking the request
- Ensure network requests to Google APIs aren't blocked

### Location detection fails
- Check browser permissions for location access
- Verify HTTPS is enabled (required for geolocation)
- Test on a different browser/device

## Cost Considerations
Google Maps APIs have usage limits and pricing. Monitor your usage in Google Cloud Console and consider:
- Setting usage quotas
- Implementing rate limiting
- Caching geocoding results where appropriate
