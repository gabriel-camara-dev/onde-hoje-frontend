import { loadGoogleMaps } from '../../lib/googleMaps'

export function resolveCurrentCity() {
  return new Promise<{ city?: string; state?: string } | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const googleApi = await loadGoogleMaps()
          const geocoder = new googleApi.maps.Geocoder()

          geocoder.geocode(
            {
              location: {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              },
            },
            (results, status) => {
              if (status !== googleApi.maps.GeocoderStatus.OK || !results?.[0]) {
                resolve(null)
                return
              }

              const result = results[0]

              resolve({
                city:
                  geocodeComponent(result, 'administrative_area_level_2', 'long_name') ??
                  geocodeComponent(result, 'locality', 'long_name'),
                state: geocodeComponent(result, 'administrative_area_level_1', 'short_name'),
              })
            }
          )
        } catch {
          resolve(null)
        }
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 10,
        timeout: 6000,
      }
    )
  })
}

export function isGroupPublicId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim())
}

export function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function geocodeComponent(
  result: google.maps.GeocoderResult,
  type: string,
  nameKind: 'long_name' | 'short_name'
) {
  return result.address_components.find((item) => item.types.includes(type))?.[nameKind]
}
