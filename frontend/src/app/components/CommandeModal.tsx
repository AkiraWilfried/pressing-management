import { X, Plus, Trash2 } from 'lucide-react';
import type { Commande, StatutCommande, Service } from '../lib/types';
import { STATUTS_COMMANDE as STATUTS } from '../lib/statut';
import Modal from './Modal';

type ItemType = {
  nom: string;
  service: string;
  quantite: number;
  prix: number;
  references: string[];
};

type FormType = {
  client_id: string;
  date_depot: string;
  date_retrait: string;
  statut: StatutCommande;
  items: ItemType[];
};

type Props = {
  form: FormType;
  setForm: React.Dispatch<React.SetStateAction<FormType>>;
  clients: any[];
  services: Service[];
  editing: Commande | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function CommandeModal({
  form,
  setForm,
  clients,
  services,
  editing,
  onClose,
  onSubmit,
}: Props) {
  const today = new Date().toISOString().split('T')[0];

  const totalItems = form.items.reduce((sum, item) => sum + item.quantite, 0);
  const totalPrix = form.items.reduce(
    (sum, item) => sum + item.prix * item.quantite,
    0
  );

  const updateItem = (index: number, patch: Partial<ItemType>) => {
    const updated = form.items.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    setForm({ ...form, items: updated });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [
        ...form.items,
        {
          nom: '',
          service: '' as any,
          quantite: 1,
          prix: 0,
          references: [''],
        },
      ],
    });
  };

  const updateRef = (itemIndex: number, refIndex: number, value: string) => {
    const updated = [...form.items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      references: updated[itemIndex].references.map((r, i) =>
        i === refIndex ? value : r
      ),
    };
    setForm({ ...form, items: updated });
  };

  const addRef = (itemIndex: number) => {
    const updated = [...form.items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      references: [...updated[itemIndex].references, ''],
    };
    setForm({ ...form, items: updated });
  };

  const removeRef = (itemIndex: number, refIndex: number) => {
    const updated = [...form.items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      references: updated[itemIndex].references.filter((_, i) => i !== refIndex),
    };
    setForm({ ...form, items: updated });
  };

  return (
    <Modal
      bare
      className="cmd-modal"
      onClose={onClose}
      title={editing ? 'Modifier la commande' : 'Nouvelle commande'}
      header={
        <div className="cmd-modal-header">
          <h2 className="modal-title">
            {editing ? 'Modifier la commande' : 'Nouvelle commande'}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
      }
    >
      <form onSubmit={onSubmit}>
          {/* BODY */}
          <div className="cmd-modal-body">

            {/* CLIENT */}
            <div className="input-group">
              <label className="input-label" htmlFor="cmd-client">Client *</label>
              <select
                id="cmd-client"
                className="input"
                value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* DATES */}
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label" htmlFor="cmd-depot">Date de dépôt *</label>
                <input
                  id="cmd-depot"
                  className="input"
                  type="date"
                  min={editing ? undefined : today}
                  value={form.date_depot}
                  onChange={(e) => {
                    const depot = e.target.value;
                    setForm({
                      ...form,
                      date_depot: depot,
                      date_retrait:
                        form.date_retrait < depot ? depot : form.date_retrait,
                    });
                  }}
                  required
                />
              </div>
              <div className="input-group">
                <label className="input-label" htmlFor="cmd-retrait">Date de retrait *</label>
                <input
                  id="cmd-retrait"
                  className="input"
                  type="date"
                  min={form.date_depot || today}
                  value={form.date_retrait}
                  onChange={(e) =>
                    setForm({ ...form, date_retrait: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* STATUT */}
            <div className="input-group">
              <label className="input-label" htmlFor="cmd-statut">Statut</label>
              <select
                id="cmd-statut"
                className="input"
                value={form.statut}
                onChange={(e) =>
                  setForm({ ...form, statut: e.target.value as StatutCommande })
                }
              >
                {STATUTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* ARTICLES */}
            <div className="cmd-articles-section">
              <div className="cmd-articles-header">
                <span className="cmd-articles-title">
                  Articles ({totalItems} vêtement{totalItems > 1 ? 's' : ''})
                </span>
                <button
                  type="button"
                  className="btn btn-secondary cmd-add-article-btn"
                  onClick={addItem}
                >
                  <Plus size={14} />
                  Ajouter vêtement
                </button>
              </div>

              {form.items.length === 0 && (
                <div className="cmd-articles-empty">
                  Aucun article. Cliquez sur « Ajouter vêtement » pour commencer.
                </div>
              )}

              <div className="cmd-items">
                {form.items.map((item, i) => (
                  <div key={i} className="cmd-item-card">
                    {/* ITEM HEADER */}
                    <div className="cmd-item-head">
                      <span className="cmd-item-num">Vêtement #{i + 1}</span>
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={() => removeItem(i)}
                        aria-label="Supprimer cet article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* NOM */}
                    <div className="input-group">
                      <label className="input-label" htmlFor={`cmd-item-nom-${i}`}>Nom du vêtement</label>
                      <input
                        id={`cmd-item-nom-${i}`}
                        className="input"
                        placeholder="Ex: Pantalon, Chemise…"
                        value={item.nom}
                        onChange={(e) => updateItem(i, { nom: e.target.value })}
                      />
                    </div>

                    {/* SERVICE */}
                    <div className="input-group">
                      <label className="input-label" htmlFor={`cmd-item-service-${i}`}>Service</label>
                      <select
                        id={`cmd-item-service-${i}`}
                        className="input"
                        value={item.service}
                        onChange={(e) => {
                          const selectedService = services.find((s) => s.nom === e.target.value);
                          updateItem(i, {
                            service: e.target.value,
                            prix: selectedService?.prix ?? item.prix,
                          });
                        }}
                      >
                        <option value="">Choisir un service</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.nom}>
                            {s.nom} — {s.prix.toLocaleString('fr-FR')} FCFA
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* QUANTITÉ + PRIX */}
                    <div className="grid-2">
                      <div className="input-group">
                        <label className="input-label" htmlFor={`cmd-item-quantite-${i}`}>Quantité</label>
                        <input
                          id={`cmd-item-quantite-${i}`}
                          className="input"
                          type="number"
                          min={1}
                          value={item.quantite}
                          onChange={(e) =>
                            updateItem(i, {
                              quantite: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label" htmlFor={`cmd-item-prix-${i}`}>Prix unitaire (FCFA)</label>
                        <input
                          id={`cmd-item-prix-${i}`}
                          className="input"
                          type="number"
                          min={0}
                          value={item.prix}
                          onChange={(e) =>
                            updateItem(i, {
                              prix: Math.max(0, Number(e.target.value) || 0),
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* SOUS-TOTAL ARTICLE */}
                    <div className="cmd-item-subtotal">
                      Sous-total :{' '}
                      <strong>
                        {(item.prix * item.quantite).toLocaleString('fr-FR')} FCFA
                      </strong>
                    </div>

                    {/* RÉFÉRENCES */}
                    <div className="cmd-refs">
                      <div className="cmd-refs-header">
                        <span className="input-label">Références</span>
                        <button
                          type="button"
                          className="cmd-refs-add"
                          disabled={item.references.length >= item.quantite}
                          onClick={() => addRef(i)}
                        >
                          <Plus size={13} />
                          {item.references.length >= item.quantite
                            ? 'Réf. complète'
                            : 'Référence'}
                        </button>
                      </div>

                      {item.references.map((ref, refIdx) => (
                        <div key={refIdx} className="cmd-ref-row">
                          <input
                            className="input"
                            placeholder="Ex: Noir Fendi, Bleu Dior…"
                            value={ref}
                            onChange={(e) => updateRef(i, refIdx, e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-icon delete"
                            onClick={() => removeRef(i, refIdx)}
                            aria-label="Supprimer référence"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {form.items.length > 0 && (
                <button type="button" className="cmd-add-article-bottom" onClick={addItem}>
                  <Plus size={15} />
                  Ajouter un vêtement
                </button>
              )}
            </div>

            {/* TOTAL GLOBAL */}
            {form.items.length > 0 && (
              <div className="cmd-total-box">
                <div className="cmd-total-row">
                  <span>Total vêtements</span>
                  <strong>{totalItems}</strong>
                </div>
                <div className="cmd-total-row cmd-total-amount">
                  <span>Total à payer</span>
                  <strong>{totalPrix.toLocaleString('fr-FR')} FCFA</strong>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Enregistrer' : 'Créer la commande'}
            </button>
          </div>
      </form>
    </Modal>
  );
}
