import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { useDeleteNotification, useMarkAllRead, useMarkRead, useNotifications } from '@/api/queries/misc';
import { NOTIFICATION_ICONS } from '@/components/layout/Topbar';
import { Button, Card, EmptyState, Page, PageHeader, Segmented, Skeleton } from '@/components/ui';

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { data, isLoading } = useNotifications({ unread: filter === 'unread' || undefined, limit: 100 });
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const del = useDeleteNotification();
  const navigate = useNavigate();

  return (
    <Page className="mx-auto max-w-3xl">
      <PageHeader
        title="Bildirishnomalar"
        description={data ? `${data.unread} ta o'qilmagan · jami ${data.total}` : ''}
        actions={
          <Button variant="outline" icon={<CheckCheck />} onClick={() => markAll.mutate()} disabled={!data?.unread}>
            Barchasini o'qish
          </Button>
        }
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        items={[
          { value: 'all', label: 'Barchasi' },
          { value: 'unread', label: "O'qilmagan", count: data?.unread },
        ]}
      />
      <Card className="overflow-hidden">
        {isLoading ? (
          <Skeleton className="m-5 h-64" />
        ) : data?.items.length ? (
          <ul>
            <AnimatePresence initial={false}>
              {data.items.map((n) => {
                const meta = NOTIFICATION_ICONS[n.type];
                return (
                  <motion.li key={n.id} layout exit={{ opacity: 0, height: 0 }} className={cn('group flex items-start gap-4 border-b border-line p-4 last:border-0', !n.read && 'bg-brand-50/40 dark:bg-brand-500/5')}>
                    <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', meta.tone)}>
                      <meta.icon className="size-5" />
                    </span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id);
                        if (n.link) navigate(n.link);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-fg">{n.title}</span>
                        {!n.read && <span className="size-2 rounded-full bg-brand-600" />}
                      </div>
                      <p className="mt-0.5 text-[13px] text-fg-soft">{n.body}</p>
                      <div className="mt-1 text-[11px] text-muted" title={fmtDateTime(n.createdAt)}>
                        {fmtRelative(n.createdAt)}
                      </div>
                    </button>
                    <button onClick={() => del.mutate(n.id)} className="grid size-8 place-items-center rounded-lg text-muted opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100 dark:hover:bg-rose-500/10" aria-label="O'chirish">
                      <Trash2 className="size-4" />
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        ) : (
          <EmptyState icon={<BellOff />} title="Bildirishnomalar yo'q" description="Yangi topshiriqlar, baholar va e'lonlar shu yerda paydo bo'ladi" />
        )}
      </Card>
    </Page>
  );
}
