import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import { generateId } from '../lib/store';
import { useData } from '../contexts/DataContext';

import type { Commande, StatutCommande } from '../lib/types';

import CommandeTable from '../components/CommandeTable';
import CommandeModal from '../components/CommandeModal';
import CommandeFilters from '../components/CommandeFilters';
import OrderDetailModal from '../components/OrderDetailModal';
import ConfirmDialog from '../components/ConfirmDialog';

import '../style/Commandes.css';

export default function Commandes() {
  const { data, createCommande, updateCommande, deleteCommande } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<StatutCommande | 'Tous'>('Tous');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Commande | null>(null);
  const [detail, setDetail] = useState<Commande | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    client_id: '',
    date_depot: '',
    date_retrait: '',
    statut: 'En cours' as StatutCommande,
    items: [] as any[],
  });

  const filtered = useMemo(() => {
    return data.commandes.filter((c) => {
      const client = data.clients.find((cl) => cl.id === c.client_id);
      const matchSearch =
        client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.includes(searchTerm);
      const matchStatut = filterStatut === 'Tous' || c.statut === filterStatut;
      return matchSearch && matchStatut;
    });
  }, [data, searchTerm, filterStatut]);

  const openModal = (cmd?: Commande) => {
    if (cmd) {
      setEditing(cmd);
      setForm({
        client_id: cmd.client_id,
        date_depot: cmd.date_depot.split('T')[0],
        date_retrait: cmd.date_retrait.split('T')[0],
        statut: cmd.statut,
        items: cmd.items as any[],
      });
    } else {
      setEditing(null);
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setForm({
        client_id: '',
        date_depot: now.toLocaleDateString('en-CA'),
        date_retrait: tomorrow.toLocaleDateString('en-CA'),
        statut: 'En cours' as StatutCommande,
        items: [],
      });
    }
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const id = editing?.id || generateId();

    const items = form.items.map((i: any) => ({
      id: generateId(),
      commande_id: id,
      nom: i.nom,
      service: i.service,
      quantite: i.quantite,
      prix: i.prix,
      references: i.references,
    }));

    const total = items.reduce(
      (sum: number, i: any) => sum + i.prix * i.quantite,
      0
    );

    const payload = {
      client_id: form.client_id,
      date_depot: `${form.date_depot}T00:00:00`,
      date_retrait: `${form.date_retrait}T23:59:59`,
      statut: form.statut,
      total,
      items,
    };

    try {
      if (editing) await updateCommande(editing.id, payload);
      else await createCommande(payload);
      closeModal();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCommande(pendingDelete);
      toast.success('Commande supprimée');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setPendingDelete(null);
    }
  };

  const handleStatusChange = async (id: string, statut: StatutCommande) => {
    try {
      await updateCommande(id, { statut });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="commandes-page">
      {/* HEADER */}
      <div className="commandes-header">
        <div className="commandes-header-text">
          <h1 className="commandes-title">Commandes</h1>
          <p className="commandes-subtitle">Gestion des commandes pressing</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} />
          Nouvelle commande
        </button>
      </div>

      {/* FILTERS */}
      <CommandeFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatut={filterStatut}
        setFilterStatut={setFilterStatut}
      />

      {/* TABLE */}
      <CommandeTable
        data={filtered}
        clients={data.clients}
        onView={setDetail}
        onEdit={openModal}
        onDelete={setPendingDelete}
        onStatusChange={handleStatusChange}
      />

      {/* MODAL */}
      {isOpen && (
        <CommandeModal
          form={form}
          setForm={setForm}
          clients={data.clients}
          services={data.services}
          editing={editing}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {/* DÉTAIL COMMANDE (lecture seule) */}
      {detail && (
        <OrderDetailModal
          commande={detail}
          client={data.clients.find((c) => c.id === detail.client_id)}
          onClose={() => setDetail(null)}
        />
      )}

      {/* CONFIRM SUPPRESSION */}
      {pendingDelete && (
        <ConfirmDialog
          message={`Supprimer la commande #${pendingDelete.slice(0, 8)} ?`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
