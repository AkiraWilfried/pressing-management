import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';

import { useData } from '../contexts/DataContext';

import type { Service } from '../lib/types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import '../style/Services.css';

export default function Services() {
  const { data, createService, updateService, deleteService } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);

  const [form, setForm] = useState({
    nom: '',
    prix: 0,
    delai: 24,
  });

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setForm({ nom: service.nom, prix: service.prix, delai: service.delai });
    } else {
      setEditingService(null);
      setForm({ nom: '', prix: 0, delai: 24 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setForm({ nom: '', prix: 0, delai: 24 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, form);
        toast.success('Service mis à jour');
      } else {
        await createService(form);
        toast.success('Service créé');
      }
      closeModal();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!serviceToDelete) return;
    try {
      await deleteService(serviceToDelete.id);
      toast.success('Service supprimé');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setServiceToDelete(null);
    }
  };

  return (
    <div className="services-page">
      {/* HEADER */}
      <div className="services-header">
        <div className="services-header-text">
          <h1 className="services-title">Services</h1>
          <p className="services-subtitle">
            Gérez les services proposés par votre pressing
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Nouveau service
        </button>
      </div>

      {/* GRID CARDS */}
      {data.services.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <Clock size={28} />
            </div>
            <p className="empty-state-title">Aucun service</p>
            <p className="empty-state-text">
              Ajoutez votre premier service pour commencer.
            </p>
          </div>
        </div>
      ) : (
        <div className="services-grid">
          {data.services.map((service: Service) => (
            <div key={service.id} className="service-card">
              {/* ICON */}
              <div className="service-card-icon">
                <Clock size={22} />
              </div>

              {/* INFO */}
              <div className="service-card-body">
                <h3 className="service-card-name">{service.nom}</h3>
                <div className="service-card-meta">
                  <span className="service-card-price">
                    {service.prix.toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="service-card-delai">
                    <Clock size={13} />
                    {service.delai}h
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="service-card-actions">
                <button
                  className="btn btn-secondary service-card-btn"
                  onClick={() => openModal(service)}
                  aria-label={`Modifier ${service.nom}`}
                >
                  <Edit2 size={14} />
                  Modifier
                </button>
                <button
                  className="btn btn-danger service-card-btn"
                  onClick={() => setServiceToDelete(service)}
                  aria-label={`Supprimer ${service.nom}`}
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <Modal
          onClose={closeModal}
          title={editingService ? 'Modifier le service' : 'Nouveau service'}
          style={{ maxWidth: '460px' }}
        >
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* NOM */}
              <div className="input-group">
                <label className="input-label" htmlFor="service-nom">Nom du service *</label>
                <input
                  id="service-nom"
                  className="input"
                  type="text"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Lavage premium"
                  required
                />
              </div>

              {/* PRIX */}
              <div className="input-group">
                <label className="input-label" htmlFor="service-prix">Prix (FCFA) *</label>
                <input
                  id="service-prix"
                  className="input"
                  type="number"
                  min="0"
                  step="50"
                  value={form.prix}
                  onChange={(e) =>
                    setForm({ ...form, prix: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </div>

              {/* DÉLAI */}
              <div className="input-group">
                <label className="input-label" htmlFor="service-delai">Délai (heures) *</label>
                <input
                  id="service-delai"
                  className="input"
                  type="number"
                  min="1"
                  value={form.delai}
                  onChange={(e) =>
                    setForm({ ...form, delai: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </div>
            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeModal}
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                {editingService ? 'Enregistrer' : 'Créer le service'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM SUPPRESSION */}
      {serviceToDelete && (
        <ConfirmDialog
          message={`Supprimer le service « ${serviceToDelete.nom} » ?`}
          onCancel={() => setServiceToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
