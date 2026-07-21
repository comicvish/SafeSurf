import type { QueryDocumentSnapshot } from '@google-cloud/firestore'
import { db } from './firestore.js'
import type { FamilyLinkDoc, FamilyLinkStatus } from '../types.js'

const INVITE_EXPIRY_DAYS = 7

export class FamilyLinkError extends Error {}

async function findLinkDocForUser(uid: string): Promise<QueryDocumentSnapshot | null> {
  const [asInviter, asAccepter] = await Promise.all([
    db.collection('familyLinks').where('inviterUid', '==', uid).limit(1).get(),
    db.collection('familyLinks').where('accepterUid', '==', uid).limit(1).get(),
  ])
  return asInviter.docs[0] ?? asAccepter.docs[0] ?? null
}

export async function createInvite(uid: string, email: string): Promise<{ linkId: string; expiresAt: string }> {
  const existing = await findLinkDocForUser(uid)
  if (existing) throw new FamilyLinkError('You already have a family link — unlink first to start a new one')

  const now = new Date()
  const expiresAt = new Date(now.getTime() + INVITE_EXPIRY_DAYS * 86_400_000).toISOString()
  const ref = await db.collection('familyLinks').add({
    inviterUid: uid,
    inviterEmail: email,
    status: 'pending',
    createdAt: now.toISOString(),
    expiresAt,
  } satisfies FamilyLinkDoc)

  return { linkId: ref.id, expiresAt }
}

export async function acceptInvite(linkId: string, uid: string, email: string): Promise<void> {
  const ref = db.collection('familyLinks').doc(linkId)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw new FamilyLinkError('This invite link is no longer valid')
    const link = snap.data() as FamilyLinkDoc
    if (link.status !== 'pending') throw new FamilyLinkError('This invite has already been accepted')
    if (new Date(link.expiresAt).getTime() < Date.now()) throw new FamilyLinkError('This invite link has expired')
    if (link.inviterUid === uid) throw new FamilyLinkError("You can't accept your own invite")

    const existingForAccepter = await findLinkDocForUser(uid)
    if (existingForAccepter) throw new FamilyLinkError('You already have a family link — unlink first to accept a new one')

    tx.update(ref, { accepterUid: uid, accepterEmail: email, status: 'active' })
  })
}

export async function confirmSafeWord(uid: string): Promise<void> {
  const doc = await findLinkDocForUser(uid)
  if (!doc) throw new FamilyLinkError('No family link found')
  const link = doc.data() as FamilyLinkDoc
  if (link.status !== 'active') throw new FamilyLinkError('Your family link is still pending acceptance')
  await doc.ref.update({ safeWordConfirmedAt: new Date().toISOString() })
}

export async function unlink(uid: string): Promise<void> {
  const doc = await findLinkDocForUser(uid)
  if (!doc) return
  await doc.ref.delete()
}

export async function getStatus(uid: string): Promise<FamilyLinkStatus | null> {
  const doc = await findLinkDocForUser(uid)
  if (!doc) return null
  const link = doc.data() as FamilyLinkDoc
  const role = link.inviterUid === uid ? 'inviter' : 'accepter'
  const otherEmail = role === 'inviter' ? (link.accepterEmail ?? null) : link.inviterEmail

  return {
    linkId: doc.id,
    status: link.status,
    role,
    otherEmail,
    safeWordConfirmedAt: link.safeWordConfirmedAt ?? null,
  }
}
