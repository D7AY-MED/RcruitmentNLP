import type { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * SearchInput — token-only search field with leading icon + clear button.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = 'Rechercher…',
  className,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={
          'w-full h-10 pl-9 pr-9 rounded-xl bg-surface border border-border-brand text-sm text-ink ' +
          'placeholder:text-muted transition-colors focus:outline-none focus-visible:ring-2 ' +
          'focus-visible:ring-ring focus-visible:border-transparent'
        }
        {...rest}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Effacer"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-ink hover:bg-surface-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
