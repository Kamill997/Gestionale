# Gestionale Salone di Parrucchiere

PWA gestionale per un salone di parrucchiere/centro estetico: prenotazioni,
catalogo servizi, notifiche, gestione clienti/operatori, lato cliente e
amministratore.

Il progetto segue lo scheletro generico documentato in `docs/` (adattabile
ad altri settori) e il caso applicato in `docs/esempio-settore-parrucchiere.md`.

## Stack

- **Frontend**: React 18+ (Vite, TypeScript), Tailwind CSS, React Router,
  TanStack Query, Zustand — vedi `docs/01-frontend.md`
- **Backend**: Python, Django + Django REST Framework, PostgreSQL, Redis,
  Celery — vedi `docs/02-backend.md`
- **PWA**: `vite-plugin-pwa` (introdotto in Fase 5) — vedi `docs/04-pwa-checklist.md`

## Struttura

```
.
├── docs/                    # documentazione di riferimento (fonte di verità del progetto)
├── frontend/                 # Vite + React + TypeScript
├── backend/                  # Django + Django REST Framework
├── docker-compose.yml         # ambiente locale (Postgres, Redis, backend, worker, frontend)
├── .env.example               # variabili d'ambiente, copiare in .env
└── .github/workflows/ci.yml   # CI: lint + test per backend e frontend
```

## Avvio rapido (Docker)

```bash
cp .env.example .env      # e impostare un DJANGO_SECRET_KEY reale
docker compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Documentazione API (Swagger): http://localhost:8000/api/docs/
- Adminer (client DB): http://localhost:8080

> Nota: `docker compose up` non è stato eseguibile in questo ambiente di
> generazione (Docker non disponibile nella sandbox). Le migrazioni e i
> test sono comunque stati verificati contro un Postgres 16 e un Redis 7
> reali installati nella sandbox stessa (stesse versioni delle immagini
> in `docker-compose.yml`), non contro sqlite. Il primo `docker compose up`
> locale resta il passo di verifica conclusivo della Fase 1
> (vedi `docs/05-passaggi-esecutivi.md`).

## Avvio rapido (senza Docker)

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py runserver

# Frontend (in un altro terminale)
cd frontend
npm install
npm run dev
```

Per accedere al Django Admin, creare un superuser (chiede email, non username):

```bash
cd backend && python manage.py createsuperuser
```

## API disponibili (Fase 2-4)

Tutte sotto `/api/v1/`, JWT in cookie httpOnly (non header `Authorization`):

| Endpoint | Metodo | Auth | Note |
|---|---|---|---|
| `auth/register/` | POST | pubblico | crea utente + record Cliente collegato, ruolo `Cliente` automatico |
| `auth/login/` | POST | pubblico | imposta cookie `access_token`/`refresh_token` |
| `auth/logout/` | POST | autenticato | invalida il refresh token, cancella i cookie |
| `auth/refresh/` | POST | cookie refresh | rinnova `access_token` |
| `auth/csrf/` | GET | pubblico | imposta il cookie `csrftoken` (chiamare all'avvio della SPA) |
| `auth/me/` | GET | autenticato | dati utente corrente |
| `admin/utenti/` | GET/POST/PATCH | ruolo `Amministratore` | gestione utenti/ruoli completa |
| `servizi/` | GET | autenticato | lettura per tutti; filtri `categoria`/`attivo`, ricerca |
| `servizi/` | POST/PUT/DELETE | ruolo `Amministratore` | gestione catalogo |
| `operatori/` | GET | autenticato | lettura per tutti (serve per scegliere l'operatore in prenotazione) |
| `operatori/` | POST/PUT/DELETE | ruolo `Amministratore` | gestione staff |
| `clienti/` | GET/POST/PATCH | autenticato | staff vede/gestisce tutti i clienti; un Cliente vede solo il proprio record (senza le note interne) |
| `disponibilita/` | GET | autenticato | turni settimanali degli operatori |
| `disponibilita/` | POST/PUT/DELETE | ruolo `Amministratore` | gestione turni |
| `slot-disponibili/` | GET | autenticato | `?operatore=&servizio=&data=YYYY-MM-DD` → slot liberi |
| `prenotazioni/` | GET/POST | autenticato | un Cliente vede/crea solo le proprie; un Operatore solo le proprie assegnate; Amministratore tutte |
| `prenotazioni/{id}/cancella/` | POST | autenticato | libera fino a 24h prima (configurabile); lo staff può sempre |
| `prenotazioni/{id}/segna-presenza/` | POST | staff | `{"stato_presenza": "presente"\|"non_presente"}` — incrementa il no-show se assente |
| `clienti/{id}/sblocca/` | POST | ruolo `Amministratore` | rimuove il blocco no-show (il contatore resta) |
| `dashboard/kpi/` | GET | ruolo `Amministratore`/`Operatore` | prenotazioni oggi/settimana, servizio top, occupazione, fatturato, tasso no-show |

Le richieste `POST`/`PUT`/`PATCH`/`DELETE` autenticate via cookie richiedono
l'header `X-CSRFToken` (valore del cookie `csrftoken`), tranne `login`.
Tutto questo è già gestito da `frontend/src/lib/api.ts` (`apiFetch`): i
moduli futuri devono passare da lì invece di usare `fetch` direttamente.

## Stato del progetto

**Fase 1 — Setup**: completata (scaffolding, linting/formatting, CI, Docker).

**Fase 2 — Autenticazione e ruoli**: completata (vedi `docs/05-passaggi-esecutivi.md` e
`docs/10-guida-vibe-coding.md` per la roadmap completa a fasi):

- [x] Modelli `User` (custom, login via email), `Role`, `Permission`, `AuditLog` — PK UUID come negli schema ER dei `docs/*.md`
- [x] Migrazioni applicate e verificate contro Postgres 16 reale
- [x] Ruoli seminati via data migration: Cliente, Operatore, Amministratore
- [x] Endpoint: `register`, `login`, `logout`, `refresh`, `csrf`, `me` — JWT in cookie httpOnly (mai localStorage, vedi `docs/02-backend.md`), con protezione CSRF dedicata
- [x] Guard RBAC dimostrato su un endpoint protetto (`/api/v1/admin/utenti/`, solo ruolo Amministratore)
- [x] Django Admin configurato per tutti i modelli
- [x] Swagger (`/api/docs/`) raggiungibile
- [x] 11 test pytest verdi contro Postgres+Redis reali (registrazione, login/logout, refresh, guard RBAC)

Nessun'altra funzionalità applicativa implementata di proposito (niente
Servizi/Operatori/Clienti/Prenotazioni ancora): un modulo alla volta, come
indicato in `docs/10-guida-vibe-coding.md`.

**Fase 3 — Fondamenta frontend**: completata:

- [x] Routing con layout (sidebar + header + area di contenuto)
- [x] Integrazione autenticazione: login vero contro il backend (cookie httpOnly + CSRF), sessione utente come stato server (TanStack Query), rotte protette con redirect a `/login`
- [x] Design system minimo: bottoni, input, tabella, modale (Tailwind + Radix, ispirato a shadcn/ui), token di design dedicati (non i default generici)
- [x] Verificato end-to-end: Django reale + richieste cross-origin da `localhost:5173` (preflight CORS, cookie `Set-Cookie` httpOnly, `X-CSRFToken`) — non solo test pytest, anche il percorso browser vero
- [x] 2 test frontend (redirect utente non autenticato, flusso di login completo)

> Nota su `npm audit`: segnala un CSRF su react-router (Framework Mode/RSC).
> Non ci riguarda: il progetto usa `<BrowserRouter>` (Declarative Mode),
> esplicitamente escluso dall'advisory. Nessuna versione più recente
> disponibile su npm al momento della generazione; da ricontrollare in
> Fase 9 (aggiornamento dipendenze).

**Fase 4 — Sviluppo Feature Core**: in corso. Completato finora (backend,
entità di dominio — vedi `docs/esempio-settore-parrucchiere.md`):

- [x] Modelli `Servizio`, `Operatore`, `Cliente` (`Cliente.user` è opzionale: supporta prenotazioni da ospite, vedi `docs/08-pagamenti.md`)
- [x] API CRUD per tutti e tre, con filtri/ricerca; lettura per qualunque utente autenticato, scrittura riservata all'Amministratore (Servizi/Operatori)
- [x] Scoping per dati sensibili su Clienti: staff vede tutti, un Cliente vede solo il proprio record
- [x] Registrazione (Fase 2) ora crea automaticamente anche il record Cliente collegato
- [x] 25 test pytest verdi (9 nuovi su Servizi/Operatori/Clienti)
- [x] CRUD generico riusabile lato frontend (`DataTable`, `FormModal`, `ConfirmDialog`, `RoleGuard`, `Toast`, `PageHeader`, `EmptyState`, `Badge`, `Select`, `Textarea`)
- [ ] Dashboard con KPI reali
- [ ] Gestione Utenti & Ruoli lato UI
- [x] Entità Prenotazioni + calcolo disponibilità (modelli `Disponibilita`, `Prenotazione`, `Impostazione`)
- [x] Prima pagina di dominio reale: Servizi (catalogo per tutti, CRUD per Amministratore) — dimostra l'intera pipeline generica end-to-end
- [x] Flusso di prenotazione lato cliente (scelta servizio/operatore/data → slot liberi → conferma) e pagina "Le mie prenotazioni" (storico + cancellazione)
- [x] Pagina Operatori (CRUD completo, Amministratore — collegata a un account utente esistente)
- [x] Dashboard con KPI reali (prenotazioni oggi/settimana, servizio più richiesto, tasso di occupazione — staff; prossimo appuntamento — Cliente)
- [x] Pagina Clienti (staff: CRUD + ricerca; note interne nascoste al Cliente stesso)
- [x] Gestione Utenti & Ruoli lato UI (creazione, assegnazione ruoli multipli, sospensione)
- [ ] Import/export dati (`07-import-export-dati.md`)
- [ ] Pagamenti/presenze e politica no-show (`08-pagamenti.md`)

**Fase 4 è completa.** Aggiunto anche **08-pagamenti.md** (pagamenti,
presenze, politica no-show) — non era nella checklist originale di Fase 4
ma è direttamente collegato a Prenotazioni, quindi affrontato subito dopo:

- [x] Campo `stato_pagamento` + `importo` (dal prezzo del servizio, sovrascrivibile) su ogni prenotazione — solo staff può modificarli
- [x] Campo `stato_presenza`, azione dedicata `segna-presenza` (solo staff)
- [x] Conteggio no-show su `Cliente` (`contatore_no_show`, `bloccato`), soglia configurabile (default 3), blocco automatico, sblocco manuale (solo Amministratore)
- [x] Un cliente bloccato non può creare nuove prenotazioni
- [x] Dashboard: fatturato (7 giorni, solo pagato) e tasso no-show ora reali, non più omessi
- [ ] Import/export dati (`07-import-export-dati.md`) — resta
- [ ] Email automatica al raggiungimento soglia — richiede il modulo Notifiche (non costruito); l'evento viene comunque registrato in `AuditLog`

**Prossimo passo**: `07-import-export-dati.md`, poi Fase 5 (PWA). L'interfaccia
staff dedicata a segnare pagamento/presenza su *tutte* le prenotazioni è
ora costruita (era l'ultimo pezzo scoperto, vedi sotto).

**Pagina Gestione prenotazioni (nuova):**

- Vista staff su tutte le prenotazioni (Amministratore) o quelle assegnate
  (Operatore) — stesso endpoint di "Le mie prenotazioni", scoping diverso
  già gestito lato backend
- Toggle pagato/da pagare, marcatura presente/non presente (quest'ultima
  aggiorna in automatico il conteggio no-show e blocca il cliente se la
  soglia viene raggiunta), cancellazione, filtro per stato
- Backend: aggiunti `cliente_nome`/`operatore_nome`/`servizio_nome` in
  sola lettura al serializer — evita che ogni tabella lato frontend debba
  fare lookup separati solo per mostrare un nome invece di un id

**Bug reale corretto in questa fase**: aggiungere `importo` come campo
obbligatorio ha rotto ~15 test esistenti che creavano `Prenotazione`
direttamente via ORM senza specificarlo. Invece di correggere ogni sito di
creazione uno per uno, il fix giusto era nel modello: `Prenotazione.save()`
ora popola `importo` dal prezzo del servizio quando non specificato
esplicitamente — un default sensato invece di un obbligo sparso ovunque.

**Secondo bug reale, stessa famiglia di un fix precedente**: con la suite
cresciuta a 79 test, il throttling DRF (100 richieste anonime/ora) veniva
superato anche con la cache in-memory introdotta prima, dentro un solo
processo di test. Il throttling è ora disattivato del tutto sotto pytest,
non solo spostato su una cache più veloce: è un comportamento di
produzione, non deve interferire con l'esecuzione dei test.

> Bug reale trovato e corretto in questa fase: la cache Redis reale usata
> per il throttling DRF accumulava contatori tra una run di test e l'altra,
> fino a restituire 429 su richieste legittime. I test ora usano una cache
> in memoria (`LocMemCache`) invece di Redis — utile anche perché la CI
> (`.github/workflows/ci.yml`) non avvia un servizio Redis per i test.

**Prenotazioni — dettagli implementativi:**

- Prevenzione doppia prenotazione su **due livelli**: applicativo (calcolo
  slot + validazione prima di salvare) e **database** (indice di esclusione
  Postgres `EXCLUDE USING gist` su operatore+intervallo orario, richiede
  l'estensione `btree_gist`, verificato che regga anche bypassando la
  validazione Python)
- Buffer tra prenotazioni e granularità degli slot proposti sono
  configurabili (modulo `Impostazione`, chiave/valore), non hardcoded
- Policy di cancellazione: libera fino a N ore prima (default 24,
  configurabile); un Cliente non può auto-cancellare oltre la soglia, lo
  staff può sempre
- 3 bug di design trovati e corretti durante una revisione: il controllo
  "operatore/servizio attivo" bloccava anche modifiche che non toccano
  data/ora (es. solo la nota); il ricalcolo disponibilità durante un
  reschedule poteva confliggere con la prenotazione stessa; due file di
  test si erano sovrapposti per una svista, poi consolidati
- 20 test dedicati (calcolo slot, buffer, vincolo DB, scoping per ruolo,
  cancellazione, reschedule) — 45 totali nell'intero backend

**Frontend — componenti generici e prima pagina reale:**

- `DataTable` (tanstack-table: sorting + paginazione server-side),
  `FormModal` (schema Zod passato come prop, coerente con
  `docs/03-componenti-e-workflow.md`), `ConfirmDialog`, `RoleGuard`
  (nasconde azioni lato UI in base al ruolo — il backend resta l'unico
  posto dove i permessi sono davvero applicati), sistema di notifiche toast
- Pagina Servizi: catalogo visibile a tutti, CRUD riservato
  all'Amministratore, usa tutti i componenti sopra insieme per la prima volta
- Code splitting per rotta (`React.lazy`+`Suspense`), introdotto non
  preventivamente ma quando il bundle ha superato per davvero i 500KB
- 2 bug reali trovati e corretti: dipendenza `@tanstack/react-table` mai
  installata (dimenticata), e il `QueryClient` (singleton di modulo,
  corretto per l'app reale) contaminava la cache tra un test e l'altro —
  ora azzerata prima di ogni test

**Prossimo passo**: import/export dati (`07-import-export-dati.md`), poi
pagamenti/presenze e no-show (`08-pagamenti.md`), poi Fase 5 (PWA).

**Clienti e Gestione Utenti — dettagli:**

- Pagina Clienti (staff): CRUD + ricerca, distingue clienti registrati da
  clienti ospiti (senza account, per prenotazioni telefoniche)
- Le `note_preferenze` sono note interne: nascoste nella risposta API a un
  Cliente che guarda il proprio record, e non scrivibili da lui — solo lo
  staff le vede/modifica (coerente con la nota GDPR già nei docs)
- Pagina Utenti e ruoli (Amministratore): crea account con password diretta
  e ruoli multipli (checkbox), sospende/riattiva. Un vero invito via email
  resta un miglioramento naturale una volta pronto il modulo Notifiche
- Estesa `FormModal` con un nuovo tipo di campo (`checkbox-group`, via
  `Controller` di React Hook Form) per le selezioni multiple — riusabile
  ovunque servirà in futuro, non solo qui

**Dashboard KPI — dettagli e bug trovato:**

- Contenuto differenziato per ruolo: staff vede KPI di business
  (`/api/v1/dashboard/kpi/`, riservato ad Amministratore/Operatore), un
  Cliente vede il proprio prossimo appuntamento (o un invito a prenotare)
- KPI calcolati: prenotazioni oggi/7 giorni (escluse le cancellate),
  servizio più richiesto, tasso di occupazione di oggi (minuti prenotati
  / minuti disponibili secondo i turni configurati). **Il fatturato non
  c'è**: richiede il tracciamento pagamenti (`08-pagamenti.md`), non
  ancora costruito — niente numeri approssimati spacciati per reali
- **Bug reale corretto**: argomenti invertiti in un `datetime.combine()`
  nel calcolo dell'occupazione (`combine(time, time)` invece di
  `combine(date, time)`) — un `TypeError` a runtime, preso dal test scritto
  subito dopo, non da un controllo statico
- Verificato anche via chiamata diretta con un utente admin reale (non
  solo test): formato della risposta conforme al tipo TypeScript atteso

**Pagina Operatori e fix del giorno:**

- CRUD completo (Amministratore), collega un account utente esistente
  già presente (la creazione di nuovi utenti resta un modulo a sé: per ora
  si usa Django Admin)
- **Bug di design reale trovato in revisione, corretto centralmente**:
  eliminare un `Servizio`/`Operatore` con `Prenotazioni` collegate
  solleva `ProtectedError` lato Django (FK `PROTECT`, voluto: non si perde
  lo storico) — ma DRF non la gestisce di default, quindi sarebbe stato
  un 500 invece di un errore chiaro. Implementato l'exception handler
  centralizzato in `common/exceptions.py` (lasciato vuoto apposta dalla
  Fase 1, popolato ora che serve davvero): converte in un 400 con
  messaggio comprensibile ("disattivalo invece di eliminarlo")
- Sidebar e azioni di scrittura ora filtrate per ruolo in modo coerente
  su tutte le pagine (`RoleGuard` + voci di navigazione nascoste)

**Flusso di prenotazione — dettagli e bug trovati:**

- Pagina `/prenota`: servizio → operatore → data → slot liberi (chiama
  `/api/v1/slot-disponibili/`) → conferma. Pagina `/le-mie-prenotazioni`:
  storico con cancellazione (rispetta la policy lato backend)
- **Bug reale in un test, non nell'app**: la policy di cancellazione (24h)
  ha fatto fallire un test perché "martedì prossimo" può risultare a sole
  ~15h di distanza se il test gira di lunedì sera tardi — un giorno di
  calendario avanti non è sempre 24 ore vere. Il codice applicativo era
  corretto; corretto il fixture di test per garantire sempre ≥48h di margine
- **Bug reale di ambiente test**: senza fissare il fuso orario, gli orari
  mostrati in un test dipendevano dal fuso della macchina che lo esegue
  (differenza di 2h osservata: UTC vs Europe/Rome). Fissato `TZ=Europe/Rome`
  nella config di Vitest, stesso fuso del backend
- **Flakiness intermittente trovata**: la suite frontend a volte falliva
  in modo non deterministico eseguendo tutti i file insieme (mai in
  isolamento). Risolta forzando l'esecuzione sequenziale dei file di test
  (`fileParallelism: false`) — la suite è ancora piccola, la determinismo
  vale più della velocità qui
- Verificato anche via chiamate dirette (non solo test automatici): formato
  reale delle date restituite da `/slot-disponibili/`, corrispondenza con
  i tipi TypeScript lato frontend

## Convenzioni

- **Commit**: [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`...)
- **Branching**: trunk-based semplificato — branch corti da `main`,
  merge tramite PR quando la CI è verde
- Un modulo/fase alla volta, con verifica funzionale prima di passare al successivo
  (vedi `docs/10-guida-vibe-coding.md`)
