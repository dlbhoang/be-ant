const User = require('../models/User');
const Profile = require('../models/Profile');
const ErrorResponse = require('../utils/ErrorResponse');
const cloudUploader = require('../utils/cloudUploader');
const clgDev = require('../utils/clgDev');
const secToDuration = require('../utils/secToDuration');
const CourseProgress = require('../models/CourseProgress');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).populate('profile').populate('courses').exec();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể truy cập được tất cả người dùng, vui lòng thử lại', 404));
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('profile').populate('courses').exec();

    if (!user) {
      return next(new ErrorResponse('Không tìm thấy người dùng như vậy', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(new ErrorResponse('Không tìm được người dùng, vui lòng thử lại', 500));
  }
};

exports.currentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('profile').populate('courses').exec();
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(new ErrorResponse('Không tìm được người dùng hiện tại, vui lòng thử lại', 500));
  }
};


exports.changeAvatar = async (req, res, next) => {
  try {
    if (!(req.files && req.files.file)) {
      return next(new ErrorResponse('Không tìm thấy hình ảnh', 400));
    }

    const avatar = req.files.file;

    if (avatar.size > process.env.AVATAR_MAX_SIZE) {
      return next(new ErrorResponse(`Vui lòng tải lên một hình ảnh nhỏ hơn ${process.env.AVATAR_MAX_SIZE / 1024} KB`, 400));
    }

    if (!avatar.mimetype.startsWith('image')) {
      return next(new ErrorResponse('Vui lòng tải lên một tập tin hình ảnh', 400));
    }

    const allowedFileType = ['jpeg', 'jpg'];
    const avatarType = avatar.mimetype.split('/')[1];

    if (!allowedFileType.includes(avatarType)) {
      return next(new ErrorResponse('Vui lòng tải lên tệp hình ảnh hợp lệ', 400));
    }

    avatar.name = `avatar_${req.user.id}_${Date.now()}.${avatarType}`;
    const img = await cloudUploader(avatar, process.env.AVATAR_FOLDER_NAME, 100, 80);
    const user = await User.findByIdAndUpdate(req.user.id, { avatar: img.secure_url }, { new: true });

    res.status(200).json({
      success: true,
      data: img.secure_url,
    });
  } catch (err) {
    console.log(err);
    next(new ErrorResponse('Không thể cập nhật ảnh hồ sơ', 404));
  }
};


exports.getEnrolledCourses = async (req, res, next) => {
  try {
    let user = await User.findById(req.user.id).populate({
      path: 'courses',
      populate: {
        path: 'sections',
        populate: {
          path: 'subSections'
        }
      }
    }).exec();

    user = user.toObject();

    for (let i = 0; i < user.courses.length; i++) {
      let totalDurationInSeconds = parseInt(user.courses[i].totalDuration);
      user.courses[i].duration = secToDuration(totalDurationInSeconds);

      let subsectionCount = 0;
      for (let j = 0; j < user.courses[i].sections.length; j++) {
        subsectionCount += user.courses[i].sections[j].subSections.length;
      }

      const courseProgress = await CourseProgress.findOne({
        courseId: user.courses[i]._id,
        userId: user._id
      });

      const courseProgressCount = courseProgress.completedVideos.length;
      let progressPercentage = 100;
      if (subsectionCount !== 0) {
        progressPercentage = Math.round((courseProgressCount / subsectionCount) * 100 * 100) / 100;
      }

      user.courses[i].progressPercentage = progressPercentage;
    }

    res.status(200).json({
      success: true,
      count: user.courses.length,
      data: user.courses,
    });
  } catch (err) {
    console.log(err)
    next(new ErrorResponse('Không thể tìm nạp tất cả các khóa học', 500));
  }
};


exports.getCreatedCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('courses').exec();

    res.status(200).json({
      success: true,
      count: user.courses.length,
      data: user.courses,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp tất cả các khóa học', 500));
  }
};

exports.getAllReviews = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('reviews').exec();

    res.status(200).json({
      success: true,
      count: user.reviews.length,
      data: user.reviews,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp tất cả bài đánh giá. Vui lòng thử lại'));
  }
};


exports.deleteCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).exec();

    await Profile.findByIdAndDelete(user.profile);

    await User.findByIdAndDelete(user._id);
    res.status(200).json({
      success: true,
      message: 'Người dùng đã xóa thành công',
    });
  } catch (err) {
    next(new ErrorResponse('Không xóa được người dùng, vui lòng thử lại', 500));
  }
};


exports.getInstructorDashboardData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate({
      path: 'courses',
      match: { status: 'Published' }
    }).exec();

    if (!user) {
      return next(new ErrorResponse('Không tìm thấy người dùng như vậy', 404));
    }

    let totalPublishedCourses = user.courses.length;
    let totalStudents = 0;
    let totalIncome = 0;


    const coursesWithStats = user.courses.map((course) => {
      let courseWithStats = {
        course,
        stats: {
          totalStudents: course.numberOfEnrolledStudents,
          totalIncome: course.price * course.numberOfEnrolledStudents
        }
      }

      totalStudents += courseWithStats.stats.totalStudents;
      totalIncome += courseWithStats.stats.totalIncome;
      return courseWithStats
    });

    res.status(200).json({
      success: true,
      data: {
        userId: user._id,
        userFirstName: user.firstName,
        totalPublishedCourses,
        totalStudents,
        totalIncome,
        coursesWithStats,
      }
    });
  } catch (err) {
    next(new ErrorResponse('Không tìm được người dùng, vui lòng thử lại', 500));
  }
};
