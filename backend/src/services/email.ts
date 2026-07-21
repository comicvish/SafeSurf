import nodemailer, { type Transporter } from 'nodemailer'
import type { DueReview } from '../types.js'

const CONTACT_EMAIL = 'support@verablock.org'

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })
  }
  return transporter
}

export interface InquiryInput {
  name: string
  email: string
  preferredDate?: string
  message: string
}

export async function sendInquiryEmail(input: InquiryInput): Promise<void> {
  const lines = [
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    input.preferredDate ? `Preferred start date: ${input.preferredDate}` : null,
    '',
    input.message,
  ].filter((line): line is string => line !== null)

  await getTransporter().sendMail({
    from: `VeraBlock In-Person Courses <${process.env.GMAIL_USER}>`,
    to: CONTACT_EMAIL,
    replyTo: input.email,
    subject: `Interested in the VeraBlock in-person course — ${input.name}`,
    text: lines.join('\n'),
  })
}

export async function sendReviewReminderEmail(
  to: string,
  input: { dueLessons: DueReview[]; dashboardUrl: string; unsubscribeUrl: string },
): Promise<void> {
  const lessonLines = input.dueLessons.flatMap((lesson) => {
    const lines = [`- ${lesson.title}`]
    if (lesson.keyRule) lines.push(`  Remember: ${lesson.keyRule}`)
    return lines
  })

  const plural = input.dueLessons.length === 1 ? 'lesson is' : 'lessons are'
  const text = [
    `You have ${input.dueLessons.length} ${plural} due for review on VeraBlock:`,
    '',
    ...lessonLines,
    '',
    `Review now: ${input.dashboardUrl}`,
    '',
    `Don't want these reminders? Unsubscribe: ${input.unsubscribeUrl}`,
  ].join('\n')

  await getTransporter().sendMail({
    from: `VeraBlock <${process.env.GMAIL_USER}>`,
    to,
    subject:
      input.dueLessons.length === 1
        ? `A lesson is due for review: ${input.dueLessons[0].title}`
        : `${input.dueLessons.length} lessons are due for review`,
    text,
  })
}
