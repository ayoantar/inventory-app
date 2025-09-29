const nodemailer = require('nodemailer').default || require('nodemailer');
require('dotenv').config({ path: '.env.production' });

async function testSMTP() {
  console.log('\n🔧 Testing SMTP Configuration...\n');
  console.log('SMTP_HOST:', process.env.SMTP_HOST);
  console.log('SMTP_PORT:', process.env.SMTP_PORT);
  console.log('SMTP_USER:', process.env.SMTP_USER);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '****' + process.env.SMTP_PASSWORD.slice(-4) : 'NOT SET');
  console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
  console.log('\n-----------------------------------\n');

  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true // Enable logging
  });

  try {
    console.log('🔍 Verifying SMTP connection...\n');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!\n');

    console.log('📧 Sending test email...\n');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'LSVR Warehouse <warehouse@lightsailvr.com>',
      to: 'admin@lsvr.com', // Change this to your email
      subject: 'SMTP Test - LSVR Warehouse',
      text: 'This is a test email from LSVR Warehouse system.',
      html: '<h1>Test Email</h1><p>This is a test email from LSVR Warehouse system.</p>'
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);

  } catch (error) {
    console.error('\n❌ SMTP Test Failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('Username and Password not accepted')) {
      console.error('\n📝 Authentication Issue Detected!\n');
      console.error('For Gmail, you need to:');
      console.error('1. Enable 2-Factor Authentication on your Google Account');
      console.error('2. Generate an App Password:');
      console.error('   - Go to: https://myaccount.google.com/apppasswords');
      console.error('   - Select "Mail" and generate a password');
      console.error('   - Use this 16-character password in SMTP_PASSWORD');
      console.error('\nCurrent user:', process.env.SMTP_USER);
    }
  }
}

testSMTP();