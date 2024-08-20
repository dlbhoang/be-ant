const Profile = require('../models/Profile');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse')
exports.updateProfile = async (req, res, next) => {
  try {
    const { gender, dob, about, contactNumber, firstName, lastName } = req.body;
    const user = await User.findById(req.user.id);

    const profile = await Profile.findByIdAndUpdate(
      user.profile,
      {
        gender,
        dob,
        about,
        contactNumber,
      },
      {
        runValidators: true,
        new: true,
      }
    );

    const updateUser = await User.findByIdAndUpdate(
      user.id,
      {
        firstName,
        lastName
      },
      {
        runValidators: true,
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updateUser,
    });
  } catch (err) {
    console.log(err);
    next(new ErrorResponse('Không thể cập nhật hồ sơ', 500));
  }
};
