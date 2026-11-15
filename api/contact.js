// Formulaire de contact : reçoit le message du site et l'envoie à contact@bryandidon.fr
// par le serveur mail OVH. Le mot de passe de la boîte est dans les réglages Vercel
// (variable d'environnement SMTP_MOT_DE_PASSE), jamais dans le code.
const nodemailer = require('nodemailer');

const ADRESSE = 'contact@bryandidon.fr';
const SUJETS = ['Commande spéciale', 'Événement', 'Question sur une création', 'Autre'];

const propre = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const uneLigne = (v, max) => propre(v, max).replace(/[\r\n]+/g, ' ');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  let d = req.body || {};
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }

  // Piège à robots : un humain ne coche jamais ce champ invisible.
  if (d.botcheck) return res.status(200).json({ ok: true });

  const nom = uneLigne(d.nom, 100);
  const email = uneLigne(d.email, 200);
  const telephone = uneLigne(d.telephone, 40);
  const sujet = SUJETS.includes(d.sujet) ? d.sujet : 'Autre';
  const message = propre(d.message, 5000);

  if (!nom || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, erreur: 'champs' });
  }

  const motDePasse = process.env.SMTP_MOT_DE_PASSE;
  if (!motDePasse) return res.status(500).json({ ok: false, erreur: 'configuration' });

  try {
    const transport = nodemailer.createTransport({
      host: 'ssl0.ovh.net', port: 465, secure: true,
      auth: { user: ADRESSE, pass: motDePasse },
    });
    await transport.sendMail({
      from: { name: 'Site Bryan Didon', address: ADRESSE },
      to: ADRESSE,
      replyTo: { name: nom, address: email },
      subject: `Site – ${sujet} – ${nom}`,
      text: [
        `Nom : ${nom}`,
        `Email : ${email}`,
        `Téléphone : ${telephone || '—'}`,
        `Sujet : ${sujet}`,
        '',
        message,
        '',
        '— Envoyé depuis le formulaire de contact de bryandidon.fr',
      ].join('\n'),
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Envoi du formulaire impossible :', e && e.message);
    return res.status(502).json({ ok: false, erreur: 'envoi' });
  }
};
