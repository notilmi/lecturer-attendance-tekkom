import { useCallback, useMemo, useState } from "react";
import { useLectureColumn } from "./_components/columns";
import { Lecturer } from "@/lib/schema/lecturer";
import { UseLecturer } from "@/hooks/use-lecturer";

export function UseLecturePage() {
  const { getLecturers, deleteLecturer, updateLecturer, createLecturer } = UseLecturer();
  const [openForm, setOpenForm] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Lecturer & { id?: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, [])

  const handleSubmit = useCallback(() => {
    const { name, lecturerCode, rfidUid, status, id } = formData;

    if (!name || !lecturerCode || !rfidUid || !status) return;

    if (id) {
      updateLecturer.mutate({ id, name, lecturerCode, rfidUid, status });
    } else {
      createLecturer.mutate({ name, lecturerCode, rfidUid, status });
    }

    setOpenForm(false);
    setFormData({});
  }, [formData]);

  const handleEdit = useCallback((lecturer: Lecturer & { id: string }) => {
    setFormData(lecturer);
    setOpenForm(true);
  }, []);

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteLecturer.mutate(deleteId);
      setDeleteId(null);
      setOpenConfirm(false);
    }
  }, [deleteId]);

  const columns = useMemo(() => {
    return useLectureColumn(handleEdit, (id: string) => {
      setDeleteId(id);
      setOpenConfirm(true);
    });
  }, [handleEdit]);

  const data = useMemo(() => getLecturers.data || [], [getLecturers.data]);

  return {
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    columns,
    data,
    setOpenConfirm,
    openConfirm,
    openForm,
    setOpenForm,
    loading: getLecturers.isLoading,
    formData
  }
}