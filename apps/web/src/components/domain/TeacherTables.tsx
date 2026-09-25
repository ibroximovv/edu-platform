import { useNavigate } from 'react-router';
import { BarChart3, MoreHorizontal, Pencil, Trash2, Users } from 'lucide-react';
import type { AssessmentView, AssignmentView } from '@edu/shared';
import { cn } from '@/lib/cn';
import { SUBJECT_COLORS } from '@/lib/colors';
import { fmtDateTime } from '@/lib/format';
import { ASSIGNMENT_TYPE, CATEGORY, FORMAT } from '@/lib/labels';
import { useDeleteAssignment } from '@/api/queries/learning';
import { useDeleteAssessment } from '@/api/queries/assessments';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Badge, DataTable, Dropdown, EmptyState, Progress, type Column } from '@/components/ui';
import { Deadline } from './Bits';

function Menu({ items }: { items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[] }) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown
        width="w-48"
        trigger={() => (
          <button className="grid size-8 place-items-center rounded-lg text-muted hover:bg-panel hover:text-fg" aria-label="Amallar">
            <MoreHorizontal className="size-4" />
          </button>
        )}
        items={items}
      />
    </div>
  );
}

export function AssignmentTable({ rows, loading, showCourse, onEdit, onOpen }: { rows?: AssignmentView[]; loading?: boolean; showCourse?: boolean; onEdit: (a: AssignmentView) => void; onOpen: (a: AssignmentView) => void }) {
  const del = useDeleteAssignment();
  const confirm = useConfirm();
  const columns: Column<AssignmentView>[] = [
    {
      key: 'title',
      header: 'Topshiriq',
      sortValue: (a) => a.title,
      cell: (a) => (
        <div className="flex items-center gap-3">
          <span className={cn('h-9 w-1.5 shrink-0 rounded-full', SUBJECT_COLORS[a.course.color].solid)} />
          <div className="min-w-0">
            <div className="max-w-[340px] truncate font-bold text-fg">{a.title}</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              {ASSIGNMENT_TYPE[a.type]} · {a.maxScore} ball
              {showCourse && <span className="truncate">· {a.course.title}</span>}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      cell: (a) => (a.status === 'draft' ? <Badge>Qoralama</Badge> : new Date(a.deadline).getTime() < Date.now() ? <Badge tone="gray">Yopilgan</Badge> : <Badge tone="green" dot>Faol</Badge>),
    },
    {
      key: 'deadline',
      header: 'Muddat',
      sortValue: (a) => a.deadline,
      cell: (a) => (
        <div>
          <div className="text-[12.5px] font-semibold text-fg">{fmtDateTime(a.deadline)}</div>
          <Deadline date={a.deadline} className="text-[11px]" />
        </div>
      ),
    },
    {
      key: 'progress',
      header: 'Topshirildi',
      sortValue: (a) => a.counts?.submitted ?? 0,
      cell: (a) =>
        a.counts ? (
          <div className="w-36">
            <div className="mb-1 flex justify-between text-[11px] font-semibold">
              <span className="text-fg">
                {a.counts.submitted}/{a.counts.students}
              </span>
              <span className={cn(a.counts.submitted - a.counts.graded > 0 ? 'text-amber-600' : 'text-emerald-600')}>{a.counts.submitted - a.counts.graded > 0 ? `${a.counts.submitted - a.counts.graded} tekshirish` : 'tekshirilgan'}</span>
            </div>
            <Progress value={(a.counts.submitted / Math.max(1, a.counts.students)) * 100} size="sm" />
          </div>
        ) : null,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Menu
          items={[
            { label: 'Javoblar', icon: <Users />, onClick: () => onOpen(a) },
            { label: 'Tahrirlash', icon: <Pencil />, onClick: () => onEdit(a) },
            {
              label: "O'chirish",
              icon: <Trash2 />,
              danger: true,
              onClick: async () => {
                if (await confirm({ title: "Topshiriqni o'chirish", description: `«${a.title}» va unga yuborilgan barcha javoblar o'chiriladi.`, danger: true, confirmText: "O'chirish" })) del.mutate(a.id);
              },
            },
          ]}
        />
      ),
    },
  ];
  return <DataTable columns={columns} rows={rows} loading={loading} rowKey={(a) => a.id} onRowClick={onOpen} empty={<EmptyState title="Topshiriqlar yo'q" description="Yangi topshiriq yarating" />} />;
}

export function AssessmentTable({ rows, loading, showCourse }: { rows?: AssessmentView[]; loading?: boolean; showCourse?: boolean }) {
  const navigate = useNavigate();
  const del = useDeleteAssessment();
  const confirm = useConfirm();
  const columns: Column<AssessmentView>[] = [
    {
      key: 'title',
      header: 'Nomi',
      sortValue: (a) => a.title,
      cell: (a) => (
        <div className="flex items-center gap-3">
          <span className={cn('h-9 w-1.5 shrink-0 rounded-full', SUBJECT_COLORS[a.course.color].solid)} />
          <div className="min-w-0">
            <div className="max-w-[320px] truncate font-bold text-fg">{a.title}</div>
            <div className="text-[11px] text-muted">
              {FORMAT[a.format]}
              {a.format === 'test' && ` · ${a.questionCount} savol · ${a.durationMin} daq`} · {a.maxScore} ball
              {showCourse && ` · ${a.course.title}`}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'cat', header: 'Turkum', cell: (a) => <Badge tone={a.category === 'final' ? 'red' : a.category === 'midterm' ? 'amber' : 'violet'}>{CATEGORY[a.category]}</Badge> },
    {
      key: 'time',
      header: 'Vaqt',
      sortValue: (a) => a.startsAt,
      cell: (a) => {
        const now = Date.now();
        const s = new Date(a.startsAt).getTime();
        const e = new Date(a.endsAt).getTime();
        return (
          <div>
            <div className="text-[12px] font-semibold text-fg">{fmtDateTime(a.startsAt)}</div>
            <div className="text-[11px]">{a.status === 'draft' ? <span className="text-muted">Qoralama</span> : now < s ? <span className="text-muted">Kutilmoqda</span> : now <= e ? <span className="font-semibold text-emerald-600">● Davom etmoqda</span> : <span className="text-muted">Yakunlangan</span>}</div>
          </div>
        );
      },
    },
    {
      key: 'counts',
      header: 'Natijalar',
      sortValue: (a) => a.counts?.finished ?? 0,
      cell: (a) =>
        a.counts ? (
          <div className="text-[12px]">
            <span className="font-bold text-fg">
              {a.counts.finished}/{a.counts.students}
            </span>{' '}
            <span className="text-muted">· o'rt. {a.counts.avgScore ?? '—'}</span>
          </div>
        ) : null,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (a) => (
        <Menu
          items={[
            { label: 'Natijalar', icon: <BarChart3 />, onClick: () => navigate(`/teacher/tests/${a.id}/results`) },
            { label: 'Tahrirlash', icon: <Pencil />, onClick: () => navigate(`/teacher/tests/${a.id}/edit`) },
            {
              label: "O'chirish",
              icon: <Trash2 />,
              danger: true,
              onClick: async () => {
                if (await confirm({ title: "O'chirish", description: `«${a.title}» va barcha natijalar o'chiriladi.`, danger: true, confirmText: "O'chirish" })) del.mutate(a.id);
              },
            },
          ]}
        />
      ),
    },
  ];
  return <DataTable columns={columns} rows={rows} loading={loading} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/teacher/tests/${a.id}/results`)} empty={<EmptyState title="Test va nazoratlar yo'q" description="Yangi test yoki nazorat ishini yarating" />} />;
}
