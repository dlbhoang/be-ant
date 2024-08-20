const Review = require('../models/Review');
const Course = require('../models/Course');
const User = require('../models/User');
const ErrorResponse = require('../utils/ErrorResponse');

exports.getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .sort({ rating: 'desc' })
      .populate({
        path: 'user',
        select: 'firstName lastName email avatar',
      })
      .populate({
        path: 'course',
        select: 'title _id',
      })
      .exec();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp tất cả bài đánh giá', 500));
  }
};

exports.getReview = async (req, res, next) => {
  try {
    const { reviewId } = req.body;

    if (!reviewId) {
      return next(new ErrorResponse('Yêu cầu không hợp lệ', 404));
    }

    const review = await Review.findById(reviewId)
      .populate({
        path: 'user',
        select: 'firstName lastName email avatar',
      })
      .populate({
        path: 'course',
        select: 'title _id',
      });

    if (!review) {
      return next(new ErrorResponse('Không tìm thấy đánh giá như vậy', 404));
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (err) {
    next(new ErrorResponse('Không tìm nạp được bài đánh giá. Vui lòng thử lại'));
  }
};


exports.getReviewsOfCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return next(new ErrorResponse("Invalid request", 404));
    }

    const course = await Course.findById(courseId).populate({
      path: 'reviews',
      populate: {
        path: 'user',
        select: 'firstName lastName email avatar',
      },
    }).populate({
      path: 'reviews',
      populate: {
        path: 'course',
        select: 'title _id',
      },
    });

    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    return res.status(200).json({
      success: true,
      count: course.reviews.length,
      data: course.reviews,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp Bài đánh giá. Vui lòng thử lại', 500));
  }
};

exports.createReview = async (req, res, next) => {
  try {
    const { review, rating, courseId } = req.body;
    const userId = req.user.id;
    if (!(review && rating && courseId)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    // Check if user is enrolled or not
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (!course.studentsEnrolled.includes(userId)) {
      return next(new ErrorResponse('Học viên không đăng ký khóa học', 404));
    }

    const alreadyReviewed = await Review.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return next(new ErrorResponse('Khóa học đã được sinh viên xem xét', 404));
    }

    const reviewDetails = await Review.create({
      review,
      rating,
      course: courseId,
      user: userId,
    });

    await User.findByIdAndUpdate(
      userId,
      {
        $push: { reviews: reviewDetails._id },
      },
      { new: true }
    );

    await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { reviews: reviewDetails._id },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: reviewDetails,
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được bài đánh giá. Vui lòng thử lại', 500));
  }
};


exports.deleteReview = async (req, res, next) => {
  try {
    const reviewId = req.body;
    if (!reviewId) {
      return next(new ErrorResponse('Yêu cầu không hợp lệ', 404));
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return next(new ErrorResponse('Không tìm thấy đánh giá như vậy', 404));
    }
    if (review.user.toString() !== req.user.id && req.user.role !== 'Admin') {
      return next(new ErrorResponse('Không được ủy quyền cho nhiệm vụ này', 404));
    }

    await User.findByIdAndUpdate(
      review.user,
      {
        $pull: { reviews: review._id },
      },
      { new: true }
    );

    await Course.findByIdAndUpdate(
      review.course,
      {
        $pull: { reviews: review._id },
      },
      { new: true }
    );

    await review.deleteOne();

    res.status(200).json({
      success: true,
      data: 'Đã xóa đánh giá thành công',
    });
  } catch (err) {
    next(new ErrorResponse('Không thể xóa bài đánh giá. Vui lòng thử lại'));
  }
};
