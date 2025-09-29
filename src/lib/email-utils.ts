import { format } from 'date-fns'
import { sendEmail } from './email'

interface SendTransactionEmailParams {
  transactionType: 'CHECKOUT' | 'CHECKIN'
  userName: string
  userEmail: string
  assets: Array<{
    id: string
    name: string
    assetNumber?: string | null
    serialNumber?: string | null
    category: string
    currentValue?: number | null
    purchasePrice?: number | null
    imageUrl?: string | null
    notes?: string | null
    returnDate?: string | null
  }>
  transactionDate?: Date
}

export async function sendTransactionEmail({
  transactionType,
  userName,
  userEmail,
  assets,
  transactionDate = new Date(),
}: SendTransactionEmailParams) {
  try {
    // Calculate total value
    const totalValue = assets.reduce((sum, asset) => {
      const value = asset.currentValue || asset.purchasePrice || 0
      return sum + value
    }, 0)

    // Generate HTML email
    const emailHtml = generateHtmlEmail({
      transactionType,
      userName,
      userEmail,
      assets,
      transactionDate,
      totalValue,
    })

    // Generate plain text version
    const emailText = generatePlainTextEmail({
      transactionType,
      userName,
      userEmail,
      assets,
      transactionDate,
      totalValue,
    })

    // Send the email
    const result = await sendEmail({
      to: userEmail,
      subject: `${transactionType === 'CHECKOUT' ? 'Checkout' : 'Check-in'} Confirmation - LSVR Inventory`,
      html: emailHtml,
      text: emailText,
    })

    return result
  } catch (error) {
    console.error('Error sending transaction email:', error)
    return { success: false, error }
  }
}

// Generate HTML email template
function generateHtmlEmail({
  transactionType,
  userName,
  userEmail,
  assets,
  transactionDate,
  totalValue,
}: {
  transactionType: 'CHECKOUT' | 'CHECKIN'
  userName: string
  userEmail: string
  assets: Array<{
    name: string
    assetNumber?: string | null
    serialNumber?: string | null
    category: string
    currentValue?: number | null
    purchasePrice?: number | null
    imageUrl?: string | null
    notes?: string | null
    returnDate?: string | null
  }>
  transactionDate: Date
  totalValue: number
}) {
  const isCheckout = transactionType === 'CHECKOUT'
  const statusColor = isCheckout ? '#FEF3C7' : '#D1FAE5'
  const statusTextColor = isCheckout ? '#92400E' : '#065F46'
  const statusText = isCheckout ? '📦 CHECKOUT CONFIRMATION' : '✅ CHECK-IN CONFIRMATION'

  const assetRows = assets.map((asset) => {
    const value = asset.currentValue || asset.purchasePrice
    return `
      <tr style="border-bottom: 1px solid #e6ebf1;">
        <td style="padding: 16px; vertical-align: top;">
          <div style="display: flex; align-items: flex-start;">
            ${asset.imageUrl ? `
              <img src="${asset.imageUrl}" alt="${asset.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 16px;">
            ` : `
              <div style="width: 60px; height: 60px; background: #f6f9fc; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 16px; font-size: 24px;">📦</div>
            `}
            <div>
              <h4 style="margin: 0 0 8px 0; color: #1A2332; font-size: 16px; font-weight: 600;">${asset.name}</h4>
              <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Category: ${asset.category.replace(/_/g, ' ')}</p>
              ${asset.assetNumber ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Asset #: ${asset.assetNumber}</p>` : ''}
              ${asset.serialNumber ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Serial #: ${asset.serialNumber}</p>` : ''}
              ${value ? `<p style="margin: 4px 0; color: #6b7280; font-size: 14px;">Value: $${value.toLocaleString()}</p>` : ''}
              ${isCheckout && asset.returnDate ? `<p style="margin: 4px 0; color: #F54F29; font-size: 14px; font-weight: 500;">Return Date: ${format(new Date(asset.returnDate), 'PPP')}</p>` : ''}
              ${isCheckout && !asset.returnDate ? `<p style="margin: 4px 0; color: #F54F29; font-size: 14px; font-weight: 500;">Return Date: No return date set</p>` : ''}
              ${asset.notes ? `<p style="margin: 8px 0 0; color: #6b7280; font-size: 13px; font-style: italic;">Notes: ${asset.notes}</p>` : ''}
            </div>
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isCheckout ? 'Checkout' : 'Check-in'} Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f6f9fc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; margin-top: 32px; margin-bottom: 32px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #1A2332; padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #F54F29; font-size: 24px; font-weight: 600; letter-spacing: 2px;">LSVR WAREHOUSE</h1>
          <p style="margin: 8px 0 0; color: #C5CAD6; font-size: 14px;">Inventory Management System</p>
        </div>

        <!-- Status Badge -->
        <div style="padding: 24px 32px; text-align: center;">
          <div style="display: inline-block; background-color: ${statusColor}; color: ${statusTextColor}; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600;">
            ${statusText}
          </div>
        </div>

        <!-- Transaction Info -->
        <div style="padding: 0 32px;">
          <table style="width: 100%; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>User:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${userName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Date:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">${format(transactionDate, 'PPP p')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;"><strong>Total Value:</strong></td>
              <td style="padding: 8px 0; color: #484848; font-size: 14px;">$${totalValue.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 24px 32px;">

        <!-- Assets List -->
        <div style="padding: 0 32px;">
          <h2 style="color: #1A2332; font-size: 18px; font-weight: 600; margin: 0 0 16px;">
            ${isCheckout ? 'Assets Checked Out' : 'Assets Checked In'}
          </h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${assetRows}
          </table>
        </div>

        ${isCheckout ? `
          <div style="background-color: #FEF3C7; padding: 24px 32px; margin: 24px 32px; border-radius: 8px;">
            <h3 style="color: #92400E; font-size: 16px; font-weight: 600; margin: 0 0 12px;">⚠️ Important Reminders</h3>
            <ul style="margin: 0; padding-left: 20px; color: #92400E; font-size: 14px;">
              <li style="margin: 4px 0;">Please handle all equipment with care</li>
              <li style="margin: 4px 0;">Report any damage or issues immediately</li>
              <li style="margin: 4px 0;">Return items by their scheduled return date</li>
              <li style="margin: 4px 0;">Keep this email for your records</li>
            </ul>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="padding: 32px; text-align: center; background-color: #f6f9fc;">
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            This is an automated email from the LSVR Inventory Management System.
          </p>
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            If you have any questions, please contact <a href="mailto:support@lightsailvr.com" style="color: #F54F29; text-decoration: none;">support@lightsailvr.com</a>
          </p>
          <p style="margin: 4px 0; color: #8898aa; font-size: 12px;">
            © ${new Date().getFullYear()} LightSail VR. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate plain text version of the email
function generatePlainTextEmail({
  transactionType,
  userName,
  userEmail,
  assets,
  transactionDate,
  totalValue,
}: {
  transactionType: 'CHECKOUT' | 'CHECKIN'
  userName: string
  userEmail: string
  assets: Array<{
    name: string
    assetNumber?: string | null
    serialNumber?: string | null
    category: string
    currentValue?: number | null
    purchasePrice?: number | null
    notes?: string | null
    returnDate?: string | null
  }>
  transactionDate: Date
  totalValue: number
}) {
  const isCheckout = transactionType === 'CHECKOUT'
  const action = isCheckout ? 'checked out' : 'checked in'

  let text = `LSVR WAREHOUSE - Inventory Management System\n\n`
  text += `${isCheckout ? 'CHECKOUT' : 'CHECK-IN'} CONFIRMATION\n\n`
  text += `User: ${userName}\n`
  text += `Email: ${userEmail}\n`
  text += `Date: ${transactionDate.toLocaleString()}\n`
  text += `Total Value: $${totalValue.toLocaleString()}\n\n`
  text += `Assets ${action}:\n`
  text += `${'='.repeat(50)}\n\n`

  assets.forEach((asset, index) => {
    const value = asset.currentValue || asset.purchasePrice
    text += `${index + 1}. ${asset.name}\n`
    text += `   Category: ${asset.category.replace(/_/g, ' ')}\n`
    if (asset.assetNumber) text += `   Asset #: ${asset.assetNumber}\n`
    if (asset.serialNumber) text += `   Serial #: ${asset.serialNumber}\n`
    if (value) text += `   Value: $${value.toLocaleString()}\n`
    if (isCheckout && asset.returnDate) {
      text += `   Return Date: ${new Date(asset.returnDate).toLocaleDateString()}\n`
    } else if (isCheckout) {
      text += `   Return Date: No return date set\n`
    }
    if (asset.notes) text += `   Notes: ${asset.notes}\n`
    text += '\n'
  })

  if (isCheckout) {
    text += `Important Reminders:\n`
    text += `• Please handle all equipment with care\n`
    text += `• Report any damage or issues immediately\n`
    text += `• Return items by their scheduled return date\n`
    text += `• Keep this email for your records\n\n`
  }

  text += `${'='.repeat(50)}\n`
  text += `This is an automated email from the LSVR Inventory Management System.\n`
  text += `If you have any questions, please contact support@lightsailvr.com\n`
  text += `© ${new Date().getFullYear()} LightSail VR. All rights reserved.`

  return text
}