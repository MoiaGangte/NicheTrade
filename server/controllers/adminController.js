import sendOrderEmail from '../utils/sendOrderEmail.js';

export const sendTestEmail = async (req, res) => {
  try {
    const testOrder = {
      userId: { name: 'Test User', email: process.env.GMAIL_USER },
      items: [
        { product: { _id: 'test123', name: 'Test Product', offerPrice: 10 } }
      ],
      status: 'test',
      paymentType: 'TEST',
      address: { phone: '0000000000' }
    };

    // Attempt sending to admin (your email) and to user
    await sendOrderEmail(testOrder);
    await sendOrderEmail(testOrder, true);

    res.json({ success: true, message: 'Test email(s) attempted — check server logs.' });
  } catch (err) {
    console.error('Error in sendTestEmail:', err.message);
    res.json({ success: false, message: err.message });
  }
};
