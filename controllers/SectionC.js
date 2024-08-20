const Section = require('../models/Section');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/ErrorResponse');
const clgDev = require('../utils/clgDev');

exports.createSection = async (req, res, next) => {
  try {
    const { title, courseId } = req.body;

    if (!(title && courseId)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    const courseDetails = await Course.findById(courseId);
    if (!courseDetails) {
      return next(new ErrorResponse('Không tìm thấy khóa học như vậy', 404));
    }

    if (req.user.id !== courseDetails.instructor.toString()) {
      return next(new ErrorResponse('Người dùng không được ủy quyền', 404));
    }

    const section = await Section.create({
      title,
      course: courseDetails._id,
      user: req.user.id
    });

    // update course
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: { sections: section._id },
      },
      { new: true }
    ).populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections'
        },
      })
      .exec();

    res.status(201).json({
      success: true,
      data: updatedCourse,
    });
  } catch (err) {
    next(new ErrorResponse('Không tạo được phần. Vui lòng thử lại', 500));
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const { sectionId, title } = req.body;

    if (!(sectionId && title)) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return next(new ErrorResponse('Không tìm thấy phần như vậy', 404));
    }

    if (section.user.toString() !== instructorId) {
      return next(new ErrorResponse('Truy cập trái phép', 401));
    }


    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { title },
      {
        runValidators: true,
        new: true,
      }
    );


    const updatedCourse = await Course.findByIdAndUpdate(
      section.course,
    ).populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections'
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      data: updatedCourse,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể cập nhật phần này. Vui lòng thử lại', 500));
  }
};

exports.deleteSection = async (req, res, next) => {
  try {
    const instructorId = req.user.id;
    const { sectionId } = req.body;

    if (!sectionId) {
      return next(new ErrorResponse('Một số trường bị thiếu', 404));
    }

    const section = await Section.findById(sectionId);
    if (!section) {
      return next(new ErrorResponse('Không tìm thấy phần như vậy', 404));
    }

    if (section.user.toString() !== instructorId) {
      return next(new ErrorResponse('Truy cập trái phép', 401));
    }

    if (section.user.toString() !== req.user.id) {
      return next(new ErrorResponse('Người dùng không được phép thực hiện tác vụ này', 404));
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      section.course,
      {
        $pull: { sections: section._id },
      },
      { new: true }
    ).populate('category')
      .populate('reviews')
      .populate({
        path: 'sections',
        populate: {
          path: 'subSections'
        },
      })
      .exec();

    await section.deleteOne();

    res.status(200).json({
      success: true,
      data: updatedCourse,
    });
  } catch (err) {
    next(new ErrorResponse('Không thể xóa phần. Vui lòng thử lại', 500));
  }
};
