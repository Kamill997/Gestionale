import { creaClientRisorsa } from '@/lib/api'

import type { Cliente, ClienteInput } from './types'

export const clienteApi = creaClientRisorsa<Cliente, ClienteInput>('/clienti/')
