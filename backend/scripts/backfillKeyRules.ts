import { db } from '../src/services/firestore.js'

// One-off: backfill the memorable "key rule" line for the 3 lessons that
// already have full video scripts written, using the exact phrasing from
// those scripts.
const KEY_RULES: Record<string, string> = {
  'recognizing-urgent-language': 'Real emergencies survive a callback.',
  'verifying-a-caller': 'Verify with a number you already had — never one they just gave you.',
  'fake-shopping-sites': 'Too cheap, unusual payment, no track record — any one is a reason to pause.',
}

async function main() {
  for (const [lessonId, keyRule] of Object.entries(KEY_RULES)) {
    await db.collection('lessons').doc(lessonId).set({ keyRule }, { merge: true })
    console.log(`Set keyRule for ${lessonId}`)
  }
  console.log('Done.')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
