import { getGeminiClient } from './gemini.js'

const GRAPH_API_HOST = 'https://graph.instagram.com/v25.0'
const CAPTION_MODEL = 'gemini-flash-latest'

interface InstagramConfig {
  accessToken: string
  businessAccountId: string
}

function getInstagramConfig(): InstagramConfig | null {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID
  if (!accessToken || !businessAccountId) return null
  return { accessToken, businessAccountId }
}

async function graphPost(
  path: string,
  body: Record<string, string>,
  accessToken: string,
): Promise<{ id: string }> {
  const res = await fetch(`${GRAPH_API_HOST}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  const data = (await res.json()) as { id?: string; error?: { message?: string } }
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message ?? `Instagram API request to ${path} failed with status ${res.status}`)
  }
  return { id: data.id }
}

export interface PublishInstagramPostInput {
  imageUrl: string
  caption: string
}

// Returns whether Instagram is configured at all — lets callers skip
// generating a caption (a Gemini call) for a post that has nowhere to go.
export function isInstagramConfigured(): boolean {
  return getInstagramConfig() !== null
}

export async function publishInstagramPost(input: PublishInstagramPostInput): Promise<void> {
  const config = getInstagramConfig()
  if (!config) {
    throw new Error('Instagram is not configured (missing INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_BUSINESS_ACCOUNT_ID)')
  }

  const container = await graphPost(
    `/${config.businessAccountId}/media`,
    { image_url: input.imageUrl, caption: input.caption },
    config.accessToken,
  )
  await graphPost(`/${config.businessAccountId}/media_publish`, { creation_id: container.id }, config.accessToken)
}

export interface GenerateInstagramCaptionInput {
  lessonTitle: string
  courseTitle: string
  unitTitle: string
  lessonSummary: string
}

export async function generateInstagramCaption(input: GenerateInstagramCaptionInput): Promise<string> {
  const client = getGeminiClient()
  const response = await client.models.generateContent({
    model: CAPTION_MODEL,
    contents: `Write an Instagram caption announcing a new lesson on VeraBlock.\n\nCourse: ${input.courseTitle}\nUnit: ${input.unitTitle}\nLesson: ${input.lessonTitle}\nWhat it covers: ${input.lessonSummary}`,
    config: {
      systemInstruction:
        'You write short, warm, encouraging Instagram captions for VeraBlock, a free internet-safety education platform whose primary audience is seniors. Tone: welcoming, plain-language, never condescending, never fear-mongering. 2-4 short sentences, at most one emoji (or none), end with a clear call to action to watch the lesson at verablock.org. Add 3-5 relevant, non-spammy hashtags on a final line (e.g. #InternetSafety #OnlineSafety #SeniorsOnline). No markdown formatting — this is posted as plain text.',
    },
  })

  const caption = response.text?.trim()
  if (!caption) throw new Error('Gemini did not return a caption')
  return caption
}
