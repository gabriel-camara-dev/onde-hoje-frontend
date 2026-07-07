import type { MapFilters } from '../../api/ondeHoje'

const storageKey = 'onde-hoje:home-map-filters'

type StoredHomeMapFilters = Pick<MapFilters, 'city' | 'day' | 'groupPublicId'>

export function loadHomeMapFilters(defaultFilters: MapFilters): MapFilters {
  if (typeof window === 'undefined') {
    return defaultFilters
  }

  try {
    const storedFilters = JSON.parse(
      window.sessionStorage.getItem(storageKey) ?? 'null'
    ) as Partial<StoredHomeMapFilters> | null

    if (!storedFilters || typeof storedFilters !== 'object') {
      return defaultFilters
    }

    return {
      ...defaultFilters,
      city: typeof storedFilters.city === 'string' ? storedFilters.city : defaultFilters.city,
      day: typeof storedFilters.day === 'string' ? storedFilters.day : defaultFilters.day,
      groupPublicId:
        typeof storedFilters.groupPublicId === 'string'
          ? storedFilters.groupPublicId
          : defaultFilters.groupPublicId,
    }
  } catch {
    return defaultFilters
  }
}

export function saveHomeMapFilters(filters: MapFilters) {
  if (typeof window === 'undefined') {
    return
  }

  const storedFilters: StoredHomeMapFilters = {
    city: filters.city,
    day: filters.day,
    groupPublicId: filters.groupPublicId,
  }

  window.sessionStorage.setItem(storageKey, JSON.stringify(storedFilters))
}
