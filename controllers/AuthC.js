const OTP = require('../models/OTP');
const User = require('../models/User');
const Profile = require('../models/Profile');
const ErrorResponse = require('../utils/ErrorResponse');
const bcrypt = require('bcrypt');
const otpGenerator = require('otp-generator');
const emailSender = require('../utils/emailSender');
const passwordUpdateTemplate = require('../mail/templates/passwordUpdateTemplate');
const crypto = require('crypto');
const clgDev = require('../utils/clgDev');
const jwt = require('jsonwebtoken');
const accountCreationTemplate = require('../mail/templates/accountCreationTemplate');
const adminCreatedTemplate = require('../mail/templates/adminCreatedTemplate');

// @desc      Send OTP for email verification
// @route     POST /api/v1/auth/sendotp
// @access    Public // VERIFIED
exports.sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if user is already present
    if (await User.findOne({ email })) {
      return next(new ErrorResponse('Người dùng đã được đăng ký', 401));
    }

    // Generate OTP which is not present in database
    const options = {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    };
    let otp = '';
    let user;

    do {
      otp = otpGenerator.generate(6, options);
      user = await OTP.findOne({ otp });
    } while (user);

    // Create OTP
    const otpObj = await OTP.create({ email, otp });

    res.status(200).json({
      success: true,
      data: 'OTP đã được gửi thành công',
    });
  } catch (err) {
    next(new ErrorResponse('Không gửi được otp. Vui lòng thử lại', 500));
  }
};

// @desc      SignUp a user
// @route     POST /api/v1/auth/signup
// @access    Public // VERIFIED
exports.signup = async (req, res, next) => {
  try {
    let { firstName, lastName, email, password, role, contactNumber, otp } = req.body;

    role = role.charAt(0).toUpperCase() + role.slice(1);

    if (!(firstName && lastName && email && password && role && otp)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 403));
    }

    // Find the most recent OTP for the email
    const recentOtp = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (recentOtp.length === 0 || otp !== recentOtp[0].otp) {
      // OTP not found or Database Otp not match with given otp for this email'
      return next(new ErrorResponse('OTP không hợp lệ. Vui lòng thử lại.', 400));
    }

    // check if user already exists
    if (await User.findOne({ email })) {
      return next(new ErrorResponse('Người dùng đã tồn tại. Vui lòng đăng nhập để tiếp tục', 400));
    }

    // check if role is not admin
    if (role === 'Admin') {
      return next(new ErrorResponse('Người dùng không được ủy quyền', 403));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // LATER  - what is approved
    let approved = role === 'Instructor' ? false : true;

    const profile = await Profile.create({});

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      approved,
      profile: profile._id,
      avatar: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
    });

    // send a notification to user for account creation
    await emailSender(email, `Tài khoản được tạo thành công cho ${firstName} ${lastName}`, accountCreationTemplate(firstName + ' ' + lastName));

    sendTokenResponse(res, user, 201);
  } catch (err) {
    next(new ErrorResponse('Failed to signUp user. Please try again', 500));
  }
};

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public  // VERIFIED
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Vui lòng điền email và mật khẩu', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new ErrorResponse('Thông tin xác thực không hợp lệ', 400));
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return next(new ErrorResponse('Thông tin xác thực không hợp lệ', 400));
    }

    sendTokenResponse(res, user, 200);
  } catch (err) {
    next(new ErrorResponse('Đăng nhập không thành công. Vui lòng thử lại', 500));
  }
};

// @desc      Logout current user / cleat cookie
// @route     POST /api/v1/auth/logout
// @access    Private  // VERIFIED
exports.logOut = async (req, res, next) => {
  try {
    res
      .cookie('token', 'none', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
      })
      .status(200)
      .json({
        success: true,
        data: {},
      });
  } catch (err) {
    next(new ErrorResponse('Không đăng xuất được. Vui lòng thử lại', 500));
  }
};
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(new ErrorResponse('Không tìm nạp được thông tin chi tiết về người dùng hiện tại. Vui lòng thử lại', 500));
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).select('+password');
    const { oldPassword, newPassword } = req.body;

    if (!(await bcrypt.compare(oldPassword, user.password))) {
      return next(new ErrorResponse('Mật khẩu không đúng', 401));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user = await User.findByIdAndUpdate(user._id, { password: hashedPassword }, { new: true });

    try {
      const response = await emailSender(user.email, `Đã cập nhật mật khẩu thành công cho ${user.firstName} ${user.lastName}`, passwordUpdateTemplate(user.email, `${user.firstName} ${user.lastName}`));
    } catch (err) {
      return next(new ErrorResponse('Đã xảy ra lỗi khi gửi email', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật mật khẩu thành công',
    });
  } catch (err) {
    next(new ErrorResponse('Không thể thay đổi mật khẩu. Vui lòng thử lại', 500));
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      return next(new ErrorResponse('Không tìm thấy email. Vui lòng nhập email hợp lệ', 400));
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user = await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: Date.now() + 10 * 60 * 1000,
      },
      { new: true }
    );

    const resetUrl = `${process.env.STUDY_NOTION_FRONTEND_SITE}/reset-password?reset-token=${resetToken}`;

    try {
      const response = await emailSender(
        user.email,
        `Đặt lại mật khẩu cho ${user.firstName} ${user.lastName}`,
        `Bạn nhận được email này vì bạn (hoặc người khác) đã yêu cầu đặt lại mật khẩu tài khoản Ant&Create của bạn. 
        Vui lòng nhấp vào bên dưới để đặt lại mật khẩu của bạn: \n\n ${resetUrl}
        `
      );
    } catch (err) {
      return next(new ErrorResponse('Không gửi được email đặt lại. Vui lòng thử lại', 500));
    }

    res.status(200).json({
      success: true,
      data: 'Đặt lại email đã gửi thành công. Vui lòng kiểm tra email của bạn để đặt lại mật khẩu',
    });
  } catch (err) {
    next(new ErrorResponse('Không gửi được email đặt lại mật khẩu. Vui lòng thử lại', 500));
  }
};
exports.resetPassword = async (req, res, next) => {
  try {
    const { password, resetToken } = req.body;
    if (!(password && resetToken)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    let user = await User.findOne({
      resetPasswordToken,
    });

    if (!user) {
      return next(new ErrorResponse('Yêu cầu không hợp lệ', 404));
    }

    if (Date.now() > user.resetPasswordExpire) {
      return next(new ErrorResponse('Mã thông báo đã hết hạn. Vui lòng tạo lại mã thông báo của bạn', 404));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.findByIdAndUpdate(
      user._id,
      {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      },
      { new: true }
    );

    // send mail to user for reset password
    try {
      const response = await emailSender(
        user.email,
        `Mật khẩu đã được đặt lại thành công cho ${user.firstName} ${user.lastName}`,
        `Mật khẩu của bạn đã được đặt lại thành công. Cảm ơn vì đã ở bên chúng tôi.
        Để truy cập trang web của chúng tôi: ${process.env.STUDY_NOTION_FRONTEND_SITE}
        `
      );
    } catch (err) {
      return next(new ErrorResponse('Không gửi được email đặt lại thành công. Vui lòng thử lại', 500));
    }

    sendTokenResponse(res, user, 200);
  } catch (err) {
    next(new ErrorResponse('Không thể đặt lại mật khẩu. Vui lòng thử lại', 500));
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, contactNumber } = req.body;
    const role = 'Admin';

    if (!(firstName && lastName && email && password && role && contactNumber)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 403));
    }

    if (await User.findOne({ email })) {
      return next(new ErrorResponse('Người dùng đã tồn tại. Vui lòng đăng nhập để tiếp tục', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // LATER  - what is approved
    let approved = role === 'Instructor' ? false : true;

    const profile = await Profile.create({ contactNumber });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      approved,
      profile: profile._id,
      avatar: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName}%20${lastName}`,
    });

    await emailSender(email, `Tài khoản quản trị viên được tạo thành công cho${firstName} ${lastName}`, adminCreatedTemplate(firstName + ' ' + lastName));

    res.status(201).json({
      success: true,
      data: 'Tài khoản quản trị viên được tạo thành công',
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được quản trị viên, vui lòng thử lại', 500));
  }
};

const sendTokenResponse = (res, user, statusCode) => {
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.cookie('token', token, options).status(statusCode).json({
    success: true,
    user,
    token,
  });
};
