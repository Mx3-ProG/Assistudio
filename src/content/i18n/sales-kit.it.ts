import type { KitEntry } from "../sales-kit.ts";

/** Sales kit — Italian. Same order as the English entries. */
const entries: KitEntry[] = [
  ["email", "Primo contatto — professioni con portfolio",
`Oggetto: [Azienda] — trasformare i visitatori in appuntamenti prenotati

Ciao [Nome],

ho scoperto [Azienda] e mi è piaciuto molto [progetto specifico].

Una domanda veloce: quando qualcuno scopre il tuo lavoro online, cosa succede dopo? La maggior parte dei professionisti con cui parlo riceve richieste tramite moduli, Instagram ed email — senza budget, tempistiche o dettagli del progetto.

Studio ATS risolve questo problema. È uno studio commerciale online che presenta il tuo lavoro, qualifica ogni richiesta e prenota l’appuntamento automaticamente. Lo costruiamo e lo gestiamo noi per te.

Ti sarebbe utile un’occhiata di 10 minuti? Ecco una panoramica: [il tuo link]

A presto,
[Il tuo nome]`],
  ["email", "Follow-up dopo 3 giorni",
`Oggetto: Re: [Azienda] — trasformare i visitatori in appuntamenti prenotati

Ciao [Nome],

riporto solo in cima questo messaggio. Se le richieste senza budget né tempistiche ti suonano familiari, Studio ATS vale 10 minuti: [il tuo link]

Se ora non è una priorità, nessun problema — dimmelo e non ti scriverò più.

[Il tuo nome]`],
  ["whatsapp", "Presentazione breve",
`Ciao [Nome] 👋 Ho visto il tuo lavoro su [progetto], davvero bello. Lavoro con Studio ATS: trasforma il tuo portfolio in uno spazio che qualifica le richieste e prenota le chiamate automaticamente. Ti mando una panoramica di 2 minuti?`],
  ["whatsapp", "Dopo una chiamata",
`Grazie per la chiamata, [Nome]! Ecco la pagina di Studio ATS di cui abbiamo parlato: [il tuo link]. Fammi sapere se hai domande.`],
  ["linkedin", "Nota di collegamento",
`Ciao [Nome], aiuto [professione] a trasformare la loro visibilità online in appuntamenti qualificati. Mi farebbe piacere collegarci.`],
  ["linkedin", "Messaggio dopo il collegamento",
`Grazie per il collegamento, [Nome]. Ho notato che [Azienda] lavora su [tipo di progetto]. Di solito come ti contattano i nuovi clienti? Lavoro con Studio ATS, che qualifica le richieste e prenota automaticamente le chiamate conoscitive. Se ti è utile, ti condivido una breve panoramica: [il tuo link]`],
  ["instagram", "DM — creativi con portfolio",
`Ciao! Il tuo feed è bellissimo 🙌 Una domanda: quando qualcuno vuole prenotarti, ti scrive semplicemente in DM? Studio ATS trasforma il tuo portfolio in uno spazio di prenotazione che chiede subito data, budget e tipo di progetto. Ti mando il link?`],
  ["cold_call", "Script per chiamata a freddo",
`1. Apertura — «Ciao [Nome], sono [Il tuo nome]. Sarò breve: aiuto [professione] a trasformare i visitatori del sito in appuntamenti qualificati. Hai 30 secondi?»
2. Domanda — «Oggi, quando qualcuno trova il tuo lavoro online, come ti contatta?»
3. Ascolta. Riformula il problema (richieste sparse, nessuna qualificazione, follow-up dimenticati).
4. Proposta — «Studio ATS è uno studio commerciale costruito per te: portfolio, qualificazione delle richieste, appuntamenti, email e follow-up automatici. Il team lo costruisce e lo gestisce.»
5. Passo successivo — «Ti mando la panoramica e fissiamo 15 minuti per guardarla insieme?»`],
  ["objection", "«Ho già un sito.»",
`Ottimo — Studio ATS non serve a sostituire un bel sito. La domanda è cosa succede dopo la visita: le richieste vengono qualificate? I follow-up sono automatici? Sai quali fonti portano clienti veri? Il sito è un tassello; Studio ATS è tutto il percorso fino all’appuntamento.`],
  ["objection", "«È troppo caro.»",
`È una domanda legittima. Quanto vale per te un nuovo cliente? Studio ATS costa 6.000 € all’anno, tutto incluso. Per un professionista i cui clienti hanno un valore elevato, la domanda è se aiuta a convertire le richieste che ricevi già. [Non promettere risultati — lascia che il potenziale cliente faccia i propri conti.]`],
  ["objection", "«Lavoro solo con Instagram.»",
`Instagram è ottimo per farsi scoprire. Studio ATS è il luogo in cui quell’attenzione diventa una richiesta strutturata — con data, budget e dettagli del progetto — invece dell’ennesimo DM da rincorrere. Completa Instagram, non lo sostituisce.`],
  ["objection", "«Non ho bisogno di automazione.»",
`Capisco. Qui automazione significa solo che l’email di conferma, il promemoria e il follow-up partono in tempo — le cose che si dimenticano nelle settimane piene. Mantieni il controllo di ogni conversazione.`],
  ["objection", "«Devo pensarci.»",
`Certo. Per aiutarti a riflettere: cosa dovrebbe essere vero perché ne valga la pena per te? Ti mando la panoramica [il tuo link] e ti ricontatto [giorno] — ti va bene?`],
];

export default entries;
