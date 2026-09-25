import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Checkbox } from './Form';
import { EmptyState, Skeleton } from './Display';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  sortValue?: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  empty?: ReactNode;
  pageSize?: number;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
  /** Server-side pagination (disables client-side paging) */
  serverPage?: { page: number; total: number; limit: number; onPage: (p: number) => void };
  stickyFirst?: boolean;
}

export function DataTable<T>({ columns, rows, rowKey, loading, onRowClick, selectable, selected = [], onSelectedChange, empty, pageSize = 12, className, rowClassName, serverPage, stickyFirst }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const list = rows ?? [];
    if (!sort) return list;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return list;
    return [...list].sort((a, b) => {
      const x = col.sortValue!(a) ?? '';
      const y = col.sortValue!(b) ?? '';
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, sort, columns]);

  const pages = serverPage ? Math.max(1, Math.ceil(serverPage.total / serverPage.limit)) : Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = serverPage ? serverPage.page : Math.min(page, pages);
  const visible = serverPage ? sorted : sorted.slice((current - 1) * pageSize, current * pageSize);
  const total = serverPage ? serverPage.total : sorted.length;
  const allIds = visible.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected = allIds.some((id) => selected.includes(id));

  const goto = (p: number) => (serverPage ? serverPage.onPage(p) : setPage(p));

  return (
    <div className={cn('overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left text-[13px]">
          <thead>
            <tr>
              {selectable && (
                <th className="w-10 border-b border-line bg-panel/60 px-4 py-3">
                  <Checkbox checked={allSelected} indeterminate={!allSelected && someSelected} onChange={(v) => onSelectedChange?.(v ? [...new Set([...selected, ...allIds])] : selected.filter((id) => !allIds.includes(id)))} />
                </th>
              )}
              {columns.map((c, ci) => (
                <th
                  key={c.key}
                  style={{ width: c.width }}
                  className={cn(
                    'whitespace-nowrap border-b border-line bg-panel/60 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted',
                    c.align === 'right' && 'text-right',
                    c.align === 'center' && 'text-center',
                    stickyFirst && ci === 0 && 'sticky left-0 z-10 bg-panel',
                    c.headerClassName,
                  )}
                >
                  {c.sortValue ? (
                    <button className="inline-flex items-center gap-1 uppercase hover:text-fg" onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}>
                      {c.header}
                      {sort?.key === c.key ? sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows?.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {selectable && <td className="border-b border-line px-4 py-3.5" />}
                    {columns.map((c) => (
                      <td key={c.key} className="border-b border-line px-4 py-3.5">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              : visible.map((row, i) => {
                  const id = rowKey(row);
                  const isSel = selected.includes(id);
                  return (
                    <tr key={id} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('group transition-colors', onRowClick && 'cursor-pointer', isSel ? 'bg-brand-50/60 dark:bg-brand-500/10' : 'hover:bg-panel/60', rowClassName?.(row))}>
                      {selectable && (
                        <td className="border-b border-line px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSel} onChange={(v) => onSelectedChange?.(v ? [...selected, id] : selected.filter((x) => x !== id))} />
                        </td>
                      )}
                      {columns.map((c, ci) => (
                        <td key={c.key} className={cn('border-b border-line px-4 py-3 align-middle text-fg-soft', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center', stickyFirst && ci === 0 && 'sticky left-0 z-10 bg-card group-hover:bg-panel', c.className)}>
                          {c.cell(row, (current - 1) * pageSize + i)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
      {!loading && !visible.length && (empty ?? <EmptyState title="Ma'lumot topilmadi" description="Filtrlarni o'zgartirib ko'ring" />)}
      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted">
          <span>
            Jami <b className="text-fg">{total}</b> ta · {current}/{pages} sahifa
          </span>
          <div className="flex items-center gap-1">
            <button className="grid size-8 place-items-center rounded-lg hover:bg-panel disabled:opacity-40" disabled={current <= 1} onClick={() => goto(current - 1)} aria-label="Oldingi">
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === pages || Math.abs(p - current) <= 1)
              .map((p, i, arr) => (
                <span key={p} className="flex items-center">
                  {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1">…</span>}
                  <button onClick={() => goto(p)} className={cn('h-8 min-w-8 rounded-lg px-2 text-xs font-semibold', p === current ? 'bg-brand-600 text-white' : 'hover:bg-panel')}>
                    {p}
                  </button>
                </span>
              ))}
            <button className="grid size-8 place-items-center rounded-lg hover:bg-panel disabled:opacity-40" disabled={current >= pages} onClick={() => goto(current + 1)} aria-label="Keyingi">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
