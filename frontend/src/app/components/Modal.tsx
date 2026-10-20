import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
  /** En-tête standard (titre + bouton fermer). Ignorer si `header` est fourni. */
  title?: string;
  /** En-tête personnalisé, pour les modales au layout spécifique. */
  header?: ReactNode;
  children: ReactNode;
  /** Classes additionnelles sur le panneau (ex: 'paiements-modal'). */
  className?: string;
  /** Remplace la classe de base `.modal` par `className` (panneau entièrement custom). */
  bare?: boolean;
  style?: CSSProperties;
};

export default function Modal({ onClose, title, header, children, className = '', bare = false, style }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title ?? 'Fenêtre de dialogue'}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={bare ? className : `modal${className ? ` ${className}` : ''}`}
        style={style}
        onClick={(e) => e.stopPropagation()}
      >
        {header ?? (
          title !== undefined && (
            <div className="modal-header">
              <h2 className="modal-title">{title}</h2>
              <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
          )
        )}
        {children}
      </div>
    </div>
  );
}
