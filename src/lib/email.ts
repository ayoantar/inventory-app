import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

// Create reusable transporter object using SMTP transport
let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    })
  }
  return transporter
}

// Default email settings
export const EMAIL_FROM = process.env.EMAIL_FROM || 'LSVR Inventory <inventory@lightsailvr.com>'
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'support@lightsailvr.com'

// Email sending wrapper with error handling
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = EMAIL_REPLY_TO,
}: {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}) {
  try {
    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('SMTP not configured. Skipping email send.')
      console.log('To enable emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD in .env')
      return { success: false, error: 'SMTP not configured' }
    }

    const mailTransporter = getTransporter()

    // Verify connection configuration
    if (process.env.NODE_ENV === 'development') {
      await mailTransporter.verify()
    }

    // Send mail with defined transport object
    const info = await mailTransporter.sendMail({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text: text || 'This email requires HTML support to be viewed properly.',
      html,
      replyTo,
    })

    console.log('Email sent successfully:', info.messageId)
    return { success: true, data: { id: info.messageId } }
  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

export default { sendEmail }