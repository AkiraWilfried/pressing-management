import { badgeCls } from '../lib/statut';

export default function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${badgeCls(status)}`}>{status}</span>;
}
