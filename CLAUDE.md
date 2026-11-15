# CLAUDE.md – Bryan Didon – Haute Pâtisserie

## Marque
- **Nom** : Bryan Didon – Haute Pâtisserie
- **Localisation** : Guadeloupe
- **Charte graphique** : doré et bleu profond ; style élégant et haut de gamme
- **Logo** : monogramme « BD »
- **Réseaux sociaux** : Instagram, TikTok, Facebook

## Objectif du site
Site vitrine qui présente la marque et **redirige vers l'application de commande click & collect**. Les appels à l'action principaux (« Commander ») pointent vers cette application.

## Commande Click & Collect (Takeat)
- Application de commande d'un ami : **Takeat**, carte complète `https://takeat.fr/bryan-didon/emporter`.
- Intégration « vos propres boutons » : script `https://takeat.fr/widget.js` (`data-slug="bryan-didon"`, `data-mode="produits"`, `data-couleur="#10234b"`) en bas de `index.html`.
- Chaque bouton « Commander » pointe vers le lien du produit (`…/emporter?plat=<id>`) ; un bouton vers toute la carte pointe vers `…/emporter`. Sans le script, ces liens mènent quand même à Takeat.
- **Ne jamais mettre `data-umami-event` sur un lien Takeat** : Umami suit le lien après le clic et ferait quitter le site. Ces liens portent `data-suivi` / `data-suivi-*`, envoyés à Umami par `script.js`.
- Le script Takeat est aussi en bas des pages produits.
- Bouton « Commander Click & Collect » (`data-panier-ou-catalogue`) : panier vide → `/creations` ; panier rempli → panneau Takeat (lu dans `localStorage` `takeat:etat:bryan-didon`).
- **Rester un maximum sur le site** : quand le code d'accès sera retiré, faire pointer le bouton Commander de `liens.html` vers `/creations`.
- Liens produits : galette `091da5f4-b143-4d4c-8de2-aa8ad6f76f74`, bûche vanille `84724e96-a320-4502-a9fe-34a3eb0c1158`, bûche chocolat `f9de2f43-b2e2-47dc-886b-6cee0001b72b`, bûche exotique `a1e3f6e6-128f-41c9-b348-307a985ca5eb`, pâte à tartiner praliné vanille `74bd453e-48f6-4b58-99b2-41d4fa9a115b`.
- Vanille de Madagascar (2, 5 ou 10 gousses : 5 / 12 / 20 €) : **lien Takeat à fournir** ; en attendant, ses boutons pointent vers toute la carte (`…/emporter`).

## Pages produits
- Page `maison.html` (`/maison`) : texte de Bryan sur la maison, mot pour mot ; cible du lien « La Maison » du menu (l'accueil n'en garde qu'un aperçu).
- Page `contact.html` (`/contact`) : le formulaire envoie à la fonction Vercel `api/contact.js`, qui expédie le message à `contact@bryandidon.fr` par le serveur mail OVH (`ssl0.ovh.net`, port 465, via `nodemailer`). Le mot de passe de la boîte est **uniquement** dans la variable d'environnement Vercel `SMTP_MOT_DE_PASSE` : ne jamais l'écrire dans le code ni le demander.
- Catalogue `creations.html` (`/creations`) : toutes les créations en cartes ; c'est la cible du lien « Nos créations » du menu.
- **Prix d'un produit à plusieurs tailles : toujours écrit « à partir de » le plus petit prix** dans les listes (ex. galette « à partir de 26 € »).
- `galette.html`, `buches.html` (parfum choisi via `?parfum=exotique|chocolat|vanille`), `praline.html`, `vanille.html`, servies en `/galette`, `/buches`, `/praline`, `/vanille`.
- Bûches : la description de chaque parfum (parts, couches de haut en bas, pictogrammes allergènes et garanties « sans porc »…) est **dans `index.html` et dans `buches.html`** : modifier les deux. Pictogrammes : symboles `#p-*` du sprite SVG.
- Fiche : recette, ingrédients, allergènes, parts/poids, conservation. Les textes manquants sont marqués `<span class="a-completer">`.

## Newsletter (Brevo)
- Inscription par le pied de page de toutes les pages et par une pop-up (`script.js`) : après 20 s ou à la moitié de la page, jamais sur `/contact` ni `/merci-newsletter`, ni par-dessus l'écran d'accès, le menu ou le panier Takeat. Fermée : revient au bout de 30 jours ; inscrit : jamais (`localStorage` `bd-newsletter`).
- Fonction Vercel `api/newsletter.js` → API Brevo, double opt-in : liste n° 3 « Newsletter site », modèle d'email de confirmation `MODELE_CONFIRMATION`, puis retour sur `/merci-newsletter`.
- La clé API Brevo est **uniquement** dans la variable d'environnement Vercel `BREVO_CLE_API`.
- Domaine `bryandidon.fr` authentifié chez Brevo (code Brevo, DKIM `brevo1/2._domainkey`, DMARC) dans la zone DNS OVH : ne pas supprimer ces lignes.

## Statistiques
- Umami Cloud (sans cookies), script dans le `<head>` de `index.html` et `liens.html`, limité aux domaines `bryandidon.fr` / `www.bryandidon.fr`. Clics suivis via les attributs `data-umami-event`.

## Accès provisoire
- Écran de code (`acces.js`) actif tant que le site n'est pas fini : ne pas le retirer sans l'accord de Bryan.

## Règles techniques
- HTML / CSS / JavaScript simples, **sans framework**
- Déploiement sur **Vercel** depuis GitHub (dépôt `bryandidon/patisserie`, branche `main`)
- **Mobile first** : concevoir d'abord pour mobile, puis adapter aux écrans plus larges
- Tous les textes du site sont **en français**
- Images **optimisées pour le web** (formats WebP/AVIF, dimensions adaptées, `loading="lazy"`, attributs `alt` renseignés)

## Méthode de travail
- **Toujours proposer un plan avant de coder** et attendre la validation de Bryan avant toute modification.
