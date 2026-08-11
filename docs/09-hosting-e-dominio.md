# Hosting e Dominio

## Cosa va hostato

Per questo progetto ci sono tipicamente tre pezzi da ospitare, separatamente o insieme su un solo VPS con Docker:

1. **Frontend** — build statico di Vite/React
2. **Backend** — servizio Python/Django sempre attivo
3. **Database e Redis** — spesso offerti come servizi gestiti dagli stessi provider del backend

## Hosting frontend

| Servizio | Piano gratuito | Piano a pagamento | Note |
|---|---|---|---|
| **Cloudflare Pages** | Banda illimitata, 500 build/mese | Da $5/mese | Il più conveniente in assoluto, soprattutto se il traffico cresce |
| **Netlify** | Sì, a crediti mensili | Circa $19/mese (piano team, non per singolo utente) | Buon compromesso, funzionalità aggiuntive integrate (form, ecc.) |
| **Vercel** | Sì, ma **solo per uso personale/non commerciale** | Da $20/utente/mese | Il piano gratuito non è utilizzabile per un progetto commerciale come un gestionale reale |

Per un progetto Vite+React "puro" (non Next.js), i tre si equivalgono molto di più che per un progetto Next.js, dove Vercel ha vantaggi specifici legati all'integrazione nativa. **Cloudflare Pages** è probabilmente il punto di partenza più sensato: gratuito per iniziare, economico se il salone cresce.

## Hosting backend + database

| Servizio | Piano gratuito | Piano a pagamento realistico | Note |
|---|---|---|---|
| **Render** | Sì, ma il backend "dorme" dopo 15 minuti di inattività (30-50 secondi di risveglio) e il Postgres gratuito scade dopo 30 giorni | Circa $14-21/mese (backend sempre attivo + Postgres) | Il più semplice e prevedibile |
| **Railway** | Solo credito di prova di 30 giorni, poi a pagamento | Circa $5-20/mese, uso variabile | Migliore esperienza di sviluppo, database gestiti con un clic |
| **Fly.io** | Nessun piano gratuito per nuovi account | Da circa $5/mese, a consumo | Il più flessibile e "vicino al metallo", richiede più competenza DevOps |
| **VPS + Docker** (es. Hetzner, DigitalOcean, OVH) | — | Da circa €4-6/mese per una VPS piccola | Usa direttamente il `docker-compose.yml` già preparato in `06-docker-e-cicd.md`; il più economico a regime, ma manutenzione e sicurezza restano a proprio carico |

Per iniziare, **Railway** è probabilmente il miglior compromesso per questo progetto (backend + Postgres + Redis gestiti insieme, senza dover configurare nulla di infrastrutturale, costo contenuto). Se in futuro i costi diventano un tema, una VPS con il Docker Compose già pronto è la strada più economica a regime.

## Nota sui costi complessivi

Per un salone che parte con pochi utenti, un budget realistico "tutto compreso" è nell'ordine di **10-25 €/mese** (frontend quasi gratis + backend/DB su Railway o Render), destinato a crescere solo se l'uso reale cresce.

## Dominio personale

Un dominio (es. `nomesalone.it` o `nomesalone.com`) costa indicativamente **10-20 €/anno** per le estensioni più comuni, spesso con un prezzo promozionale il primo anno e un rinnovo più caro: controllare sempre il prezzo di rinnovo, non solo quello di primo acquisto.

Punti da considerare:
- **.it**: riservato a residenti/aziende di UE (e pochi altri paesi) — nessun problema per un'attività italiana, ma da sapere se in futuro si pensasse a un dominio internazionale
- **.com**: scelta "neutra" e universalmente riconosciuta, utile se si guarda oltre il mercato locale

Dove registrarlo:
- **Register.it** (italiano) — comodo per avere tutto in un unico posto con supporto in italiano, spesso include email professionale/PEC nel pacchetto
- **Cloudflare Registrar** — prezzo "al costo" (nessun ricarico rispetto al registro), utile se si usa già Cloudflare per il frontend
- **Namecheap** — alternativa internazionale economica e diffusa

## Collegare il dominio all'hosting

Tutti i servizi elencati sopra gestiscono automaticamente il certificato HTTPS una volta puntato il dominio (record DNS di tipo A/CNAME secondo le istruzioni del provider) — non serve configurare manualmente SSL/TLS, requisito comunque obbligatorio per una PWA (vedi `04-pwa-checklist.md`).

## Email professionale

Se si vuole un indirizzo tipo `info@nomesalone.it`, molti registrar (incluso Register.it) offrono caselle email incluse o a costo contenuto insieme al dominio: una voce facile da dimenticare in fase di pianificazione ma quasi sempre richiesta da un cliente reale.

## Checklist

- [ ] Frontend pubblicato su Cloudflare Pages/Netlify/Vercel, build automatica ad ogni push
- [ ] Backend + Postgres + Redis attivi su Railway/Render/VPS
- [ ] Dominio registrato, DNS puntato correttamente
- [ ] HTTPS attivo e verificato su tutti i sottodomini usati (frontend + eventuale api.nomesalone.it)
- [ ] Budget mensile stimato e confrontato con le esigenze reali del cliente
- [ ] (Se richiesta) Email professionale configurata
