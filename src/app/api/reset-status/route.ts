import { NextResponse } from 'next/server';
import { ref, get, update, set } from 'firebase/database';
import { database } from '@/lib/firebase';

export async function GET(): Promise<NextResponse> {
  try {
    const lecturersRef = ref(database, '/lecturers');
    const snapshot = await get(lecturersRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ message: 'No lecturers found to reset' });
    }

    const updates: Record<string, string> = {};
    const lecturers = snapshot.val() as Record<string, { status?: string }>;

    Object.keys(lecturers).forEach((lecturerId) => {
      updates[`/lecturers/${lecturerId}/status`] = 'Belum hadir';
    });

    await update(ref(database), updates);

    await set(ref(database, '/system/lastReset'), {
      time: Date.now(),
      date: new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({ message: 'Reset successful' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}
