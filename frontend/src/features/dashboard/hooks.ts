import { useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '@/features/auth/hooks'
import { apiFetch } from '@/lib/api'

export interface KPIDashboard {
  prenotazioni_oggi: number
  prenotazioni_settimana: number
  servizio_piu_richiesto: { nome: string; conteggio: number } | null
  tasso_occupazione_oggi: number
  fatturato_settimana: string
  tasso_no_show: number
}

const RUOLI_STAFF = ['Amministratore', 'Operatore']

export function useKPIDashboard() {
  const { data: user } = useCurrentUser()
  const eStaff = !!user && user.ruoli.some((r) => RUOLI_STAFF.includes(r))

  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: () => apiFetch<KPIDashboard>('/dashboard/kpi/'),
    enabled: eStaff,
  })
}
