export interface Client {
  id: string;

  nom: string;

  telephone: string;

  adresse: string;

  created_at: string;
}

/* =========================
   SERVICES
========================= */

export type TypeService =
  | 'Lavage'
  | 'Repassage'
  | 'Express';

export interface Service {
  id: string;
  nom: string;
  prix: number;
  delai: number;
}

/* =========================
   STATUT COMMANDE
========================= */

export type StatutCommande =
  | 'En cours'
  | 'Lavé'
  | 'Repassé'
  | 'Prêt'
  | 'Retiré'
  | 'En retard';

/* =========================
   ITEMS COMMANDE
========================= */

export interface CommandeItem {
  id: string;

  commande_id: string;

  // Ex: Pantalon, Chemise...
  nom: string;

  // Lavage / Repassage / Express
  service: TypeService;

  // Nombre de vêtements
  quantite: number;

  // Prix décidé par le pressing
  prix: number;

  // Références vêtements
  // Ex:
  // Noir Fendi
  // Bleu Dior
  references: string[];
}

/* =========================
   COMMANDE
========================= */

export interface Commande {
  id: string;

  client_id: string;

  date_depot: string;

  date_retrait: string;

  statut: StatutCommande;

  // Total global commande
  total: number;

  items: CommandeItem[];
}

/* =========================
   PAIEMENT
========================= */

export type ModePaiement =
  | 'Cash'
  | 'Mobile Money'
  | 'Orange Money';

export interface Paiement {
  id: string;

  commande_id: string;

  montant: number;

  date: string;

  mode_paiement: ModePaiement;
}

/* =========================
   APP DATA
========================= */

export interface AppData {
  clients: Client[];

  services: Service[];

  commandes: Commande[];

  paiements: Paiement[];
}