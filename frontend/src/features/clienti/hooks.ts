import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { clienteApi } from './api'
import type { ClienteInput } from './types'

const CHIAVE_CLIENTI = ['clienti'] as const

export function useClienti(pagina: number, ricerca = '') {
  const params = new URLSearchParams({ page: String(pagina) })
  if (ricerca) params.set('search', ricerca)

  return useQuery({
    queryKey: [...CHIAVE_CLIENTI, pagina, ricerca],
    queryFn: () => clienteApi.lista(`?${params.toString()}`),
  })
}

export function useCreaCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dati: ClienteInput) => clienteApi.crea(dati),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHIAVE_CLIENTI }),
  })
}

export function useAggiornaCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dati }: { id: string; dati: Partial<ClienteInput> }) =>
      clienteApi.aggiorna(id, dati),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHIAVE_CLIENTI }),
  })
}
