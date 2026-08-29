const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Configure Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail App Password
  },
});

// 1. Send OTP to User Email
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Generate random 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any old OTPs for this email
    await Otp.deleteMany({ email: cleanEmail });

    // Store new OTP in MongoDB
    await Otp.create({
      email: cleanEmail,
      otp: generatedOtp,
    });

    // Send email with styled layout
    await transporter.sendMail({
      from: `"AK SPORTS" <${process.env.EMAIL_USER}>`,
      to: cleanEmail,
      subject: `${generatedOtp} is your AK SPORTS Verification Code`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
          <h2 style="color: #0F172A; text-align: center; margin-bottom: 8px;">AK SPORTS</h2>
          <p style="color: #64748B; text-align: center; font-size: 14px; margin-top: 0;">Account Verification</p>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
          <p style="color: #334155; font-size: 15px; line-height: 22px;">Hello,</p>
          <p style="color: #334155; font-size: 15px; line-height: 22px;">Use the following 6-digit code to verify your official organizer account:</p>
          <div style="text-align: center; margin: 28px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0F172A; background-color: #F8FAFC; padding: 12px 24px; border-radius: 8px; border: 1px dashed #059669;">
              ${generatedOtp}
            </span>
          </div>
          <p style="color: #64748B; font-size: 13px; text-align: center;">This code will expire in 5 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Nodemailer Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send email. Check your SMTP settings.' });
  }
};

// 2. Verify OTP & Register New Account
const verifyOtpAndRegister = async (req, res) => {
  try {
    const { fullName, email, phone, password, role, otp } = req.body;

    if (!fullName || !email || !phone || !password || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields including the OTP.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify OTP against MongoDB
    const otpRecord = await Otp.findOne({ email: cleanEmail, otp: otp.trim() });
    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    // Verify double creation prevention
    const userExists = await User.findOne({ email: cleanEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Account already exists.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: role || 'ORGANIZER',
    });

    // Delete verified OTP record
    await Otp.deleteMany({ email: cleanEmail });

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Existing Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { sendOtp, verifyOtpAndRegister, loginUser };