import { useEffect, useRef } from 'react';
import type { Client } from '../lib/types';
import Modal from './Modal';

type FormData = {
  nom: string;
  telephone: string;
  adresse: string;
};

type Props = {
  isOpen: boolean;
  editingClient: Client | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

export default function ClientModal({
  isOpen,
  editingClient,
  formData,
  setFormData,
  onClose,
  onSubmit,
}: Props) {
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus le premier champ à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      onClose={onClose}
      title={editingClient ? 'Modifier le client' : 'Nouveau client'}
      style={{ maxWidth: 520 }}
    >
      <form onSubmit={onSubmit}>
        <div className="modal-body">

          <div className="input-group">
            <label className="input-label" htmlFor="client-nom">Nom</label>
            <input
              id="client-nom"
              ref={firstInputRef}
              type="text"
              className="input"
              required
              placeholder="ex: Mamadou Diallo"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="client-tel">Téléphone</label>
            <input
              id="client-tel"
              type="tel"
              className="input"
              required
              placeholder="ex: 77 123 45 67"
              value={formData.telephone}
              onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="client-adresse">Adresse</label>
            <input
              id="client-adresse"
              type="text"
              className="input"
              required
              placeholder="ex: Plateau, Dakar"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
            />
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            {editingClient ? 'Sauvegarder' : 'Créer le client'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
