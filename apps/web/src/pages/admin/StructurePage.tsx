import { useState } from 'react';
import { Building2, Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCrud, useDepartments, useFaculties, useGroups, useTeachers } from '@/api/queries/admin';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Modal, Page, PageHeader, Select, Skeleton } from '@/components/ui';

interface Editing {
  kind: 'faculty' | 'department';
  id?: string;
  name: string;
  shortName?: string;
  facultyId?: string;
  headId?: string | null;
  deanId?: string | null;
}

export default function StructurePage() {
  const { data: faculties } = useFaculties();
  const { data: departments } = useDepartments();
  const { data: groups } = useGroups();
  const { data: teachers } = useTeachers();
  const fac = useCrud<Record<string, unknown> & { id?: string }>('faculties', [['faculties'], ['departments']], 'Fakultet');
  const dep = useCrud<Record<string, unknown> & { id?: string }>('departments', [['departments']], 'Kafedra');
  const confirm = useConfirm();
  const [edit, setEdit] = useState<Editing | null>(null);
  const teacherName = (id?: string | null) => {
    const t = teachers?.find((x) => x.id === id);
    return t ? t : null;
  };

  const save = async () => {
    if (!edit || !edit.name.trim()) return;
    if (edit.kind === 'faculty') await fac.save.mutateAsync({ id: edit.id, name: edit.name, shortName: edit.shortName ?? edit.name.slice(0, 3).toUpperCase(), deanId: edit.deanId || null });
    else await dep.save.mutateAsync({ id: edit.id, name: edit.name, facultyId: edit.facultyId, headId: edit.headId || null });
    setEdit(null);
  };

  return (
    <Page>
      <PageHeader title="Fakultet va kafedralar" description="Universitetning tashkiliy tuzilmasi" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <CardHeader title="Fakultetlar" icon={<Landmark />} action={<Button size="sm" icon={<Plus />} onClick={() => setEdit({ kind: 'faculty', name: '', shortName: '' })}>Qo'shish</Button>} />
          <div className="space-y-2.5">
            {faculties?.map((f) => {
              const dean = teacherName(f.deanId);
              return (
                <div key={f.id} className="group flex items-center gap-3 rounded-2xl border border-line p-3.5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-fuchsia-500 text-sm font-extrabold text-white">{f.shortName}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-fg">{f.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      <span>{departments?.filter((d) => d.facultyId === f.id).length ?? 0} kafedra</span>·<span>{groups?.filter((g) => g.facultyId === f.id).length ?? 0} guruh</span>
                      {dean && (
                        <span className="flex items-center gap-1">
                          · Dekan: <Avatar user={dean} size="xs" /> {dean.lastName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex opacity-0 transition group-hover:opacity-100">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEdit({ kind: 'faculty', id: f.id, name: f.name, shortName: f.shortName, deanId: f.deanId })} aria-label="Tahrirlash">
                      <Pencil />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={async () => (await confirm({ title: "Fakultetni o'chirish", description: f.name, danger: true, confirmText: "O'chirish" })) && fac.remove.mutate(f.id)} aria-label="O'chirish">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            }) ?? <Skeleton className="h-40" />}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Kafedralar" icon={<Building2 />} action={<Button size="sm" icon={<Plus />} onClick={() => setEdit({ kind: 'department', name: '', facultyId: faculties?.[0]?.id })}>Qo'shish</Button>} />
          <div className="space-y-2.5">
            {departments?.map((d) => {
              const head = teacherName(d.headId);
              return (
                <div key={d.id} className="group flex items-center gap-3 rounded-2xl border border-line p-3.5">
                  <span className="grid size-11 place-items-center rounded-2xl bg-panel text-brand-600">
                    <Building2 className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-fg">{d.name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted">
                      <Badge>{d.faculty?.shortName}</Badge>
                      <span>{d.teacherCount} o'qituvchi</span>
                      {head && <span>· Mudir: {head.lastName} {head.firstName.charAt(0)}.</span>}
                    </div>
                  </div>
                  <div className="flex opacity-0 transition group-hover:opacity-100">
                    <Button size="icon-sm" variant="ghost" onClick={() => setEdit({ kind: 'department', id: d.id, name: d.name, facultyId: d.facultyId, headId: d.headId })} aria-label="Tahrirlash">
                      <Pencil />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={async () => (await confirm({ title: "Kafedrani o'chirish", description: d.name, danger: true, confirmText: "O'chirish" })) && dep.remove.mutate(d.id)} aria-label="O'chirish">
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              );
            }) ?? <Skeleton className="h-40" />}
          </div>
        </Card>
      </div>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit ? `${edit.id ? 'Tahrirlash' : "Qo'shish"}: ${edit.kind === 'faculty' ? 'fakultet' : 'kafedra'}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Bekor qilish
            </Button>
            <Button onClick={save} loading={fac.save.isPending || dep.save.isPending} disabled={!edit?.name.trim()}>
              Saqlash
            </Button>
          </>
        }
      >
        {edit && (
          <div className="grid gap-4">
            <Field label="Nomi" required>
              <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
            </Field>
            {edit.kind === 'faculty' ? (
              <>
                <Field label="Qisqa nomi">
                  <Input value={edit.shortName ?? ''} onChange={(e) => setEdit({ ...edit, shortName: e.target.value.toUpperCase() })} maxLength={6} />
                </Field>
                <Field label="Dekan">
                  <Select value={edit.deanId ?? ''} onChange={(e) => setEdit({ ...edit, deanId: e.target.value })} placeholder="— Tanlanmagan —" options={(teachers ?? []).map((t) => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Fakultet">
                  <Select value={edit.facultyId ?? ''} onChange={(e) => setEdit({ ...edit, facultyId: e.target.value })} options={(faculties ?? []).map((f) => ({ value: f.id, label: f.name }))} />
                </Field>
                <Field label="Kafedra mudiri">
                  <Select value={edit.headId ?? ''} onChange={(e) => setEdit({ ...edit, headId: e.target.value })} placeholder="— Tanlanmagan —" options={(teachers ?? []).map((t) => ({ value: t.id, label: `${t.lastName} ${t.firstName}` }))} />
                </Field>
              </>
            )}
          </div>
        )}
      </Modal>
    </Page>
  );
}
