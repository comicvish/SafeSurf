import { db } from './firestore.js'
import type { ProgressDoc } from '../types.js'

function progressCollection(uid: string) {
  return db.collection('users').doc(uid).collection('progress')
}

export async function getProgress(uid: string): Promise<string[]> {
  const snap = await progressCollection(uid).get()
  return snap.docs.map((doc) => doc.id)
}

export async function setLessonComplete(uid: string, lessonId: string, completed: boolean): Promise<void> {
  const ref = progressCollection(uid).doc(lessonId)
  if (completed) {
    await ref.set({ completed: true, completedAt: new Date().toISOString() } satisfies ProgressDoc)
  } else {
    await ref.delete()
  }
}
