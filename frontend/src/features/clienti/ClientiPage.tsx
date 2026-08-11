import { useState } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import { FormModal, type CampoFormModal } from '@/components/form-modal/form-modal'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { useToast } from '@/components/ui/toast'
import { ApiError } from '@/lib/api'

import { useAggiornaCliente, useClienti, useCreaCliente } from './hooks'
import { clienteSchema, type ClienteFormValues } from './schema'
import type { Cliente } from './types'

const CAMPI_FORM: CampoFormModal<ClienteFormValues>[] = [
  { name: 'nome', label: 'Nome', type: 'text' },
  { name: 'email', label: 'Email', type: 'email' },
  { name: 'telefono', label: 'Telefono', type: 'tel' },
  {
    name: 'note_preferenze',
    label: 'Note e preferenze',
    type: 'textarea',
    placeholder: 'Es. colore abituale. Evitare dati sanitari salvo necessità (GDPR).',
  },
]

export function ClientiPage() {
  const [pagina, setPagina] = useState(1)
  const [ricerca, setRicerca] = useState('')
  const [clienteInModifica, setClienteInModifica] = useState<Cliente | null>(null)
  const [modaleAperto, setModaleAperto] = useState(false)

  const { data, isLoading } = useClienti(pagina, ricerca)
  const creaMutation = useCreaCliente()
  const aggiornaMutation = useAggiornaCliente()
  const { showToast } = useToast()

  const apriPerCreazione = () => {
    setClienteInModifica(null)
    setModaleAperto(true)
  }

  const apriPerModifica = (cliente: Cliente) => {
    setClienteInModifica(cliente)
    setModaleAperto(true)
  }

  const handleSubmit = async (valori: ClienteFormValues) => {
    try {
      if (clienteInModifica) {
        await aggiornaMutation.mutateAsync({ id: clienteInModifica.id, dati: valori })
        showToast('Cliente aggiornato.')
      } else {
        await creaMutation.mutateAsync(valori)
        showToast('Cliente creato.')
      }
      setModaleAperto(false)
    } catch (error) {
      const messaggio =
        error instanceof ApiError ? 'Controlla i dati inseriti.' : 'Errore imprevisto, riprova.'
      showToast(messaggio, 'error')
    }
  }

  const columns: ColumnDef<Cliente, unknown>[] = [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'telefono', header: 'Telefono' },
    {
      accessorKey: 'user',
      header: 'Account',
      cell: ({ row }) => (row.original.user ? 'Sì' : 'Ospite'),
    },
    {
      id: 'azioni',
      header: '',
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Modifica"
            onClick={() => apriPerModifica(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Clienti"
        description="Anagrafica clienti. I clienti registrati creano il proprio record automaticamente; qui si aggiungono i clienti ospiti (prenotazioni telefoniche)."
        actions={
          <Button onClick={apriPerCreazione}>
            <Plus className="h-4 w-4" />
            Nuovo cliente
          </Button>
        }
      />

      <div className="mb-4 max-w-xs">
        <Input
          placeholder="Cerca per nome, email o telefono…"
          value={ricerca}
          onChange={(e) => {
            setRicerca(e.target.value)
            setPagina(1)
          }}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.results ?? []}
        isLoading={isLoading}
        emptyTitle="Nessun cliente trovato"
        emptyDescription={
          ricerca
            ? 'Prova una ricerca diversa.'
            : 'I clienti compariranno qui dopo la prima registrazione o prenotazione.'
        }
        pagination={
          data
            ? { page: pagina, totalCount: data.count, pageSize: 25, onPageChange: setPagina }
            : undefined
        }
      />

      <FormModal
        open={modaleAperto}
        onOpenChange={setModaleAperto}
        title={clienteInModifica ? 'Modifica cliente' : 'Nuovo cliente ospite'}
        schema={clienteSchema}
        fields={CAMPI_FORM}
        defaultValues={clienteInModifica ?? {}}
        isSubmitting={creaMutation.isPending || aggiornaMutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
