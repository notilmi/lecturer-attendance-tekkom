import { database } from "@/lib/firebase";
import { Lecturer, lecturerSchema } from "@/lib/schema/lecturer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ref, push, set, onValue, remove, update, get, child } from "firebase/database";
import { useEffect, useState } from "react";

export function UseLecturer() {
    const [lecturers, setLecturers] = useState<(Lecturer & {id: string})[]>([])
    const queryClient = useQueryClient();

    useEffect(() => {
        const lecturersRef = ref(database, "lecturers");

        const unsubscribe = onValue(lecturersRef, (snapshot) => {
            const data = snapshot.val();

            if(!data) return setLecturers([]);

            const parsed = Object.entries(data).map(([id, value]) => ({
                id,
                ...(value as Lecturer)
            }))

            setLecturers(parsed);
        });

        return () => unsubscribe();
    }, [])

    const getLecturers = useQuery({
        queryKey: ["lecturers"],
        queryFn: async () => {
            const snapshot = await get(child(ref(database), "lecturers"))
            const data = snapshot.val()

            if (!data) return [];

            return Object.entries(data).map(([id, value]) => ({
                id,
                ...(value as Lecturer),
            }));
        }
    })

    const createLecturer = useMutation({
        mutationFn: async (data: Lecturer) => {
            const parsed = lecturerSchema.parse(data);
            const newRef = push(ref(database, "lecturers"));
            await set(newRef, parsed);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lecturers"] });
        }
    })

    const updateLecturer = useMutation({
        mutationFn: async ({ id, ...data }: Lecturer & { id: string }) => {
            const parsed = lecturerSchema.parse(data);
            await update(ref(database, `lecturers/${id}`), parsed);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lecturers"] });
        },
    })

    // DELETE
    const deleteLecturer = useMutation({
        mutationFn: async (id: string) => {
            await remove(ref(database, `lecturers/${id}`));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lecturers"] });
        },
    });

    return {
        getLecturers,
        createLecturer,
        updateLecturer,
        deleteLecturer,
    };
}