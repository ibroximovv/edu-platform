import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BookMarked, CalendarCheck, ClipboardList, ListChecks, NotebookPen, Plus, Upload, Users } from 'lucide-react';
import type { AssignmentView, Topic } from '@edu/shared';
import { useAssignments, useCourse, useCourseStudents, useDeleteMaterial, useDeleteTopic, useMaterials, useReorderTopics, useSaveTopic, useTopics } from '@/api/queries/learning';
import { useAssessments } from '@/api/queries/assessments';
import { useGradebook } from '@/api/queries/journal';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { AttendanceBoard } from '@/components/domain/Attendance';
import { CourseHero } from '@/components/domain/CourseHero';
import { GradebookTable } from '@/components/domain/Gradebook';
import { MaterialUploadModal, useMaterialViewer } from '@/components/domain/Materials';
import { SubmissionsDrawer } from '@/components/domain/Review';
import { AssignmentFormModal, TopicFormModal } from '@/components/domain/TeacherForms';
import { AssessmentTable, AssignmentTable } from '@/components/domain/TeacherTables';
import { TopicsList } from '@/components/domain/Topics';
import { Avatar, Button, Card, DataTable, Page, PageHeader, Skeleton, Tabs } from '@/components/ui';

type Tab = 'topics' | 'assignments' | 'tests' | 'journal' | 'attendance' | 'students';

export default function CourseManagePage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'topics';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const navigate = useNavigate();
  const confirm = useConfirm();

  const { data: course } = useCourse(id);
  const { data: topics } = useTopics(id);
  const { data: materials } = useMaterials({ courseId: id });
  const { data: assignments, isLoading: aLoading } = useAssignments({ courseId: id }, tab === 'assignments');
  const { data: tests, isLoading: tLoading } = useAssessments({ courseId: id }, tab === 'tests');
  const { data: book } = useGradebook(tab === 'journal' ? id : undefined);
  const { data: students } = useCourseStudents(tab === 'students' ? id : undefined);

  const saveTopic = useSaveTopic();
  const deleteTopic = useDeleteTopic();
  const reorder = useReorderTopics();
  const deleteMaterial = useDeleteMaterial();
  const { open, viewer } = useMaterialViewer();

  const [topicModal, setTopicModal] = useState<{ open: boolean; topic?: Topic | null }>({ open: false });
  const [upload, setUpload] = useState<{ open: boolean; topicId?: string | null }>({ open: false });
  const [asgModal, setAsgModal] = useState<{ open: boolean; item?: AssignmentView | null }>({ open: false });
  const [subsFor, setSubsFor] = useState<AssignmentView | null>(null);

  const actionFor: Record<Tab, React.ReactNode> = {
    topics: (
      <div className="flex gap-2">
        <Button variant="outline" icon={<Upload />} onClick={() => setUpload({ open: true })}>
          Material
        </Button>
        <Button icon={<Plus />} onClick={() => setTopicModal({ open: true })}>
          Mavzu
        </Button>
      </div>
    ),
    assignments: (
      <Button icon={<Plus />} onClick={() => setAsgModal({ open: true })}>
        Topshiriq
      </Button>
    ),
    tests: (
      <Button icon={<Plus />} onClick={() => navigate(`/teacher/tests/new?courseId=${id}`)}>
        Test / nazorat
      </Button>
    ),
    journal: null,
    attendance: null,
    students: null,
  };

  return (
    <Page>
      <PageHeader title="" breadcrumbs={[{ label: 'Kurslarim', to: '/teacher/courses' }, { label: course?.subject.name ?? '...' }]} className="-mb-2" />
      <CourseHero course={course} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          className="flex-1"
          items={[
            { value: 'topics', label: 'Mavzular', icon: <BookMarked />, count: topics?.length },
            { value: 'assignments', label: 'Topshiriqlar', icon: <ClipboardList />, count: course?.stats.assignments },
            { value: 'tests', label: 'Test va nazorat', icon: <ListChecks /> },
            { value: 'journal', label: 'Jurnal', icon: <NotebookPen /> },
            { value: 'attendance', label: 'Davomat', icon: <CalendarCheck /> },
            { value: 'students', label: 'Talabalar', icon: <Users />, count: course?.stats.students },
          ]}
        />
        <div className="pb-2">{actionFor[tab]}</div>
      </div>

      {tab === 'topics' &&
        (topics && materials ? (
          <TopicsList
            topics={topics}
            materials={materials}
            onOpenMaterial={open}
            actions={{
              onEdit: (t) => setTopicModal({ open: true, topic: t }),
              onDelete: async (t) => {
                if (await confirm({ title: "Mavzuni o'chirish", description: `«${t.title}» o'chiriladi. Materiallar saqlanib qoladi.`, danger: true, confirmText: "O'chirish" })) deleteTopic.mutate(t.id);
              },
              onToggle: (t) => saveTopic.mutate({ id: t.id, courseId: t.courseId, title: t.title, type: t.type, hours: t.hours, status: t.status === 'done' ? 'planned' : 'done' }),
              onMove: (t, dir) => {
                const ids = topics.map((x) => x.id);
                const i = ids.indexOf(t.id);
                [ids[i], ids[i + dir]] = [ids[i + dir], ids[i]];
                reorder.mutate({ courseId: id, ids });
              },
              onUpload: (t) => setUpload({ open: true, topicId: t.id }),
              onDeleteMaterial: async (m) => {
                if (await confirm({ title: "Materialni o'chirish", description: `«${m.title}»`, danger: true, confirmText: "O'chirish" })) deleteMaterial.mutate(m.id);
              },
            }}
          />
        ) : (
          <Skeleton className="h-64" />
        ))}

      {tab === 'assignments' && (
        <Card className="overflow-hidden">
          <AssignmentTable rows={assignments} loading={aLoading} onEdit={(a) => setAsgModal({ open: true, item: a })} onOpen={setSubsFor} />
        </Card>
      )}

      {tab === 'tests' && (
        <Card className="overflow-hidden">
          <AssessmentTable rows={tests} loading={tLoading} />
        </Card>
      )}

      {tab === 'journal' && <Card className="overflow-hidden">{book ? <GradebookTable book={book} /> : <Skeleton className="m-5 h-64" />}</Card>}

      {tab === 'attendance' && (
        <Card className="overflow-hidden">
          <AttendanceBoard courseId={id} topics={topics ?? []} />
        </Card>
      )}

      {tab === 'students' && (
        <Card className="overflow-hidden">
          <DataTable
            rows={students}
            loading={!students}
            rowKey={(s) => s.id}
            columns={[
              { key: 'n', header: '№', width: '50px', cell: (_, i) => <span className="text-muted">{i + 1}</span> },
              {
                key: 'name',
                header: 'Talaba',
                sortValue: (s) => s.lastName,
                cell: (s) => (
                  <div className="flex items-center gap-3">
                    <Avatar user={s} size="md" />
                    <div>
                      <div className="font-bold text-fg">
                        {s.lastName} {s.firstName}
                      </div>
                      <div className="text-[11px] text-muted">{s.email}</div>
                    </div>
                  </div>
                ),
              },
              { key: 'group', header: 'Guruh', sortValue: (s) => s.groupName, cell: (s) => s.groupName },
              { key: 'rb', header: 'Reyting daftarchasi', cell: (s) => <span className="font-mono text-xs">{s.recordBook}</span> },
            ]}
            pageSize={20}
          />
        </Card>
      )}

      <TopicFormModal open={topicModal.open} onClose={() => setTopicModal({ open: false })} courseId={id} initial={topicModal.topic} />
      <MaterialUploadModal open={upload.open} onClose={() => setUpload({ open: false })} courseId={id} topics={topics ?? []} defaultTopicId={upload.topicId} />
      {course && <AssignmentFormModal open={asgModal.open} onClose={() => setAsgModal({ open: false })} courses={[course]} initial={asgModal.item} defaultCourseId={id} />}
      <SubmissionsDrawer assignment={subsFor} onClose={() => setSubsFor(null)} />
      {viewer}
    </Page>
  );
}
