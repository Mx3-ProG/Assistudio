/**
 * Supabase Auth email templates in the Studio ATS style — pure (unit-tested).
 *
 * Supabase sends these itself (sign-in codes, invitations, security notices);
 * scripts/supabase-email-templates.ts writes them to supabase/templates/ and
 * installs them through the Supabase Management API. They use Supabase's Go
 * template variables ({{ .Token }}, {{ .ConfirmationURL }}, {{ .Email }},
 * {{ .NewEmail }}), so they are rendered once, in French, with a short English
 * line for international partners.
 *
 * Sign-up and login are by CODE (signInWithOtp → verifyOtp): the "Confirm
 * signup" and "Magic Link" emails show {{ .Token }} and no link, because a link
 * opened on another device cannot finish the sign-in.
 */
import { emailShell } from "./templates.ts";

export type AuthTemplateKey = "confirmation" | "magic_link" | "reauthentication" | "invite" | "recovery" | "email_change";
export type NotificationKey =
  | "password_changed" | "email_changed" | "phone_changed" | "identity_linked" | "identity_unlinked"
  | "mfa_factor_enrolled" | "mfa_factor_unenrolled";

export interface SupabaseTemplate {
  /** Name shown in Supabase → Authentication → Emails. */
  label: string;
  subject: string;
  html: string;
}

/** Template variables these templates are allowed to use (others would break Supabase's renderer). */
export const ALLOWED_VARIABLES = ["{{ .Token }}", "{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .NewEmail }}"];

const TOKEN = "{{ .Token }}";
const SIGNATURE = "L’équipe Studio ATS";
const FOOTER = "Vous recevez cet email en lien avec votre compte Studio ATS. Message de sécurité, sans publicité. Contact : contact@atonservice.org";

interface Copy {
  label: string;
  subject: string;
  preheader: string;
  title: string;
  paragraphs: string[];
  code?: boolean;
  cta?: { label: string; url: string };
  footnote?: string;
  en: string;
}

function build(c: Copy): SupabaseTemplate {
  const html = emailShell({
    lang: "fr", dir: "ltr", subject: c.subject, preheader: c.preheader,
    titleHtml: c.title,
    paragraphsHtml: [...c.paragraphs, `<span style="color:#6b6b6b;font-size:14px;">${c.en}</span>`],
    highlightHtml: c.code ? TOKEN : null,
    cta: c.cta ?? null,
    footnote: c.footnote ?? null,
    signature: SIGNATURE, footer: FOOTER,
  });
  return { label: c.label, subject: c.subject, html };
}

const NOT_YOU = "Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : personne ne peut se connecter sans ce code. Ne le communiquez jamais, même à notre équipe.";

export function authTemplates(appUrl: string): Record<AuthTemplateKey, SupabaseTemplate> {
  const login = `${appUrl.replace(/\/$/, "")}/fr/login`;
  return {
    confirmation: build({
      label: "Confirm signup",
      subject: `Votre code Studio ATS : ${TOKEN}`,
      preheader: "Votre code pour créer votre espace partenaire. Valable 5 minutes.",
      title: "Bienvenue chez Studio ATS.",
      paragraphs: ["Saisissez ce code sur la page d’inscription pour créer votre espace partenaire. Il est valable 5 minutes et ne fonctionne qu’une fois."],
      code: true,
      footnote: NOT_YOU,
      en: "Your Studio ATS sign-up code. Enter it on the sign-up page — valid for 5 minutes.",
    }),
    magic_link: build({
      label: "Magic Link",
      subject: `Votre code de connexion Studio ATS : ${TOKEN}`,
      preheader: "Votre code de connexion. Valable 5 minutes.",
      title: "Votre code de connexion",
      paragraphs: ["Saisissez ce code sur Studio ATS pour vous connecter. Il est valable 5 minutes et ne fonctionne qu’une fois."],
      code: true,
      footnote: NOT_YOU,
      en: "Your Studio ATS sign-in code — valid for 5 minutes, single use.",
    }),
    reauthentication: build({
      label: "Reauthentication",
      subject: `Confirmez votre identité : ${TOKEN}`,
      preheader: "Code de confirmation pour une action sensible.",
      title: "Confirmez qu’il s’agit bien de vous",
      paragraphs: ["Une action sensible a été demandée sur votre compte. Saisissez ce code pour la confirmer."],
      code: true,
      footnote: NOT_YOU,
      en: "Confirm it's you: enter this code to continue.",
    }),
    invite: build({
      label: "Invite user",
      subject: "Vous êtes invité sur Studio ATS",
      preheader: "Votre espace partenaire Studio ATS vous attend.",
      title: "Vous êtes invité sur Studio ATS.",
      paragraphs: [
        "Un accès à Studio ATS a été créé pour l’adresse {{ .Email }}.",
        "Pour entrer, ouvrez la page de connexion et saisissez cette adresse : vous recevrez un code par email. Aucun mot de passe à retenir.",
      ],
      cta: { label: "Me connecter", url: login },
      en: "You've been invited to Studio ATS. Open the sign-in page and enter this email address — we'll send you a code.",
    }),
    recovery: build({
      label: "Reset password",
      subject: "Connexion à Studio ATS",
      preheader: "Studio ATS fonctionne sans mot de passe.",
      title: "Plus besoin de mot de passe.",
      paragraphs: [
        "Studio ATS fonctionne désormais sans mot de passe : à chaque connexion, vous recevez un code par email.",
        "Ouvrez la page de connexion, saisissez {{ .Email }} et utilisez le code reçu.",
      ],
      cta: { label: "Me connecter", url: login },
      footnote: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet email.",
      en: "Studio ATS no longer uses passwords: sign in with the code we email you.",
    }),
    email_change: build({
      label: "Change email address",
      subject: "Confirmez votre nouvelle adresse email",
      preheader: "Confirmez le changement d’adresse de votre compte Studio ATS.",
      title: "Confirmez votre nouvelle adresse",
      paragraphs: ["Vous avez demandé à remplacer {{ .Email }} par {{ .NewEmail }} sur votre compte Studio ATS. Confirmez ce changement avec le bouton ci-dessous."],
      cta: { label: "Confirmer la nouvelle adresse", url: "{{ .ConfirmationURL }}" },
      footnote: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet email et écrivez-nous à contact@atonservice.org.",
      en: "Confirm your new email address for Studio ATS.",
    }),
  };
}

const notice = (label: string, subject: string, title: string, what: string, en: string): SupabaseTemplate =>
  build({
    label, subject, preheader: what, title,
    paragraphs: [what, "Si c’est bien vous, il n’y a rien à faire. Sinon, écrivez-nous immédiatement à contact@atonservice.org."],
    en,
  });

export function notificationTemplates(): Record<NotificationKey, SupabaseTemplate> {
  return {
    password_changed: notice("Password changed", "Sécurité : mot de passe modifié", "Mot de passe modifié", "Le mot de passe de votre compte Studio ATS vient d’être modifié.", "Security notice: your Studio ATS password was changed."),
    email_changed: notice("Email address changed", "Sécurité : adresse email modifiée", "Adresse email modifiée", "L’adresse email de votre compte Studio ATS vient d’être modifiée.", "Security notice: your Studio ATS email address was changed."),
    phone_changed: notice("Phone number changed", "Sécurité : numéro de téléphone modifié", "Numéro de téléphone modifié", "Le numéro de téléphone de votre compte Studio ATS vient d’être modifié.", "Security notice: your Studio ATS phone number was changed."),
    identity_linked: notice("Identity linked", "Sécurité : nouvelle méthode de connexion", "Nouvelle méthode de connexion", "Une nouvelle méthode de connexion (par exemple Google) vient d’être associée à votre compte Studio ATS.", "Security notice: a new sign-in method was linked to your Studio ATS account."),
    identity_unlinked: notice("Identity unlinked", "Sécurité : méthode de connexion retirée", "Méthode de connexion retirée", "Une méthode de connexion vient d’être retirée de votre compte Studio ATS.", "Security notice: a sign-in method was removed from your Studio ATS account."),
    mfa_factor_enrolled: notice("MFA method added", "Sécurité : double authentification ajoutée", "Double authentification ajoutée", "Une méthode de double authentification vient d’être ajoutée à votre compte Studio ATS.", "Security notice: a two-factor method was added to your Studio ATS account."),
    mfa_factor_unenrolled: notice("MFA method removed", "Sécurité : double authentification retirée", "Double authentification retirée", "Une méthode de double authentification vient d’être retirée de votre compte Studio ATS.", "Security notice: a two-factor method was removed from your Studio ATS account."),
  };
}

/** Supabase Management API fields (PATCH /v1/projects/{ref}/config/auth) for the six auth emails. */
export function authConfigPatch(appUrl: string, otp = { length: 6, expirySeconds: 300 }): Record<string, string | number> {
  const t = authTemplates(appUrl);
  const out: Record<string, string | number> = { mailer_otp_length: otp.length, mailer_otp_exp: otp.expirySeconds };
  for (const [key, tpl] of Object.entries(t)) {
    out[`mailer_subjects_${key}`] = tpl.subject;
    out[`mailer_templates_${key}_content`] = tpl.html;
  }
  return out;
}

/** Security notifications: enabled, with subject + content. Sent separately (newer Supabase feature). */
export function notificationConfigPatch(): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const [key, tpl] of Object.entries(notificationTemplates())) {
    out[`mailer_notifications_${key}_enabled`] = true;
    out[`mailer_subjects_${key}_notification`] = tpl.subject;
    out[`mailer_templates_${key}_notification_content`] = tpl.html;
  }
  return out;
}
