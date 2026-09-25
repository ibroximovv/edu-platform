import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'soft' | 'danger' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-brand hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-600/30',
  secondary: 'bg-panel text-fg hover:bg-line/70',
  outline: 'border border-line bg-card text-fg hover:bg-panel hover:border-brand-300 dark:hover:border-brand-500/50',
  ghost: 'text-fg-soft hover:bg-panel hover:text-fg',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-300 dark:hover:bg-brand-500/25',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-[0_10px_30px_-10px_rgb(244_63_94/0.6)]',
  success: 'bg-emerald-500 text-white hover:bg-emerald-600',
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs rounded-lg [&_svg]:size-3.5',
  sm: 'h-9 px-3.5 text-[13px] rounded-xl [&_svg]:size-4',
  md: 'h-10 px-4 text-[13px] rounded-xl [&_svg]:size-4',
  lg: 'h-12 px-6 text-sm rounded-2xl [&_svg]:size-[18px]',
  icon: 'size-10 rounded-xl [&_svg]:size-[18px]',
  'icon-sm': 'size-8 rounded-lg [&_svg]:size-4',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 className="animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
});

export function ButtonLink({ variant = 'primary', size = 'md', className, icon, iconRight, children, ...props }: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: ReactNode; iconRight?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
      {iconRight}
    </Link>
  );
}
