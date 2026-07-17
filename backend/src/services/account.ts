import { db } from './firestore.js'
import { auth } from './firebaseAdmin.js'

async function deleteSubcollection(uid: string, subcollection: string): Promise<void> {
  const snap = await db.collection('users').doc(uid).collection(subcollection).get()
  if (snap.empty) return
  const batch = db.batch()
  snap.docs.forEach((doc) => batch.delete(doc.ref))
  await batch.commit()
}

export async function deleteAccount(uid: string): Promise<void> {
  await Promise.all([deleteSubcollection(uid, 'progress'), deleteSubcollection(uid, 'practiceResults')])
  await db.collection('users').doc(uid).delete()
  await auth.deleteUser(uid)
}
