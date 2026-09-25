import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check, ChevronDown, Eye, EyeOff, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const fieldBase =
  'w-full rounded-xl border border-line bg-card text-[13.5px] text-fg placeholder:text-muted/80 transition-[border-color,box-shadow] outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-500/10';

export function Label({ children, htmlFor, required, className }: { children: ReactNode; htmlFor?: string; required?: boolean; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-[12.5px] font-semibold text-fg-soft', className)}>
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

/** Lets inputs inside a <Field> pick up the label's id automatically. */
const FieldIdContext = createContext<string | undefined>(undefined);
function useFieldId(own?: string) {
  const ctx = useContext(FieldIdContext);
  return own ?? ctx;
}

export function Field({ label, error, hint, required, children, className, htmlFor }: { label?: ReactNode; error?: string; hint?: ReactNode; required?: boolean; children: ReactNode; className?: string; htmlFor?: string }) {
  const autoId = useId();
  const id = htmlFor ?? autoId;
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      <FieldIdContext.Provider value={id}>{children}</FieldIdContext.Provider>
      {error ? <p className="mt-1.5 text-xs font-medium text-rose-500" role="alert">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  right?: ReactNode;
  invalid?: boolean;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ icon, right, invalid, className, inputSize = 'md', id, ...props }, ref) {
  const h = inputSize === 'sm' ? 'h-9' : inputSize === 'lg' ? 'h-12 text-sm' : 'h-10';
  const fieldId = useFieldId(id);
  return (
    <div className="relative">
      {icon && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted [&_svg]:size-4">{icon}</span>}
      <input ref={ref} id={fieldId} aria-invalid={invalid || undefined} className={cn(fieldBase, h, 'px-3.5', icon && 'pl-10', right && 'pr-10', className)} {...props} />
      {right && <span className="absolute right-2 top-1/2 -translate-y-1/2">{right}</span>}
    </div>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, InputProps>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <Input
      ref={ref}
      type={show ? 'text' : 'password'}
      right={
        <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)} className="grid size-7 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg" aria-label={show ? 'Parolni yashirish' : "Parolni ko'rsatish"}>
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea({ className, invalid, id, ...props }, ref) {
  const fieldId = useFieldId(id);
  return <textarea ref={ref} id={fieldId} aria-invalid={invalid || undefined} className={cn(fieldBase, 'min-h-24 resize-y px-3.5 py-2.5 leading-relaxed', className)} {...props} />;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
  invalid?: boolean;
  selectSize?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ options, placeholder, invalid, className, children, selectSize = 'md', id, ...props }, ref) {
  const fieldId = useFieldId(id);
  return (
    <div className="relative">
      <select ref={ref} id={fieldId} aria-invalid={invalid || undefined} className={cn(fieldBase, selectSize === 'sm' ? 'h-9' : 'h-10', 'appearance-none pl-3.5 pr-9', className)} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
});

export function SearchInput({ value, onChange, placeholder = 'Qidirish...', className }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(fieldBase, 'h-10 pl-10 pr-9')} />
      {value && (
        <button type="button" onClick={() => onChange('')} className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-panel" aria-label="Tozalash">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, description, disabled, className, indeterminate }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; disabled?: boolean; className?: string; indeterminate?: boolean }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer select-none items-start gap-2.5', disabled && 'cursor-not-allowed opacity-60', className)}>
      <span className="relative mt-0.5">
        <input id={id} type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className={cn('grid size-[18px] place-items-center rounded-md border-2 transition-all peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/20', checked || indeterminate ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-card')}>
          {indeterminate ? <span className="h-0.5 w-2 rounded bg-white" /> : checked && <Check className="size-3" strokeWidth={3.5} />}
        </span>
      </span>
      {(label || description) && (
        <span className="leading-snug">
          {label && <span className="block text-[13px] font-medium text-fg">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({ checked, onChange, label, description, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn('flex cursor-pointer select-none items-center justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      {(label || description) && (
        <span>
          {label && <span className="block text-[13.5px] font-semibold text-fg">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-brand-600' : 'bg-line')}
      >
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

/** 6-digit one-time-code input with paste support */
export function OtpInput({ value, onChange, length = 6, invalid, autoFocus }: { value: string; onChange: (v: string) => void; length?: number; invalid?: boolean; autoFocus?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');
  const setAt = (i: number, d: string) => {
    const arr = value.split('');
    arr[i] = d;
    onChange(arr.join('').slice(0, length));
  };
  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (text) {
        e.preventDefault();
        onChange(text);
        refs.current[Math.min(text.length, length - 1)]?.focus();
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          value={d.trim()}
          aria-invalid={invalid || undefined}
          aria-label={`${i + 1}-raqam`}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            const prev = d.trim();
            // Overwriting a filled cell yields two chars — keep only the new one
            if (raw.length === 2 && prev) {
              const v = raw.startsWith(prev) ? raw.slice(1) : raw.slice(0, 1);
              setAt(i, v);
              refs.current[i + 1]?.focus();
              return;
            }
            // Autofill / fast input of the whole code into one cell
            if (raw.length > 1) {
              const next = (value.slice(0, i) + raw).slice(0, length);
              onChange(next);
              refs.current[Math.min(next.length, length - 1)]?.focus();
              return;
            }
            setAt(i, raw);
            if (raw) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !d.trim()) refs.current[i - 1]?.focus();
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus();
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus();
          }}
          className={cn(fieldBase, 'h-14 w-full max-w-14 text-center text-xl font-bold tabular-nums')}
        />
      ))}
    </div>
  );
}
