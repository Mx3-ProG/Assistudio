# Checklist de publication et de nouvelle demande AdSense

Le code livré reste volontairement sans annonce pendant l'examen. La propriété AdSense est vérifiable grâce à `ads.txt` et à la balise `google-adsense-account` présente sur les pages publiques.

## Avant le déploiement

- Compléter et faire valider les mentions légales de Wayne-Web avec sa raison sociale exacte, son adresse de siège, son SIREN/RCS et les informations exigées pour son statut. Ne pas inventer ces données.
- Faire relire les six guides par Inès et confirmer que les exemples anonymisés, le parcours professionnel, les chiffres et les témoignages peuvent être justifiés.
- Confirmer que chaque photo publiée est une photo réelle dont Inès ou Wayne-Web possède le droit d'utilisation. Les visuels actuellement disponibles dans `assets/` ont été réemployés comme couvertures ; remplacer tout visuel de démonstration ou généré avant publication.
- Vérifier que `https://www.conciergeriestmarie.com` reste le domaine final et que la variante sans `www` redirige en une seule étape.
- Déployer le nouveau fichier vidéo `assets/salle-de-bain-rangee.mp4`; l'ancien MOV de 18 Mo a été retiré.

## Search Console

1. Envoyer `https://www.conciergeriestmarie.com/sitemap.xml`.
2. Inspecter `conseils.html` puis les six URL sous `/conseils/`.
3. Demander l'indexation après le déploiement et corriger toute exclusion autre que les pages `/admin/`.
4. Vérifier les données structurées `LocalBusiness`, `Person`, `Article` et `BreadcrumbList`.
5. Attendre que le hub et les guides soient indexés et commencent à recevoir des impressions avant la nouvelle demande AdSense.

## AdSense pendant l'examen

- Ajouter dans AdSense le site exact `www.conciergeriestmarie.com`.
- Vérifier que `ads.txt` est indiqué comme trouvé et autorisé.
- Ne pas activer les annonces automatiques.
- Ne pas ajouter de bloc publicitaire fictif ou d'identifiant temporaire.

## Après une éventuelle approbation

1. Dans **Confidentialité et messages**, activer la CMP Google pour les réglementations européennes avec les trois choix : accepter, refuser, gérer les options.
2. Vérifier qu'elle est bien configurée pour l'EEE, le Royaume-Uni et la Suisse et qu'elle utilise la version TCF alors en vigueur.
3. Créer un seul bloc responsive officiel dédié aux guides et récupérer son véritable `data-ad-slot`.
4. Charger le script AdSense uniquement sur les six pages de guides et uniquement selon les signaux transmis par la CMP certifiée.
5. Placer un seul bloc après une section substantielle. Ne jamais l'ajouter à l'accueil, aux services, à propos, contact, rendez-vous, mentions légales ou au hub.
6. Mettre à jour la politique de confidentialité pour décrire les traitements réellement activés.
7. Tester accepter, refuser, retrait du consentement, navigation mobile et absence de requête publicitaire avant consentement.

L'approbation reste une décision de Google et n'est pas garantie par un nombre de pages ou de mots.
