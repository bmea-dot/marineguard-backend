const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const usersDB = {};   
const otpStore = {};  
const resetOtpStore = {}; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'marineguard.system@gmail.com',
    pass: 'uwfy gxkq rfgl dbmu'
  }
});

// 1. SIGNUP: Send OTP
app.post('/api/signup-otp', async (req, res) => {
  const { email, name, role, password } = req.body;

  if (!email || !name || !role || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (usersDB[email]) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = { otp: otpCode, name, role, password };

  const mailOptions = {
    from: '"MarineGuard" <marineguard.system@gmail.com>',
    to: email,
    subject: `Your MarineGuard Verification Code is ${otpCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
          .email-wrapper { width: 100%; background-color: #f4f6f9; padding: 40px 0; }
          .email-content { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border-top: 6px solid #0d47a1; }
          .header { padding: 30px 30px 15px 30px; text-align: center; background-color: #ffffff; }
          .logo-img { width: 65px; height: 65px; border-radius: 50%; border: 2px solid #e3f2fd; object-fit: cover; margin-bottom: 10px; }
          .header h1 { color: #0d47a1; font-size: 20px; margin: 0; font-weight: 700; }
          .body-content { padding: 30px; color: #37474f; font-size: 14px; line-height: 1.5; text-align: center; }
          .otp-box { background-color: #e3f2fd; border: 2px solid #0d47a1; border-radius: 8px; text-align: center; padding: 18px; margin: 25px 0; }
          .otp-code { color: #0d47a1; font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-content">
            <div class="header">
              <img src="cid:marineguardlogo" class="logo-img" alt="MarineGuard Logo">
              <h1>MarineGuard System</h1>
              <p>Role: <b>${role}</b></p>
            </div>
            <div class="body-content">
              <p>Hello <b>${name}</b>, use this verification code to complete your registration:</p>
              <div class="otp-box">
                <p class="otp-code">${otpCode}</p>
              </div>
              <p style="font-size: 12px; color: #78909c;">This code expires in 5 minutes.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'MARINEGUARD LOGO.jpg',
      path: './MARINEGUARD LOGO.jpg',
      cid: 'marineguardlogo'
    }]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Signup OTP Sent] To: ${email} | Code: ${otpCode}`);
    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

// 2. VERIFY SIGNUP
app.post('/api/verify-signup', (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email].otp === otp) {
    const { name, role, password } = otpStore[email];
    usersDB[email] = { name, role, password };
    delete otpStore[email];

    console.log(`[User Registered] ${email} as ${role}`);
    return res.status(200).json({ message: 'Account verified successfully.' });
  } else {
    return res.status(400).json({ error: 'Invalid or expired OTP code.' });
  }
});

// 3. LOGIN
app.post('/api/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!usersDB[email]) {
    return res.status(400).json({ error: 'Account not found. Please sign up first.' });
  }

  if (usersDB[email].password !== password) {
    return res.status(400).json({ error: 'Incorrect password.' });
  }

  if (usersDB[email].role !== role) {
    return res.status(400).json({ error: `Incorrect role selected. This account is registered as a ${usersDB[email].role}.` });
  }

  return res.status(200).json({ 
    message: 'Login successful.', 
    user: { email, name: usersDB[email].name, role: usersDB[email].role } 
  });
});

// 4. FORGOT PASSWORD: OTP
app.post('/api/forgot-password-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (!usersDB[email]) {
    return res.status(400).json({ error: 'Email address is not registered.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  resetOtpStore[email] = { otp: otpCode };

  const mailOptions = {
    from: '"MarineGuard" <marineguard.system@gmail.com>',
    to: email,
    subject: `Your MarineGuard Password Reset Code is ${otpCode}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
          .email-wrapper { width: 100%; background-color: #f4f6f9; padding: 40px 0; }
          .email-content { max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); border-top: 6px solid #0d47a1; }
          .header { padding: 30px 30px 15px 30px; text-align: center; background-color: #ffffff; }
          .logo-img { width: 65px; height: 65px; border-radius: 50%; border: 2px solid #e3f2fd; object-fit: cover; margin-bottom: 10px; }
          .header h1 { color: #0d47a1; font-size: 20px; margin: 0; font-weight: 700; }
          .body-content { padding: 30px; color: #37474f; font-size: 14px; line-height: 1.5; text-align: center; }
          .otp-box { background-color: #e3f2fd; border: 2px solid #0d47a1; border-radius: 8px; text-align: center; padding: 18px; margin: 25px 0; }
          .otp-code { color: #0d47a1; font-size: 32px; font-weight: 800; letter-spacing: 6px; margin: 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="email-content">
            <div class="header">
              <img src="cid:marineguardlogo" class="logo-img" alt="MarineGuard Logo">
              <h1>MarineGuard System</h1>
              <p>Password Reset Request</p>
            </div>
            <div class="body-content">
              <p>Use this verification code to reset your account password:</p>
              <div class="otp-box">
                <p class="otp-code">${otpCode}</p>
              </div>
              <p style="font-size: 12px; color: #78909c;">This code expires in 5 minutes.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'MARINEGUARD LOGO.jpg',
      path: './MARINEGUARD LOGO.jpg',
      cid: 'marineguardlogo'
    }]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Password Reset OTP Sent] To: ${email} | Code: ${otpCode}`);
    res.status(200).json({ message: 'Reset code sent successfully.' });
  } catch (error) {
    console.error('Error sending reset email:', error);
    res.status(500).json({ error: 'Failed to send reset email.' });
  }
});

// 5. RESET PASSWORD
app.post('/api/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (resetOtpStore[email] && resetOtpStore[email].otp === otp) {
    if (usersDB[email]) {
      usersDB[email].password = newPassword;
      delete resetOtpStore[email];
      console.log(`[Password Reset Success] For: ${email}`);
      return res.status(200).json({ message: 'Password reset successfully.' });
    } else {
      return res.status(400).json({ error: 'User not found.' });
    }
  } else {
    return res.status(400).json({ error: 'Invalid or expired reset code.' });
  }
});

// 6. OIL ALERT
app.post('/api/oil-alert', async (req, res) => {
  const { recipientEmail } = req.body;

  const warningMailOptions = {
    from: '"MarineGuard Alert System" <marineguard.system@gmail.com>',
    to: recipientEmail || 'marineguard.system@gmail.com',
    subject: '🚨 EMERGENCY: Oil Spill Detected at Lamao Point!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background: #ffebee; border-radius: 8px;">
        <h2 style="color: #d32f2f;">⚠️ MARINEGUARD EMERGENCY ALERT</h2>
        <p>An oil spill has been detected by system sensors at <b>Lamao Point, Limay, Bataan</b>.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(warningMailOptions);
    res.status(200).json({ message: 'Oil alert email sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send alert email.' });
  }
});

// CLOUD PORT LISTEN
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server is running on port ${PORT}`);
});
