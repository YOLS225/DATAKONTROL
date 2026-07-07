import { SearchIcon } from 'lucide-react';

interface SearchBarProps {
  search?: string;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ search, onSearch, placeholder = 'Rechercher...' }: SearchBarProps) {
  return (
    <form className="w-full" onSubmit={(event) => event.preventDefault()}>
      <label className="sr-only" htmlFor="dashboard-search">
        Rechercher
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="h-10 w-full rounded-md border bg-input pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
          id="dashboard-search"
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={search}
        />
      </div>
    </form>
  );
}
