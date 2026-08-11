# Importazione ed Esportazione Dati in Blocco

## Perché serve

Quasi ogni gestionale reale, al momento dell'onboarding di un nuovo cliente, deve poter importare dati già esistenti: elenchi clienti da un vecchio CRM, catalogo prodotti da un file Excel, anagrafiche pazienti da un sistema legacy. Senza questa funzionalità, l'unica alternativa è l'inserimento manuale riga per riga, spesso impraticabile con migliaia di record. Allo stesso modo, prima o poi viene quasi sempre richiesta anche l'esportazione (per backup, analisi esterne, o passaggio a un altro sistema).

## Formati supportati

| Formato | Uso tipico |
|---|---|
| CSV | Il più universale, supportato da qualunque sistema legacy o foglio di calcolo |
| Excel (.xlsx) | Preferito dagli utenti non tecnici, supporta più fogli e formattazione |
| JSON | Utile per integrazioni tra sistemi moderni (API-to-API), meno per l'utente finale |

## Flusso di importazione

1. **Upload del file** — l'utente carica CSV/Excel tramite un componente dedicato nel modulo Anagrafiche
2. **Parsing e anteprima** — il sistema legge le prime righe e le mostra in una tabella di anteprima
3. **Mappatura colonne** — l'utente associa le colonne del file ai campi del sistema (es. "Nome Cliente" del file → campo `nome` dell'entità); conviene salvare le mappature usate di frequente come "preset" riutilizzabili
4. **Validazione** — ogni riga viene validata riusando lo stesso serializer DRF usato per la creazione manuale (lato backend, vedi `02-backend.md`), così le regole restano uniche e coerenti tra inserimento singolo e massivo
5. **Conferma ed elaborazione** — l'utente conferma, il sistema elabora l'import (in background se il file è grande, vedi sotto)
6. **Report finale** — quante righe importate con successo, quante fallite e perché, con possibilità di scaricare un file con solo le righe in errore per correggerle e ricaricarle

## Gestione file grandi: elaborazione asincrona

Per file oltre poche centinaia di righe, non elaborare la richiesta in modo sincrono (rischio di timeout HTTP):

1. Il file viene caricato e salvato temporaneamente (storage S3-compatibile, vedi `02-backend.md`)
2. Un job viene accodato su **Celery** (già presente nello stack backend)
3. Il worker elabora il file a lotti (es. 500 righe alla volta), aggiornando una percentuale di completamento
4. A fine elaborazione, l'utente riceve una **notifica** (modulo Notifiche) con il link al report
5. Il frontend può mostrare lo stato di avanzamento tramite polling (TanStack Query con `refetchInterval`) o via WebSocket se già implementato

## Validazione e gestione errori

- Validare riga per riga, non l'intero file in blocco: una riga malformata non deve bloccare l'importazione delle altre
- Distinguere errori **bloccanti** (es. campo obbligatorio mancante → riga scartata) da **avvisi** (es. formato data ambiguo, corretto automaticamente ma segnalato)
- Conservare un log dettagliato dell'importazione (collegato a `audit_log`): chi ha importato, quando, quante righe, con quale esito

## Deduplica

Definire una o più **chiavi di match** per riconoscere record già esistenti (es. email per i clienti, codice fiscale per i pazienti, SKU per i prodotti):
- Se il record esiste già: proporre "aggiorna" o "salta", mai sovrascrivere silenziosamente
- Se il file stesso contiene duplicati interni: segnalarli esplicitamente nel report

## Template di importazione

Fornire un file CSV/Excel di esempio scaricabile direttamente dall'interfaccia, con le intestazioni di colonna corrette e una riga di esempio: riduce drasticamente gli errori di mappatura da parte dell'utente.

## Flusso di esportazione

- **Esportazione filtrata**: rispettare i filtri/ricerca attivi nella tabella corrente (esportare "quello che vedo", non sempre tutto il dataset)
- **Esportazione completa**: per dataset piccoli, generazione sincrona e download immediato; per dataset grandi, stesso pattern asincrono dell'importazione (coda + notifica con link al file pronto)
- Il file esportato non deve restare disponibile a tempo indeterminato su storage pubblico: prevedere una scadenza del link di download (es. 24-48 ore)

## Migrazione una tantum da sistemi legacy

Da distinguere dalla normale funzionalità di importazione ricorrente: quando si migra un intero cliente da un sistema esistente, conviene scrivere script di migrazione dedicati (approccio ETL):

1. **Extract** — estrazione dati dal sistema sorgente (dump del DB, export CSV, chiamate API)
2. **Transform** — pulizia e mappatura dei dati nel nuovo schema (normalizzazione formati, gestione valori mancanti)
3. **Load** — inserimento nel nuovo database, preferibilmente in un'unica transazione per poter fare rollback in caso di errore grave

Questi script vanno tenuti in una cartella dedicata (es. `scripts/migration/`), versionati ma eseguiti una tantum, separati dal codice applicativo che gestisce l'importazione ricorrente lato utente.

## Sicurezza

- Validare tipo e dimensione del file in upload (rifiutare estensioni non previste, limitare la dimensione massima)
- Verificare i permessi RBAC: l'importazione/esportazione di massa va riservata a ruoli specifici (spesso solo admin/manager), non a tutti gli utenti
- Registrare ogni importazione/esportazione nell'audit log: un'esportazione di massa di dati personali è un evento rilevante anche ai fini della protezione dei dati

## Librerie consigliate

| Livello | Libreria | Uso |
|---|---|---|
| Frontend | **papaparse** | Parsing CSV lato client per l'anteprima |
| Frontend | **SheetJS (xlsx)** | Lettura/scrittura Excel lato client |
| Backend | **pandas** | Parsing/validazione CSV ed Excel lato server, con ottime prestazioni anche su file grandi |
| Backend | **openpyxl** | Lettura/scrittura Excel quando serve un controllo più fine del semplice DataFrame (es. formattazione) |
| Backend | **Celery** | Elaborazione asincrona a lotti (già presente nello stack, vedi `02-backend.md`) |

## Checklist

- [ ] Componente di upload con anteprima e mappatura colonne
- [ ] Validazione riga per riga con serializer condivisi con la creazione manuale
- [ ] Elaborazione asincrona per file oltre una soglia dimensionale definita
- [ ] Report di importazione scaricabile (righe ok / righe in errore)
- [ ] Strategia di deduplica definita per ogni entità importabile
- [ ] Template di importazione scaricabile per ogni entità
- [ ] Esportazione filtrata e completa, sincrona e asincrona
- [ ] Permessi RBAC verificati su import/export
- [ ] Log di audit per ogni operazione di massa
