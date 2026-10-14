const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// I-allow ang lahat ng request galing sa Firebase at localhost
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const usersDB = {};   
const otpStore = {};  
const resetOtpStore = {}; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'marineguard.system@gmail.com',
    pass: 'cfqh bfhp lcug bgti'
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
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border-top: 6px solid #0d47a1;">
          <h1 style="color: #0d47a1; text-align: center; margin-bottom: 5px;">MarineGuard System</h1>
          <p style="text-align: center; color: #555;">Role: <b>${role}</b></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Hello <b>${name}</b>,</p>
          <p>Use this verification code to complete your registration:</p>
          <div style="background-color: #e3f2fd; border: 2px solid #0d47a1; border-radius: 8px; text-align: center; padding: 15px; margin: 20px 0;">
            <span style="color: #0d47a1; font-size: 32px; font-weight: bold; letter-spacing: 5px; font-family: monospace;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #888; text-align: center;">This code will expire in 5 minutes.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Signup OTP Sent] To: ${email} | Code: ${otpCode}`);
    return res.status(200).json({ message: 'OTP sent successfully to your email.' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email. Check Nodemailer configuration.' });
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
    return res.status(400).json({ error: `Incorrect role selected. Account registered as ${usersDB[email].role}.` });
  }

  return res.status(200).json({ 
    message: 'Login successful.', 
    user: { email, name: usersDB[email].name, role: usersDB[email].role } 
  });
});

// 4. FORGOT PASSWORD OTP
app.post('/api/forgot-password-otp', async (req, res) => {
  const { email } = req.body;

  if (!email || !usersDB[email]) {
    return res.status(400).json({ error: 'Email address is not registered.' });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  resetOtpStore[email] = { otp: otpCode };

  const mailOptions = {
    from: '"MarineGuard" <marineguard.system@gmail.com>',
    to: email,
    subject: `Your MarineGuard Password Reset Code is ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f9;">
        <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; border-top: 6px solid #0d47a1;">
          <h1 style="color: #0d47a1; text-align: center;">Password Reset Request</h1>
          <p>Use this code to reset your account password:</p>
          <div style="background-color: #e3f2fd; border: 2px solid #0d47a1; border-radius: 8px; text-align: center; padding: 15px; margin: 20px 0;">
            <span style="color: #0d47a1; font-size: 32px; font-weight: bold; letter-spacing: 5px; font-family: monospace;">${otpCode}</span>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Reset code sent successfully.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send reset email.' });
  }
});

// 5. RESET PASSWORD
app.post('/api/reset-password', (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (resetOtpStore[email] && resetOtpStore[email].otp === otp) {
    if (usersDB[email]) {
      usersDB[email].password = newPassword;
      delete resetOtpStore[email];
      return res.status(200).json({ message: 'Password reset successfully.' });
    }
  }
  return res.status(400).json({ error: 'Invalid or expired reset code.' });
});

// 6. EMERGENCY OIL ALERT
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server is running on port ${PORT}`);
});
