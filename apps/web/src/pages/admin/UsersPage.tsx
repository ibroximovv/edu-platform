import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Ban, CheckCheck, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, UserCheck } from 'lucide-react';
import type { BulkUserAction, Role, UserRow, UserStatus } from '@edu/shared';
import { ROLE_META } from '@/config/navigation';
import { fmtNumericDate } from '@/lib/format';
import { USER_STATUS } from '@/lib/labels';
import { useBulkUsers, useDeleteUser, useUsers } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { useCurrentUser } from '@/stores/auth.store';
import { UserFormModal } from '@/components/domain/AdminForms';
import { Avatar, Badge, Button, Card, DataTable, Dropdown, Page, PageHeader, SearchInput, Segmented, Select, type Column } from '@/components/ui';

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

export default function UsersPage() {
  const [params, setParams] = useSearchParams();
  const me = useCurrentUser();
  const [q, setQ] = useState(params.get('q') ?? '');
  const role = (params.get('role') ?? '') as Role | '';
  const status = (params.get('status') ?? '') as UserStatus | '';
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<{ open: boolean; user?: UserRow | null }>({ open: false });
  const dq = useDebounced(q);
  const { data, isLoading, isFetching } = useUsers({ q: dq || undefined, role: role || undefined, status: status || undefined, page, limit: 15 });
  const bulk = useBulkUsers();
  const del = useDeleteUser();
  const confirm = useConfirm();

  useEffect(() => setPage(1), [dq, role, status]);
  const setFilter = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const runBulk = async (action: BulkUserAction) => {
    const labels: Record<BulkUserAction, string> = { approve: 'tasdiqlash', activate: 'faollashtirish', block: 'bloklash', delete: "o'chirish" };
    if (await confirm({ title: `${selected.length} ta foydalanuvchini ${labels[action]}`, description: action === 'delete' ? "Bu amalni qaytarib bo'lmaydi." : undefined, danger: action === 'delete' || action === 'block', confirmText: 'Tasdiqlash' })) {
      await bulk.mutateAsync({ ids: selected, action });
      setSelected([]);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: 'user',
      header: 'Foydalanuvchi',
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar user={u} size="md" />
          <div className="min-w-0">
            <div className="truncate font-bold text-fg">
              {u.lastName} {u.firstName} {u.id === me?.id && <span className="text-[11px] font-semibold text-brand-600">(siz)</span>}
            </div>
            <div className="truncate text-[11px] text-muted">{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Rollar',
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          {u.roles.map((r) => (
            <Badge key={r} tone={r === 'admin' ? 'red' : r === 'teacher' ? 'sky' : 'violet'}>
              {ROLE_META[r].label}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'unit', header: 'Guruh / kafedra', cell: (u) => <span className="text-[12.5px]">{[u.groupName, u.departmentName].filter(Boolean).join(' · ') || <span className="text-muted">—</span>}</span> },
    {
      key: 'status',
      header: 'Holat',
      cell: (u) => (
        <Badge tone={u.status === 'active' ? 'green' : u.status === 'pending' ? 'amber' : 'red'} dot>
          {USER_STATUS[u.status]}
        </Badge>
      ),
    },
    { key: 'created', header: "Qo'shilgan", cell: (u) => <span className="text-[12.5px] tabular-nums">{fmtNumericDate(u.createdAt)}</span> },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (u) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            width="w-48"
            trigger={() => (
              <button className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg" aria-label="Amallar">
                <MoreHorizontal className="size-4" />
              </button>
            )}
            items={[
              { label: 'Tahrirlash', icon: <Pencil />, onClick: () => setModal({ open: true, user: u }) },
              ...(u.status === 'pending' ? [{ label: 'Tasdiqlash', icon: <UserCheck />, onClick: () => bulk.mutate({ ids: [u.id], action: 'approve' }) }] : []),
              ...(u.status === 'blocked' ? [{ label: 'Faollashtirish', icon: <ShieldCheck />, onClick: () => bulk.mutate({ ids: [u.id], action: 'activate' }) }] : []),
              ...(u.status === 'active' && u.id !== me?.id ? [{ label: 'Bloklash', icon: <Ban />, onClick: () => bulk.mutate({ ids: [u.id], action: 'block' }) }] : []),
              ...(u.id !== me?.id
                ? [
                    {
                      label: "O'chirish",
                      icon: <Trash2 />,
                      danger: true,
                      onClick: async () => {
                        if (await confirm({ title: "Foydalanuvchini o'chirish", description: `${u.lastName} ${u.firstName} (${u.email})`, danger: true, confirmText: "O'chirish" })) del.mutate(u.id);
                      },
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <Page>
      <PageHeader
        title="Foydalanuvchilar"
        description="Talabalar, o'qituvchilar va administratorlar. Bitta foydalanuvchi bir nechta rolga ega bo'lishi mumkin."
        actions={
          <Button icon={<Plus />} onClick={() => setModal({ open: true })}>
            Yangi foydalanuvchi
          </Button>
        }
      />
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <Segmented
          value={status}
          onChange={(v) => setFilter('status', v)}
          items={[
            { value: '', label: 'Barchasi' },
            { value: 'active', label: 'Faol' },
            { value: 'pending', label: 'Kutilmoqda' },
            { value: 'blocked', label: 'Bloklangan' },
          ]}
        />
        <div className="flex gap-2">
          <Select value={role} onChange={(e) => setFilter('role', e.target.value)} placeholder="Barcha rollar" options={(['student', 'teacher', 'admin'] as Role[]).map((r) => ({ value: r, label: ROLE_META[r].label }))} className="w-44" />
          <SearchInput value={q} onChange={setQ} placeholder="Ism, email, daftarcha..." className="w-64" />
        </div>
      </div>

      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-white shadow-brand">
            <span className="mr-auto text-sm font-bold">{selected.length} ta tanlandi</span>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" icon={<CheckCheck />} onClick={() => runBulk('approve')}>
              Tasdiqlash
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" icon={<ShieldCheck />} onClick={() => runBulk('activate')}>
              Faollashtirish
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" icon={<Ban />} onClick={() => runBulk('block')}>
              Bloklash
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/15 hover:text-white" icon={<Trash2 />} onClick={() => runBulk('delete')}>
              O'chirish
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Card className={isFetching ? 'overflow-hidden opacity-80 transition-opacity' : 'overflow-hidden transition-opacity'}>
        <DataTable
          columns={columns}
          rows={data?.items}
          loading={isLoading}
          rowKey={(u) => u.id}
          selectable
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(u) => setModal({ open: true, user: u })}
          serverPage={data ? { page: data.page, total: data.total, limit: data.limit, onPage: setPage } : undefined}
        />
      </Card>
      <UserFormModal open={modal.open} onClose={() => setModal({ open: false })} initial={modal.user} />
    </Page>
  );
}
