import { Search } from 'lucide-react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBar({ value, onChange }: Props) {
  return (
    <div className="search-box">
      <Search size={18} />

      <input
        type="text"
        placeholder="Rechercher un client..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}