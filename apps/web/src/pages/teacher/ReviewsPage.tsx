import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { ClipboardCheck, Clock, Paperclip } from 'lucide-react';
import type { SubmissionView } from '@edu/shared';
import { fmtDateTime, fmtRelative } from '@/lib/format';
import { useCourses, useSubmission, useSubmissions } from '@/api/queries/learning';
import { ReviewDrawer } from '@/components/domain/Review';
import { Avatar, Badge, Card, DataTable, EmptyState, Page, PageHeader, SearchInput, Segmented, Select, type Column } from '@/components/ui';

type Status = 'submitted' | 'graded' | 'returned' | '';

export default function ReviewsPage() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('submitted');
  const [courseId, setCourseId] = useState('');
  const [q, setQ] = useState('');
  const { data: courses } = useCourses({ as: 'teacher' });
  const { data, isLoading } = useSubmissions({ as: 'teacher', status: status || undefined, courseId: courseId || undefined, q: q || undefined });
  const [activeId, setActiveId] = useState<string | null>(params.get('submission'));
  const { data: deepLinked } = useSubmission(activeId && !data?.some((s) => s.id === activeId) ? activeId : null);
  const active = data?.find((s) => s.id === activeId) ?? deepLinked ?? null;

  useEffect(() => {
    if (params.get('submission') && !activeId) setParams({}, { replace: true });
  }, [activeId, params, setParams]);

  const queue = useMemo(() => (data ?? []).filter((s) => s.status === 'submitted'), [data]);
  const next = () => {
    const i = queue.findIndex((s) => s.id === activeId);
    const n = queue[i + 1] ?? queue.find((s) => s.id !== activeId);
    setActiveId(n?.id ?? null);
  };

  const columns: Column<SubmissionView>[] = [
    {
      key: 'student',
      header: 'Talaba',
      sortValue: (s) => s.student.lastName,
      cell: (s) => (
        <div className="flex items-center gap-3">
          <Avatar user={s.student} size="md" />
          <div>
            <div className="font-bold text-fg">
              {s.student.lastName} {s.student.firstName}
            </div>
            <div className="text-[11px] text-muted">{s.student.groupName}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'assignment',
      header: 'Topshiriq',
      sortValue: (s) => s.assignment.title,
      cell: (s) => (
        <div className="min-w-0">
          <div className="max-w-[300px] truncate font-semibold text-fg">{s.assignment.title}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span className="truncate">{s.courseTitle}</span>
            {s.files.length > 0 && (
              <span className="flex items-center gap-0.5">
                <Paperclip className="size-3" /> {s.files.length}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Yuborilgan',
      sortValue: (s) => s.submittedAt,
      cell: (s) => (
        <div>
          <div className="text-[12.5px] font-semibold text-fg">{fmtDateTime(s.submittedAt)}</div>
          <div className="flex items-center gap-1 text-[11px] text-muted">
            {s.late && <Clock className="size-3 text-rose-500" />}
            {s.late ? <span className="text-rose-500">kech · </span> : null}
            {fmtRelative(s.submittedAt)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Holat',
      sortValue: (s) => s.status,
      cell: (s) =>
        s.status === 'graded' ? (
          <Badge tone="green">
            {s.score}/{s.assignment.maxScore}
          </Badge>
        ) : s.status === 'returned' ? (
          <Badge tone="red">Qaytarilgan</Badge>
        ) : (
          <Badge tone="amber" dot>
            Tekshirish
          </Badge>
        ),
    },
  ];

  return (
    <Page>
      <PageHeader title="Tekshirish" description="Talabalar yuborgan javoblarni baholang va izoh qoldiring" />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={status}
          onChange={setStatus}
          items={[
            { value: 'submitted', label: 'Kutilmoqda' },
            { value: 'graded', label: 'Baholangan' },
            { value: 'returned', label: 'Qaytarilgan' },
            { value: '', label: 'Barchasi' },
          ]}
        />
        <div className="flex gap-2">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} placeholder="Barcha kurslar" options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} className="w-64" />
          <SearchInput value={q} onChange={setQ} placeholder="Talaba yoki topshiriq" className="w-56" />
        </div>
      </div>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={data} loading={isLoading} rowKey={(s) => s.id} onRowClick={(s) => setActiveId(s.id)} pageSize={15} empty={<EmptyState icon={<ClipboardCheck />} title={status === 'submitted' ? 'Tekshiriladigan ishlar yo‘q 🎉' : 'Javoblar topilmadi'} />} />
      </Card>
      <ReviewDrawer submission={active} onClose={() => setActiveId(null)} onNext={status === 'submitted' ? next : undefined} />
    </Page>
  );
}
