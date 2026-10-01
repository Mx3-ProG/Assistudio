# Supabase Auth emails (generated — do not edit by hand)

Source: `src/lib/email/supabase-templates.ts`. Regenerate with `npm run supabase:emails -- --write`,
install with `npm run supabase:emails -- --push` (see `scripts/supabase-email-templates.ts`).

| Supabase template | File | Subject |
| --- | --- | --- |
| Confirm signup | `confirmation.html` | Votre code Studio ATS : {{ .Token }} |
| Magic Link | `magic_link.html` | Votre code de connexion Studio ATS : {{ .Token }} |
| Reauthentication | `reauthentication.html` | Confirmez votre identité : {{ .Token }} |
| Invite user | `invite.html` | Vous êtes invité sur Studio ATS |
| Reset password | `recovery.html` | Connexion à Studio ATS |
| Change email address | `email_change.html` | Confirmez votre nouvelle adresse email |
| Password changed | `password_changed.html` | Sécurité : mot de passe modifié |
| Email address changed | `email_changed.html` | Sécurité : adresse email modifiée |
| Phone number changed | `phone_changed.html` | Sécurité : numéro de téléphone modifié |
| Identity linked | `identity_linked.html` | Sécurité : nouvelle méthode de connexion |
| Identity unlinked | `identity_unlinked.html` | Sécurité : méthode de connexion retirée |
| MFA method added | `mfa_factor_enrolled.html` | Sécurité : double authentification ajoutée |
| MFA method removed | `mfa_factor_unenrolled.html` | Sécurité : double authentification retirée |
