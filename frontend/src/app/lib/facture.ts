import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { toWords } from 'number-to-words';
import type { Client, Commande } from '../lib/types';

export async function generateFacturePDF(client: Client, commande: Commande) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 297], // format ticket étendu pour tableau complet
  });

  const width = 80;
  let y = 10;

  // ─────────────────────────────────────────
  // HEADER — Logo texte + adresse + date
  // ─────────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESSING', width / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Propreté • Qualité • Confiance', width / 2, y, { align: 'center' });

  y += 4;
  doc.text('Quartier Bastos, Yaoundé — Cameroun', width / 2, y, { align: 'center' });

  y += 4;
  doc.text('Tél : +237 6 70 00 00 00', width / 2, y, { align: 'center' });

  y += 5;
  doc.setLineWidth(0.3);
  doc.line(5, y, 75, y);
  y += 5;

  // Numéro de facture
  const factureNumber = `FAC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE / REÇU', width / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${factureNumber}`, width / 2, y, { align: 'center' });

  y += 5;
  const now = new Date();
  doc.text(
    `Date : ${now.toLocaleDateString('fr-FR')}   Heure : ${now.toLocaleTimeString('fr-FR')}`,
    width / 2,
    y,
    { align: 'center' }
  );

  y += 5;
  doc.line(5, y, 75, y);
  y += 5;

  // ─────────────────────────────────────────
  // SECTION CLIENT
  // ─────────────────────────────────────────
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 5, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(`Nom     : ${client.nom}`, 5, y);

  y += 4;
  doc.text(`Tél     : ${client.telephone}`, 5, y);

  y += 4;
  doc.text(`Adresse : ${client.adresse}`, 5, y);

  y += 5;
  doc.line(5, y, 75, y);
  y += 4;

  // ─────────────────────────────────────────
  // TABLEAU DES ARTICLES
  // ─────────────────────────────────────────
  // En-têtes colonnes (étroites sur format 80mm)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  // Colonnes : Article | Service | Qté | P.U | S/T
  const col = { art: 5, svc: 28, qty: 45, pu: 52, st: 64 };

  doc.text('Article',  col.art, y);
  doc.text('Service',  col.svc, y);
  doc.text('Qté',      col.qty, y);
  doc.text('P.U',      col.pu,  y);
  doc.text('S/T',      col.st,  y);

  y += 2;
  doc.setLineWidth(0.2);
  doc.line(5, y, 75, y);
  y += 4;

  doc.setFont('helvetica', 'normal');

  let total = 0;

  commande.items.forEach((item) => {
    const sousTotal = item.quantite * item.prix;
    total += sousTotal;

    // Tronquer le nom si trop long
    const nomCourt = item.nom.length > 10 ? item.nom.slice(0, 10) + '.' : item.nom;
    const svcCourt = item.service.length > 10 ? item.service.slice(0, 10) : item.service;

    doc.text(nomCourt,              col.art, y);
    doc.text(svcCourt,              col.svc, y);
    doc.text(String(item.quantite), col.qty, y);
    doc.text(`${item.prix}`,        col.pu,  y);
    doc.text(`${sousTotal}`,        col.st,  y);

    y += 5;
  });

  y += 1;
  doc.line(5, y, 75, y);
  y += 5;

  // ─────────────────────────────────────────
  // TOTAL
  // ─────────────────────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL : ${total.toLocaleString('fr-FR')} FCFA`, 5, y);

  y += 5;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');

  // Montant en toutes lettres (number-to-words donne l'anglais, on adapte)
  let montantLettres = '';
  try {
    montantLettres = toWords(total) + ' francs CFA';
  } catch {
    montantLettres = `${total} francs CFA`;
  }

  const lignesLettres = doc.splitTextToSize(montantLettres, 70);
  doc.text(lignesLettres, 5, y);
  y += lignesLettres.length * 4;

  y += 3;
  doc.line(5, y, 75, y);
  y += 5;

  // ─────────────────────────────────────────
  // STATUT PAIEMENT
  // ─────────────────────────────────────────
  const isPaid = commande.statut === 'Retiré';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isPaid ? 0 : 180, isPaid ? 128 : 0, 0);

  doc.text(
    `STATUT : ${isPaid ? '✓ PAYÉ' : '✗ NON PAYÉ'}`,
    width / 2,
    y,
    { align: 'center' }
  );

  doc.setTextColor(0, 0, 0);
  y += 8;

  // ─────────────────────────────────────────
  // QR CODE
  // ─────────────────────────────────────────
  const qrData = await QRCode.toDataURL(
    JSON.stringify({
      facture: factureNumber,
      client: client.nom,
      total,
      statut: isPaid ? 'PAYÉ' : 'NON PAYÉ',
    })
  );

  doc.addImage(qrData, 'PNG', 20, y, 40, 40);
  y += 44;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Scanner pour vérifier l\'authenticité', width / 2, y, { align: 'center' });

  y += 8;
  doc.line(5, y, 75, y);
  y += 5;

  // ─────────────────────────────────────────
  // PIED DE PAGE
  // ─────────────────────────────────────────
  doc.setFontSize(7);
  doc.text('Merci pour votre confiance !', width / 2, y, { align: 'center' });
  y += 4;
  doc.text('Ce reçu fait foi de paiement.', width / 2, y, { align: 'center' });
  y += 4;
  doc.text('PRESSING — Tous droits réservés', width / 2, y, { align: 'center' });

  // ─────────────────────────────────────────
  // SAUVEGARDE
  // ─────────────────────────────────────────
  doc.save(`facture_${factureNumber}.pdf`);
}
