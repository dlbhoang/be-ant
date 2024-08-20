const mongoose = require('mongoose');
const clgDev = require('../utils/clgDev');
const emailSender = require('../utils/emailSender');
const emailOtpTemplate = require('../mail/templates/emailOtpTemplate');

const OTPSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '10m',
  },
});

const sendOtpEmail = async (toEmail, otp) => {
  try {
    const mailResponse = await emailSender(toEmail, 'Email xác minh từ Ant&Create', emailOtpTemplate(otp));
  } catch (err) {
    clgDev(`Đã xảy ra lỗi khi gửi otp : ${err.message}`);
    throw err;
  }
};

OTPSchema.post('save', async function (doc) {
  await sendOtpEmail(this.email, this.otp);
});

module.exports = mongoose.model('OTP', OTPSchema);
