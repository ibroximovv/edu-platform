import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}

const SIZES = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-6xl' };

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  bodyClassName?: string;
  dismissable?: boolean;
}

export function Modal({ open, onClose, title, description, icon, children, footer, size = 'md', className, bodyClassName, dismissable = true }: ModalProps) {
  useLockBody(open);
  useEscape(open && dismissable, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[6px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={dismissable ? onClose : undefined} />
          <motion.div
            className={cn('relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-card shadow-lift sm:rounded-3xl', SIZES[size], className)}
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 380 }}
          >
            {(title || description) && (
              <div className="flex items-start gap-3 border-b border-line px-6 py-5">
                {icon && <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300 [&_svg]:size-5">{icon}</div>}
                <div className="min-w-0 flex-1">
                  {title && <h2 className="text-[17px] font-bold leading-tight text-fg">{title}</h2>}
                  {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
                </div>
                {dismissable && (
                  <button onClick={onClose} className="-mr-2 -mt-1 grid size-9 place-items-center rounded-xl text-muted transition hover:bg-panel hover:text-fg" aria-label="Yopish">
                    <X className="size-[18px]" />
                  </button>
                )}
              </div>
            )}
            <div className={cn('flex-1 overflow-y-auto px-6 py-5', bodyClassName)}>{children}</div>
            {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-panel/50 px-6 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, description, children, footer, width = 'max-w-xl' }: Omit<ModalProps, 'size'> & { width?: string }) {
  useLockBody(open);
  useEscape(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true">
          <motion.div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[4px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className={cn('absolute inset-y-0 right-0 flex w-full flex-col border-l border-line bg-card shadow-lift', width)}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <div className="flex items-start gap-3 border-b border-line px-6 py-5">
              <div className="min-w-0 flex-1">
                {title && <h2 className="text-[17px] font-bold text-fg">{title}</h2>}
                {description && <div className="mt-1 text-[13px] text-muted">{description}</div>}
              </div>
              <button onClick={onClose} className="-mr-2 grid size-9 place-items-center rounded-xl text-muted hover:bg-panel hover:text-fg" aria-label="Yopish">
                <X className="size-[18px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export interface DropdownItem {
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export function Dropdown({ trigger, items, align = 'right', className, children, width = 'w-56' }: { trigger: (open: boolean) => ReactNode; items?: DropdownItem[]; align?: 'left' | 'right'; className?: string; children?: (close: () => void) => ReactNode; width?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const close = () => setOpen(false);
  return (
    <div ref={ref} className={cn('relative', className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn('absolute z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-line bg-card p-1.5 shadow-lift', width, align === 'right' ? 'right-0' : 'left-0')}
          >
            {children?.(close)}
            {items?.map((it, i) =>
              it.divider ? (
                <div key={i} className="my-1 h-px bg-line" />
              ) : (
                <button
                  key={i}
                  disabled={it.disabled}
                  onClick={() => {
                    close();
                    it.onClick?.();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition disabled:opacity-40 [&_svg]:size-4',
                    it.danger ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10' : 'text-fg-soft hover:bg-panel hover:text-fg',
                  )}
                >
                  {it.icon}
                  {it.label}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
