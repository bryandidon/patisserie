// Inscription à la newsletter : transmet l'email à Brevo, qui envoie l'email
// « Confirmez votre inscription » (double opt-in). La personne n'est ajoutée
// à la liste qu'après avoir cliqué sur le lien de confirmation.
// La clé API est dans les réglages Vercel (variable BREVO_CLE_API), jamais dans le code.

const LISTE_NEWSLETTER = 3;          // Brevo : CRM > Contacts > Lists > « Newsletter site »
const MODELE_CONFIRMATION = 2;       // Brevo : Templates > modèle « Confirmez votre inscription »
const PAGE_APRES_CONFIRMATION = 'https://www.bryandidon.fr/merci-newsletter';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  let d = req.body || {};
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch (e) { d = {}; } }

  // Piège à robots : un humain ne coche jamais ce champ invisible.
  if (d.botcheck) return res.status(200).json({ ok: true });

  const email = String(d.email || '').trim().toLowerCase().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, erreur: 'email' });
  }

  const cle = process.env.BREVO_CLE_API;
  if (!cle || !MODELE_CONFIRMATION) return res.status(500).json({ ok: false, erreur: 'configuration' });

  try {
    const rep = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: { 'api-key': cle, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email,
        includeListIds: [LISTE_NEWSLETTER],
        templateId: MODELE_CONFIRMATION,
        redirectionUrl: PAGE_APRES_CONFIRMATION,
      }),
    });
    if (rep.ok) return res.status(200).json({ ok: true });
    const detail = await rep.json().catch(() => ({}));
    // Déjà inscrit : on répond comme si tout allait bien, sans le révéler.
    if (detail && detail.code === 'duplicate_parameter') return res.status(200).json({ ok: true });
    console.error('Inscription Brevo refusée :', rep.status, detail && (detail.code + ' ' + detail.message));
    return res.status(502).json({ ok: false, erreur: 'envoi' });
  } catch (e) {
    console.error('Inscription Brevo impossible :', e && e.message);
    return res.status(502).json({ ok: false, erreur: 'envoi' });
  }
};
