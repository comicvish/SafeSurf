import { Type } from '@google/genai'
import { getGeminiClient } from './gemini.js'
import { db } from './firestore.js'
import { listCourseDetails } from './content.js'
import type { VideoDoc } from '../types.js'

const MODEL = 'gemini-flash-latest'
const MAX_DESCRIPTION_LENGTH = 1500

export interface LessonAssignmentSuggestion {
  courseId: string | null
  unitId: string | null
  order: number | null
  summary: string
  reasoning: string
}

interface RawSuggestion {
  courseId?: string | null
  unitId?: string | null
  order?: number | null
  summary?: string
  reasoning?: string
}

export async function suggestLessonAssignment(videoId: string): Promise<LessonAssignmentSuggestion> {
  const videoSnap = await db.collection('videos').doc(videoId).get()
  if (!videoSnap.exists) throw new Error(`Video ${videoId} not found`)
  const video = videoSnap.data() as VideoDoc

  const courses = await listCourseDetails()

  const structureText = courses
    .map((course) => {
      const unitsText = course.units
        .map((unit) => {
          const lessonsText = unit.lessons.length
            ? unit.lessons.map((l) => `      - ${l.title}: ${l.summary}`).join('\n')
            : '      (no lessons yet)'
          return `    Unit "${unit.title}" (unitId: ${unit.id}, ${unit.lessons.length} existing lesson(s)):\n${lessonsText}`
        })
        .join('\n')
      return `Course "${course.title}" (courseId: ${course.id}): ${course.description}\n${unitsText}`
    })
    .join('\n\n')

  const client = getGeminiClient()
  const response = await client.models.generateContent({
    model: MODEL,
    contents: `A new video was just added to VeraBlock's video pool and needs to be slotted into the existing curriculum below as a new lesson.\n\nVideo title: ${video.title}\nVideo description: ${video.description.slice(0, MAX_DESCRIPTION_LENGTH)}\n\nExisting curriculum:\n${structureText}`,
    config: {
      systemInstruction:
        'You are a curriculum curator for VeraBlock, a free internet-safety education platform for seniors. Given a new video and the existing course/unit structure, decide which existing course and unit it best fits as a new lesson, and where in that unit it should be ordered (usually appended at the end, unless it clearly teaches a prerequisite concept that belongs earlier). If the video does not fit any existing course or unit well, return null for courseId and unitId rather than forcing a bad fit. Always write a one-paragraph lesson summary in the same plain-language, encouraging style as the existing lesson summaries shown, describing what this specific video teaches — regardless of whether a course/unit match was found. courseId and unitId, if not null, MUST be copied exactly from the IDs shown in parentheses in the curriculum above — never invent an ID. Also give one brief sentence explaining your placement reasoning (or why no good fit exists).',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          courseId: { type: Type.STRING, nullable: true },
          unitId: { type: Type.STRING, nullable: true },
          order: { type: Type.INTEGER, nullable: true },
          summary: { type: Type.STRING },
          reasoning: { type: Type.STRING },
        },
        required: ['summary', 'reasoning'],
      },
    },
  })

  if (!response.text) throw new Error('Gemini did not return a suggestion')
  const parsed = JSON.parse(response.text) as RawSuggestion

  // Validate the returned IDs actually exist — never trust a model-generated
  // ID verbatim, since a hallucinated courseId/unitId would otherwise create
  // a lesson under a reference that doesn't really exist.
  const course = courses.find((c) => c.id === parsed.courseId)
  const unit = course?.units.find((u) => u.id === parsed.unitId)

  return {
    courseId: course ? course.id : null,
    unitId: unit ? unit.id : null,
    order: unit
      ? typeof parsed.order === 'number' && Number.isFinite(parsed.order)
        ? parsed.order
        : unit.lessons.length + 1
      : null,
    summary: parsed.summary?.trim() || '',
    reasoning: parsed.reasoning?.trim() || '',
  }
}
