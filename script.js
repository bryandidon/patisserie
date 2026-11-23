// Statistiques : exclure ses propres visites sur cet appareil.
// Ouvrir une fois https://www.bryandidon.fr/?moi=1 (et ?moi=0 pour annuler).
// Ce script s'exécute avant celui d'Umami (chargé en "defer"), donc le réglage s'applique dès cette visite.
try {
  const moi = new URLSearchParams(location.search).get('moi');
  if (moi === '1') localStorage.setItem('umami.disabled', '1');
  if (moi === '0') localStorage.removeItem('umami.disabled');
} catch (e) {}

// Navigation : fond ivoire dès qu'on quitte le haut de page
const nav = document.querySelector('[data-nav]');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 30);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menu mobile
const menuBtn = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-menu]');
if (menuBtn && menu) {
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    menu.hidden = !open;
  };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
}

// Lien actif selon la section visible
const links = document.querySelectorAll('.nav__side a');
const sections = ['top', 'maison', 'contact'].map((id) => document.getElementById(id)).filter(Boolean);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => {
        if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

// Carrousel en cercle
// Les pièces sont posées sur une ellipse : celle de devant en grand,
// les autres plus petites derrière. Au survol de la souris, la ronde tourne ;
// quand la souris sort, elle s'arrête sur la pièce la plus proche.
const carousel = document.querySelector('[data-carousel]');
if (carousel) {
  const items = [...carousel.querySelectorAll('.carousel__item')];
  const nameOut = carousel.querySelector('[data-name-out]');
  const N = items.length;
  const step = (Math.PI * 2) / N;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let angle = 0;        // angle actuel de la ronde
  let target = 0;       // angle visé quand on s'arrête
  let spinning = false; // vrai pendant le survol
  let last = performance.now();
  const SPEED = 0.55;   // radians par seconde pendant le survol
  const TILT = 0.24;    // inclinaison du cercle (0 = à plat, plus grand = plus penché)

  const front = () => ((Math.round(-angle / step) % N) + N) % N;

  const layout = () => {
    const w = carousel.clientWidth;
    const itemW = items[0].offsetWidth;
    const radius = itemW * 0.8;
    items.forEach((el, i) => {
      const t = i * step + angle;
      const depth = Math.cos(t);              // 1 devant, -1 derrière
      const x = Math.sin(t) * radius;
      const k = (depth + 1) / 2;              // 0 derrière, 1 devant
      // Cercle penché vers l'avant : plus une pièce est loin, plus elle est petite et haute
      const scale = 0.5 + 0.5 * Math.pow(k, 1.6);
      const y = -(1 - depth) * radius * TILT;
      const opacity = Math.min(1, Math.max(0, (depth + 0.75) / 0.6));
      el.style.transform = `translate(-50%, 0) translate(${x}px, ${y}px) scale(${scale})`;
      el.style.opacity = opacity;
      el.style.zIndex = String(Math.round(k * 100));
      el.style.filter = `saturate(${0.8 + 0.2 * k})`;
    });
    const f = front();
    items.forEach((el, i) => el.setAttribute('aria-hidden', String(i !== f)));
    if (nameOut && nameOut.textContent !== items[f].dataset.name) nameOut.textContent = items[f].dataset.name;
  };

  const tick = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (spinning) {
      angle -= SPEED * dt;
      target = Math.round(angle / step) * step;
    } else {
      angle += (target - angle) * Math.min(1, dt * 7);
      if (Math.abs(target - angle) < 0.0005) angle = target;
    }
    layout();
    requestAnimationFrame(tick);
  };

  const go = (dir) => {
    spinning = false;
    target = Math.round(angle / step) * step - dir * step;
    if (reduceMotion) { angle = target; layout(); }
  };

  if (!reduceMotion) {
    carousel.querySelector('.carousel__ring').addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') spinning = true; });
    carousel.querySelector('.carousel__ring').addEventListener('pointerleave', () => {
      spinning = false;
      target = Math.round(angle / step) * step;
    });
    requestAnimationFrame((t) => { last = t; tick(t); });
  } else {
    layout();
  }

  carousel.querySelector('[data-prev]').addEventListener('click', () => go(-1));
  carousel.querySelector('[data-next]').addEventListener('click', () => go(1));

  // Clic sur une pièce de côté : elle passe devant
  items.forEach((el, i) => el.addEventListener('click', () => {
    spinning = false;
    let d = (i - front() + N) % N;
    if (d > N / 2) d -= N;
    target = Math.round(angle / step) * step - d * step;
    if (reduceMotion) { angle = target; layout(); }
  }));

  // Glisser du doigt sur mobile
  let startX = null;
  carousel.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  carousel.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    startX = null;
  });

  window.addEventListener('resize', layout);
  layout();
}

// Bûches : changer de parfum (accueil, création à la une, et page /buches)
// La photo, le bouton Commander, la fiche et le lien « Voir la composition » suivent le parfum choisi.
const parfums = document.querySelector('[data-parfums]');
if (parfums) {
  const imgs = parfums.querySelectorAll('[data-parfum]');
  const btns = parfums.querySelectorAll('[data-parfum-btn]');
  const choisir = (choix) => {
    imgs.forEach((img) => img.classList.toggle('is-active', img.dataset.parfum === choix));
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.parfumBtn === choix)));
    document.querySelectorAll('[data-parfum-commande]').forEach((el) => { el.hidden = el.dataset.parfumCommande !== choix; });
    document.querySelectorAll('[data-parfum-detail]').forEach((el) => { el.hidden = el.dataset.parfumDetail !== choix; });
    document.querySelectorAll('[data-parfum-lien]').forEach((a) => { a.href = '/buches?parfum=' + choix; });
  };
  btns.forEach((btn) => btn.addEventListener('click', () => choisir(btn.dataset.parfumBtn)));
  // Arrivée depuis l'accueil avec un parfum déjà choisi : /buches?parfum=chocolat
  const demande = new URLSearchParams(location.search).get('parfum');
  if (demande && parfums.querySelector('[data-parfum-btn="' + demande + '"]')) choisir(demande);
}

// Bûches (/buches) : galerie découpe / profil / dessus. On fait glisser la photo du doigt,
// ou on choisit une vue avec les vignettes.
document.querySelectorAll('[data-galerie]').forEach((galerie) => {
  const piste = galerie.querySelector('.galerie__piste');
  const vignettes = galerie.querySelectorAll('[data-vue]');
  const marquer = (i) => vignettes.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
  vignettes.forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.vue);
    const doux = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
    piste.scrollTo({ left: i * piste.clientWidth, behavior: doux ? 'smooth' : 'auto' });
    marquer(i);
    try { if (window.umami) window.umami.track('Bûche : vue', { vue: b.textContent.trim(), parfum: galerie.dataset.parfumDetail }); } catch (e) {}
  }));
  let attente;
  piste.addEventListener('scroll', () => {
    clearTimeout(attente);
    attente = setTimeout(() => marquer(Math.round(piste.scrollLeft / piste.clientWidth)), 80);
  }, { passive: true });
});

// Bouton « Commander Click & Collect » : panier vide -> la liste des créations ;
// panier rempli -> on laisse Takeat ouvrir le panier sur le côté.
// Le nombre d'articles est celui que le script Takeat garde dans le navigateur.
const articlesAuPanier = () => {
  try {
    const etat = JSON.parse(localStorage.getItem('takeat:etat:bryan-didon') || 'null');
    return (etat && Number(etat.articles)) || 0;
  } catch (err) { return 0; }
};
// Écouté sur window, en capture : passe avant le script Takeat (écouté sur document).
window.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('[data-panier-ou-catalogue]');
  if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (articlesAuPanier() > 0) return;
  e.preventDefault();
  e.stopPropagation();
  try { if (window.umami) window.umami.track('Commander', { depuis: a.dataset.suiviDepuis || '', vers: 'catalogue (panier vide)' }); } catch (err) {}
  const vitrine = document.querySelector('.vitrine');
  if (vitrine) window.scrollTo({ top: 0, behavior: 'smooth' });
  else location.href = '/creations';
}, true);

// Statistiques des boutons Commander (liens Takeat).
// Ils portent data-suivi et non data-umami-event : Umami, après avoir compté le clic,
// suit le lien et ferait quitter le site, alors que Takeat ajoute au panier sur place.
document.addEventListener('click', (e) => {
  const el = e.target.closest && e.target.closest('[data-suivi]');
  if (!el) return;
  const infos = {};
  [...el.attributes].forEach((a) => {
    if (a.name.startsWith('data-suivi-')) infos[a.name.slice(11)] = a.value;
  });
  try { if (window.umami) window.umami.track(el.dataset.suivi, infos); } catch (err) {}
}, true);

// Année du pied de page
const year = document.querySelector('[data-year]');
if (year) year.textContent = new Date().getFullYear();

// Formulaire de contact (/contact)
// Envoi par la fonction Vercel /api/contact (serveur mail OVH), sans quitter la page.
// En cas d'échec : on propose d'écrire directement à l'adresse de contact.
const formulaire = document.querySelector('[data-contact]');
if (formulaire) {
  const erreur = formulaire.querySelector('.formulaire__erreur');
  const bouton = formulaire.querySelector('button[type="submit"]');
  const merci = document.querySelector('.formulaire__merci');
  const email = formulaire.dataset.email;
  formulaire.addEventListener('submit', async (e) => {
    e.preventDefault();
    erreur.textContent = '';
    let premier = null;
    formulaire.querySelectorAll('[required]').forEach((champ) => {
      const ok = champ.checkValidity();
      champ.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok && !premier) premier = champ;
    });
    if (premier) {
      erreur.textContent = premier.type === 'email' && premier.value ? 'Cette adresse email ne semble pas valide.' : 'Merci de remplir les champs nom, email et message.';
      premier.focus();
      return;
    }
    const d = Object.fromEntries(new FormData(formulaire));
    if (d.botcheck) return;
    bouton.disabled = true;
    try {
      const rep = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(d),
      });
      const res = await rep.json().catch(() => ({}));
      if (!rep.ok || !res.ok) throw new Error(res.erreur || 'envoi');
      try { if (window.umami) window.umami.track('Message envoyé', { sujet: d.sujet }); } catch (err) {}
      formulaire.hidden = true;
      merci.hidden = false;
      merci.focus();
    } catch (err) {
      erreur.innerHTML = 'L’envoi n’a pas fonctionné. Écrivez-nous directement à <a href="mailto:' + email + '">' + email + '</a>.';
      bouton.disabled = false;
    }
  });
}

// Newsletter : inscription (pied de page et pop-up) par la fonction Vercel /api/newsletter (Brevo).
// Brevo envoie ensuite un email « Confirmez votre inscription » (double opt-in).
const NL_CLE = 'bd-newsletter';
const nlLire = () => { try { return JSON.parse(localStorage.getItem(NL_CLE) || 'null'); } catch (e) { return null; } };
const nlNoter = (etat) => { try { localStorage.setItem(NL_CLE, JSON.stringify({ etat, t: Date.now() })); } catch (e) {} };

const nlBrancher = (form) => {
  const retour = form.querySelector('.newsletter__retour');
  const champ = form.querySelector('input[type="email"]');
  const bouton = form.querySelector('button[type="submit"]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    retour.classList.remove('newsletter__retour--erreur');
    if (!champ.checkValidity()) {
      retour.textContent = champ.value ? 'Cette adresse email ne semble pas valide.' : 'Merci d’indiquer votre email.';
      retour.classList.add('newsletter__retour--erreur');
      champ.setAttribute('aria-invalid', 'true');
      champ.focus();
      return;
    }
    champ.removeAttribute('aria-invalid');
    const d = Object.fromEntries(new FormData(form));
    if (d.botcheck) return;
    bouton.disabled = true;
    try {
      const rep = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: d.email }),
      });
      const res = await rep.json().catch(() => ({}));
      if (!rep.ok || !res.ok) throw new Error(res.erreur || 'envoi');
      nlNoter('inscrit');
      try { if (window.umami) window.umami.track('Newsletter : inscription', { depuis: form.dataset.newsletter }); } catch (err) {}
      form.classList.add('is-envoye');
      retour.textContent = 'Merci ! Un email de confirmation vient de vous être envoyé : cliquez sur le lien qu’il contient pour valider votre inscription.';
    } catch (err) {
      retour.textContent = 'L’inscription n’a pas fonctionné. Merci de réessayer dans un instant.';
      retour.classList.add('newsletter__retour--erreur');
      bouton.disabled = false;
    }
  });
};
document.querySelectorAll('form[data-newsletter]').forEach(nlBrancher);

// Pop-up : après 20 secondes ou à la moitié de la page, une seule fois.
// Fermée : ne revient pas avant 30 jours. Inscrit : ne revient jamais.
(() => {
  const chemin = location.pathname.replace(/\.html$/, '');
  if (chemin === '/contact' || chemin === '/merci-newsletter') return;
  if (typeof HTMLDialogElement !== 'function') return;
  const deja = nlLire();
  if (deja && (deja.etat === 'inscrit' || Date.now() - deja.t < 30 * 24 * 60 * 60 * 1000)) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'nl-pop';
  dialog.setAttribute('aria-labelledby', 'nl-pop-titre');
  dialog.innerHTML =
    '<div class="nl-pop__carte">' +
      '<button class="nl-pop__fermer" type="button" aria-label="Fermer">×</button>' +
      '<svg class="lys" aria-hidden="true"><use href="#lys"/></svg>' +
      '<p class="nl-pop__surtitre">Newsletter</p>' +
      '<h2 class="nl-pop__titre" id="nl-pop-titre" tabindex="-1" autofocus>Les nouvelles créations, en avant-première</h2>' +
      '<p class="nl-pop__texte">Nouveautés, avant-premières et offres exclusives : soyez les premiers informés.</p>' +
      '<form class="nl-pop__form" data-newsletter="pop-up" novalidate>' +
        '<input type="checkbox" name="botcheck" class="formulaire__piege" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<label class="sr" for="nl-pop-email">Votre email</label>' +
        '<input id="nl-pop-email" name="email" type="email" autocomplete="email" inputmode="email" placeholder="Votre email" required>' +
        '<button class="pill pill--cta" type="submit">Je m’inscris</button>' +
        '<p class="newsletter__retour" role="status" aria-live="polite"></p>' +
      '</form>' +
      '<p class="nl-pop__mention">Un email par nouvelle collection. Désinscription en un clic.</p>' +
    '</div>';
  document.body.appendChild(dialog);
  nlBrancher(dialog.querySelector('form'));

  const fermer = () => { if (dialog.open) dialog.close(); };
  dialog.querySelector('.nl-pop__fermer').addEventListener('click', fermer);
  dialog.addEventListener('click', (e) => { if (e.target === dialog) fermer(); });
  dialog.addEventListener('close', () => {
    const etat = nlLire();
    if (!etat || etat.etat !== 'inscrit') nlNoter('ferme');
    try { if (window.umami) window.umami.track('Newsletter : pop-up fermée'); } catch (err) {}
  });

  let fait = false;
  const ouvrir = () => {
    if (fait) return;
    // Pas par-dessus l'écran d'accès, le menu mobile ou le panier Takeat : on réessaie plus tard.
    const occupe = document.documentElement.classList.contains('verrou') ||
      document.querySelector('[data-menu]:not([hidden])') ||
      [...document.querySelectorAll('iframe[src*="takeat.fr"]')].some((f) => {
        const r = f.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left < innerWidth && r.right > 0 && getComputedStyle(f).visibility !== 'hidden';
      });
    if (occupe) { setTimeout(ouvrir, 5000); return; }
    fait = true;
    window.removeEventListener('scroll', auDefilement);
    dialog.showModal();
    try { if (window.umami) window.umami.track('Newsletter : pop-up affichée'); } catch (err) {}
  };
  const auDefilement = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    if (h > 0 && scrollY / h >= 0.5) ouvrir();
  };
  setTimeout(ouvrir, 20000);
  window.addEventListener('scroll', auDefilement, { passive: true });
})();

// Hauteur du menu du haut : les onglets du catalogue se calent juste dessous.
if (nav && 'ResizeObserver' in window) {
  new ResizeObserver(() => document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px')).observe(nav);
}

// Catalogue (/creations) : onglets par catégorie. /creations?categorie=tartiner ouvre directement un onglet.
const filtres = document.querySelector('[data-filtres]');
if (filtres) {
  const boutons = filtres.querySelectorAll('[data-filtre]');
  const cartes = document.querySelectorAll('.vitrine [data-categorie]');
  const vitrine = document.getElementById('vitrine');
  const filtrer = (cat, parClic) => {
    boutons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filtre === cat)));
    cartes.forEach((c) => { c.hidden = cat !== 'tout' && c.dataset.categorie !== cat; });
    try { history.replaceState(null, '', cat === 'tout' ? location.pathname : '?categorie=' + cat); } catch (e) {}
    if (!parClic) return;
    try { if (window.umami) window.umami.track('Catalogue : catégorie', { categorie: cat }); } catch (e) {}
    // Si on avait défilé plus bas, on remonte au début de la liste.
    const haut = vitrine.getBoundingClientRect().top - filtres.getBoundingClientRect().bottom;
    if (haut < 0) window.scrollTo({ top: window.scrollY + haut - 12, behavior: 'smooth' });
  };
  boutons.forEach((b) => b.addEventListener('click', () => filtrer(b.dataset.filtre, true)));
  const demande = new URLSearchParams(location.search).get('categorie');
  if (demande && filtres.querySelector('[data-filtre="' + demande + '"]')) filtrer(demande, false);
}

// Barre « Commander » en bas de l'écran (téléphone, tablette ; cachée sur ordinateur par styles.css).
// Accueil et pages produits. Elle apparaît quand aucun bouton Commander n'est à l'écran,
// et seulement panier vide : panier rempli, Takeat affiche son propre bouton « Panier ».
(() => {
  if (!('IntersectionObserver' in window)) return;
  const fiche = document.querySelector('.produit__texte');
  const accueil = document.querySelector('.hero');
  if (!fiche && !accueil) return;
  const chevron = '<svg class="pill__chevron" aria-hidden="true"><use href="#chevron"/></svg>';
  const barre = document.createElement('div');
  barre.className = 'barre';
  let nom = 'Click &amp; Collect';
  let info = 'Retrait à l’heure choisie';
  if (fiche) {
    const titre = fiche.querySelector('.produit__titre');
    const prix = fiche.querySelector('.card__prix');
    const premier = fiche.querySelector('.prices dd');
    nom = titre ? titre.innerHTML : nom;
    info = prix ? prix.textContent.trim() : premier ? 'à partir de ' + premier.textContent.trim() : '';
    barre.innerHTML = '<p class="barre__texte"><span class="barre__nom"></span><span class="barre__info"></span></p>'
      + '<button class="pill pill--cta" type="button">Commander ' + chevron + '</button>';
    // Le bouton reprend le bouton Commander de la fiche (pour les bûches : celui du parfum choisi).
    barre.querySelector('button').addEventListener('click', () => {
      const lien = [...fiche.querySelectorAll('.card__commande')].find((a) => !a.closest('[hidden]'));
      if (lien) lien.click();
    });
  } else {
    barre.innerHTML = '<p class="barre__texte"><span class="barre__nom"></span><span class="barre__info"></span></p>'
      + '<a class="pill pill--cta" href="https://takeat.fr/bryan-didon/emporter" data-panier-ou-catalogue data-suivi="Commander" data-suivi-depuis="barre du bas">'
      + '<svg class="pill__icon" aria-hidden="true"><use href="#sac"/></svg>Commander</a>';
  }
  barre.querySelector('.barre__nom').innerHTML = nom;
  barre.querySelector('.barre__info').textContent = info;
  if (!info) barre.querySelector('.barre__info').remove();
  document.body.appendChild(barre);

  // Ce qui, à l'écran, rend la barre inutile : un bouton Commander, le haut de l'accueil, le pied de page.
  const cibles = document.querySelectorAll('.hero, .order, .saveur .card__commande, .produit__texte .card__commande, .footer');
  const visibles = new Set();
  let pret = false;
  const maj = () => {
    if (!pret) return;
    const menuOuvert = menu && !menu.hidden;
    barre.classList.toggle('is-visible', visibles.size === 0 && !menuOuvert && articlesAuPanier() === 0);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) visibles.add(en.target); else visibles.delete(en.target); });
    pret = true;
    maj();
  });
  cibles.forEach((el) => io.observe(el));
  setInterval(maj, 1000);
  document.addEventListener('click', () => setTimeout(maj, 50));
})();

// Apparition douce des blocs au défilement. Seulement pour ce qui est sous le premier écran,
// et pas si le téléphone demande moins d'animations.
(() => {
  if (!('IntersectionObserver' in window) || !window.matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-vu');
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px' });
  const enRang = '.saveur, .etapes li, .vitrine__carte, .autres__carte, .fiche__bloc, .maison__vignettes > li';
  document.querySelectorAll('.section__head, .saveurs__tete, .detail, .carte-apercu, .section--maison .prose, .contact__intro, ' + enRang).forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    if (el.matches(enRang)) el.style.transitionDelay = ([...el.parentElement.children].indexOf(el) % 3) * 90 + 'ms';
    el.classList.add('apparait');
    io.observe(el);
  });
})();
