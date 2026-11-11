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
- Liens produits : galette `091da5f4-b143-4d4c-8de2-aa8ad6f76f74`, bûche vanille `84724e96-a320-4502-a9fe-34a3eb0c1158`, bûche chocolat `f9de2f43-b2e2-47dc-886b-6cee0001b72b`, bûche exotique `a1e3f6e6-128f-41c9-b348-307a985ca5eb`, pâte à tartiner praliné vanille `74bd453e-48f6-4b58-99b2-41d4fa9a115b`.

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
