const mongoose = require('mongoose');
const CourseProgress = require('../models/CourseProgress');
const SubSection = require('../models/SubSection');

exports.markSubSectionAsCompleted = async (req, res, next) => {
  try {
    const { courseId, subSectionId } = req.body;
    const userId = req.user.id;

    if (!(courseId && subSectionId)) {
      return next(new Error('Yêu cầu không hợp lệ', 404));
    }

    const subsection = await SubSection.findById(subSectionId);
    if (!subsection) {
      return next(new ErrorResponse('Không tìm thấy bài giảng như vậy', 404));
    }

    const courseProgress = await CourseProgress.findOneAndUpdate(
      {
        userId,
        courseId,
      },
      { $push: { completedVideos: subSectionId } },
      { new: true }
    );

    if (!courseProgress) {
      return next(new ErrorResponse('Không tìm thấy tiến trình khóa học như vậy', 404));
    }

    return res.status(200).json({
      success: true,
      data: {
        completedVideos: courseProgress.completedVideos,
      }
    });
  } catch (err) {
    next(new ErrorResponse('Không thể tìm nạp dữ liệu khóa học đã đăng ký', 500));
  }
};
