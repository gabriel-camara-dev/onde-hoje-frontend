import { CalendarDays, LocateFixed, Search } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { MapPlace } from '../../@types/OndeHoje'
import { loadGoogleMaps } from '../../lib/googleMaps'
import Button from '../ui/Button'

export type GooglePlaceDraft = {
  googlePlaceId: string
  name: string
  formattedAddress: string
  latitude: number
  longitude: number
  city?: string
  state?: string
  country?: string
  photoUrl?: string
  websiteUrl?: string
  mapsUrl?: string
}

type GooglePlacesMapProps = {
  city?: string
  maxMapDay: string
  mapDay: string
  minMapDay: string
  places: MapPlace[]
  selectedPlaceId?: string
  onMapDayChange: (day: string) => void
  onDraftSelected: (place: GooglePlaceDraft) => void
  onLocationResolved?: (location: { address: string; city?: string; state?: string }) => void
  onPlaceSelected: (place: MapPlace) => void
}

type MapClickHandler = (
  googleApi: typeof google,
  map: google.maps.Map,
  event: google.maps.MapMouseEvent
) => void

const fallbackCenter = { lat: -23.55052, lng: -46.633308 }
const existingVoteMarkerHitRadiusMeters = 6
const minZoomToShowExistingPlaces = 12
const googlePlaceFields = [
  'addressComponents',
  'displayName',
  'formattedAddress',
  'googleMapsURI',
  'id',
  'location',
  'photos',
  'websiteURI',
]

export function GooglePlacesMap({
  city,
  maxMapDay,
  mapDay,
  minMapDay,
  onMapDayChange,
  onDraftSelected,
  onLocationResolved,
  onPlaceSelected,
  places,
  selectedPlaceId,
}: GooglePlacesMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const draftMarkerRef = useRef<google.maps.Marker | null>(null)
  const onDraftSelectedRef = useRef(onDraftSelected)
  const onLocationResolvedRef = useRef(onLocationResolved)
  const onPlaceSelectedRef = useRef(onPlaceSelected)
  const placesRef = useRef(places)
  const selectFromMapClickRef = useRef<MapClickHandler>(() => {})
  const suppressNextMapClickRef = useRef(false)
  const hasTriedInitialLocationRef = useRef(false)
  const lastAppliedCityRef = useRef('')
  const autocompleteSessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null
  )
  const autocompleteRequestIdRef = useRef(0)
  const [error, setError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([])

  useEffect(() => {
    onDraftSelectedRef.current = onDraftSelected
  }, [onDraftSelected])

  useEffect(() => {
    onLocationResolvedRef.current = onLocationResolved
  }, [onLocationResolved])

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected
  }, [onPlaceSelected])

  useEffect(() => {
    placesRef.current = places
  }, [places])

  useEffect(() => {
    selectFromMapClickRef.current = selectFromMapClick
  })

  useEffect(() => {
    let cancelled = false

    loadGoogleMaps()
      .then((googleApi) => {
        if (cancelled || !mapElementRef.current) {
          return
        }

        const map = new googleApi.maps.Map(mapElementRef.current, {
          center: fallbackCenter,
          clickableIcons: true,
          disableDefaultUI: true,
          mapTypeControl: false,
          streetViewControl: false,
          zoom: 12,
          zoomControl: true,
        })

        mapRef.current = map
        centerMapOnUserLocation({ silent: true })

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (suppressNextMapClickRef.current) {
            suppressNextMapClickRef.current = false
            return
          }

          if (event.latLng) {
            selectFromMapClickRef.current(googleApi, map, event)
          }
        })

        map.addListener('zoom_changed', () => {
          updateExistingMarkersVisibility(map, markersRef.current)
        })
      })
      .catch((loadError: Error) => setError(loadError.message))

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.setMap(null))
      draftMarkerRef.current?.setMap(null)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !window.google?.maps) {
      return
    }

    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = places.map((place) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: `${place.name} (${place.voteCount} votos)`,
        label: {
          color: '#ffffff',
          fontWeight: '800',
          text: String(place.voteCount),
        },
      })

      marker.addListener('click', () => {
        suppressNextMapClickRef.current = true
        onPlaceSelectedRef.current(place)
      })
      return marker
    })
    updateExistingMarkersVisibility(map, markersRef.current)

    const selected = selectedPlaceId
      ? places.find((place) => place.id === selectedPlaceId)
      : undefined

    if (selected) {
      map.panTo({ lat: selected.latitude, lng: selected.longitude })
    }
  }, [onPlaceSelected, places, selectedPlaceId])

  useEffect(() => {
    const trimmedCity = city?.trim()
    const map = mapRef.current

    if (
      !trimmedCity ||
      !map ||
      !window.google?.maps ||
      trimmedCity === lastAppliedCityRef.current
    ) {
      return
    }

    lastAppliedCityRef.current = trimmedCity
    moveMapToCity(window.google, map, trimmedCity)
  }, [city])

  function centerMapOnUserLocation(options: { silent?: boolean } = {}) {
    const map = mapRef.current

    if (!map || hasTriedInitialLocationRef.current) {
      return
    }

    hasTriedInitialLocationRef.current = true

    if (!navigator.geolocation) {
      if (!options.silent) {
        setError('Seu navegador nao disponibilizou geolocalizacao.')
      }
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = { lat: position.coords.latitude, lng: position.coords.longitude }

        map.panTo(latLng)
        map.setZoom(15)
        setError('')
        onLocationResolvedRef.current?.({
          address: `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
        })
      },
      () => {
        if (!options.silent) {
          setError('Nao foi possivel acessar sua localizacao. Verifique a permissao do navegador.')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60 * 5,
        timeout: 8000,
      }
    )
  }

  function locateUser() {
    hasTriedInitialLocationRef.current = false
    centerMapOnUserLocation()
  }

  async function fetchAutocompleteSuggestions(query: string) {
    const trimmedQuery = query.trim()
    const map = mapRef.current

    if (trimmedQuery.length < 2 || !map || !window.google?.maps?.places) {
      setSuggestions([])
      return
    }

    const requestId = autocompleteRequestIdRef.current + 1
    autocompleteRequestIdRef.current = requestId

    if (!autocompleteSessionTokenRef.current) {
      autocompleteSessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken()
    }

    try {
      const { suggestions: fetchedSuggestions } =
        await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          includedRegionCodes: ['br'],
          input: trimmedQuery,
          language: 'pt-BR',
          locationBias: map.getBounds() ?? undefined,
          origin: map.getCenter() ?? undefined,
          region: 'BR',
          sessionToken: autocompleteSessionTokenRef.current,
        })

      if (requestId !== autocompleteRequestIdRef.current) {
        return
      }

      setSuggestions(
        fetchedSuggestions
          .map((suggestion) => suggestion.placePrediction)
          .filter((prediction): prediction is google.maps.places.PlacePrediction =>
            Boolean(prediction)
          )
          .slice(0, 5)
      )
    } catch {
      if (requestId === autocompleteRequestIdRef.current) {
        setSuggestions([])
      }
    }
  }

  async function searchByText(query: string) {
    const trimmedQuery = query.trim()
    const map = mapRef.current

    if (!trimmedQuery || !map || !window.google?.maps) {
      setError('Digite um local para pesquisar.')
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const { places: foundPlaces } = await window.google.maps.places.Place.searchByText({
        fields: googlePlaceFields,
        language: 'pt-BR',
        locationBias: map.getBounds() ?? undefined,
        maxResultCount: 1,
        region: 'BR',
        textQuery: trimmedQuery,
      })
      const place = foundPlaces[0]

      if (!place?.id || !place.displayName || !place.location) {
        setError('Nenhum local encontrado no Google Maps para essa busca.')
        return
      }

      selectGooglePlace(window.google, map, place, place.location)
    } catch {
      setError('Nenhum local encontrado no Google Maps para essa busca.')
    } finally {
      setIsSearching(false)
    }
  }

  function moveMapToCity(googleApi: typeof google, map: google.maps.Map, cityName: string) {
    const geocoder = new googleApi.maps.Geocoder()

    geocoder.geocode({ address: cityName, region: 'BR' }, (results, status) => {
      if (status !== googleApi.maps.GeocoderStatus.OK || !results?.[0]) {
        return
      }

      const result = results[0]
      const location = result.geometry.location
      map.panTo(location)
      map.setZoom(12)
      onLocationResolvedRef.current?.({
        address: result.formatted_address,
        city:
          geocodeComponent(result, 'administrative_area_level_2') ??
          geocodeComponent(result, 'locality') ??
          cityName,
        state: geocodeComponent(result, 'administrative_area_level_1'),
      })
    })
  }

  function selectLatLngDraft(
    googleApi: typeof google,
    map: google.maps.Map,
    latLng: google.maps.LatLng
  ) {
    const draft = createDraftFromLatLng(latLng)
    draftMarkerRef.current?.setMap(null)
    draftMarkerRef.current = new googleApi.maps.Marker({
      map,
      position: { lat: draft.latitude, lng: draft.longitude },
      title: draft.name,
    })
    map.panTo({ lat: draft.latitude, lng: draft.longitude })
    map.setZoom(16)
    setError('')
    onDraftSelectedRef.current(draft)
  }

  function selectExistingPlace(place: MapPlace) {
    draftMarkerRef.current?.setMap(null)
    setError('')
    onPlaceSelectedRef.current(place)
  }

  function selectFromMapClick(
    googleApi: typeof google,
    map: google.maps.Map,
    event: google.maps.MapMouseEvent
  ) {
    const location = event.latLng

    if (!location) {
      return
    }

    const nearbyPlace = shouldShowExistingPlaces(map)
      ? findNearestMapPlace(location, placesRef.current)
      : undefined

    if (nearbyPlace) {
      selectExistingPlace(nearbyPlace)
      return
    }

    const iconEvent = event as google.maps.IconMouseEvent

    if (iconEvent.placeId) {
      iconEvent.stop()
      selectGooglePlaceById(googleApi, map, iconEvent.placeId, location)
      return
    }

    selectNearbyGooglePlace(googleApi, map, location)
  }

  async function selectGooglePlaceById(
    googleApi: typeof google,
    map: google.maps.Map,
    placeId: string,
    fallbackLocation: google.maps.LatLng
  ) {
    try {
      const place = new googleApi.maps.places.Place({
        id: placeId,
        requestedLanguage: 'pt-BR',
        requestedRegion: 'BR',
      })
      const { place: hydratedPlace } = await place.fetchFields({ fields: googlePlaceFields })
      const location = hydratedPlace.location ?? fallbackLocation

      if (!hydratedPlace.id || !hydratedPlace.displayName) {
        selectLatLngDraft(googleApi, map, fallbackLocation)
        return
      }

      selectGooglePlace(googleApi, map, hydratedPlace, location)
    } catch {
      selectLatLngDraft(googleApi, map, fallbackLocation)
    }
  }

  async function selectNearbyGooglePlace(
    googleApi: typeof google,
    map: google.maps.Map,
    location: google.maps.LatLng
  ) {
    try {
      const { places: nearbyPlaces } = await googleApi.maps.places.Place.searchNearby({
        fields: googlePlaceFields,
        language: 'pt-BR',
        locationRestriction: {
          center: location,
          radius: 80,
        },
        maxResultCount: 5,
        rankPreference: googleApi.maps.places.SearchNearbyRankPreference.DISTANCE,
        region: 'BR',
      })
      const nearestPlace = nearbyPlaces
        .filter((place) => place.id && place.displayName && place.location)
        .sort(
          (a, b) =>
            distanceInMeters(location, a.location!) - distanceInMeters(location, b.location!)
        )[0]

      if (!nearestPlace?.location || distanceInMeters(location, nearestPlace.location) > 80) {
        selectLatLngDraft(googleApi, map, location)
        return
      }

      selectGooglePlace(googleApi, map, nearestPlace, nearestPlace.location)
    } catch {
      selectLatLngDraft(googleApi, map, location)
    }
  }

  function selectGooglePlace(
    googleApi: typeof google,
    map: google.maps.Map,
    place: google.maps.places.Place,
    location: google.maps.LatLng
  ) {
    const draft = mapGooglePlace(place, location)
    draftMarkerRef.current?.setMap(null)
    draftMarkerRef.current = new googleApi.maps.Marker({
      map,
      position: { lat: draft.latitude, lng: draft.longitude },
      title: draft.name,
    })
    map.panTo({ lat: draft.latitude, lng: draft.longitude })
    map.setZoom(16)
    setError('')
    onDraftSelectedRef.current(draft)
    onLocationResolvedRef.current?.({
      address: draft.formattedAddress,
      city: draft.city,
      state: draft.state,
    })
    autocompleteSessionTokenRef.current = null
    setSuggestions([])
  }

  async function selectAutocompleteSuggestion(prediction: google.maps.places.PlacePrediction) {
    const map = mapRef.current

    if (!map || !window.google?.maps) {
      return
    }

    setIsSearching(true)
    setError('')

    try {
      const place = prediction.toPlace()
      const { place: hydratedPlace } = await place.fetchFields({ fields: googlePlaceFields })

      if (!hydratedPlace.id || !hydratedPlace.displayName || !hydratedPlace.location) {
        setError('O Google Maps encontrou o local, mas nao retornou coordenadas.')
        return
      }

      if (searchInputRef.current) {
        searchInputRef.current.value = hydratedPlace.displayName
      }

      selectGooglePlace(window.google, map, hydratedPlace, hydratedPlace.location)
    } catch {
      setError('Nao foi possivel abrir essa sugestao do Google Maps.')
    } finally {
      setIsSearching(false)
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const firstSuggestion = suggestions[0]

    if (firstSuggestion) {
      selectAutocompleteSuggestion(firstSuggestion)
      return
    }

    searchByText(searchInputRef.current?.value ?? '')
  }

  return (
    <section className="relative min-h-[calc(100vh-188px)] overflow-hidden rounded-2xl border border-line bg-surface shadow-panel">
      <div ref={mapElementRef} className="absolute inset-0" />
      <div className="absolute left-3 right-3 top-3 z-10 grid gap-2 sm:left-4 sm:right-4 sm:top-4 md:left-6 md:right-auto md:w-[720px]">
        <form
          className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface/95 p-2 shadow-panel backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end lg:grid-cols-[170px_minmax(0,1fr)_auto_auto]"
          onSubmit={submitSearch}
        >
          <label className="col-span-2 grid min-h-11 grid-cols-[20px_1fr] items-center gap-2 rounded-xl bg-surface-muted px-3 text-xs font-bold text-muted sm:col-span-3 lg:col-span-1">
            <CalendarDays size={17} />
            <input
              aria-label="Dia do mapa"
              className="min-h-11 min-w-0 bg-transparent text-sm font-black text-ink outline-none"
              max={maxMapDay}
              min={minMapDay}
              name="mapDay"
              type="date"
              value={mapDay}
              onChange={(event) => onMapDayChange(event.currentTarget.value)}
            />
          </label>
          <label className="col-span-2 grid min-w-0 grid-cols-[24px_1fr] items-center gap-2 rounded-xl bg-surface-muted px-3 sm:col-span-1">
            <Search className="text-muted" size={19} />
            <input
              ref={searchInputRef}
              className="min-h-11 min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted/70"
              placeholder="Busque um lugar..."
              onChange={(event) => fetchAutocompleteSuggestions(event.currentTarget.value)}
              onFocus={(event) => fetchAutocompleteSuggestions(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSuggestions([])
                }
              }}
            />
          </label>
          <Button className="min-h-11 px-4" disabled={isSearching} type="submit" variant="secondary">
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
          <Button
            className="min-h-11 px-4"
            type="button"
            variant="secondary"
            onClick={locateUser}
          >
            <LocateFixed size={17} />
            <span className="sm:hidden">Localizar</span>
          </Button>
        </form>
        {suggestions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface/95 shadow-panel backdrop-blur">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                className="grid w-full gap-0.5 border-b border-line px-4 py-3 text-left last:border-b-0 hover:bg-teal-soft"
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectAutocompleteSuggestion(suggestion)}
              >
                <strong className="truncate text-sm text-ink">
                  {suggestion.mainText?.text ?? suggestion.text.text}
                </strong>
                {suggestion.secondaryText?.text && (
                  <span className="truncate text-xs font-bold text-muted">
                    {suggestion.secondaryText.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="rounded-xl border border-line bg-surface/90 px-4 py-2 text-xs font-bold text-muted shadow-panel backdrop-blur">
          Pesquise um local, uma cidade ou clique direto no mapa para selecionar um ponto.
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}

function mapGooglePlace(
  place: google.maps.places.Place,
  location: google.maps.LatLng
): GooglePlaceDraft {
  return {
    googlePlaceId: place.id,
    name: place.displayName!,
    formattedAddress: place.formattedAddress ?? place.displayName!,
    latitude: location.lat(),
    longitude: location.lng(),
    city: component(place, 'administrative_area_level_2') ?? component(place, 'locality'),
    state: component(place, 'administrative_area_level_1'),
    country: component(place, 'country'),
    photoUrl: place.photos?.[0]?.getURI({ maxHeight: 720, maxWidth: 1080 }),
    websiteUrl: place.websiteURI ?? undefined,
    mapsUrl: place.googleMapsURI ?? undefined,
  }
}

function createDraftFromLatLng(latLng: google.maps.LatLng): GooglePlaceDraft {
  const latitude = latLng.lat()
  const longitude = latLng.lng()
  const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`

  return {
    googlePlaceId: `map-click:${latitude.toFixed(7)}:${longitude.toFixed(7)}`,
    name: 'Ponto selecionado',
    formattedAddress: coordinates,
    latitude,
    longitude,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  }
}

function component(place: google.maps.places.Place, type: string) {
  return place.addressComponents?.find((item) => item.types.includes(type))?.longText ?? undefined
}

function geocodeComponent(result: google.maps.GeocoderResult, type: string) {
  return result.address_components.find((item) => item.types.includes(type))?.long_name
}

function findNearestMapPlace(latLng: google.maps.LatLng, places: MapPlace[]) {
  return places
    .map((place) => ({
      distance: distanceInMeters(
        latLng,
        new window.google.maps.LatLng(place.latitude, place.longitude)
      ),
      place,
    }))
    .filter((item) => item.distance <= existingVoteMarkerHitRadiusMeters)
    .sort((a, b) => a.distance - b.distance)[0]?.place
}

function updateExistingMarkersVisibility(map: google.maps.Map, markers: google.maps.Marker[]) {
  const visible = shouldShowExistingPlaces(map)

  markers.forEach((marker) => marker.setVisible(visible))
}

function shouldShowExistingPlaces(map: google.maps.Map) {
  return (map.getZoom() ?? minZoomToShowExistingPlaces) >= minZoomToShowExistingPlaces
}

function distanceInMeters(from: google.maps.LatLng, to: google.maps.LatLng) {
  const earthRadiusInMeters = 6371000
  const fromLat = toRadians(from.lat())
  const toLat = toRadians(to.lat())
  const deltaLat = toRadians(to.lat() - from.lat())
  const deltaLng = toRadians(to.lng() - from.lng())

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
