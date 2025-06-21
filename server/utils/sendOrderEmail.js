import nodemailer from 'nodemailer';

const sendOrderEmail = async (orderDetails, toUser = false) => {
  const user = orderDetails.userId;
  const product = orderDetails.items?.[0]?.product;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  let mailOptions;

  if (toUser) {
    // Email to user: only product id, name, price, status, payment type, and a thank you text
    mailOptions = {
      from: process.env.GMAIL_USER,
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
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: 'New Order Received',
      text: `
New Order Details:

User Name: ${user?.name || 'N/A'}
User Email: ${user?.email || 'N/A'}
User Phone: ${user?.phone || 'N/A'}
Product Name: ${product?.name || 'N/A'}

Full Order JSON:
${JSON.stringify(orderDetails, null, 2)}
      `,
    };
  }

  await transporter.sendMail(mailOptions);
};

export default sendOrderEmail;