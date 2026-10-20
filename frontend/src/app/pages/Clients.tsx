import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  UserRoundPlus,
  Users,
  ShoppingBag,
  Banknote,
  Search,
} from 'lucide-react';

import { useData } from '../contexts/DataContext';

import type { Client } from '../lib/types';

import ClientCard from '../components/ClientCard';
import ClientModal from '../components/ClientModal';
import StatCard from '../components/StatCard';

import '../style/Clients.css';

export default function Clients() {
  const navigate = useNavigate();
  const { data, createClient, updateClient, deleteClient } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ nom: '', telephone: '', adresse: '' });

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalClients = data.clients.length;
    const totalCommandes = data.commandes.length;
    const totalRevenu = data.commandes.reduce((sum, c) => sum + c.total, 0);
    return { totalClients, totalCommandes, totalRevenu };
  }, [data]);

  // ── Filtrage ─────────────────────────────────────────────────────────────
  const filteredClients = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return data.clients;
    return data.clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.telephone.includes(q) ||
        c.adresse.toLowerCase().includes(q)
    );
  }, [data.clients, searchTerm]);

  // ── Handlers modal ───────────────────────────────────────────────────────
  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({ nom: client.nom, telephone: client.telephone, adresse: client.adresse });
    } else {
      setEditingClient(null);
      setFormData({ nom: '', telephone: '', adresse: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setFormData({ nom: '', telephone: '', adresse: '' });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
        toast.success('Client mis à jour');
      } else {
        await createClient(formData);
        toast.success('Client ajouté');
      }
      closeModal();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteClient(id);
      toast.success('Client supprimé');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const getClientCommandes = (clientId: string) =>
    data.commandes.filter((c) => c.client_id === clientId);

  return (
    <div className="clients-page">

      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Gestion des clients du pressing</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <UserRoundPlus size={18} />
          Nouveau client
        </button>
      </div>

      {/* ── STAT CARDS ───────────────────────────────────────────────── */}
      <div className="clients-stats-grid">
        <StatCard
          title="Total clients"
          value={stats.totalClients}
          icon={<Users size={24} />}
          color="green"
        />
        <StatCard
          title="Total commandes"
          value={stats.totalCommandes}
          icon={<ShoppingBag size={24} />}
          color="blue"
        />
        <StatCard
          title="Revenus totaux"
          value={`${stats.totalRevenu.toLocaleString('fr-FR')} FCFA`}
          icon={<Banknote size={24} />}
          color="orange"
        />
      </div>

      {/* ── BARRE DE RECHERCHE ───────────────────────────────────────── */}
      <div className="clients-search">
        <div className="input-with-icon">
          <Search size={16} className="input-icon" />
          <input
            type="text"
            className="input"
            placeholder="Rechercher par nom, téléphone ou adresse…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── GRILLE CLIENTS ───────────────────────────────────────────── */}
      {filteredClients.length > 0 ? (
        <div className="clients-grid">
          {filteredClients.map((client) => {
            const commandes = getClientCommandes(client.id);
            const totalDepense = commandes.reduce((sum, c) => sum + c.total, 0);
            return (
              <ClientCard
                key={client.id}
                client={client}
                commandesCount={commandes.length}
                totalDepense={totalDepense}
                onEdit={() => openModal(client)}
                onDelete={() => handleDelete(client.id)}
                onView={() => navigate(`/client/${client.id}`, { state: { client } })}
              />
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Users size={28} />
          </div>
          <p className="empty-state-title">Aucun client trouvé</p>
          <p className="empty-state-text">
            {searchTerm
              ? 'Aucun résultat pour cette recherche. Essayez un autre terme.'
              : 'Commencez par ajouter votre premier client.'}
          </p>
          {!searchTerm && (
            <button className="btn btn-primary" onClick={() => openModal()} style={{ marginTop: 'var(--space-4)' }}>
              <UserRoundPlus size={16} />
              Ajouter un client
            </button>
          )}
        </div>
      )}

      {/* ── MODAL ────────────────────────────────────────────────────── */}
      <ClientModal
        isOpen={isModalOpen}
        editingClient={editingClient}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

    </div>
  );
}
