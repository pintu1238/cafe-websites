import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
};

type DropdownSelectProps = {
  options: readonly DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
};

export function DropdownSelect({ options, value, onChange, className, disabled = false, name, placeholder = 'Choose an option', 'aria-label': ariaLabel }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) return undefined;
    setHighlightedIndex(selectedIndex);
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [open, selectedIndex]);

  const choose = (option: DropdownOption) => {
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex(selectedIndex);
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setHighlightedIndex((current) => (current + direction + options.length) % options.length);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setHighlightedIndex(event.key === 'Home' ? 0 : Math.max(0, options.length - 1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option) choose(option);
    }
  };

  return <div ref={rootRef} className={`ui-dropdown${className ? ` ${className}` : ''}`}>
    {name && <input type="hidden" name={name} value={value} />}
    <button
      ref={triggerRef}
      type="button"
      className="ui-dropdown-trigger"
      role="combobox"
      aria-label={ariaLabel}
      aria-controls={listboxId}
      aria-expanded={open}
      aria-haspopup="listbox"
      disabled={disabled}
      onClick={() => setOpen((current) => !current)}
      onKeyDown={handleTriggerKeyDown}
    >
      <span className="ui-dropdown-value">{selected?.label ?? placeholder}</span>
      <ChevronDown className={`ui-dropdown-chevron${open ? ' is-open' : ''}`} size={17} aria-hidden="true" />
    </button>
    {open && <div id={listboxId} className="ui-dropdown-options is-open" role="listbox" aria-label={ariaLabel ?? 'Options'}>
      {options.map((option, index) => <button
        key={option.value || 'empty'}
        type="button"
        className={`ui-dropdown-option${option.value === value ? ' is-selected' : ''}${index === highlightedIndex ? ' is-highlighted' : ''}`}
        role="option"
        aria-selected={option.value === value}
        onMouseEnter={() => setHighlightedIndex(index)}
        onClick={() => choose(option)}
      >
        <span className="ui-dropdown-option-copy"><strong>{option.label}</strong>{option.description && <small>{option.description}</small>}</span>
        {option.value === value && <Check size={16} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
