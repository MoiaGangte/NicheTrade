import nodemailer from 'nodemailer';

const sendFeedbackEmail = async (req, res) => {
  const { feedback } = req.body;

  if (!feedback || !feedback.trim()) {
    return res.json({ success: false, message: 'Feedback is required' });
  }

  // Normalize credentials (strip surrounding quotes and trim)
  const smtpHost = process.env.SMTP_HOST ? process.env.SMTP_HOST.replace(/^['"]|['"]$/g, '').trim() : 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.replace(/^['"]|['"]$/g, '').trim()) : 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const smtpUser = (process.env.SMTP_USER || process.env.GMAIL_USER) ? (process.env.SMTP_USER || process.env.GMAIL_USER).replace(/^['"]|['"]$/g, '').trim() : undefined;
  const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD) ? (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD).replace(/^['"]|['"]$/g, '').trim() : undefined;

  if (!smtpUser || !smtpPass) {
    console.warn('SMTP credentials are missing. Skipping sendFeedbackEmail.');
    return res.json({ success: false, message: 'Email service unavailable' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Verify transporter to surface auth errors early
  try {
    await transporter.verify();
  } catch (err) {
    console.error('Failed to verify SMTP transporter.', err.message);
    return res.json({ success: false, message: 'Email service error' });
  }

  const mailOptions = {
    from: smtpUser,
    to: 'moiagangte9@gmail.com',
    subject: 'Feedback from EimiCart User',
    text: `Feedback: ${feedback}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Feedback sent successfully' });
  } catch (error) {
    console.error('Error sending feedback email:', error);
    res.json({ success: false, message: 'Failed to send feedback' });
  }
};

export { sendFeedbackEmail };