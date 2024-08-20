const clgDev = require('../utils/clgDev');
const ErrorResponse = require('../utils/ErrorResponse');
const emailSender = require('../utils/emailSender');
const { contactUsEmail } = require('../mail/templates/contactFormRes');

exports.contactUs = async (req, res, next) => {
  try {
    const { firstName, lastName, email, countryCode, phoneNo, message } = req.body;

    if (!(firstName && lastName && email && countryCode && phoneNo && message)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 400));
    }

    try {
      const mailResponse1 = await emailSender(
        process.env.SITE_OWNER_EMAIL,
        `Liên hệ với tôi - ${message.substring(0, 10)} ...`,
        `
      <h1>Ai đó đã yêu cầu liên hệ với bạn</h1>
      <h2>Chi tiết liên hệ</h2>
      <h1></h1>
      <p> Tên : ${firstName} ${lastName}</p>
      <p> Email : ${email}</p>
      <p> Số điện thoại : ${countryCode} ${phoneNo}</p>
      <p> Tin nhắn : ${message}</p>
      <h1></h1>
      <h2>Vui lòng liên hệ với họ và giải quyết vấn đề của họ càng sớm càng tốt</h2>
      <h1>Cảm ơn !</h1>
      `
      );

      const mailResponse2 = await emailSender(email, 'Dữ liệu của bạn được gửi cho chúng tôi thành công', contactUsEmail(email, firstName, lastName, message, phoneNo, countryCode));

      return res.json({
        success: true,
        data: 'Thông tin chi tiết được gửi thành công',
      });
    } catch (err) {
      return next(new ErrorResponse('Đã xảy ra lỗi khi gửi email', 500));
    }
  } catch (err) {
    next(new ErrorResponse('Chi tiết gửi không thành công', 500));
  }
};
