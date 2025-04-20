import { useCallback, useMemo, useState } from "react";
import { useLectureColumn } from "./_components/columns";
import { Lecturer, lecturerSchema } from "@/lib/schema/lecturer";
import { UseLecturer } from "@/hooks/use-lecturer";
import { z } from "zod";

export function UseLecturePage() {
  const { getLecturers, deleteLecturer, updateLecturer, createLecturer } = UseLecturer();
  const [openForm, setOpenForm] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<Lecturer & { id?: string }>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');


  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, [])


  const handleSubmit = useCallback(() => {
    try {
      const validatedData = lecturerSchema.parse(formData)


      if (formData.id) {
        updateLecturer.mutate({ id: formData.id, ...validatedData });
      } else {
        createLecturer.mutate(validatedData);
      }

      setOpenForm(false);
      setFormData({});
    } catch (error) {
      if(error instanceof z.ZodError) {
        console.error("validation error:", error.errors)
      }
    }

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

  const filteredLecturers = useMemo(() => {
    const lecturers = getLecturers.data || [];

    if(!searchQuery) return lecturers;

    return lecturers.filter((lecturer) =>
      lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lecturer.lecturerCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [getLecturers.data, searchQuery])

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
    formData,
    searchQuery, 
    setSearchQuery,
    filteredLecturers,
  }
}