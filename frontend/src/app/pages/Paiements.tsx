import { useState } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  CreditCard,
  Smartphone,
  Banknote,
  Hash,
  CalendarCheck,
} from 'lucide-react';

import { useData } from '../contexts/DataContext';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import type { ModePaiement } from '../lib/types';

import '../style/Paiements.css';

/* ─────────────────── Types ─────────────────── */

interface ConfirmState {
  open: boolean;
  paiementId: string;
  label: string;
}

/* ─────────────────── Helpers ─────────────────── */

function formatFCFA(n: number) {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getPaymentIcon(mode: ModePaiement, size = 18) {
  switch (mode) {
    case 'Cash':
      return <Banknote size={size} />;
    case 'Mobile Money':
      return <Smartphone size={size} />;
    case 'Orange Money':
      return <Smartphone size={size} />;
  }
}

function getPaymentBadgeClass(mode: ModePaiement) {
  switch (mode) {
    case 'Cash':          return 'badge-success';
    case 'Mobile Money':  return 'badge-info';
    case 'Orange Money':  return 'badge-warning';
  }
}

/* ─────────────────── Component ─────────────────── */

export default function Paiements() {
  const { data, createPaiement, deletePaiement } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>({
    open: false,
    paiementId: '',
    label: '',
  });

  const [form, setForm] = useState({
    commande_id: '',
    montant: 0,
    mode_paiement: 'Cash' as ModePaiement,
  });

  /* ── computed helpers ── */
  const getCommandeTotal = (id: string) =>
    data.commandes.find((c) => c.id === id)?.total ?? 0;

  const getMontantPaye = (id: string) =>
    data.paiements
      .filter((p) => p.commande_id === id)
      .reduce((s, p) => s + p.montant, 0);

  const getResteAPayer = (id: string) =>
    getCommandeTotal(id) - getMontantPaye(id);

  /* ── stats ── */
  const totalEncaisse = data.paiements.reduce((s, p) => s + p.montant, 0);
  const nbPaiements   = data.paiements.length;

  const todayStr = new Date().toDateString();
  const paiementsJour = data.paiements
    .filter((p) => new Date(p.date).toDateString() === todayStr)
    .reduce((s, p) => s + p.montant, 0);

  /* ── modal open ── */
  const handleOpenModal = () => {
    setForm({ commande_id: '', montant: 0, mode_paiement: 'Cash' });
    setIsModalOpen(true);
  };

  /* ── submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const localIso =
      `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
      `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    try {
      await createPaiement({ ...form, date: localIso });
      toast.success('Paiement enregistré');
      setIsModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  /* ── delete (custom confirm) ── */
  const askDelete = (id: string) => {
    const p = data.paiements.find((x) => x.id === id);
    const commande = data.commandes.find((c) => c.id === p?.commande_id);
    const client   = data.clients.find((c) => c.id === commande?.client_id);
    setConfirm({
      open: true,
      paiementId: id,
      label: `Supprimer le paiement de ${formatFCFA(p?.montant ?? 0)} pour ${client?.nom ?? 'ce client'} ?`,
    });
  };

  const confirmDelete = async () => {
    try {
      await deletePaiement(confirm.paiementId);
      toast.success('Paiement supprimé');
    } catch (err) {
      toast.error((err as Error).message);
    }
    setConfirm({ open: false, paiementId: '', label: '' });
  };

  /* ── commande selector change ── */
  const onCommandeChange = (commandeId: string) => {
    setForm({ ...form, commande_id: commandeId, montant: getResteAPayer(commandeId) });
  };

  return (
    <div className="paiements-page">

      {/* ══════════════ HEADER ══════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="page-subtitle">Gestion des encaissements clients</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenModal}>
          <Plus size={18} />
          Nouveau paiement
        </button>
      </div>

      {/* ══════════════ STAT CARDS ══════════════ */}
      <div className="paiements-stats">

        <div className="stat-card">
          <div className="stat-icon green">
            <CreditCard size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total encaissé</p>
            <p className="stat-value">{formatFCFA(totalEncaisse)}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <Hash size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Nombre de paiements</p>
            <p className="stat-value">{nbPaiements}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <CalendarCheck size={22} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Paiements du jour</p>
            <p className="stat-value">{formatFCFA(paiementsJour)}</p>
          </div>
        </div>

      </div>

      {/* ══════════════ TABLE ══════════════ */}
      <div className="card paiements-table-card">

        <div className="card-header">
          <div>
            <h2 className="card-title">Historique des paiements</h2>
            <p className="card-subtitle">{nbPaiements} transaction{nbPaiements > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="table-wrapper">
          {data.paiements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CreditCard size={28} /></div>
              <p className="empty-state-title">Aucun paiement enregistré</p>
              <p className="empty-state-text">Cliquez sur « Nouveau paiement » pour commencer.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Commande</th>
                  <th>Montant FCFA</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.paiements
                  .slice()
                  .reverse()
                  .map((paiement) => {
                    const commande = data.commandes.find((c) => c.id === paiement.commande_id);
                    const client   = data.clients.find((c) => c.id === commande?.client_id);

                    return (
                      <tr key={paiement.id}>
                        <td className="paiements-date">{formatDate(paiement.date)}</td>
                        <td className="paiements-client">{client?.nom ?? 'Inconnu'}</td>
                        <td className="paiements-commande">
                          <span className="commande-ref">#{commande?.id ?? '—'}</span>
                        </td>
                        <td className="paiements-amount">{formatFCFA(paiement.montant)}</td>
                        <td>
                          <span className={`badge ${getPaymentBadgeClass(paiement.mode_paiement)} badge-no-dot`}>
                            {getPaymentIcon(paiement.mode_paiement, 13)}
                            {paiement.mode_paiement}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon delete"
                            title="Supprimer"
                            onClick={() => askDelete(paiement.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ══════════════ MODAL NOUVEAU PAIEMENT ══════════════ */}
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          title="Nouveau paiement"
          className="paiements-modal"
        >
            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                {/* ── Sélecteur commande ── */}
                <div className="input-group">
                  <label className="input-label" htmlFor="paiement-commande">Commande</label>
                  <select
                    id="paiement-commande"
                    required
                    className="input"
                    value={form.commande_id}
                    onChange={(e) => onCommandeChange(e.target.value)}
                  >
                    <option value="">Choisir une commande…</option>
                    {data.commandes
                      .filter((commande) => getResteAPayer(commande.id) > 0)
                      .map((commande) => {
                        const client = data.clients.find((c) => c.id === commande.client_id);
                        const reste  = getResteAPayer(commande.id);
                        return (
                          <option key={commande.id} value={commande.id}>
                            #{commande.id.slice(0, 8)} · {client?.nom ?? 'Client'} · dépôt {formatDate(commande.date_depot)} — reste {formatFCFA(reste)}
                          </option>
                        );
                      })}
                  </select>
                  {data.commandes.filter((c) => getResteAPayer(c.id) > 0).length === 0 && (
                    <p className="input-hint">Toutes les commandes sont entièrement payées.</p>
                  )}
                </div>

                {/* ── Résumé commande sélectionnée ── */}
                {form.commande_id && (() => {
                  const commande = data.commandes.find((c) => c.id === form.commande_id);
                  const client   = data.clients.find((c) => c.id === commande?.client_id);
                  const paye     = getMontantPaye(form.commande_id);
                  const reste    = getResteAPayer(form.commande_id);
                  return (
                    <div className="commande-summary">
                      <div className="summary-row">
                        <span>Commande</span>
                        <strong>#{commande?.id.slice(0, 8)} · dépôt {commande ? formatDate(commande.date_depot) : '—'}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Client</span>
                        <strong>{client?.nom}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Total commande</span>
                        <strong>{formatFCFA(commande?.total ?? 0)}</strong>
                      </div>
                      <div className="summary-row">
                        <span>Déjà payé</span>
                        <strong className="text-success">{formatFCFA(paye)}</strong>
                      </div>
                      <div className="summary-row summary-reste">
                        <span>Reste à payer</span>
                        <strong className="text-danger">{formatFCFA(reste)}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Montant ── */}
                <div className="input-group">
                  <label className="input-label" htmlFor="paiement-montant">Montant (FCFA)</label>
                  <input
                    id="paiement-montant"
                    type="number"
                    required
                    min={1}
                    className="input"
                    value={form.montant || ''}
                    onChange={(e) => setForm({ ...form, montant: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>

                {/* ── Mode de paiement ── */}
                <div className="input-group">
                  <span className="input-label">Mode de paiement</span>
                  <div className="payment-mode-grid">
                    {(['Cash', 'Mobile Money', 'Orange Money'] as ModePaiement[]).map((mode) => (
                      <label
                        key={mode}
                        className={`payment-mode-card ${form.mode_paiement === mode ? 'active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="mode_paiement"
                          checked={form.mode_paiement === mode}
                          onChange={() => setForm({ ...form, mode_paiement: mode })}
                        />
                        <span className="pmc-icon">{getPaymentIcon(mode, 22)}</span>
                        <span className="pmc-label">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  Enregistrer
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* ══════════════ MODAL CONFIRM DELETE ══════════════ */}
      {confirm.open && (
        <ConfirmDialog
          message={confirm.label}
          onCancel={() => setConfirm({ ...confirm, open: false })}
          onConfirm={confirmDelete}
        />
      )}

    </div>
  );
}
