import type { Copy } from "./copy.ts";

/** Deutsch — transactional emails. A pending commission is never described as earned. */
const de: Copy = {
  common: {
    signature: "Ihr Studio ATS-Team",
    footer: "Sie erhalten diese E-Mail im Zusammenhang mit Ihrem Studio ATS-Konto oder Ihrer Anfrage. Dies ist eine Transaktionsnachricht.",
    pendingNote: "Eine ausstehende Provision ist noch nicht erworben: Sie wird verfügbar, sobald die Prüffrist ohne Erstattung oder Streitfall abgelaufen ist.",
  },
  templates: {
    "affiliate.welcome": {
      subject: "Willkommen bei Studio ATS",
      preheader: "Ihr Partnerbereich ist bereit.",
      title: "Willkommen bei Studio ATS.",
      paragraphs: [
        "Ihr Partnerbereich ist bereit. Ihr Empfehlungscode lautet {code}.",
        "Teilen Sie Ihren Link, verfolgen Sie Ihre Interessenten und sehen Sie jeden Verkauf, jede Provision und jede Verlängerung an einem Ort.",
      ],
      cta: { label: "Mein Dashboard öffnen", path: "/dashboard" },
    },
    "affiliate.new_lead": {
      subject: "Ihnen wurde ein neuer Interessent zugeordnet",
      preheader: "Über Ihren Link ist eine neue Anfrage eingegangen.",
      title: "Ihnen wurde ein neuer Interessent zugeordnet.",
      paragraphs: ["{who} hat über Ihren Link Informationen zu Studio ATS angefordert.", "Das Studio ATS-Team übernimmt den ersten Kontakt. Sie können ihn in Ihrem Dashboard verfolgen."],
      cta: { label: "Meine Interessenten ansehen", path: "/dashboard/prospects" },
    },
    "affiliate.appointment": {
      subject: "Ein Interessent hat einen Termin angefragt",
      preheader: "Über Ihren Link ist eine Terminanfrage eingegangen.",
      title: "Ein Interessent hat einen Termin angefragt.",
      paragraphs: ["{who} hat einen Termin angefragt{when}."],
      cta: { label: "Meine Interessenten ansehen", path: "/dashboard/prospects" },
    },
    "affiliate.sale_detected": {
      subject: "Neuer Studio ATS-Verkauf — Provision von {commission} ausstehend",
      preheader: "{gross} generiert. Provision wartet auf Prüfung.",
      title: "Ein Verkauf wurde bestätigt.",
      paragraphs: [
        "Verkauf {sale_ref}: {gross} vom Kunden bezahlt.",
        "Ihre Provision: {commission} — Status: ausstehend. Voraussichtlich verfügbar ab {available_on}.",
      ],
      cta: { label: "Meine Provisionen verfolgen", path: "/dashboard/commissions" },
      footnote: "pendingNote",
    },
    "affiliate.renewal": {
      subject: "Ein Kunde hat verlängert — Provision von {commission} ausstehend",
      preheader: "Ein von Ihnen vermittelter Vertrag wurde verlängert.",
      title: "Ein von Ihnen vermittelter Kunde hat gerade verlängert.",
      paragraphs: [
        "Verlängerung {sale_ref}: {gross} bezahlt.",
        "Ihre Verlängerungsprovision: {commission} — Status: ausstehend. Voraussichtlich verfügbar: {available_on}.",
      ],
      cta: { label: "Mein wiederkehrendes Portfolio ansehen", path: "/dashboard/recurring" },
      footnote: "pendingNote",
    },
    "affiliate.commission_available": {
      subject: "{commission} sind jetzt verfügbar",
      preheader: "Ihre Provision hat die Prüffrist durchlaufen.",
      title: "Ihre Provision ist jetzt verfügbar.",
      paragraphs: ["{commission} haben die Prüffrist durchlaufen und stehen jetzt zur Auszahlung bereit."],
      cta: { label: "Mein Guthaben ansehen", path: "/dashboard/payouts" },
    },
    "affiliate.payout_sent": {
      subject: "Auszahlung gesendet: {amount}",
      preheader: "Eine Auszahlung wurde an Sie veranlasst.",
      title: "Eine Auszahlung wurde an Sie gesendet.",
      paragraphs: ["Auszahlung {payout_ref}: {amount}. Je nach Bank kommt das Geld in der Regel innerhalb weniger Werktage an."],
      cta: { label: "Meine Auszahlungen ansehen", path: "/dashboard/payouts" },
    },
    "affiliate.customer_cancelled": {
      subject: "Ein von Ihnen vermittelter Vertrag wurde gekündigt",
      preheader: "Ein Kunde wird nicht verlängern.",
      title: "Ein von Ihnen vermittelter Vertrag wurde gekündigt.",
      paragraphs: [
        "Der Kunde {customer_ref} wird nicht verlängern. Der Vertrag endet am {ends_on}.",
        "Bereits bestätigte Provisionen für bezahlte Zeiträume sind nicht betroffen. Für diesen Vertrag entsteht keine Verlängerungsprovision.",
      ],
      cta: { label: "Mein wiederkehrendes Portfolio ansehen", path: "/dashboard/recurring" },
    },
    "customer.welcome": {
      subject: "Willkommen bei Studio ATS",
      preheader: "Ihre Zahlung ist bestätigt.",
      title: "Willkommen bei Studio ATS.",
      paragraphs: [
        "Ihre Zahlung ist bestätigt und Ihr {product}-Abonnement ist aktiv.",
        "Unser Team meldet sich in Kürze für den Start bei Ihnen. Beleg und Rechnungen erhalten Sie von unserem Zahlungsdienstleister Stripe.",
      ],
    },
    "customer.order_confirmation": {
      subject: "Ihre Studio ATS-Bestellung {sale_ref}",
      preheader: "Bestellung bestätigt.",
      title: "Ihre Bestellung ist bestätigt.",
      paragraphs: ["Bestellung {sale_ref}: {amount} bezahlt."],
    },
    "customer.renewal_receipt": {
      subject: "Ihr Studio ATS-Abonnement wurde verlängert",
      preheader: "Verlängerung bestätigt.",
      title: "Ihr Abonnement wurde verlängert.",
      paragraphs: ["Verlängerung {sale_ref}: {amount} bezahlt. Vielen Dank für Ihr Vertrauen."],
    },
    "customer.payment_failed": {
      subject: "Ihre Studio ATS-Zahlung ist fehlgeschlagen",
      preheader: "Bitte aktualisieren Sie Ihre Zahlungsmethode.",
      title: "Ihre Zahlung ist fehlgeschlagen.",
      paragraphs: ["Wir konnten {amount} nicht einziehen. Möglicherweise hat Ihre Bank die Zahlung abgelehnt. Wir versuchen es automatisch erneut; Sie können Ihre Zahlungsmethode auch über den Link in der E-Mail unseres Zahlungsdienstleisters aktualisieren."],
    },
    "customer.cancellation": {
      subject: "Ihre Studio ATS-Kündigung ist bestätigt",
      preheader: "Kündigung bestätigt.",
      title: "Ihre Kündigung ist bestätigt.",
      paragraphs: ["Ihr Abonnement wird nicht verlängert. Sie behalten den Zugang bis zum {ends_on}.", "Falls dies ein Versehen war, antworten Sie einfach auf diese E-Mail."],
    },
    "lead.confirmation": {
      subject: "Wir haben Ihre Anfrage erhalten — Studio ATS",
      preheader: "Wir melden uns in Kürze bei Ihnen.",
      title: "Vielen Dank, wir haben Ihre Anfrage erhalten.",
      paragraphs: ["Ein Mitglied des Studio ATS-Teams meldet sich in Kürze bei Ihnen."],
    },
    "lead.appointment_confirmation": {
      subject: "Ihre Terminanfrage bei Studio ATS",
      preheader: "Wir stimmen den Termin mit Ihnen ab.",
      title: "Wir haben Ihre Terminanfrage erhalten.",
      paragraphs: ["Wir stimmen den Termin mit Ihnen ab{when}."],
    },
    "dossier.invite": {
      subject: "Füllen Sie Ihr Studio ATS-Lastenheft aus - {reference}",
      preheader: "Ihr sicherer Projektbereich ist bereit.",
      title: "Erzählen Sie uns von Ihrem Projekt.",
      paragraphs: ["Ihr Studio ATS-Berater hat das Dossier {reference} erstellt.", "Nutzen Sie den sicheren Link unten, um Ihr Lastenheft auszufüllen. Der Link ist persönlich und läuft automatisch ab."],
      cta: { label: "Mein Dossier öffnen", path: "{access_path}" },
    },
    "dossier.changes_requested": {
      subject: "Änderungen für Dossier {reference} angefordert",
      preheader: "Ihr Berater hat einen Kommentar hinterlassen.",
      title: "Einige Angaben müssen ergänzt werden.",
      paragraphs: ["Kommentar: {comment}", "Öffnen Sie das sichere Dossier, um es zu aktualisieren und eine neue Revision einzureichen."],
      cta: { label: "Mein Dossier bearbeiten", path: "{access_path}" },
    },
    "dossier.ready_to_accept": {
      subject: "Ihr Studio ATS-Angebot ist bereit - {reference}",
      preheader: "Prüfen Sie das gesperrte Lastenheft und Angebot.",
      title: "Ihre Dokumente sind zur Annahme bereit.",
      paragraphs: ["Prüfen Sie das genaue Lastenheft und Angebot, die für Dossier {reference} erstellt wurden.", "Wenn Sie bereit sind, fordern Sie den Einmalcode an, um Ihre Annahme zu bestätigen."],
      cta: { label: "Meine Dokumente prüfen", path: "{access_path}" },
    },
    "dossier.otp": {
      subject: "Ihr Studio ATS-Annahmecode",
      preheader: "Dieser Code läuft in 10 Minuten ab.",
      title: "Ihr Einmalcode lautet {otp}.",
      paragraphs: ["Geben Sie diesen Code ein, um Dossier {reference} anzunehmen.", "Er läuft in 10 Minuten ab und kann nur einmal verwendet werden."],
    },
    "dossier.payment": {
      subject: "Zahlung für Studio ATS abschließen - {reference}",
      preheader: "Ihr Dossier wurde gegengezeichnet.",
      title: "Ihr Studio ATS-Dossier ist vollständig angenommen.",
      paragraphs: ["Studio ATS hat dieselben gesperrten Dokumente gegengezeichnet.", "Leisten Sie die erste Zahlung über Stripe, damit die Bestellung verbindlich wird."],
      cta: { label: "Sicher bezahlen", path: "{payment_url}" },
    },
    "dossier.active": {
      subject: "Ihre Studio ATS-Bestellung ist bestätigt - {reference}",
      preheader: "Zahlung bestätigt.",
      title: "Ihr Studio ATS-Projekt kann beginnen.",
      paragraphs: ["Wir haben die erste Zahlung für Dossier {reference} erhalten.", "Ihre angenommenen Dokumente und das Nachweisprotokoll bleiben in Ihrem sicheren Dossier verfügbar."],
      cta: { label: "Mein Dossier öffnen", path: "{access_path}" },
    },
    "system.test": {
      subject: "Studio ATS — Test-E-Mail",
      preheader: "Der E-Mail-Versand funktioniert.",
      title: "Der E-Mail-Versand funktioniert.",
      paragraphs: ["Dieser Test wurde aus den Studio ATS-Admin-Einstellungen gesendet. Wenn Sie ihn lesen können, erreichen Anmeldecodes und Benachrichtigungen Ihre Nutzer."],
    },
    "auth.login_code": {
      subject: "Ihr Studio ATS-Anmeldecode: {code}",
      preheader: "5 Minuten gültig, nur einmal verwendbar.",
      title: "Ihr Anmeldecode",
      paragraphs: ["Geben Sie diesen Code bei Studio ATS ein, um sich anzumelden. Er ist 5 Minuten gültig und funktioniert nur einmal."],
      highlight: "{code}",
      footnote: "Wenn Sie diesen Code nicht angefordert haben, ignorieren Sie diese E-Mail und geben Sie den Code niemals weiter.",
    },
  },
};

export default de;
