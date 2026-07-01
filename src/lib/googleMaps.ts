const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const googleMapsCallbackName = '__ondeHojeGoogleMapsReady__'

let googleMapsPromise: Promise<typeof google> | null = null

type GoogleMapsWindow = Window & {
  __ondeHojeGoogleMapsReady__?: () => void
}

export function hasGoogleMapsKey() {
  return Boolean(googleMapsApiKey)
}

export function loadGoogleMaps() {
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google)
  }

  if (!googleMapsApiKey) {
    return Promise.reject(new Error('Configure VITE_GOOGLE_MAPS_API_KEY para usar o mapa.'))
  }

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const globalWindow = window as GoogleMapsWindow

      const cleanup = () => {
        if (globalWindow.__ondeHojeGoogleMapsReady__ === resolveWhenReady) {
          delete globalWindow.__ondeHojeGoogleMapsReady__
        }
      }

      const resolveWhenReady = () => {
        cleanup()

        if (!window.google?.maps?.Map) {
          reject(new Error('Falha ao carregar Google Maps.'))
          return
        }

        resolve(window.google)
      }

      globalWindow.__ondeHojeGoogleMapsReady__ = resolveWhenReady

      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-google-maps="true"]'
      )

      if (existingScript) {
        if (window.google?.maps) {
          resolveWhenReady()
          return
        }

        if (!existingScript.src.includes(`callback=${googleMapsCallbackName}`)) {
          existingScript.remove()
        }

        if (document.querySelector<HTMLScriptElement>('script[data-google-maps="true"]')) {
          return
        }

        const script = document.createElement('script')
        script.async = true
        script.defer = true
        script.dataset.googleMaps = 'true'
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&language=pt-BR&region=BR&loading=async&callback=${googleMapsCallbackName}`
        script.onerror = () => {
          cleanup()
          reject(new Error('Falha ao carregar Google Maps.'))
        }
        document.head.appendChild(script)
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.defer = true
      script.dataset.googleMaps = 'true'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&language=pt-BR&region=BR&loading=async&callback=${googleMapsCallbackName}`
      script.onerror = () => {
        cleanup()
        reject(new Error('Falha ao carregar Google Maps.'))
      }
      document.head.appendChild(script)
    })
  }

  return googleMapsPromise
}
