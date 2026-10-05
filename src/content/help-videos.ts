import type { Locale } from "@/i18n/config";

/**
 * Video help library + contextual help articles (content, like the sales
 * content: written in English and French, other locales fall back to English).
 *
 * Every video is REAL footage: chapters/segments of the recorded tour of the
 * partner space (/public/demo/partner-space.mp4) and of the Prospects recording
 * (/public/demo/prospects.mp4). A tutorial with no footage
 * yet has `src: undefined` and is a written guide — never a fake video. To add
 * a dedicated recording later, set its `src`, `poster` and remove `start`/`end`.
 */
export type LocalizedText = { en: string; fr: string } & Partial<Record<Locale, string>>;
export const pick = (x: LocalizedText, locale: Locale) => x[locale] ?? x.en;

export type HelpCategory = "start" | "prospecting" | "sales-center" | "commissions" | "account";
export const HELP_CATEGORIES: HelpCategory[] = ["start", "prospecting", "sales-center", "commissions", "account"];

export interface HelpVideo {
  slug: string;
  category: HelpCategory;
  /** 1–3: the "New here?" essentials, in this order. */
  essential?: 1 | 2 | 3;
  title: LocalizedText;
  description: LocalizedText;
  /** Recording to play. Undefined = written guide only (no footage yet). */
  src?: string;
  poster?: string;
  thumb?: string;
  /** Segment of the recording, in seconds. */
  start?: number;
  end?: number;
  /** Estimated reading time when there is no video. */
  readMinutes?: number;
  /** Absolute times in the recording. */
  chapters?: { at: number; label: LocalizedText }[];
  learn: LocalizedText[];
  explanation: LocalizedText;
  steps: LocalizedText[];
  remember: LocalizedText[];
}

const TOUR = "/demo/partner-space.mp4";
const TOUR_END = 120.8;
const PROSPECTS = "/demo/prospects.mp4";
const PROSPECTS_END = 62.8;

export const HELP_VIDEOS: HelpVideo[] = [
  {
    slug: "tour",
    category: "start",
    essential: 1,
    title: { en: "Tour your partner space", fr: "Faites le tour de votre espace partenaire" },
    description: {
      en: "Two minutes through every section: dashboard, messages, help, copilot, earnings and your sales pages.",
      fr: "Deux minutes à travers chaque section : tableau de bord, messages, aide, copilote, gains et pages commerciales.",
    },
    src: TOUR, thumb: "/demo/thumbs/tour.webp", start: 0, end: TOUR_END,
    chapters: [
      { at: 3, label: { en: "Overview", fr: "Vue d’ensemble" } },
      { at: 9, label: { en: "Messages", fr: "Messages" } },
      { at: 15, label: { en: "Ask the team for help", fr: "Demander de l’aide" } },
      { at: 24, label: { en: "Copilot (Sales Center)", fr: "Copilote (Sales Center)" } },
      { at: 45, label: { en: "What to send", fr: "Quoi envoyer" } },
      { at: 54, label: { en: "Start selling", fr: "Commencer à vendre" } },
      { at: 63, label: { en: "Commissions", fr: "Commissions" } },
      { at: 69, label: { en: "Recurring", fr: "Récurrent" } },
      { at: 72, label: { en: "Payouts", fr: "Paiements" } },
      { at: 75, label: { en: "Analytics", fr: "Statistiques" } },
      { at: 78, label: { en: "Referrals", fr: "Parrainage" } },
      { at: 87, label: { en: "Sales pages", fr: "Pages commerciales" } },
      { at: 108, label: { en: "The page your prospect sees", fr: "La page vue par le prospect" } },
    ],
    learn: [
      { en: "Where each section is and what it is for", fr: "Où se trouve chaque section et à quoi elle sert" },
      { en: "How the dashboard tells you your next action", fr: "Comment le tableau de bord vous indique votre prochaine action" },
      { en: "Where to find your link, your code and your earnings", fr: "Où trouver votre lien, votre code et vos gains" },
    ],
    explanation: {
      en: "The left menu is organised in three groups. At the top: your overview, your messages and help. “Sell” gathers what you use with prospects — the copilot (Sales Center), your prospects, your link & code, promo codes and client documents. “Earn” shows what your activity produces — sales, commissions, recurring contracts, payouts, analytics and referrals. On a phone, the main sections sit in the bar at the bottom of the screen and the rest is under “Menu”.",
      fr: "Le menu de gauche est organisé en trois groupes. En haut : votre vue d’ensemble, vos messages et l’aide. « Vendre » regroupe ce que vous utilisez avec vos prospects — le copilote (Sales Center), vos prospects, votre lien & code, les codes promo et les documents clients. « Gagner » montre ce que votre activité produit — ventes, commissions, contrats récurrents, paiements, statistiques et parrainage. Sur téléphone, les sections principales sont dans la barre en bas de l’écran, le reste dans « Menu ».",
    },
    steps: [
      { en: "Start from the overview: the “Your next action” card always shows the most useful thing to do.", fr: "Partez de la vue d’ensemble : la carte « Votre prochaine action » indique toujours la chose la plus utile à faire." },
      { en: "Open the copilot when you need to know what to say, send or do.", fr: "Ouvrez le copilote quand vous voulez savoir quoi dire, quoi envoyer ou quoi faire." },
      { en: "Follow your money in Commissions, Recurring and Payouts.", fr: "Suivez votre argent dans Commissions, Récurrent et Paiements." },
    ],
    remember: [
      { en: "Nothing is sent or created without you clicking it.", fr: "Rien n’est envoyé ni créé sans que vous cliquiez." },
      { en: "Help is always one click away, top right.", fr: "L’aide est toujours à un clic, en haut à droite." },
    ],
  },
  {
    slug: "prospects",
    category: "prospecting",
    essential: 2,
    title: { en: "Find and follow a prospect", fr: "Trouver et suivre un prospect" },
    description: {
      en: "One minute in Prospects: the board, the prospect’s card, the next action, replies, follow-ups and handing over to Studio.",
      fr: "Une minute dans Prospects : le tableau, la fiche, la prochaine action, les réponses, les relances et le passage à Studio.",
    },
    src: PROSPECTS, thumb: "/demo/thumbs/prospects.webp", start: 0, end: PROSPECTS_END,
    chapters: [
      { at: 0, label: { en: "The prospects board", fr: "Le tableau des prospects" } },
      { at: 2, label: { en: "Move a card to a stage", fr: "Déplacer une fiche d’étape" } },
      { at: 6, label: { en: "The card and your next action", fr: "La fiche et votre prochaine action" } },
      { at: 8, label: { en: "Edit the card", fr: "Modifier la fiche" } },
      { at: 12, label: { en: "From stage to stage", fr: "D’étape en étape" } },
      { at: 20, label: { en: "What to say next", fr: "Quoi dire ensuite" } },
      { at: 26, label: { en: "They replied: pick the closest answer", fr: "Il/elle a répondu : la réponse la plus proche" } },
      { at: 30, label: { en: "Plan a follow-up", fr: "Planifier une relance" } },
      { at: 36, label: { en: "Answer an objection", fr: "Répondre à une objection" } },
      { at: 50, label: { en: "Hand over to Studio", fr: "Passer à Studio" } },
      { at: 56, label: { en: "“Not now”: come back later", fr: "« Pas maintenant » : revenir plus tard" } },
    ],
    learn: [
      { en: "How the board and the stages work", fr: "Comment fonctionnent le tableau et les étapes" },
      { en: "How a card tells you what to do and say", fr: "Comment une fiche vous dit quoi faire et quoi dire" },
      { en: "How to answer, plan a follow-up and hand over to Studio", fr: "Comment répondre, planifier une relance et passer à Studio" },
    ],
    explanation: {
      en: "Prospects is your private follow-up list: only you can see it. Each business you talk to gets a card, placed in a column that matches where the conversation stands — from “To contact” to “Sale”. Open a card to get “Your next action”: why, the goal of the step, what to say (ready to copy) and what to avoid. When the prospect answers, pick the closest reply: the app gives you what it means, what to answer, what to ask and what comes next — and lets you plan the follow-up date. When the conversation becomes technical, contractual or close to signing, “Hand over to Studio”: the prospect stays attributed to you.",
      fr: "Prospects est votre liste de suivi privée : vous seul la voyez. Chaque entreprise avec qui vous échangez a sa fiche, rangée dans la colonne qui correspond à l’état de la conversation — de « À contacter » à « Vente ». Ouvrez une fiche pour obtenir « Votre prochaine action » : pourquoi, l’objectif de l’étape, quoi dire (prêt à copier) et quoi éviter. Quand le prospect répond, choisissez la réponse la plus proche : l’application vous donne ce que ça veut dire, quoi répondre, quoi demander et la suite — et vous permet de planifier la date de relance. Quand la conversation devient technique, contractuelle ou proche de la signature, « Passer à Studio » : le prospect reste attribué à vous.",
    },
    steps: [
      { en: "In Prospects, click “Add a prospect”. A name is enough to start; complete the card later with “Edit in my CRM”.", fr: "Dans Prospects, cliquez sur « Ajouter un prospect ». Un nom suffit pour commencer ; complétez la fiche ensuite avec « Modifier dans mon CRM »." },
      { en: "Move a card with “Move to” when the conversation moves on.", fr: "Déplacez une fiche avec « Déplacer vers » quand la conversation avance." },
      { en: "Open the card, copy what to say, then tell the app what happened (“I sent the message”, “They’re interested”, “Not now”).", fr: "Ouvrez la fiche, copiez quoi dire, puis indiquez ce qui s’est passé (« J’ai envoyé le message », « Il/elle est intéressé(e) », « Pas maintenant »)." },
      { en: "They replied? Pick the closest answer, copy the suggested reply and “Done — update the prospect”, with a follow-up date if needed.", fr: "Il/elle a répondu ? Choisissez la réponse la plus proche, copiez la réponse conseillée puis « C’est fait — mettre à jour le prospect », avec une date de relance si besoin." },
      { en: "Technical, contractual or ready to sign? “Hand over to Studio” from the card, with the prospect’s consent to be contacted.", fr: "Technique, contractuel ou prêt à signer ? « Passer à Studio » depuis la fiche, avec l’accord du prospect pour être contacté." },
    ],
    remember: [
      { en: "Your prospects are private: other partners never see them.", fr: "Vos prospects sont privés : les autres partenaires ne les voient jamais." },
      { en: "Handing over keeps the attribution, history and commission.", fr: "Passer la main conserve l’attribution, l’historique et la commission." },
      { en: "Every change is kept in the card’s history.", fr: "Chaque changement est gardé dans l’historique de la fiche." },
    ],
  },
  {
    slug: "prospects-pipeline",
    category: "prospecting",
    title: { en: "Move a prospect forward", fr: "Faire avancer un prospect" },
    description: {
      en: "The board, the stage of each card, the next action and how to edit a card.",
      fr: "Le tableau, l’étape de chaque fiche, la prochaine action et la modification d’une fiche.",
    },
    src: PROSPECTS, thumb: "/demo/thumbs/prospects-pipeline.webp", start: 0, end: 20,
    chapters: [
      { at: 0, label: { en: "The board", fr: "Le tableau" } },
      { at: 2, label: { en: "Move to a stage", fr: "Déplacer vers une étape" } },
      { at: 6, label: { en: "Your next action", fr: "Votre prochaine action" } },
      { at: 8, label: { en: "Edit the card", fr: "Modifier la fiche" } },
      { at: 12, label: { en: "From stage to stage", fr: "D’étape en étape" } },
    ],
    learn: [
      { en: "What each column means", fr: "Ce que signifie chaque colonne" },
      { en: "Where to edit a prospect’s details", fr: "Où modifier les informations d’un prospect" },
    ],
    explanation: {
      en: "Each column of the board is a stage of the conversation. A card shows the prospect, its next action and a “Move to” menu to change its stage. Opening the card shows “Your next action” for that stage; “Edit in my CRM” opens the details: name, company, trade, stage, email, phone, website, source, next action and its date, potential value, campaign, market and notes.",
      fr: "Chaque colonne du tableau est une étape de la conversation. Une fiche montre le prospect, sa prochaine action et un menu « Déplacer vers » pour changer son étape. Ouvrir la fiche affiche « Votre prochaine action » pour cette étape ; « Modifier dans mon CRM » ouvre les informations : nom, entreprise, métier, statut, email, téléphone, site web, origine, prochaine action et sa date, valeur potentielle, campagne, marché et notes.",
    },
    steps: [
      { en: "Use “Move to” on a card to change its stage.", fr: "Utilisez « Déplacer vers » sur une fiche pour changer son étape." },
      { en: "Open the card to see what to do at this stage.", fr: "Ouvrez la fiche pour voir quoi faire à cette étape." },
      { en: "“Edit in my CRM” to complete or correct the details.", fr: "« Modifier dans mon CRM » pour compléter ou corriger les informations." },
    ],
    remember: [
      { en: "Adding the sector to the card lets the copilot adapt the message, questions and projects.", fr: "Ajouter le secteur dans la fiche permet au copilote d’adapter le message, les questions et les projets." },
    ],
  },
  {
    slug: "prospects-replies",
    category: "prospecting",
    title: { en: "Answer a prospect and plan the follow-up", fr: "Répondre à un prospect et planifier la relance" },
    description: {
      en: "What to say at each step, the closest reply, objections and the follow-up date.",
      fr: "Quoi dire à chaque étape, la réponse la plus proche, les objections et la date de relance.",
    },
    src: PROSPECTS, thumb: "/demo/thumbs/prospects-replies.webp", start: 20, end: 50,
    chapters: [
      { at: 20, label: { en: "What to say", fr: "Quoi dire" } },
      { at: 26, label: { en: "Pick the closest reply", fr: "Choisir la réponse la plus proche" } },
      { at: 30, label: { en: "“Call me later”: plan it", fr: "« Rappelez-moi plus tard » : planifier" } },
      { at: 36, label: { en: "Objections", fr: "Les objections" } },
    ],
    learn: [
      { en: "How to use the suggested replies", fr: "Comment utiliser les réponses conseillées" },
      { en: "How to plan a follow-up date", fr: "Comment planifier une date de relance" },
    ],
    explanation: {
      en: "Under “Your next action”, the card says what to say and what to avoid. When the prospect answers, pick the closest reply among the usual ones (“How much is it?”, “Send me information”, “I already have a website”, “I don’t have time”…). Each reply is labelled: answer yourself (simple, official information), suggested reply (objection or hesitation) or hand over to Studio (technical, legal, contractual). You get what it means, what to answer, what to ask next and what comes after; set the “Call back on” date and confirm with “Done — update the prospect”.",
      fr: "Sous « Votre prochaine action », la fiche indique quoi dire et quoi éviter. Quand le prospect répond, choisissez la réponse la plus proche parmi les réponses habituelles (« Combien ça coûte ? », « Envoyez-moi des informations », « J’ai déjà un site », « Je n’ai pas le temps »…). Chaque réponse est classée : répondez vous-même (information simple et officielle), réponse conseillée (objection ou hésitation) ou passez à Studio (technique, juridique, contractuel). Vous obtenez ce que ça veut dire, quoi répondre, quoi demander puis la suite ; réglez la date « Rappeler le » et validez avec « C’est fait — mettre à jour le prospect ».",
    },
    steps: [
      { en: "Copy what to say, send it, then click what happened.", fr: "Copiez quoi dire, envoyez-le, puis cliquez sur ce qui s’est passé." },
      { en: "Pick the closest reply and copy the suggested answer.", fr: "Choisissez la réponse la plus proche et copiez la réponse conseillée." },
      { en: "Set the follow-up date and update the prospect.", fr: "Réglez la date de relance et mettez à jour le prospect." },
    ],
    remember: [
      { en: "Talk about their problem, not about technology.", fr: "Parlez de son problème, pas de technologie." },
    ],
  },
  {
    slug: "prospects-handoff",
    category: "prospecting",
    title: { en: "Hand over to Studio or come back later", fr: "Passer à Studio ou revenir plus tard" },
    description: {
      en: "Hand a prospect over to the Studio team, or mark “Not now” and keep a door open.",
      fr: "Transmettre un prospect à l’équipe Studio, ou indiquer « Pas maintenant » et garder la porte ouverte.",
    },
    src: PROSPECTS, thumb: "/demo/thumbs/prospects-handoff.webp", start: 48, end: PROSPECTS_END,
    chapters: [
      { at: 50, label: { en: "Hand over to Studio", fr: "Passer à Studio" } },
      { at: 56, label: { en: "“Not now”", fr: "« Pas maintenant »" } },
    ],
    learn: [
      { en: "When and how to hand over to Studio", fr: "Quand et comment passer à Studio" },
      { en: "What to do when the prospect says “not now”", fr: "Que faire quand le prospect dit « pas maintenant »" },
    ],
    explanation: {
      en: "“Hand over to Studio” is at the bottom of every card. Use it when the conversation becomes technical, contractual, complex, close to signing — or when you simply don’t know. Choose why, tell Studio what it should know, tick that the prospect agrees to be contacted (their email and phone are then shared), and send. The prospect stays attributed to you: tracking, attribution, commission and history are kept. If the prospect says “Not now”, the card moves to “Lost / to follow up” and the next action becomes a short thank-you message, to come back in a few months.",
      fr: "« Passer à Studio » se trouve en bas de chaque fiche. Utilisez-le quand la conversation devient technique, contractuelle, complexe, proche de la signature — ou simplement quand vous ne savez pas. Choisissez pourquoi, indiquez ce que Studio doit savoir, cochez que le prospect est d’accord pour être contacté (son email et son téléphone sont alors transmis), et envoyez. Le prospect reste attribué à vous : suivi, attribution, commission et historique sont conservés. Si le prospect répond « Pas maintenant », la fiche passe en « Perdu / à relancer » et la prochaine action devient un court message de remerciement, pour revenir dans quelques mois.",
    },
    steps: [
      { en: "At the bottom of the card, open “Hand over to Studio”.", fr: "En bas de la fiche, ouvrez « Passer à Studio »." },
      { en: "Pick the reason, add what Studio should know, tick the prospect’s consent, then send.", fr: "Choisissez la raison, ajoutez ce que Studio doit savoir, cochez l’accord du prospect, puis envoyez." },
      { en: "“Not now”: send the thank-you message and come back later with “Restart the conversation”.", fr: "« Pas maintenant » : envoyez le message de remerciement et revenez plus tard avec « Reprendre la conversation »." },
    ],
    remember: [
      { en: "Never share a prospect’s contact details without their consent.", fr: "Ne transmettez jamais les coordonnées d’un prospect sans son accord." },
    ],
  },
  {
    slug: "sales-center",
    category: "sales-center",
    essential: 3,
    title: { en: "Sell with the Sales Center", fr: "Vendre avec le Sales Center" },
    description: {
      en: "The copilot answers “what do I do now?”: what to say, what to send, objections, follow-ups — plus your link and code.",
      fr: "Le copilote répond à « je fais quoi maintenant ? » : quoi dire, quoi envoyer, objections, relances — et votre lien et votre code.",
    },
    src: TOUR, thumb: "/demo/thumbs/sales-center.webp", start: 24, end: 63,
    chapters: [
      { at: 24, label: { en: "What do you want to do?", fr: "Que voulez-vous faire ?" } },
      { at: 33, label: { en: "Your link, code and QR code", fr: "Votre lien, code et QR code" } },
      { at: 45, label: { en: "What to send", fr: "Quoi envoyer" } },
      { at: 54, label: { en: "Start selling to a target", fr: "Commencer à vendre à une cible" } },
    ],
    learn: [
      { en: "How to get a script for a given trade", fr: "Comment obtenir un script pour un métier donné" },
      { en: "Where your personal link and code are", fr: "Où se trouvent votre lien et votre code personnels" },
      { en: "What you can send to a prospect", fr: "Ce que vous pouvez envoyer à un prospect" },
    ],
    explanation: {
      en: "In the menu, the Sales Center is called “Copilot”. It starts with one question: what do you want to do? Type your prospect’s trade or sector to get what to say; or pick an intent — find a prospect, I already have one, what to send, answer an objection, follow up. Below, your partner kit holds your personal link, your code and a QR code: they are how sales get attributed to you. “Start selling” gives, for a target and a channel, the opening line, the questions to ask, the argument, the call script, the message to send and the likely objections.",
      fr: "Dans le menu, le Sales Center s’appelle « Copilote ». Il commence par une question : que voulez-vous faire ? Tapez le métier ou le secteur de votre prospect pour savoir quoi dire ; ou choisissez une intention — trouver un prospect, j’ai déjà un prospect, quoi envoyer, répondre à une objection, relancer. Plus bas, votre kit contient votre lien personnel, votre code et un QR code : c’est ce qui vous attribue les ventes. « Commencer à vendre » donne, pour une cible et un canal, l’accroche, les questions à poser, l’argument, le script d’appel, le message à envoyer et les objections probables.",
    },
    steps: [
      { en: "Type the trade of your prospect (e.g. photographer, plumber) and click “Tell me what to say”.", fr: "Tapez le métier de votre prospect (ex. photographe, plombier) et cliquez sur « Me dire quoi dire »." },
      { en: "Copy your link or code from the kit and share it with every message.", fr: "Copiez votre lien ou votre code depuis le kit et partagez-le dans chaque message." },
      { en: "“What to send” shows real projects and demos to share.", fr: "« Quoi envoyer » montre des projets et des démos réels à partager." },
      { en: "Use the search bar to find an objection, a script or a message in seconds.", fr: "Utilisez la barre de recherche pour retrouver une objection, un script ou un message en quelques secondes." },
    ],
    remember: [
      { en: "Messages are ready to copy; you can personalise them before sending.", fr: "Les messages sont prêts à copier ; vous pouvez les personnaliser avant l’envoi." },
      { en: "Only use the official information: if it’s not there, ask Studio.", fr: "Utilisez uniquement les informations officielles : si ce n’est pas indiqué, demandez à Studio." },
    ],
  },
  {
    slug: "sales-pages",
    category: "sales-center",
    title: { en: "Create a sales page for a prospect", fr: "Créer une page commerciale pour un prospect" },
    description: {
      en: "Generate a page attributed to you, choose its target, angle and call to action, then share it.",
      fr: "Générez une page qui vous est attribuée, choisissez sa cible, son angle et son appel à l’action, puis partagez-la.",
    },
    src: TOUR, thumb: "/demo/thumbs/sales-pages.webp", start: 87, end: TOUR_END,
    chapters: [
      { at: 87, label: { en: "My sales pages", fr: "Mes pages commerciales" } },
      { at: 93, label: { en: "Settings of the page", fr: "Réglages de la page" } },
      { at: 102, label: { en: "Share and preview", fr: "Partager et prévisualiser" } },
      { at: 108, label: { en: "What your prospect sees", fr: "Ce que voit votre prospect" } },
    ],
    learn: [
      { en: "How to generate a page in one click", fr: "Comment générer une page en un clic" },
      { en: "What you can change, and what Studio controls", fr: "Ce que vous pouvez régler, et ce que Studio contrôle" },
    ],
    explanation: {
      en: "Sales pages are built from blocks validated by Studio ATS and attributed to you: a prospect who asks for information or buys from your page is linked to you. You choose the target, the sales angle, the main call to action, the language and the address, and whether to show you as “Your Studio ATS advisor”. Prices, terms, product features, legal information and the page’s texts are controlled by Studio.",
      fr: "Les pages commerciales sont construites à partir de blocs validés par Studio ATS et vous sont attribuées : un prospect qui demande des informations ou achète depuis votre page vous est rattaché. Vous choisissez la cible, l’angle commercial, l’appel à l’action principal, la langue et l’adresse, et si vous apparaissez comme « Votre conseiller Studio ATS ». Prix, conditions, fonctionnalités, informations juridiques et textes de la page sont contrôlés par Studio.",
    },
    steps: [
      { en: "In the copilot, open “My sales pages” and click “New sales page”.", fr: "Dans le copilote, ouvrez « Mes pages commerciales » et cliquez sur « Nouvelle page commerciale »." },
      { en: "Pick the target and the call to action, then “Generate the sales page”.", fr: "Choisissez la cible et l’appel à l’action, puis « Générer la page commerciale »." },
      { en: "Use “View as the client” before sharing it.", fr: "Utilisez « Voir comme le client » avant de la partager." },
    ],
    remember: [
      { en: "Only your professional details appear on the page.", fr: "Seules vos coordonnées professionnelles apparaissent sur la page." },
    ],
  },
  {
    slug: "earnings",
    category: "commissions",
    title: { en: "Follow your commissions and payouts", fr: "Suivre vos commissions et vos paiements" },
    description: {
      en: "Commissions, recurring contracts, payouts, analytics and referrals: where your money is, and when it is paid.",
      fr: "Commissions, contrats récurrents, paiements, statistiques et parrainage : où en est votre argent, et quand il est versé.",
    },
    src: TOUR, thumb: "/demo/thumbs/earnings.webp", start: 63, end: 87,
    chapters: [
      { at: 63, label: { en: "Commissions", fr: "Commissions" } },
      { at: 69, label: { en: "Recurring", fr: "Récurrent" } },
      { at: 72, label: { en: "Payouts", fr: "Paiements" } },
      { at: 75, label: { en: "Analytics", fr: "Statistiques" } },
      { at: 78, label: { en: "Referrals", fr: "Parrainage" } },
    ],
    learn: [
      { en: "The life of a commission: pending, available, paid", fr: "La vie d’une commission : en attente, disponible, payée" },
      { en: "Where recurring contracts and payouts are", fr: "Où se trouvent les contrats récurrents et les paiements" },
    ],
    explanation: {
      en: "A commission is only created once the client’s payment is confirmed. It first stays pending during the validation period, then becomes available, then paid on the payout schedule. Recurring shows the annual contracts you brought and their renewals — potential future commissions are projections, not money earned. Payouts shows your available balance, the next payment, the minimum and your payout method. Referrals shows your sponsorship link and your direct referrals.",
      fr: "Une commission n’est créée qu’une fois le paiement du client confirmé. Elle reste d’abord en attente pendant la période de validation, devient disponible, puis payée selon le calendrier des paiements. Récurrent montre les contrats annuels que vous avez apportés et leurs renouvellements — les commissions futures potentielles sont des projections, pas de l’argent gagné. Paiements montre votre solde disponible, le prochain paiement, le minimum et votre moyen de paiement. Parrainage montre votre lien de parrainage et vos filleuls directs.",
    },
    steps: [
      { en: "In Commissions, read the three steps: pending validation → available → paid.", fr: "Dans Commissions, lisez les trois étapes : en attente de validation → disponible → payée." },
      { en: "In Payouts, connect a payout account so available commissions can be paid.", fr: "Dans Paiements, connectez un compte de paiement pour que les commissions disponibles puissent être versées." },
    ],
    remember: [
      { en: "Pending money is not earned yet; a refund cancels the matching commission.", fr: "L’argent en attente n’est pas encore acquis ; un remboursement annule la commission correspondante." },
    ],
  },
  {
    slug: "messages-help",
    category: "account",
    title: { en: "Messages and asking the team for help", fr: "Messages et demander de l’aide à l’équipe" },
    description: {
      en: "Write to the Studio ATS team, your sponsor and your contacts — and send a help request with your account context.",
      fr: "Écrivez à l’équipe Studio ATS, à votre parrain et à vos contacts — et envoyez une demande d’aide avec le contexte de votre compte.",
    },
    src: TOUR, thumb: "/demo/thumbs/messages-help.webp", start: 9, end: 24,
    chapters: [
      { at: 9, label: { en: "Conversations and contacts", fr: "Conversations et contacts" } },
      { at: 15, label: { en: "Ask the team for help", fr: "Demander de l’aide à l’équipe" } },
    ],
    learn: [
      { en: "Who you can talk to", fr: "Avec qui vous pouvez échanger" },
      { en: "How to send a help request", fr: "Comment envoyer une demande d’aide" },
    ],
    explanation: {
      en: "Messages holds the announcements and your direct line with the Studio ATS team. In Contacts you see your sponsor and your direct referrals; other partners can be added with their code, once they accept. Help sends a request to the team by email with your account context (status, sponsor, number of prospects, balances): choose a subject and an urgency, describe what happened, and follow the answer in “My requests”.",
      fr: "Messages contient les annonces et votre ligne directe avec l’équipe Studio ATS. Dans Contacts, vous voyez votre parrain et vos filleuls directs ; d’autres partenaires peuvent être ajoutés avec leur code, une fois qu’ils acceptent. Aide envoie une demande à l’équipe par email avec le contexte de votre compte (statut, parrain, nombre de prospects, soldes) : choisissez un sujet et une urgence, décrivez ce qui s’est passé, et suivez la réponse dans « Mes demandes ».",
    },
    steps: [
      { en: "Open Help from the menu or from the help panel (“Write to the team”).", fr: "Ouvrez Aide depuis le menu ou depuis le panneau d’aide (« Écrire à l’équipe »)." },
      { en: "Choose the subject and the urgency, then send.", fr: "Choisissez le sujet et l’urgence, puis envoyez." },
    ],
    remember: [
      { en: "“Urgent” is for a client waiting or money blocked.", fr: "« Urgent » : un client attend ou de l’argent est bloqué." },
    ],
  },
];

export const ESSENTIALS = HELP_VIDEOS.filter((v) => v.essential).sort((a, b) => a.essential! - b.essential!);
export const videoBySlug = (slug: string) => HELP_VIDEOS.find((v) => v.slug === slug) ?? null;

/** Length in seconds of the video (or segment), or null for a written guide. */
export function videoLength(v: HelpVideo): number | null {
  if (!v.src) return null;
  return Math.max(0, (v.end ?? 0) - (v.start ?? 0)) || null;
}

/** Contextual help: questions answered without leaving the page. */
export interface HelpArticle {
  q: LocalizedText;
  a: LocalizedText;
  /** Tutorial that shows it. */
  video?: string;
}

export const HELP_ARTICLES: Record<"home" | "prospects" | "salesCenter" | "documents" | "commissions" | "link" | "referrals" | "other", HelpArticle[]> = {
  home: [
    { q: { en: "What should I do first?", fr: "Par quoi commencer ?" }, a: { en: "Follow the “Your next action” card at the top of the overview: it always shows the most useful step, from your start-up checklist to your next follow-up.", fr: "Suivez la carte « Votre prochaine action » en haut de la vue d’ensemble : elle indique toujours l’étape la plus utile, de la checklist de démarrage à votre prochaine relance." }, video: "tour" },
    { q: { en: "Where is everything?", fr: "Où se trouve chaque chose ?" }, a: { en: "“Sell” groups the copilot, prospects, your link & code and documents. “Earn” groups sales, commissions, recurring, payouts, analytics and referrals.", fr: "« Vendre » regroupe le copilote, les prospects, votre lien & code et les documents. « Gagner » regroupe ventes, commissions, récurrent, paiements, statistiques et parrainage." }, video: "tour" },
  ],
  prospects: [
    { q: { en: "How do I add a prospect?", fr: "Comment ajouter un prospect ?" }, a: { en: "Click “Add a prospect” at the top of the page. A name is enough; you can complete the card later.", fr: "Cliquez sur « Ajouter un prospect » en haut de la page. Un nom suffit ; vous complétez la fiche plus tard." }, video: "prospects" },
    { q: { en: "How do I follow an opportunity?", fr: "Comment suivre une opportunité ?" }, a: { en: "Open the prospect’s card: “Your next action” tells you what to do and say. After each exchange, tell the app what happened — it updates the stage and plans the follow-up.", fr: "Ouvrez la fiche du prospect : « Votre prochaine action » vous dit quoi faire et quoi dire. Après chaque échange, indiquez ce qui s’est passé — l’application met à jour l’étape et planifie la relance." }, video: "prospects-replies" },
    { q: { en: "What do the stages mean?", fr: "Que signifient les statuts ?" }, a: { en: "Each column is where the conversation stands: to contact, first message sent, reply received, need identified… up to “Handed over to Studio”, “Quote / payment” and “Sale”. “Lost / to follow up” keeps a prospect for later.", fr: "Chaque colonne indique où en est la conversation : à contacter, premier message envoyé, réponse reçue, besoin identifié… jusqu’à « Transmis à Studio », « Devis / paiement » et « Vente ». « Perdu / à relancer » garde un prospect pour plus tard." }, video: "prospects-pipeline" },
    { q: { en: "When should I hand over to Studio?", fr: "Quand passer la main à Studio ?" }, a: { en: "When it becomes technical, contractual, close to signing — or when you simply don’t know. The prospect stays attributed to you.", fr: "Quand ça devient technique, contractuel, proche de la signature — ou simplement quand vous ne savez pas. Le prospect reste attribué à vous." }, video: "prospects-handoff" },
  ],
  salesCenter: [
    { q: { en: "What do I say to a prospect?", fr: "Que dire à un prospect ?" }, a: { en: "Type their trade at the top of the copilot and click “Tell me what to say”: opening, questions, argument, script and message to send.", fr: "Tapez son métier en haut du copilote et cliquez sur « Me dire quoi dire » : accroche, questions, argument, script et message à envoyer." }, video: "sales-center" },
    { q: { en: "Where are my link and my code?", fr: "Où sont mon lien et mon code ?" }, a: { en: "In your kit on the copilot page, and in “My link & code”. Share them so the sale is attributed to you.", fr: "Dans votre kit sur la page du copilote, et dans « Mon lien & code ». Partagez-les pour que la vente vous soit attribuée." }, video: "sales-center" },
    { q: { en: "What can I send?", fr: "Que puis-je envoyer ?" }, a: { en: "“What to send” lists real projects, demos and sales pages you can share.", fr: "« Quoi envoyer » liste des projets réels, des démos et des pages commerciales à partager." }, video: "sales-pages" },
  ],
  documents: [
    { q: { en: "What are client documents?", fr: "À quoi servent les documents clients ?" }, a: { en: "A client file gathers the brief and the quote of a prospect, attributed to you. Create one from a prospect with an email, or download a blank brief or quote.", fr: "Un dossier client rassemble le cahier des charges et le devis d’un prospect, rattachés à vous. Créez-en un depuis un prospect avec un email, ou téléchargez un cahier des charges ou un devis vierge." } },
    { q: { en: "Where are the video tutorials?", fr: "Où sont les tutoriels vidéo ?" }, a: { en: "In “Video help”, at the top of this page.", fr: "Dans « Aide vidéo », en haut de cette page." } },
  ],
  commissions: [
    { q: { en: "How do my commissions work?", fr: "Comment fonctionnent mes commissions ?" }, a: { en: "You earn your rate on the amount actually collected for the sales attributed to you. Each commission goes pending → available → paid.", fr: "Vous touchez votre taux sur le montant effectivement encaissé des ventes qui vous sont attribuées. Chaque commission passe par en attente → disponible → payée." }, video: "earnings" },
    { q: { en: "When does a commission appear?", fr: "Quand une commission apparaît-elle ?" }, a: { en: "As soon as the client’s payment is confirmed. It stays pending during the validation period shown on the page, then becomes available.", fr: "Dès que le paiement du client est confirmé. Elle reste en attente pendant la période de validation indiquée sur la page, puis devient disponible." }, video: "earnings" },
    { q: { en: "How do I follow a sale?", fr: "Comment suivre une vente ?" }, a: { en: "Sales lists every client brought by you; Recurring shows annual contracts and their renewals; Payouts shows when you are paid.", fr: "Ventes liste chaque client que vous avez apporté ; Récurrent montre les contrats annuels et leurs renouvellements ; Paiements indique quand vous êtes payé." }, video: "earnings" },
  ],
  link: [
    { q: { en: "How does attribution work?", fr: "Comment fonctionne l’attribution ?" }, a: { en: "A sale is attributed to you when the client comes through your link or pages, uses your code at checkout, or buys through a proposal created in your name.", fr: "Une vente vous est attribuée quand le client arrive par votre lien ou vos pages, saisit votre code au paiement, ou achète via une proposition créée à votre nom." }, video: "sales-center" },
  ],
  referrals: [
    { q: { en: "How does referral work?", fr: "Comment fonctionne le parrainage ?" }, a: { en: "Anyone who creates a partner account with your sponsorship link becomes your direct referral. You earn the sponsor share on their eligible sales — never for the sign-up alone.", fr: "Toute personne qui crée un compte partenaire avec votre lien de parrainage devient votre filleul direct. Vous touchez la part parrain sur ses ventes éligibles — jamais pour la simple inscription." }, video: "earnings" },
  ],
  other: [],
};
