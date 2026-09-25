import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useCourses, useDeleteMaterial, useTopics } from '@/api/queries/learning';
import { useConfirm } from '@/contexts/ConfirmProvider';
import { MaterialUploadModal } from '@/components/domain/Materials';
import { Button, Field, Modal, Select } from '@/components/ui';
import { MaterialsLibrary } from '../student/MaterialsPage';

export default function TeacherMaterialsPage() {
  const { data: courses } = useCourses({ as: 'teacher' });
  const del = useDeleteMaterial();
  const confirm = useConfirm();
  const [pick, setPick] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const { data: topics } = useTopics(uploadFor ?? undefined);

  return (
    <>
      <MaterialsLibrary
        as="teacher"
        actions={
          <Button icon={<Upload />} onClick={() => setPick(true)} disabled={!courses?.length}>
            Material yuklash
          </Button>
        }
        onDelete={async (id) => {
          if (await confirm({ title: "Materialni o'chirish", description: "Material talabalar uchun ham o'chiriladi", danger: true, confirmText: "O'chirish" })) del.mutate(id);
        }}
      />
      <Modal
        open={pick}
        onClose={() => setPick(false)}
        size="sm"
        title="Kursni tanlang"
        footer={
          <Button
            disabled={!courseId && !courses?.[0]}
            onClick={() => {
              setUploadFor(courseId || courses![0].id);
              setPick(false);
            }}
          >
            Davom etish
          </Button>
        }
      >
        <Field label="Kurs">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} options={(courses ?? []).map((c) => ({ value: c.id, label: `${c.subject.name} · ${c.groups.map((g) => g.name).join(', ')}` }))} />
        </Field>
      </Modal>
      {uploadFor && <MaterialUploadModal open={!!uploadFor} onClose={() => setUploadFor(null)} courseId={uploadFor} topics={topics ?? []} />}
    </>
  );
}
