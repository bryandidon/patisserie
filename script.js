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

// Galette : basculer entre l'extérieur et la coupe
const reveal = document.querySelector('[data-reveal]');
const toggle = document.querySelector('[data-reveal-toggle]');
if (reveal && toggle) {
  const closed = toggle.querySelector('[data-label-closed]');
  const open = toggle.querySelector('[data-label-open]');
  toggle.addEventListener('click', () => {
    const isOpen = reveal.classList.toggle('is-open');
    toggle.setAttribute('aria-pressed', String(isOpen));
    closed.hidden = isOpen;
    open.hidden = !isOpen;
  });
}

// Bûches : changer de parfum (accueil et page /buches)
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
