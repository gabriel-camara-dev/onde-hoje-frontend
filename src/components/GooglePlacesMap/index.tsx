import { CalendarDays, LocateFixed, Maximize, Search, Vote, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { MapPlace, VoteType } from '../../@types/OndeHoje'
import { loadGoogleMaps } from '../../lib/googleMaps'
import Button from '../ui/Button'

export type GooglePlaceDraft = {
  googlePlaceId: string
  name: string
  googlePlaceName?: string
  nickname?: string
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
  className?: string
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

// Default view: Niteroi, zoomed out. Used until (and if) the device location resolves.
const fallbackCenter = { lat: -22.8833, lng: -43.1036 }
const fallbackZoom = 11
const existingVoteMarkerHitRadiusMeters = 6
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
  className = '',
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
  const highlightIntervalRef = useRef<number | null>(null)
  const draftMarkerRef = useRef<google.maps.Marker | null>(null)
  const searchMarkerRef = useRef<google.maps.Marker | null>(null)
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
  const autocompleteDebounceRef = useRef<number | null>(null)
  const [error, setError] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchDraft, setSearchDraft] = useState<GooglePlaceDraft | null>(null)
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
          // On touch devices one finger scrolls the page (cooperative); the
          // fullscreen mode below switches to 'greedy' for free navigation.
          gestureHandling: 'auto',
          mapTypeControl: false,
          streetViewControl: false,
          zoom: fallbackZoom,
          zoomControl: true,
        })

        mapRef.current = map
        setIsMapReady(true)
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
      if (autocompleteDebounceRef.current) {
        window.clearTimeout(autocompleteDebounceRef.current)
      }
      if (highlightIntervalRef.current) {
        window.clearInterval(highlightIntervalRef.current)
        highlightIntervalRef.current = null
      }
      markersRef.current.forEach((marker) => marker.setMap(null))
      draftMarkerRef.current?.setMap(null)
      mapRef.current = null
      setIsMapReady(false)
    }
  }, [])

  // The map container changes size when entering/leaving fullscreen. Google Maps
  // needs a resize event to repaint its tiles, otherwise it can render blank.
  // Preserve the center across the resize so the view doesn't jump.
  useEffect(() => {
    const map = mapRef.current

    if (!map || !window.google?.maps) {
      return
    }

    const center = map.getCenter()
    const timer = window.setTimeout(() => {
      window.google.maps.event.trigger(map, 'resize')
      if (center) {
        map.setCenter(center)
      }
    }, 90)

    return () => window.clearTimeout(timer)
  }, [isFullscreen, isMapReady])

  useEffect(() => {
    const map = mapRef.current

    if (!map || !window.google?.maps) {
      return
    }

    if (highlightIntervalRef.current) {
      window.clearInterval(highlightIntervalRef.current)
      highlightIntervalRef.current = null
    }

    markersRef.current.forEach((marker) => marker.setMap(null))

    const topPlaceIds = computeTopPlaceIds(places)
    const animatedMarkers: Array<{ marker: google.maps.Marker; frames: google.maps.Icon[] }> = []

    markersRef.current = places.map((place) => {
      const highlighted = topPlaceIds.has(place.id)
      const marker = new window.google.maps.Marker({
        icon: createVoteMarkerIcon(window.google, place.dominantVoteType, place.voteCount, {
          highlighted,
        }),
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: highlighted
          ? `${place.name} (${place.voteCount} votos) - Top do dia`
          : `${place.name} (${place.voteCount} votos)`,
        zIndex: highlighted ? 1000 : undefined,
      })

      if (highlighted) {
        animatedMarkers.push({
          marker,
          frames: GLOW_FRAMES.map((glow) =>
            createVoteMarkerIcon(window.google, place.dominantVoteType, place.voteCount, {
              highlighted: true,
              glow,
            })
          ),
        })
      }

      marker.addListener('click', () => {
        suppressNextMapClickRef.current = true
        onPlaceSelectedRef.current(place)
      })
      return marker
    })

    if (animatedMarkers.length > 0) {
      let frameIndex = 0
      highlightIntervalRef.current = window.setInterval(() => {
        frameIndex = (frameIndex + 1) % GLOW_FRAMES.length
        animatedMarkers.forEach(({ marker, frames }) => marker.setIcon(frames[frameIndex]))
      }, 130)
    }

    updateExistingMarkersVisibility(map, markersRef.current)

    const selected = selectedPlaceId
      ? places.find((place) => place.id === selectedPlaceId)
      : undefined

    if (selected) {
      map.panTo({ lat: selected.latitude, lng: selected.longitude })
    }
  }, [isMapReady, onPlaceSelected, places, selectedPlaceId])

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
  }, [city, isMapReady])

  function centerMapOnUserLocation(options: { silent?: boolean } = {}) {
    const map = mapRef.current

    if (!map || hasTriedInitialLocationRef.current) {
      return
    }

    hasTriedInitialLocationRef.current = true

    if (!navigator.geolocation) {
      if (!options.silent) {
        setError('Seu navegador não disponibilizou geolocalizacao.')
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
          setError('Não foi possível acessar sua localização. Verifique a permissão do navegador.')
        }
      },
      {
        // City-level accuracy is enough to center the map and is far more
        // reliable/faster than high accuracy (which often times out).
        enableHighAccuracy: false,
        maximumAge: 1000 * 60 * 5,
        timeout: 12000,
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

    setSearchDraft(null)

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

  function queueAutocompleteSuggestions(query: string) {
    if (autocompleteDebounceRef.current) {
      window.clearTimeout(autocompleteDebounceRef.current)
    }

    autocompleteDebounceRef.current = window.setTimeout(() => {
      fetchAutocompleteSuggestions(query)
    }, 120)
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

      previewGooglePlaceSearchResult(window.google, map, place, place.location)
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

  async function selectLatLngDraft(
    googleApi: typeof google,
    map: google.maps.Map,
    latLng: google.maps.LatLng
  ) {
    const draft = await createDraftFromLatLng(googleApi, latLng, city)
    searchMarkerRef.current?.setMap(null)
    draftMarkerRef.current?.setMap(null)
    draftMarkerRef.current = new googleApi.maps.Marker({
      map,
      position: { lat: draft.latitude, lng: draft.longitude },
      title: draft.name,
    })
    map.panTo({ lat: draft.latitude, lng: draft.longitude })
    map.setZoom(16)
    setError('')
    setSearchDraft(null)
    onDraftSelectedRef.current(draft)
    onLocationResolvedRef.current?.({
      address: draft.formattedAddress,
      city: draft.city,
      state: draft.state,
    })
  }
  function selectExistingPlace(place: MapPlace) {
    searchMarkerRef.current?.setMap(null)
    draftMarkerRef.current?.setMap(null)
    setError('')
    setSearchDraft(null)
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

    const nearbyPlace = findNearestMapPlace(location, placesRef.current)

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

    selectLatLngDraft(googleApi, map, location)
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

  function selectGooglePlace(
    googleApi: typeof google,
    map: google.maps.Map,
    place: google.maps.places.Place,
    location: google.maps.LatLng
  ) {
    const draft = mapGooglePlace(place, location)
    searchMarkerRef.current?.setMap(null)
    draftMarkerRef.current?.setMap(null)
    draftMarkerRef.current = new googleApi.maps.Marker({
      map,
      position: { lat: draft.latitude, lng: draft.longitude },
      title: draft.name,
    })
    map.panTo({ lat: draft.latitude, lng: draft.longitude })
    map.setZoom(16)
    setError('')
    setSearchDraft(null)
    onDraftSelectedRef.current(draft)
    onLocationResolvedRef.current?.({
      address: draft.formattedAddress,
      city: draft.city,
      state: draft.state,
    })
    autocompleteSessionTokenRef.current = null
    setSuggestions([])
  }

  function previewGooglePlaceSearchResult(
    googleApi: typeof google,
    map: google.maps.Map,
    place: google.maps.places.Place,
    location: google.maps.LatLng
  ) {
    const draft = mapGooglePlace(place, location)

    searchMarkerRef.current?.setMap(null)
    searchMarkerRef.current = new googleApi.maps.Marker({
      map,
      position: { lat: draft.latitude, lng: draft.longitude },
      title: draft.name,
    })

    map.panTo({ lat: draft.latitude, lng: draft.longitude })
    map.setZoom(17)
    setError('')
    setSearchDraft(draft)
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
        setError('O Google Maps encontrou o local, mas não retornou coordenadas.')
        return
      }

      if (searchInputRef.current) {
        searchInputRef.current.value = hydratedPlace.displayName
      }

      previewGooglePlaceSearchResult(window.google, map, hydratedPlace, hydratedPlace.location)
    } catch {
      setError('Não foi possível abrir essa sugestão do Google Maps.')
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

  function voteSearchDraft() {
    const map = mapRef.current

    if (!searchDraft || !map || !window.google?.maps) {
      return
    }

    searchMarkerRef.current?.setMap(null)
    draftMarkerRef.current?.setMap(null)
    draftMarkerRef.current = new window.google.maps.Marker({
      map,
      position: { lat: searchDraft.latitude, lng: searchDraft.longitude },
      title: searchDraft.name,
    })
    setSearchDraft(null)
    onDraftSelectedRef.current(searchDraft)
  }

  function toggleFullscreen() {
    setIsFullscreen((current) => {
      const next = !current
      const map = mapRef.current

      if (map) {
        map.setOptions({ gestureHandling: next ? 'greedy' : 'auto' })
        // Recalculate the map size after the container resizes.
        window.setTimeout(() => window.google?.maps?.event.trigger(map, 'resize'), 80)
      }

      return next
    })
  }

  return (
    <section
      className={
        isFullscreen
          ? 'fixed inset-0 z-[70] overflow-hidden bg-surface'
          : `relative min-h-[calc(100vh-188px)] overflow-hidden rounded-lg border border-line bg-surface shadow-panel ${className}`
      }
    >
      <div ref={mapElementRef} className="absolute inset-0" />

      {!isFullscreen && (
        <button
          className="absolute bottom-4 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-on-teal shadow-panel md:hidden"
          type="button"
          onClick={toggleFullscreen}
        >
          <Maximize size={17} />
          Explorar mapa
        </button>
      )}

      {isFullscreen && (
        <button
          className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] left-1/2 z-[80] inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-teal px-6 py-3 text-sm font-semibold text-on-teal shadow-panel"
          type="button"
          onClick={toggleFullscreen}
        >
          <X size={18} />
          Fechar mapa
        </button>
      )}

      <div className="absolute left-3 right-3 top-3 z-10 grid gap-2 sm:left-4 sm:right-4 sm:top-4 md:left-6 md:right-auto md:w-[720px]">
        <form
          className="grid grid-cols-6 gap-2 rounded-lg border border-line bg-surface/95 p-2 shadow-panel backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end lg:grid-cols-[170px_minmax(0,1fr)_auto_auto_auto]"
          onSubmit={submitSearch}
        >
          <label className="col-span-6 grid min-h-10 grid-cols-[20px_1fr] items-center gap-2 rounded-xl bg-surface-muted px-3 text-xs font-medium text-muted sm:col-span-4 sm:min-h-11 lg:col-span-1">
            <CalendarDays size={17} />
            <input
              aria-label="Dia do mapa"
              className="min-h-10 min-w-0 bg-transparent text-sm font-semibold text-ink outline-none sm:min-h-11"
              max={maxMapDay}
              min={minMapDay}
              name="mapDay"
              type="date"
              value={mapDay}
              onChange={(event) => onMapDayChange(event.currentTarget.value)}
            />
          </label>
          <label className="col-span-6 grid min-w-0 grid-cols-[24px_1fr] items-center gap-2 rounded-xl bg-surface-muted px-3 sm:col-span-1">
            <Search className="text-muted" size={19} />
            <input
              ref={searchInputRef}
              className="min-h-10 min-w-0 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-muted/70 sm:min-h-11"
              placeholder="Busque um lugar..."
              onChange={(event) => queueAutocompleteSuggestions(event.currentTarget.value)}
              onFocus={(event) => fetchAutocompleteSuggestions(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setSuggestions([])
                }
              }}
            />
          </label>
          <Button
            className="col-span-2 min-h-10 px-2 sm:col-span-1 sm:min-h-11 sm:px-4"
            disabled={isSearching}
            type="submit"
            variant="secondary"
          >
            {isSearching ? (
              <>
                <span className="sm:hidden">...</span>
                <span className="hidden sm:inline">Buscando...</span>
              </>
            ) : (
              'Buscar'
            )}
          </Button>
          <Button
            className="col-span-2 min-h-10 px-2 sm:col-span-1 sm:min-h-11 sm:px-4"
            disabled={!searchDraft || isSearching}
            type="button"
            onClick={voteSearchDraft}
          >
            <Vote size={17} />
            Votar
          </Button>
          <Button
            className="col-span-2 min-h-10 px-2 sm:col-span-1 sm:min-h-11 sm:px-4"
            type="button"
            variant="secondary"
            onClick={locateUser}
          >
            <LocateFixed size={17} />
            <span className="sm:hidden">Local</span>
          </Button>
        </form>
        {suggestions.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-line bg-surface/95 shadow-panel backdrop-blur">
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
                  <span className="truncate text-xs font-medium text-muted">
                    {suggestion.secondaryText.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
        <div className="hidden rounded-xl border border-line bg-surface/90 px-4 py-2 text-xs font-medium text-muted shadow-panel backdrop-blur sm:block">
          Pesquise um local, clique em um lugar do Google Maps ou clique em qualquer ponto do mapa.
        </div>
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        )}
      </div>
    </section>
  )
}

// Fases do brilho pulsante aplicado ao marcador mais votado do dia.
const GLOW_FRAMES = [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25]

function computeTopPlaceIds(places: MapPlace[]) {
  return new Set(
    [...places]
      .filter((place) => place.voteCount > 0)
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 1)
      .map((place) => place.id)
  )
}

type VoteMarkerIconOptions = {
  highlighted?: boolean
  glow?: number
}

function createVoteMarkerIcon(
  googleApi: typeof google,
  voteType: VoteType,
  voteCount: number,
  options: VoteMarkerIconOptions = {}
): google.maps.Icon {
  const { highlighted = false, glow = 0 } = options
  const marker = voteMarkerMeta(voteType)
  const count = Math.min(voteCount, 99)

  // O marcador cresce conforme a quantidade de votos (1 voto -> 1x, 30+ votos -> 1.7x).
  const clampedVotes = Math.min(Math.max(voteCount, 1), 30)
  const scale = 1 + ((clampedVotes - 1) / 29) * 0.7
  // Os 3 mais votados do dia ficam naturalmente maiores, alem do brilho.
  const highlightBoost = highlighted ? 1.3 : 1
  const pinPixelWidth = Math.round(38 * scale * highlightBoost)

  const innerWidth = 54
  const innerHeight = 66
  const pad = highlighted ? 26 : 0
  const viewWidth = innerWidth + pad * 2
  const viewHeight = innerHeight + pad * 2
  let width = Math.round((pinPixelWidth * viewWidth) / innerWidth)
  let height = Math.round((width * viewHeight) / viewWidth)
  let anchorX = Math.round((width * (27 + pad)) / viewWidth)
  let anchorY = Math.round((height * (64 + pad)) / viewHeight)

  // Hard cap on the on-map footprint so a very voted (and highlighted) place
  // never renders as a giant marker covering the map.
  const MAX_MARKER_WIDTH = highlighted ? 92 : 64
  if (width > MAX_MARKER_WIDTH) {
    const factor = MAX_MARKER_WIDTH / width
    width = Math.round(width * factor)
    height = Math.round(height * factor)
    anchorX = Math.round(anchorX * factor)
    anchorY = Math.round(anchorY * factor)
  }

  const centerX = 27 + pad
  const centerY = 27 + pad
  const glowMarkup = highlighted
    ? `<circle cx="${centerX}" cy="${centerY}" r="${(28 + glow * 14).toFixed(1)}" fill="#fde68a" opacity="${(0.12 + glow * 0.16).toFixed(3)}"/>` +
      `<circle cx="${centerX}" cy="${centerY}" r="${(22 + glow * 9).toFixed(1)}" fill="#f59e0b" opacity="${(0.2 + glow * 0.22).toFixed(3)}"/>`
    : ''
  const ringMarkup = highlighted
    ? '<circle cx="27" cy="27" r="22" fill="none" stroke="#fbbf24" stroke-width="3"/>'
    : ''

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="0 0 ${viewWidth} ${viewHeight}">` +
    glowMarkup +
    `<g transform="translate(${pad} ${pad})">` +
    `<path fill="${marker.color}" d="M27 2C13.2 2 2 13.2 2 27c0 18.8 25 37 25 37s25-18.2 25-37C52 13.2 40.8 2 27 2Z"/>` +
    ringMarkup +
    `<circle cx="27" cy="27" r="19" fill="${marker.inner}"/>` +
    `<path fill="white" d="${marker.path}"/>` +
    `<circle cx="39" cy="15" r="10" fill="#111827"/>` +
    `<text x="39" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="800" fill="white">${count}</text>` +
    `</g></svg>`

  return {
    anchor: new googleApi.maps.Point(anchorX, anchorY),
    scaledSize: new googleApi.maps.Size(width, height),
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
  }
}

function voteMarkerMeta(voteType: VoteType) {
  switch (voteType) {
    case 'MUSIC':
      return {
        color: '#7c3aed',
        inner: '#6d28d9',
        path: 'M31 15v19.2A5.4 5.4 0 1 1 27 29V18.4l11-2.7V30A5.4 5.4 0 1 1 34 25V14.3l-3 .7Z',
      }
    case 'FOOD':
      return {
        color: '#16a34a',
        inner: '#15803d',
        path: 'M18 14h2v12h-2V14Zm4 0h2v12h-2V14Zm-6 0h2v12h-2V14Zm2 15h4v13h-4V29Zm14-15h4v28h-4V30h-5c.2-7 1.7-12.3 5-16Z',
      }
    case 'SPORTS':
      return {
        color: '#2563eb',
        inner: '#1d4ed8',
        path: 'M27 13a14 14 0 1 0 0 28 14 14 0 0 0 0-28Zm-2 4a10 10 0 0 1 4 0l-2 4-2-4Zm-6 4 4 2-1 4-4-3 1-3Zm16 0 1 3-4 3-1-4 4-2Zm-8 5 4 3-1.5 5h-5L23 29l4-3Zm-8 9 4-1 2 3-4 1-2-3Zm16 0-2 3-4-1 2-3 4 1Z',
      }
    case 'DRINK':
      return {
        color: '#0891b2',
        inner: '#0e7490',
        path: 'M17 15h20l-2.3 25H19.3L17 15Zm4.4 5 .5 6h10.2l.5-6H21.4Zm1 11 .4 5h8.4l.4-5h-9.2Z',
      }
    default:
      return {
        color: '#0f766e',
        inner: '#0d9488',
        path: 'M27 14a11 11 0 1 0 0 22 11 11 0 0 0 0-22Zm0 6a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z',
      }
  }
}
function mapGooglePlace(
  place: google.maps.places.Place,
  location: google.maps.LatLng
): GooglePlaceDraft {
  return {
    googlePlaceId: place.id,
    name: place.displayName!,
    googlePlaceName: place.displayName!,
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

async function createDraftFromLatLng(
  googleApi: typeof google,
  latLng: google.maps.LatLng,
  fallbackCity?: string
): Promise<GooglePlaceDraft> {
  const latitude = latLng.lat()
  const longitude = latLng.lng()
  const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
  const baseDraft = {
    googlePlaceId: `map-click:${latitude.toFixed(7)}:${longitude.toFixed(7)}`,
    name: 'Ponto selecionado',
    formattedAddress: coordinates,
    latitude,
    longitude,
    city: fallbackCity?.trim() || undefined,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  }

  try {
    const result = await reverseGeocodeLatLng(googleApi, latLng)

    if (!result) {
      return baseDraft
    }

    return {
      ...baseDraft,
      formattedAddress: result.formatted_address || coordinates,
      city:
        geocodeComponent(result, 'administrative_area_level_2') ??
        geocodeComponent(result, 'locality') ??
        baseDraft.city,
      state: geocodeComponent(result, 'administrative_area_level_1'),
      country: geocodeComponent(result, 'country'),
    }
  } catch {
    return baseDraft
  }
}

function reverseGeocodeLatLng(googleApi: typeof google, latLng: google.maps.LatLng) {
  return new Promise<google.maps.GeocoderResult | null>((resolve) => {
    const geocoder = new googleApi.maps.Geocoder()

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status !== googleApi.maps.GeocoderStatus.OK || !results?.[0]) {
        resolve(null)
        return
      }

      resolve(results[0])
    })
  })
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

function updateExistingMarkersVisibility(_map: google.maps.Map, markers: google.maps.Marker[]) {
  markers.forEach((marker) => marker.setVisible(true))
}

function distanceInMeters(from: google.maps.LatLng, to: google.maps.LatLng) {
  const earthRadiusInMeters = 6371000
  const fromLat = toRadians(from.lat())
  const toLat = toRadians(to.lat())
  const deltaLat = toRadians(to.lat() - from.lat())
  const deltaLng = toRadians(to.lng() - from.lng())

  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2

  return earthRadiusInMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
