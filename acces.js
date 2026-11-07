/* Écran d'accès provisoire – le temps de finir le site.
   Seule l'empreinte SHA-256 du code est stockée ici, jamais le code lui-même.
   Pour ouvrir le site au public : supprimer ce fichier, la ligne <script src="acces.js">
   et la balise <meta name="robots" content="noindex"> dans index.html. */
(function () {
  var EMPREINTE = 'e4c494cbcb3f4dadcf8945d3d13b61bee1a5c56bb2b2e3baeef08be7079b400f';
  var CLE = 'bd-acces';
  var DUREE = 30 * 24 * 60 * 60 * 1000; // 30 jours
  var root = document.documentElement;

  function dejaAutorise() {
    try {
      var data = JSON.parse(localStorage.getItem(CLE) || 'null');
      return data && data.e === EMPREINTE && Date.now() - data.t < DUREE;
    } catch (e) { return false; }
  }

  function memoriser() {
    try { localStorage.setItem(CLE, JSON.stringify({ e: EMPREINTE, t: Date.now() })); } catch (e) {}
  }

  async function empreinte(texte) {
    var octets = new TextEncoder().encode(texte);
    var hash = await crypto.subtle.digest('SHA-256', octets);
    return Array.from(new Uint8Array(hash)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  if (dejaAutorise()) return;
  root.classList.add('verrou');

  document.addEventListener('DOMContentLoaded', function () {
    var ecran = document.createElement('div');
    ecran.className = 'acces';
    ecran.setAttribute('role', 'dialog');
    ecran.setAttribute('aria-modal', 'true');
    ecran.setAttribute('aria-labelledby', 'acces-titre');
    ecran.innerHTML =
      '<div class="acces__carte">' +
        '<img class="acces__logo" src="images/logo-bryan-didon.png" alt="Bryan Didon, Haute Pâtisserie" width="1358" height="786">' +
        '<svg class="lys" aria-hidden="true"><use href="#lys"/></svg>' +
        '<h1 class="acces__titre" id="acces-titre">Site en cours de finition</h1>' +
        '<p class="acces__texte">Saisissez le code d\'accès pour découvrir l\'avant-première.</p>' +
        '<form class="acces__form" novalidate>' +
          '<label class="sr" for="acces-code">Code d\'accès</label>' +
          '<input class="acces__champ" id="acces-code" type="password" autocomplete="current-password" placeholder="Code d\'accès" required>' +
          '<button class="pill acces__bouton" type="submit">Entrer</button>' +
          '<p class="acces__erreur" role="alert" aria-live="assertive"></p>' +
        '</form>' +
      '</div>';
    document.body.appendChild(ecran);

    var form = ecran.querySelector('form');
    var champ = ecran.querySelector('input');
    var erreur = ecran.querySelector('.acces__erreur');
    champ.focus();

    form.addEventListener('submit', async function (ev) {
      ev.preventDefault();
      var valeur = champ.value.trim();
      if (!valeur) { erreur.textContent = 'Veuillez saisir le code.'; return; }
      if (await empreinte(valeur) === EMPREINTE) {
        memoriser();
        try { if (window.umami) window.umami.track('Accès au site débloqué'); } catch (e) {}
        root.classList.remove('verrou');
        ecran.remove();
        window.scrollTo(0, 0);
      } else {
        erreur.textContent = 'Code incorrect.';
        champ.value = '';
        champ.focus();
        form.classList.remove('acces__form--erreur');
        void form.offsetWidth;
        form.classList.add('acces__form--erreur');
      }
    });
  });
})();
