import { Firestore } from '@google-cloud/firestore'

export const db = new Firestore({ projectId: process.env.FIREBASE_PROJECT_ID })
