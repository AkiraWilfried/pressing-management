import { AlertCircle, Trash2 } from 'lucide-react';
import Modal from './Modal';

type Props = {
  /** Texte principal de la question. */
  message: string;
  subtext?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({ message, subtext = 'Cette action est irréversible.', onCancel, onConfirm }: Props) {
  return (
    <Modal title="Confirmer la suppression" className="confirm-modal" onClose={onCancel}>
      <div className="modal-body">
        <div className="confirm-content">
          <div className="confirm-icon">
            <AlertCircle size={32} />
          </div>
          <p className="confirm-text">{message}</p>
          <p className="confirm-subtext">{subtext}</p>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className="btn btn-danger-solid" onClick={onConfirm}>
          <Trash2 size={16} />
          Supprimer
        </button>
      </div>
    </Modal>
  );
}
