# Guida al Vibe Coding con questi File

## Cos'è, in pratica

"Vibe coding" qui significa: invece di scrivere il codice riga per riga, si guida un'IA (es. Claude Code) con istruzioni via via più specifiche, verificando il risultato a ogni passo. I file `00`-`09` di questa raccolta servono esattamente a questo: sono le specifiche che l'IA userà come riferimento invece di doverle inventare (o indovinare) da sola.

## Preparazione

1. Crea la cartella del progetto e mettici dentro tutti questi file `.md` in una sottocartella, es. `docs/`
2. Inizializza un repository Git fin da subito, anche prima di scrivere codice: ogni fase completata sarà un commit, così puoi tornare indietro se una fase va storta
3. Tieni la cartella `docs/` aggiornata mano a mano che prendi decisioni definitive diverse da quanto scritto qui — diventa la documentazione reale del progetto, non solo il piano iniziale

## Strumento consigliato

Per questo tipo di lavoro — codice reale, su più file, in un repository — uno strumento agentico come **Claude Code** è più adatto di una semplice chat: legge direttamente i file del progetto (inclusi questi `.md`), scrive/modifica file, esegue comandi (installazione pacchetti, migrazioni, test) senza dover copiare-incollare codice avanti e indietro.

## La regola più importante: procedere a fasi, non tutto insieme

Non chiedere "costruisci tutto il gestionale" in un solo prompt: il risultato sarà difficile da verificare e correggere. Meglio seguire le fasi già definite in `05-passaggi-esecutivi.md`, una alla volta, verificando che ognuna funzioni davvero prima di passare alla successiva.

## Sequenza di prompt suggerita

**1. Setup iniziale**
> Ho una cartella `docs/` con la documentazione di un progetto gestionale PWA per un salone di parrucchiere (file `00`-`09` più `esempio-settore-parrucchiere.md`). Leggi `00-README.md`, `01-frontend.md`, `02-backend.md` e `06-docker-e-cicd.md`. Inizializza lo scaffolding del progetto (cartelle `frontend/` con Vite+React+TypeScript, `backend/` con Django + Django REST Framework, `docker-compose.yml` e Dockerfile) esattamente come descritto. Non implementare ancora nessuna funzionalità applicativa: solo la struttura, poi verifica che `docker compose up` avvii tutto senza errori.

**2. Autenticazione e ruoli**
> Ora implementa il modulo di autenticazione descritto in `02-backend.md`: modelli Django per `User`, `Role`, `Permission`; endpoint di registrazione e login con djangorestframework-simplejwt (access+refresh token); permessi RBAC di base sui viewset. Segui lo schema riportato nel file, non inventarne uno diverso.

**3. Entità di dominio**
> Leggi `esempio-settore-parrucchiere.md`. Implementa i modelli Django e le API CRUD (viewset DRF) per le entità Servizi, Operatori e Clienti come descritte nel file, seguendo il diagramma ER incluso.

**4. Prenotazioni**
> Implementa l'entità Prenotazioni e la logica di calcolo della disponibilità descritta in `esempio-settore-parrucchiere.md` (sezione "Logica di business specifica delle prenotazioni"): calcolo slot liberi, prevenzione doppia prenotazione, policy di cancellazione.

**5. Frontend delle funzionalità core**
> Costruisci lato frontend: layout base descritto in `01-frontend.md`, poi le pagine di login, catalogo servizi e flusso di prenotazione, collegate alle API già create.

**6. Pagamenti e presenze**
> Implementa quanto descritto in `08-pagamenti.md`: campi stato pagamento e stato presenza sulla prenotazione, conteggio no-show per email/telefono, invio email automatica e blocco delle prenotazioni future al raggiungimento della soglia, sblocco manuale lato amministratore, e la dashboard guadagni basata su questi dati.

**7. PWA**
> Segui `04-pwa-checklist.md` per rendere l'app installabile: configura `vite-plugin-pwa`, il manifest e le strategie di caching descritte.

Da qui in poi si continua con notifiche, reportistica, import/export, seguendo lo stesso schema: **un modulo alla volta, citando il file di riferimento nel prompt**.

## Buone pratiche mentre si procede

- **Un modulo per volta** — se una richiesta copre più aree (es. "fai autenticazione e anche il catalogo"), l'IA tende a fare entrambe le cose superficialmente invece di una cosa bene
- **Verifica prima di andare avanti** — prova davvero la funzionalità (avvia l'app, prova il flusso) prima di chiedere il modulo successivo
- **Commit frequenti** — un commit per ogni fase funzionante, così è facile tornare indietro
- **Chiedi anche i test** — "aggiungi anche qualche test per questo modulo" è un prompt che si ripaga da solo quando qualcosa si rompe più avanti
- **In caso di errore, incolla l'errore vero** — "non funziona" è poco utile per l'IA quanto lo sarebbe per un collega; il messaggio di errore/stack trace completo permette di risolvere subito
- **Rileggi il codice generato**, almeno a grandi linee — resta comunque il tuo progetto, e capire cosa è stato scritto aiuta sia a discuterne (es. in una relazione) sia a correggere quando serve

## Checklist prima di iniziare

- [ ] Tutti i file `.md` copiati in `docs/` dentro il repository del progetto
- [ ] Repository Git inizializzato
- [ ] Strumento di vibe coding scelto e configurato (es. Claude Code)
- [ ] Prima richiesta pronta: setup iniziale, non l'intero progetto
- [ ] Un'idea chiara delle fasi da seguire una alla volta (basata su `05-passaggi-esecutivi.md`)
