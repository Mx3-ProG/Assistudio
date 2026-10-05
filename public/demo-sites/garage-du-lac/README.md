# Garage Du Lac — site vitrine + back-office

Site multilingue pour **Garage Du Lac**, atelier de réparation automobile à
Saint-Gingolph (Valais, Suisse). Réalisé par **Wayne-Web** — https://www.wayne-web.com

Aucune dépendance, aucun build : HTML + CSS + JavaScript natif. Le site se
déploie tel quel sur n'importe quel hébergeur statique (Vercel, Netlify, Nginx,
Apache, o2switch, Infomaniak…).

---

## Démarrer en local

```bash
python3 -m http.server 4321
```

Puis ouvrir http://localhost:4321

---

## Arborescence

```
index.html                  Accueil
services.html               Nos prestations (+ « Vous aimerez aussi »)
about.html                  Qui sommes-nous
blog.html                   Blog & conseils
faq.html                    Questions fréquentes
contact.html                Contact & demande de rendez-vous
admin/login.html            Espace sécurisé (authentification)
admin/dashboard.html        Tableau de bord admin / super-admin
legal/cookies.html          Politique cookies
legal/rgpd.html             RGPD / LPD
legal/confidentialite.html  Confidentialité
legal/cgu.html              Conditions générales d'utilisation

assets/css/main.css         Design system (tokens, composants, responsive)
assets/css/admin.css        Interface d'administration
assets/js/translations.js   Dictionnaires FR / EN / DE / ES / IT
assets/js/site.js           Runtime : i18n, header, footer, scroll-top, cookies, formulaires
assets/js/catalog.js        Rendu partagé : prestations, articles, icônes
assets/js/store.js          Couche de données (localStorage en démo)
assets/js/dashboard.js      Logique du tableau de bord
assets/js/legal.js          Contenu des 4 pages légales dans les 5 langues
```

---

## Les 5 langues

Français (défaut) · English · Deutsch · Español · Italiano.

L'italien a été retenu comme cinquième langue : Saint-Gingolph est une commune
frontalière du Chablais, sur un axe très fréquenté par la clientèle italienne et
tessinoise. Il se remplace en quelques minutes si vous préférez une autre langue.

**Ajouter ou remplacer une langue**

1. Ajouter l'entrée dans `GDL_LANGS` (haut de `assets/js/translations.js`).
2. Dupliquer un bloc de langue complet (`fr:`, `en:`…) et le traduire.
3. Ajouter le bloc correspondant dans les 4 rubriques de `assets/js/legal.js`.

Toute clé manquante retombe automatiquement sur le français : une traduction
incomplète ne casse jamais l'affichage.

**Dans les pages** : `data-i18n="chemin.de.la.cle"` remplace le texte,
`data-i18n-html` autorise le HTML, `data-i18n-attr="placeholder:form.namePh"`
traduit un attribut. Le choix de langue est mémorisé et `?lang=de` force une langue.

---

## Éléments présents sur toutes les pages

- **Header sticky** avec navigation, sélecteur de langue (5 drapeaux), bascule
  clair/sombre et bouton d'appel à l'action. Tiroir plein écran sous 1040 px.
- **Footer** avec les 4 pages légales et la mention obligatoire :
  *éditeur et hébergeur = Wayne-Web (www.wayne-web.com)*.
- **Bouton de retour en haut de page**, apparaissant après 420 px de défilement.
- **Bandeau cookies** avec accepter / refuser, choix mémorisé.
- **Blocs « Fonctions à venir »** : modules présentés, verrouillés, avec appel à
  l'action pour les débloquer.

## Avis Google

Chaque section d'avis (accueil et « Qui sommes-nous ») se termine par un bloc
**« Nous noter sur Google »** : note 5,0 sur 37 avis, bouton principal rouge vers
la fiche Google, lien secondaire pour lire les avis, et une note précisant qu'un
compte Google est nécessaire. Un bouton « Laisser un avis » figure également dans
le footer, sur toutes les pages. Tout est traduit dans les 5 langues.

L'URL de la fiche est centralisée dans **une seule constante** :
`GOOGLE_REVIEWS_URL`, en haut de `assets/js/catalog.js`. C'est le seul endroit à
modifier si la fiche Google change.

> Le lien ouvre l'onglet « Avis » de la fiche Google Maps. Google propose aussi
> des liens d'écriture directe (`https://search.google.com/local/writereview?placeid=…`)
> qui ouvrent le formulaire de notation en un clic : ils demandent le `place_id`
> officiel de l'établissement, récupérable depuis le compte Google Business
> Profile du garage. Si vous l'obtenez, remplacez simplement la constante pour
> gagner une étape dans le parcours.

---

## Tableau de bord

Accès : `admin/login.html`

| Identifiant  | Mot de passe | Rôle                  |
|--------------|--------------|-----------------------|
| `admin`      | `admin2026`  | Administrateur        |
| `superadmin` | `super2026`  | Super-administrateur  |

**Administrateur**
- Vue d'ensemble : demandes reçues, en attente, acceptées, chiffre potentiel.
- Demandes & commandes : **accepter / refuser** chaque demande, bouton de
  **relance client** (fonction avancée, verrouillée).
- Clients : fiches dérivées des demandes (nom, e-mail, téléphone, véhicule,
  nombre de demandes, total, dernière visite), appel et e-mail en un clic.
- Prestations : modification du **titre, de l'image, du prix, de la description
  courte SEO et de la description longue**. Les changements sont visibles
  immédiatement sur le site public (grille, fiches, footer, formulaires).

**Super-administrateur** — tout ce qui précède, plus :
- Journal complet : connexions réussies et échouées, actions administratives,
  pages vues, consentements cookies, horodatage et origine.
- Table « Visiteurs identifiés » : nom, prénom, e-mail et téléphone des
  personnes ayant rempli un formulaire. Le traçage complet (parcours, IP
  nominative) est prévu et présenté comme module à activer, car il exige le
  consentement RGPD et un module Analytics.

Pour l'administrateur simple, l'onglet Journal affiche un écran d'accès restreint.

---

## ⚠️ Avant la mise en production

Le site est livré en **mode démonstration** : les données (demandes, prestations,
journaux, session) vivent dans le `localStorage` du navigateur et ne transitent
par aucun serveur. Deux points doivent impérativement être repris avant
d'exposer le site publiquement :

1. **L'authentification est factice.** La vérification dans
   `admin/login.html` s'exécute côté navigateur : les identifiants sont lisibles
   dans le code source et ne protègent rien. Il faut la remplacer par un appel à
   une API (`POST /api/login`) qui vérifie le mot de passe côté serveur (hachage
   Argon2 ou bcrypt) et pose un cookie de session `httpOnly`. Tant que ce n'est
   pas fait, l'espace admin doit rester protégé au niveau de l'hébergeur
   (mot de passe HTTP, restriction d'IP) ou hors ligne.

2. **Les formulaires n'envoient rien.** `initForms()` dans `assets/js/site.js`
   enregistre la demande localement. Il faut y brancher l'envoi réel (API, service
   de mail, ou une plateforme type Formspree) pour que le garage reçoive
   les demandes.

Le reste — structure, i18n, design system, back-office, pages légales — est prêt.
Pour passer en base de données, seules les fonctions de `assets/js/store.js`
sont à réécrire : le reste du code ne s'adresse qu'à cette couche.

---

## Contenu à compléter

- Photos réelles de l'atelier et de l'équipe (`assets/img/`), puis renseigner
  le champ image de chaque prestation depuis le tableau de bord.
- Adresse e-mail définitive (`contact@garagedulac.ch` est un exemple).
- Les **prix affichés sont des ordres de grandeur** : à valider par le garage
  avant publication.
- Horaires exacts : la fiche Google indique une ouverture à 07:30 et une
  fermeture à 18:00 ; la pause de midi indiquée sur le site est à confirmer.
- Les articles du blog ont un titre et un chapô mais pas encore de page de
  contenu détaillée.

---

## Accessibilité & performance

- Contrastes conformes WCAG AA, focus visible au clavier, `aria-label` sur les
  contrôles iconographiques, navigation au clavier complète.
- `prefers-reduced-motion` respecté (animations et défilement doux désactivés).
- Aucune police ni image bloquante, aucun framework : premier rendu quasi immédiat.
- Testé de 375 px à 1440 px, sans défilement horizontal.
- Données structurées `AutoRepair` (accueil) et `FAQPage` (FAQ) pour le SEO.
