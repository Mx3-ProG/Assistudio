/* ==========================================================================
   Garage Du Lac — Contenu des 4 pages légales (FR/EN/DE/ES/IT)
   Éditeur & hébergeur : Wayne-Web — https://www.wayne-web.com
   ========================================================================== */
(function () {
  'use strict';

  /* Chaque page est décrite par une liste de blocs :
     { h: 'Titre' }  → <h2>      { p: 'Texte' } → <p>      { ul: [...] } → liste  */

  var L = {

  /* ============================== COOKIES ================================= */
  cookies: {
    fr: [
      { p: 'Cette politique explique quels cookies et traceurs sont déposés sur votre appareil lorsque vous consultez le site du Garage Du Lac, dans quel but, et comment vous pouvez à tout moment revenir sur votre choix.' },
      { h: 'Qu\'est-ce qu\'un cookie ?' },
      { p: 'Un cookie est un petit fichier texte enregistré par votre navigateur lors de la consultation d\'un site. Il permet au site de mémoriser des informations sur votre visite, par exemple votre langue d\'affichage ou votre choix en matière de confidentialité.' },
      { h: 'Cookies utilisés sur ce site' },
      { p: 'Nous distinguons deux catégories.' },
      { h: 'Cookies strictement nécessaires' },
      { p: 'Ils sont indispensables au fonctionnement du site et sont déposés sans votre consentement, conformément à la réglementation applicable. Sur ce site, il s\'agit exclusivement de données stockées localement dans votre navigateur :' },
      { ul: [
        'Langue d\'affichage choisie (français, anglais, allemand, espagnol ou italien) — durée : 12 mois.',
        'Thème clair ou sombre sélectionné — durée : 12 mois.',
        'Mémorisation de votre choix concernant les cookies — durée : 6 mois.',
        'Session d\'administration, uniquement si vous vous connectez à l\'espace réservé — durée : la session.'
      ]},
      { h: 'Cookies de mesure d\'audience' },
      { p: 'Ils permettent de comprendre comment le site est utilisé (pages consultées, sources de visite) afin de l\'améliorer. Ils ne sont déposés qu\'après votre accord explicite, via le bandeau affiché lors de votre première visite. Tant que vous n\'avez pas accepté, aucun outil de mesure d\'audience n\'est activé.' },
      { h: 'Cookies publicitaires' },
      { p: 'Aucun cookie publicitaire ni traceur de réseau social n\'est utilisé sur ce site.' },
      { h: 'Contenus tiers' },
      { p: 'La page de contact affiche une carte fournie par OpenStreetMap. Le chargement de cette carte implique une connexion aux serveurs d\'OpenStreetMap, qui peuvent enregistrer votre adresse IP. Les polices de caractères sont fournies par Google Fonts.' },
      { h: 'Modifier votre choix' },
      { p: 'Vous pouvez à tout moment revenir sur votre décision en supprimant les données de site enregistrées par votre navigateur pour ce domaine. Le bandeau de consentement vous sera alors de nouveau proposé lors de votre prochaine visite.' },
      { h: 'Réglage depuis votre navigateur' },
      { p: 'Tous les navigateurs permettent de bloquer ou de supprimer les cookies via leurs paramètres de confidentialité. Le blocage des cookies strictement nécessaires peut dégrader le fonctionnement du site (perte de la langue choisie, par exemple).' }
    ],
    en: [
      { p: 'This policy explains which cookies and trackers are placed on your device when you visit the Garage Du Lac website, for what purpose, and how you can change your choice at any time.' },
      { h: 'What is a cookie?' },
      { p: 'A cookie is a small text file saved by your browser when you visit a website. It allows the site to remember information about your visit, such as your display language or your privacy choice.' },
      { h: 'Cookies used on this site' },
      { p: 'We distinguish two categories.' },
      { h: 'Strictly necessary cookies' },
      { p: 'These are essential for the site to work and are placed without your consent, in accordance with applicable regulations. On this site they consist exclusively of data stored locally in your browser:' },
      { ul: [
        'Selected display language (French, English, German, Spanish or Italian) — duration: 12 months.',
        'Selected light or dark theme — duration: 12 months.',
        'Record of your cookie choice — duration: 6 months.',
        'Administration session, only if you sign in to the reserved area — duration: the session.'
      ]},
      { h: 'Audience measurement cookies' },
      { p: 'These help us understand how the site is used (pages viewed, traffic sources) in order to improve it. They are only placed after your explicit consent through the banner shown on your first visit. Until you accept, no audience measurement tool is activated.' },
      { h: 'Advertising cookies' },
      { p: 'No advertising cookies or social network trackers are used on this site.' },
      { h: 'Third-party content' },
      { p: 'The contact page displays a map provided by OpenStreetMap. Loading this map involves a connection to OpenStreetMap servers, which may record your IP address. Fonts are provided by Google Fonts.' },
      { h: 'Changing your choice' },
      { p: 'You may change your decision at any time by deleting the site data saved by your browser for this domain. The consent banner will then be shown again on your next visit.' },
      { h: 'Browser settings' },
      { p: 'All browsers allow cookies to be blocked or deleted through their privacy settings. Blocking strictly necessary cookies may degrade how the site works (loss of your chosen language, for example).' }
    ],
    de: [
      { p: 'Diese Richtlinie erklärt, welche Cookies und Tracker beim Besuch der Website der Garage Du Lac auf Ihrem Gerät gespeichert werden, zu welchem Zweck und wie Sie Ihre Wahl jederzeit ändern können.' },
      { h: 'Was ist ein Cookie?' },
      { p: 'Ein Cookie ist eine kleine Textdatei, die Ihr Browser beim Besuch einer Website speichert. Sie ermöglicht es der Website, Informationen zu Ihrem Besuch zu merken, etwa Ihre Anzeigesprache oder Ihre Datenschutzentscheidung.' },
      { h: 'Auf dieser Website verwendete Cookies' },
      { p: 'Wir unterscheiden zwei Kategorien.' },
      { h: 'Unbedingt erforderliche Cookies' },
      { p: 'Sie sind für den Betrieb der Website unerlässlich und werden gemäss den geltenden Vorschriften ohne Ihre Einwilligung gesetzt. Auf dieser Website handelt es sich ausschliesslich um lokal im Browser gespeicherte Daten:' },
      { ul: [
        'Gewählte Anzeigesprache (Französisch, Englisch, Deutsch, Spanisch oder Italienisch) — Dauer: 12 Monate.',
        'Gewähltes helles oder dunkles Design — Dauer: 12 Monate.',
        'Speicherung Ihrer Cookie-Entscheidung — Dauer: 6 Monate.',
        'Administrationssitzung, nur wenn Sie sich im geschützten Bereich anmelden — Dauer: die Sitzung.'
      ]},
      { h: 'Cookies zur Reichweitenmessung' },
      { p: 'Sie helfen zu verstehen, wie die Website genutzt wird (aufgerufene Seiten, Besuchsquellen), um sie zu verbessern. Sie werden erst nach Ihrer ausdrücklichen Zustimmung über das beim ersten Besuch angezeigte Banner gesetzt. Solange Sie nicht zustimmen, wird kein Messwerkzeug aktiviert.' },
      { h: 'Werbe-Cookies' },
      { p: 'Auf dieser Website werden keine Werbe-Cookies und keine Social-Media-Tracker eingesetzt.' },
      { h: 'Inhalte Dritter' },
      { p: 'Die Kontaktseite zeigt eine von OpenStreetMap bereitgestellte Karte. Das Laden dieser Karte erfordert eine Verbindung zu den Servern von OpenStreetMap, die Ihre IP-Adresse erfassen können. Die Schriftarten werden von Google Fonts bereitgestellt.' },
      { h: 'Ihre Wahl ändern' },
      { p: 'Sie können Ihre Entscheidung jederzeit ändern, indem Sie die von Ihrem Browser für diese Domain gespeicherten Website-Daten löschen. Das Einwilligungsbanner wird Ihnen dann beim nächsten Besuch erneut angezeigt.' },
      { h: 'Einstellungen im Browser' },
      { p: 'Alle Browser erlauben es, Cookies über die Datenschutzeinstellungen zu blockieren oder zu löschen. Das Blockieren unbedingt erforderlicher Cookies kann die Funktion der Website beeinträchtigen (zum Beispiel Verlust der gewählten Sprache).' }
    ],
    es: [
      { p: 'Esta política explica qué cookies y rastreadores se instalan en su dispositivo cuando consulta el sitio de Garage Du Lac, con qué finalidad y cómo puede modificar su elección en cualquier momento.' },
      { h: '¿Qué es una cookie?' },
      { p: 'Una cookie es un pequeño archivo de texto que su navegador guarda al consultar un sitio web. Permite al sitio recordar información sobre su visita, por ejemplo el idioma de visualización o su elección en materia de privacidad.' },
      { h: 'Cookies utilizadas en este sitio' },
      { p: 'Distinguimos dos categorías.' },
      { h: 'Cookies estrictamente necesarias' },
      { p: 'Son imprescindibles para el funcionamiento del sitio y se instalan sin su consentimiento, conforme a la normativa aplicable. En este sitio se trata exclusivamente de datos almacenados localmente en su navegador:' },
      { ul: [
        'Idioma de visualización elegido (francés, inglés, alemán, español o italiano) — duración: 12 meses.',
        'Tema claro u oscuro seleccionado — duración: 12 meses.',
        'Registro de su elección sobre las cookies — duración: 6 meses.',
        'Sesión de administración, únicamente si accede al área reservada — duración: la sesión.'
      ]},
      { h: 'Cookies de medición de audiencia' },
      { p: 'Permiten comprender cómo se utiliza el sitio (páginas consultadas, fuentes de visita) para mejorarlo. Solo se instalan tras su consentimiento explícito, mediante el banner mostrado en su primera visita. Mientras no acepte, no se activa ninguna herramienta de medición.' },
      { h: 'Cookies publicitarias' },
      { p: 'En este sitio no se utiliza ninguna cookie publicitaria ni rastreador de redes sociales.' },
      { h: 'Contenidos de terceros' },
      { p: 'La página de contacto muestra un mapa facilitado por OpenStreetMap. La carga de ese mapa implica una conexión a los servidores de OpenStreetMap, que pueden registrar su dirección IP. Las tipografías las proporciona Google Fonts.' },
      { h: 'Modificar su elección' },
      { p: 'Puede modificar su decisión en cualquier momento eliminando los datos del sitio guardados por su navegador para este dominio. El banner de consentimiento se le mostrará de nuevo en su próxima visita.' },
      { h: 'Ajustes desde su navegador' },
      { p: 'Todos los navegadores permiten bloquear o eliminar las cookies desde sus ajustes de privacidad. Bloquear las cookies estrictamente necesarias puede degradar el funcionamiento del sitio (por ejemplo, pérdida del idioma elegido).' }
    ],
    it: [
      { p: 'La presente politica spiega quali cookie e traccianti vengono installati sul vostro dispositivo quando consultate il sito di Garage Du Lac, con quale finalità e come potete modificare la vostra scelta in qualsiasi momento.' },
      { h: 'Che cos\'è un cookie?' },
      { p: 'Un cookie è un piccolo file di testo salvato dal vostro browser durante la consultazione di un sito. Permette al sito di memorizzare informazioni sulla vostra visita, ad esempio la lingua di visualizzazione o la vostra scelta in materia di privacy.' },
      { h: 'Cookie utilizzati su questo sito' },
      { p: 'Distinguiamo due categorie.' },
      { h: 'Cookie strettamente necessari' },
      { p: 'Sono indispensabili al funzionamento del sito e vengono installati senza il vostro consenso, conformemente alla normativa applicabile. Su questo sito si tratta esclusivamente di dati memorizzati localmente nel browser:' },
      { ul: [
        'Lingua di visualizzazione scelta (francese, inglese, tedesco, spagnolo o italiano) — durata: 12 mesi.',
        'Tema chiaro o scuro selezionato — durata: 12 mesi.',
        'Memorizzazione della vostra scelta sui cookie — durata: 6 mesi.',
        'Sessione di amministrazione, solo se accedete all\'area riservata — durata: la sessione.'
      ]},
      { h: 'Cookie di misurazione del pubblico' },
      { p: 'Permettono di capire come viene utilizzato il sito (pagine consultate, sorgenti di visita) al fine di migliorarlo. Vengono installati solo dopo il vostro consenso esplicito, tramite il banner mostrato alla prima visita. Finché non accettate, nessuno strumento di misurazione viene attivato.' },
      { h: 'Cookie pubblicitari' },
      { p: 'Su questo sito non viene utilizzato alcun cookie pubblicitario né tracciante di social network.' },
      { h: 'Contenuti di terzi' },
      { p: 'La pagina dei contatti mostra una mappa fornita da OpenStreetMap. Il caricamento di questa mappa comporta una connessione ai server di OpenStreetMap, che possono registrare il vostro indirizzo IP. I caratteri tipografici sono forniti da Google Fonts.' },
      { h: 'Modificare la propria scelta' },
      { p: 'Potete modificare la vostra decisione in qualsiasi momento eliminando i dati del sito salvati dal browser per questo dominio. Il banner di consenso vi verrà quindi riproposto alla visita successiva.' },
      { h: 'Impostazioni dal browser' },
      { p: 'Tutti i browser consentono di bloccare o eliminare i cookie tramite le impostazioni sulla privacy. Il blocco dei cookie strettamente necessari può degradare il funzionamento del sito (ad esempio la perdita della lingua scelta).' }
    ]
  },

  /* ================================ RGPD ================================== */
  rgpd: {
    fr: [
      { p: 'Le Garage Du Lac est établi en Suisse et traite les données personnelles conformément à la Loi fédérale sur la protection des données (LPD, révisée) ainsi qu\'au Règlement général sur la protection des données (RGPD) lorsque celui-ci s\'applique, notamment pour les personnes résidant dans l\'Union européenne.' },
      { h: 'Responsable du traitement' },
      { p: 'Garage Du Lac, Rte Cantonale 98, 1898 Saint-Gingolph, Suisse. Téléphone : +41 24 481 17 34. Courriel : contact@garagedulac.ch.' },
      { h: 'Sous-traitant technique' },
      { p: 'Le site est édité et hébergé par Wayne-Web (www.wayne-web.com), qui agit en qualité de sous-traitant au sens de l\'art. 28 RGPD, sur instruction du Garage Du Lac et dans le cadre d\'un accord de traitement des données.' },
      { h: 'Vos droits' },
      { p: 'Vous disposez à tout moment des droits suivants sur les données qui vous concernent :' },
      { ul: [
        'Droit d\'accès : obtenir la confirmation que vos données sont traitées et en recevoir une copie.',
        'Droit de rectification : faire corriger des données inexactes ou incomplètes.',
        'Droit à l\'effacement : demander la suppression de vos données, sous réserve des obligations légales de conservation.',
        'Droit à la limitation : demander le gel temporaire d\'un traitement que vous contestez.',
        'Droit d\'opposition : vous opposer à un traitement fondé sur notre intérêt légitime.',
        'Droit à la portabilité : recevoir vos données dans un format structuré et lisible par machine.',
        'Droit de retirer votre consentement à tout moment, sans que cela remette en cause la licéité du traitement effectué auparavant.'
      ]},
      { h: 'Exercer vos droits' },
      { p: 'Adressez votre demande par courriel à contact@garagedulac.ch ou par courrier à l\'adresse de l\'atelier. Nous répondons dans un délai d\'un mois. Une pièce d\'identité peut vous être demandée si un doute raisonnable existe sur votre identité.' },
      { h: 'Bases légales des traitements' },
      { ul: [
        'Exécution d\'un contrat ou de mesures précontractuelles : traitement d\'une demande de devis, prise de rendez-vous, réalisation et facturation d\'une intervention.',
        'Obligation légale : conservation des pièces comptables pendant dix ans conformément au droit suisse.',
        'Intérêt légitime : sécurité du site, prévention de la fraude, amélioration de nos services.',
        'Consentement : mesure d\'audience et, le cas échéant, envoi d\'informations commerciales.'
      ]},
      { h: 'Durées de conservation' },
      { ul: [
        'Demande de contact ou de devis sans suite : 12 mois.',
        'Dossier client et historique d\'intervention : 10 ans à compter de la dernière intervention (obligation comptable).',
        'Journaux techniques de connexion : 12 mois.',
        'Preuve du consentement aux cookies : 6 mois.'
      ]},
      { h: 'Transferts hors de Suisse et de l\'UE' },
      { p: 'Les données sont hébergées en Suisse ou dans l\'Union européenne. Aucun transfert vers un pays tiers dépourvu de niveau de protection adéquat n\'est effectué sans garanties appropriées (clauses contractuelles types).' },
      { h: 'Réclamation' },
      { p: 'Vous pouvez adresser une réclamation au Préposé fédéral à la protection des données et à la transparence (PFPDT) en Suisse, ou à l\'autorité de contrôle de votre pays de résidence si vous résidez dans l\'Union européenne.' }
    ],
    en: [
      { p: 'Garage Du Lac is established in Switzerland and processes personal data in accordance with the Swiss Federal Act on Data Protection (revised FADP) and with the General Data Protection Regulation (GDPR) where applicable, in particular for individuals residing in the European Union.' },
      { h: 'Data controller' },
      { p: 'Garage Du Lac, Rte Cantonale 98, 1898 Saint-Gingolph, Switzerland. Phone: +41 24 481 17 34. Email: contact@garagedulac.ch.' },
      { h: 'Technical processor' },
      { p: 'The site is published and hosted by Wayne-Web (www.wayne-web.com), acting as a processor within the meaning of Art. 28 GDPR, on the instructions of Garage Du Lac and under a data processing agreement.' },
      { h: 'Your rights' },
      { p: 'At any time you have the following rights over the data concerning you:' },
      { ul: [
        'Right of access: obtain confirmation that your data is processed and receive a copy of it.',
        'Right to rectification: have inaccurate or incomplete data corrected.',
        'Right to erasure: request deletion of your data, subject to statutory retention obligations.',
        'Right to restriction: request the temporary freezing of processing you contest.',
        'Right to object: object to processing based on our legitimate interest.',
        'Right to portability: receive your data in a structured, machine-readable format.',
        'Right to withdraw your consent at any time, without affecting the lawfulness of processing carried out beforehand.'
      ]},
      { h: 'Exercising your rights' },
      { p: 'Send your request by email to contact@garagedulac.ch or by post to the workshop address. We reply within one month. Proof of identity may be requested if there is reasonable doubt as to your identity.' },
      { h: 'Legal bases for processing' },
      { ul: [
        'Performance of a contract or pre-contractual measures: handling a quote request, booking, carrying out and invoicing a job.',
        'Legal obligation: retention of accounting records for ten years under Swiss law.',
        'Legitimate interest: site security, fraud prevention, improvement of our services.',
        'Consent: audience measurement and, where applicable, sending commercial information.'
      ]},
      { h: 'Retention periods' },
      { ul: [
        'Contact or quote request with no follow-up: 12 months.',
        'Customer file and service history: 10 years from the last job (accounting obligation).',
        'Technical connection logs: 12 months.',
        'Proof of cookie consent: 6 months.'
      ]},
      { h: 'Transfers outside Switzerland and the EU' },
      { p: 'Data is hosted in Switzerland or in the European Union. No transfer to a third country lacking an adequate level of protection is carried out without appropriate safeguards (standard contractual clauses).' },
      { h: 'Complaints' },
      { p: 'You may lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC), or with the supervisory authority of your country of residence if you live in the European Union.' }
    ],
    de: [
      { p: 'Die Garage Du Lac hat ihren Sitz in der Schweiz und bearbeitet Personendaten gemäss dem Bundesgesetz über den Datenschutz (revidiertes DSG) sowie der Datenschutz-Grundverordnung (DSGVO), soweit diese anwendbar ist, insbesondere für Personen mit Wohnsitz in der Europäischen Union.' },
      { h: 'Verantwortlicher' },
      { p: 'Garage Du Lac, Rte Cantonale 98, 1898 Saint-Gingolph, Schweiz. Telefon: +41 24 481 17 34. E-Mail: contact@garagedulac.ch.' },
      { h: 'Technischer Auftragsbearbeiter' },
      { p: 'Die Website wird von Wayne-Web (www.wayne-web.com) herausgegeben und gehostet. Wayne-Web handelt als Auftragsverarbeiter im Sinne von Art. 28 DSGVO, auf Weisung der Garage Du Lac und im Rahmen eines Auftragsverarbeitungsvertrags.' },
      { h: 'Ihre Rechte' },
      { p: 'Sie haben jederzeit die folgenden Rechte bezüglich der Sie betreffenden Daten:' },
      { ul: [
        'Auskunftsrecht: Bestätigung erhalten, dass Ihre Daten bearbeitet werden, und eine Kopie davon erhalten.',
        'Recht auf Berichtigung: unrichtige oder unvollständige Daten berichtigen lassen.',
        'Recht auf Löschung: Löschung Ihrer Daten verlangen, vorbehaltlich gesetzlicher Aufbewahrungspflichten.',
        'Recht auf Einschränkung: das vorübergehende Einfrieren einer von Ihnen bestrittenen Bearbeitung verlangen.',
        'Widerspruchsrecht: einer auf unserem berechtigten Interesse beruhenden Bearbeitung widersprechen.',
        'Recht auf Datenübertragbarkeit: Ihre Daten in einem strukturierten, maschinenlesbaren Format erhalten.',
        'Recht, Ihre Einwilligung jederzeit zu widerrufen, ohne dass die Rechtmässigkeit der zuvor erfolgten Bearbeitung berührt wird.'
      ]},
      { h: 'Ausübung Ihrer Rechte' },
      { p: 'Richten Sie Ihr Gesuch per E-Mail an contact@garagedulac.ch oder per Post an die Adresse der Werkstatt. Wir antworten innert eines Monats. Bei begründeten Zweifeln an Ihrer Identität kann ein Ausweis verlangt werden.' },
      { h: 'Rechtsgrundlagen der Bearbeitung' },
      { ul: [
        'Vertragserfüllung oder vorvertragliche Massnahmen: Bearbeitung einer Offertanfrage, Terminvereinbarung, Ausführung und Fakturierung einer Arbeit.',
        'Gesetzliche Pflicht: Aufbewahrung der Buchhaltungsunterlagen während zehn Jahren nach Schweizer Recht.',
        'Berechtigtes Interesse: Sicherheit der Website, Betrugsprävention, Verbesserung unserer Dienstleistungen.',
        'Einwilligung: Reichweitenmessung und gegebenenfalls Versand kommerzieller Informationen.'
      ]},
      { h: 'Aufbewahrungsdauer' },
      { ul: [
        'Kontakt- oder Offertanfrage ohne Folge: 12 Monate.',
        'Kundendossier und Servicehistorie: 10 Jahre ab der letzten Arbeit (Buchhaltungspflicht).',
        'Technische Verbindungsprotokolle: 12 Monate.',
        'Nachweis der Cookie-Einwilligung: 6 Monate.'
      ]},
      { h: 'Übermittlung ausserhalb der Schweiz und der EU' },
      { p: 'Die Daten werden in der Schweiz oder in der Europäischen Union gehostet. Eine Übermittlung in ein Drittland ohne angemessenes Schutzniveau erfolgt nicht ohne geeignete Garantien (Standardvertragsklauseln).' },
      { h: 'Beschwerde' },
      { p: 'Sie können eine Beschwerde beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) in der Schweiz einreichen oder bei der Aufsichtsbehörde Ihres Wohnsitzlandes, wenn Sie in der Europäischen Union wohnen.' }
    ],
    es: [
      { p: 'Garage Du Lac está establecido en Suiza y trata los datos personales conforme a la Ley Federal de Protección de Datos (LPD revisada) y al Reglamento General de Protección de Datos (RGPD) cuando este resulta aplicable, en particular para las personas residentes en la Unión Europea.' },
      { h: 'Responsable del tratamiento' },
      { p: 'Garage Du Lac, Rte Cantonale 98, 1898 Saint-Gingolph, Suiza. Teléfono: +41 24 481 17 34. Correo: contact@garagedulac.ch.' },
      { h: 'Encargado técnico' },
      { p: 'El sitio está editado y alojado por Wayne-Web (www.wayne-web.com), que actúa como encargado del tratamiento en el sentido del art. 28 del RGPD, siguiendo instrucciones de Garage Du Lac y en el marco de un contrato de tratamiento de datos.' },
      { h: 'Sus derechos' },
      { p: 'En cualquier momento dispone de los siguientes derechos sobre los datos que le conciernen:' },
      { ul: [
        'Derecho de acceso: obtener confirmación de que sus datos son tratados y recibir una copia.',
        'Derecho de rectificación: hacer corregir datos inexactos o incompletos.',
        'Derecho de supresión: solicitar la eliminación de sus datos, sin perjuicio de las obligaciones legales de conservación.',
        'Derecho de limitación: solicitar la congelación temporal de un tratamiento que impugne.',
        'Derecho de oposición: oponerse a un tratamiento basado en nuestro interés legítimo.',
        'Derecho a la portabilidad: recibir sus datos en un formato estructurado y legible por máquina.',
        'Derecho a retirar su consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento previo.'
      ]},
      { h: 'Ejercer sus derechos' },
      { p: 'Envíe su solicitud por correo electrónico a contact@garagedulac.ch o por correo postal a la dirección del taller. Respondemos en el plazo de un mes. Puede solicitarse un documento de identidad si existe una duda razonable sobre su identidad.' },
      { h: 'Bases legales de los tratamientos' },
      { ul: [
        'Ejecución de un contrato o de medidas precontractuales: tramitación de una solicitud de presupuesto, cita, realización y facturación de una intervención.',
        'Obligación legal: conservación de los documentos contables durante diez años conforme al derecho suizo.',
        'Interés legítimo: seguridad del sitio, prevención del fraude, mejora de nuestros servicios.',
        'Consentimiento: medición de audiencia y, en su caso, envío de información comercial.'
      ]},
      { h: 'Plazos de conservación' },
      { ul: [
        'Solicitud de contacto o presupuesto sin continuidad: 12 meses.',
        'Expediente de cliente e historial de intervenciones: 10 años desde la última intervención (obligación contable).',
        'Registros técnicos de conexión: 12 meses.',
        'Prueba del consentimiento sobre cookies: 6 meses.'
      ]},
      { h: 'Transferencias fuera de Suiza y de la UE' },
      { p: 'Los datos se alojan en Suiza o en la Unión Europea. No se realiza ninguna transferencia a un país tercero sin nivel de protección adecuado sin garantías apropiadas (cláusulas contractuales tipo).' },
      { h: 'Reclamación' },
      { p: 'Puede presentar una reclamación ante el Comisionado Federal de Protección de Datos y Transparencia (PFPDT) en Suiza, o ante la autoridad de control de su país de residencia si reside en la Unión Europea.' }
    ],
    it: [
      { p: 'Garage Du Lac ha sede in Svizzera e tratta i dati personali conformemente alla Legge federale sulla protezione dei dati (LPD riveduta) e al Regolamento generale sulla protezione dei dati (GDPR) ove applicabile, in particolare per le persone residenti nell\'Unione europea.' },
      { h: 'Titolare del trattamento' },
      { p: 'Garage Du Lac, Rte Cantonale 98, 1898 Saint-Gingolph, Svizzera. Telefono: +41 24 481 17 34. E-mail: contact@garagedulac.ch.' },
      { h: 'Responsabile tecnico' },
      { p: 'Il sito è edito e ospitato da Wayne-Web (www.wayne-web.com), che agisce in qualità di responsabile del trattamento ai sensi dell\'art. 28 GDPR, su istruzione di Garage Du Lac e nell\'ambito di un accordo sul trattamento dei dati.' },
      { h: 'I vostri diritti' },
      { p: 'In qualsiasi momento disponete dei seguenti diritti sui dati che vi riguardano:' },
      { ul: [
        'Diritto di accesso: ottenere conferma che i vostri dati sono trattati e riceverne copia.',
        'Diritto di rettifica: far correggere dati inesatti o incompleti.',
        'Diritto alla cancellazione: chiedere la soppressione dei vostri dati, fatti salvi gli obblighi legali di conservazione.',
        'Diritto di limitazione: chiedere il blocco temporaneo di un trattamento che contestate.',
        'Diritto di opposizione: opporvi a un trattamento fondato sul nostro legittimo interesse.',
        'Diritto alla portabilità: ricevere i vostri dati in un formato strutturato e leggibile da dispositivo automatico.',
        'Diritto di revocare il consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento effettuato in precedenza.'
      ]},
      { h: 'Esercitare i propri diritti' },
      { p: 'Inviate la vostra richiesta per e-mail a contact@garagedulac.ch o per posta all\'indirizzo dell\'officina. Rispondiamo entro un mese. In caso di ragionevole dubbio sulla vostra identità può esservi richiesto un documento.' },
      { h: 'Basi giuridiche dei trattamenti' },
      { ul: [
        'Esecuzione di un contratto o di misure precontrattuali: gestione di una richiesta di preventivo, appuntamento, esecuzione e fatturazione di un intervento.',
        'Obbligo legale: conservazione dei documenti contabili per dieci anni secondo il diritto svizzero.',
        'Legittimo interesse: sicurezza del sito, prevenzione delle frodi, miglioramento dei nostri servizi.',
        'Consenso: misurazione del pubblico ed eventuale invio di informazioni commerciali.'
      ]},
      { h: 'Periodi di conservazione' },
      { ul: [
        'Richiesta di contatto o preventivo senza seguito: 12 mesi.',
        'Fascicolo cliente e storico degli interventi: 10 anni dall\'ultimo intervento (obbligo contabile).',
        'Registri tecnici di connessione: 12 mesi.',
        'Prova del consenso ai cookie: 6 mesi.'
      ]},
      { h: 'Trasferimenti fuori dalla Svizzera e dall\'UE' },
      { p: 'I dati sono ospitati in Svizzera o nell\'Unione europea. Nessun trasferimento verso un paese terzo privo di un livello di protezione adeguato viene effettuato senza garanzie appropriate (clausole contrattuali tipo).' },
      { h: 'Reclamo' },
      { p: 'Potete presentare reclamo all\'Incaricato federale della protezione dei dati e della trasparenza (IFPDT) in Svizzera, oppure all\'autorità di controllo del vostro paese di residenza se risiedete nell\'Unione europea.' }
    ]
  },

  /* =========================== CONFIDENTIALITÉ ============================ */
  privacy: {
    fr: [
      { p: 'Cette page décrit concrètement quelles données personnelles nous collectons via ce site, pourquoi, et ce que nous en faisons. Elle complète la page RGPD, qui détaille vos droits.' },
      { h: 'Données que vous nous transmettez' },
      { p: 'Lorsque vous remplissez le formulaire de contact ou de demande de rendez-vous, nous collectons :' },
      { ul: [
        'Votre nom et prénom.',
        'Votre numéro de téléphone et votre adresse e-mail.',
        'Les informations relatives à votre véhicule (marque, modèle, année, plaque d\'immatriculation) si vous les renseignez.',
        'La prestation souhaitée, la date envisagée et le contenu libre de votre message.'
      ]},
      { p: 'Ces informations servent exclusivement à vous répondre, établir un devis et planifier l\'intervention. Elles ne sont ni vendues, ni louées, ni cédées à des tiers à des fins commerciales.' },
      { h: 'Données collectées automatiquement' },
      { p: 'Comme tout site web, nos serveurs enregistrent des journaux techniques : adresse IP, date et heure de la requête, page consultée, type de navigateur. Ces journaux servent à la sécurité du site et au diagnostic d\'incidents. Ils sont conservés douze mois puis supprimés.' },
      { h: 'Mesure d\'audience' },
      { p: 'Aucun outil de mesure d\'audience n\'est activé tant que vous n\'avez pas donné votre accord via le bandeau cookies. Si vous acceptez, les statistiques collectées sont agrégées et ne servent qu\'à comprendre quelles pages sont utiles à nos visiteurs.' },
      { h: 'Qui accède à vos données' },
      { ul: [
        'L\'équipe du Garage Du Lac, pour traiter votre demande.',
        'Wayne-Web, éditeur et hébergeur du site, dans le cadre strict de la maintenance technique.',
        'Notre fiduciaire et, le cas échéant, l\'administration fiscale, pour les pièces comptables.',
        'Les autorités judiciaires, uniquement sur réquisition légale.'
      ]},
      { h: 'Sécurité' },
      { p: 'Le site est diffusé en HTTPS. L\'accès à l\'espace d\'administration est protégé par identifiant et mot de passe, et chaque tentative de connexion est journalisée. Les données sont sauvegardées régulièrement.' },
      { h: 'Mineurs' },
      { p: 'Ce site ne s\'adresse pas aux personnes de moins de seize ans et nous ne collectons pas sciemment de données les concernant.' },
      { h: 'Modification de cette politique' },
      { p: 'Nous pouvons faire évoluer cette politique, notamment en cas de modification de nos services ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.' },
      { h: 'Contact' },
      { p: 'Pour toute question relative à vos données : contact@garagedulac.ch ou +41 24 481 17 34.' }
    ],
    en: [
      { p: 'This page describes in practical terms which personal data we collect through this site, why, and what we do with it. It complements the GDPR page, which sets out your rights.' },
      { h: 'Data you provide to us' },
      { p: 'When you fill in the contact or appointment request form, we collect:' },
      { ul: [
        'Your first name and surname.',
        'Your phone number and email address.',
        'Information about your vehicle (make, model, year, number plate) if you provide it.',
        'The service requested, the intended date and the free text of your message.'
      ]},
      { p: 'This information is used solely to reply to you, prepare a quote and schedule the work. It is neither sold, rented nor transferred to third parties for commercial purposes.' },
      { h: 'Data collected automatically' },
      { p: 'Like any website, our servers record technical logs: IP address, date and time of the request, page viewed, browser type. These logs serve site security and incident diagnosis. They are kept for twelve months and then deleted.' },
      { h: 'Audience measurement' },
      { p: 'No audience measurement tool is activated until you have given your consent through the cookie banner. If you accept, the statistics collected are aggregated and only serve to understand which pages are useful to our visitors.' },
      { h: 'Who accesses your data' },
      { ul: [
        'The Garage Du Lac team, to handle your request.',
        'Wayne-Web, publisher and host of the site, strictly within technical maintenance.',
        'Our accountant and, where applicable, the tax authorities, for accounting records.',
        'Judicial authorities, only upon lawful request.'
      ]},
      { h: 'Security' },
      { p: 'The site is served over HTTPS. Access to the administration area is protected by username and password, and every login attempt is logged. Data is backed up regularly.' },
      { h: 'Minors' },
      { p: 'This site is not aimed at people under sixteen and we do not knowingly collect data concerning them.' },
      { h: 'Changes to this policy' },
      { p: 'We may update this policy, in particular if our services or the regulations change. The date of the last update is shown at the top of this page.' },
      { h: 'Contact' },
      { p: 'For any question about your data: contact@garagedulac.ch or +41 24 481 17 34.' }
    ],
    de: [
      { p: 'Diese Seite beschreibt konkret, welche Personendaten wir über diese Website erheben, warum und was wir damit tun. Sie ergänzt die DSGVO-Seite, auf der Ihre Rechte im Detail dargestellt sind.' },
      { h: 'Daten, die Sie uns übermitteln' },
      { p: 'Wenn Sie das Kontakt- oder Terminanfrageformular ausfüllen, erheben wir:' },
      { ul: [
        'Ihren Vor- und Nachnamen.',
        'Ihre Telefonnummer und Ihre E-Mail-Adresse.',
        'Angaben zu Ihrem Fahrzeug (Marke, Modell, Jahr, Kontrollschild), sofern Sie diese angeben.',
        'Die gewünschte Leistung, das vorgesehene Datum und den freien Text Ihrer Nachricht.'
      ]},
      { p: 'Diese Angaben dienen ausschliesslich dazu, Ihnen zu antworten, eine Offerte zu erstellen und die Arbeit zu planen. Sie werden weder verkauft noch vermietet noch zu kommerziellen Zwecken an Dritte weitergegeben.' },
      { h: 'Automatisch erhobene Daten' },
      { p: 'Wie jede Website erfassen unsere Server technische Protokolle: IP-Adresse, Datum und Uhrzeit der Anfrage, aufgerufene Seite, Browsertyp. Diese Protokolle dienen der Sicherheit der Website und der Störungsdiagnose. Sie werden zwölf Monate aufbewahrt und danach gelöscht.' },
      { h: 'Reichweitenmessung' },
      { p: 'Solange Sie über das Cookie-Banner nicht zugestimmt haben, wird kein Messwerkzeug aktiviert. Wenn Sie zustimmen, werden die erhobenen Statistiken aggregiert und dienen ausschliesslich dem Verständnis, welche Seiten für unsere Besucher nützlich sind.' },
      { h: 'Wer auf Ihre Daten zugreift' },
      { ul: [
        'Das Team der Garage Du Lac, zur Bearbeitung Ihrer Anfrage.',
        'Wayne-Web, Herausgeber und Hoster der Website, ausschliesslich im Rahmen der technischen Wartung.',
        'Unser Treuhänder und gegebenenfalls die Steuerverwaltung, für die Buchhaltungsunterlagen.',
        'Justizbehörden, ausschliesslich auf gesetzliche Anordnung.'
      ]},
      { h: 'Sicherheit' },
      { p: 'Die Website wird über HTTPS ausgeliefert. Der Zugang zum Administrationsbereich ist durch Benutzername und Passwort geschützt, und jeder Anmeldeversuch wird protokolliert. Die Daten werden regelmässig gesichert.' },
      { h: 'Minderjährige' },
      { p: 'Diese Website richtet sich nicht an Personen unter sechzehn Jahren, und wir erheben wissentlich keine Daten über sie.' },
      { h: 'Änderung dieser Richtlinie' },
      { p: 'Wir können diese Richtlinie anpassen, insbesondere bei Änderungen unserer Dienstleistungen oder der Vorschriften. Das Datum der letzten Aktualisierung steht oben auf dieser Seite.' },
      { h: 'Kontakt' },
      { p: 'Bei Fragen zu Ihren Daten: contact@garagedulac.ch oder +41 24 481 17 34.' }
    ],
    es: [
      { p: 'Esta página describe de forma concreta qué datos personales recogemos a través de este sitio, por qué y qué hacemos con ellos. Complementa la página RGPD, que detalla sus derechos.' },
      { h: 'Datos que usted nos facilita' },
      { p: 'Cuando rellena el formulario de contacto o de solicitud de cita, recogemos:' },
      { ul: [
        'Su nombre y apellidos.',
        'Su número de teléfono y su dirección de correo electrónico.',
        'La información relativa a su vehículo (marca, modelo, año, matrícula) si la indica.',
        'El servicio deseado, la fecha prevista y el contenido libre de su mensaje.'
      ]},
      { p: 'Esta información se utiliza exclusivamente para responderle, elaborar un presupuesto y planificar la intervención. No se vende, ni se alquila, ni se cede a terceros con fines comerciales.' },
      { h: 'Datos recogidos automáticamente' },
      { p: 'Como todo sitio web, nuestros servidores registran datos técnicos: dirección IP, fecha y hora de la solicitud, página consultada, tipo de navegador. Estos registros sirven para la seguridad del sitio y el diagnóstico de incidencias. Se conservan doce meses y luego se eliminan.' },
      { h: 'Medición de audiencia' },
      { p: 'No se activa ninguna herramienta de medición mientras no haya dado su consentimiento mediante el banner de cookies. Si acepta, las estadísticas recogidas se agregan y solo sirven para entender qué páginas resultan útiles a nuestros visitantes.' },
      { h: 'Quién accede a sus datos' },
      { ul: [
        'El equipo de Garage Du Lac, para tramitar su solicitud.',
        'Wayne-Web, editor y proveedor de alojamiento del sitio, en el marco estricto del mantenimiento técnico.',
        'Nuestra gestoría y, en su caso, la administración tributaria, para los documentos contables.',
        'Las autoridades judiciales, únicamente mediante requerimiento legal.'
      ]},
      { h: 'Seguridad' },
      { p: 'El sitio se sirve mediante HTTPS. El acceso al área de administración está protegido por usuario y contraseña, y cada intento de conexión queda registrado. Los datos se respaldan periódicamente.' },
      { h: 'Menores' },
      { p: 'Este sitio no está dirigido a personas menores de dieciséis años y no recogemos conscientemente datos que les conciernan.' },
      { h: 'Modificación de esta política' },
      { p: 'Podemos modificar esta política, en particular si cambian nuestros servicios o la normativa. La fecha de la última actualización figura en la parte superior de esta página.' },
      { h: 'Contacto' },
      { p: 'Para cualquier cuestión relativa a sus datos: contact@garagedulac.ch o +41 24 481 17 34.' }
    ],
    it: [
      { p: 'Questa pagina descrive concretamente quali dati personali raccogliamo tramite questo sito, perché e cosa ne facciamo. Completa la pagina GDPR, che illustra nel dettaglio i vostri diritti.' },
      { h: 'Dati che ci trasmettete' },
      { p: 'Quando compilate il modulo di contatto o di richiesta di appuntamento, raccogliamo:' },
      { ul: [
        'Il vostro nome e cognome.',
        'Il vostro numero di telefono e il vostro indirizzo e-mail.',
        'Le informazioni relative al vostro veicolo (marca, modello, anno, targa) se le indicate.',
        'Il servizio desiderato, la data prevista e il testo libero del vostro messaggio.'
      ]},
      { p: 'Queste informazioni servono esclusivamente a rispondervi, elaborare un preventivo e pianificare l\'intervento. Non vengono vendute, né noleggiate, né cedute a terzi per finalità commerciali.' },
      { h: 'Dati raccolti automaticamente' },
      { p: 'Come ogni sito web, i nostri server registrano log tecnici: indirizzo IP, data e ora della richiesta, pagina consultata, tipo di browser. Questi log servono alla sicurezza del sito e alla diagnosi degli incidenti. Sono conservati dodici mesi e poi eliminati.' },
      { h: 'Misurazione del pubblico' },
      { p: 'Nessuno strumento di misurazione viene attivato finché non avete dato il vostro consenso tramite il banner dei cookie. Se accettate, le statistiche raccolte sono aggregate e servono unicamente a capire quali pagine sono utili ai nostri visitatori.' },
      { h: 'Chi accede ai vostri dati' },
      { ul: [
        'Il team di Garage Du Lac, per gestire la vostra richiesta.',
        'Wayne-Web, editore e host del sito, nel quadro strettamente limitato della manutenzione tecnica.',
        'Il nostro commercialista e, se del caso, l\'amministrazione fiscale, per i documenti contabili.',
        'Le autorità giudiziarie, unicamente su richiesta legale.'
      ]},
      { h: 'Sicurezza' },
      { p: 'Il sito è distribuito in HTTPS. L\'accesso all\'area di amministrazione è protetto da nome utente e password e ogni tentativo di connessione viene registrato. I dati sono sottoposti a backup regolare.' },
      { h: 'Minori' },
      { p: 'Questo sito non si rivolge a persone di età inferiore a sedici anni e non raccogliamo consapevolmente dati che le riguardano.' },
      { h: 'Modifica della presente politica' },
      { p: 'Possiamo aggiornare questa politica, in particolare in caso di modifica dei nostri servizi o della normativa. La data dell\'ultimo aggiornamento è indicata in cima a questa pagina.' },
      { h: 'Contatto' },
      { p: 'Per qualsiasi domanda relativa ai vostri dati: contact@garagedulac.ch o +41 24 481 17 34.' }
    ]
  },

  /* ================================= CGU ================================== */
  terms: {
    fr: [
      { p: 'Les présentes conditions générales régissent l\'utilisation du site du Garage Du Lac ainsi que les demandes qui y sont formulées. En naviguant sur ce site, vous les acceptez.' },
      { h: 'Objet du site' },
      { p: 'Le site présente les prestations de l\'atelier et permet de formuler une demande de rendez-vous ou de devis. Il ne constitue ni une vente en ligne, ni un système de réservation ferme : toute demande envoyée depuis le site est une prise de contact, et non un rendez-vous confirmé.' },
      { h: 'Confirmation des rendez-vous' },
      { p: 'Un rendez-vous n\'est réputé confirmé qu\'après réponse expresse du garage, par téléphone ou par courriel. Nous nous efforçons de répondre dans les 24 heures ouvrées.' },
      { h: 'Devis et prix' },
      { p: 'Les prix affichés sur le site sont des prix indicatifs de départ, exprimés en francs suisses, taxe sur la valeur ajoutée comprise. Le prix définitif dépend du véhicule, de son état et des pièces nécessaires ; il est confirmé par un devis avant toute intervention. Aucune pièce supplémentaire n\'est posée sans votre accord préalable.' },
      { h: 'Annulation' },
      { p: 'Vous pouvez annuler ou déplacer un rendez-vous sans frais en nous prévenant au moins vingt-quatre heures à l\'avance. Une absence non annoncée peut entraîner la facturation du créneau réservé.' },
      { h: 'Garantie des interventions' },
      { p: 'Nos interventions sont garanties conformément au droit suisse. Lorsque des pièces sont fournies par le client, la garantie porte uniquement sur la main-d\'œuvre, ce qui est mentionné par écrit sur le devis.' },
      { h: 'Véhicules laissés à l\'atelier' },
      { p: 'Les véhicules sont laissés sous la responsabilité de leur propriétaire. Nous vous recommandons de ne laisser aucun objet de valeur à l\'intérieur. Un véhicule non retiré dans les trente jours suivant l\'avis de fin d\'intervention peut donner lieu à des frais de garde.' },
      { h: 'Propriété intellectuelle' },
      { p: 'L\'ensemble des textes, visuels, éléments graphiques et code source de ce site est protégé. Toute reproduction ou représentation, totale ou partielle, sans autorisation écrite préalable du Garage Du Lac ou de Wayne-Web est interdite.' },
      { h: 'Liens et contenus externes' },
      { p: 'Le site peut renvoyer vers des sites tiers (cartographie, avis clients). Nous n\'exerçons aucun contrôle sur leur contenu et déclinons toute responsabilité à leur égard.' },
      { h: 'Disponibilité du site' },
      { p: 'Nous mettons tout en œuvre pour maintenir le site accessible, sans garantie de disponibilité permanente. L\'accès peut être interrompu pour maintenance ou pour toute cause indépendante de notre volonté.' },
      { h: 'Limitation de responsabilité' },
      { p: 'Les informations publiées sur ce site sont fournies à titre indicatif et ne remplacent pas un diagnostic réalisé sur le véhicule. Notre responsabilité ne saurait être engagée sur la base des seules informations du site.' },
      { h: 'Droit applicable et for' },
      { p: 'Les présentes conditions sont soumises au droit suisse. Le for judiciaire est à Monthey (canton du Valais), sous réserve des dispositions impératives protégeant les consommateurs.' }
    ],
    en: [
      { p: 'These terms govern the use of the Garage Du Lac website and the requests submitted through it. By browsing this site, you accept them.' },
      { h: 'Purpose of the site' },
      { p: 'The site presents the workshop\'s services and allows an appointment or quote request to be submitted. It constitutes neither an online sale nor a firm booking system: any request sent from the site is an enquiry, not a confirmed appointment.' },
      { h: 'Appointment confirmation' },
      { p: 'An appointment is only deemed confirmed after an express reply from the garage, by phone or email. We aim to reply within 24 working hours.' },
      { h: 'Quotes and prices' },
      { p: 'Prices shown on the site are indicative starting prices in Swiss francs, value added tax included. The final price depends on the vehicle, its condition and the parts required; it is confirmed by a quote before any work. No additional part is fitted without your prior approval.' },
      { h: 'Cancellation' },
      { p: 'You may cancel or reschedule an appointment free of charge by informing us at least twenty-four hours in advance. An unannounced no-show may result in the reserved slot being invoiced.' },
      { h: 'Warranty on work' },
      { p: 'Our work is guaranteed in accordance with Swiss law. Where parts are supplied by the customer, the warranty covers labour only, which is stated in writing on the quote.' },
      { h: 'Vehicles left at the workshop' },
      { p: 'Vehicles are left under the responsibility of their owner. We recommend that no valuables be left inside. A vehicle not collected within thirty days of the completion notice may incur storage charges.' },
      { h: 'Intellectual property' },
      { p: 'All texts, visuals, graphic elements and source code of this site are protected. Any reproduction or representation, in whole or in part, without prior written authorisation from Garage Du Lac or Wayne-Web is prohibited.' },
      { h: 'Links and external content' },
      { p: 'The site may link to third-party sites (mapping, customer reviews). We exercise no control over their content and accept no liability in this respect.' },
      { h: 'Site availability' },
      { p: 'We make every effort to keep the site accessible, without any guarantee of permanent availability. Access may be interrupted for maintenance or for any cause beyond our control.' },
      { h: 'Limitation of liability' },
      { p: 'The information published on this site is provided for guidance and does not replace a diagnosis carried out on the vehicle. Our liability cannot be engaged on the basis of the site\'s information alone.' },
      { h: 'Applicable law and jurisdiction' },
      { p: 'These terms are governed by Swiss law. The place of jurisdiction is Monthey (canton of Valais), subject to mandatory consumer protection provisions.' }
    ],
    de: [
      { p: 'Die vorliegenden Bedingungen regeln die Nutzung der Website der Garage Du Lac sowie die darüber gestellten Anfragen. Mit dem Besuch dieser Website akzeptieren Sie sie.' },
      { h: 'Zweck der Website' },
      { p: 'Die Website stellt die Leistungen der Werkstatt vor und ermöglicht das Stellen einer Termin- oder Offertanfrage. Sie stellt weder einen Online-Verkauf noch ein verbindliches Buchungssystem dar: Jede über die Website gesendete Anfrage ist eine Kontaktaufnahme und kein bestätigter Termin.' },
      { h: 'Bestätigung von Terminen' },
      { p: 'Ein Termin gilt erst nach ausdrücklicher Rückmeldung der Werkstatt per Telefon oder E-Mail als bestätigt. Wir sind bemüht, innert 24 Arbeitsstunden zu antworten.' },
      { h: 'Offerten und Preise' },
      { p: 'Die auf der Website angezeigten Preise sind indikative Einstiegspreise in Schweizer Franken, inklusive Mehrwertsteuer. Der Endpreis hängt vom Fahrzeug, seinem Zustand und den benötigten Teilen ab; er wird vor jeder Arbeit mit einer Offerte bestätigt. Kein zusätzliches Teil wird ohne Ihre vorherige Zustimmung eingebaut.' },
      { h: 'Annullierung' },
      { p: 'Sie können einen Termin kostenlos annullieren oder verschieben, wenn Sie uns mindestens vierundzwanzig Stunden im Voraus informieren. Ein unangekündigtes Fernbleiben kann zur Verrechnung des reservierten Termins führen.' },
      { h: 'Garantie auf Arbeiten' },
      { p: 'Unsere Arbeiten sind gemäss Schweizer Recht garantiert. Werden Teile vom Kunden geliefert, deckt die Garantie ausschliesslich die Arbeit ab, was auf der Offerte schriftlich festgehalten wird.' },
      { h: 'In der Werkstatt abgestellte Fahrzeuge' },
      { p: 'Die Fahrzeuge verbleiben in der Verantwortung ihrer Halter. Wir empfehlen, keine Wertgegenstände im Fahrzeug zu lassen. Ein Fahrzeug, das nicht innert dreissig Tagen nach der Fertigstellungsmeldung abgeholt wird, kann Standgebühren nach sich ziehen.' },
      { h: 'Geistiges Eigentum' },
      { p: 'Sämtliche Texte, Bilder, grafischen Elemente und der Quellcode dieser Website sind geschützt. Jede vollständige oder teilweise Vervielfältigung oder Wiedergabe ohne vorgängige schriftliche Zustimmung der Garage Du Lac oder von Wayne-Web ist untersagt.' },
      { h: 'Links und externe Inhalte' },
      { p: 'Die Website kann auf Websites Dritter verweisen (Kartendienste, Kundenbewertungen). Wir haben keine Kontrolle über deren Inhalte und lehnen diesbezüglich jede Haftung ab.' },
      { h: 'Verfügbarkeit der Website' },
      { p: 'Wir setzen alles daran, die Website zugänglich zu halten, ohne eine dauerhafte Verfügbarkeit zu garantieren. Der Zugang kann für Wartungsarbeiten oder aus von uns nicht zu vertretenden Gründen unterbrochen werden.' },
      { h: 'Haftungsbeschränkung' },
      { p: 'Die auf dieser Website veröffentlichten Informationen dienen der Orientierung und ersetzen keine am Fahrzeug durchgeführte Diagnose. Unsere Haftung kann nicht allein aufgrund der Angaben auf der Website begründet werden.' },
      { h: 'Anwendbares Recht und Gerichtsstand' },
      { p: 'Diese Bedingungen unterstehen Schweizer Recht. Gerichtsstand ist Monthey (Kanton Wallis), unter Vorbehalt zwingender Konsumentenschutzbestimmungen.' }
    ],
    es: [
      { p: 'Las presentes condiciones generales regulan el uso del sitio de Garage Du Lac así como las solicitudes formuladas a través de él. Al navegar por este sitio, usted las acepta.' },
      { h: 'Objeto del sitio' },
      { p: 'El sitio presenta los servicios del taller y permite formular una solicitud de cita o de presupuesto. No constituye ni una venta en línea ni un sistema de reserva en firme: toda solicitud enviada desde el sitio es una toma de contacto, no una cita confirmada.' },
      { h: 'Confirmación de las citas' },
      { p: 'Una cita solo se considera confirmada tras una respuesta expresa del taller, por teléfono o por correo electrónico. Procuramos responder en 24 horas laborables.' },
      { h: 'Presupuestos y precios' },
      { p: 'Los precios mostrados en el sitio son precios indicativos de partida, expresados en francos suizos, con el impuesto sobre el valor añadido incluido. El precio definitivo depende del vehículo, de su estado y de las piezas necesarias; se confirma mediante presupuesto antes de cualquier intervención. No se monta ninguna pieza adicional sin su acuerdo previo.' },
      { h: 'Anulación' },
      { p: 'Puede anular o desplazar una cita sin gastos avisándonos con al menos veinticuatro horas de antelación. Una ausencia no anunciada puede dar lugar a la facturación del hueco reservado.' },
      { h: 'Garantía de las intervenciones' },
      { p: 'Nuestras intervenciones están garantizadas conforme al derecho suizo. Cuando las piezas las aporta el cliente, la garantía cubre únicamente la mano de obra, lo que se indica por escrito en el presupuesto.' },
      { h: 'Vehículos dejados en el taller' },
      { p: 'Los vehículos se dejan bajo la responsabilidad de su propietario. Le recomendamos no dejar objetos de valor en su interior. Un vehículo no retirado en los treinta días siguientes al aviso de finalización puede dar lugar a gastos de custodia.' },
      { h: 'Propiedad intelectual' },
      { p: 'El conjunto de textos, imágenes, elementos gráficos y código fuente de este sitio está protegido. Queda prohibida toda reproducción o representación, total o parcial, sin autorización escrita previa de Garage Du Lac o de Wayne-Web.' },
      { h: 'Enlaces y contenidos externos' },
      { p: 'El sitio puede remitir a sitios de terceros (cartografía, opiniones de clientes). No ejercemos ningún control sobre su contenido y declinamos toda responsabilidad al respecto.' },
      { h: 'Disponibilidad del sitio' },
      { p: 'Hacemos todo lo posible por mantener el sitio accesible, sin garantía de disponibilidad permanente. El acceso puede interrumpirse por mantenimiento o por cualquier causa ajena a nuestra voluntad.' },
      { h: 'Limitación de responsabilidad' },
      { p: 'La información publicada en este sitio se facilita a título orientativo y no sustituye a un diagnóstico realizado sobre el vehículo. No cabe exigir nuestra responsabilidad basándose únicamente en la información del sitio.' },
      { h: 'Derecho aplicable y fuero' },
      { p: 'Las presentes condiciones se someten al derecho suizo. El fuero judicial es Monthey (cantón del Valais), sin perjuicio de las disposiciones imperativas de protección de los consumidores.' }
    ],
    it: [
      { p: 'Le presenti condizioni generali disciplinano l\'uso del sito di Garage Du Lac nonché le richieste formulate tramite esso. Navigando su questo sito, le accettate.' },
      { h: 'Oggetto del sito' },
      { p: 'Il sito presenta i servizi dell\'officina e consente di formulare una richiesta di appuntamento o di preventivo. Non costituisce né una vendita online né un sistema di prenotazione vincolante: ogni richiesta inviata dal sito è una presa di contatto, non un appuntamento confermato.' },
      { h: 'Conferma degli appuntamenti' },
      { p: 'Un appuntamento si considera confermato solo dopo una risposta esplicita dell\'officina, per telefono o e-mail. Ci impegniamo a rispondere entro 24 ore lavorative.' },
      { h: 'Preventivi e prezzi' },
      { p: 'I prezzi indicati sul sito sono prezzi di partenza indicativi, espressi in franchi svizzeri, imposta sul valore aggiunto inclusa. Il prezzo definitivo dipende dal veicolo, dal suo stato e dai ricambi necessari; viene confermato con un preventivo prima di ogni intervento. Nessun ricambio aggiuntivo viene montato senza il vostro previo accordo.' },
      { h: 'Annullamento' },
      { p: 'Potete annullare o spostare un appuntamento senza spese avvisandoci con almeno ventiquattro ore di anticipo. Un\'assenza non annunciata può comportare la fatturazione dello slot riservato.' },
      { h: 'Garanzia degli interventi' },
      { p: 'I nostri interventi sono garantiti conformemente al diritto svizzero. Quando i ricambi sono forniti dal cliente, la garanzia copre unicamente la manodopera, come indicato per iscritto sul preventivo.' },
      { h: 'Veicoli lasciati in officina' },
      { p: 'I veicoli restano sotto la responsabilità del proprietario. Vi raccomandiamo di non lasciare oggetti di valore all\'interno. Un veicolo non ritirato entro trenta giorni dall\'avviso di fine intervento può comportare spese di custodia.' },
      { h: 'Proprietà intellettuale' },
      { p: 'L\'insieme dei testi, delle immagini, degli elementi grafici e del codice sorgente di questo sito è protetto. È vietata qualsiasi riproduzione o rappresentazione, totale o parziale, senza previa autorizzazione scritta di Garage Du Lac o di Wayne-Web.' },
      { h: 'Link e contenuti esterni' },
      { p: 'Il sito può rinviare a siti di terzi (cartografia, recensioni dei clienti). Non esercitiamo alcun controllo sui loro contenuti e decliniamo ogni responsabilità al riguardo.' },
      { h: 'Disponibilità del sito' },
      { p: 'Facciamo il possibile per mantenere il sito accessibile, senza garanzia di disponibilità permanente. L\'accesso può essere interrotto per manutenzione o per qualsiasi causa indipendente dalla nostra volontà.' },
      { h: 'Limitazione di responsabilità' },
      { p: 'Le informazioni pubblicate su questo sito sono fornite a titolo indicativo e non sostituiscono una diagnosi effettuata sul veicolo. La nostra responsabilità non può essere invocata sulla sola base delle informazioni del sito.' },
      { h: 'Diritto applicabile e foro' },
      { p: 'Le presenti condizioni sono soggette al diritto svizzero. Il foro giudiziario è Monthey (Canton Vallese), fatte salve le disposizioni imperative a tutela dei consumatori.' }
    ]
  }

  };

  /* ------------------------------------------------------------- Rendu --- */
  function render() {
    var G = window.GDL, C = window.GDL_Catalog;
    var doc = document.body.getAttribute('data-legal');
    var blocks = (L[doc] || {})[G.getLang()] || (L[doc] || {}).fr || [];

    var html = blocks.map(function (b) {
      if (b.h)  return '<h2>' + C.esc(b.h) + '</h2>';
      if (b.ul) return '<ul>' + b.ul.map(function (li) { return '<li>' + C.esc(li) + '</li>'; }).join('') + '</ul>';
      return '<p>' + C.esc(b.p) + '</p>';
    }).join('');

    /* Mentions éditeur / hébergeur — obligatoires sur les 4 pages */
    html += '<div class="card">' +
      '<h3 style="margin-top:0">' + G.t('legal.editorT') + '</h3>' +
      '<p>' + G.t('legal.editorTxt') + '</p>' +
      '<h3>' + G.t('legal.hostT') + '</h3>' +
      '<p>' + G.t('legal.hostTxt') + '</p>' +
      '<p style="margin-bottom:0">' + C.esc(G.t('legal.contactUs')) + '</p>' +
    '</div>';

    document.getElementById('legalBody').innerHTML = html;

    var locale = { fr: 'fr-CH', en: 'en-GB', de: 'de-CH', es: 'es-ES', it: 'it-CH' }[G.getLang()] || 'fr-CH';
    document.getElementById('updatedAt').textContent =
      new Date('2026-08-12').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

    C.paintInlineIcons();
    G.initReveal();
  }

  document.addEventListener('DOMContentLoaded', render);
  document.addEventListener('gdl:lang', render);
})();
