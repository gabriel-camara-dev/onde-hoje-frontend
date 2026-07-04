import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { createPlace, listPlaces, type MapFilters } from '../../api/ondeHoje'
import Button from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import Input from '../../components/ui/Input'
import { Panel } from '../../components/ui/Panel'
import { StatusBanner } from '../../components/ui/StatusBanner'
import { formatInputDate } from '../../lib/date'

type PlacesPageProps = {
  filters?: MapFilters
}

export default function PlacesPage({ filters: initialFilters }: PlacesPageProps) {
  const queryClient = useQueryClient()
  const filters = initialFilters ?? { city: '', day: formatInputDate(new Date()), q: '' }
  const placesQuery = useQuery({
    queryKey: ['places', filters],
    queryFn: () => listPlaces(filters),
  })

  const createMutation = useMutation({
    mutationFn: (form: FormData) =>
      createPlace({
        googlePlaceId: String(form.get('googlePlaceId')),
        name: String(form.get('name')),
        formattedAddress: String(form.get('formattedAddress')),
        latitude: Number(form.get('latitude')),
        longitude: Number(form.get('longitude')),
        city: String(form.get('city') || '') || undefined,
        state: String(form.get('state') || '') || undefined,
        country: 'Brasil',
        photoUrl: String(form.get('photoUrl') || '') || undefined,
        mapsUrl: String(form.get('mapsUrl') || '') || undefined,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['places'] }),
  })

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createMutation.mutate(new FormData(event.currentTarget))
    event.currentTarget.reset()
  }

  const places = placesQuery.data ?? []

  return (
    <>
      <StatusBanner
        error={placesQuery.error?.message ?? createMutation.error?.message}
        loading={placesQuery.isLoading || createMutation.isPending}
        message={createMutation.isSuccess ? 'Lugar salvo e ativado.' : undefined}
      />
      <section className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <Panel>
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Lugares cadastrados</h1>
            <strong className="text-muted">{places.length}</strong>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {places.length === 0 ? (
              <EmptyState
                title="Nenhum lugar encontrado"
                description="Use a busca ou cadastre um lugar pelo formulario lateral."
              />
            ) : (
              places.map((place) => (
                <article key={place.id} className="grid gap-2 rounded-lg border border-line p-3">
                  <strong>{place.name}</strong>
                  <span className="text-sm text-muted">{place.formattedAddress}</span>
                  <small className="font-medium text-teal">
                    {[place.city, place.state].filter(Boolean).join(', ')}
                  </small>
                </article>
              ))
            )}
          </div>
        </Panel>
        <Panel>
          <h2 className="mb-4 text-lg font-semibold">Cadastrar lugar</h2>
          <form className="grid gap-3" onSubmit={handleCreate}>
            <Input label="Google Place ID" name="googlePlaceId" required />
            <Input label="Nome" minLength={2} name="name" required />
            <Input label="Endereco" minLength={3} name="formattedAddress" required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Latitude" name="latitude" required step="any" type="number" />
              <Input label="Longitude" name="longitude" required step="any" type="number" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Cidade" name="city" />
              <Input label="Estado" name="state" />
            </div>
            <Input label="Foto URL" name="photoUrl" type="url" />
            <Input label="Maps URL" name="mapsUrl" type="url" />
            <Button type="submit">Salvar lugar</Button>
          </form>
        </Panel>
      </section>
    </>
  )
}

