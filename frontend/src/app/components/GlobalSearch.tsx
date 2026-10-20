import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Search, Users, Package, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import type { Client, Commande } from '../lib/types';
import '../style/GlobalSearch.css';

type ResultItem =
  | { type: 'client'; data: Client }
  | { type: 'commande'; data: Commande; clientNom: string };

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { data } = useData();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* ── Recherche ────────────────────────── */
  const search = useCallback((q: string) => {
    const term = q.trim().toLowerCase();
    if (!term) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const found: ResultItem[] = [];

    // Chercher dans les clients
    data.clients.forEach((client) => {
      if (
        client.nom.toLowerCase().includes(term) ||
        client.telephone.includes(term) ||
        client.adresse.toLowerCase().includes(term)
      ) {
        found.push({ type: 'client', data: client });
      }
    });

    // Chercher dans les commandes (par ID tronqué ou nom du client)
    data.commandes.forEach((commande) => {
      const client = data.clients.find((c) => c.id === commande.client_id);
      const clientNom = client?.nom ?? '';
      if (
        commande.id.toLowerCase().includes(term) ||
        commande.id.slice(0, 8).toLowerCase().includes(term) ||
        clientNom.toLowerCase().includes(term) ||
        commande.statut.toLowerCase().includes(term)
      ) {
        // Évite les doublons avec la recherche client
        const alreadyFromClient = found.some(
          (r) => r.type === 'client' && r.data.id === commande.client_id
        );
        if (!alreadyFromClient) {
          found.push({ type: 'commande', data: commande, clientNom });
        }
      }
    });

    setResults(found.slice(0, 8)); // max 8 résultats
    setIsOpen(found.length > 0);
    setActiveIndex(-1);
  }, [data]);

  useEffect(() => {
    search(query);
  }, [query, search]);

  /* ── Navigation clavier ───────────────── */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) selectResult(results[activeIndex]);
    } else if (e.key === 'Escape') {
      clear();
    }
  };

  /* ── Sélectionner un résultat ─────────── */
  const selectResult = (item: ResultItem) => {
    if (item.type === 'client') {
      navigate(`/client/${item.data.id}`, { state: { client: item.data } });
    } else {
      // Naviguer vers la page client avec la commande mise en évidence
      const client = data.clients.find((c) => c.id === item.data.client_id);
      if (client) {
        navigate(`/client/${client.id}`, {
          state: { client, highlightCommandeId: item.data.id },
        });
      } else {
        // Repli : page commandes sans contexte client
        navigate('/commandes');
      }
    }
    clear();
  };

  const clear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  /* ── Fermer si clic en dehors ─────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Formater la date ─────────────────── */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    });

  return (
    <div className="gs-wrapper" ref={containerRef}>
      {/* INPUT */}
      <div className="gs-input-wrap">
        <Search className="gs-icon" aria-hidden="true" />
        <input
          ref={inputRef}
          type="search"
          className="gs-input"
          placeholder="Rechercher un client, une commande…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setIsOpen(results.length > 0)}
          aria-label="Recherche globale"
          autoComplete="off"
        />
        {query && (
          <button
            className="gs-clear"
            onClick={clear}
            aria-label="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* DROPDOWN */}
      {isOpen && results.length > 0 && (
        <div className="gs-dropdown" role="listbox" aria-label="Résultats de recherche">

          {/* Clients */}
          {results.some((r) => r.type === 'client') && (
            <div className="gs-section">
              <div className="gs-section-label">
                <Users size={12} />
                Clients
              </div>
              {results
                .filter((r): r is Extract<ResultItem, { type: 'client' }> => r.type === 'client')
                .map((item) => {
                  const globalIdx = results.indexOf(item);
                  return (
                    <button
                      key={item.data.id}
                      className={`gs-item ${activeIndex === globalIdx ? 'active' : ''}`}
                      role="option"
                      aria-selected={activeIndex === globalIdx}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => selectResult(item)}
                    >
                      <div className="gs-item-avatar">
                        {item.data.nom.charAt(0).toUpperCase()}
                      </div>
                      <div className="gs-item-info">
                        <span className="gs-item-title">{item.data.nom}</span>
                        <span className="gs-item-sub">{item.data.telephone}</span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Commandes */}
          {results.some((r) => r.type === 'commande') && (
            <div className="gs-section">
              <div className="gs-section-label">
                <Package size={12} />
                Commandes
              </div>
              {results
                .filter((r): r is Extract<ResultItem, { type: 'commande' }> => r.type === 'commande')
                .map((item) => {
                  const globalIdx = results.indexOf(item);
                  return (
                    <button
                      key={item.data.id}
                      className={`gs-item ${activeIndex === globalIdx ? 'active' : ''}`}
                      role="option"
                      aria-selected={activeIndex === globalIdx}
                      onMouseEnter={() => setActiveIndex(globalIdx)}
                      onClick={() => selectResult(item)}
                    >
                      <div className="gs-item-badge">
                        <Package size={13} />
                      </div>
                      <div className="gs-item-info">
                        <span className="gs-item-title">
                          #{item.data.id.slice(0, 8)}
                          {item.clientNom && (
                            <span className="gs-item-client"> — {item.clientNom}</span>
                          )}
                        </span>
                        <span className="gs-item-sub">
                          {item.data.statut} · {formatDate(item.data.date_depot)} · {item.data.total.toLocaleString('fr-FR')} FCFA
                        </span>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

          {/* Footer */}
          <div className="gs-footer">
            <kbd>↑↓</kbd> naviguer · <kbd>Entrée</kbd> sélectionner · <kbd>Esc</kbd> fermer
          </div>
        </div>
      )}

      {/* No results */}
      {isOpen && results.length === 0 && query.trim() && (
        <div className="gs-dropdown">
          <div className="gs-empty">Aucun résultat pour « {query} »</div>
        </div>
      )}
    </div>
  );
}
