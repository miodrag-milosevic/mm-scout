# MM Scout 0.8.0 (beta) — guida

> **In breve**
> - **MM Scout** è la tua app personale per lo scouting. Funziona su computer (Mac, Windows, Linux), iPhone, iPad e Android, anche senza internet, e si adatta allo schermo (telefono, tablet, computer).
> - **Versione 0.8.0 (beta).** Finché l'app è in prova il numero inizia con **0**; la prima versione stabile sarà la **1.0.0**. Le «Novità della 5.x» qui sotto sono le tappe di sviluppo precedenti alla nuova numerazione (la 5.12 corrisponde alla 0.5.12).
> - **Lingue:** italiano, inglese, tedesco, francese, spagnolo e serbo (latino). La scegli in alto su ogni pagina e nella schermata di accesso.
> - **Novità della 5.0:** logo MM Scout, ricerca intelligente, profili ideali per ruolo, note vocali in partita, calendario con link e promemoria, mappa delle zone, importazione di statistiche, sincronizzazione tra dispositivi tramite iCloud Drive.
> - **Novità della 5.1:** caricamento delle **distinte** con formazioni automatiche, **campo diviso in 30 zone** toccabili, voto proposto che tiene conto di zona, pressione e difficoltà della gara, esempi con una squadra di fantasia (FC Valdoria), tutti inventati.
> - **Novità della 5.3:** caratteristiche in **ordine di importanza per ruolo** (anche per l'interpretazione moderna del ruolo); **Il mio giudizio: oggi e domani** (livello attuale, potenziale, dove può arrivare, entro quando, dove deve migliorare); schede **Report** e **Analisi** del giocatore (per 90 minuti, xG stimato, percentili, mappa di calore, percorso di carriera); **Fuori dal campo** con tutele per i minori; **Staff e riunioni** con incarichi di **visione singola**; **per conto di** chi lavori; bandiere nel menu della lingua; «= Neutra» di nuovo visibile, come terzo pulsante a destra; esempi della FC Valdoria sulle **ultime 5 partite reali**.
> - **Novità della 5.4:** dettagli personalizzabili di ogni azione (dal manuale di scouting), mappa delle zone toccabile, giocatori visibili nell'elenco partite, scheda **Formazioni** con le fasi di gioco, ordinamento delle liste, banner **Annulla / Conferma**, frecce ‹ ›, firma in fondo, elimina ovunque, ruoli sul campo, **archivi nascosti** con codice, cambio profilo, accesso più semplice. Dettagli al punto 17.
> - **Novità della 5.5:** metodo del **giocatore obiettivo** (scelto con lo staff, prima, durante e dopo la partita, giudizio «è giusto per noi?»), **piano A, B e C** nei profili ideali collegati alle riunioni, «Durante» diviso in **fase positiva e fase negativa**, confronto personalizzabile (parametri, dati per 90', zone, «come lo fa»), **diario delle attività**, info contrattuali in una scheda a parte, nuovi esempi di Italia, Svizzera e Serbia (anche giovanili). Dettagli al punto 18.
> - **Novità della 5.6:** menu per fasi di lavoro, nuova area **Dati**, partita guidata in 6 passi, giocatore nuovo in 10 secondi, ricerca e giocatori a lista o griglia per reparto, calendario cliccabile, tutte le nazionalità, campi allineati, profili ideali con livello minimo e ideale (aderenza), creazione dei profili dallo staff. Dettagli al punto 19.
> - **Novità della 5.2:** frecce **annulla / ripeti** (↶ ↷, anche ⌘Z) per ogni modifica; **tema** e **sincronizzazione** a portata di tocco in alto su ogni pagina; la scheda **Dettagli** si apre da sola dopo ogni azione in partita; pulsante «= Neutra» facoltativo; avatar a maglia con il numero; pulsante **Svuota cache e ricarica**; dati di esempio tradotti nelle 4 lingue; impaginazione rivista su telefono, tablet e Mac.
> - **Metodo di valutazione:** domande prima della gara, contesto della partita, qualità delle evidenze, conclusione strutturata, rating pesato per area, stato di forma, potenziale e interpretazione del ruolo.
> - Tutto resta **cifrato** con la tua password (AES-256). Nessun server: i dati passano solo da dove li metti tu (iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive, file condivisi).

---

## 1. Installazione e aggiornamento

### Aggiornare da una versione precedente
- **Stesso indirizzo, stesso browser:** sostituisci i file su GitHub Pages con quelli di questo zip (stessa cartella). I tuoi profili e i dati restano: vivono nel browser, non nei file.
- Dopo l'aggiornamento chiudi e riapri l'app una volta (o ricarica la pagina) per caricare la nuova versione.

### Prima installazione
1. Su github.com: **+ → New repository**, nome per esempio `mm-scout`, **Public**, poi **Create repository**.
2. **uploading an existing file** → trascina **tutto il contenuto** della cartella (le sottocartelle `css`, `js`, `img` devono restare come sono) → **Commit changes**.
3. **Settings → Pages** → *Branch* `main`, `/ (root)` → **Save**.
4. Dopo 1-2 minuti l'app è su `https://TUO-NOME.github.io/mm-scout/`.

Il codice è pubblico, **i dati no**: restano cifrati sui tuoi dispositivi.

- **Mac (Brave/Chrome):** apri l'indirizzo → icona **Installa** nella barra degli indirizzi.
- **iPhone e iPad (Safari):** **Condividi → Aggiungi alla schermata Home**. Aprila sempre dall'icona.

### Serve per forza GitHub?
- **Solo sul Mac, no:** puoi tenere la cartella in iCloud Drive e aprire `index.html` con doppio clic. Funziona anche offline. Limiti: non si installa come app e non puoi creare link protetti (i file protetti sì). Su Mac, in iCloud Drive clicca la cartella con il tasto destro › **Mantieni scaricato**, così è sempre disponibile anche offline. Prima di spostare o rinominare la cartella fai un backup: alcuni browser la considerano un'app diversa.
- **Su iPhone e iPad serve un indirizzo web (https).** Safari non esegue un'app aperta da un file di iCloud Drive e non permette di metterla sulla Home. Alternative a GitHub, tutte gratuite: **Netlify Drop** (app.netlify.com/drop: trascini la cartella e ottieni l'indirizzo, senza account Git) oppure **Cloudflare Pages**. Il codice dell'app è pubblico, i tuoi dati no: restano cifrati sui dispositivi.
- Importante: ogni indirizzo è un archivio separato. Scegli un indirizzo e usa sempre quello; se cambi, passa i dati con la sincronizzazione o con un backup.

Poi incolla l'indirizzo in **Impostazioni › Generale › Indirizzo pubblico** (serve per link protetti e per il collegamento dal Calendario alla partita).

## 2. Sincronizzazione tra computer, telefono e tablet (cartella cloud)
Tutti i dati viaggiano in **un unico file cifrato** (`mm-scout-sync-<tua-email>.mmsync`) in una cartella che scegli tu: **iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive** oppure una cartella del computer. Ogni dispositivo lo legge, **unisce** le novità e lo riscrive. Se una stessa voce è stata modificata su due dispositivi, vince la modifica più recente. Le cancellazioni si propagano.

**Primo collegamento**
1. **Sul computer (Mac, Windows o Linux, con Chrome, Edge o Brave):** *Impostazioni › Sincronizzazione › Scegli cartella* → crea o scegli la cartella `MM Scout` dentro la cartella del tuo cloud. Il file viene creato subito.
2. **Sugli altri dispositivi (iPhone, iPad, Android, altro computer):** apri l'app → nella schermata di accesso tocca **«Collega un dispositivo (dati dal cloud)»** → scegli il file nella cartella `MM Scout` → inserisci la password. Ritrovi tutto.

**Uso quotidiano**
- **Computer:** automatico. L'app sincronizza all'accesso, 20 secondi dopo ogni modifica e quando torni sull'app. (In Brave serve una volta `brave://flags/#file-system-access-api` → **Enabled**. Safari e Firefox sul computer: usa il metodo «un tocco».)
- **iPhone, iPad e Android:** un tocco. *Impostazioni › Sincronizzazione › Sincronizza ora* → scegli il file → poi **Salva il file** → stessa cartella → **Sostituisci**. Fallo **prima e dopo la partita**.

**Onestà sui limiti:** sui telefoni e sui tablet (Safari su iPhone/iPad, Chrome su Android) il browser non permette a un'app web di scrivere da sola nel cloud. Per una sincronizzazione completamente automatica anche lì servirebbe un'app nativa o un server, che non usiamo per tenere i dati solo tuoi. La soluzione «un tocco» è sicura e non perde dati: unisce, non sovrascrive.

Se cambi la password su un dispositivo, la nuova password passa agli altri con la sincronizzazione successiva.

## 3. Ricerca intelligente
- Barra in alto su ogni pagina. Cerca **giocatori, partite, valutazioni, liste, file multimediali**.
- **Errori di battitura:** se scrivi «Brenan» trova Brennan e propone «Forse cercavi: …».
- **Date:** «12/10», «12.10.2026», «ottobre 2026», «2026-10», «oggi», «ieri» (anche in inglese, tedesco e serbo).
- Si possono combinare: «Valdoria ottobre» trova le partite della FC Valdoria di ottobre.
- Schede per filtrare: Tutto, Giocatori, Partite, Valutazioni, Liste, Multimedia.

## 4. Profili ideali per ruolo
*Menu › Profili ideali.* Prima del nome viene il profilo: descrivi il giocatore che cerchi e confronta tutti quelli che hai visto con gli stessi criteri.
1. Nome del profilo, ruolo principale, sistema di gioco, cosa deve fare nel tuo modello di gioco.
2. Dati di base: età, altezza minima, piede, status (comunitario), budget.
3. **Requisiti minimi:** per ogni caratteristica decisiva il livello minimo e l'importanza (*Utile*, *Importante*, *Essenziale*). «Proponi requisiti tipici del ruolo» li precompila: tu li adatti.
4. L'app calcola per ogni giocatore la **% di compatibilità** e la **copertura** (quanti requisiti hai già valutato), e segnala i requisiti essenziali sotto il minimo.
5. Nella scheda del giocatore, in *Profilo*, vedi subito con quali profili ideali è compatibile.

## 5. Partita: prima, durante, dopo
- **Prima:** obiettivo della missione, formazioni, sistemi, meteo, campo, **domande prima del fischio d'inizio** (sul giocatore, sulla sua squadra, sull'avversario, sul contesto: Sì / No / ?), riscaldamento e ruolo previsto.
- **Durante:** cronometro, giocatori come pulsanti, fasi di gioco, tre pulsanti grandi **✓ = ✗** per ogni azione (un tocco).
  - **🎙 Nota vocale:** un tocco per registrare, un tocco per fermare (max 3 minuti). La nota viene salvata cifrata con minuto e giocatore, compare nel Registro (con il lettore) e nella scheda Multimedia del giocatore. Al primo uso il browser chiede il permesso del microfono.
- **Registro:** tutte le azioni con filtri; riepilogo per fase e **mappa delle zone** per giocatore.
- **Dopo:** risultato, analisi delle squadre, **contesto della gara** (intensità, livello dell'avversario, pressione ambientale, difficoltà tattica, velocità del gioco: 1-5), voto, condizione e sintesi per ogni giocatore.
- **Link della partita** (in *Modifica partita › Link e indirizzo*): diretta/video, biglietti/accrediti, info, indirizzo dello stadio. Compaiono come pulsanti in cima alla partita, con «Apri in Mappe».

## 6. Calendario
*Menu › Calendario.* Vista mensile delle missioni, elenco del giorno e prossime missioni.
- Tocca un giorno → «+ Partita» crea la partita già con quella data.
- **Aggiungi al Calendario** (dalla partita) o **Esporta le prossime nel Calendario**: scarica un file `.ics`. Aprendolo, la partita entra nel Calendario di Mac/iPhone con **promemoria 2 ore prima**, luogo, obiettivo, giocatori da osservare, link della partita e **collegamento diretto alla partita nell'app** (se hai impostato l'indirizzo pubblico).

## 7. Mappa delle zone
- Il campo è diviso in **5 corsie × 6 fasce**. Ogni zona si colora in base a quante azioni sono avvenute lì, con il numero dentro.
- Filtro: tutte, solo positive (verde), solo negative (rosso).
- La trovi nel Registro della partita (per giocatore) e nella scheda **Partite e azioni** del giocatore (tutte le partite).
- Per avere la mappa, aggiungi la zona alle azioni con «Dettagli» (durante o dopo la gara). Puoi anche attivare *Impostazioni › Generale › Apri subito i dettagli*.

## 8. Importazione di statistiche
Scheda del giocatore › **Statistiche** › *Importa statistiche*.
1. Carica un file **CSV** (da Numbers o Excel: *Esporta › CSV*) oppure **incolla una tabella** copiata da un foglio o da un sito di dati. La prima riga deve avere i nomi delle colonne.
2. Scrivi un'etichetta (es. «Lega Alfa 2025/26»).
3. L'app riconosce la colonna del nome e della squadra e **abbina i giocatori** anche se il nome è scritto in modo diverso. Per ogni riga puoi correggere l'abbinamento, crearne uno nuovo o ignorarla.
4. Le statistiche compaiono nella scheda del giocatore accanto alle tue valutazioni. Reimportare la stessa etichetta aggiorna i dati.

## 9. Metodo di valutazione
Tutto è facoltativo e veloce (pulsanti, niente testi lunghi obbligatori):
- **Rating pesato:** il voto finale è la media pesata delle aree (default: tecnica 30, tattica 30, mentale 20, fisica 20; portiere 40). Si cambia in *Impostazioni › Personalizza*.
- **Contesto della gara** (1-5): lo stesso gesto vale di più in un contesto difficile.
- **Qualità delle evidenze** (1-5 stelle): calcolata da quante evidenze hai, quante sono ripetute e con contesto. Ti dice quanto è solido il giudizio.
- **Conclusione strutturata:** punto di forza decisivo, compatibilità col modello di gioco, sostenibilità economica, margine di crescita.
- **Scheda giocatore:** alias, luogo di nascita, status UE/extra-UE, morfologia, **potenziale**, **stato di forma** (in crescita, stabile, in calo), **interpretazione del ruolo** (archetipo, es. *Regista basso*, *Prima punta di movimento*), **nota rapida** in cima, **affidabilità** (quante volte l'hai visto), **semestre di nascita** (utile per l'effetto età relativa nei giovani).

## 10. Distinte di gara (novità 5.1)
*Partite › Carica distinta* (oppure, dentro una partita, scheda **Prima › Carica distinta**).
1. **Cosa puoi caricare:** un PDF della distinta (quelli con testo selezionabile), un file di testo o CSV, oppure il testo incollato.
   - **Da una foto o da una scansione:** su iPhone apri la foto, tieni premuto sul testo (**Testo live**), «Seleziona tutto», «Copia» e incolla nell'app.
2. **Cosa legge l'app:** squadre, data, ora, competizione, campo, arbitro, titolari, panchina, allenatori, capitano, ruoli se indicati (P/D/C/A, GK/DF/MF/FW…).
3. **Controllo:** ogni riga si può correggere (numero, nome, titolare/panchina, ruolo). Il modulo viene riconosciuto dai ruoli o scelto da te (4-3-3, 3-5-2, 4-2-3-1…). I giocatori già nel tuo archivio vengono riconosciuti.
4. **Spunta ☑ i giocatori da osservare** e salva. La partita è pronta:
   - le due formazioni sono disegnate sul campo;
   - i giocatori scelti hanno la scheda, il ruolo previsto e lo stato (titolare o panchina);
   - nella fase **Durante** sono già pronti come pulsanti.
5. Nella scheda **Prima** tocchi un giocatore sul campo (o in panchina) per aggiungerlo o toglierlo da quelli da osservare: diventa giallo.

Limite onesto: l'app non legge le foto da sola (servirebbe un riconoscimento del testo pesante e online). Con «Testo live» dell'iPhone il passaggio richiede pochi secondi.

## 11. Campo diviso in zone (novità 5.1)
- Nei **Dettagli** di ogni azione il campo è diviso in **30 zone**: 6 fasce in lunghezza (area propria, difesa, centrocampo difensivo, centrocampo offensivo, trequarti, area avversaria) × 5 corridoi (fascia sinistra, mezzo spazio sinistro, corridoio centrale, mezzo spazio destro, fascia destra). Tocchi un riquadro e vedi subito il nome della zona. La squadra del giocatore attacca sempre verso destra.
- **Come i dati migliorano il voto:** quando premi «Proponi voti dalle azioni», ogni azione ha un peso:
  - riuscita sotto forte pressione (4-5) → vale di più; errore senza pressione → pesa di più;
  - azione tecnica o tattica riuscita nell'ultimo terzo di campo → vale di più; errore nella propria zona difensiva → pesa di più;
  - partita difficile (contesto della gara alto) → tutte le azioni valgono un po' di più;
  - più azioni registri, più la proposta si allontana dal voto medio.
- La **qualità delle evidenze** sale se almeno il 60% delle azioni ha zona o pressione.
- Nella scheda **Partite e azioni** del giocatore e nel **Registro** trovi «Qualità dei dati tracciati»: % di azioni con zona, pressione e piede, riuscita per terzo di campo e sotto forte pressione.

## 12. Esempi della prima squadra (tutti inventati, senza foto)
- Prima squadra di fantasia **FC Valdoria** 2026/27: giocatori, date di nascita, nazionalità, altezza, piede, numero di maglia, ruoli e carriere sono **tutti inventati**.
- **Valori di mercato** e scadenze del contratto sono stime di esempio inventate.
- **Valutazioni, giudizi e partite sono inventati** per esercitazione e restano segnati «ESEMPIO».
- **Foto:** non sono incluse, perché i ritratti dei giocatori sono protetti da diritti d'immagine. Puoi aggiungere le tue (es. foto che scatti allo stadio) dalla scheda del giocatore.

## 13. Novità 5.2
- **Barra in alto su ogni pagina:** ↶ annulla, ↷ ripeti, ⟳ sincronizza ora, ◐ tema (automatico › chiaro › scuro), lingua, + aggiungi, lucchetto.
- **Annulla / ripeti:** ogni modifica si annulla (giocatori, valutazioni, partite, azioni, liste, opzioni, cancellazioni comprese). Sul Mac anche con ⌘Z e ⇧⌘Z. La cronologia vale finché l'app resta aperta.
- **Registro partita:** dopo ogni azione (es. *Fase difensiva › Contrasto ✓*) si apre subito la scheda **Dettagli** con zona, pressione, piede e nota. Se in una partita veloce vuoi solo un tocco: *Impostazioni › Generale › Registro partita*.
- **Neutra (=):** azione né riuscita né sbagliata (passaggio sicuro all'indietro, duello senza vincitore). Conta per il coinvolgimento del giocatore ma non sposta il voto. È il **terzo pulsante, a destra** (✓ ✗ =), più stretto dei primi due. Se non ti serve lo nascondi in *Impostazioni › Generale › Registro partita*.
- **Esempi della FC Valdoria:** si aggiornano da soli all'ultima versione e cambiano lingua insieme all'app. Senza foto (diritti d'immagine): al posto della foto c'è una maglia con il numero.
- **Cache:** se dopo un aggiornamento vedi ancora la versione vecchia, *Impostazioni › Informazioni › Svuota cache e ricarica* (i dati non vengono toccati).

## 14. Sicurezza (invariata)
- Profili con email e password, codice di recupero, verifica in due passaggi (Ente Auth, Bitwarden, Proton Pass).
- Blocco automatico, protezione dai tentativi, cancellazione opzionale dopo troppi errori.
- Firma delle valutazioni con impronta SHA-256: se modifichi la valutazione, la firma viene rimossa.
- Condivisione con file o link protetti da codice.

## 15. Backup
- Copie interne automatiche (Impostazioni › Backup).
- Backup completo `.tsbackup` cifrato: su Mac anche automatico in una cartella; su iPhone con «Salva in File».
- La sincronizzazione non sostituisce il backup: fai ogni tanto un backup completo.

## 16. Problemi frequenti
- **Non vedo la nuova versione:** chiudi l'app e riaprila, oppure ricarica la pagina due volte.
- **Il microfono non funziona:** iPhone › Impostazioni › Safari › Microfono › Consenti (o chiedi), poi riprova.
- **«Il file di sincronizzazione appartiene a un altro profilo»:** hai scelto il file di un altro profilo, oppure stai usando un profilo creato da zero invece di quello collegato. Usa «Collega un dispositivo» dalla schermata di accesso.
- **Sul Mac la sincronizzazione è «in pausa (permesso)»:** dopo il riavvio il browser chiede di nuovo il permesso sulla cartella. Tocca «Riattiva».


## 16. Novità 5.3 in breve
### Caratteristiche per ruolo
In valutazione e nella scheda *Caratteristiche* le voci sono in ordine di importanza per il ruolo principale del giocatore (es. per un **centrale**: posizione, lettura del gioco, anticipo, duelli aerei…; per un'**ala**: 1 contro 1, dribbling, accelerazione…). Se scegli l'**interpretazione del ruolo** (es. *Centrale impostatore*, *Ala invertita*, *Portiere moderno*), le sue caratteristiche chiave salgono in cima. Aggiunte: **Cross**, **Calci piazzati**, **Pressing**, **Scanning**.

### Il mio giudizio: oggi e domani
In ogni valutazione: livello attuale e potenziale (A–E), quando può arrivarci, dove può arrivare, dove deve migliorare e una frase personale. L'ultimo giudizio compare in cima al *Profilo* e nel *Report*.

### Report e Analisi
- **Report**: la pagina da mostrare a direttore sportivo e capo scout: dati principali, giudizio di oggi e domani, punti di forza e da migliorare, rating per area, mappa di calore, carriera, partite viste, firma con data. *Stampa / PDF* o *Condividi*.
- **Analisi**: numeri per 90 minuti dal **tuo** registro (tiri, xG stimato, occasioni create, dribbling, duelli, recuperi…), **percentili** rispetto ai giocatori dello stesso reparto che hai osservato (servono almeno 5 giocatori con 60+ minuti), percentili sulle statistiche importate, mappa di calore, andamento dei voti, percorso di carriera.
- L'xG è una **stima** in base alla zona del tiro, non un dato ufficiale.

### Fuori dal campo (giovani)
Scheda *Relazione › Fuori dal campo*: allenamento, rapporto con compagni e staff, reazione agli errori, esultanza, comunicazione, fonte. Regole: solo comportamenti osservabili o informazioni del club o della famiglia; **mai dati sensibili**; per i **minorenni** l'app chiede il consenso dei genitori prima di aggiungere una foto.

### Staff, riunioni e visione singola
*Menu › Staff e riunioni*: contatti (nome, ruolo, email, telefono), riunioni nel calendario con partecipanti, giocatori da discutere e decisioni, **incarichi**: giocatore, partita, cosa osservare, chi lo chiede, scadenza. *Avvia visione* apre la partita con **un solo giocatore in primo piano** per tutta la gara e gli obiettivi in alto. Dalle *Liste* trovi subito gli incarichi aperti.

### Per conto di chi lavori
*Profilo scout › Per chi lavoro*: club, agenzie, agenti FIFA. Il committente attivo viene segnato su ciò che crei e si può cambiare in giocatore, partita e valutazione.

### Esempi della FC Valdoria
Cinque partite di esempio della FC Valdoria contro squadre inventate (US Collemare, Westcliff AFC, Calcio Monteregio, FC Portalba, Atletico Borgonuovo): date, risultati, azioni, voti e valutazioni sono tutti inventati.

## 17. Novità 5.4 in breve

### Dettagli delle azioni («Come l'ha fatto»)
Dopo ogni azione registrata, nella scheda **Dettagli** trovi i gruppi pertinenti a quell'azione, presi dalle schede di osservazione del manuale: tipo di passaggio e linee superate, tipo di smarcamento (appoggio, sostegno, ampiezza, profondità, tra le linee, contromovimento), tempo del movimento e separazione, orientamento del corpo, scanning, primo controllo, trigger e angolo del pressing, tempo di reazione nel contropressing, tipo di cross, qualità dell'occasione, tempo di stacco e altro.
Tutto è personalizzabile: **Impostazioni › Dettagli azioni** (o «⚙ Personalizza» dentro la scheda). Puoi aggiungere gruppi, opzioni e dare a ogni opzione un **valore** (⬆ positivo, · neutro, ⬇ negativo) che pesa nel voto proposto.

### Analisi solo dai tuoi dati
Voto proposto, «Voto dai dati registrati», metriche per 90', xG stimato, percentili, mappe e «Come lo fa» si ricalcolano da soli a ogni azione aggiunta, modificata o eliminata. Il tuo voto resta separato: decidi tu.

### Mappa delle zone: come nasce
Ogni volta che in «Dettagli» tocchi un riquadro del campo (30 zone: 6 fasce × 5 corridoi), l'azione prende quella zona. La mappa conta le tue azioni per zona: niente è inventato (negli esempi della FC Valdoria le azioni sono di esercitazione). **Tocca un riquadro** per vedere tutte le azioni di quella zona con nome esatto della zona, esito, dettagli e note.

### Partite
- Nell'elenco vedi subito i giocatori di ogni partita: ★ = interessante (giudizio positivo), numero = azioni registrate, voto o ✍ = valutato.
- Nuova scheda **Formazioni**: distinta caricata o **inserita a mano**, modulo e note per ogni fase (iniziale, in possesso, senza palla, transizioni, palle inattive) e **cambi durante la gara**.

### Ordinare, scorrere, annullare, eliminare
- Ordina Giocatori, Partite, Report e Liste (nome, cognome, data, rating, club, giudizio…).
- Frecce ‹ › per le schede (anche con i tasti ← →) e per passare al giocatore o alla partita precedente/successiva.
- Dopo una modifica compare il banner **Modifica salvata — Annulla / Conferma** (⌘Z funziona ancora).
- Pulsante **Elimina** su giocatori, partite, valutazioni, liste, contatti e profili: subito dopo puoi ancora annullare.

### Firma in fondo
Valutazioni, partite e schede giocatore hanno la firma digitale in fondo, con data. Se il contenuto cambia dopo la firma, il riquadro lo segnala.

### Ruoli sul campo
Nel profilo del giocatore il campo è diviso per reparti e corsie: tocca il ruolo (il primo è il principale ★), poi scegli l'interpretazione classica o moderna. Un punto libero del campo segna la posizione esatta.

### Riunioni e incarichi
Partecipanti, giocatori e partite si creano al volo dentro la scheda (anche eliminare contatti).

### Archivi nascosti
**Archivio › Archivi nascosti**: crea un archivio con codice; con 🔒 nella scheda di un giocatore o di una partita lo nascondi. Resta escluso da elenchi e ricerche finché non lo apri; si richiude quando blocchi l'app. Backup e sincronizzazione lo includono (cifrato).

### Accesso e profili
Accesso più semplice (solo password se c'è un profilo), bandiere e tema anche nella pagina d'accesso, **Cambia profilo** nel menu e in Profilo scout, eliminazione del profilo dal dispositivo.

## 18. Novità 5.5 in breve

### Il metodo: un giocatore obiettivo
1. Con lo staff definisci il **profilo ideale** (ruolo, sistema, cosa chiede l'allenatore) e i candidati: **piano A, B e C**.
2. Crei l'**incarico** (o la partita) con il **giocatore obiettivo**: se non è in archivio lo crei lì, al volo.
3. **Prima**: arrivi in anticipo, prendi la distinta, controlli titolare, ruolo e riscaldamento (checklist dell'obiettivo).
4. **Durante**: la partita si apre già in visione singola; le azioni sono divise in **fase positiva** (con palla, movimenti, transizione positiva, palle inattive offensive) e **fase negativa** (difesa, transizione negativa, palle inattive difensive), con sottogruppi (Ricevere, Costruire, Progredire, Rifinire…).
5. **Dopo**: rispondi a «**È il giocatore giusto per noi?**» (sistema, funzione, principi dell'allenatore, adattamento, quattro fasi, crescita nel club), scegli la decisione e se è condivisa con l'allenatore; per i giovani conta molto il comportamento dopo il fischio finale. «Porta in riunione» prepara la riunione con lo staff.
6. Il giudizio compare nel **Report** del giocatore, nell'elenco partite (🎯 e %) e nel profilo ideale.

### Altre novità
- Saluto in base all'orario, descrizione breve in ogni pagina, logo che riporta alla Panoramica.
- Barra in alto: tema e lingua (ultima a destra) della stessa misura degli altri pulsanti.
- Campi dei moduli tutti della stessa altezza; piè di pagina sempre in fondo con l'icona LinkedIn.
- Info contrattuali nella scheda **Contratto** (prima di Multimedia), non più in cima.
- **Confronto**: parametri a scelta, requisiti minimi del profilo ideale nel radar, dati per 90', mappe delle zone affiancate, «come lo fa»; «Metti a confronto piano A, B, C».
- **Attività**: diario automatico di tutto ciò che crei, modifichi o elimini.
- **Squadra ombra**: la squadra che proporresti al club, con titolare e alternative per ogni posizione.
- **Esempi**: giocatori e squadre inventati (Serbia, Svizzera, Italia, anche U17/U18/Primavera) con partite viste due volte, partite in programma, valutazioni nate dalle azioni, profili ideali con piano A/B/C e riunioni.

## 19. Novità 5.6 in breve
- **Menu per fasi**: Lavoro sul campo (Panoramica, Calendario, Partite, Giocatori, Report) · Con lo staff (Staff e riunioni, Profili ideali, Confronto, Squadre ombra, Liste) · Analisi (Dati, Attività) · Il mio profilo.
- **Dati**: classifica per qualsiasi valore, grafico a dispersione (tocca un punto per aprire il giocatore), tabella completa ordinabile con filtri per reparto, campionato, età e minuti.
- **Partita in 6 passi**: 1 Arrivo e distinta · 2 Prima della partita · 3 Durante · 4 Dopo · 5 Registro · 6 Multimedia, con «Avanti →» in fondo e ✓ sui passi completati. Nel «Durante» una guida in 3 punti (si chiude con «Ho capito»).
- **Nuovo giocatore veloce**: nome, ruolo, anno, club, nazionalità e salvi; «Scheda completa» per il resto. Negli editor lunghi una barra in alto porta alla sezione.
- **Nazionalità**: elenco completo dei paesi nella lingua scelta (con Inghilterra, Scozia, Galles, Irlanda del Nord).
- **Ricerca e Giocatori**: per categoria e per reparto (portieri, difensori, centrocampisti, attaccanti), a lista o a griglia.
- **Calendario**: tocca un giorno per aprire gli eventi o creare partita e riunione.
- **Profili ideali**: ogni requisito ha un minimo e un livello ideale. Chi è solo al minimo vale circa il 70%; il 100% arriva solo se tutto è al livello ideale. Tocca ⇄ su più giocatori e confrontali. Si creano anche da **Staff e riunioni › Profili ideali**, con le caratteristiche proposte dalle priorità del ruolo.

## 20. Novità 5.6.1 in breve
- **Scheda giocatore senza doppioni**: «Oggi e domani» (la proiezione) ora compare solo nella scheda **Report**, non più anche in Profilo.
- **Ogni pagina principale** ha sotto il titolo una riga che spiega a cosa serve (Panoramica, Calendario, Partite, Giocatori, Report, Staff, Profili ideali, Confronto, Squadre ombra, Liste, Dati, Attività, Impostazioni).
- **Accesso e registrazione**: lingua con le bandiere 🇮🇹 🇬🇧 🇩🇪 🇷🇸 e pulsante del tema, uguali alle altre pagine.
- **Panoramica più semplice**: 4 azioni rapide (Nuova partita, Nuovo giocatore, Nuovo report, Riunione), numeri cliccabili, «Questa settimana», «Da fare» e «Ultimi report».
- **Responsive**: controllate tutte le pagine su telefono (360–430 px), tablet 11" e 13" e computer; niente più scorrimento orizzontale.

## 21. Novità 5.6.2 in breve
- **Panoramica**: i numeri (Giocatori, Valutazioni, Partite viste, Partite in programma) si toccano e aprono una scheda di **statistiche**: per reparto, età, giudizio, campionato, mese, competizione, con i migliori 5 e il link alla pagina.
- **Tutto tracciabile**: il diario Attività ora dice anche *cosa* è cambiato (es. «club, altezza», «+2 azioni») e *da dove* (es. «da Calendario › Nuova partita»). Ogni giocatore e ogni partita hanno in fondo il loro **Storico modifiche**.
- **Ricerca**: tocchi la barra e compaiono ricerche recenti, suggerimenti presi dal tuo archivio e un consiglio. Le parole trovate sono evidenziate; **Invio** apre il primo risultato, **↓ ↑** scorrono i risultati, **Esc** cancella, **⌘K / Ctrl+K** cerca da ogni pagina.
- **Barra in alto**: il lucchetto è l'ultimo a destra.
- **Benvenuto**: il messaggio dopo l'accesso resta 4,5 secondi.
- **Diritti d'autore**: il nome dell'app non si cambia più. In fondo a ogni pagina, in Impostazioni › Informazioni, nei report condivisi e nel file LICENZA.txt c'è l'avviso: © Miodrag Milosevic, tutti i diritti riservati; vietato copiare, modificare o divulgare l'app e i dati senza consenso.

## 22. Novità 5.7 in breve
- **Agenda** (prima «Calendario»): quattro viste. **Oggi** mostra cosa fare oggi e nei prossimi 7 giorni. **Calendario e bacheca** li mette affiancati (⤢ per ingrandirne uno). Poi **Calendario** e **Bacheca** da soli.
- **Bacheca impegni (kanban)**: tre colonne, Da fare · In corso · Fatto. Le schede si trascinano tra le colonne o su un giorno del calendario per cambiarne la data; sul telefono si usano ‹ ›. Ogni impegno ha tipo (partita, video, report, telefonata, viaggio, riunione, studio…), priorità, giorno e ora, giocatore o partita collegati, note e una piccola lista di passi. Ci sono anche gli incarichi di visione dello staff.
- **Panoramica**: il riquadro **Oggi** in cima, con un campo per aggiungere un impegno al volo (scrivi e premi Invio) e il cerchio per segnarlo fatto.
- **Note**: di lavoro o personali, fissabili in alto, con tag e collegate a un giocatore. Si possono cercare e si scrivono con titoletti, elenchi, caselle e grassetto, con l'anteprima. **Importa** prende file .txt, .md, .rtf, .html, .pdf, Evernote (.enex) e Google Keep (.json/.html), oppure testo incollato da Note di Apple, Pages, Word o Google Docs, e lo rimette in un formato ordinato.
- **Partita › Durante**: accanto a «Nota vocale» c'è **✍ Nota scritta**, con minuto e giocatore e alcune frasi pronte.
- **Menu laterale riducibile**: si chiude e si apre con la freccia in alto o con «Riduci il menu» in fondo. Ridotto mostra solo le icone e, al passaggio del mouse, il nome. La scelta viene ricordata.
- **Tutto tracciabile e cliccabile**: impegni e note compaiono nel diario Attività e nella ricerca. Nelle statistiche della Panoramica ogni riga (reparto, età, giudizio, campionato, competizione) apre l'elenco filtrato.
- **Piè di pagina**: email cliccabile miodrag.milosevic@ik.me prima di LinkedIn.
- **Traduzioni**: gli esempi seguono sempre la lingua scelta, anche dopo aver cambiato lingua dalla schermata di accesso. Tutti i testi nuovi sono tradotti in inglese, tedesco e serbo.
- **Versione beta**: in cima a ogni pagina e nella schermata di accesso c'è la scritta «Versione beta · uso personale e non commerciale · vietato copiare o duplicare l'app». Toccandola si apre la scheda dei diritti d'autore.
- **Esempi senza persone reali nell'Agenda**: gli impegni e gli incarichi di esempio sono collegati solo a giocatori inventati (club «Esempio …»).

## 23. Per gli amici che la provano (versione beta)
- **Profilo demo**: nella schermata di accesso c'è il riquadro «Vuoi solo provarla?». Con **Entra nella demo** si crea (o si riapre) un profilo di prova già pieno di esempi: Valdoria, squadre inventate, profili ideali, riunioni, impegni e note.
  - Email: `demo@mmscout.example`
  - Password provvisoria: `Demo-Scout-2026`
  Il profilo resta solo sul dispositivo di chi la prova. Non inserire dati veri.
- **Esempi sempre disponibili**: alla creazione di un profilo la casella «Carica anche gli esempi» è già spuntata. In ogni momento: Impostazioni › Generale › **Carica esempi** (ed **Elimina esempi**).
- **Cache**: a ogni nuova versione l'app cancella da sola la cache vecchia. Se qualcuno vede ancora la versione precedente: link «Svuota la cache» nella schermata di accesso, oppure Impostazioni › Informazioni › Svuota cache e ricarica. I dati non vengono toccati.
- **Lingue**: italiano, inglese, tedesco, serbo e **spagnolo** (bandiera 🇪🇸), con date, nazionalità, sigle dei ruoli e ricerca per data nella lingua scelta.
- **Come condividerla**: il modo più comodo è pubblicare la cartella su un indirizzo https (per esempio GitHub Pages) e mandare il link. Così funziona anche offline e si installa sulla schermata Home. Aperta come file (doppio clic su index.html) funziona, ma senza installazione offline.

## 24. Novità 5.8 in breve
- **Registro partita completo per ogni ruolo.** Per il **portiere** c'è il gruppo «🧤 Portiere» in cima, con quattro sottogruppi:
  - Tra i pali: parata, presa, riflessi, posizionamento, rigore;
  - Uscite: alta, palla alta in area, bassa, 1 contro 1, copertura della profondità;
  - Con la palla: gioco con i piedi, costruzione dal basso, rinvio, rinvio con le mani;
  - Guida della difesa.
  Ogni azione ha i suoi «Come l'ha fatto»: posizione sul tiro, tipo di presa, altezza e distanza del tiro, respinta, riposizionamento, uscita fuori area, esito del rigore…
- **Nuove azioni per i giocatori di movimento**: sovrapposizione, sponda, movimento in area, gestione della linea difensiva, uno contro uno difensivo, direzione del dribbling. Anche intensità, calo fisico, nervosismo e concentrazione hanno i loro dettagli.
- **«Frequenti» per interpretazione del ruolo**: il registro propone le azioni tipiche dell'interpretazione scelta, classica o moderna (es. portiere tra i pali o moderno, ala classica o invertita, centrale impostatore o di copertura, punta boa o di movimento, falso 9).
- **Valutazione per ruolo**: in «Dati della partita» c'è il campo con i ruoli; tocchi il ruolo (o i ruoli) giocati in quella partita. I parametri si adattano: in vista ci sono quelli chiave del ruolo, gli altri sono nascosti (con «Mostra tutti i parametri»). Con due o più ruoli ogni parametro mostra la sigla del ruolo a cui serve.
- **Voto con barra o con numero**: accanto a ogni barra c'è un campo per scrivere il voto (es. 7 o 7,5). Lettere, simboli o numeri fuori scala vengono segnalati subito.
- **Coerenza con tutti i dati**: nella valutazione vedi insieme questo voto, la media delle tue valutazioni, il voto calcolato dalle azioni e la media complessiva. Se la valutazione si allontana troppo dai dati, l'app te lo segnala.
- **Decisione finale del club**: nella scheda di ogni giocatore registri cosa hanno deciso il direttore sportivo, l'allenatore e lo staff (ingaggiare, continuare a seguire, in attesa, non procedere), con data e motivo. Il voto dello scout resta un supporto.
- **Tag**: nuova pagina «Tag» (Con lo staff). Lì crei, rinomini, colori ed elimini i tag e vedi tutto quello che li contiene (giocatori, partite, valutazioni, note). Nella ricerca scrivi **#nome** (es. #Under 21).
- **Controlli sui campi**, in tutte e cinque le lingue:
  - nomi e cognomi solo con lettere, apostrofo, punto e trattino;
  - squadre anche con numeri (es. «FC Esempio 2010»);
  - risultato nel formato 2-1;
  - email, telefono, indirizzi https e importi controllati;
  - numeri dentro limiti sensati (altezza, peso, maglia 1–99, minuti, anno di nascita…).
  Se qualcosa non va compare un avviso sotto il campo e il salvataggio viene bloccato finché non lo correggi.
- **Piè di pagina**: icona email (senza testo, come LinkedIn): apre la tua app di posta per scrivere a miodrag.milosevic@ik.me.

## 25. Novità 5.9 in breve
- **Frecce ← →** a sinistra della barra di ricerca (sul telefono a sinistra dei pulsanti): tornano alle pagine già viste e poi di nuovo avanti, come in un browser. Da tastiera: Alt+← e Alt+→.
- **Dopo l'accesso** l'app si apre sempre sulla **Panoramica**.
- **Messaggio di benvenuto corretto**: dice quante partite sono in programma in tutto e quante nei prossimi 7 giorni (es. «5 partite in programma · 3 nei prossimi 7 giorni»).
- **Lingue in quest'ordine**: italiano, inglese, tedesco, spagnolo, serbo.
- **Nuovi tag dentro i moduli** (nuova partita, modifica partita, valutazione): «+ Nuovo tag», scrivi il nome e premi Invio. Il tag viene creato e selezionato subito.
- **Storico modifiche**: ogni riga ha una ✕ per toglierla se è stata creata per sbaglio, con conferma. Sparisce solo la riga del diario, i dati restano.
- **Note**: dopo i pulsanti di formattazione ci sono **↶ Annulla** e **↷ Ripeti** (anche ⌘Z e ⇧⌘Z).
- **Ordinamento uguale in Giocatori e Report**: Nome, Cognome, Posizione, Ultima creazione, Ultima modifica, poi gli ordinamenti propri di ogni pagina. Il menu «Ordina» ha lo stesso aspetto nelle due pagine.
- **Scritta BETA** staccata meglio dalla barra di ricerca.
- **Riepilogo di benvenuto (5.9.1)**: dopo l'accesso compare un riquadro con il saluto e il punto della situazione. Mostra:
  - le partite in programma, e quante nei prossimi 7 giorni;
  - le cose da fare (impegni e incarichi di visione), e quante sono per oggi;
  - gli impegni in corso;
  - le cose in ritardo, in rosso.
  Il pulsante **Apri l'Agenda** porta alla vista «Oggi». Il riquadro resta 9 secondi (si ferma se ci passi sopra con il mouse) e si chiude con ✕ o Esc.
- **Riepilogo di benvenuto** dopo l'accesso, con:
  - le partite in programma (e quante nei prossimi 7 giorni);
  - le cose da fare (e quante per oggi);
  - gli impegni in corso e quelli in ritardo;
  - il pulsante **Apri l'Agenda**.
  Resta 9 secondi, non sparisce se ci passi sopra col mouse e si chiude con ✕ o Esc.
- **Menu laterale dall'alto**: a ogni accesso o registrazione il menu riparte dal logo.

## 26. Novità 5.10: il Cestino

- **Dove:** menu a sinistra, gruppo «Il mio profilo», subito sotto «Archivio». Il numero accanto alla voce dice quanti elementi ci sono.
- **Cosa ci finisce:** tutto quello che elimini (giocatori, partite, report, note, impegni «Da fare», liste, squadre ombra, profili ideali, contatti, riunioni, incarichi, file). Se elimini un giocatore, finiscono nel cestino anche i suoi report e i suoi file, tutti insieme in una sola voce.
- **Ripristina:** rimette l'elemento al suo posto, con tutto quello che conteneva. Se ripristini un report il cui giocatore è nel cestino, torna anche il giocatore.
- **30 giorni:** ogni voce mostra quanti giorni le restano (in arancione sotto i 7, in rosso sotto i 3). Dopo 30 giorni si cancella da sola, per sempre (anche i file collegati).
- **Elimina per sempre / Svuota il cestino:** chiedono sempre conferma, perché non si torna indietro.
- **Subito dopo un'eliminazione** la barra in basso offre «Annulla» e un pulsante «Cestino».
- **Ricerca:** puoi cercare dentro il cestino; anche la ricerca generale mostra un riquadro «Nel Cestino» se trova qualcosa lì. Nello storico, le voci «Eliminazione» si toccano per ritrovarle nel cestino.
- **Non finiscono nel cestino:** il caricamento o la rimozione dei dati di esempio, l'importazione di un backup e il ripristino di una copia (per quelli c'è già la copia automatica «prima di…»). Gli elementi di un archivio nascosto compaiono nel cestino solo quando quell'archivio è aperto.

## 27. Novità 5.10.1: controllo dei dati

- **Gli errori non spostano più i campi:** il messaggio rosso compare in un riquadro sotto il campo, sopra il resto. Nessun altro campo si muove.
- **Età dei giocatori:** da 6 a 50 anni (dalle giovanili a fine carriera). L'anno di nascita va quindi dal anno attuale − 50 al anno attuale − 6 e si aggiorna da solo ogni anno. Le frecce del campo numerico si fermano ai limiti. Gli stessi limiti valgono per i filtri «Età» e per i profili ideali.
- **Date plausibili:** non si può più scrivere un anno come 2113. «Dal» e «Al» nei filtri dei report arrivano al massimo a oggi e «Dal» non può essere dopo «Al». La data di una valutazione o di una decisione non può essere nel futuro; la scadenza di un link condiviso non può essere nel passato. Finché la data è sbagliata il filtro non si applica e il salvataggio è bloccato.
- **Altri limiti:** numero di maglia 1–99, minuti 0–130, altezza 100–230 cm, peso 15–140 kg, anni della carriera coerenti (inizio non dopo la fine).
- **«Per quale giocatore?»:** l'elenco mantiene la sua altezza anche quando la ricerca non trova nulla e mostra «Nessun giocatore trovato.».
- **Note:** l'«Anteprima» ha la stessa misura del testo. Sotto il campo «Tag» trovi tutti i tag (tocca per aggiungerli o toglierli) e «+ Nuovo tag» per crearne uno.

## 28. Novità 5.10.2

- **Mezzala destra e sinistra:** sul campo dei ruoli ci sono due cerchi MEZ (sinistra e destra). Tocca quello giusto.
- **Posizione esatta:** sotto «Ruoli scelti» compare una riga con le posizioni reali del ruolo principale, per esempio:
  - Difensore centrale → centrale destro o sinistro (difesa a 4), centrale della difesa a 3, braccetto destro o sinistro;
  - Mediano → vertice basso, mediano destro o sinistro del doppio mediano;
  - Ala → ala del tridente, esterno della trequarti (4-2-3-1), esterno di centrocampo (4-4-2);
  - Punta → punta unica, punta destra o sinistra della coppia d'attacco.
  La posizione scelta sposta anche il punto sul campo, compare negli elenchi e nella scheda del giocatore. Non cambia i parametri della valutazione, che dipendono dal ruolo.
- **Un solo pulsante per bloccare:** nel menu resta «Blocca ora», come il lucchetto in alto. Dalla schermata di accesso puoi cambiare profilo (o crearne uno nuovo).
- **Beta ben visibile:** sotto il logo («BETA · v5.10.2»), nella barra in alto, nel piè di pagina («MM Scout · versione 5.10.2 (beta)») e nelle schermate di accesso e di creazione account, con l'avviso che possono esserci errori anche gravi.

## 29. Novità 5.10.3

- **Logo centrato:** nel menu a sinistra logo, nome e «BETA · versione» sono centrati, su computer e tablet. Sul telefono il marchio è in alto, sopra la barra beta: toccandolo torni alla Panoramica.
- **Primi passi:** in Panoramica una guida in 6 passaggi (profilo, primo giocatore, prima partita, azioni dal vivo, prima valutazione, primo backup) che si spuntano da soli e hanno il pulsante «Fai ora». I dati di esempio non contano. Si può nascondere e riaprire da Impostazioni.
- **Schermo sempre acceso:** durante la partita, quando il cronometro corre, lo schermo del telefono o del tablet non si spegne (se il browser lo permette). Sotto il cronometro compare «💡 schermo sempre acceso». Quando metti in pausa o esci dalla partita torna normale.

## 30. Novità 5.11: esempi tutti inventati e profilo giovanile

**Esempi tutti inventati (nuovo standard)**
- Ogni nuovo profilo, compreso il profilo demo per gli amici, parte con esempi **tutti inventati**: giocatori, società (es. FC Valdoria, Esempio Petrovar U17), campionati, stadi, carriere, date di nascita e note. Nessun nome vero, nessuna società o competizione reale.
- La struttura è la stessa di prima: una prima squadra completa, squadre giovanili, partite con le azioni registrate, valutazioni, profili ideali, riunioni, impegni e note.
- In **Impostazioni › Generale › Esempi** puoi ricaricare o togliere gli esempi in qualsiasi momento.
- I profili creati con versioni precedenti ricaricano da soli gli esempi nuovi al primo accesso: i tuoi dati non cambiano.

**Profilo giovanile (per i giocatori fino a 20 anni)**
- Nella scheda di modifica del giocatore c'è il riquadro **🌱 Profilo giovanile**:
  - annata e semestre di nascita, calcolati da soli (effetto età relativa);
  - categoria in cui gioca;
  - se gioca sotto età, cioè con i più grandi;
  - fase di crescita: prima, durante o dopo il picco;
  - settore giovanile o club formatore;
  - stagioni nel settore giovanile;
  - note sullo sviluppo.
- Restano anche **maturazione biologica** e **livello potenziale** (già presenti): nei giovani contano più del rendimento di oggi.
- Nella valutazione dei giovani c'è la nuova area **Sviluppo (giovani)**:
  - coordinazione e motricità;
  - capacità di apprendimento;
  - margini di miglioramento;
  - maturità rispetto all'età;
  - rendimento contro i più grandi;
  - passione e voglia di migliorare;
  - reazione alle difficoltà.
  Pesa poco nel rating (10, modificabile in Impostazioni) perché serve a capire il potenziale.
- Nella scheda del giocatore compare il riquadro «Profilo giovanile» con tutti i dati. Nell'elenco giocatori il pulsante **🌱 Giovani** mostra solo i giocatori fino a 20 anni.
- **Tutela dei minori:** per i minorenni l'app ricorda che i contatti passano dal club o dai genitori e di non salvare dati su scuola, salute o famiglia.

## 31. Novità 5.11.1

- **Ultime azioni durante la partita:** sotto le azioni compaiono le ultime 4 registrate, ognuna con tempo e minuto, esito (✓ ✗ =), azione e giocatore.
  - Ogni riga ha «Dettagli» per completarla e ✕ per cancellare proprio quella azione: tocca due volte, la prima chiede «Elimina?».
  - «Registro completo» porta all'elenco di tutte le azioni della partita.
- **App più leggera:** le icone pesano circa 800 KB in meno, senza differenze visibili.


## 32. Novità 5.11.2

- **Esempi solo inventati, anche nel codice:** nell'app non ci sono più nomi, club, campionati o stadi reali (nemmeno nelle traduzioni). La scelta «Rosa reale» non esiste più. Al primo accesso con questa versione gli esempi vecchi vengono sostituiti da soli, e con loro anche le relative voci nel Cestino e nello storico. I tuoi dati non cambiano.
- **Menu «Altro» su telefono e tablet:** si chiude con la ✕ in alto a destra, che resta visibile mentre scorri (oppure toccando fuori dal menu). La pagina in cui ti trovi è evidenziata.

## 33. Novità 5.11.4

- **Avanti / Indietro tra i passaggi della partita:** dopo «Avanti: …» la pagina torna su, all'inizio del passaggio nuovo (Arrivo e distinta, Prima, Durante, Dopo, Registro). Lo stesso succede con le schede del giocatore, delle Impostazioni, dell'Archivio, della ricerca, delle statistiche e dell'Agenda, quando le cambi da più in basso. Se la barra è già in vista, la pagina non si muove.
- **Date e ore su iPhone e iPad:** il testo della data e dell'ora è centrato in altezza come negli altri campi.

## 34. Novità 5.11.5: grafici sempre leggibili

- **Grafici radar** (a ragnatela: Confronto, scheda giocatore, report):
  - i nomi lunghi dei parametri vanno a capo e non vengono più tagliati, su telefono, tablet e computer e in tutte le lingue;
  - se un parametro non ha voti (es. un parametro dei giovani per un giocatore adulto), non viene più disegnato come «zero» al centro: la linea è tratteggiata e c'è la scritta «(nessun voto)»;
  - passando sopra un punto vedi parametro e voto.
- **Grafico a dispersione** (pagina Dati): i nomi vicino al bordo vanno a sinistra del punto e quelli vicini tra loro si spostano per non sovrapporsi.
- **Andamento:** la prima e l'ultima data non escono più dal grafico.

## 35. Novità 0.5.12: Committenti (per chi lavori)

Nuova pagina **Committenti** nel menu (sezione «Con lo staff»). Un committente è chi ti affida il lavoro: un club, un'agenzia, un agente, un'accademia, una piattaforma dati oppure un tuo progetto personale. Utile se lavori per più agenti o da freelance.

- **Aggiungi committente:** nome, tipo, colore, periodo (dal / al), referente, email, «Cosa ti chiede» (es. ruoli, categorie, quanti report) e «Accordo e note» (rimborsi, scadenze, a chi mandare i report).
- **Committente attivo:** quello che crei (incarichi, da fare, partite, giocatori, report, note, riunioni) viene segnato da solo con il committente attivo. In ogni modulo trovi il campo **«Per conto di»** per cambiarlo.
- **Schede dei committenti:** per ognuno vedi quanti «da fare», partite in programma, giocatori e report ha. Tocca un numero per andare alla sezione.
- **Apri:** mostra tutto il lavoro di quel committente (da fare e incarichi, partite, giocatori, report, note) e i pulsanti per creare subito un incarico, un «da fare», una partita o una nota già collegati a lui.
- **Copia riepilogo:** copia un testo semplice con incarichi aperti, da fare, partite in programma, ultimi report e numero di giocatori seguiti, da incollare in una email o in un messaggio.
- **Senza committente:** raccoglie i tuoi elementi non ancora assegnati.
- **Etichetta colorata** con il nome del committente nelle liste di giocatori, partite e report.
- **Eliminare un committente** non cancella niente: giocatori, partite e report restano, ma senza committente.
- Il riquadro «Per chi lavoro» del Profilo scout rimanda alla nuova pagina.

## 36. Novità 0.6.0: committenti ovunque, sincronizzazione su ogni sistema

- **Nuova numerazione delle versioni:** in beta il numero parte da **0** (0.6.0). La prima versione stabile sarà la **1.0.0**. Il numero si vede nel logo, in fondo alle pagine e in *Impostazioni › Informazioni*. I tuoi dati non cambiano.
- **«Lavoro per»** in cima a Panoramica, Agenda, Partite, Giocatori, Report, Staff e riunioni, Profili ideali, Note e Dati: scegli un committente e vedi solo il suo lavoro (anche nei numeri della pagina Dati). La barra colorata ti ricorda che il filtro è attivo; **✕ Mostra tutto** lo toglie. Quello che crei mentre il filtro è attivo va a quel committente.
- **Committente su tutto:** oltre a giocatori, partite, report, incarichi, cose da fare, note e riunioni, ora anche **contatti dello staff** e **profili ideali** hanno il campo **«Per conto di»**. Nei contatti resta anche il campo libero «Club o agenzia» (il club della persona).
- **Etichetta colorata del committente** in tutti gli elenchi: giocatori, partite, report, riunioni, incarichi, cose da fare, note, contatti, profili ideali, Agenda e Panoramica.
- **Pagina Committenti:** nel dettaglio ci sono anche **Profili ideali, Riunioni e Contatti**; nuovi pulsanti **+ Riunione** e **+ Contatto**; i link **«Apri le pagine solo con il suo lavoro»** portano a Panoramica, Agenda, Partite, Giocatori, Report, Staff e Dati già filtrati. Il riepilogo da copiare include le prossime riunioni.
- **Modulo del committente** più ordinato: Tipo, Dal, Al su una riga; Referente, Email, Colore sulla riga dopo; il colore è grande come gli altri campi. Ogni nuovo committente riceve un colore diverso dagli altri.
- **Chi ha creato e chi ha modificato:** ogni giocatore, partita, report, incarico, nota, riunione, contatto e profilo ideale salva chi l'ha creato e quando è stato modificato (nella scheda del giocatore: «Creato da … il … · per conto di …»).
- **Pulsante + in alto («Aggiungi»):** «+ Carica distinta» e, in più, **+ Incarico, + Da fare, + Riunione, + Nota, + Lista, + Committente**.
- **Sincronizzazione e backup su ogni sistema:** Mac, Windows e Linux (automatica con Chrome, Edge o Brave), iPhone, iPad e Android (con un tocco), con iCloud Drive, OneDrive, Google Drive, Dropbox, kDrive o una cartella del computer. Vedi il punto 2.

## 37. Novità 0.6.1: campi su misura e salvataggio sempre allineato

- **Ogni campo ha la larghezza giusta per quello che contiene**, in tutti i moduli dell'app (giocatore, partita, valutazione, incarichi, riunioni, contatti, profili ideali, committenti, impostazioni…):
  - nomi, squadre, club, email, link e menu con voci lunghe (es. «Partita nell'archivio») sono **larghi**: si legge di più;
  - date, ore, numeri, sigle (es. «Valutato da», «Risultato») e menu brevi sono **stretti**;
  - le note occupano tutta la riga;
  - le colonne sono uguali in tutto il modulo e le righe finiscono allineate, senza buchi.
- **Passando sopra un menu** con una voce lunga si legge la voce intera.
- **Ordine dei campi rivisto:**
  - *Committente:* Nome e Colore (piccolo) → Tipo, Dal, Al → Referente, Email → Cosa ti chiede, Accordo e note;
  - *Giocatore:* Nome, Cognome, Alias → nascita, sesso, piede, maglia → nazionalità e status → club, campionato → luogo di nascita;
  - *Valutazione › Dati della partita:* partita, data, fonte → squadre e risultato → tipologia, categorie, sistemi di gioco → maglia, minuti → valutato da.
- **Stessa altezza** per campi, menu e pulsanti sulla stessa riga (es. «Cambi durante la gara»: Min., squadra, modulo, nota e «+ Aggiungi»). Il selettore del colore ha la stessa altezza degli altri campi.
- **Personalizza › Azioni del registro live:** i menu Fase e Area ora si leggono per intero; sul telefono ogni campo ha la sua riga.
- **Salvataggio e sincronizzazione:** tutto quello che crei, modifichi o elimini viene salvato subito sul dispositivo (cifrato) e va nel file di sincronizzazione:
  - sul computer con la cartella collegata, se chiudi o lasci l'app prima dei 20 secondi la sincronizzazione parte subito;
  - su telefono e tablet la Panoramica ti avvisa quando hai modifiche non ancora sincronizzate, con il pulsante **Sincronizza ora**;
  - le cancellazioni restano cancellate anche se unisci un file più vecchio.

## 38. Novità 0.7.0

- **Torna su:** quando scorri una pagina lunga compare un pulsante rotondo in basso a destra (su telefono sopra la barra del menu). Un tocco e torni all'inizio della pagina. Si nasconde quando apri un modulo.
- **Annulla accanto a Salva:** in Nuovo / Modifica giocatore, nella valutazione e nel profilo ideale trovi **Annulla** sia in alto sia in fondo, vicino a **Salva**. Annulla ti riporta dove eri (elenco o scheda) senza salvare.
- **Note › Esporta** (accanto a Importa):
  - quali note: tutte, quelle che vedi ora (filtro e ricerca), una cartella (Lavoro, Personale, Fissate), un tag, oppure le scegli tu una per una;
  - formato: **cartella .zip** con un file .md per nota, divise in cartelle per tipo, primo tag o giocatore; **Markdown** in un unico file; **testo semplice**; **pagina da stampare o salvare in PDF**; **file .json** da reimportare con *Importa*.
- **Scegliere i giocatori più in fretta:** in *Nuova riunione › Giocatori da discutere*, in *Nuova partita › Giocatori da osservare* e nella *Rosa attuale* dei profili ideali puoi filtrare per ruolo, lista, giudizio, età e committente, vedere solo i giocatori scelti e scegliere tutti quelli visibili con un tocco. Accanto al nome c'è il ruolo.
- **Etichetta ESEMPIO sempre leggibile:** nei titoli lunghi delle riunioni (e degli altri elenchi) il titolo va a capo invece di tagliare l'etichetta, e la parola «(esempio)» non viene ripetuta.
- **Due committenti di esempio** (inventati): *FC Esempio Monteverde* (club) e *Agenzia Esempio Lario* (agenzia). Sono collegati a giocatori, partite, report, incarichi, cose da fare, riunioni, note, contatti dello staff e profili ideali, così vedi subito come funziona il lavoro diviso per committente. Spariscono con *Elimina esempi*; i tuoi committenti non vengono toccati.
- **Profili ideali › Rosa attuale e candidati:** aggiungi chi gioca oggi in quel ruolo (il **titolare attuale**, il riferimento) e confrontalo con i candidati: **Piano A · prima scelta**, **Piano B · alternativa**, **Piano C · opzione di riserva**. Per ognuno vedi aderenza al profilo e rating, con la differenza rispetto al titolare, e l'esito: **Migliora la rosa**, **Livello simile**, **Non migliora la rosa** (o *Dati insufficienti*). *Confronta rosa e candidati* apre il Confronto con il titolare e i candidati.
- **Codice di firma** (*Impostazioni › Sicurezza*): crei un codice di 6 cifre (serve la password) e firmi valutazioni, report e documenti con il codice invece della password. È salvato cifrato e vale su tutti i dispositivi sincronizzati; dopo 5 codici sbagliati serve la password. Lo puoi cambiare o disattivare.
- **Cambiare l'email di accesso** (*Impostazioni › Sicurezza*): nuova email + password. Il file di sincronizzazione mantiene il suo nome, così gli altri dispositivi continuano a trovarlo.
- **Codici via email o SMS:** non sono possibili senza un server e un servizio a pagamento che dovrebbe conoscere la tua email o il tuo numero. Per proteggere l'accesso, gratis e senza internet, ci sono la **verifica in due passaggi** con un'app di autenticazione e il **codice di recupero**.
- **Design rinnovato, più pulito:** colori più morbidi, bordi e ombre leggere, angoli arrotondati, campi con evidenziazione chiara quando scrivi, piccole animazioni (che si spengono se nel sistema hai scelto «riduci movimento»). Stesso ordine, stesse funzioni, stessa velocità.

## 39. Novità 0.8.0

- **Francese:** nuova lingua, tutta tradotta (menu, moduli, messaggi, esempi, parametri di valutazione, ruoli e azioni). Nel menu delle lingue è sotto il tedesco. Le date seguono il formato francese.
- **Menu a tendina leggibili:** il testo non finisce più sotto la freccia, in nessuna pagina (es. «Mostra il lavoro di: Agenzia Esempio Lario»).
- **Nuovo report: un giocatore alla volta.** Da Panoramica, Report, «Primi passi» e dal pulsante + la scelta del giocatore è singola: tocchi il nome e si apre subito la valutazione. Puoi cercare per nome, club o nazionalità e filtrare per ruolo, lista, giudizio, età e committente. Dove serve sceglierne più di uno (es. «Aggiungi alla lista») ci sono le caselle e gli stessi filtri.
- **Pagina Committenti più corta e chiara:**
  - in alto **«I nuovi elementi vanno a»**: scegli il committente a cui vengono assegnati i nuovi giocatori, partite, report…; **«Nessun committente»** (prima si chiamava «Nessuno») vuol dire che i nuovi elementi non vengono assegnati a nessuno. Cambiarlo non mostra più «Salvato · Annulla · Conferma»;
  - **tocca la scheda** di un committente (in qualsiasi punto) per aprirla; toccala di nuovo per chiuderla. Le schede reagiscono al passaggio del mouse;
  - il dettaglio è diviso in **schede**: Riepilogo (dati, cosa ti chiede, accordo, pulsanti per creare, prossime scadenze e partite), Da fare, Partite, Giocatori, Report, Staff e riunioni, Profili e note. Ogni scheda ha il suo numero. I numeri sulle carte portano direttamente alla scheda giusta.
- **«Mostra il lavoro di»** (prima «Lavoro per»): il filtro in cima alle pagine, per non confonderlo con il committente a cui vanno i nuovi elementi.
- **Design rinnovato:** titoli in minuscolo normale, più moderni e leggibili (il logo resta in stile sportivo); icone vere al posto delle emoji nei titoli e nelle scorciatoie della Panoramica; schede, campi e pulsanti più puliti.

## 40. Novità 0.9.0

- **Accesso più ordinato:** su computer la schermata di accesso è su due colonne: a sinistra il modulo (email, password, pulsanti), a destra gli avvisi della beta e i dati della demo. Tutto è visibile senza scorrere, piè di pagina compreso. Su telefono le parti sono una sotto l'altra.
- **Icona della posta illuminata:** passando con il mouse sull'icona dell'email si colora, come quella di LinkedIn (anche nella schermata di accesso).
- **Menu a sinistra ridimensionabile** (computer e tablet): trascina il bordo destro del menu per allargarlo o stringerlo. Doppio clic sul bordo: larghezza normale. Con la tastiera: frecce ← →. La larghezza viene ricordata.
- **Menu ridotto:** il logo ora è al centro.
- **Nuovo logo moderno:** due «M» bianche su verde scuro con un punto verde chiaro. È disegnato a vettori, quindi resta nitido a ogni dimensione (anche come icona dell'app sul telefono). Il logo classico con l'erba resta disponibile: *Impostazioni › Generale › Logo*.
- **Niente salti di testo:** nelle schede (es. Committenti con l'etichetta **ATTIVO**) l'etichetta sta accanto al nome e i numeri in basso restano allineati tra una scheda e l'altra.
- **Agenda:** la cornice dei pulsanti *Oggi · Calendario e bacheca · Calendario · Bacheca* finisce dopo l'ultimo pulsante. Gli impegni hanno icone vere (partita, video, report, telefonata, trasferta, riunione, studio…) al posto delle emoji.
- **Dati › Tutti i giocatori › Esporta CSV:** scarichi la tabella da aprire con Excel, Numbers o Google Fogli.
- **Design uguale in ogni pagina:** un solo carattere per titoli, numeri e testi (il carattere sportivo resta solo nel nome dell'app).
- **Personalizza su telefono:** i nomi delle aree di valutazione (es. «Sviluppo (giovani)») non vengono più tagliati: i campi vanno uno sotto l'altro, come quelli degli attributi.
