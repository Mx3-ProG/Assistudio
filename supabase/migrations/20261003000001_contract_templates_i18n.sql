-- =============================================================================
-- Contract templates in every supported language.
--
-- 1. Project brief (`brief`): the brief is the questionnaire itself, now fully
--    translated in the app (src/i18n/dictionaries/contracts.*.ts). Its template
--    row only versions it, so de/es/pt/it/nl/ar are published: clients from every
--    country can fill in, review and download their brief.
--
-- 2. Contractual terms (`quote_terms`): translations of the reviewed EN/FR
--    clauses are stored on the existing DRAFT rows. They stay DRAFT on purpose:
--    a quote can only be locked once a lawyer has reviewed the text and staff
--    publish it explicitly, e.g.
--
--      update public.contract_templates
--         set status = 'published', published_at = now()
--       where kind = 'quote_terms' and locale = 'de' and version = 1;
--
--    (French law governs the agreement, as in the EN/FR versions.)
-- =============================================================================

update public.contract_templates t
   set status = 'published', published_at = coalesce(t.published_at, now()), title = v.title, body = '{"sections":12}'::jsonb
  from (values
    ('de', 'Studio ATS-Lastenheft'),
    ('es', 'Pliego de requisitos Studio ATS'),
    ('pt', 'Caderno de encargos Studio ATS'),
    ('it', 'Capitolato Studio ATS'),
    ('nl', 'Studio ATS-projectbrief'),
    ('ar', 'كراسة متطلبات Studio ATS')
  ) as v(locale, title)
 where t.kind = 'brief' and t.locale = v.locale and t.version = 1 and t.status = 'draft'
   and not exists (select 1 from public.contract_templates p where p.kind = 'brief' and p.locale = v.locale and p.status = 'published');

update public.contract_templates t
   set title = v.title,
       body = jsonb_build_object('needs_legal_review', true, 'translated_from', 'en', 'clauses', v.clauses::jsonb)
  from (values
  ('de', 'Vertragsbedingungen Studio ATS', $json$[
    "Geltungsbereich — Diese Bedingungen gelten ausschließlich für die ausdrücklich gewählten Leistungen in den Bereichen Konzeption, Design, Entwicklung, Integration, Automatisierung, Hosting, Wartung und Begleitung.",
    "Vertragsschluss — Das Angebot, seine Bedingungen und das gesperrte Lastenheft bilden die Vereinbarung. Die Bestellung wird verbindlich, sobald beide Parteien elektronisch zugestimmt haben und Stripe die erste Zahlung bestätigt.",
    "Pflichten des Kunden — Der Kunde definiert seinen Bedarf, genehmigt das Lastenheft und stellt die erforderlichen Inhalte, Zugänge und Informationen fristgerecht bereit; er sichert zu, über die Rechte an den bereitgestellten Materialien zu verfügen.",
    "Pflichten von Studio ATS — Studio ATS erbringt die vereinbarten Leistungen im Rahmen einer Bemühungspflicht und informiert den Kunden über den Fortschritt.",
    "Preis und Umfang — Preis und Abrechnungsintervall entsprechen dem in diesem Angebot erfassten aktiven Angebot. Leistungen außerhalb des Umfangs erfordern eine schriftliche Vereinbarung und gegebenenfalls ein zusätzliches Angebot.",
    "Zahlung — Die Zahlung erfolgt über den mit diesem Dossier verknüpften Stripe-Link. Ratenzahlungen, Anzahlungen und Bindungsrabatte, die nicht in diesem Angebot aufgeführt sind, gelten nicht.",
    "Änderung oder Unterbrechung — Bereits erbrachte, zugesagte oder bei Dritten bestellte Leistungen bleiben entsprechend dem Fortschritt geschuldet, wenn der Kunde eine Änderung oder Unterbrechung verlangt.",
    "Geistiges Eigentum — Studio ATS behält seine Methoden, sein Know-how, generische Komponenten und vorbestehende Werkzeuge. Ausdrücklich übertragene Rechte an spezifischen Liefergegenständen werden nach vollständiger Zahlung wirksam.",
    "Leistungen Dritter — Lizenzen, APIs, Domainnamen und externe Dienste, die nicht ausdrücklich enthalten sind, können gesondert berechnet werden und unterliegen den Bedingungen ihrer Anbieter.",
    "Abnahme und Lieferung — Der Kunde prüft Entwürfe, Prototypen und Abnahmeversionen und übermittelt Korrekturwünsche innerhalb der vereinbarten Fristen. Eine schriftliche Freigabe gilt als Annahme der betreffenden Elemente.",
    "Wartung — Die enthaltene Wartung beschränkt sich auf den Umfang des gesperrten Angebots. Erweiterungen und neue Funktionen können eine zusätzliche Leistung erfordern.",
    "Haftung — Der Kunde bleibt verantwortlich für seine Inhalte, die Nutzung des Dienstes und Änderungen, die er selbst oder Dritte außerhalb des Umfangs von Studio ATS vornehmen.",
    "Reklamationen — Reklamationen sind schriftlich und so detailliert einzureichen, dass sie geprüft und bearbeitet werden können.",
    "Vertraulichkeit und Referenzen — Jede Partei schützt die erhaltenen vertraulichen Informationen. Jede Nutzung als Referenz berücksichtigt einen schriftlichen Widerspruch des Kunden.",
    "Personenbezogene Daten — Jede Partei hält das anwendbare Datenschutzrecht ein. Handelt Studio ATS als Auftragsverarbeiter, werden die erforderlichen Pflichten gesondert dokumentiert.",
    "Kündigung, Abtretung und anwendbares Recht — Die Folgen einer Kündigung berücksichtigen die erbrachten Leistungen und die geschuldeten Beträge. Eine Abtretung bedarf der vorherigen schriftlichen Zustimmung, sofern gesetzlich nichts anderes bestimmt ist. Die Vereinbarung unterliegt französischem Recht."
  ]$json$),
  ('es', 'Condiciones contractuales Studio ATS', $json$[
    "Ámbito — Estas condiciones cubren únicamente los servicios de concepción, diseño, desarrollo, integración, automatización, alojamiento, mantenimiento y acompañamiento seleccionados expresamente.",
    "Formación del contrato — El presupuesto, sus condiciones y el pliego de requisitos bloqueado constituyen el acuerdo. El pedido es firme tras la doble aceptación electrónica y la confirmación del primer pago por Stripe.",
    "Obligaciones del Cliente — El Cliente define sus necesidades, aprueba el pliego y aporta a tiempo los contenidos, accesos e información necesarios, y garantiza que dispone de los derechos sobre los materiales aportados.",
    "Obligaciones de Studio ATS — Studio ATS presta los servicios acordados con una obligación de medios e informa al Cliente de su avance.",
    "Precio y alcance — El precio y la periodicidad son los de la oferta activa recogida en este presupuesto. Cualquier trabajo fuera del alcance requiere un acuerdo por escrito y, en su caso, un presupuesto adicional.",
    "Pago — El pago se realiza mediante el enlace de Stripe vinculado a este expediente. Los pagos fraccionados, anticipos y descuentos por compromiso no reproducidos en este presupuesto no son aplicables.",
    "Modificación o interrupción — Los trabajos ya realizados, comprometidos o encargados a terceros siguen siendo exigibles según su avance cuando el Cliente solicita una modificación o interrupción.",
    "Propiedad intelectual — Studio ATS conserva sus métodos, su saber hacer, sus componentes genéricos y sus herramientas preexistentes. Los derechos cedidos expresamente sobre entregables específicos surten efecto tras el pago completo.",
    "Servicios de terceros — Las licencias, API, nombres de dominio y servicios externos no incluidos expresamente pueden facturarse por separado y quedan sujetos a las condiciones de sus proveedores.",
    "Validación y entrega — El Cliente revisa los diseños, prototipos y versiones de aceptación y formula sus solicitudes de corrección en los plazos acordados. Toda aprobación por escrito supone la aceptación de los elementos correspondientes.",
    "Mantenimiento — El mantenimiento incluido se limita al alcance de la oferta bloqueada. Las mejoras y nuevas funcionalidades pueden requerir un servicio adicional.",
    "Responsabilidad — El Cliente sigue siendo responsable de sus contenidos, del uso del servicio y de los cambios realizados por él mismo o por terceros fuera del alcance de Studio ATS.",
    "Reclamaciones — Las reclamaciones deben formularse por escrito, con detalle suficiente para permitir su análisis y resolución.",
    "Confidencialidad y referencias — Cada parte protege la información confidencial recibida. Cualquier uso como referencia comercial respeta la oposición escrita del Cliente.",
    "Datos personales — Cada parte cumple la normativa de protección de datos aplicable. Cuando Studio ATS actúa como encargado del tratamiento, las obligaciones necesarias se documentan por separado.",
    "Resolución, cesión y ley aplicable — Las consecuencias de una resolución tienen en cuenta los servicios prestados y las cantidades adeudadas. La cesión requiere consentimiento previo por escrito, salvo disposición legal en contrario. El acuerdo se rige por el derecho francés."
  ]$json$),
  ('pt', 'Condições contratuais Studio ATS', $json$[
    "Âmbito — Estas condições abrangem apenas os serviços de conceção, design, desenvolvimento, integração, automação, alojamento, manutenção e acompanhamento expressamente selecionados.",
    "Formação do contrato — O orçamento, as suas condições e o caderno de encargos bloqueado constituem o acordo. A encomenda torna-se firme após a dupla aceitação eletrónica e a confirmação do primeiro pagamento pela Stripe.",
    "Obrigações do Cliente — O Cliente define as suas necessidades, aprova o caderno de encargos e fornece atempadamente os conteúdos, acessos e informações necessários, garantindo deter os direitos sobre os materiais fornecidos.",
    "Obrigações da Studio ATS — A Studio ATS presta os serviços acordados ao abrigo de uma obrigação de meios e informa o Cliente do seu andamento.",
    "Preço e âmbito — O preço e a periodicidade são os da oferta ativa registada neste orçamento. Trabalhos fora do âmbito exigem acordo escrito e, se for caso disso, um orçamento adicional.",
    "Pagamento — O pagamento é feito através do link Stripe associado a este processo. Prestações, sinais e descontos de fidelização não reproduzidos neste orçamento não se aplicam.",
    "Alteração ou interrupção — Os trabalhos já realizados, assumidos ou encomendados a terceiros continuam devidos de acordo com o seu andamento quando o Cliente pede uma alteração ou interrupção.",
    "Propriedade intelectual — A Studio ATS mantém os seus métodos, saber-fazer, componentes genéricos e ferramentas preexistentes. Os direitos expressamente cedidos sobre entregáveis específicos produzem efeitos após o pagamento integral.",
    "Serviços de terceiros — Licenças, API, nomes de domínio e serviços externos não expressamente incluídos podem ser faturados à parte e ficam sujeitos às condições dos respetivos fornecedores.",
    "Validação e entrega — O Cliente analisa os designs, protótipos e versões de aceitação e apresenta os pedidos de correção nos prazos acordados. Uma aprovação escrita vale como aceitação dos elementos em causa.",
    "Manutenção — A manutenção incluída limita-se ao âmbito da oferta bloqueada. Melhorias e novas funcionalidades podem exigir um serviço adicional.",
    "Responsabilidade — O Cliente continua responsável pelos seus conteúdos, pela utilização do serviço e pelas alterações feitas por si ou por terceiros fora do âmbito da Studio ATS.",
    "Reclamações — As reclamações devem ser feitas por escrito, com detalhe suficiente para permitir a sua análise e resolução.",
    "Confidencialidade e referências — Cada parte protege as informações confidenciais recebidas. Qualquer utilização como referência comercial respeita a oposição escrita do Cliente.",
    "Dados pessoais — Cada parte cumpre a legislação de proteção de dados aplicável. Quando a Studio ATS atua como subcontratante, as obrigações necessárias são documentadas separadamente.",
    "Resolução, cessão e lei aplicável — As consequências de uma resolução têm em conta os serviços prestados e os montantes devidos. A cessão exige consentimento prévio por escrito, salvo disposição legal em contrário. O acordo rege-se pela lei francesa."
  ]$json$),
  ('it', 'Condizioni contrattuali Studio ATS', $json$[
    "Ambito — Le presenti condizioni coprono esclusivamente i servizi di ideazione, design, sviluppo, integrazione, automazione, hosting, manutenzione e accompagnamento espressamente selezionati.",
    "Formazione del contratto — Il preventivo, le sue condizioni e il capitolato bloccato costituiscono l’accordo. L’ordine diventa vincolante dopo la doppia accettazione elettronica e la conferma del primo pagamento da parte di Stripe.",
    "Obblighi del Cliente — Il Cliente definisce le proprie esigenze, approva il capitolato e fornisce nei tempi concordati i contenuti, gli accessi e le informazioni necessari, garantendo di disporre dei diritti sui materiali forniti.",
    "Obblighi di Studio ATS — Studio ATS esegue i servizi concordati secondo un’obbligazione di mezzi e informa il Cliente sull’avanzamento.",
    "Prezzo e ambito — Il prezzo e la periodicità sono quelli dell’offerta attiva registrata nel presente preventivo. Le attività fuori ambito richiedono un accordo scritto e, se del caso, un preventivo aggiuntivo.",
    "Pagamento — Il pagamento avviene tramite il link Stripe collegato a questo fascicolo. Rateizzazioni, acconti e sconti di impegno non riportati nel presente preventivo non si applicano.",
    "Modifica o interruzione — Le attività già svolte, impegnate o ordinate a terzi restano dovute in base all’avanzamento quando il Cliente richiede una modifica o un’interruzione.",
    "Proprietà intellettuale — Studio ATS conserva i propri metodi, know-how, componenti generici e strumenti preesistenti. I diritti espressamente ceduti su consegne specifiche hanno effetto dopo il pagamento integrale.",
    "Servizi di terzi — Licenze, API, nomi di dominio e servizi esterni non espressamente inclusi possono essere fatturati separatamente e restano soggetti alle condizioni dei rispettivi fornitori.",
    "Approvazione e consegna — Il Cliente esamina design, prototipi e versioni di collaudo e trasmette le richieste di correzione entro i termini concordati. L’approvazione scritta vale come accettazione degli elementi interessati.",
    "Manutenzione — La manutenzione inclusa è limitata all’ambito dell’offerta bloccata. Evoluzioni e nuove funzionalità possono richiedere un servizio aggiuntivo.",
    "Responsabilità — Il Cliente resta responsabile dei propri contenuti, dell’uso del servizio e delle modifiche apportate da sé o da terzi al di fuori dell’ambito di Studio ATS.",
    "Reclami — I reclami devono essere presentati per iscritto, con dettagli sufficienti a consentirne l’analisi e la risoluzione.",
    "Riservatezza e referenze — Ciascuna parte tutela le informazioni riservate ricevute. Qualsiasi uso come referenza commerciale rispetta l’opposizione scritta del Cliente.",
    "Dati personali — Ciascuna parte rispetta la normativa applicabile in materia di protezione dei dati. Quando Studio ATS agisce come responsabile del trattamento, gli obblighi necessari sono documentati separatamente.",
    "Risoluzione, cessione e legge applicabile — Le conseguenze di una risoluzione tengono conto dei servizi eseguiti e degli importi dovuti. La cessione richiede il previo consenso scritto, salvo diversa disposizione di legge. L’accordo è regolato dalla legge francese."
  ]$json$),
  ('nl', 'Contractvoorwaarden Studio ATS', $json$[
    "Toepassingsgebied — Deze voorwaarden gelden uitsluitend voor de uitdrukkelijk gekozen diensten op het gebied van concept, ontwerp, ontwikkeling, integratie, automatisering, hosting, onderhoud en begeleiding.",
    "Totstandkoming — De offerte, de voorwaarden ervan en de vergrendelde projectbrief vormen de overeenkomst. De bestelling wordt bindend na elektronisch akkoord van beide partijen en zodra Stripe de eerste betaling bevestigt.",
    "Verplichtingen van de Klant — De Klant bepaalt zijn behoeften, keurt de brief goed en levert tijdig de benodigde inhoud, toegang en informatie aan, en staat ervoor in dat hij over de rechten op de aangeleverde materialen beschikt.",
    "Verplichtingen van Studio ATS — Studio ATS voert de overeengekomen diensten uit op basis van een inspanningsverplichting en houdt de Klant op de hoogte van de voortgang.",
    "Prijs en scope — Prijs en factuurperiode zijn die van het actieve aanbod dat in deze offerte is vastgelegd. Werk buiten de scope vereist schriftelijke overeenstemming en zo nodig een aanvullende offerte.",
    "Betaling — De betaling verloopt via de Stripe-link die aan dit dossier is gekoppeld. Termijnbetalingen, voorschotten en kortingen voor verbintenissen die niet in deze offerte zijn opgenomen, zijn niet van toepassing.",
    "Wijziging of onderbreking — Reeds uitgevoerd, toegezegd of bij derden besteld werk blijft naar rato van de voortgang verschuldigd wanneer de Klant om een wijziging of onderbreking vraagt.",
    "Intellectueel eigendom — Studio ATS behoudt haar methoden, knowhow, generieke componenten en reeds bestaande tools. Uitdrukkelijk overgedragen rechten op specifieke opleveringen gaan in na volledige betaling.",
    "Diensten van derden — Licenties, API's, domeinnamen en externe diensten die niet uitdrukkelijk zijn inbegrepen, kunnen apart worden gefactureerd en blijven onderworpen aan de voorwaarden van hun aanbieders.",
    "Goedkeuring en oplevering — De Klant beoordeelt ontwerpen, prototypes en acceptatieversies en dient correctieverzoeken in binnen de afgesproken termijnen. Schriftelijke goedkeuring geldt als aanvaarding van de betreffende onderdelen.",
    "Onderhoud — Het inbegrepen onderhoud is beperkt tot de scope van het vergrendelde aanbod. Verbeteringen en nieuwe functies kunnen een aanvullende dienst vereisen.",
    "Aansprakelijkheid — De Klant blijft verantwoordelijk voor zijn inhoud, het gebruik van de dienst en wijzigingen die hij zelf of derden buiten de scope van Studio ATS aanbrengen.",
    "Klachten — Klachten moeten schriftelijk worden ingediend, met voldoende details om ze te onderzoeken en op te lossen.",
    "Vertrouwelijkheid en referenties — Elke partij beschermt de ontvangen vertrouwelijke informatie. Elk gebruik als referentie respecteert een schriftelijk bezwaar van de Klant.",
    "Persoonsgegevens — Elke partij leeft de toepasselijke wetgeving inzake gegevensbescherming na. Wanneer Studio ATS optreedt als verwerker, worden de vereiste verplichtingen afzonderlijk vastgelegd.",
    "Beëindiging, overdracht en toepasselijk recht — De gevolgen van een beëindiging houden rekening met de geleverde diensten en de verschuldigde bedragen. Overdracht vereist voorafgaande schriftelijke toestemming, tenzij de wet anders bepaalt. Op de overeenkomst is Frans recht van toepassing."
  ]$json$),
  ('ar', 'الشروط التعاقدية لـ Studio ATS', $json$[
    "النطاق — تشمل هذه الشروط فقط خدمات التصور والتصميم والتطوير والتكامل والأتمتة والاستضافة والصيانة والمرافقة التي تم اختيارها صراحةً.",
    "انعقاد العقد — يشكّل عرض السعر وشروطه وكراسة المتطلبات المقفلة الاتفاق. يصبح الطلب ملزمًا بعد الموافقة الإلكترونية من الطرفين وتأكيد Stripe للدفعة الأولى.",
    "التزامات العميل — يحدد العميل احتياجاته، ويعتمد كراسة المتطلبات، ويقدّم في الوقت المحدد المحتوى والصلاحيات والمعلومات اللازمة، ويضمن امتلاكه الحقوق على المواد المقدَّمة.",
    "التزامات Studio ATS — تنفذ Studio ATS الخدمات المتفق عليها في إطار التزام ببذل العناية، وتُطلع العميل على سير العمل.",
    "السعر والنطاق — السعر ودورية الفوترة هما ما ورد في العرض النشط المسجّل في عرض السعر هذا. أي عمل خارج النطاق يتطلب اتفاقًا مكتوبًا، وعند الاقتضاء عرض سعر إضافيًا.",
    "الدفع — يتم الدفع عبر رابط Stripe المرتبط بهذا الملف. لا تنطبق الأقساط أو الدفعات المقدمة أو خصومات الالتزام غير الواردة في عرض السعر هذا.",
    "التعديل أو التوقف — تظل الأعمال المنجزة أو الملتزم بها أو المطلوبة من أطراف ثالثة مستحقة الدفع بحسب تقدمها عندما يطلب العميل تعديلًا أو توقفًا.",
    "الملكية الفكرية — تحتفظ Studio ATS بأساليبها وخبراتها ومكوناتها العامة وأدواتها السابقة. تسري الحقوق المتنازل عنها صراحةً على المخرجات الخاصة بعد السداد الكامل.",
    "خدمات الأطراف الثالثة — يجوز فوترة التراخيص وواجهات API وأسماء النطاقات والخدمات الخارجية غير المشمولة صراحةً بشكل منفصل، وتبقى خاضعة لشروط مزوديها.",
    "الاعتماد والتسليم — يراجع العميل التصاميم والنماذج الأولية ونسخ الاختبار ويقدّم طلبات التصحيح خلال المهل المتفق عليها. تُعدّ الموافقة المكتوبة قبولًا للعناصر المعنية.",
    "الصيانة — تقتصر الصيانة المشمولة على نطاق العرض المقفل. قد تتطلب التحسينات والوظائف الجديدة خدمة إضافية.",
    "المسؤولية — يبقى العميل مسؤولًا عن محتواه واستخدامه للخدمة والتعديلات التي يجريها هو أو أطراف ثالثة خارج نطاق Studio ATS.",
    "الشكاوى — يجب تقديم الشكاوى كتابيًا وبتفاصيل كافية لتمكين دراستها ومعالجتها.",
    "السرية والمراجع — يحمي كل طرف المعلومات السرية التي يتلقاها. ويحترم أي استخدام كمرجع تجاري اعتراض العميل المكتوب.",
    "البيانات الشخصية — يلتزم كل طرف بقوانين حماية البيانات المعمول بها. وعندما تعمل Studio ATS بصفتها معالجًا للبيانات، تُوثَّق الالتزامات اللازمة بشكل منفصل.",
    "الإنهاء والتنازل والقانون الواجب التطبيق — تراعي آثار الإنهاء الخدمات المنفذة والمبالغ المستحقة. يتطلب التنازل موافقة كتابية مسبقة ما لم ينص القانون على خلاف ذلك. يخضع الاتفاق للقانون الفرنسي."
  ]$json$)
  ) as v(locale, title, clauses)
 where t.kind = 'quote_terms' and t.locale = v.locale and t.version = 1 and t.status = 'draft';
