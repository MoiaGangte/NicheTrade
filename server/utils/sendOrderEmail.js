import nodemailer from 'nodemailer';

const sendOrderEmail = async (orderDetails, toUser = false) => {
  const user = orderDetails.userId;
  const product = orderDetails.items?.[0]?.product;

  // Normalize credentials (strip surrounding quotes and trim)
  const gmailUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.replace(/^['"]|['"]$/g, '').trim() : undefined;
  const gmailPass = process.env.GMAIL_APP_PASSWORD ? process.env.GMAIL_APP_PASSWORD.replace(/^['"]|['"]$/g, '').trim() : undefined;

  if (!gmailUser || !gmailPass) {
    console.warn('Gmail credentials are missing. Skipping sendOrderEmail.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });

  // Verify transporter to surface auth errors early
  try {
    await transporter.verify();
  } catch (err) {
    console.error('Failed to verify Gmail transporter. Check GMAIL_USER and GMAIL_APP_PASSWORD (use an App Password if 2FA is enabled).', err.message);
    return;
  }

  let mailOptions;

  if (toUser) {
    // Email to user: only product id, name, price, status, payment type, and a thank you text
    mailOptions = {
      from: gmailUser,
      to: user?.email,
      subject: 'Your Order Confirmation',
      text: `
Thank you for your order|(Your Order will be Delivered after 2-3 days), ${user?.name || 'Customer'}!

Order Details:
Product ID: ${product?._id || 'N/A'}
Product Name: ${product?.name || 'N/A'}
Price: ₹${product?.offerPrice || 'N/A'}
Order Status: ${orderDetails.status || 'N/A'}
Payment Type: ${orderDetails.paymentType || 'N/A'}

We appreciate your purchase!
      `,
    };
  } else {
    // Email to admin (yourself): full order details
    mailOptions = {
      from: gmailUser,
      to: gmailUser,
      subject: 'New Order Received',
      text: `
New Order Details:

User Name: ${user?.name || 'N/A'}
User Email: ${user?.email || 'N/A'}
User Phone: ${orderDetails.address?.phone || 'N/A'}
Product Name: ${product?.name || 'N/A'}

Full Order JSON:
${JSON.stringify(orderDetails, null, 2)}
      `,
    };
  }

  // If sending to user but user email is missing, skip and log
  if (toUser && !mailOptions.to) {
    console.warn('Skipping user order email: recipient email missing', { orderId: orderDetails._id });
    return;
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Order email sent:', { messageId: info.messageId, to: mailOptions.to });
  } catch (err) {
    console.error('Error sending order email:', err);
    // Do not throw to avoid blocking order processing; log for investigation
  }
};

export default sendOrderEmail;