import nodemailer, { type Transporter } from 'nodemailer'

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
