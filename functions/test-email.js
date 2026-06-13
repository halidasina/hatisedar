const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Hati Sedar" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: 'Test Email - Hati Sedar',
      html: '<p>Test email berjaya dihantar!</p>',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent!',
        gmail_user: process.env.GMAIL_USER || 'NOT SET',
        gmail_pass: process.env.GMAIL_APP_PASSWORD ? 'SET (' + process.env.GMAIL_APP_PASSWORD.length + ' chars)' : 'NOT SET',
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: err.message,
        gmail_user: process.env.GMAIL_USER || 'NOT SET',
        gmail_pass: process.env.GMAIL_APP_PASSWORD ? 'SET (' + process.env.GMAIL_APP_PASSWORD.length + ' chars)' : 'NOT SET',
      }),
    };
  }
};
